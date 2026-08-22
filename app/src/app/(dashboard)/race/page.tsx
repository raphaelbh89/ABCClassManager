'use client'
// src/app/(dashboard)/race/page.tsx
// Module Trò chơi Gọi Trả Bài: Đua Vịt Thần Tốc & Vòng Quay May Mắn
import { useState, useEffect, useRef, useMemo } from 'react'
import { useCurrentClass } from '@/context/ClassContext'
import { useStudents } from '@/hooks/useStudents'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import {
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Users,
  CheckCircle2,
  Star,
  Flame,
  Volume2,
  VolumeX,
  Disc,
} from 'lucide-react'
import type { Student } from '@/types'

// Các nhân vật đua ngộ nghĩnh
const RACER_AVATARS = [
  { icon: '🦆', name: 'Vịt Vàng', color: 'bg-amber-100 border-amber-400 text-amber-950 shadow-amber-200' },
  { icon: '🐰', name: 'Thỏ Trắng', color: 'bg-pink-100 border-pink-400 text-pink-950 shadow-pink-200' },
  { icon: '🐢', name: 'Rùa Thần Tốc', color: 'bg-emerald-100 border-emerald-400 text-emerald-950 shadow-emerald-200' },
  { icon: '🐱', name: 'Mèo Con', color: 'bg-orange-100 border-orange-400 text-orange-950 shadow-orange-200' },
  { icon: '🐶', name: 'Cún Cưng', color: 'bg-blue-100 border-blue-400 text-blue-950 shadow-blue-200' },
  { icon: '🦊', name: 'Cáo Nhanh Trí', color: 'bg-red-100 border-red-400 text-red-950 shadow-red-200' },
  { icon: '🐼', name: 'Gấu Trúc', color: 'bg-slate-100 border-slate-400 text-slate-950 shadow-slate-200' },
  { icon: '🦖', name: 'Khủng Long', color: 'bg-green-100 border-green-400 text-green-950 shadow-green-200' },
  { icon: '🦄', name: 'Kỳ Lân', color: 'bg-purple-100 border-purple-400 text-purple-950 shadow-purple-200' },
  { icon: '🐧', name: 'Chim Cánh Cụt', color: 'bg-cyan-100 border-cyan-400 text-cyan-950 shadow-cyan-200' },
]

// Bảng màu rực rỡ cho Vòng Quay May Mắn
const WHEEL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C',
  '#FF9F1C', '#2EC4B6', '#E71D36', '#011627',
  '#9B5DE5', '#F15BB5', '#00BBF9', '#00F5D4',
  '#F3722C', '#F8961E', '#90BE6D', '#43AA8B',
]

interface RacerState {
  student: Student
  avatar: { icon: string; name: string; color: string }
  progress: number // 0 to 100%
  baseSpeed: number
  boostTimer: number
  boostMultiplier: number
  statusEffect?: 'fire' | 'lightning' | null
  rank?: number
  lane: number
}

type GameMode = 'duck_race' | 'lucky_wheel'
type GamePhase = 'idle' | 'countdown' | 'racing' | 'winner'

export default function CalloutGamePage() {
  const { classes, currentClass, setCurrentClass } = useCurrentClass()
  const selectedClassId = currentClass?.id || classes[0]?.id || ''
  const setSelectedClassId = (id: string) => {
    const matched = classes.find(c => c.id === id)
    if (matched) setCurrentClass(matched)
  }

  const { students } = useStudents(selectedClassId || null)

  // Chế độ trò chơi: Đua vịt hoặc Vòng quay
  const [gameMode, setGameMode] = useState<GameMode>('duck_race')

  // Danh sách ID học sinh đã bị gọi trả bài (lưu trong localStorage)
  const [calledIds, setCalledIds] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Trạng thái cuộc đua
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [countdownNum, setCountdownNum] = useState(3)
  const [racers, setRacers] = useState<RacerState[]>([])
  const [winner, setWinner] = useState<{ student: Student; icon?: string } | null>(null)
  const [scoreAwarded, setScoreAwarded] = useState(false)
  const [activeTab, setActiveTab] = useState<'available' | 'called'>('available')
  const [commentary, setCommentary] = useState('Chuẩn bị xuất phát! Cả lớp sẵn sàng chưa nào?')

  // Trạng thái Vòng Quay May Mắn
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const racersRef = useRef<RacerState[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load danh sách đã gọi từ localStorage khi đổi lớp
  useEffect(() => {
    if (!selectedClassId) return
    try {
      const saved = localStorage.getItem(`called_students_${selectedClassId}`)
      if (saved) {
        setCalledIds(JSON.parse(saved))
      } else {
        setCalledIds([])
      }
    } catch {
      setCalledIds([])
    }
  }, [selectedClassId])

  // Lưu danh sách đã gọi vào localStorage
  const saveCalledIds = (newIds: string[]) => {
    setCalledIds(newIds)
    if (selectedClassId) {
      localStorage.setItem(`called_students_${selectedClassId}`, JSON.stringify(newIds))
    }
  }

  // Danh sách học sinh chưa bị gọi
  const availableStudents = useMemo(() => {
    return students.filter(s => !calledIds.includes(s.id))
  }, [students, calledIds])

  // Danh sách học sinh đã gọi
  const calledStudents = useMemo(() => {
    return students.filter(s => calledIds.includes(s.id))
  }, [students, calledIds])

  // Web Audio Synth phát âm thanh
  const playSound = (type: 'beep' | 'start' | 'boost' | 'cheer' | 'tick') => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      const now = ctx.currentTime

      if (type === 'tick') {
        osc.frequency.setValueAtTime(600, now)
        gain.gain.setValueAtTime(0.08, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)
        osc.start(now)
        osc.stop(now + 0.05)
      } else if (type === 'beep') {
        osc.frequency.setValueAtTime(440, now)
        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      } else if (type === 'start') {
        osc.frequency.setValueAtTime(880, now)
        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
        osc.start(now)
        osc.stop(now + 0.4)
      } else if (type === 'boost') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(300, now)
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.25)
        gain.gain.setValueAtTime(0.1, now)
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
        osc.start(now)
        osc.stop(now + 0.25)
      } else if (type === 'cheer') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.frequency.setValueAtTime(freq, now + i * 0.1)
          g.gain.setValueAtTime(0.15, now + i * 0.1)
          g.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
          o.start(now + i * 0.1)
          o.stop(now + 0.8)
        })
      }
    } catch {}
  }

  // Khởi tạo tay đua
  const createFreshRacers = (list: Student[]): RacerState[] => {
    return list.map((s, idx) => ({
      student: s,
      avatar: RACER_AVATARS[idx % RACER_AVATARS.length],
      progress: 0,
      baseSpeed: 0.11 + Math.random() * 0.04,
      boostTimer: 0,
      boostMultiplier: 1,
      statusEffect: null,
      lane: idx,
    }))
  }

  useEffect(() => {
    if (phase === 'idle') {
      const fresh = createFreshRacers(availableStudents)
      racersRef.current = fresh
      setRacers(fresh)
    }
  }, [availableStudents, phase])

  // ─── 1. BẮT ĐẦU ĐUA VỊT ───
  const startDuckRace = () => {
    if (availableStudents.length === 0) return

    const freshRacers = createFreshRacers(availableStudents)
    racersRef.current = freshRacers
    setRacers(freshRacers)

    setWinner(null)
    setScoreAwarded(false)
    setPhase('countdown')
    setCountdownNum(3)
    setCommentary('🏁 Chuẩn bị... 3...')
    playSound('beep')

    let count = 3
    const timer = setInterval(() => {
      count--
      if (count > 0) {
        setCountdownNum(count)
        setCommentary(`🏁 Chuẩn bị... ${count}...`)
        playSound('beep')
      } else if (count === 0) {
        setCountdownNum(0)
        setCommentary('🚀 GOOO! Các chú vịt bắt đầu bơi lướt sóng!')
        playSound('start')
      } else {
        clearInterval(timer)
        setPhase('racing')
      }
    }, 850)
  }

  // Animation Loop cho Đua Vịt
  useEffect(() => {
    if (phase !== 'racing' || gameMode !== 'duck_race') return

    let raceFinished = false
    let frameCount = 0

    const loop = () => {
      if (raceFinished) return
      frameCount++

      let currentRacers = racersRef.current
      const maxProgress = Math.max(...currentRacers.map(r => r.progress), 0)

      if (frameCount % 60 === 0 && maxProgress > 25 && maxProgress < 60) {
        const luckyIdx = Math.floor(Math.random() * currentRacers.length)
        currentRacers[luckyIdx].boostTimer = 45
        currentRacers[luckyIdx].boostMultiplier = 2.4
        currentRacers[luckyIdx].statusEffect = 'fire'
        setCommentary(`🔥 WOW! Bạn ${currentRacers[luckyIdx].student.name} đang bứt tốc dẫn đầu!`)
        playSound('boost')
      }

      if (frameCount % 75 === 0 && maxProgress >= 55 && maxProgress < 85) {
        const sortedByProg = [...currentRacers].sort((a, b) => b.progress - a.progress)
        const trailingRacers = sortedByProg.slice(Math.floor(currentRacers.length / 2))

        if (trailingRacers.length > 0) {
          const comebackHero = trailingRacers[Math.floor(Math.random() * trailingRacers.length)]
          const targetIndex = currentRacers.findIndex(r => r.student.id === comebackHero.student.id)
          if (targetIndex !== -1) {
            currentRacers[targetIndex].boostTimer = 70
            currentRacers[targetIndex].boostMultiplier = 3.2
            currentRacers[targetIndex].statusEffect = 'lightning'
            setCommentary(`⚡ BẤT NGỜ CHƯA! Bạn ${comebackHero.student.name} lội ngược dòng thần tốc!`)
            playSound('boost')
          }
        }
      }

      if (maxProgress >= 85 && frameCount % 35 === 0) {
        setCommentary('🏁 NƯỚC RÚT NGHẸT THỞ! Ai sẽ chạm vạch đích trước đây?!')
      }

      let leadRacer: RacerState | null = null

      currentRacers = currentRacers.map(r => {
        let currentMultiplier = 1

        if (r.boostTimer > 0) {
          r.boostTimer--
          currentMultiplier = r.boostMultiplier
        } else {
          r.statusEffect = null
        }

        const wave = Math.sin(frameCount * 0.1 + r.lane) * 0.03
        const randomStep = Math.random() * 0.05
        const delta = Math.max(0.04, (r.baseSpeed + wave + randomStep) * currentMultiplier)

        const nextProgress = Math.min(100, r.progress + delta)

        if (nextProgress >= 100 && !leadRacer) {
          leadRacer = { ...r, progress: 100 }
        }

        return {
          ...r,
          progress: nextProgress,
        }
      })

      const sortedRanks = [...currentRacers].sort((a, b) => b.progress - a.progress)
      currentRacers = currentRacers.map(r => {
        const rank = sortedRanks.findIndex(s => s.student.id === r.student.id) + 1
        return { ...r, rank }
      })

      racersRef.current = currentRacers
      setRacers([...currentRacers])

      if (leadRacer) {
        raceFinished = true
        const win = leadRacer as RacerState
        setWinner({ student: win.student, icon: win.avatar.icon })
        setPhase('winner')
        setCommentary(`🎉 XIN CHÚC MỪNG BẠN ${win.student.name.toUpperCase()} ĐÃ VỀ NHẤT! 🥇`)
        playSound('cheer')

        const nextCalled = Array.from(new Set([...calledIds, win.student.id]))
        saveCalledIds(nextCalled)
        return
      }

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [phase, gameMode])

  // ─── 2. VÒNG QUAY MAY MẮN (LUCKY WHEEL) ───
  // Vẽ bánh xe may mắn lên Canvas
  useEffect(() => {
    if (gameMode !== 'lucky_wheel' || !canvasRef.current || availableStudents.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = canvas.width
    const center = size / 2
    const radius = center - 12
    const total = availableStudents.length
    const arcAngle = (2 * Math.PI) / total

    ctx.clearRect(0, 0, size, size)

    // Vẽ từng nan quạt
    availableStudents.forEach((student, idx) => {
      const angle = idx * arcAngle
      const color = WHEEL_COLORS[idx % WHEEL_COLORS.length]

      ctx.beginPath()
      ctx.fillStyle = color
      ctx.moveTo(center, center)
      ctx.arc(center, center, radius, angle, angle + arcAngle)
      ctx.lineTo(center, center)
      ctx.fill()

      // Viền nan quạt
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 3
      ctx.stroke()

      // Vẽ chữ Tên học sinh
      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(angle + arcAngle / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 13px sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.6)'
      ctx.shadowBlur = 4
      ctx.fillText(student.name, radius - 20, 5)
      ctx.restore()
    })

    // Viền tròn ngoài cùng
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)
    ctx.lineWidth = 6
    ctx.strokeStyle = '#FFD700'
    ctx.stroke()

    // Trục tròn trung tâm
    ctx.beginPath()
    ctx.arc(center, center, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#FFD700'
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = '#FFFFFF'
    ctx.stroke()

    ctx.fillStyle = '#333333'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎯', center, center)
  }, [availableStudents, gameMode])

  // Xoay bánh xe
  const startSpinWheel = () => {
    if (availableStudents.length === 0 || isSpinning) return

    setIsSpinning(true)
    setWinner(null)
    setScoreAwarded(false)
    setPhase('racing')
    setCommentary('🎡 Vòng quay đang xoay tít! Ai sẽ là người được chọn?!')

    const total = availableStudents.length
    const arcDegree = 360 / total

    // Chọn ngẫu nhiên 1 bạn trúng thưởng
    const winningIdx = Math.floor(Math.random() * total)
    const winningStudent = availableStudents[winningIdx]

    // Kim chỉ nằm ở đỉnh (270 độ). Tính góc quay để ô trúng thưởng dừng đúng đỉnh
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3)) // Xoay 5 - 7 vòng
    const targetSliceDegree = 270 - (winningIdx * arcDegree + arcDegree / 2)
    const normalizedTarget = (targetSliceDegree % 360 + 360) % 360
    const finalRotation = wheelRotation + extraSpins + ((normalizedTarget - (wheelRotation % 360) + 360) % 360)

    setWheelRotation(finalRotation)

    // Âm thanh tạch tạch theo nhịp
    let tickCount = 0
    const tickInterval = setInterval(() => {
      tickCount++
      playSound('tick')
      if (tickCount > 25) clearInterval(tickInterval)
    }, 140)

    // Sau 4.5 giây thì dừng lại
    setTimeout(() => {
      setIsSpinning(false)
      setWinner({ student: winningStudent, icon: '🎯' })
      setPhase('winner')
      setCommentary(`🎉 VÒNG QUAY ĐÃ DỪNG LẠI TẠI BẠN: ${winningStudent.name.toUpperCase()}! 🥇`)
      playSound('cheer')

      const nextCalled = Array.from(new Set([...calledIds, winningStudent.id]))
      saveCalledIds(nextCalled)
    }, 4500)
  }

  // Xử lý lượt tiếp theo
  const handleNextTurn = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current)

    const remaining = winner
      ? availableStudents.filter(s => s.id !== winner.student.id)
      : availableStudents

    const freshRacers = createFreshRacers(remaining)
    racersRef.current = freshRacers
    setRacers(freshRacers)

    setWinner(null)
    setScoreAwarded(false)
    setPhase('idle')
    setCommentary(
      remaining.length > 0
        ? `Sẵn sàng cho lượt tiếp theo! Còn ${remaining.length} bạn.`
        : 'Tất cả học sinh đã hoàn thành trả bài!'
    )
  }

  // Reset toàn bộ danh sách đã gọi
  const handleResetCalled = () => {
    if (window.confirm('Bạn có chắc muốn làm mới toàn bộ lượt trả bài? Tất cả học sinh sẽ quay lại danh sách.')) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      saveCalledIds([])
      const freshRacers = createFreshRacers(students)
      racersRef.current = freshRacers
      setRacers(freshRacers)
      setWinner(null)
      setScoreAwarded(false)
      setPhase('idle')
      setWheelRotation(0)
      setCommentary('Đã reset toàn bộ học sinh! Sẵn sàng cho vòng mới.')
    }
  }

  // Cộng điểm thưởng RPG
  const handleAwardScore = async () => {
    if (!winner || scoreAwarded) return
    try {
      const critRes = await fetch(`/api/evaluations?type=criteria&classId=${encodeURIComponent(selectedClassId)}`)
      const criteria = await critRes.json()
      const critId = criteria?.[0]?.id

      if (critId) {
        await fetch('/api/evaluations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: winner.student.id,
            criteria_id: critId,
            score: 10,
            note: '⭐ Trả lời bài xuất sắc (Gọi Trả Bài)',
            session_type: 'quick',
          }),
        })
      }
      setScoreAwarded(true)
    } catch {}
  }

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto flex flex-col gap-6 pb-12 bg-white sm:bg-transparent min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <h1 className="font-bold text-2xl text-[var(--color-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
              Gọi Trả Bài Lớp Học
            </h1>
            <Badge variant="primary">Ngẫu nhiên & Hào hứng</Badge>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Chọn ngẫu nhiên học sinh lên bảng trả bài bằng Đua Vịt Kịch Tính hoặc Vòng Quay May Mắn
          </p>
        </div>

        {/* Lớp & Nút điều khiển */}
        <div className="flex items-center gap-2 flex-wrap">
          {classes.length > 0 && (
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="p-2 rounded-xl border bg-[var(--color-surface-alt)] text-xs font-bold text-[var(--color-text)] cursor-pointer"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>📚 {c.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            leftIcon={isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            title="Chiếu Toàn Màn Hình"
          >
            {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetCalled}
            leftIcon={<RotateCcw size={15} />}
          >
            Reset lượt ({calledStudents.length})
          </Button>
        </div>
      </div>

      {/* ─── CHUYỂN ĐỔI CHẾ ĐỘ TRÒ CHƠI (TABS) ─── */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <button
          onClick={() => { setGameMode('duck_race'); setPhase('idle') }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            gameMode === 'duck_race'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
          }`}
        >
          <span>🦆</span>
          <span>Đua Vịt Thần Tốc (Lật Kèo)</span>
        </button>

        <button
          onClick={() => { setGameMode('lucky_wheel'); setPhase('idle') }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            gameMode === 'lucky_wheel'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)]'
          }`}
        >
          <span>🎡</span>
          <span>Vòng Quay May Mắn (Spin Wheel)</span>
        </button>
      </div>

      {/* ─── THANH BÌNH LUẬN VIÊN TRỰC TIẾP (LIVE COMMENTARY) ─── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-5 py-2.5 rounded-2xl shadow-md flex items-center justify-between gap-3 text-xs font-black tracking-wide animate-in fade-in duration-300">
        <div className="flex items-center gap-2 truncate">
          <span className="p-1 rounded-lg bg-black/20 text-sm">🎙️</span>
          <span className="truncate">{commentary}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 text-[11px] bg-black/20 px-3 py-1 rounded-full">
          <span>Còn: <strong>{availableStudents.length} bạn</strong></span>
          <span>·</span>
          <span>Đã gọi: <strong>{calledStudents.length} bạn</strong></span>
        </div>
      </div>

      {/* ─── GIAO DIỆN TRÒ CHƠI 1: ĐUA VỊT THẦN TỐC ─── */}
      {gameMode === 'duck_race' && (
        <div className="relative rounded-3xl overflow-hidden border-4 border-amber-300 shadow-2xl bg-gradient-to-b from-sky-400 via-sky-300 to-blue-500 min-h-[460px] flex flex-col justify-between p-4">
          {/* Vạch xuất phát & Vạch đích */}
          <div className="flex justify-between items-center text-xs font-black text-white px-4 py-1.5 rounded-full bg-black/30 backdrop-blur-xs mb-2 z-10">
            <span className="flex items-center gap-1.5">
              <span>🚩</span> VẠCH XUẤT PHÁT
            </span>
            <span className="text-amber-200">
              {availableStudents.length > 0
                ? `🎯 Có ${availableStudents.length} bạn đang tranh tài`
                : '🎉 Toàn bộ học sinh đã trả bài! Hãy bấm Reset.'}
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span>🏁</span> VẠCH ĐÍCH (VỀ NHẤT) 🏆
            </span>
          </div>

          {/* Cột cờ đích ca-rô bên phải xuyên suốt */}
          <div
            className="absolute top-0 bottom-0 right-9 w-4 z-20 pointer-events-none shadow-md border-x border-white/80"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #000, #000 12px, #fff 12px, #fff 24px)`,
            }}
          />

          {/* Danh sách các làn đua */}
          {availableStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/40 backdrop-blur-md rounded-2xl my-4 z-10">
              <span className="text-6xl mb-3 animate-bounce">🏆</span>
              <h2 className="text-2xl font-black text-blue-900 mb-2">Toàn bộ học sinh đã hoàn thành trả bài!</h2>
              <p className="text-xs font-semibold text-slate-700 mb-4">
                Bạn đã gọi đủ {students.length}/{students.length} học sinh trong lớp hôm nay.
              </p>
              <Button size="lg" onClick={handleResetCalled} leftIcon={<RotateCcw size={18} />}>
                🔄 Reset và bắt đầu vòng đua mới
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-around gap-2 my-2 relative z-10">
              {(phase === 'idle'
                ? availableStudents.map((s, idx) => ({
                    student: s,
                    avatar: RACER_AVATARS[idx % RACER_AVATARS.length],
                    progress: 0,
                    baseSpeed: 1,
                    boostTimer: 0,
                    boostMultiplier: 1,
                    statusEffect: null,
                    rank: idx + 1,
                    lane: idx,
                  }))
                : racers
              ).map((r, idx) => (
                <div
                  key={r.student.id}
                  className="relative h-12 bg-white/40 backdrop-blur-xs rounded-2xl border border-white/60 flex items-center px-2 shadow-inner overflow-hidden"
                >
                  {/* Làn sóng nước nhấp nhô */}
                  <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent pointer-events-none" />

                  {/* Khối Tay Đua: Chạm chính xác 100% vào vạch đích ca-rô */}
                  <div
                    className="absolute transition-all duration-75 flex items-center z-10"
                    style={{
                      left: `calc(125px + (${Math.min(100, r.progress)} / 100) * (100% - 185px))`,
                    }}
                  >
                    {/* 1. Tên học sinh gắn bên trái Icon (đi theo sau lưng icon) */}
                    <span className={`absolute right-full mr-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-sm whitespace-nowrap border transition-all ${
                      r.statusEffect === 'fire'
                        ? 'bg-amber-500 text-white border-amber-300 scale-105 animate-pulse'
                        : r.statusEffect === 'lightning'
                        ? 'bg-blue-600 text-white border-blue-300 scale-105 animate-pulse'
                        : 'bg-white/95 text-slate-800 border-slate-200'
                    }`}>
                      {r.student.name}
                    </span>

                    {/* 2. Icon Vịt / Thú cưng chạm trực tiếp vào dải cờ ca-rô đích */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl shadow-lg transform transition-transform ${
                          phase === 'racing' ? 'animate-bounce' : ''
                        } ${r.avatar.color}`}
                      >
                        {r.avatar.icon}
                      </div>

                      {/* Hiệu ứng Nitro / Tia sét */}
                      {r.statusEffect === 'fire' && (
                        <span className="absolute -top-3 -right-2 text-base animate-ping">🔥</span>
                      )}
                      {r.statusEffect === 'lightning' && (
                        <span className="absolute -top-3 -right-2 text-base animate-bounce">⚡</span>
                      )}

                      {/* Top 1, 2, 3 badge */}
                      {phase === 'racing' && r.rank && r.rank <= 3 && (
                        <span className={`absolute -bottom-1.5 -right-1 text-[9px] font-black px-1.5 rounded-full text-white shadow-xs ${
                          r.rank === 1 ? 'bg-amber-500' : r.rank === 2 ? 'bg-slate-500' : 'bg-amber-700'
                        }`}>
                          #{r.rank}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Số thứ tự làn */}
                  <span className="text-[10px] font-bold text-white/80 select-none ml-1">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Đếm ngược 3 - 2 - 1 - GO! Overlay */}
          {phase === 'countdown' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-30 animate-in fade-in duration-200">
              <span
                className="text-8xl font-black text-amber-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] animate-pulse scale-125 transition-transform"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {countdownNum === 0 ? '🏁 GOOO! 🚀' : countdownNum}
              </span>
              <p className="text-white font-bold text-sm mt-4 tracking-wider">
                {countdownNum === 0 ? 'CÁC TAY ĐUA BẮT ĐẦU BỨT PHÁ!' : 'CHUẨN BỊ XUẤT PHÁT...'}
              </p>
            </div>
          )}

          {/* Nút Khởi Động Đua ở dưới */}
          {phase === 'idle' && availableStudents.length > 0 && (
            <div className="flex justify-center pt-2 relative z-20">
              <Button
                size="xl"
                onClick={startDuckRace}
                leftIcon={<Play size={24} className="fill-current" />}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-10 py-5 rounded-2xl shadow-2xl hover:scale-105 transition-all text-lg border-2 border-amber-200"
              >
                🚀 BẮT ĐẦU ĐUA VỊT GỌI TÊN
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── GIAO DIỆN TRÒ CHƠI 2: VÒNG QUAY MAY MẮN (LUCKY WHEEL) ─── */}
      {gameMode === 'lucky_wheel' && (
        <div className="relative rounded-3xl overflow-hidden border-4 border-amber-300 shadow-2xl bg-gradient-to-b from-purple-600 via-indigo-600 to-blue-700 min-h-[480px] flex flex-col items-center justify-center p-6 text-white">
          {availableStudents.length === 0 ? (
            <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl">
              <span className="text-6xl mb-3 inline-block animate-bounce">🏆</span>
              <h2 className="text-2xl font-black text-amber-300 mb-2">Toàn bộ học sinh đã được gọi!</h2>
              <p className="text-xs text-white/80 mb-4">Bạn đã gọi đủ {students.length}/{students.length} học sinh trong lớp.</p>
              <Button size="lg" onClick={handleResetCalled} leftIcon={<RotateCcw size={18} />}>
                🔄 Reset và bắt đầu vòng mới
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              {/* Bánh xe quay & Kim chỉ */}
              <div className="relative flex items-center justify-center">
                {/* Kim chỉ đỏ phía trên đỉnh */}
                <div className="absolute -top-3 z-30 flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[30px] border-t-red-600" />
                </div>

                {/* Bánh xe Canvas có transition quay */}
                <div
                  className="rounded-full shadow-[0_0_40px_rgba(255,215,0,0.4)] border-4 border-yellow-300"
                  style={{
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                  }}
                >
                  <canvas ref={canvasRef} width={380} height={380} className="rounded-full" />
                </div>
              </div>

              {/* Nút Quay */}
              <Button
                size="xl"
                onClick={startSpinWheel}
                disabled={isSpinning || availableStudents.length === 0}
                leftIcon={<Disc size={24} className={isSpinning ? 'animate-spin' : ''} />}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-12 py-5 rounded-2xl shadow-2xl hover:scale-105 transition-all text-lg border-2 border-amber-200"
              >
                {isSpinning ? '🎡 ĐANG QUAY...' : '🎯 QUAY NGAY (SPIN!)'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL / BANNER VINH DANH BẠN CHIẾN THẮNG (DÙNG CHUNG) ─── */}
      {phase === 'winner' && winner && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 border-4 border-yellow-200 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-amber-500 shadow-xl flex items-center justify-center text-4xl animate-bounce">
                {winner.icon || '🦆'}
              </div>
              <span className="absolute -bottom-2 -right-1 text-2xl">🥇</span>
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider bg-amber-900/10 text-amber-950 px-3 py-1 rounded-full inline-block mb-1">
                🎉 ĐÃ TÌM THẤY BẠN LÊN BẢNG!
              </span>
              <h2 className="text-3xl font-black text-amber-950 leading-tight">
                Xin mời bạn: <span className="underline decoration-wavy decoration-amber-600">{winner.student.name}</span>
              </h2>
              <p className="text-xs font-bold text-amber-900 mt-0.5">
                Mời em lên bảng trả bài hoặc trả lời câu hỏi của thầy/cô!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={scoreAwarded ? 'secondary' : 'primary'}
              onClick={handleAwardScore}
              disabled={scoreAwarded}
              leftIcon={<Star size={18} className="text-amber-500 fill-amber-500" />}
              className="bg-white text-slate-900 hover:bg-slate-50 border-2 border-amber-300 font-bold"
            >
              {scoreAwarded ? '✓ Đã cộng 10 Sao' : '+10 Sao Trả Bài Tốt'}
            </Button>

            <Button
              size="lg"
              onClick={handleNextTurn}
              leftIcon={<Play size={18} />}
              className="bg-amber-950 hover:bg-slate-900 text-white font-black shadow-lg hover:scale-105 transition-transform"
            >
              Lượt Tiếp Theo ➡️
            </Button>
          </div>
        </div>
      )}

      {/* ─── THEO DÕI DANH SÁCH HỌC SINH ─── */}
      <Card padding="md" className="flex flex-col gap-4 border shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-[var(--color-primary)]" />
            <h3 className="font-bold text-base text-[var(--color-text)]">
              Danh Sách Trả Bài Lớp ({students.length} Học Sinh)
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'available'
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-slate-200'
              }`}
            >
              Chưa gọi ({availableStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('called')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'called'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-slate-200'
              }`}
            >
              Đã gọi ({calledStudents.length})
            </button>
          </div>
        </div>

        {/* Grid học sinh */}
        {activeTab === 'available' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {availableStudents.length === 0 ? (
              <p className="col-span-4 text-center py-6 text-xs text-[var(--color-text-muted)]">
                Không còn bạn nào trong danh sách chờ. Hãy bấm "Reset lượt trả bài".
              </p>
            ) : (
              availableStudents.map((s, idx) => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl border bg-white flex items-center gap-2.5 shadow-2xs hover:border-[var(--color-primary)] transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span className="text-xl">{RACER_AVATARS[idx % RACER_AVATARS.length].icon}</span>
                  <div className="truncate flex-1">
                    <p className="font-bold text-xs text-[var(--color-text)] truncate">{s.name}</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {s.seat_row != null ? `Bàn ${s.seat_row + 1}` : 'Chưa xếp ghế'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {calledStudents.length === 0 ? (
              <p className="col-span-4 text-center py-6 text-xs text-[var(--color-text-muted)]">
                Chưa có học sinh nào được gọi hôm nay.
              </p>
            ) : (
              calledStudents.map(s => (
                <div
                  key={s.id}
                  className="p-2.5 rounded-xl border bg-amber-50/60 border-amber-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 size={16} className="text-amber-600 flex-shrink-0" />
                    <span className="font-bold text-xs text-amber-950 truncate">{s.name}</span>
                  </div>
                  <Badge variant="secondary">Đã gọi</Badge>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
