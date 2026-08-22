'use client'
// src/components/scanner/ScannerControlPanel.tsx
// Bảng Điều Khiển Quét Thẻ & Luồng Trò Chơi trên Mobile
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
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
  RefreshCw,
  HelpCircle,
  Layers,
  ChevronLeft,
  ChevronRight,
  Flame,
  Swords,
  Users,
  ShieldAlert,
} from 'lucide-react'
import type { RealtimeEvent } from '@/services/sync'

interface ScannerControlPanelProps {
  roomCode: string
  onBroadcast: (event: RealtimeEvent) => Promise<void>
}

interface QuestionItem {
  id: string
  content: string
  options: Array<{ label: string; text: string }>
  correctAnswer: string
  subject?: string
  grade?: number
  question_type?: string
}

// Chế độ game nhãn đẹp
const GAME_MODE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  classic: { label: '🏆 Cá Nhân', icon: Trophy, color: 'bg-amber-50 text-amber-800 border-amber-300' },
  arena: { label: '⚔️ Đấu Trường 1v1', icon: Swords, color: 'bg-red-50 text-red-800 border-red-300' },
  team: { label: '👥 Đấu Đội Nhóm', icon: Users, color: 'bg-blue-50 text-blue-800 border-blue-300' },
  boss: { label: '🐉 Đánh Boss', icon: ShieldAlert, color: 'bg-purple-50 text-purple-800 border-purple-300' },
}

// Fallback questions mẫu khi chưa có session
const DEFAULT_QUESTIONS: QuestionItem[] = [
  {
    id: 'sample-1',
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
    id: 'sample-2',
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
    id: 'sample-3',
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
  const [questions, setQuestions] = useState<QuestionItem[]>(DEFAULT_QUESTIONS)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [gameSession, setGameSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [lastScanCounts, setLastScanCounts] = useState<{ red: number; green: number; yellow: number; blue: number } | null>(null)

  // Hàm tải dữ liệu Game Session thật từ database theo roomCode
  const fetchSessionData = useCallback(async () => {
    if (!roomCode) return
    setIsLoadingSession(true)
    try {
      const res = await fetch(`/api/games?roomCode=${encodeURIComponent(roomCode.trim().toUpperCase())}`)
      if (res.ok) {
        const session = await res.json()
        setGameSession(session)

        const rawQuestions = session?.template?.questions || []
        if (Array.isArray(rawQuestions) && rawQuestions.length > 0) {
          const normalized: QuestionItem[] = rawQuestions.map((q: any, idx: number) => {
            let options = q.options
            if (typeof options === 'string') {
              try { options = JSON.parse(options) } catch {}
            }

            // Nếu options là mảng chuỗi đơn giản
            if (Array.isArray(options) && typeof options[0] === 'string') {
              const labels = ['A', 'B', 'C', 'D', 'E', 'F']
              options = options.map((text: string, i: number) => ({
                label: labels[i] || `${i + 1}`,
                text: String(text),
              }))
            } else if (!Array.isArray(options) || options.length === 0) {
              // Mặc định nếu là Đúng/Sai
              if (q.question_type === 'true_false' || q.question_type === 'truefalse') {
                options = [
                  { label: 'A', text: 'Đúng (True)' },
                  { label: 'B', text: 'Sai (False)' },
                ]
              } else {
                options = [
                  { label: 'A', text: 'Phương án A' },
                  { label: 'B', text: 'Phương án B' },
                  { label: 'C', text: 'Phương án C' },
                  { label: 'D', text: 'Phương án D' },
                ]
              }
            }

            return {
              id: q.id || `q-${idx}`,
              content: q.content || q.title || q.question || 'Câu hỏi',
              options,
              correctAnswer: q.correct_answer || q.correctAnswer || 'A',
              subject: q.subject,
              grade: q.grade,
              question_type: q.question_type || 'mcq',
            }
          })

          setQuestions(normalized)
          setCurrentIdx(0)
          setIsRevealed(false)
          setIsTimerRunning(false)
        }
      }
    } catch (err) {
      console.error('Failed to load game session for room', roomCode, err)
    } finally {
      setIsLoadingSession(false)
    }
  }, [roomCode])

  // Tự động load dữ liệu khi vào trang
  useEffect(() => {
    fetchSessionData()
  }, [fetchSessionData])

  const currentQ = questions[currentIdx] || DEFAULT_QUESTIONS[0]
  const gameModeInfo = GAME_MODE_LABELS[gameSession?.game_type] || GAME_MODE_LABELS.classic

  // 1. Đẩy câu hỏi lên màn chiếu TV
  const handleSendQuestion = async () => {
    setIsRevealed(false)
    setIsTimerRunning(false)
    setLastScanCounts(null)
    await onBroadcast({
      type: 'SHOW_QUESTION',
      question: {
        id: currentQ.id,
        content: currentQ.content,
        options: currentQ.options,
        correctAnswer: currentQ.correctAnswer,
        question_type: currentQ.question_type,
      },
      index: currentIdx + 1,
      total: questions.length,
    })
  }

  // 2. Bắt đầu đếm ngược 15s
  const handleStartTimer = async (seconds = 15) => {
    setIsTimerRunning(true)
    await onBroadcast({
      type: 'START_TIMER',
      seconds,
    })
  }

  // 3. Nhận kết quả quét thẻ từ Camera thật
  const handleScanConfirm = async (counts: { red: number; green: number; yellow: number; blue: number }) => {
    setLastScanCounts(counts)
    await onBroadcast({
      type: 'SCAN_PREVIEW',
      counts,
    })
  }

  // 4. Mở đáp án chính xác
  const handleRevealAnswer = async () => {
    setIsRevealed(true)
    const colorMap: Record<string, string> = { A: 'red', B: 'green', C: 'yellow', D: 'blue' }
    await onBroadcast({
      type: 'REVEAL_ANSWER',
      correctAnswer: currentQ.correctAnswer,
      isCorrectColor: colorMap[currentQ.correctAnswer] || 'green',
    })
  }

  // 5. Bật Bảng Xếp Hạng Leaderboard
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

  // 6. Bắn pháo hoa khích lệ
  const handleConfetti = async () => {
    await onBroadcast({
      type: 'TRIGGER_CONFETTI',
    })
  }

  // 7. Đặt lại màn hình TV
  const handleReset = async () => {
    setIsRevealed(false)
    setIsTimerRunning(false)
    setLastScanCounts(null)
    await onBroadcast({
      type: 'RESET_VIEW',
    })
  }

  // Chuyển câu hỏi trước/sau
  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1)
      setIsRevealed(false)
      setIsTimerRunning(false)
    }
  }

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1)
      setIsRevealed(false)
      setIsTimerRunning(false)
    }
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-3 pb-16">
      {/* Header trạng thái phòng */}
      <div className="bg-white p-3.5 rounded-2xl border border-[var(--color-border)] shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] text-[var(--color-text-muted)] font-semibold block">
            Mã phòng điều khiển
          </span>
          <span className="text-2xl font-black text-[var(--color-primary)] font-mono tracking-wider">
            {roomCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSessionData}
            disabled={isLoadingSession}
            className="p-2 rounded-xl border bg-[var(--color-surface-alt)] hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Tải lại câu hỏi từ phiên trò chơi mới nhất"
          >
            <RefreshCw size={14} className={isLoadingSession ? 'animate-spin text-[var(--color-primary)]' : ''} />
            <span>Làm mới</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-200">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            Đồng bộ
          </div>
        </div>
      </div>

      {/* Thông tin trò chơi & Môn học */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${gameModeInfo.color}`}>
            <span>{gameModeInfo.label}</span>
          </span>
          {currentQ.subject && (
            <Badge variant="secondary">
              📚 {currentQ.subject}
            </Badge>
          )}
        </div>
        <span className="text-xs font-bold text-[var(--color-text-muted)]">
          Đã tải {questions.length} câu hỏi
        </span>
      </div>

      {/* Card Hiển thị Câu hỏi & Thao tác chuyển câu */}
      <Card padding="md" className="flex flex-col gap-3 border shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
          <div className="flex items-center gap-1.5">
            <HelpCircle size={17} className="text-[var(--color-primary)]" />
            <span className="text-sm font-black text-[var(--color-text)]">
              Câu {currentIdx + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIdx === 0}
              className="p-1.5 rounded-lg border bg-[var(--color-surface-alt)] disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextQuestion}
              disabled={currentIdx === questions.length - 1}
              className="p-1.5 rounded-lg border bg-[var(--color-surface-alt)] disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Thanh chọn nhanh số câu */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIdx(i)
                setIsRevealed(false)
                setIsTimerRunning(false)
              }}
              className={`w-7 h-7 flex-shrink-0 rounded-lg font-bold text-xs transition-all ${
                currentIdx === i
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-slate-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Nội dung câu hỏi */}
        <div className="bg-[var(--color-surface-alt)] p-3.5 rounded-xl border border-slate-200">
          <p className="font-extrabold text-sm sm:text-base text-[var(--color-text)] leading-snug">
            {currentQ.content}
          </p>
        </div>

        {/* Danh sách các phương án */}
        <div className="grid grid-cols-2 gap-2">
          {currentQ.options.map(opt => {
            const isCorrect = isRevealed && opt.label === currentQ.correctAnswer
            return (
              <div
                key={opt.label}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isCorrect
                    ? 'bg-green-100 border-green-500 text-green-900 ring-2 ring-green-400'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="font-black mr-1 text-[var(--color-primary)]">{opt.label}.</span>
                <span>{opt.text}</span>
              </div>
            )
          })}
        </div>

        {/* Nút gửi câu hỏi lên TV */}
        <Button
          onClick={handleSendQuestion}
          size="lg"
          leftIcon={<Send size={18} />}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-black shadow-md"
        >
          📺 Đẩy câu này lên màn chiếu TV
        </Button>
      </Card>

      {/* Điều khiển luồng trong giờ học */}
      <Card padding="md" className="flex flex-col gap-2.5 border shadow-sm">
        <span className="text-[11px] font-black tracking-wider text-[var(--color-text-muted)] uppercase">
          ⚡ Thao Tác Trong Tiết Học
        </span>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => handleStartTimer(15)}
            leftIcon={<Clock size={16} />}
            disabled={isTimerRunning}
            className="font-bold text-xs"
          >
            ⏱️ Đếm ngược 15s
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<Camera size={16} />}
            className="font-bold text-xs border border-slate-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
          >
            📸 Quét Thẻ Màu
          </Button>
        </div>

        {/* Thống kê quét thẻ gần nhất nếu có */}
        {lastScanCounts && (
          <div className="flex justify-between items-center bg-slate-100 px-3 py-1.5 rounded-xl text-xs font-bold">
            <span className="text-slate-500">Đã quét:</span>
            <div className="flex gap-2">
              <span className="text-red-600">🔴 {lastScanCounts.red}</span>
              <span className="text-green-600">🟢 {lastScanCounts.green}</span>
              <span className="text-amber-600">🟡 {lastScanCounts.yellow}</span>
              <span className="text-blue-600">🔵 {lastScanCounts.blue}</span>
            </div>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleRevealAnswer}
          leftIcon={<CheckCircle2 size={18} />}
          disabled={isRevealed}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md text-sm py-3"
        >
          {isRevealed
            ? `✓ Đã mở đáp án đúng: [ ${currentQ.correctAnswer} ]`
            : `✨ Mở đáp án đúng (${currentQ.correctAnswer}) + Thưởng sao`}
        </Button>
      </Card>

      {/* Công cụ bổ trợ nhanh */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleShowLeaderboard}
          leftIcon={<Trophy size={14} />}
          className="font-bold text-xs border bg-white"
        >
          Top Điểm
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleConfetti}
          leftIcon={<Sparkles size={14} />}
          className="font-bold text-xs border bg-white"
        >
          Pháo hoa
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          leftIcon={<RotateCcw size={14} />}
          className="font-bold text-xs border bg-white"
        >
          Xoá màn hình
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
