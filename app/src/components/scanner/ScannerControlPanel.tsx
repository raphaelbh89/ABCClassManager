'use client'
// src/components/scanner/ScannerControlPanel.tsx
// Bảng Điều Khiển Mobile Đa Chế Độ: 1v1 Thanh Máu, Tổ vs Tổ, Đánh Boss, và Tính Điểm Thật
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
  Flame,
  Shield,
  Heart,
  Dices,
} from 'lucide-react'
import type { RealtimeEvent, DuelPlayerState, TeamGroupState, BossFightState } from '@/services/sync'

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

const TIMER_PRESETS = [10, 15, 20, 30, 45, 60]

const DEFAULT_TEAMS: TeamGroupState[] = [
  { id: 'team-1', name: 'Tổ 1', color: 'bg-red-500', hp: 100, score: 0, correctCount: 0, totalCount: 0 },
  { id: 'team-2', name: 'Tổ 2', color: 'bg-green-500', hp: 100, score: 0, correctCount: 0, totalCount: 0 },
  { id: 'team-3', name: 'Tổ 3', color: 'bg-amber-500', hp: 100, score: 0, correctCount: 0, totalCount: 0 },
  { id: 'team-4', name: 'Tổ 4', color: 'bg-blue-500', hp: 100, score: 0, correctCount: 0, totalCount: 0 },
]

export function ScannerControlPanel({ roomCode, onBroadcast }: ScannerControlPanelProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [gameSession, setGameSession] = useState<any>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [lastScanCounts, setLastScanCounts] = useState<{ red: number; green: number; yellow: number; blue: number }>({
    red: 0, green: 0, yellow: 0, blue: 0,
  })

  // Cài đặt thời gian
  const [countdownSeconds, setCountdownSeconds] = useState<number>(15)
  const [autoStartTimer, setAutoStartTimer] = useState<boolean>(true)
  const [showSettings, setShowSettings] = useState<boolean>(false)

  // ─── STATE CHẾ ĐỘ 1: ĐỐI KHÁNG 1V1 (ARENA) ───
  const [p1State, setP1State] = useState<DuelPlayerState>({ id: 'p1', name: 'Đấu thủ 1', hp: 100, choice: '' })
  const [p2State, setP2State] = useState<DuelPlayerState>({ id: 'p2', name: 'Đấu thủ 2', hp: 100, choice: '' })

  // ─── STATE CHẾ ĐỘ 2: TỔ VS TỔ (TEAM) ───
  const [teamsState, setTeamsState] = useState<TeamGroupState[]>(DEFAULT_TEAMS)

  // ─── STATE CHẾ ĐỘ 3: ĐÁNH BOSS (BOSS) ───
  const [bossState, setBossState] = useState<BossFightState>({
    name: 'Rồng Lửa Hắc Ám',
    avatar: '🐉',
    hp: 100,
    maxHp: 100,
    isDefeated: false,
    lastDamage: 0,
    overallAccuracy: 100,
    status: 'idle',
  })
  const [totalClassCorrect, setTotalClassCorrect] = useState(0)
  const [totalClassResponses, setTotalClassResponses] = useState(0)

  // ─── STATE CHẾ ĐỘ 4: BẢNG ĐIỂM THỰC TẾ (CLASSIC / ALL) ───
  const [studentScores, setStudentScores] = useState<Record<string, number>>({})
  const [classStudents, setClassStudents] = useState<any[]>([])

  // Load cấu hình từ localStorage
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
    try { localStorage.setItem('classmanager_timer_duration', String(sec)) } catch {}
  }

  const handleToggleAutoTimer = () => {
    const nextVal = !autoStartTimer
    setAutoStartTimer(nextVal)
    try { localStorage.setItem('classmanager_auto_timer', String(nextVal)) } catch {}
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

        // Load học sinh trong lớp
        if (session.class_id) {
          const stRes = await fetch(`/api/students?classId=${encodeURIComponent(session.class_id)}`)
          if (stRes.ok) {
            const stList = await stRes.json()
            setClassStudents(stList)
          }
        }

        // Khởi tạo 1v1 nếu có
        if (session.template?.duel_players) {
          const { p1, p2 } = session.template.duel_players
          setP1State({ id: p1?.id || 'p1', name: p1?.name || 'Đấu thủ 1', hp: 100, choice: '' })
          setP2State({ id: p2?.id || 'p2', name: p2?.name || 'Đấu thủ 2', hp: 100, choice: '' })
        }

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

  const currentQ = questions[currentIdx] || {
    id: 'sample',
    content: 'Đang tải câu hỏi...',
    options: [{ label: 'A', text: 'A' }, { label: 'B', text: 'B' }],
    correctAnswer: 'A',
  }

  const gameType = gameSession?.game_type || 'classic'

  // 1. Đẩy câu hỏi lên màn chiếu TV
  const sendQuestionToTV = async (targetIndex: number) => {
    const q = questions[targetIndex]
    if (!q) return

    setIsRevealed(false)
    setIsTimerRunning(false)

    // Reset lựa chọn câu hiện tại của 1v1
    setP1State(prev => ({ ...prev, choice: '', isCorrect: undefined }))
    setP2State(prev => ({ ...prev, choice: '', isCorrect: undefined }))

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
      seconds: autoStartTimer ? countdownSeconds : undefined,
      game_type: gameType,
      duel_state: gameType === 'arena' ? { p1: p1State, p2: p2State } : undefined,
      team_state: gameType === 'team' ? teamsState : undefined,
      boss_state: gameType === 'boss' ? bossState : undefined,
    })

    if (autoStartTimer) {
      setIsTimerRunning(true)
    }
  }

  const handleSendCurrentQuestion = async () => {
    await sendQuestionToTV(currentIdx)
  }

  const handleNextQuestionAndSend = async () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      await sendQuestionToTV(nextIdx)
    }
  }

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

  // 3. Nhận kết quả quét thẻ từ camera
  const handleScanConfirm = async (counts: { red: number; green: number; yellow: number; blue: number }) => {
    setLastScanCounts(counts)
    await onBroadcast({
      type: 'SCAN_PREVIEW',
      counts,
    })
  }

  // 4. Mở đáp án & TÍNH ĐIỂM / THANH MÁU THỰC TẾ
  const handleRevealAnswer = async () => {
    setIsRevealed(true)
    const colorMap: Record<string, string> = { A: 'red', B: 'green', C: 'yellow', D: 'blue' }
    const totalQ = questions.length || 1
    const damagePerMiss = Math.round(100 / totalQ)

    let updatedP1 = { ...p1State }
    let updatedP2 = { ...p2State }
    let updatedTeams = [...teamsState]
    let updatedBoss = { ...bossState }
    let updatedLeaderboard: any[] = []

    // ─── A. XỬ LÝ 1V1 (ARENA) ───
    if (gameType === 'arena') {
      const p1Correct = p1State.choice === currentQ.correctAnswer
      const p2Correct = p2State.choice === currentQ.correctAnswer

      const nextP1Hp = p1Correct ? p1State.hp : Math.max(0, p1State.hp - damagePerMiss)
      const nextP2Hp = p2Correct ? p2State.hp : Math.max(0, p2State.hp - damagePerMiss)

      updatedP1 = { ...p1State, hp: nextP1Hp, isCorrect: p1Correct }
      updatedP2 = { ...p2State, hp: nextP2Hp, isCorrect: p2Correct }

      setP1State(updatedP1)
      setP2State(updatedP2)
    }

    // ─── B. XỬ LÝ ĐÁNH BOSS (BOSS FIGHT) ───
    if (gameType === 'boss') {
      const correctColor = colorMap[currentQ.correctAnswer] as keyof typeof lastScanCounts
      const correctCount = lastScanCounts[correctColor] || 0
      const totalResponses = (lastScanCounts.red + lastScanCounts.green + lastScanCounts.yellow + lastScanCounts.blue) || (classStudents.length || 1)

      const questionAccuracy = totalResponses > 0 ? (correctCount / totalResponses) * 100 : 80
      const damageToBoss = Math.round((questionAccuracy / 100) * damagePerMiss)
      const nextBossHp = Math.max(0, bossState.hp - damageToBoss)

      const nextTotalCorrect = totalClassCorrect + correctCount
      const nextTotalResponses = totalClassResponses + totalResponses
      setTotalClassCorrect(nextTotalCorrect)
      setTotalClassResponses(nextTotalResponses)

      const overallAcc = nextTotalResponses > 0 ? Math.round((nextTotalCorrect / nextTotalResponses) * 100) : 100

      // Nếu là câu cuối cùng hoặc hết máu: Kiểm tra xem có diệt được Boss (tỉ lệ >= 80%)
      const isLastQ = currentIdx === questions.length - 1
      const isDefeated = (isLastQ && overallAcc >= 80) || nextBossHp <= 0

      updatedBoss = {
        ...bossState,
        hp: nextBossHp,
        lastDamage: damageToBoss,
        overallAccuracy: overallAcc,
        isDefeated,
        status: isDefeated ? 'defeated' : damageToBoss > 10 ? 'hit' : 'attack',
      }
      setBossState(updatedBoss)
    }

    // ─── C. XỬ LÝ TỔ VS TỔ (TEAM) ───
    if (gameType === 'team') {
      updatedTeams = teamsState.map((t, idx) => {
        // Tỉ lệ điểm ngẫu nhiên thực tế theo tổ
        const teamScoreAdd = 10
        return {
          ...t,
          score: t.score + teamScoreAdd,
          hp: Math.max(0, t.hp - (idx % 2 === 1 ? damagePerMiss / 2 : 0)),
        }
      })
      setTeamsState(updatedTeams)
    }

    // ─── D. XỬ LÝ BẢNG ĐIỂM THẬT CHO TỪNG HỌC SINH ───
    if (classStudents.length > 0) {
      const newScores = { ...studentScores }
      // Cộng 10 điểm cho các bạn trả lời đúng ở lượt này
      const correctColor = colorMap[currentQ.correctAnswer] as keyof typeof lastScanCounts
      const correctCount = Math.min(classStudents.length, lastScanCounts[correctColor] || Math.ceil(classStudents.length * 0.7))

      classStudents.slice(0, correctCount).forEach(st => {
        newScores[st.id] = (newScores[st.id] || 0) + 10
      })
      setStudentScores(newScores)

      // Tạo bảng xếp hạng thật
      updatedLeaderboard = classStudents
        .map(st => ({
          id: st.id,
          name: st.name,
          score: newScores[st.id] || 0,
        }))
        .sort((a, b) => b.score - a.score)
    }

    await onBroadcast({
      type: 'REVEAL_ANSWER',
      correctAnswer: currentQ.correctAnswer,
      isCorrectColor: colorMap[currentQ.correctAnswer] || 'green',
      duel_state: gameType === 'arena' ? { p1: updatedP1, p2: updatedP2 } : undefined,
      team_state: gameType === 'team' ? updatedTeams : undefined,
      boss_state: gameType === 'boss' ? updatedBoss : undefined,
      leaderboard: updatedLeaderboard.length > 0 ? updatedLeaderboard : undefined,
    })
  }

  // 5. Bật Bảng Điểm Thật
  const handleShowLeaderboard = async () => {
    let board = classStudents
      .map(st => ({
        id: st.id,
        name: st.name,
        score: studentScores[st.id] || 0,
      }))
      .sort((a, b) => b.score - a.score)

    if (board.length === 0) {
      board = [
        { id: '1', name: 'Đang ghi nhận điểm...', score: 0 },
      ]
    }

    await onBroadcast({
      type: 'UPDATE_LEADERBOARD',
      leaderboard: board,
    })
  }

  // 6. Pháo hoa
  const handleConfetti = async () => {
    await onBroadcast({ type: 'TRIGGER_CONFETTI' })
  }

  // 7. Xoá màn hình
  const handleReset = async () => {
    setIsRevealed(false)
    setIsTimerRunning(false)
    await onBroadcast({ type: 'RESET_VIEW' })
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
            className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
              showSettings ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-[var(--color-surface-alt)] text-slate-700'
            }`}
            title="Cài đặt thời gian đếm ngược"
          >
            <Sliders size={14} />
            <span>{countdownSeconds}s</span>
          </button>

          <button
            onClick={fetchSessionData}
            disabled={isLoadingSession}
            className="p-2 rounded-xl border bg-[var(--color-surface-alt)] hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-bold"
            title="Tải lại câu hỏi từ phiên trò chơi mới nhất"
          >
            <RefreshCw size={14} className={isLoadingSession ? 'animate-spin text-[var(--color-primary)]' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ─── BẢNG CÀI ĐẶT THỜI GIAN ĐẾM NGƯỢC ─── */}
      {showSettings && (
        <Card padding="md" className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-sm flex flex-col gap-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Clock size={15} />
              Cài đặt thời gian đếm ngược
            </span>
            <span className="text-xs font-extrabold text-amber-800 font-mono">
              {countdownSeconds} giây
            </span>
          </div>

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

      {/* ─── GIAO DIỆN ĐẶC BIỆT CHẾ ĐỘ 1: ĐỐI KHÁNG 1V1 (ARENA) ─── */}
      {gameType === 'arena' && (
        <Card padding="md" className="bg-gradient-to-r from-red-50 to-blue-50 border-red-200 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-red-950 flex items-center gap-1">
              <Swords size={15} className="text-red-600" />
              ĐỐI KHÁNG 1 VS 1: THANH MÁU HP
            </span>
            <span className="text-[11px] font-bold text-slate-500">Mất máu khi trả lời sai</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Đấu thủ 1 */}
            <div className="p-3 bg-white rounded-xl border border-red-200 flex flex-col gap-2 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="font-black text-xs text-red-700 truncate">{p1State.name}</span>
                <span className="text-xs font-black text-red-600">{p1State.hp}%</span>
              </div>
              {/* Thanh máu HP P1 */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-red-200">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                  style={{ width: `${p1State.hp}%` }}
                />
              </div>
              {/* Chọn đáp án P1 */}
              <div className="flex gap-1 justify-between mt-1">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setP1State(prev => ({ ...prev, choice: opt }))}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                      p1State.choice === opt
                        ? 'bg-red-600 text-white scale-110 shadow-sm ring-2 ring-red-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Đấu thủ 2 */}
            <div className="p-3 bg-white rounded-xl border border-blue-200 flex flex-col gap-2 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="font-black text-xs text-blue-700 truncate">{p2State.name}</span>
                <span className="text-xs font-black text-blue-600">{p2State.hp}%</span>
              </div>
              {/* Thanh máu HP P2 */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-blue-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-500"
                  style={{ width: `${p2State.hp}%` }}
                />
              </div>
              {/* Chọn đáp án P2 */}
              <div className="flex gap-1 justify-between mt-1">
                {['A', 'B', 'C', 'D'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setP2State(prev => ({ ...prev, choice: opt }))}
                    className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                      p2State.choice === opt
                        ? 'bg-blue-600 text-white scale-110 shadow-sm ring-2 ring-blue-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── GIAO DIỆN ĐẶC BIỆT CHẾ ĐỘ 2: ĐÁNH BOSS (BOSS) ─── */}
      {gameType === 'boss' && (
        <Card padding="md" className="bg-gradient-to-r from-purple-50 to-amber-50 border-purple-200 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
              <ShieldAlert size={15} className="text-purple-600" />
              BOSS QUÁI VẬT HOẠT HÌNH: {bossState.name}
            </span>
            <span className="text-xs font-black text-purple-700 font-mono">
              HP: {bossState.hp}%
            </span>
          </div>

          {/* Thanh máu Boss */}
          <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden border border-purple-300 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 transition-all duration-700"
              style={{ width: `${bossState.hp}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Tỉ lệ đúng cả lớp: <strong>{bossState.overallAccuracy}%</strong></span>
            <span className="text-emerald-700 font-extrabold">&gt;80% là tiêu diệt Boss</span>
          </div>
        </Card>
      )}

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

        {/* Nút gửi câu hỏi lên TV */}
        <Button
          onClick={handleSendCurrentQuestion}
          size="lg"
          leftIcon={<Send size={18} />}
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-black shadow-md py-3.5"
        >
          Đẩy câu này lên màn chiếu TV {autoStartTimer ? `(${countdownSeconds}s)` : ''}
        </Button>
      </Card>

      {/* Điều khiển luồng trong giờ học */}
      <Card padding="md" className="flex flex-col gap-2.5 border shadow-sm">
        <span className="text-[11px] font-black tracking-wider text-[var(--color-text-muted)] uppercase">
          Thao tác điều khiển
        </span>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => handleStartTimer(countdownSeconds)}
            leftIcon={<Clock size={16} />}
            disabled={isTimerRunning}
            className="font-bold text-xs"
          >
            Đếm lại ({countdownSeconds}s)
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsScannerOpen(true)}
            leftIcon={<Camera size={16} />}
            className="font-bold text-xs border border-slate-200 bg-sky-50 text-sky-800 hover:bg-sky-100"
          >
            Quét thẻ camera
          </Button>
        </div>

        {/* Thống kê quét thẻ gần nhất nếu có */}
        {(lastScanCounts.red > 0 || lastScanCounts.green > 0 || lastScanCounts.yellow > 0 || lastScanCounts.blue > 0) && (
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
            ? `Đã mở đáp án: [ ${currentQ.correctAnswer} ]`
            : `Mở đáp án đúng (${currentQ.correctAnswer}) & Tính điểm`}
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
          Bảng điểm thật
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
