'use client'
// src/components/student/QuickActionFAB.tsx
import { useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { Button } from '@/components/common/Button'
import { AvatarDisplay } from './AvatarDisplay'
import { Zap, Plus, Minus } from 'lucide-react'
import type { Student, Criterion } from '@/types'

interface QuickActionFABProps {
  students: Student[]
  criteria: Criterion[]
  onGiveScore: (params: {
    studentId: string
    criteriaId: string
    score: number
    note?: string
    sessionType?: 'quick' | 'periodic' | 'game'
  }) => Promise<any>
}

export function QuickActionFAB({ students, criteria, onGiveScore }: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [selectedCriteriaId, setSelectedCriteriaId] = useState<string>('')
  const [scoreDelta, setScoreDelta] = useState<number>(5)
  const [note, setNote] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleOpen = () => {
    if (students.length > 0 && !selectedStudentId) setSelectedStudentId(students[0].id)
    if (criteria.length > 0 && !selectedCriteriaId) setSelectedCriteriaId(criteria[0].id)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !selectedCriteriaId) return

    setIsLoading(true)
    try {
      await onGiveScore({
        studentId: selectedStudentId,
        criteriaId: selectedCriteriaId,
        score: scoreDelta,
        note: note.trim() || undefined,
        sessionType: 'quick',
      })
      setNote('')
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (students.length === 0) return null

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--color-secondary), var(--color-secondary-dark))',
          zIndex: 'var(--z-fab)',
        }}
        title="Chấm điểm nhanh tại chỗ (Quick Action)"
      >
        <Zap size={26} className="fill-current animate-pulse" />
      </button>

      {/* Modal Quick Score */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="⚡ Chấm điểm nhanh tại chỗ" size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Chọn học sinh */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Chọn học sinh
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="p-2.5 rounded-lg border bg-white text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.seat_row != null ? `(Ghế ${s.seat_row + 1}-${(s.seat_col ?? 0) + 1})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn tiêu chí */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Chọn tiêu chí đánh giá
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {criteria.map(c => {
                const isSelected = selectedCriteriaId === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCriteriaId(c.id)}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-alt)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span className="truncate">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chọn số điểm (+ / -) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Số điểm cộng/trừ
            </label>
            <div className="flex items-center gap-3 justify-center py-2">
              {[-10, -5, +5, +10, +20].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setScoreDelta(val)}
                  className={`px-3 py-1.5 rounded-full font-bold text-sm transition-transform hover:scale-105 ${
                    scoreDelta === val
                      ? val > 0
                        ? 'bg-[var(--color-primary)] text-white ring-2 ring-offset-1 ring-[var(--color-primary)]'
                        : 'bg-[var(--color-danger)] text-white ring-2 ring-offset-1 ring-[var(--color-danger)]'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Ghi chú nhanh */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Ghi chú (tuỳ chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Hăng hái phát biểu, giúp đỡ bạn..."
              className="p-2.5 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" isLoading={isLoading}>
              ⚡ Xác nhận chấm điểm
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
