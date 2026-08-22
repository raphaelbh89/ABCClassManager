'use client'
// src/components/scanner/ScannerControlPanel.tsx
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { CardScannerModal } from './CardScannerModal'
import {
  Play,
  Clock,
  Camera,
  CheckCircle2,
  Trophy,
  Sparkles,
  RotateCcw,
  Send,
} from 'lucide-react'
import type { RealtimeEvent } from '@/services/sync'

interface ScannerControlPanelProps {
  roomCode: string
  onBroadcast: (event: RealtimeEvent) => Promise<void>
}

// Bộ câu hỏi mẫu để test ngay
const SAMPLE_QUESTIONS = [
  {
    content: '5 × 6 bằng bao nhiêu?',
    options: [
      { label: 'A', text: '25' },
      { label: 'B', text: '30' },
      { label: 'C', text: '35' },
      { label: 'D', text: '40' },
    ],
    correctAnswer: 'B',
  },
  {
    content: 'Thủ đô của Việt Nam là thành phố nào?',
    options: [
      { label: 'A', text: 'Hồ Chí Minh' },
      { label: 'B', text: 'Đà Nẵng' },
      { label: 'C', text: 'Hà Nội' },
      { label: 'D', text: 'Hải Phòng' },
    ],
    correctAnswer: 'C',
  },
  {
    content: 'Từ nào sau đây viết đúng chính tả?',
    options: [
      { label: 'A', text: 'Xinh đẹp' },
      { label: 'B', text: 'Sinh đẹp' },
      { label: 'C', text: 'Sanh đẹp' },
      { label: 'D', text: 'Xênh đẹp' },
    ],
    correctAnswer: 'A',
  },
]

export function ScannerControlPanel({ roomCode, onBroadcast }: ScannerControlPanelProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  const currentQ = SAMPLE_QUESTIONS[currentIdx]

  // Đẩy câu hỏi lên màn chiếu
  const handleSendQuestion = async () => {
    setIsRevealed(false)
    setIsTimerRunning(false)
    await onBroadcast({
      type: 'SHOW_QUESTION',
      question: currentQ,
      index: currentIdx + 1,
      total: SAMPLE_QUESTIONS.length,
    })
  }

  // Bắt đầu đếm ngược 15s
  const handleStartTimer = async () => {
    setIsTimerRunning(true)
    await onBroadcast({
      type: 'START_TIMER',
      seconds: 15,
    })
  }

  // Nhận kết quả quét từ Camera thật
  const handleScanConfirm = async (counts: { red: number; green: number; yellow: number; blue: number }) => {
    await onBroadcast({
      type: 'SCAN_PREVIEW',
      counts,
    })
  }

  // Mở đáp án chính xác
  const handleRevealAnswer = async () => {
    setIsRevealed(true)
    await onBroadcast({
      type: 'REVEAL_ANSWER',
      correctAnswer: currentQ.correctAnswer,
      isCorrectColor: currentQ.correctAnswer === 'B' ? 'green' : 'blue',
    })
  }

  // Bật Leaderboard
  const handleShowLeaderboard = async () => {
    await onBroadcast({
      type: 'UPDATE_LEADERBOARD',
      leaderboard: [
        { id: '1', name: 'Nguyễn Văn An', score: 120 },
        { id: '2', name: 'Trần Thị Bình', score: 105 },
        { id: '3', name: 'Lê Hoàng Cúc', score: 90 },
        { id: '4', name: 'Phạm Minh Đức', score: 85 },
      ],
    })
  }

  // Bắn pháo hoa khích lệ
  const handleConfetti = async () => {
    await onBroadcast({
      type: 'TRIGGER_CONFETTI',
    })
  }

  // Đặt lại màn hình
  const handleReset = async () => {
    await onBroadcast({
      type: 'RESET_VIEW',
    })
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4 pb-16">
      {/* Header trạng thái */}
      <div className="bg-white p-4 rounded-2xl border border-[var(--color-border)] shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-[var(--color-text-muted)] font-semibold block">
            Đang kết nối phòng
          </span>
          <span className="text-xl font-black text-[var(--color-accent)] font-mono">
            {roomCode}
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          Real-time Đồng bộ
        </div>
      </div>

      {/* Bộ chọn câu hỏi */}
      <Card padding="md" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-[var(--color-text)]">
            Câu hỏi hiện tại ({currentIdx + 1}/{SAMPLE_QUESTIONS.length})
          </span>
          <div className="flex gap-1">
            {SAMPLE_QUESTIONS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
                  currentIdx === i
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-slate-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <p className="font-extrabold text-base text-[var(--color-text)] bg-[var(--color-surface-alt)] p-3 rounded-xl">
          {currentQ.content}
        </p>

        {/* Nút gửi câu hỏi lên màn chiếu */}
        <Button onClick={handleSendQuestion} size="lg" leftIcon={<Send size={18} />}>
          📺 Đẩy câu hỏi lên màn chiếu TV
        </Button>
      </Card>

      {/* Điều khiển luồng câu hỏi */}
      <Card padding="md" className="flex flex-col gap-3">
        <span className="text-xs font-bold text-[var(--color-text-muted)]">
          BƯỚC THAO TÁC TRONG GIỜ HỌC
        </span>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={handleStartTimer}
            leftIcon={<Clock size={16} />}
            disabled={isTimerRunning}
          >
            ⏱️ Đếm ngược 15s
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<Camera size={16} />}
          >
            📸 Bật Camera Quét Thẻ
          </Button>
        </div>

        <Button
          variant="primary"
          onClick={handleRevealAnswer}
          leftIcon={<CheckCircle2 size={18} />}
          disabled={isRevealed}
          className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]"
        >
          ✨ Mở đáp án ({currentQ.correctAnswer}) + Thưởng điểm
        </Button>
      </Card>

      {/* Tính năng phụ trợ */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowLeaderboard}
          leftIcon={<Trophy size={14} />}
        >
          Top Điểm
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConfetti}
          leftIcon={<Sparkles size={14} />}
        >
          Pháo hoa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          leftIcon={<RotateCcw size={14} />}
        >
          Làm mới
        </Button>
      </div>

      {/* Modal Camera quét thẻ thật */}
      <CardScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onConfirm={handleScanConfirm}
      />
    </div>
  )
}
