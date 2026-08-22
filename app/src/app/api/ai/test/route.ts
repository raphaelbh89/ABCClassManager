import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { provider = 'gemini', apiKey = '', customBaseUrl = '', customModel = '' } = await req.json()

    if (!apiKey || apiKey.trim().length < 5) {
      return NextResponse.json({ success: false, error: 'API Key không được để trống hoặc quá ngắn.' }, { status: 400 })
    }

    const testPrompt = 'Hãy chào bằng tiếng Anh ngắn gọn 3 từ.'

    // 1. Google Gemini
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`
      const start = Date.now()
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testPrompt }] }],
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json({ success: false, error: `Gemini API lỗi (${res.status}): ${errText}` }, { status: 400 })
      }

      const data = await res.json()
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'OK'
      return NextResponse.json({
        success: true,
        message: 'Kết nối Google Gemini thành công! (Mô hình gemini-1.5-flash)',
        latency: `${Date.now() - start}ms`,
        reply: reply.trim(),
      })
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
