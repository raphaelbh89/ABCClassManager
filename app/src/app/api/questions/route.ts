// src/app/api/questions/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject')
    const type = searchParams.get('type')
    const topic = searchParams.get('topic')

    let query = 'SELECT * FROM questions WHERE is_active = 1'
    const params: any[] = []

    if (subject && subject !== 'all') {
      if (subject === 'Tiếng Anh') {
        query += ' AND (subject = ? OR subject = ? OR subject = ?)'
        params.push('Tiếng Anh', 'Toán Tiếng Anh', 'Khoa học Tiếng Anh')
      } else {
        query += ' AND subject = ?'
        params.push(subject)
      }
    }

    if (type && type !== 'all') {
      query += ' AND question_type = ?'
      params.push(type)
    }

    if (topic && topic !== 'all') {
      query += ' AND topic = ?'
      params.push(topic)
    }

    query += ' ORDER BY created_at DESC'
    const rows = db.prepare(query).all(...params) as any[]

    const questions = rows.map(r => ({
      ...r,
      options: JSON.parse(r.options || '[]'),
      is_active: Boolean(r.is_active),
    }))

    return NextResponse.json(questions)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    // ─── Tạo tự động bộ câu hỏi theo Chủ đề / AI Prompt (Gemini Free, ChatGPT, Groq, Custom) ───
    if (action === 'generate_set' || action === 'ai_generate') {
      const {
        topic = '',
        subject = 'Tiếng Anh',
        count = 5,
        question_type = 'mcq',
        provider = 'gemini',
        apiKey = '',
        customBaseUrl = '',
        customModel = '',
      } = body

      const { generateQuestionsWithAI } = await import('@/services/aiGenerator')
      const result = await generateQuestionsWithAI({
        topic: topic.trim(),
        subject,
        count: Number(count) || 5,
        question_type,
        provider,
        apiKey,
        customBaseUrl,
        customModel,
      })

      // Lấy toàn bộ nội dung câu hỏi đã có trong database để chống lưu lặp lại
      const existingRows = db.prepare('SELECT LOWER(TRIM(content)) as content FROM questions WHERE is_active = 1').all() as any[]
      const existingSet = new Set(existingRows.map(r => r.content))

      // Chỉ thêm các câu hỏi chưa từng xuất hiện
      const uniqueToInsert = result.questions.filter(q => !existingSet.has(q.content.trim().toLowerCase()))

      const insertStmt = db.prepare(`
        INSERT INTO questions (id, teacher_id, subject, topic, content, question_type, options, correct_answer, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const tx = db.transaction((list: any[]) => {
        for (const q of list) {
          insertStmt.run(
            q.id,
            'teacher-1',
            q.subject,
            topic.trim() || q.topic || 'Tổng hợp',
            q.content,
            q.question_type,
            JSON.stringify(q.options),
            q.correct_answer,
            q.duration_seconds
          )
        }
      })
      tx(uniqueToInsert)

      return NextResponse.json({
        success: true,
        count: uniqueToInsert.length,
        skippedCount: result.questions.length - uniqueToInsert.length,
        questions: uniqueToInsert,
        isAiGenerated: result.isAiGenerated,
        providerName: result.providerName,
        usedProvider: result.usedProvider,
      })
    }

    // ─── Tạo 1 câu hỏi đơn lẻ ───
    const {
      subject = 'Tiếng Anh',
      topic = 'Tổng hợp',
      content,
      question_type = 'mcq',
      options,
      correct_answer,
      duration_seconds = 20,
    } = body

    const id = `q-${Date.now()}`
    db.prepare(`
      INSERT INTO questions (id, teacher_id, subject, topic, content, question_type, options, correct_answer, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, 'teacher-1', subject, topic.trim(), content.trim(), question_type, JSON.stringify(options || []), correct_answer, duration_seconds)

    const created = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as any
    return NextResponse.json({
      ...created,
      options: JSON.parse(created.options || '[]'),
      is_active: Boolean(created.is_active),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, subject, topic = 'Tổng hợp', content, question_type, options, correct_answer, duration_seconds } = body

    db.prepare(`
      UPDATE questions
      SET subject = ?, topic = ?, content = ?, question_type = ?, options = ?, correct_answer = ?, duration_seconds = ?
      WHERE id = ?
    `).run(subject, topic.trim(), content.trim(), question_type, JSON.stringify(options || []), correct_answer, duration_seconds, id)

    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as any
    return NextResponse.json({
      ...updated,
      options: JSON.parse(updated.options || '[]'),
      is_active: Boolean(updated.is_active),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    db.prepare('DELETE FROM questions WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** Máy phát sinh câu hỏi toán & đố vui thông minh không giới hạn số lượng */
function generateDynamicQuizSet(subject: string, count: number, type: 'mcq' | 'true_false' | 'all') {
  const list: any[] = []

  for (let i = 0; i < count; i++) {
    const targetType = type === 'all' ? (i % 2 === 0 ? 'mcq' : 'true_false') : type
    const targetSubject = subject === 'Tất cả'
      ? ['Toán học', 'Tiếng Việt', 'Tự nhiên & Xã hội', 'Tiếng Anh', 'Toán Tiếng Anh'][i % 5]
      : subject

    let q: any

    // ─── 1. Môn Toán Tiếng Anh (Math in English) ───
    if (targetSubject === 'Toán Tiếng Anh' || targetSubject === 'Math in English') {
      if (targetType === 'mcq') {
        const mathType = i % 4
        if (mathType === 0) {
          // Phép nhân tiếng Anh (Times / Multiplied by)
          const a = Math.floor(Math.random() * 8) + 2
          const b = Math.floor(Math.random() * 9) + 2
          const correctVal = a * b
          const wrong1 = correctVal + 4
          const wrong2 = correctVal - 2
          const wrong3 = correctVal + 8

          const labels = ['A', 'B', 'C', 'D']
          const shuffled = [
            { label: 'A', text: `${correctVal}` },
            { label: 'B', text: `${wrong1}` },
            { label: 'C', text: `${wrong2}` },
            { label: 'D', text: `${wrong3}` },
          ].sort(() => 0.5 - Math.random())

          shuffled.forEach((opt, idx) => { opt.label = labels[idx] })
          const correctLabel = shuffled.find(o => o.text === `${correctVal}`)?.label || 'A'

          q = {
            content: `What is ${a} times ${b}? (${a} × ${b} = ?)`,
            options: shuffled,
            correct_answer: correctLabel,
            duration_seconds: 15,
            question_type: 'mcq',
            subject: 'Toán Tiếng Anh',
          }
        } else if (mathType === 1) {
          // Phép cộng / trừ tiếng Anh (Plus / Minus)
          const a = (Math.floor(Math.random() * 4) + 1) * 10
          const b = (Math.floor(Math.random() * 4) + 1) * 5
          const isPlus = Math.random() > 0.5
          const correctVal = isPlus ? a + b : a - b
          const opText = isPlus ? 'plus' : 'minus'
          const opSymbol = isPlus ? '+' : '-'

          const wrong1 = correctVal + 10
          const wrong2 = Math.max(5, correctVal - 5)
          const wrong3 = correctVal + 15

          const labels = ['A', 'B', 'C', 'D']
          const shuffled = [
            { label: 'A', text: `${correctVal}` },
            { label: 'B', text: `${wrong1}` },
            { label: 'C', text: `${wrong2}` },
            { label: 'D', text: `${wrong3}` },
          ].sort(() => 0.5 - Math.random())

          shuffled.forEach((opt, idx) => { opt.label = labels[idx] })
          const correctLabel = shuffled.find(o => o.text === `${correctVal}`)?.label || 'A'

          q = {
            content: `What is ${a} ${opText} ${b}? (${a} ${opSymbol} ${b} = ?)`,
            options: shuffled,
            correct_answer: correctLabel,
            duration_seconds: 15,
            question_type: 'mcq',
            subject: 'Toán Tiếng Anh',
          }
        } else if (mathType === 2) {
          // Hình học tiếng Anh (Shapes & Geometry)
          const geoPool = [
            { c: 'How many sides does a triangle have?', opts: ['3 sides', '4 sides', '5 sides', '6 sides'], cor: 'A' },
            { c: 'How many corners does a rectangle have?', opts: ['4 corners', '3 corners', '5 corners', '0 corners'], cor: 'A' },
            { c: 'Which shape has NO straight sides?', opts: ['Circle', 'Square', 'Triangle', 'Rectangle'], cor: 'A' },
            { c: 'A shape with 5 sides is called a:', opts: ['Pentagon', 'Triangle', 'Square', 'Hexagon'], cor: 'A' },
          ]
          const item = geoPool[i % geoPool.length]
          const labels = ['A', 'B', 'C', 'D']
          const opts = item.opts.map((text, idx) => ({ label: labels[idx], text }))
          q = {
            content: item.c,
            options: opts,
            correct_answer: item.cor,
            duration_seconds: 15,
            question_type: 'mcq',
            subject: 'Toán Tiếng Anh',
          }
        } else {
          // Đo lường & Số học tiếng Anh
          const numPool = [
            { c: 'How many minutes are there in 1 hour?', opts: ['60 minutes', '100 minutes', '30 minutes', '24 minutes'], cor: 'A' },
            { c: 'Which of the following is an EVEN number?', opts: ['24', '15', '31', '49'], cor: 'A' },
            { c: 'Which of the following is an ODD number?', opts: ['37', '28', '40', '52'], cor: 'A' },
            { c: '1 kilogram (kg) equals how many grams (g)?', opts: ['1000 grams', '100 grams', '10 grams', '500 grams'], cor: 'A' },
          ]
          const item = numPool[i % numPool.length]
          const labels = ['A', 'B', 'C', 'D']
          const opts = item.opts.map((text, idx) => ({ label: labels[idx], text }))
          q = {
            content: item.c,
            options: opts,
            correct_answer: item.cor,
            duration_seconds: 15,
            question_type: 'mcq',
            subject: 'Toán Tiếng Anh',
          }
        }
      } else {
        // True / False Toán Tiếng Anh
        const tfMathPool = [
          { c: 'True or False: A square has 4 equal sides.', isTrue: true },
          { c: 'True or False: 9 times 5 equals 45 (9 × 5 = 45).', isTrue: true },
          { c: 'True or False: 1 hour has 100 minutes.', isTrue: false },
          { c: 'True or False: 15 is an even number.', isTrue: false },
          { c: 'True or False: A triangle has 3 corners.', isTrue: true },
          { c: 'True or False: 50 minus 20 equals 25.', isTrue: false },
          { c: 'True or False: 8 multiplied by 0 equals 0.', isTrue: true },
        ]
        const item = tfMathPool[i % tfMathPool.length]
        q = {
          content: item.c,
          options: [
            { label: 'A', text: 'TRUE (Green Card / Thẻ Xanh)' },
            { label: 'B', text: 'FALSE (Red Card / Thẻ Đỏ)' },
          ],
          correct_answer: item.isTrue ? 'A' : 'B',
          duration_seconds: 15,
          question_type: 'true_false',
          subject: 'Toán Tiếng Anh',
        }
      }
    }

    // ─── 2. Môn Tiếng Anh (English Vocabulary & Grammar) ───
    else if (targetSubject === 'Tiếng Anh' || targetSubject === 'English') {
      if (targetType === 'mcq') {
        const engPoolMCQ = [
          { c: 'What color is the sun?', opts: ['Yellow', 'Blue', 'Green', 'Purple'], cor: 'A' },
          { c: 'Choose the opposite of "BIG":', opts: ['Small', 'Tall', 'Fast', 'Heavy'], cor: 'A' },
          { c: 'What animal says "meow"?', opts: ['Cat', 'Dog', 'Duck', 'Cow'], cor: 'A' },
          { c: 'How many days are there in a week?', opts: ['7 days', '5 days', '10 days', '12 days'], cor: 'A' },
          { c: 'Which of the following is a FRUIT?', opts: ['Apple', 'Carrot', 'Potato', 'Onion'], cor: 'A' },
          { c: 'Complete the sentence: "She _____ a teacher."', opts: ['is', 'are', 'am', 'be'], cor: 'A' },
          { c: 'How do you say "Xin chào" in English?', opts: ['Hello', 'Goodbye', 'Thank you', 'Sorry'], cor: 'A' },
        ]
        const item = engPoolMCQ[i % engPoolMCQ.length]
        const labels = ['A', 'B', 'C', 'D']
        const opts = item.opts.map((text, idx) => ({ label: labels[idx], text }))
        q = {
          content: item.c,
          options: opts,
          correct_answer: item.cor,
          duration_seconds: 15,
          question_type: 'mcq',
          subject: 'Tiếng Anh',
        }
      } else {
        const engPoolTF = [
          { c: 'True or False: An apple is a fruit.', isTrue: true },
          { c: 'True or False: Birds can fly in the sky.', isTrue: true },
          { c: 'True or False: An elephant is smaller than an ant.', isTrue: false },
          { c: 'True or False: Sunday is the first day of the week.', isTrue: true },
          { c: 'True or False: Fish can live outside of water.', isTrue: false },
        ]
        const item = engPoolTF[i % engPoolTF.length]
        q = {
          content: item.c,
          options: [
            { label: 'A', text: 'TRUE (Green Card / Thẻ Xanh)' },
            { label: 'B', text: 'FALSE (Red Card / Thẻ Đỏ)' },
          ],
          correct_answer: item.isTrue ? 'A' : 'B',
          duration_seconds: 15,
          question_type: 'true_false',
          subject: 'Tiếng Anh',
        }
      }
    }

    // ─── 3. Môn Toán học (Tiếng Việt) ───
    else if (targetSubject === 'Toán học') {
      if (targetType === 'mcq') {
        const a = Math.floor(Math.random() * 8) + 2
        const b = Math.floor(Math.random() * 9) + 2
        const op = Math.random() > 0.5 ? '×' : '+'
        const correctVal = op === '×' ? a * b : a + b

        const wrong1 = correctVal + (Math.random() > 0.5 ? 2 : -2)
        const wrong2 = correctVal + 5
        const wrong3 = Math.max(1, correctVal - 4)

        const labels = ['A', 'B', 'C', 'D']
        const shuffledOptions = [
          { label: 'A', text: `${correctVal}` },
          { label: 'B', text: `${wrong1}` },
          { label: 'C', text: `${wrong2}` },
          { label: 'D', text: `${wrong3}` },
        ].sort(() => 0.5 - Math.random())

        shuffledOptions.forEach((opt, idx) => { opt.label = labels[idx] })
        const correctLabel = shuffledOptions.find(o => o.text === `${correctVal}`)?.label || 'A'

        q = {
          content: `${a} ${op} ${b} bằng bao nhiêu?`,
          options: shuffledOptions,
          correct_answer: correctLabel,
          duration_seconds: 15,
          question_type: 'mcq',
          subject: 'Toán học',
        }
      } else {
        const a = Math.floor(Math.random() * 6) + 2
        const b = Math.floor(Math.random() * 6) + 2
        const isTrue = Math.random() > 0.5
        const displayResult = isTrue ? a * b : a * b + 3

        q = {
          content: `Phép tính: ${a} × ${b} = ${displayResult} là ĐÚNG hay SAI?`,
          options: [
            { label: 'A', text: 'ĐÚNG (Thẻ Xanh Lá)' },
            { label: 'B', text: 'SAI (Thẻ Đỏ)' },
          ],
          correct_answer: isTrue ? 'A' : 'B',
          duration_seconds: 15,
          question_type: 'true_false',
          subject: 'Toán học',
        }
      }
    }

    // ─── 4. Môn Tiếng Việt ───
    else if (targetSubject === 'Tiếng Việt') {
      const tvPoolMCQ = [
        { c: 'Từ nào sau đây viết đúng chính tả?', opts: ['Xinh xắn', 'Sinh xắn', 'Xinh sắn', 'Sinh sắn'], cor: 'A' },
        { c: 'Từ nào là từ chỉ hoạt động của học sinh?', opts: ['Đọc sách', 'Bàn ghế', 'Xinh đẹp', 'Bút chì'], cor: 'A' },
        { c: 'Câu "Mặt trời toả ánh nắng chan hoà" thuộc kiểu câu nào?', opts: ['Ai làm gì?', 'Ai là gì?', 'Ai thế nào?', 'Ở đâu?'], cor: 'A' },
        { c: 'Từ trái nghĩa với từ "Cần cù" là:', opts: ['Lười biếng', 'Chăm chỉ', 'Siêng năng', 'Ngoan ngoãn'], cor: 'A' },
        { c: 'Thành ngữ nào nói về tình cảm gia đình?', opts: ['Chị ngã em nâng', 'Uống nước nhớ nguồn', 'Học đi đôi với hành', 'Lá lành đùm lá rách'], cor: 'A' },
      ]

      const tvPoolTF = [
        { c: 'Dấu chấm hỏi (?) dùng để kết thúc câu hỏi.', cor: 'A' },
        { c: 'Từ "dũng cảm" là từ chỉ màu sắc.', cor: 'B' },
        { c: 'Chữ cái đầu câu luôn phải viết hoa.', cor: 'A' },
        { c: 'Từ "chạy nhảy" là từ chỉ đồ vật.', cor: 'B' },
      ]

      if (targetType === 'mcq') {
        const item = tvPoolMCQ[i % tvPoolMCQ.length]
        const labels = ['A', 'B', 'C', 'D']
        const opts = item.opts.map((text, idx) => ({ label: labels[idx], text }))
        q = {
          content: item.c,
          options: opts,
          correct_answer: item.cor,
          duration_seconds: 20,
          question_type: 'mcq',
          subject: 'Tiếng Việt',
        }
      } else {
        const item = tvPoolTF[i % tvPoolTF.length]
        q = {
          content: item.c,
          options: [
            { label: 'A', text: 'ĐÚNG (Thẻ Xanh Lá)' },
            { label: 'B', text: 'SAI (Thẻ Đỏ)' },
          ],
          correct_answer: item.cor,
          duration_seconds: 15,
          question_type: 'true_false',
          subject: 'Tiếng Việt',
        }
      }
    }

    // ─── 5. Môn Tự nhiên & Xã hội ───
    else {
      const tnxPoolMCQ = [
        { c: 'Cơ quan nào trong cơ thể giúp chúng ta hô hấp?', opts: ['Phổi', 'Dạ dày', 'Tim', 'Gan'], cor: 'A' },
        { c: 'Lá cây quang hợp tạo ra khí gì?', opts: ['Khí Oxy', 'Khí Cacbonic', 'Khí Nitơ', 'Hơi nước'], cor: 'A' },
        { c: 'Loài động vật nào sau đây đẻ con?', opts: ['Cá heo', 'Chim bồ câu', 'Cá chép', 'Rùa'], cor: 'A' },
        { c: 'Nước ở thể lỏng chuyển sang thể khí gọi là hiện tượng gì?', opts: ['Bay hơi', 'Đông đặc', 'Ngưng tụ', 'Nóng chảy'], cor: 'A' },
      ]

      const tnxPoolTF = [
        { c: 'Trái Đất quay xung quanh Mặt Trời.', cor: 'A' },
        { c: 'Cá thở bằng phổi khi ở dưới nước.', cor: 'B' },
        { c: 'Mặt Trời mọc ở hướng Đông.', cor: 'A' },
        { c: 'Cây xanh không cần ánh sáng vẫn phát triển tốt.', cor: 'B' },
      ]

      if (targetType === 'mcq') {
        const item = tnxPoolMCQ[i % tnxPoolMCQ.length]
        const labels = ['A', 'B', 'C', 'D']
        const opts = item.opts.map((text, idx) => ({ label: labels[idx], text }))
        q = {
          content: item.c,
          options: opts,
          correct_answer: item.cor,
          duration_seconds: 15,
          question_type: 'mcq',
          subject: 'Tự nhiên & Xã hội',
        }
      } else {
        const item = tnxPoolTF[i % tnxPoolTF.length]
        q = {
          content: item.c,
          options: [
            { label: 'A', text: 'ĐÚNG (Thẻ Xanh Lá)' },
            { label: 'B', text: 'SAI (Thẻ Đỏ)' },
          ],
          correct_answer: item.cor,
          duration_seconds: 15,
          question_type: 'true_false',
          subject: 'Tự nhiên & Xã hội',
        }
      }
    }

    list.push({
      ...q,
      id: `q-gen-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
    })
  }

  return list
}
