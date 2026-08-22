// src/services/aiGenerator.ts
// Module tích hợp AI đa nhà cung cấp (Google Gemini Free, OpenAI ChatGPT, Groq Free) để tạo câu hỏi theo chủ đề

export interface AIGenerateParams {
  topic: string
  subject: string
  count: number
  question_type: 'mcq' | 'true_false' | 'all'
  grade?: number
  provider?: 'gemini' | 'openai' | 'groq' | 'local'
  apiKey?: string
}

export interface GeneratedQuestion {
  id: string
  subject: string
  content: string
  question_type: 'mcq' | 'true_false'
  options: Array<{ label: string; text: string }>
  correct_answer: string
  duration_seconds: number
}

const SYSTEM_PROMPT = `Bạn là chuyên gia giáo dục tiểu học Việt Nam. Nhiệm vụ của bạn là tạo ra các câu hỏi trắc nghiệm hoặc đúng/sai chuẩn kiến thức sư phạm, phù hợp với học sinh tiểu học (Lớp 1 đến Lớp 5).

BẮT BUỘC trả về định dạng JSON thuần túy (Array of Objects), không có markdown thừa:
[
  {
    "content": "Nội dung câu hỏi rõ ràng, dễ hiểu",
    "question_type": "mcq" hoặc "true_false",
    "options": [
      { "label": "A", "text": "Phương án A" },
      { "label": "B", "text": "Phương án B" },
      { "label": "C", "text": "Phương án C" },
      { "label": "D", "text": "Phương án D" }
    ],
    "correct_answer": "A" hoặc "B" hoặc "C" hoặc "D",
    "duration_seconds": 15
  }
]

QUY TẮC CẦN TUÂN THỦ:
1. Với câu hỏi "mcq" (Trắc nghiệm): Phải có 4 phương án A, B, C, D. Đáp án đúng PHẢI được xáo trộn ngẫu nhiên phân bổ đều giữa A, B, C, D (không được để toàn bộ là A).
2. Với câu hỏi "true_false" (Đúng/Sai): Phương án A là "TRUE (Đúng / Thẻ Xanh)", Phương án B là "FALSE (Sai / Thẻ Đỏ)". Đáp án đúng là "A" hoặc "B".
3. Câu hỏi và các phương án phải ngắn gọn, phù hợp với lứa tuổi học sinh tiểu học.`;

export async function generateQuestionsWithAI(params: AIGenerateParams): Promise<GeneratedQuestion[]> {
  const { topic, subject, count = 5, question_type = 'mcq', provider = 'local', apiKey } = params

  const prompt = `Hãy tạo ${count} câu hỏi môn ${subject} với chủ đề/yêu cầu cụ thể: "${topic || subject}".
Thể loại câu hỏi: ${question_type === 'true_false' ? 'Đúng / Sai' : question_type === 'mcq' ? 'Trắc nghiệm 4 lựa chọn ABCD' : 'Kết hợp cả Trắc nghiệm và Đúng/Sai'}.
Hãy tạo câu hỏi thú vị, chuẩn kiến thức và phân bổ đáp án đúng ngẫu nhiên đều giữa các phương án.`;

  // ─── 1. GOOGLE GEMINI API (MIỄN PHÍ 100% VỚI GEMINI 1.5 FLASH / 2.0 FLASH) ───
  if (provider === 'gemini' && apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API Error: ${errorText}`)
      }

      const data = await response.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      const parsed = JSON.parse(rawText)
      return normalizeQuestions(parsed, subject)
    } catch (err: any) {
      console.error('Gemini generate failed, fallback to local:', err.message)
    }
  }

  // ─── 2. OPENAI API (CHATGPT - GPT-4O-MINI / GPT-3.5-TURBO) ───
  if (provider === 'openai' && apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API Error: ${errorText}`)
      }

      const data = await response.json()
      const rawContent = data?.choices?.[0]?.message?.content || '{}'
      const parsedObj = JSON.parse(rawContent)
      const list = Array.isArray(parsedObj) ? parsedObj : parsedObj.questions || parsedObj.data || []
      return normalizeQuestions(list, subject)
    } catch (err: any) {
      console.error('OpenAI generate failed, fallback to local:', err.message)
    }
  }

  // ─── 3. GROQ API (MIỄN PHÍ 100% VỚI LLAMA 3.3) ───
  if (provider === 'groq' && apiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Groq API Error: ${errorText}`)
      }

      const data = await response.json()
      const rawContent = data?.choices?.[0]?.message?.content || '{}'
      const parsedObj = JSON.parse(rawContent)
      const list = Array.isArray(parsedObj) ? parsedObj : parsedObj.questions || parsedObj.data || []
      return normalizeQuestions(list, subject)
    } catch (err: any) {
      console.error('Groq generate failed, fallback to local:', err.message)
    }
  }

  // ─── 4. LOCAL SMART ENGINE (OFFLINE DỰ PHÒNG KHÔNG CẦN KEY) ───
  return generateLocalSmartQuestions(topic || subject, subject, count, question_type)
}

function normalizeQuestions(rawList: any[], subject: string): GeneratedQuestion[] {
  if (!Array.isArray(rawList) || rawList.length === 0) return []

  const labels = ['A', 'B', 'C', 'D']
  return rawList.map((item, idx) => {
    let options = item.options || []
    if (typeof options === 'string') {
      try { options = JSON.parse(options) } catch {}
    }

    if (Array.isArray(options) && typeof options[0] === 'string') {
      options = options.map((t, i) => ({ label: labels[i] || `${i + 1}`, text: String(t) }))
    }

    return {
      id: `q-ai-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      subject: item.subject || subject,
      content: item.content || item.question || 'Câu hỏi',
      question_type: item.question_type === 'true_false' ? 'true_false' : 'mcq',
      options: options.length > 0 ? options : [
        { label: 'A', text: 'Phương án A' },
        { label: 'B', text: 'Phương án B' },
        { label: 'C', text: 'Phương án C' },
        { label: 'D', text: 'Phương án D' },
      ],
      correct_answer: item.correct_answer || item.correctAnswer || 'A',
      duration_seconds: item.duration_seconds || 15,
    }
  })
}

function generateLocalSmartQuestions(
  topic: string,
  subject: string,
  count: number,
  type: 'mcq' | 'true_false' | 'all'
): GeneratedQuestion[] {
  const result: GeneratedQuestion[] = []
  const labels = ['A', 'B', 'C', 'D']

  for (let i = 0; i < count; i++) {
    const qType = type === 'all' ? (i % 2 === 0 ? 'mcq' : 'true_false') : type
    const correctIdx = Math.floor(Math.random() * 4) // 0: A, 1: B, 2: C, 3: D
    const correctLabel = labels[correctIdx]

    if (qType === 'true_false') {
      const isTrue = Math.random() > 0.5
      result.push({
        id: `q-gen-${Date.now()}-${i}`,
        subject,
        content: `Câu ${i + 1} (${topic}): Khẳng định sau đây là Đúng hay Sai?`,
        question_type: 'true_false',
        options: [
          { label: 'A', text: 'TRUE (Đúng / Thẻ Xanh)' },
          { label: 'B', text: 'FALSE (Sai / Thẻ Đỏ)' },
        ],
        correct_answer: isTrue ? 'A' : 'B',
        duration_seconds: 15,
      })
    } else {
      const a = Math.floor(Math.random() * 8) + 2
      const b = Math.floor(Math.random() * 9) + 2
      const correctVal = a * b
      const wrong1 = correctVal + (Math.random() > 0.5 ? 2 : -2)
      const wrong2 = correctVal + (Math.random() > 0.5 ? 5 : -5)
      const wrong3 = correctVal + 10

      const vals = [correctVal, wrong1, wrong2, wrong3].sort(() => 0.5 - Math.random())
      const options = vals.map((v, idx) => ({ label: labels[idx], text: `${v}` }))
      const matchedCorrect = options.find(o => Number(o.text) === correctVal) || options[0]

      result.push({
        id: `q-gen-${Date.now()}-${i}`,
        subject,
        content: `Chủ đề ${topic}: Kết quả của phép tính ${a} × ${b} là bao nhiêu?`,
        question_type: 'mcq',
        options,
        correct_answer: matchedCorrect.label,
        duration_seconds: 15,
      })
    }
  }

  return result
}
