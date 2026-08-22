'use client'
// src/app/display/page.tsx
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { DisplayScreen } from '@/components/display/DisplayScreen'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

function DisplayContent() {
  const searchParams = useSearchParams()
  const codeParam = searchParams.get('code') || ''

  const [inputCode, setInputCode] = useState(codeParam)
  const [activeCode, setActiveCode] = useState(codeParam.toUpperCase())

  const { isConnected, lastEvent } = useRealtimeSync(activeCode || null)

  if (!activeCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-bg)]">
        <Card padding="lg" className="max-w-md w-full text-center flex flex-col gap-4">
          <div className="text-6xl mb-2">📺</div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Màn Chiếu TV (Display Mode)
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Nhập Room Code của lớp học để kết nối và nhận tín hiệu câu hỏi từ điện thoại giáo viên.
          </p>
          <input
            type="text"
            placeholder="VD: ABC123"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="p-3 text-center text-2xl font-mono font-extrabold tracking-widest uppercase border rounded-xl"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <Button
            size="lg"
            onClick={() => setActiveCode(inputCode.trim().toUpperCase())}
            disabled={!inputCode.trim()}
          >
            🚀 Kết nối Màn Chiếu
          </Button>
        </Card>
      </div>
    )
  }

  return <DisplayScreen roomCode={activeCode} lastEvent={lastEvent} />
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải màn chiếu...</div>}>
      <DisplayContent />
    </Suspense>
  )
}
