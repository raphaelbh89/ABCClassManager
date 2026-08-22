import { NextResponse } from 'next/server'

const GEMINI_MODELS_TO_TRY = [
  { version: 'v1beta', model: 'gemini-1.5-flash' },
  { version: 'v1beta', model: 'gemini-2.0-flash' },
  { version: 'v1beta', model: 'gemini-2.0-flash-exp' },
  { version: 'v1',     model: 'gemini-1.5-flash' },
  { version: 'v1beta', model: 'gemini-1.5-pro' },
  { version: 'v1beta', model: 'gemini-pro' },
]

export async function POST(req: Request) {
  try {
    const { provider = 'gemini', apiKey = '', customBaseUrl = '', customModel = '' } = await req.json()

    if (!apiKey || apiKey.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'API Key không được để trống hoặc quá ngắn.' }, { status: 400 })
    }

    const testPrompt = 'Hi! Please reply with 3 words.'

    // 1. Google Gemini (Tự động thử các model và version khác nhau)
    if (provider === 'gemini') {
      const cleanKey = apiKey.trim()
      const start = Date.now()
      let lastError = ''
      let successfulModel = ''
      let replyText = ''

      // Thử danh sách các model phổ biến
      for (const item of GEMINI_MODELS_TO_TRY) {
        try {
          const url = `https://generativelanguage.googleapis.com/${item.version}/models/${item.model}:generateContent?key=${cleanKey}`
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: testPrompt }] }],
            }),
          })

          if (res.ok) {
            const data = await res.json()
            replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK'
            successfulModel = `${item.model} (${item.version})`
            break
          } else {
            const errText = await res.text()
            lastError = `[${item.model}] HTTP ${res.status}: ${errText}`
          }
        } catch (e: any) {
          lastError = e.message
        }
      }

      // Nếu vẫn chưa được, thử query danh sách model được cấp phép của key
      if (!successfulModel) {
        try {
          const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`)
          if (listRes.ok) {
            const listData = await listRes.json()
            const models = listData?.models || []
            const validModel = models.find((m: any) =>
              m.supportedGenerationMethods?.includes('generateContent') &&
              (m.name.includes('flash') || m.name.includes('pro') || m.name.includes('gemini'))
            )
            if (validModel) {
              const modelName = validModel.name.replace('models/', '')
              const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`
              const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: testPrompt }] }],
                }),
              })
              if (res.ok) {
                const data = await res.json()
                replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK'
                successfulModel = modelName
              }
            }
          }
        } catch {}
      }

      if (successfulModel) {
        return NextResponse.json({
          success: true,
          message: `Kết nối Google Gemini thành công! (Mô hình: ${successfulModel})`,
          latency: `${Date.now() - start}ms`,
          reply: replyText.trim(),
        })
      } else {
        return NextResponse.json({
          success: false,
          error: `Gemini API lỗi: ${lastError}`,
        }, { status: 400 })
      }
    }

    // 2. OpenAI ChatGPT
    if (provider === 'openai') {
      const start = Date.now()
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 20,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json({ success: false, error: `OpenAI API lỗi (${res.status}): ${errText}` }, { status: 400 })
      }

      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content || 'OK'
      return NextResponse.json({
        success: true,
        message: 'Kết nối OpenAI ChatGPT thành công! (Mô hình gpt-4o-mini)',
        latency: `${Date.now() - start}ms`,
        reply: reply.trim(),
      })
    }

    // 3. Groq
    if (provider === 'groq') {
      const start = Date.now()
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 20,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json({ success: false, error: `Groq API lỗi (${res.status}): ${errText}` }, { status: 400 })
      }

      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content || 'OK'
      return NextResponse.json({
        success: true,
        message: 'Kết nối Groq thành công! (Mô hình Llama 3.3 70B)',
        latency: `${Date.now() - start}ms`,
        reply: reply.trim(),
      })
    }

    // 4. Custom Endpoint (DeepSeek, OpenRouter, Ollama...)
    if (provider === 'custom') {
      const baseUrl = customBaseUrl.trim() || 'https://api.deepseek.com/v1'
      const model = customModel.trim() || 'deepseek-chat'
      const start = Date.now()

      const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 20,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json({ success: false, error: `Custom API lỗi (${res.status}): ${errText}` }, { status: 400 })
      }

      const data = await res.json()
      const reply = data?.choices?.[0]?.message?.content || 'OK'
      return NextResponse.json({
        success: true,
        message: `Kết nối Custom API (${model}) thành công!`,
        latency: `${Date.now() - start}ms`,
        reply: reply.trim(),
      })
    }

    return NextResponse.json({ success: false, error: 'Provider không hợp lệ' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
