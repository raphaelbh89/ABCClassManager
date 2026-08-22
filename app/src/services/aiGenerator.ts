// src/services/aiGenerator.ts
// Bộ phát sinh câu hỏi thông minh đa nhà cung cấp AI & Local Semantic Engine (Chống lặp câu hỏi)

export interface AIGenerateParams {
  topic: string
  subject: string
  count: number
  question_type: 'mcq' | 'true_false' | 'all'
  grade?: number
  provider?: 'gemini' | 'openai' | 'groq' | 'custom' | 'local'
  apiKey?: string
  customBaseUrl?: string
  customModel?: string
}

export interface GeneratedQuestion {
  id: string
  subject: string
  topic?: string
  content: string
  question_type: 'mcq' | 'true_false'
  options: Array<{ label: string; text: string }>
  correct_answer: string
  duration_seconds: number
  source_provider?: string
}

export interface AIGenerateResult {
  questions: GeneratedQuestion[]
  usedProvider: 'gemini' | 'openai' | 'groq' | 'custom' | 'local'
  isAiGenerated: boolean
  providerName: string
}

const SYSTEM_PROMPT = `Bạn là chuyên gia giáo dục tiểu học Việt Nam. Nhiệm vụ của bạn là tạo ra các câu hỏi trắc nghiệm hoặc đúng/sai chuẩn kiến thức sư phạm, phù hợp với học sinh tiểu học (Lớp 1 đến Lớp 5).

BẮT BUỘC trả về định dạng JSON thuần túy (Array of Objects), không có bất kỳ ký tự giải thích markdown thừa bên ngoài:
[
  {
    "content": "Nội dung câu hỏi rõ ràng, chính xác theo môn học và chủ đề yêu cầu (KHÔNG ĐƯỢC lặp lại câu hỏi)",
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

QUY TẮC BẮT BUỘC:
1. Mỗi câu hỏi phải hoàn toàn KHÁC NHAU, TUYỆT ĐỐI KHÔNG lặp lại nội dung hoặc ý tưởng.
2. Với câu hỏi "mcq" (Trắc nghiệm): Phải có 4 phương án A, B, C, D. Đáp án đúng PHẢI được xáo trộn ngẫu nhiên phân bổ đều giữa A, B, C, D (TUYỆT ĐỐI KHÔNG để toàn bộ là A).
3. Với câu hỏi "true_false" (Đúng/Sai): Phương án A là "TRUE (Đúng / Thẻ Xanh)", Phương án B là "FALSE (Sai / Thẻ Đỏ)". Đáp án đúng là "A" hoặc "B".
4. Môn Tiếng Anh: Câu hỏi và các phương án phải được viết hoàn toàn bằng TIẾNG ANH chuẩn ngữ pháp và phù hợp lứa tuổi học sinh tiểu học.`;

export async function generateQuestionsWithAI(params: AIGenerateParams): Promise<AIGenerateResult> {
  const {
    topic,
    subject,
    count = 5,
    question_type = 'mcq',
    provider = 'gemini',
    apiKey = '',
    customBaseUrl = '',
    customModel = '',
  } = params

  const cleanKey = apiKey.trim()
  const prompt = `Hãy tạo ${count} câu hỏi môn ${subject} với chủ đề/yêu cầu cụ thể: "${topic || subject}".
Thể loại câu hỏi: ${question_type === 'true_false' ? 'Đúng / Sai' : question_type === 'mcq' ? 'Trắc nghiệm 4 lựa chọn ABCD' : 'Kết hợp cả Trắc nghiệm và Đúng/Sai'}.
Hãy tạo câu hỏi thú vị, chuẩn kiến thức môn ${subject}, nội dung các câu hoàn toàn khác biệt nhau và phân bổ đáp án đúng ngẫu nhiên đều giữa các phương án.`

  // ─── 1. GOOGLE GEMINI API (MIỄN PHÍ 100%) ───
  if (provider === 'gemini' && cleanKey.length > 5) {
    const modelsToTry = [
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-2.0-flash' },
      { version: 'v1beta', model: 'gemini-2.0-flash-exp' },
      { version: 'v1',     model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-1.5-pro' },
      { version: 'v1beta', model: 'gemini-pro' },
    ]

    for (const item of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/${item.version}/models/${item.model}:generateContent?key=${cleanKey}`
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

        if (response.ok) {
          const data = await response.json()
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
          let parsed: any[] = []
          try {
            parsed = JSON.parse(rawText)
          } catch {
            const jsonMatch = rawText.match(/\[[\s\S]*\]/)
            if (jsonMatch) parsed = JSON.parse(jsonMatch[0])
          }

          const normalized = normalizeQuestions(parsed, subject, topic, `Google Gemini (${item.model})`)
          const deduplicated = deduplicateQuestions(normalized)
          if (deduplicated.length > 0) {
            return {
              questions: shuffleGeneratedList(deduplicated),
              usedProvider: 'gemini',
              isAiGenerated: true,
              providerName: `Google Gemini (${item.model})`,
            }
          }
        }
      } catch (err: any) {
        console.error(`Gemini ${item.model} error:`, err.message)
      }
    }
  }

  // ─── 2. OPENAI API (CHATGPT - GPT-4O-MINI) ───
  if (provider === 'openai' && cleanKey.length > 5) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
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

      if (response.ok) {
        const data = await response.json()
        const rawContent = data?.choices?.[0]?.message?.content || '{}'
        const parsedObj = JSON.parse(rawContent)
        const list = Array.isArray(parsedObj) ? parsedObj : parsedObj.questions || parsedObj.data || []
        const normalized = normalizeQuestions(list, subject, topic, 'OpenAI ChatGPT')
        const deduplicated = deduplicateQuestions(normalized)
        if (deduplicated.length > 0) {
          return {
            questions: shuffleGeneratedList(deduplicated),
            usedProvider: 'openai',
            isAiGenerated: true,
            providerName: 'OpenAI ChatGPT (gpt-4o-mini)',
          }
        }
      }
    } catch (err: any) {
      console.error('OpenAI generate error:', err.message)
    }
  }

  // ─── 3. GROQ API (MIỄN PHÍ 100% VỚI LLAMA 3.3) ───
  if (provider === 'groq' && cleanKey.length > 5) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
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

      if (response.ok) {
        const data = await response.json()
        const rawContent = data?.choices?.[0]?.message?.content || '{}'
        const parsedObj = JSON.parse(rawContent)
        const list = Array.isArray(parsedObj) ? parsedObj : parsedObj.questions || parsedObj.data || []
        const normalized = normalizeQuestions(list, subject, topic, 'Groq Llama 3.3')
        const deduplicated = deduplicateQuestions(normalized)
        if (deduplicated.length > 0) {
          return {
            questions: shuffleGeneratedList(deduplicated),
            usedProvider: 'groq',
            isAiGenerated: true,
            providerName: 'Groq Llama 3.3 (AI)',
          }
        }
      }
    } catch (err: any) {
      console.error('Groq generate error:', err.message)
    }
  }

  // ─── 4. CUSTOM ENDPOINT (DEEPSEEK / OPENROUTER / OLLAMA) ───
  if (provider === 'custom' && cleanKey.length > 5) {
    try {
      const baseUrl = (customBaseUrl || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
      const model = customModel || 'deepseek-chat'

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const rawContent = data?.choices?.[0]?.message?.content || '{}'
        let list: any[] = []
        try {
          const parsed = JSON.parse(rawContent)
          list = Array.isArray(parsed) ? parsed : parsed.questions || parsed.data || []
        } catch {
          // Trích xuất JSON từ markdown code block nếu có
          const jsonMatch = rawContent.match(/\[[\s\S]*\]/)
          if (jsonMatch) list = JSON.parse(jsonMatch[0])
        }

        const normalized = normalizeQuestions(list, subject, topic, `Custom (${model})`)
        const deduplicated = deduplicateQuestions(normalized)
        if (deduplicated.length > 0) {
          return {
            questions: shuffleGeneratedList(deduplicated),
            usedProvider: 'custom',
            isAiGenerated: true,
            providerName: `Custom AI (${model})`,
          }
        }
      }
    } catch (err: any) {
      console.error('Custom AI generate error:', err.message)
    }
  }

  // ─── 5. LOCAL SMART ENGINE (DỰ PHÒNG OFFLINE KHI CHƯA NHẬP KEY) ───
  const localQuestions = generateLocalSmartQuestions(topic.trim(), subject, count, question_type)
  return {
    questions: localQuestions,
    usedProvider: 'local',
    isAiGenerated: false,
    providerName: 'Bộ câu hỏi Mẫu (Offline)',
  }
}

function normalizeQuestions(rawList: any[], subject: string, topic: string, providerName: string): GeneratedQuestion[] {
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
      topic: topic.trim() || item.topic || 'Tổng hợp',
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
      source_provider: providerName,
    }
  })
}

// Hàm loại bỏ các câu hỏi trùng lặp nội dung
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
    const labels = ['A', 'B', 'C', 'D']
    const newOptions = shuffled.map((opt, idx) => ({ label: labels[idx] || `${idx + 1}`, text: opt.text }))
    const newCorrect = newOptions.find(o => o.text === correctText) || newOptions[0]

    return {
      ...q,
      options: newOptions,
      correct_answer: newCorrect.label,
    }
  })
}

// ─── LOCAL SMART SEMANTIC GENERATOR (OFFLINE VỚI NGÂN HÀNG PHONG PHÚ) ───
function generateLocalSmartQuestions(
  rawTopic: string,
  subject: string,
  count: number,
  type: 'mcq' | 'true_false' | 'all'
): GeneratedQuestion[] {
  const topic = rawTopic.toLowerCase()
  const list: Array<{ content: string; options: Array<{ label: string; text: string }>; correct: string; type?: 'mcq' | 'true_false' }> = []

  // ═════════════════════════════════════════════════════════════════════
  // 1. MÔN TIẾNG ANH
  // ═════════════════════════════════════════════════════════════════════
  if (subject === 'Tiếng Anh' || subject === 'English') {
    // Chủ đề: Phương tiện giao thông (Vehicles & Transportation)
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
    // Chủ đề: Đại từ xưng hô (Pronouns)
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
    // Chủ đề: Động vật (Animals)
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
    // Mặc định tổng quát tiếng Anh
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

  // ═════════════════════════════════════════════════════════════════════
  // 2. MÔN TOÁN TIẾNG ANH (MATH IN ENGLISH)
  // ═════════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════════
  // 3. MÔN KHOA HỌC TIẾNG ANH (SCIENCE IN ENGLISH)
  // ═════════════════════════════════════════════════════════════════════
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

  // ═════════════════════════════════════════════════════════════════════
  // 4. TIẾNG VIỆT & TOÁN HỌC
  // ═════════════════════════════════════════════════════════════════════
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

  // Lấy tối đa số câu có sẵn không lặp lại
  for (let i = 0; i < maxAvail; i++) {
    const raw = source[i]
    results.push({
      id: `q-local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      subject,
      topic: rawTopic.trim() || 'Tổng hợp',
      content: raw.content,
      question_type: raw.type || 'mcq',
      options: raw.options,
      correct_answer: raw.correct,
      duration_seconds: 15,
      source_provider: 'Bộ câu hỏi Mẫu (Offline)',
    })
  }

  return shuffleGeneratedList(deduplicateQuestions(results))
}
