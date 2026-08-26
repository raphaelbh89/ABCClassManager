'use client'
// src/app/(dashboard)/game/page.tsx
// Trung tâm Trò chơi Lớp học: Lọc & Chọn theo Bộ Chủ Đề, Setting Môn Giảng Dạy Tiếng Anh/Toán/Khoa học
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCurrentClass } from '@/context/ClassContext'
import { useQuestions } from '@/hooks/useQuestions'
import { useStudents } from '@/hooks/useStudents'
import { createGameSession } from '@/services/games'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import {
  Play,
  Shuffle,
  Users,
  Swords,
  ShieldAlert,
  Flame,
  HelpCircle,
  Plus,
  Filter,
  CheckCircle2,
  Sparkles,
  BookOpen,
  FolderPlus,
  Settings,
  Layers,
  Award,
} from 'lucide-react'
import type { GameType } from '@/types'
import { formatFullNameLine } from '@/utils/student-name'
import { useSubjects } from '@/hooks/useSubjects'
import { TopicDropdown } from '@/components/common/TopicDropdown'

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
    desc: 'Chọn 2 học sinh thi đấu đối kháng, tính thanh máu HP theo từng câu hỏi.',
    icon: '⚔️',
    color: 'var(--color-danger)',
    bg: 'rgba(255,82,82,0.1)',
    badge: 'Thanh máu Kịch tính',
  },
  {
    type: 'team',
    title: 'Đối Kháng Nhóm (Tổ vs Tổ)',
    desc: 'Thi đua giữa các tổ trong lớp, tổng hợp điểm số và thanh máu đồng đội.',
    icon: '🛡️',
    color: 'var(--color-accent)',
    bg: 'rgba(124,77,255,0.1)',
    badge: 'Tinh thần đồng đội',
  },
  {
    type: 'collective',
    title: 'Thử Thách Tập Thể (Đánh Boss)',
    desc: 'Cả lớp cùng trả lời đúng để hạ gục Boss quái vật (>80% đúng sẽ chiến thắng).',
    icon: '🐉',
    color: 'var(--color-secondary)',
    bg: 'rgba(255,179,71,0.15)',
    badge: 'Hợp tác diệt Boss',
  },
]

const TEACHING_SUBJECTS = [
  { id: 'all_english', name: '🌟 Tất cả Tiếng Anh (Tổng hợp)', subjects: ['Tiếng Anh', 'Toán Tiếng Anh', 'Khoa học Tiếng Anh'] },
  { id: 'Tiếng Anh', name: '🔤 Tiếng Anh (Language & Grammar)', subjects: ['Tiếng Anh'] },
  { id: 'Toán Tiếng Anh', name: '📐 Toán Tiếng Anh (Math in English)', subjects: ['Toán Tiếng Anh'] },
  { id: 'Khoa học Tiếng Anh', name: '🔬 Khoa học Tiếng Anh (Science in English)', subjects: ['Khoa học Tiếng Anh'] },
  { id: 'all', name: '🌐 Tất cả môn học', subjects: [] },
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

  const { students } = useStudents(selectedClassId || null)

  const [selectedMode, setSelectedMode] = useState<GameType>('individual')
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [teachingSubject, setTeachingSubject] = useState<string>('all_english')
  const [filterTopic, setFilterTopic] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // 2 Đấu thủ 1v1
  const [p1Id, setP1Id] = useState<string>('')
  const [p2Id, setP2Id] = useState<string>('')

  // Load Cài đặt Môn Giảng Dạy từ localStorage
  useEffect(() => {
    try {
      const savedSubject = localStorage.getItem('classmanager_teaching_subject')
      if (savedSubject) setTeachingSubject(savedSubject)
    } catch {}
  }, [])

  const handleUpdateTeachingSubject = (subjId: string) => {
    setTeachingSubject(subjId)
    setFilterTopic('all')
    try {
      localStorage.setItem('classmanager_teaching_subject', subjId)
    } catch {}
  }

  // Tự động gán 2 học sinh đầu tiên khi có danh sách lớp
  useEffect(() => {
    if (students && students.length >= 2) {
      if (!p1Id) setP1Id(students[0].id)
      if (!p2Id) setP2Id(students[1].id)
    }
  }, [students])

  // Chọn ngẫu nhiên 2 bạn
  const handleRandomDuelists = () => {
    if (students.length < 2) return
    const shuffled = [...students].sort(() => 0.5 - Math.random())
    setP1Id(shuffled[0].id)
    setP2Id(shuffled[1].id)
  }

  // Lọc câu hỏi theo môn giảng dạy của GV
  // Ưu tiên Subject Configuration Module (ids động từ Settings); fallback legacy key
  const { subjects: subjectsMaster } = useSubjects()
  const dynamicTeachingNames = useMemo(() => {
    let ids: string[] | null = null
    try {
      const raw = localStorage.getItem('classmanager_teaching_subject_ids')
      const parsed = raw ? JSON.parse(raw) : null
      ids = Array.isArray(parsed) ? parsed : null
    } catch {}
    if (!ids || ids.length === 0) {
      ids = subjectsMaster.filter(s => s.is_teaching).map(s => s.id)
    }
    if (!ids || ids.length === 0) return []
    return subjectsMaster.filter(s => ids!.includes(s.id)).map(s => s.name)
  }, [subjectsMaster])

  const subjectFilteredQuestions = useMemo(() => {
    if (dynamicTeachingNames.length > 0) {
      return questions.filter(q => dynamicTeachingNames.includes(q.subject || ''))
    }
    const targetConfig = TEACHING_SUBJECTS.find(s => s.id === teachingSubject)
    if (!targetConfig || targetConfig.subjects.length === 0) return questions
    return questions.filter(q => targetConfig.subjects.includes(q.subject || ''))
  }, [questions, teachingSubject, dynamicTeachingNames])

  // Danh sách các Chủ Đề (Topics) trích xuất từ các câu hỏi
  // Danh sách các Chủ Đề (Topics) trích xuất từ các câu hỏi
  const availableTopics = useMemo(() => {
    const topicMap = new Map<string, number>()
    subjectFilteredQuestions.forEach(q => {
      const topicName = q.topic || q.subject || 'Tổng hợp'
      topicMap.set(topicName, (topicMap.get(topicName) || 0) + 1)
    })
    return Array.from(topicMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [subjectFilteredQuestions])

  // Danh sách câu hỏi sau khi lọc Môn + Chủ đề + Thể loại
  const filteredQuestions = useMemo(() => {
    return subjectFilteredQuestions.filter(q => {
      const matchTopic = filterTopic === 'all' || (q.topic || q.subject || 'Tổng hợp') === filterTopic
      const matchType = filterType === 'all' || q.question_type === filterType
      return matchTopic && matchType
    })
  }, [subjectFilteredQuestions, filterTopic, filterType])

  // Chọn/bỏ chọn tất cả trong bộ lọc hiện tại
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

  // Chọn nhanh CẢ BỘ THEO CHỦ ĐỀ
  const handleSelectEntireTopic = (topicName: string) => {
    setFilterTopic(topicName)
    const topicQuestions = subjectFilteredQuestions
      .filter(q => (q.topic || q.subject || 'Tổng hợp') === topicName)
      .map(q => q.id)
    setSelectedQuestions(topicQuestions)
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

      // Chuẩn hoá game_type
      const normalizedGameType =
        selectedMode === '1v1'
          ? 'arena'
          : selectedMode === 'collective'
          ? 'boss'
          : selectedMode === 'individual'
          ? 'classic'
          : 'team'

      const student1 = students.find(s => s.id === p1Id) || students[0]
      const student2 = students.find(s => s.id === p2Id) || students[1] || students[0]

      // Tự động xáo trộn vị trí các phương án A, B, C, D cho câu hỏi để đáp án đúng không bị trùng lặp
      const randomizedQuestions = chosenQuestions.map(q => {
        let opts = q.options || []
        if (typeof opts === 'string') {
          try { opts = JSON.parse(opts) } catch {}
        }

        if (Array.isArray(opts) && opts.length >= 3 && q.question_type !== 'true_false' && q.question_type !== 'truefalse') {
          const oldCorrect = opts.find((o: any) => o.label === q.correct_answer) || opts[0]
          const correctText = oldCorrect?.text || String(oldCorrect)

          const shuffled = [...opts].sort(() => 0.5 - Math.random())
          const labels = ['A', 'B', 'C', 'D', 'E', 'F']

          const newOptions = shuffled.map((item: any, idx: number) => ({
            label: labels[idx] || `${idx + 1}`,
            text: item?.text || String(item),
          }))

          const newCorrect = newOptions.find(o => o.text === correctText) || newOptions[0]

          return {
            ...q,
            options: newOptions,
            correct_answer: newCorrect.label,
          }
        }

        return q
      })

      await createGameSession({
        class_id: selectedClassId,
        game_type: normalizedGameType,
        room_code: roomCode,
        template: {
          questions: randomizedQuestions,
          duel_players: {
            p1: { id: student1?.id || 'p1', name: student1?.name || 'Đấu thủ 1', english_name: student1?.english_name || null, hp: 100 },
            p2: { id: student2?.id || 'p2', name: student2?.name || 'Đấu thủ 2', english_name: student2?.english_name || null, hp: 100 },
          },
        },
      })

      // Xoá sự kiện cũ của phòng để Display bắt đầu ở Màn hình chờ
      await fetch(`/api/realtime?roomCode=${encodeURIComponent(roomCode)}`, { method: 'DELETE' }).catch(() => {})

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-bold text-2xl" style={{ fontFamily: 'var(--font-heading)' }}>
            🎮 Trung tâm Trò chơi Lớp học
            <span className="ml-2 font-semibold text-sm text-[var(--color-text-muted)]">
              (Classroom Game Hub)
            </span>
          </h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            Chọn thể loại, bộ câu hỏi theo chủ đề và bắt đầu tiết học tương tác
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Cài đặt môn giảng dạy nhanh */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Môn GV:</span>
            <select
              value={teachingSubject}
              onChange={e => handleUpdateTeachingSubject(e.target.value)}
              className="p-1 text-xs font-black text-[var(--color-primary)] bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              {TEACHING_SUBJECTS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <Link href="/questions">
            <Button variant="ghost" size="sm" leftIcon={<Plus size={15} />}>
              Ngân hàng câu hỏi
            </Button>
          </Link>
        </div>
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

        {/* Tùy chọn đặc biệt cho chế độ 1v1: Chọn 2 học sinh đối đầu */}
        {selectedMode === '1v1' && (
          <div className="mt-2 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-blue-50 border border-red-200 flex flex-col gap-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-950 flex items-center gap-1.5">
                <Swords size={16} className="text-red-600" />
                Chọn 2 Đấu Thủ Cho Trận Đối Kháng 1 vs 1:
              </span>
              <button
                type="button"
                onClick={handleRandomDuelists}
                className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
              >
                <Shuffle size={13} />
                <span>Chọn ngẫu nhiên 2 bạn</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-red-800">Đấu thủ 1 (Thanh Máu Đỏ):</label>
                <select
                  value={p1Id}
                  onChange={e => setP1Id(e.target.value)}
                  className="p-2 rounded-lg border bg-slate-50 text-xs font-bold text-slate-800"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{formatFullNameLine(s)} ({s.seat_row != null ? `Bàn ${s.seat_row + 1}` : 'Chưa xếp ghế'})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-blue-800">Đấu thủ 2 (Thanh Máu Xanh):</label>
                <select
                  value={p2Id}
                  onChange={e => setP2Id(e.target.value)}
                  className="p-2 rounded-lg border bg-slate-50 text-xs font-bold text-slate-800"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{formatFullNameLine(s)} ({s.seat_row != null ? `Bàn ${s.seat_row + 1}` : 'Chưa xếp ghế'})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Bước 3: Lọc & Chọn bộ câu hỏi THEO CHỦ ĐỀ */}
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
              {selectedQuestions.length === filteredQuestions.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
            </button>
          </div>
        </div>

        {/* ─── CHỌN BỘ CÂU HỎI THEO CHỦ ĐỀ — DROPDOWN KHÔNG BỊ CHE ─── */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Layers size={15} className="text-amber-500" />
            Chọn Bộ Câu Hỏi Theo Chủ Đề Bài Học:
          </span>

          <TopicDropdown
            topics={availableTopics}
            value={filterTopic}
            onSelect={name => {
              if (name === 'all') {
                setFilterTopic('all')
                setSelectedQuestions([])
              } else {
                handleSelectEntireTopic(name)
              }
            }}
            totalCount={subjectFilteredQuestions.length}
          />
        </div>

        {/* Danh sách câu hỏi checkbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="col-span-2 p-6 text-center text-xs text-[var(--color-text-muted)] bg-white rounded-xl border border-dashed border-[var(--color-border)]">
              Không tìm thấy câu hỏi thuộc chủ đề này. Hãy chọn chủ đề khác hoặc vào Ngân hàng câu hỏi để tạo thêm.
            </div>
          ) : (
            filteredQuestions.map(q => {
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
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                        {q.topic || q.subject || 'Tổng hợp'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {q.question_type === 'true_false' ? 'Đúng/Sai' : 'Trắc nghiệm'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        (Đáp án: {q.correct_answer})
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[var(--color-text)] font-bold">{q.content}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Nút Khởi chạy Game */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={handleStartGame}
          isLoading={isLoading}
          leftIcon={<Play size={20} />}
          className="w-full sm:w-auto font-black px-8 py-4 text-base bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-lg"
        >
          Bắt đầu trò chơi ngay ({selectedQuestions.length > 0 ? selectedQuestions.length : filteredQuestions.length} câu)
        </Button>
      </div>
    </div>
  )
}
