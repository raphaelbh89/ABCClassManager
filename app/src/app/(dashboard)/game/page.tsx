'use client'
// src/app/(dashboard)/game/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrentClass } from '@/context/ClassContext'
import { useQuestions } from '@/hooks/useQuestions'
import { createGameSession } from '@/services/games'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import {
  Gamepad2,
  Play,
  Tv,
  Plus,
  Sparkles,
  Shuffle,
  Filter,
  CheckCircle2,
} from 'lucide-react'
import type { GameType } from '@/types'

const GAME_MODES: {
  type: GameType
  title: string
  desc: string
  icon: string
  color: string
  bg: string
  badge: string
}[] = [
  {
    type: 'individual',
    title: 'Quiz Cá Nhân (Toàn lớp)',
    desc: 'Mỗi học sinh giơ thẻ màu trả lời độc lập, cộng điểm RPG cá nhân.',
    icon: '👤',
    color: 'var(--color-primary)',
    bg: 'rgba(76,175,130,0.1)',
    badge: 'Phổ biến nhất',
  },
  {
    type: '1v1',
    title: 'Đối Kháng Đơn (1 vs 1)',
    desc: 'Chọn ngẫu nhiên 2 học sinh lên bảng thi đấu trực tiếp qua buzzer ảo.',
    icon: '⚔️',
    color: 'var(--color-danger)',
    bg: 'rgba(255,82,82,0.1)',
    badge: 'Kịch tính',
  },
  {
    type: 'team',
    title: 'Đối Kháng Nhóm (Tổ vs Tổ)',
    desc: 'Thi đua giữa các tổ trong lớp, tổng hợp điểm số đồng đội.',
    icon: '🛡️',
    color: 'var(--color-accent)',
    bg: 'rgba(124,77,255,0.1)',
    badge: 'Tinh thần đồng đội',
  },
  {
    type: 'collective',
    title: 'Thử Thách Tập Thể (Đánh Boss)',
    desc: 'Cả lớp cùng trả lời đúng để hạ gục Boss quái vật trước khi hết giờ.',
    icon: '🌍',
    color: 'var(--color-secondary)',
    bg: 'rgba(255,179,71,0.15)',
    badge: 'Hợp tác vui nhộn',
  },
]

export default function GameLauncherPage() {
  const router = useRouter()
  const { classes, currentClass, setCurrentClass } = useCurrentClass()
  const { questions } = useQuestions('all')

  const selectedClassId = currentClass?.id || (classes[0]?.id ?? '')
  const setSelectedClassId = (id: string) => {
    const matched = classes.find(c => c.id === id)
    if (matched) setCurrentClass(matched)
  }

  const [selectedMode, setSelectedMode] = useState<GameType>('individual')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Danh sách câu hỏi sau khi lọc
  const filteredQuestions = questions.filter(q => {
    const matchSubject = filterSubject === 'all' || q.subject === filterSubject
    const matchType = filterType === 'all' || q.question_type === filterType
    return matchSubject && matchType
  })

  // Chọn/bỏ chọn tất cả
  const toggleAllQuestions = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([])
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id))
    }
  }

  const toggleQuestion = (id: string) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    )
  }

  // Chọn ngẫu nhiên N câu
  const selectRandomCount = (count: number) => {
    const pool = [...filteredQuestions].sort(() => 0.5 - Math.random())
    const selected = pool.slice(0, count).map(q => q.id)
    setSelectedQuestions(selected)
  }

  const handleStartGame = async () => {
    if (!selectedClassId) return
    setIsLoading(true)
    try {
      const activeClass = classes.find(c => c.id === selectedClassId)
      const roomCode = activeClass?.room_code || 'GAME88'

      const chosenQuestions = selectedQuestions.length > 0
        ? questions.filter(q => selectedQuestions.includes(q.id))
        : filteredQuestions.slice(0, 5)

      await createGameSession({
        class_id: selectedClassId,
        game_type: selectedMode,
        room_code: roomCode,
        template: {
          questions: chosenQuestions,
        },
      })

      // Mở Display mode trên tab mới và chuyển hướng trang hiện tại sang Scanner mode
      window.open(`/display?code=${roomCode}`, '_blank')
      router.push(`/scanner?code=${roomCode}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
            🎮 Trung tâm Trò chơi Lớp học
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Tùy biến bộ câu hỏi theo môn, số lượng và thể loại (Trắc nghiệm ABCD hoặc Đúng/Sai)
          </p>
        </div>
        <Link href="/questions">
          <Button variant="ghost" size="sm" leftIcon={<Plus size={15} />}>
            Quản lý Ngân hàng câu hỏi
          </Button>
        </Link>
      </div>

      {/* Bước 1: Chọn lớp học */}
      <Card padding="md" className="flex flex-col gap-3">
        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Bước 1: Chọn lớp học tham gia
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {classes.map(c => {
            const isSelected = selectedClassId === c.id
            return (
              <div
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] shadow-sm'
                    : 'border-[var(--color-border)] bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-2xl">📚</div>
                <div>
                  <p className="font-bold text-sm text-[var(--color-text)]">{c.name}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Mã phòng: {c.room_code}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Bước 2: Chọn thể loại game */}
      <Card padding="md" className="flex flex-col gap-3">
        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
          Bước 2: Chọn thể loại trò chơi
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAME_MODES.map(mode => {
            const isSelected = selectedMode === mode.type
            return (
              <div
                key={mode.type}
                onClick={() => setSelectedMode(mode.type)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 relative overflow-hidden ${
                  isSelected
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-opacity-20 shadow-md'
                    : 'border-[var(--color-border)] hover:border-slate-300'
                }`}
                style={{ background: isSelected ? mode.bg : 'white' }}
              >
                <span className="text-4xl p-2 rounded-xl bg-white/80 shadow-sm">{mode.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-[var(--color-text)]">{mode.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{mode.desc}</p>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full absolute top-2 right-2 text-white"
                  style={{ background: mode.color }}
                >
                  {mode.badge}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Bước 3: Tùy biến bộ câu hỏi */}
      <Card padding="md" className="flex flex-col gap-4 border shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
          <div>
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
              Bước 3: Chọn bộ câu hỏi thi đấu
            </span>
            <p className="text-xs font-bold text-[var(--color-primary)] mt-0.5">
              Đã chọn: {selectedQuestions.length > 0 ? selectedQuestions.length : filteredQuestions.length} câu hỏi
            </p>
          </div>

          {/* Quick Select Random buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold flex items-center gap-1 mr-1">
              <Shuffle size={13} /> Lấy nhanh:
            </span>
            {[3, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => selectRandomCount(n)}
                className="px-2.5 py-1 rounded-lg border bg-white hover:bg-[var(--color-surface-alt)] text-xs font-bold text-[var(--color-text)] transition-colors"
              >
                {n} câu
              </button>
            ))}
            <button
              onClick={toggleAllQuestions}
              className="px-2.5 py-1 rounded-lg border bg-white hover:bg-[var(--color-surface-alt)] text-xs font-bold text-[var(--color-primary)] transition-colors"
            >
              {selectedQuestions.length === filteredQuestions.length ? 'Bỏ chọn' : 'Tất cả'}
            </button>
          </div>
        </div>

        {/* Bộ lọc môn học & Thể loại câu hỏi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[var(--color-surface-alt)] p-3 rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1">
              <span>📚 Lọc theo Môn học:</span>
            </label>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="p-2 rounded-lg border bg-white text-xs font-bold text-[var(--color-text)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="all">Tất cả môn học ({questions.length} câu)</option>
              <option value="Toán học">📐 Toán học</option>
              <option value="Toán Tiếng Anh">📐 Toán Tiếng Anh (Math in English)</option>
              <option value="Tiếng Anh">🔤 Tiếng Anh</option>
              <option value="Tiếng Việt">📖 Tiếng Việt</option>
              <option value="Tự nhiên & Xã hội">🌍 Tự nhiên & Xã hội</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1">
              <span>⚖️ Lọc theo Định dạng câu hỏi:</span>
            </label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="p-2 rounded-lg border bg-white text-xs font-bold text-[var(--color-text)]"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <option value="all">Tất cả định dạng</option>
              <option value="mcq">🔤 Trắc nghiệm 4 lựa chọn (A/B/C/D)</option>
              <option value="true_false">🟢🔴 Đúng / Sai (True / False)</option>
            </select>
          </div>
        </div>

        {/* Danh sách câu hỏi checkbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-xs text-[var(--color-text-muted)] bg-white rounded-xl border border-dashed border-[var(--color-border)]">
              Không tìm thấy câu hỏi phù hợp với bộ lọc. Hãy đổi bộ lọc hoặc tạo thêm câu hỏi mới.
            </div>
          ) : (
            filteredQuestions.map((q, idx) => {
              const isChecked = selectedQuestions.length === 0 || selectedQuestions.includes(q.id)
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestion(q.id)}
                  className={`p-3 rounded-xl border-2 text-xs cursor-pointer transition-all flex items-start gap-3 ${
                    isChecked
                      ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] font-semibold shadow-xs'
                      : 'border-[var(--color-border)] bg-white opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="accent-[var(--color-primary)] rounded mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--color-text)] leading-snug mb-1 font-bold">
                      {idx + 1}. {q.content}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="neutral">{q.subject || 'Chung'}</Badge>
                      <Badge variant={q.question_type === 'true_false' ? 'secondary' : 'neutral'}>
                        {q.question_type === 'true_false' ? 'Đúng / Sai' : 'Trắc nghiệm ABCD'}
                      </Badge>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        ⏱️ {q.duration_seconds}s
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Nút Bắt đầu Game */}
      <div className="bg-white p-4 rounded-2xl border border-[var(--color-border)] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
          <span className="p-2 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-primary)]">
            <Tv size={18} />
          </span>
          <span>
            Hệ thống sẽ <strong>tự động mở Màn Chiếu TV</strong> trong tab mới và mở <strong>Bộ Điều Khiển Mobile</strong>.
          </span>
        </div>
        <Button
          size="xl"
          onClick={handleStartGame}
          isLoading={isLoading}
          leftIcon={<Play size={20} className="fill-current" />}
          className="w-full sm:w-auto font-bold"
        >
          Bắt đầu trò chơi ngay
        </Button>
      </div>
    </div>
  )
}
