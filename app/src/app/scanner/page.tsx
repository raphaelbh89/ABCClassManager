'use client'
// src/app/scanner/page.tsx
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { ScannerControlPanel } from '@/components/scanner/ScannerControlPanel'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

function ScannerContent() {
  const searchParams = useSearchParams()
  const codeParam = searchParams.get('code') || ''

  const [inputCode, setInputCode] = useState(codeParam)
  const [activeCode, setActiveCode] = useState(codeParam.toUpperCase())

  const { isConnected, broadcast } = useRealtimeSync(activeCode || null)

  if (!activeCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <Card padding="md" className="max-w-sm w-full text-center flex flex-col gap-4">
          <div className="text-5xl mb-1">📱</div>
          <h1 className="text-xl font-bold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
            Điều Khiển & Quét Thẻ (Scanner Mode)
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Nhập Room Code của lớp để bắt đầu điều khiển luồng tiết học.
          </p>
          <input
            type="text"
            placeholder="Mã phòng (VD: ABC123)"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="p-3 text-center text-xl font-mono font-extrabold tracking-widest uppercase border rounded-xl"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <Button
            size="md"
            onClick={() => setActiveCode(inputCode.trim().toUpperCase())}
            disabled={!inputCode.trim()}
          >
            Kết nối
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-[var(--color-bg)]">
      <ScannerControlPanel roomCode={activeCode} onBroadcast={broadcast} />
    </div>
  )
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải trang điều khiển...</div>}>
      <ScannerContent />
    </Suspense>
  )
}
