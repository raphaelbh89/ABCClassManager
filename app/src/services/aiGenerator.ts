// src/services/aiGenerator.ts
// Pipeline sinh câu hỏi AI theo modulesupdate.md:
// Phân rã chủ đề → Prompt Builder (chống trùng) → LLM JSON Schema + fallback đa provider
// → Vòng thẩm định → Sinh dư 30% → Dedup embedding → Bù câu thiếu
// Cuối cùng giữ Bộ phát sinh Offline làm đáy dự phòng.

export interface AIGenerateParams {
  topic: string
  subject: string
  count: number
  question_type: 'mcq' | 'true_false' | 'all'
  grade?: number
  provider?: 'gemini' | 'openai' | 'groq' | 'custom'
  apiKey?: string
  customBaseUrl?: string
  customModel?: string
  /** Key dự phòng cho chuỗi fallback */
  groqApiKey?: string
  openrouterApiKey?: string
  /** Bật/tắt vòng thẩm định (mặc định theo PIPELINE_CONFIG) */
  enableVerification?: boolean
  /** Câu hỏi đã có trong ngân hàng (cùng môn học) để chống trùng lớp in-prompt */
  existingQuestions?: string[]
  /** Vector embedding của câu hỏi đã có (song song existingQuestions) — dùng cho dedup similarity */
  existingEmbeddings?: number[][]
}

export interface GeneratedQuestion {
  id: string
  subject: string
  topic?: string
  subtopic?: string | null
  content: string
  question_type: 'mcq' | 'true_false'
  options: Array<{ label: string; text: string }>
  correct_answer: string
  explanation?: string | null
  difficulty?: 'easy' | 'medium' | 'hard' | null
  embedding?: number[] | null
  duration_seconds: number
  source_provider?: string
}

export interface AIGenerateResult {
  questions: GeneratedQuestion[]
  usedProvider: string
  isAiGenerated: boolean
  providerName: string
  /** Số liệu phục vụ UI cảnh báo */
  requestedCount: number
  generatedRawCount: number
  duplicatesRemoved: number
  verificationUsed: boolean
  decomposedSubtopics: string[]
}

// ─── Cấu hình pipeline ───
export const PIPELINE_CONFIG = {
  DEDUP_SIMILARITY_THRESHOLD: 0.9,
  GENERATION_BUFFER_RATIO: 1.3,
  ENABLE_VERIFICATION_PASS: true,
  EMBEDDING_MODEL: 'text-embedding-004',
}

const LABELS = ['A', 'B', 'C', 'D']

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ════════════════════════════════════════════════════════════════════
// CHUỖI PROVIDER (Gemini → Groq → OpenRouter → Custom) với backoff 429
// ════════════════════════════════════════════════════════════════════
interface ChainEntry {
  id: string
  label: string
  call: (prompt: string, jsonSchema?: object) => Promise<string>
}

/** Backoff cho lỗi 429 / 5xx: chờ 1s, 2s, 4s — tối đa 3 lần trước khi bỏ */
async function fetchWithBackoff(url: string, init: RequestInit, retries = 3): Promise<Response> {
  let lastResponse: Response | null = null
  let lastError: any = null
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, init)
      if (res.status === 429 || res.status >= 500) {
        lastResponse = res
        await sleep(1000 * Math.pow(2, attempt))
        continue
      }
      return res
    } catch (err) {
      lastError = err
      await sleep(1000 * Math.pow(2, attempt))
    }
  }
  if (lastResponse) return lastResponse
  throw lastError || new Error('Network error')
}

function buildProviderChain(params: AIGenerateParams): ChainEntry[] {
  const {
    provider = 'gemini', apiKey = '', customBaseUrl = '', customModel = '',
    groqApiKey = '', openrouterApiKey = '',
  } = params
  const cleanKey = apiKey.trim()
  const cleanGroq = groqApiKey.trim()
  const cleanOR = openrouterApiKey.trim()

  const entries: ChainEntry[] = []

  if (cleanKey.length > 5) {
    entries.push({
      id: 'gemini',
      label: 'Google Gemini',
      call: async (prompt, jsonSchema) => {
        // Chuẩn model của dự án (AGENTS.md): ưu tiên 3.5/3.7 flash, không dùng 1.5/pro cũ
        const modelsToTry = [
          { version: 'v1beta', model: 'gemini-3.5-flash' },
          { version: 'v1beta', model: 'gemini-3.7-flash' },
          { version: 'v1beta', model: 'gemini-flash-latest' },
        ]
        let lastError = ''
        for (const item of modelsToTry) {
          try {
            const url = `https://generativelanguage.googleapis.com/${item.version}/models/${item.model}:generateContent?key=${cleanKey}`
            const res = await fetchWithBackoff(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.75,
                  responseMimeType: 'application/json',
                  ...(jsonSchema ? { responseSchema: jsonSchema } : {}),
                },
              }),
            })
            if (!res.ok) {
              lastError = `[${item.model}] HTTP ${res.status}: ${await res.text()}`
              continue
            }
            const data = await res.json()
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          } catch (e: any) {
            lastError = e.message
          }
        }
        throw new Error(`Gemini lỗi: ${lastError}`)
      },
    })
  }

  if (cleanGroq.length > 5) {
    entries.push({
      id: 'groq',
      label: 'Groq (Llama 3.3 70B)',
      call: async (prompt, jsonSchema) => {
        const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']
        let lastError = ''
        for (const m of models) {
          try {
            const res = await fetchWithBackoff('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cleanGroq}` },
              body: JSON.stringify({
                model: m,
                messages: [
                  { role: 'system', content: jsonSchema ? `Trả lời CHỈ bằng JSON đúng theo schema: ${JSON.stringify(jsonSchema)}` : 'Bạn là chuyên gia soạn đề. Trả lời chỉ bằng JSON.' },
                  { role: 'user', content: prompt },
                ],
                temperature: 0.75,
                response_format: { type: 'json_object' },
              }),
            })
            if (!res.ok) { lastError = `[${m}] HTTP ${res.status}`; continue }
            const data = await res.json()
            return data?.choices?.[0]?.message?.content || ''
          } catch (e: any) { lastError = e.message }
        }
        throw new Error(`Groq lỗi: ${lastError}`)
      },
    })
  }

  if (cleanOR.length > 5) {
    entries.push({
      id: 'openrouter',
      label: 'OpenRouter',
      call: async (prompt, jsonSchema) => {
        const model = customModel?.trim() || 'meta-llama/llama-3.3-70b-instruct'
        const res = await fetchWithBackoff('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cleanOR}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: jsonSchema ? `Trả lời CHỈ bằng JSON đúng theo schema: ${JSON.stringify(jsonSchema)}` : 'Bạn là chuyên gia soạn đề. Trả lời chỉ bằng JSON.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.75,
          }),
        })
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`)
        const data = await res.json()
        return data?.choices?.[0]?.message?.content || ''
      },
    })
  }

  if (provider === 'custom' && cleanKey.length > 5) {
    const baseUrl = (customBaseUrl || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
    const model = customModel || 'deepseek-chat'
    entries.push({
      id: 'custom',
      label: `Custom AI (${model})`,
      call: async (prompt, jsonSchema) => {
        const res = await fetchWithBackoff(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cleanKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: jsonSchema ? `Trả lời CHỈ bằng JSON đúng theo schema: ${JSON.stringify(jsonSchema)}` : 'Bạn là chuyên gia soạn đề. Trả lời chỉ bằng JSON.' },
              { role: 'user', content: prompt },
            ],
            temperature: 0.75,
          }),
        })
        if (!res.ok) throw new Error(`Custom HTTP ${res.status}`)
        const data = await res.json()
        return data?.choices?.[0]?.message?.content || ''
      },
    })
  }

  // Provider người dùng chọn đứng đầu chuỗi (nếu có trong chuỗi)
  if (entries.length > 1) {
    const idx = entries.findIndex(e => e.id === provider)
    if (idx > 0) {
      const [chosen] = entries.splice(idx, 1)
      entries.unshift(chosen)
    }
  }

  return entries
}

// ════════════════════════════════════════════════════════════════════
// PROMPT BUILDER + SCHEMA + PHÂN RÃ CHỦ ĐỀ
// ════════════════════════════════════════════════════════════════════
function buildQuestionSchema(qType: 'mcq' | 'true_false'): object {
  const optionConstraints = qType === 'true_false'
    ? { type: 'ARRAY', items: { type: 'STRING' }, minItems: 2, maxItems: 2 }
    : { type: 'ARRAY', items: { type: 'STRING' }, minItems: 4, maxItems: 4 }

  return {
    type: 'OBJECT',
    properties: {
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            content: { type: 'STRING' },
            options: optionConstraints,
            correct_index: { type: 'INTEGER' },
            explanation: { type: 'STRING' },
            difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] },
            subtopic: { type: 'STRING' },
          },
          required: ['content', 'options', 'correct_index', 'explanation', 'difficulty', 'subtopic'],
        },
      },
    },
    required: ['questions'],
  }
}

function buildGenerationPrompt(opts: {
  subject: string
  topic: string
  totalCount: number
  distribution: string
  qType: 'mcq' | 'true_false'
  existingContext: string[]
}): string {
  const { subject, topic, totalCount, distribution, qType, existingContext } = opts
  const typeLabel = qType === 'true_false'
    ? 'Đúng/Sai (options là ["TRUE (Đúng / Thẻ Xanh)", "FALSE (Sai / Thẻ Đỏ)"], correct_index 0 = Đúng, 1 = Sai)'
    : 'trắc nghiệm 4 lựa chọn'

  const avoidList = existingContext.length > 0
    ? existingContext.map((q, i) => `${i + 1}. ${q}`).join('\n')
    : '(chưa có câu hỏi nào trong hệ thống)'

  return `Bạn là chuyên gia soạn đề thi môn ${subject}.
Nhiệm vụ: tạo ${totalCount} câu hỏi ${typeLabel} về chủ đề: "${topic}".

Phân bổ số câu theo các chủ đề con sau: ${distribution}

Yêu cầu bắt buộc:
1. Câu hỏi chính xác về kiến thức, đúng phạm vi chủ đề đã nêu, phù hợp học sinh tiểu học.
2. Đáp án nhiễu (sai) phải hợp lý nhưng chắc chắn sai — không mơ hồ, không có 2 đáp án cùng đúng.
3. Đa dạng độ khó: pha trộn dễ / trung bình / khó (trường difficulty: easy | medium | hard).
4. TUYỆT ĐỐI không lặp nội dung hoặc cách diễn đạt với các câu hỏi sau đây (đã tồn tại trong hệ thống):
${avoidList}
5. Mỗi câu hỏi phải có trường "explanation" giải thích ngắn gọn vì sao đáp án đó đúng.
6. Mỗi câu hỏi phải có trường "subtopic" ghi rõ chủ đề con mà câu đó thuộc về.
7. Phân bổ đáp án đúng ngẫu nhiên đều giữa các vị trí.
8. Trả lời CHỈ bằng JSON đúng theo schema đã cung cấp, không thêm text nào khác ngoài JSON.`
}

function safeParseJSON(text: string): any {
  try { return JSON.parse(text) } catch {}
  const objMatch = text.match(/\{[\s\S]*\}/)
  if (objMatch) { try { return JSON.parse(objMatch[0]) } catch {} }
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) { try { return JSON.parse(arrMatch[0]) } catch {} }
  return null
}

// ─── Phân rã chủ đề thành 3-5 chủ đề con ───
async function decomposeTopic(
  chain: ChainEntry[], subject: string, topic: string, count: number
): Promise<string[]> {
  // Chủ đề đã hẹp hoặc số câu nhỏ → bỏ qua phân rã
  if (count <= 3 || topic.trim().split(/\s+/).length <= 2) return [topic.trim()]

  const prompt = `Tách chủ đề "${topic}" (môn ${subject}) thành 3 đến 5 chủ đề con cụ thể, dễ ra đề câu hỏi cho học sinh tiểu học.
Trả lời CHỈ bằng JSON: {"subtopics": ["...", "..."]}`
  const schema = {
    type: 'OBJECT',
    properties: { subtopics: { type: 'ARRAY', items: { type: 'STRING' } } },
    required: ['subtopics'],
  }

  for (const p of chain) {
    try {
      const text = await p.call(prompt, schema)
      const parsed = safeParseJSON(text)
      const subs = (parsed?.subtopics || [])
        .filter((s: any) => typeof s === 'string' && s.trim())
        .slice(0, 5)
        .map((s: string) => s.trim())
      if (subs.length >= 2) return subs
    } catch {}
  }
  return [topic.trim()]
}

/** Phân bổ đều tổng số câu (đã nhân buffer) qua các chủ đề con */
function distributeCounts(total: number, subtopics: string[]): string {
  const n = Math.max(subtopics.length, 1)
  const base = Math.floor(total / n)
  let rem = total - base * n
  return subtopics.map(s => {
    const c = base + (rem > 0 ? 1 : 0)
    if (rem > 0) rem--
    return `"${s}": ${c} câu`
  }).join(', ')
}

// ════════════════════════════════════════════════════════════════════
// SINH + THẨM ĐỊNH
// ════════════════════════════════════════════════════════════════════
async function generateViaChain(
  chain: ChainEntry[],
  prompt: string,
  schema: object,
  qType: 'mcq' | 'true_false',
  subject: string,
  topic: string,
  providerLabelOut: { value: string }
): Promise<GeneratedQuestion[]> {
  for (const p of chain) {
    try {
      const text = await p.call(prompt, schema)
      const parsed = safeParseJSON(text)
      const list = Array.isArray(parsed) ? parsed : parsed?.questions || []
      if (Array.isArray(list) && list.length > 0) {
        providerLabelOut.value = p.label
        return normalizeGenerated(list, qType, subject, topic, p.label)
      }
    } catch (err: any) {
      console.error(`[${p.label}] generate error:`, err.message)
    }
  }
  return []
}

async function verifyQuestions(
  chain: ChainEntry[], generatorLabel: string,
  subject: string, topic: string, questions: GeneratedQuestion[]
): Promise<{ verified: GeneratedQuestion[]; used: boolean }> {
  if (questions.length === 0 || chain.length === 0) return { verified: questions, used: false }

  // Ưu tiên provider KHÁC với provider vừa sinh (nếu có sẵn)
  const genRoot = generatorLabel.split(' (')[0]
  const others = chain.filter(p => !p.label.includes(genRoot))
  const verifier = others[0] || chain[0]

  const payload = questions.map((q, i) => ({
    index: i,
    question: q.content,
    options: q.options.map(o => o.text),
    correct_index: LABELS.indexOf(q.correct_answer),
    difficulty: q.difficulty || 'medium',
    subtopic: q.subtopic || topic,
  }))
  const prompt = `Dưới đây là danh sách câu hỏi trắc nghiệm môn ${subject}, chủ đề "${topic}":
${JSON.stringify(payload)}

Với mỗi câu, kiểm tra:
1. Đáp án đúng (correct_index) có thực sự đúng không.
2. Các đáp án còn lại có thực sự sai và không gây mơ hồ không.
Nếu phát hiện lỗi, sửa lại (giữ nguyên trường index). Trả về JSON đã sửa theo đúng schema ban đầu, không thêm text khác.`

  try {
    const text = await verifier.call(prompt, buildQuestionSchema(questions[0].question_type))
    const parsed = safeParseJSON(text)
    const list = Array.isArray(parsed) ? parsed : parsed?.questions || []
    if (!Array.isArray(list) || list.length === 0) return { verified: questions, used: false }

    const verified = [...questions]
    for (const item of list) {
      const i = Number(item?.index)
      if (!Number.isInteger(i) || i < 0 || i >= verified.length) continue
      const orig = verified[i]
      if (typeof item.content === 'string' && item.content.trim()) {
        verified[i] = { ...verified[i], content: item.content.trim() }
      }
      if (
        Array.isArray(item.options) &&
        item.options.length === orig.options.length &&
        item.options.every((o: any) => typeof o === 'string')
      ) {
        verified[i] = {
          ...verified[i],
          options: item.options.map((t: string, k: number) => ({ label: orig.options[k].label, text: String(t) })),
        }
      }
      const ci = Number(item.correct_index)
      if (Number.isInteger(ci) && ci >= 0 && ci < verified[i].options.length) {
        verified[i] = { ...verified[i], correct_answer: verified[i].options[ci].label }
      }
      if (typeof item.explanation === 'string' && item.explanation.trim()) {
        verified[i] = { ...verified[i], explanation: item.explanation.trim() }
      }
    }
    return { verified, used: true }
  } catch (err: any) {
    console.error('Verification pass error:', err.message)
    return { verified: questions, used: false }
  }
}

// ════════════════════════════════════════════════════════════════════
// EMBEDDING DEDUP (lớp lọc cuối)
// ════════════════════════════════════════════════════════════════════
async function embedBatch(texts: string[], apiKey: string): Promise<number[][] | null> {
  const cleanKey = apiKey.trim()
  if (!cleanKey || texts.length === 0) return null
  const vectors: number[][] = []
  const CHUNK = 80
  try {
    for (let start = 0; start < texts.length; start += CHUNK) {
      const chunk = texts.slice(start, start + CHUNK)
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${PIPELINE_CONFIG.EMBEDDING_MODEL}:batchEmbedContents?key=${cleanKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: chunk.map(t => ({
              model: `models/${PIPELINE_CONFIG.EMBEDDING_MODEL}`,
              content: { parts: [{ text: t }] },
            })),
          }),
        }
      )
      if (!res.ok) return null
      const data = await res.json()
      const embs = (data?.embeddings || []).map((e: any) => e.values as number[])
      if (embs.length !== chunk.length) return null
      vectors.push(...embs)
    }
    return vectors
  } catch (err: any) {
    console.error('Embedding error:', err.message)
    return null
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Lọc trùng bằng embedding so với ngân hàng; gắn vector vào kết quả để lưu lại lần sau */
async function dedupByEmbedding(
  candidates: GeneratedQuestion[],
  existingVectors: number[][],
  geminiKey: string,
  threshold: number
): Promise<{ kept: GeneratedQuestion[]; removed: number }> {
  if (candidates.length === 0) return { kept: [], removed: 0 }
  if (existingVectors.length === 0 || geminiKey.trim().length <= 5) {
    // Không đủ điều kiện dedup vector → giữ nguyên (embedding null, lần sau sẽ tính khi có key)
    candidates.forEach(c => { c.embedding = c.embedding || null })
    return { kept: candidates, removed: 0 }
  }

  const texts = candidates.map(c => `${c.content}\n${c.options.map(o => o.text).join(' | ')}`)
  const newVectors = await embedBatch(texts, geminiKey)
  if (!newVectors) {
    candidates.forEach(c => { c.embedding = c.embedding || null })
    return { kept: candidates, removed: 0 }
  }

  const kept: GeneratedQuestion[] = []
  let removed = 0
  for (let i = 0; i < candidates.length; i++) {
    const v = newVectors[i]
    candidates[i].embedding = v
    let isDup = false
    for (const ev of existingVectors) {
      if (cosineSimilarity(v, ev) > threshold) { isDup = true; break }
    }
    // So với các câu đã giữ trong đợt này (tránh trùng nội bộ do sinh dư)
    if (!isDup) {
      for (const k of kept) {
        if (k.embedding && cosineSimilarity(v, k.embedding) > threshold) { isDup = true; break }
      }
    }
    if (isDup) removed++
    else kept.push(candidates[i])
  }
  return { kept, removed }
}

// ════════════════════════════════════════════════════════════════════
// NORMALIZE / DEDUP / SHUFFLE
// ════════════════════════════════════════════════════════════════════
function normalizeGenerated(
  rawList: any[], qType: 'mcq' | 'true_false', subject: string, topic: string, providerName: string
): GeneratedQuestion[] {
  if (!Array.isArray(rawList)) return []

  const result: GeneratedQuestion[] = []
  rawList.forEach((item, idx) => {
    if (!item || typeof item !== 'object') return
    const content = String(item.content || item.question || '').trim()
    if (!content) return

    // Options: string[] hoặc [{label,text}] → chuẩn hoá
    let opts: any[] = Array.isArray(item.options) ? [...item.options] : []
    if (opts.length > 0 && typeof opts[0] === 'object' && opts[0] !== null) {
      opts = opts.map((o: any) => (typeof o.text === 'string' ? o.text : String(o)))
    }
    opts = opts.map((t: any) => String(t)).filter(t => t.trim())
    if (opts.length === 0) return

    const expectedLen = qType === 'true_false' ? 2 : 4
    let optionTexts: string[] = opts.slice(0, expectedLen)
    if (qType === 'true_false') {
      optionTexts = ['TRUE (Đúng / Thẻ Xanh)', 'FALSE (Sai / Thẻ Đỏ)']
    } else {
      while (optionTexts.length < 4) optionTexts.push(`Phương án ${LABELS[optionTexts.length]}`)
    }

    // Đáp án: correct_index (số) hoặc nhãn chữ
    let answerLabel = ''
    const ci = Number(item.correct_index ?? item.correctIndex)
    if (Number.isInteger(ci) && ci >= 0 && ci < optionTexts.length) {
      answerLabel = LABELS[ci]
    } else {
      const letter = String(item.correct_answer || item.correctAnswer || 'A').trim().toUpperCase()
      answerLabel = LABELS.includes(letter) ? letter : LABELS[0]
    }

    const diff = ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium'

    result.push({
      id: `q-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      subject: item.subject || subject,
      topic: topic.trim() || item.topic || 'Tổng hợp',
      subtopic: typeof item.subtopic === 'string' && item.subtopic.trim() ? item.subtopic.trim() : topic.trim(),
      content,
      question_type: qType,
      options: optionTexts.map((t, k) => ({ label: LABELS[k], text: t })),
      correct_answer: answerLabel,
      explanation: typeof item.explanation === 'string' ? item.explanation.trim() : '',
      difficulty: diff as 'easy' | 'medium' | 'hard',
      embedding: null,
      duration_seconds: 15,
      source_provider: providerName,
    })
  })

  return result
}

// Hàm loại bỏ các câu hỏi trùng lặp nội dung (exact-match trong lô)
function deduplicateQuestions(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  const seen = new Set<string>()
  const result: GeneratedQuestion[] = []

  for (const q of questions) {
    const key = q.content.trim().toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(q)
    }
  }

  return result
}

// Xáo trộn vị trí đáp án để phân bổ đều A, B, C, D
function shuffleGeneratedList(questions: GeneratedQuestion[]): GeneratedQuestion[] {
  return questions.map(q => {
    if (q.question_type === 'true_false' || q.options.length < 3) return q
    const oldCorrect = q.options.find(o => o.label === q.correct_answer) || q.options[0]
    const correctText = oldCorrect.text

    const shuffled = [...q.options].sort(() => 0.5 - Math.random())
    const newOptions = shuffled.map((opt, idx) => ({ label: LABELS[idx] || `${idx + 1}`, text: opt.text }))
    const newCorrect = newOptions.find(o => o.text === correctText) || newOptions[0]

    return {
      ...q,
      options: newOptions,
      correct_answer: newCorrect.label,
    }
  })
}

// ════════════════════════════════════════════════════════════════════
// HÀM CHÍNH — PIPELINE ĐẦY ĐỦ
// ════════════════════════════════════════════════════════════════════
export async function generateQuestionsWithAI(params: AIGenerateParams): Promise<AIGenerateResult> {
  const {
    topic: rawTopic, subject, count = 5, question_type = 'mcq',
    apiKey = '', enableVerification = PIPELINE_CONFIG.ENABLE_VERIFICATION_PASS,
    existingQuestions = [], existingEmbeddings = [],
  } = params

  const topic = rawTopic.trim() || subject
  const qType: 'mcq' | 'true_false' = question_type === 'true_false' ? 'true_false' : 'mcq'
  const requestedCount = Number(count) || 5
  const bufferedCount = Math.ceil(requestedCount * PIPELINE_CONFIG.GENERATION_BUFFER_RATIO)

  const chain = buildProviderChain(params)

  // ─── Bước 1: Phân rã chủ đề ───
  const subtopics = await decomposeTopic(chain, subject, topic, requestedCount)
  const distribution = distributeCounts(bufferedCount, subtopics)

  // ─── Bước 2+3: Prompt Builder (chống trùng in-prompt) + sinh qua chuỗi provider ───
  const contextList = existingQuestions.slice(0, 12)
  const prompt = buildGenerationPrompt({
    subject, topic, totalCount: bufferedCount, distribution, qType, existingContext: contextList,
  })
  const schema = buildQuestionSchema(qType)
  const providerLabelOut = { value: '' }

  let generated = await generateViaChain(chain, prompt, schema, qType, subject, topic, providerLabelOut)

  // ─── Bước 4: Vòng thẩm định độc lập ───
  let verificationUsed = false
  if (enableVerification && generated.length > 0) {
    const vr = await verifyQuestions(chain, providerLabelOut.value, subject, topic, generated)
    generated = vr.verified
    verificationUsed = vr.used
  }

  // ─── Bước 5a: Dedup exact trong lô + xáo đáp án ───
  generated = shuffleGeneratedList(deduplicateQuestions(generated))
  const generatedRawCount = generated.length

  // ─── Bước 5b: Dedup embedding với ngân hàng câu hỏi ───
  const firstDedup = await dedupByEmbedding(
    generated, existingEmbeddings, apiKey, PIPELINE_CONFIG.DEDUP_SIMILARITY_THRESHOLD
  )
  let finalQuestions = firstDedup.kept
  let duplicatesRemoved = firstDedup.removed

  // ─── Bước 5c: Thiếu ít (≤2 câu) thì gọi lại bù đúng số thiếu ───
  const deficit = requestedCount - finalQuestions.length
  if (deficit > 0 && deficit <= 2 && chain.length > 0) {
    const avoidAll = [...contextList, ...finalQuestions.map(q => q.content)]
    const refillPrompt = buildGenerationPrompt({
      subject, topic, totalCount: deficit,
      distribution: `"${subtopics[0]}": ${deficit} câu`,
      qType, existingContext: avoidAll.slice(0, 20),
    })
    const refillLabel = { value: '' }
    let refilled = await generateViaChain(chain, refillPrompt, schema, qType, subject, topic, refillLabel)
    refilled = shuffleGeneratedList(deduplicateQuestions(refilled))
    const rd = await dedupByEmbedding(
      refilled,
      [...existingEmbeddings, ...finalQuestions.map(q => q.embedding!).filter(Boolean)],
      apiKey, PIPELINE_CONFIG.DEDUP_SIMILARITY_THRESHOLD
    )
    finalQuestions = [...finalQuestions, ...rd.kept].slice(0, requestedCount)
    duplicatesRemoved += rd.removed
  }

  // ─── Cắt đúng số lượng yêu cầu ───
  finalQuestions = finalQuestions.slice(0, requestedCount)

  if (finalQuestions.length > 0) {
    return {
      questions: finalQuestions,
      usedProvider: chain[0]?.id || 'gemini',
      isAiGenerated: true,
      providerName: providerLabelOut.value || chain[0]?.label || 'AI',
      requestedCount,
      generatedRawCount,
      duplicatesRemoved,
      verificationUsed,
      decomposedSubtopics: subtopics,
    }
  }

  // ─── Đáy dự phòng: Bộ phát sinh Offline (giữ nguyên tính năng cũ) ───
  const localQuestions = generateLocalSmartQuestions(topic, subject, requestedCount, question_type)
  return {
    questions: localQuestions,
    usedProvider: 'local',
    isAiGenerated: false,
    providerName: 'Bộ câu hỏi Mẫu (Offline)',
    requestedCount,
    generatedRawCount: localQuestions.length,
    duplicatesRemoved: 0,
    verificationUsed: false,
    decomposedSubtopics: [],
  }
}

// ════════════════════════════════════════════════════════════════════
// LOCAL SMART ENGINE (OFFLINE) — GIỮ NGUYÊN LÀM ĐÁY DỰ PHÒNG
// ════════════════════════════════════════════════════════════════════
function generateLocalSmartQuestions(
  rawTopic: string,
  subject: string,
  count: number,
  type: 'mcq' | 'true_false' | 'all'
): GeneratedQuestion[] {
  const topic = rawTopic.toLowerCase()
  const list: Array<{ content: string; options: Array<{ label: string; text: string }>; correct: string; type?: 'mcq' | 'true_false' }> = []

  // ═════════════════════════════════════════════════════════════════
  // 1. MÔN TIẾNG ANH
  // ═════════════════════════════════════════════════════════════════
  if (subject === 'Tiếng Anh' || subject === 'English') {
    if (topic.includes('phương tiện') || topic.includes('xe') || topic.includes('vehicle') || topic.includes('transport')) {
      const vehicleBank = [
        {
          content: "Which vehicle flies in the sky and carries passengers?",
          options: [{ label: 'A', text: 'Airplane' }, { label: 'B', text: 'Bicycle' }, { label: 'C', text: 'Submarine' }, { label: 'D', text: 'Bus' }],
          correct: 'A'
        },
        {
          content: "How many wheels does a bicycle have?",
          options: [{ label: 'A', text: 'One wheel' }, { label: 'B', text: 'Two wheels' }, { label: 'C', text: 'Three wheels' }, { label: 'D', text: 'Four wheels' }],
          correct: 'B'
        },
        {
          content: "Which vehicle travels on rails and has many carriages?",
          options: [{ label: 'A', text: 'Train' }, { label: 'B', text: 'Boat' }, { label: 'C', text: 'Car' }, { label: 'D', text: 'Helicopter' }],
          correct: 'A'
        },
        {
          content: "Which vehicle sails on water?",
          options: [{ label: 'A', text: 'Ship' }, { label: 'B', text: 'Truck' }, { label: 'C', text: 'Motorbike' }, { label: 'D', text: 'Train' }],
          correct: 'A'
        },
        {
          content: "What vehicle do firefighters use to put out fires?",
          options: [{ label: 'A', text: 'Fire truck' }, { label: 'B', text: 'Taxi' }, { label: 'C', text: 'Bicycle' }, { label: 'D', text: 'Ambulance' }],
          correct: 'A'
        },
        {
          content: "Which vehicle is used to take sick people to the hospital?",
          options: [{ label: 'A', text: 'Ambulance' }, { label: 'B', text: 'Bus' }, { label: 'C', text: 'Subway' }, { label: 'D', text: 'Scooter' }],
          correct: 'A'
        },
        {
          content: "True or False: A helicopter has large blades on top to fly.",
          type: 'true_false' as const,
          options: [{ label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' }, { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }],
          correct: 'A'
        },
        {
          content: "True or False: Cars can drive underwater like submarines.",
          type: 'true_false' as const,
          options: [{ label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' }, { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' }],
          correct: 'B'
        },
        {
          content: "What should you wear when riding a bicycle or motorbike for safety?",
          options: [{ label: 'A', text: 'A helmet' }, { label: 'B', text: 'Sunglasses' }, { label: 'C', text: 'A watch' }, { label: 'D', text: 'A hat' }],
          correct: 'A'
        },
        {
          content: "Which vehicle is the largest on the road?",
          options: [{ label: 'A', text: 'Truck' }, { label: 'B', text: 'Bicycle' }, { label: 'C', text: 'Motorbike' }, { label: 'D', text: 'Skateboard' }],
          correct: 'A'
        }
      ]
      list.push(...vehicleBank)
    }
    else if (topic.includes('xưng hô') || topic.includes('đại từ') || topic.includes('pronoun')) {
      const pronounBank = [
        {
          content: "Which English pronoun replaces 'My mother' in a sentence?",
          options: [{ label: 'A', text: 'He' }, { label: 'B', text: 'She' }, { label: 'C', text: 'It' }, { label: 'D', text: 'They' }],
          correct: 'B'
        },
        {
          content: "What is the English pronoun for 'Tôi'?",
          options: [{ label: 'A', text: 'I' }, { label: 'B', text: 'You' }, { label: 'C', text: 'We' }, { label: 'D', text: 'They' }],
          correct: 'A'
        },
        {
          content: "Choose the correct pronoun: '___ is my best friend.' (Nam)",
          options: [{ label: 'A', text: 'She' }, { label: 'B', text: 'It' }, { label: 'C', text: 'He' }, { label: 'D', text: 'We' }],
          correct: 'C'
        },
        {
          content: "Which pronoun replaces 'Tom and Jerry'?",
          options: [{ label: 'A', text: 'We' }, { label: 'B', text: 'They' }, { label: 'C', text: 'He' }, { label: 'D', text: 'It' }],
          correct: 'B'
        },
        {
          content: "Which pronoun is used for an animal or a thing?",
          options: [{ label: 'A', text: 'They' }, { label: 'B', text: 'You' }, { label: 'C', text: 'It' }, { label: 'D', text: 'He' }],
          correct: 'C'
        },
        {
          content: "What is the English word for 'Chúng tôi / Chúng ta'?",
          options: [{ label: 'A', text: 'They' }, { label: 'B', text: 'We' }, { label: 'C', text: 'You' }, { label: 'D', text: 'She' }],
          correct: 'B'
        }
      ]
      list.push(...pronounBank)
    }
    else if (topic.includes('động vật') || topic.includes('animal')) {
      const animalBank = [
        {
          content: "Which animal says 'Meow'?",
          options: [{ label: 'A', text: 'Dog' }, { label: 'B', text: 'Cat' }, { label: 'C', text: 'Bird' }, { label: 'D', text: 'Duck' }],
          correct: 'B'
        },
        {
          content: "What is known as the King of the Jungle?",
          options: [{ label: 'A', text: 'Monkey' }, { label: 'B', text: 'Zebra' }, { label: 'C', text: 'Lion' }, { label: 'D', text: 'Panda' }],
          correct: 'C'
        },
        {
          content: "Which animal has a very long neck?",
          options: [{ label: 'A', text: 'Elephant' }, { label: 'B', text: 'Giraffe' }, { label: 'C', text: 'Lion' }, { label: 'D', text: 'Monkey' }],
          correct: 'B'
        }
      ]
      list.push(...animalBank)
    }
    else {
      const generalBank = [
        {
          content: "What color is the sky on a clear sunny day?",
          options: [{ label: 'A', text: 'Blue' }, { label: 'B', text: 'Green' }, { label: 'C', text: 'Yellow' }, { label: 'D', text: 'Red' }],
          correct: 'A'
        },
        {
          content: "How many months are there in a year?",
          options: [{ label: 'A', text: '10 months' }, { label: 'B', text: '11 months' }, { label: 'C', text: '12 months' }, { label: 'D', text: '14 months' }],
          correct: 'C'
        },
        {
          content: "Which season is the hottest in the year?",
          options: [{ label: 'A', text: 'Spring' }, { label: 'B', text: 'Summer' }, { label: 'C', text: 'Autumn' }, { label: 'D', text: 'Winter' }],
          correct: 'B'
        }
      ]
      list.push(...generalBank)
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. MÔN TOÁN TIẾNG ANH (MATH IN ENGLISH)
  // ═════════════════════════════════════════════════════════════════
  else if (subject === 'Toán Tiếng Anh') {
    const mathBank = [
      {
        content: "What is 6 times 7? (6 × 7 = ?)",
        options: [{ label: 'A', text: '42' }, { label: 'B', text: '48' }, { label: 'C', text: '36' }, { label: 'D', text: '54' }],
        correct: 'A'
      },
      {
        content: "How many sides does a rectangle have?",
        options: [{ label: 'A', text: '3 sides' }, { label: 'B', text: '4 sides' }, { label: 'C', text: '5 sides' }, { label: 'D', text: '6 sides' }],
        correct: 'B'
      },
      {
        content: "What is 100 minus 25? (100 - 25 = ?)",
        options: [{ label: 'A', text: '65' }, { label: 'B', text: '75' }, { label: 'C', text: '85' }, { label: 'D', text: '70' }],
        correct: 'B'
      }
    ]
    list.push(...mathBank)
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. MÔN KHOA HỌC TIẾNG ANH (SCIENCE IN ENGLISH)
  // ═════════════════════════════════════════════════════════════════
  else if (subject === 'Khoa học Tiếng Anh') {
    const sciBank = [
      {
        content: "Which planet is known as the Red Planet?",
        options: [{ label: 'A', text: 'Mars' }, { label: 'B', text: 'Venus' }, { label: 'C', text: 'Jupiter' }, { label: 'D', text: 'Saturn' }],
        correct: 'A'
      },
      {
        content: "What do bees collect from flowers to make honey?",
        options: [{ label: 'A', text: 'Nectar' }, { label: 'B', text: 'Leaves' }, { label: 'C', text: 'Seeds' }, { label: 'D', text: 'Water' }],
        correct: 'A'
      }
    ]
    list.push(...sciBank)
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. TIẾNG VIỆT & TOÁN HỌC
  // ═════════════════════════════════════════════════════════════════
  else {
    const tvBank = [
      {
        content: "Từ nào sau đây là từ chỉ hoạt động?",
        options: [{ label: 'A', text: 'Bông hoa' }, { label: 'B', text: 'Chạy nhảy' }, { label: 'C', text: 'Xinh xắn' }, { label: 'D', text: 'Ngôi nhà' }],
        correct: 'B'
      },
      {
        content: "5 × 9 bằng bao nhiêu?",
        options: [{ label: 'A', text: '40' }, { label: 'B', text: '45' }, { label: 'C', text: '50' }, { label: 'D', text: '55' }],
        correct: 'B'
      }
    ]
    list.push(...tvBank)
  }

  const filtered = list.filter(item => {
    if (type === 'mcq') return !item.type || item.type === 'mcq'
    if (type === 'true_false') return item.type === 'true_false'
    return true
  })

  const source = filtered.length > 0 ? filtered : list
  const results: GeneratedQuestion[] = []
  const maxAvail = Math.min(count, source.length)

  for (let i = 0; i < maxAvail; i++) {
    const raw = source[i]
    results.push({
      id: `q-local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      subject,
      topic: rawTopic.trim() || 'Tổng hợp',
      subtopic: rawTopic.trim() || null,
      content: raw.content,
      question_type: raw.type || 'mcq',
      options: raw.options,
      correct_answer: raw.correct,
      explanation: null,
      difficulty: 'medium',
      embedding: null,
      duration_seconds: 15,
      source_provider: 'Bộ câu hỏi Mẫu (Offline)',
    })
  }

  return shuffleGeneratedList(deduplicateQuestions(results))
}
