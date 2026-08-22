'use client'
// src/components/scanner/ScannerControlPanel.tsx
// Bảng Điều Khiển Mobile: Tùy Chỉnh Thời Gian Đếm Ngược & Tự Động Chạy Timer
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
  ChevronLeft,
  ChevronRight,
  Swords,
  Users,
  ShieldAlert,
  Sliders,
  Zap,
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

// Các mốc thời gian đếm ngược phổ biến
const TIMER_PRESETS = [10, 15, 20, 30, 45, 60]

const GAME_MODE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  classic: { label: '🏆 Cá Nhân', icon: Trophy, color: 'bg-amber-50 text-amber-800 border-amber-300' },
  arena: { label: '⚔️ Đấu Trường 1v1', icon: Swords, color: 'bg-red-50 text-red-800 border-red-300' },
  team: { label: '👥 Đấu Đội Nhóm', icon: Users, color: 'bg-blue-50 text-blue-800 border-blue-300' },
  boss: { label: '🐉 Đánh Boss', icon: ShieldAlert, color: 'bg-purple-50 text-purple-800 border-purple-300' },
}

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

  // Cài đặt thời gian đếm ngược & Tự động chạy
  const [countdownSeconds, setCountdownSeconds] = useState<number>(15)
  const [autoStartTimer, setAutoStartTimer] = useState<boolean>(true)
  const [showSettings, setShowSettings] = useState<boolean>(false)

  // Load cấu hình thời gian từ localStorage
  useEffect(() => {
    try {
      const savedDuration = localStorage.getItem('classmanager_timer_duration')
      if (savedDuration) setCountdownSeconds(Number(savedDuration))

      const savedAuto = localStorage.getItem('classmanager_auto_timer')
      if (savedAuto !== null) setAutoStartTimer(savedAuto === 'true')
    } catch {}
  }, [])

  const handleUpdateDuration = (sec: number) => {
    setCountdownSeconds(sec)
    try {
      localStorage.setItem('classmanager_timer_duration', String(sec))
    } catch {}
  }

  const handleToggleAutoTimer = () => {
    const nextVal = !autoStartTimer
    setAutoStartTimer(nextVal)
    try {
      localStorage.setItem('classmanager_auto_timer', String(nextVal))
    } catch {}
  }

  // Tải dữ liệu Game Session thật từ database theo roomCode
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

            if (Array.isArray(options) && typeof options[0] === 'string') {
              const labels = ['A', 'B', 'C', 'D', 'E', 'F']
              options = options.map((text: string, i: number) => ({
                label: labels[i] || `${i + 1}`,
                text: String(text),
              }))
            } else if (!Array.isArray(options) || options.length === 0) {
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

  useEffect(() => {
    fetchSessionData()
  }, [fetchSessionData])

  const currentQ = questions[currentIdx] || DEFAULT_QUESTIONS[0]
  const gameModeInfo = GAME_MODE_LABELS[gameSession?.game_type] || GAME_MODE_LABELS.classic

  // 1. Đẩy câu hỏi lên màn chiếu TV (và TỰ ĐỘNG CHẠY ĐỒNG HỒ nếu bật Auto-Timer)
  const sendQuestionToTV = async (targetIndex: number) => {
    const q = questions[targetIndex]
    if (!q) return

    setIsRevealed(false)
    setIsTimerRunning(false)
    setLastScanCounts(null)

    // Phát câu hỏi
    await onBroadcast({
      type: 'SHOW_QUESTION',
      question: {
        id: q.id,
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        question_type: q.question_type,
      },
      index: targetIndex + 1,
      total: questions.length,
    })

    // Tự động kích hoạt đồng hồ đếm ngược
    if (autoStartTimer) {
      setIsTimerRunning(true)
      await onBroadcast({
        type: 'START_TIMER',
        seconds: countdownSeconds,
      })
    }
  }

  // Đẩy câu hỏi hiện tại
  const handleSendCurrentQuestion = async () => {
    await sendQuestionToTV(currentIdx)
  }

  // Chuyển sang câu tiếp theo và tự động phát + đếm ngược
  const handleNextQuestionAndSend = async () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      await sendQuestionToTV(nextIdx)
    }
  }

  // Chuyển sang câu trước đó
  const handlePrevQuestion = async () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1
      setCurrentIdx(prevIdx)
      await sendQuestionToTV(prevIdx)
    }
  }

  // 2. Kích hoạt đếm ngược thủ công
  const handleStartTimer = async (seconds = countdownSeconds) => {
    setIsTimerRunning(true)
    await onBroadcast({
      type: 'START_TIMER',
      seconds,
    })
  }

  // 3. Quét thẻ camera
  const handleScanConfirm = async (counts: { red: number; green: number; yellow: number; blue: number }) => {
    setLastScanCounts(counts)
    await onBroadcast({
      type: 'SCAN_PREVIEW',
      counts,
    })
  }

  // 4. Mở đáp án
  const handleRevealAnswer = async () => {
    setIsRevealed(true)
    const colorMap: Record<string, string> = { A: 'red', B: 'green', C: 'yellow', D: 'blue' }
    await onBroadcast({
      type: 'REVEAL_ANSWER',
      correctAnswer: currentQ.correctAnswer,
      isCorrectColor: colorMap[currentQ.correctAnswer] || 'green',
    })
  }

  // 5. Bảng điểm
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

  // 6. Pháo hoa
  const handleConfetti = async () => {
    await onBroadcast({
      type: 'TRIGGER_CONFETTI',
    })
  }

  // 7. Xoá màn hình
  const handleReset = async () => {
    setIsRevealed(false)
    setIsTimerRunning(false)
    setLastScanCounts(null)
    await onBroadcast({
      type: 'RESET_VIEW',
    })
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
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${
              showSettings ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-[var(--color-surface-alt)] text-slate-700'
            }`}
            title="Cài đặt thời gian đếm ngược"
          >
            <Sliders size={14} />
            <span>⏱️ {countdownSeconds}s</span>
          </button>

          <button
            onClick={fetchSessionData}
            disabled={isLoadingSession}
            className="p-2 rounded-xl border bg-[var(--color-surface-alt)] hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold"
            title="Tải lại câu hỏi từ phiên trò chơi mới nhất"
          >
            <RefreshCw size={14} className={isLoadingSession ? 'animate-spin text-[var(--color-primary)]' : ''} />
          </button>
        </div>
      </div>

      {/* ─── BẢNG CÀI ĐẶT THỜI GIAN ĐẾM NGƯỢC (COLLAPSIBLE SETTING PANEL) ─── */}
      {showSettings && (
        <Card padding="md" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Clock size={15} />
              CÀI ĐẶT THỜI GIAN ĐẾM NGƯỢC
            </span>
            <span className="text-xs font-extrabold text-amber-800 font-mono">
              Đang chọn: {countdownSeconds} giây
            </span>
          </div>

          {/* Chọn nhanh các mốc thời gian */}
          <div className="grid grid-cols-6 gap-1.5">
            {TIMER_PRESETS.map(sec => (
              <button
                key={sec}
                onClick={() => handleUpdateDuration(sec)}
                className={`py-2 rounded-xl font-black text-xs transition-all ${
                  countdownSeconds === sec
                    ? 'bg-amber-500 text-white shadow-md scale-105 border-2 border-amber-600'
                    : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Bật/Tắt Tự động chạy đếm ngược khi đổi câu */}
          <div
            onClick={handleToggleAutoTimer}
            className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Zap size={16} className={autoStartTimer ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
              <div className="text-left">
                <span className="text-xs font-bold text-slate-800 block">Tự động đếm ngược khi đổi câu</span>
                <span className="text-[10px] text-slate-500">Đẩy câu lên TV là đồng hồ tự chạy ngay</span>
              </div>
            </div>
            <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              autoStartTimer ? 'bg-amber-500 justify-end' : 'bg-slate-300 justify-start'
            }`}>
              <div className="bg-white w-4 h-4 rounded-full shadow-md" />
            </div>
          </div>
        </Card>
      )}

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
              className="p-1.5 rounded-lg border bg-[var(--color-surface-alt)] disabled:opacity-30 flex items-center gap-1 text-xs font-bold"
              title="Về câu trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextQuestionAndSend}
              disabled={currentIdx === questions.length - 1}
              className="p-1.5 px-2 rounded-lg border bg-[var(--color-primary)] text-white disabled:opacity-30 flex items-center gap-1 text-xs font-black shadow-xs"
              title="Sang câu tiếp theo và tự động phát + đếm ngược"
            >
              <span>Câu sau</span>
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
                sendQuestionToTV(i)
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

        {/* Nút gửi câu hỏi lên TV (kèm tự động đếm ngược) */}
        <Button
          onClick={handleSendCurrentQuestion}
          size="lg"
          leftIcon={<Send size={18} />}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-black shadow-md py-3.5"
        >
          📺 Đẩy câu này lên TV {autoStartTimer ? `+ Đếm ngược ${countdownSeconds}s ⏱️` : ''}
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
            onClick={() => handleStartTimer(countdownSeconds)}
            leftIcon={<Clock size={16} />}
            disabled={isTimerRunning}
            className="font-bold text-xs"
          >
            ⏱️ Đếm lại {countdownSeconds}s
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
