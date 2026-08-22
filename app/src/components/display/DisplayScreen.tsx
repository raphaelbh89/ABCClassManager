'use client'
// src/components/display/DisplayScreen.tsx
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import { Trophy, Clock, Sparkles } from 'lucide-react'
import type { RealtimeEvent } from '@/services/sync'

interface DisplayScreenProps {
  roomCode: string
  lastEvent: RealtimeEvent | null
}

const OPTION_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  A: { bg: '#FF5252', border: '#D32F2F', text: '#FFFFFF', label: '🔴 Thẻ Đỏ' },
  B: { bg: '#4CAF82', border: '#358A62', text: '#FFFFFF', label: '🟢 Thẻ Xanh Lá' },
  C: { bg: '#FFB347', border: '#E0922A', text: '#FFFFFF', label: '🟡 Thẻ Vàng' },
  D: { bg: '#29B6F6', border: '#0288D1', text: '#FFFFFF', label: '🔵 Thẻ Xanh Dương' },
}

export function DisplayScreen({ roomCode, lastEvent }: DisplayScreenProps) {
  const [currentQuestion, setCurrentQuestion] = useState<any>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null)
  const [scanCounts, setScanCounts] = useState<{ red: number; green: number; yellow: number; blue: number } | null>(null)
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null)

  // Xử lý sự kiện Realtime gửi từ điện thoại GV
  useEffect(() => {
    if (!lastEvent) return

    switch (lastEvent.type) {
      case 'SHOW_QUESTION':
        setCurrentQuestion(lastEvent.question)
        setQuestionIndex(lastEvent.index)
        setTotalQuestions(lastEvent.total)
        setRevealedAnswer(null)
        setScanCounts(null)
        setLeaderboard(null)
        setTimeLeft(null)
        break

      case 'START_TIMER':
        setTimeLeft(lastEvent.seconds)
        break

      case 'STOP_TIMER':
        setTimeLeft(null)
        break

      case 'SCAN_PREVIEW':
        setScanCounts(lastEvent.counts)
        break

      case 'REVEAL_ANSWER':
        setRevealedAnswer(lastEvent.correctAnswer)
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        })
        break

      case 'TRIGGER_CONFETTI':
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
        })
        break

      case 'UPDATE_LEADERBOARD':
        setLeaderboard(lastEvent.leaderboard)
        break

      case 'RESET_VIEW':
        setCurrentQuestion(null)
        setRevealedAnswer(null)
        setScanCounts(null)
        setLeaderboard(null)
        setTimeLeft(null)
        break
    }
  }, [lastEvent])

  // Countdown timer tự động giảm
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  return (
    <div
      className="min-h-screen flex flex-col justify-between p-8 text-[var(--color-text)] select-none"
      style={{
        background: 'radial-gradient(circle at 50% 20%, #FFFDE7, #E8F5E9)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Top Bar: Room Code + Timer */}
      <div className="flex items-center justify-between pb-6 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🦉</span>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              ClassManager Pro
            </h1>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">
              Màn Chiếu Lớp Học (Display Mode)
            </p>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-4">
          {timeLeft !== null && (
            <div
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-2xl shadow-md transition-all ${
                timeLeft <= 5 ? 'bg-red-500 text-white animate-bounce' : 'bg-white text-[var(--color-primary)] border border-[var(--color-primary)]'
              }`}
            >
              <Clock size={24} />
              <span>{timeLeft}s</span>
            </div>
          )}

          <div className="bg-white px-5 py-2 rounded-2xl border border-[var(--color-border)] shadow-sm text-right">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold block">
              Mã phòng kết nối
            </span>
            <span className="text-2xl font-extrabold tracking-widest text-[var(--color-accent)] font-mono">
              {roomCode}
            </span>
          </div>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="flex-1 flex flex-col justify-center my-6">
        {leaderboard ? (
          // Bảng xếp hạng Top học sinh
          <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl p-8 border border-[var(--color-border)] shadow-xl">
            <div className="text-center mb-6">
              <Trophy size={48} className="mx-auto mb-2 text-[var(--color-secondary)]" />
              <h2 className="text-3xl font-extrabold text-[var(--color-secondary)]" style={{ fontFamily: 'var(--font-heading)' }}>
                BẢNG VINH DANH LỚP HỌC 🏆
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {leaderboard.slice(0, 5).map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-2xl font-bold text-xl border transition-all ${
                    idx === 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-md scale-105'
                      : idx === 1
                      ? 'bg-slate-50 border-slate-300 text-slate-800'
                      : 'bg-white border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-2xl font-black">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[var(--color-primary)] font-extrabold">
                    {item.score} điểm
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : currentQuestion ? (
          // Màn hình hiển thị câu hỏi
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
            {/* Header Câu hỏi */}
            <div className="bg-white rounded-3xl p-8 border border-[var(--color-border)] shadow-lg text-center relative overflow-hidden">
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold bg-[var(--color-surface-alt)] text-[var(--color-primary)] mb-3">
                Câu hỏi {questionIndex}/{totalQuestions}
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold leading-snug text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {currentQuestion.content}
              </h2>
            </div>

            {/* Các lựa chọn đáp án */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(currentQuestion.options || []).map((opt: any) => {
                const optStyle = OPTION_COLORS[opt.label] || OPTION_COLORS['A']
                const isRevealed = revealedAnswer === opt.label
                const isWrong = revealedAnswer && !isRevealed

                return (
                  <div
                    key={opt.label}
                    className={`relative p-6 rounded-2xl border-4 font-bold text-2xl flex items-center gap-5 transition-all shadow-md ${
                      isRevealed
                        ? 'ring-8 ring-green-400 scale-105 shadow-2xl animate-pulse'
                        : isWrong
                        ? 'opacity-40 grayscale'
                        : ''
                    }`}
                    style={{
                      background: optStyle.bg,
                      borderColor: optStyle.border,
                      color: optStyle.text,
                    }}
                  >
                    <span className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-3xl font-black flex-shrink-0">
                      {opt.label}
                    </span>
                    <span className="flex-1 leading-normal">{opt.text}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/20 absolute top-3 right-3">
                      {optStyle.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Thống kê quét thẻ tạm thời */}
            {scanCounts && (
              <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-[var(--color-border)] flex items-center justify-around font-bold text-lg">
                <span className="text-[var(--color-text-muted)] text-sm">Kết quả giơ thẻ:</span>
                <span className="text-red-500">🔴 {scanCounts.red}</span>
                <span className="text-green-600">🟢 {scanCounts.green}</span>
                <span className="text-amber-500">🟡 {scanCounts.yellow}</span>
                <span className="text-blue-500">🔵 {scanCounts.blue}</span>
              </div>
            )}
          </div>
        ) : (
          // Màn hình chờ kết nối / Chưa bắt đầu
          <div className="text-center max-w-xl mx-auto flex flex-col items-center gap-4 py-16">
            <div className="text-8xl animate-bounce">📡</div>
            <h2
              className="text-4xl font-extrabold text-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Sẵn sàng cho tiết học!
            </h2>
            <p className="text-lg text-[var(--color-text-muted)]">
              Giáo viên mở ứng dụng trên điện thoại (Scanner Mode), nhập mã phòng{' '}
              <strong className="text-[var(--color-accent)] font-mono text-xl">{roomCode}</strong> để bắt đầu điều khiển câu hỏi.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs font-semibold text-[var(--color-text-muted)]">
        ClassManager Pro · Trải nghiệm học tập tương tác Game hóa
      </div>
    </div>
  )
}
