'use client'
// src/components/attendance/AttendanceConfirm.tsx
// Bước xác nhận thủ công sau khi AI phân tích ảnh
// Giáo viên xem lại, click để lật trạng thái từng học sinh

import { useState, useCallback } from 'react'
import { cn } from '@/utils/cn'
import { AvatarDisplay } from '@/components/student/AvatarDisplay'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { Check, Save, RotateCcw, UserCheck, UserX, Clock } from 'lucide-react'
import type { Student, AttendanceStatus } from '@/types'
import type { PresenceResult } from '@/utils/presenceDetection'

export interface AttendanceEntry {
  student: Student
  status: AttendanceStatus
  /** Từ AI detection */
  aiSuggested?: AttendanceStatus
  note?: string
}

interface AttendanceConfirmProps {
  entries: AttendanceEntry[]
  onConfirm: (records: { student_id: string; status: AttendanceStatus; note?: string }[]) => Promise<void>
  onReset: () => void
  isLoading?: boolean
}

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string
  icon: React.ReactNode
  color: string
  bg: string
  next: AttendanceStatus
}> = {
  present: {
    label: 'Có mặt',
    icon: <UserCheck size={14} />,
    color: 'var(--color-primary)',
    bg: 'rgba(76,175,130,0.1)',
    next: 'absent',
  },
  absent: {
    label: 'Vắng',
    icon: <UserX size={14} />,
    color: 'var(--color-danger)',
    bg: 'rgba(255,82,82,0.08)',
    next: 'late',
  },
  late: {
    label: 'Trễ',
    icon: <Clock size={14} />,
    color: 'var(--color-secondary)',
    bg: 'rgba(255,179,71,0.1)',
    next: 'present',
  },
}

export function AttendanceConfirm({
  entries: initialEntries,
  onConfirm,
  onReset,
  isLoading = false,
}: AttendanceConfirmProps) {
  const [entries, setEntries] = useState<AttendanceEntry[]>(initialEntries)
  const [saving, setSaving] = useState(false)

  // Click để xoay vòng trạng thái: present → absent → late → present
  const toggleStatus = useCallback((studentId: string) => {
    setEntries(prev => prev.map(e => {
      if (e.student.id !== studentId) return e
      return { ...e, status: STATUS_CONFIG[e.status].next }
    }))
  }, [])

  // Đánh dấu tất cả có mặt (phím tắt)
  const markAllPresent = () => {
    setEntries(prev => prev.map(e => ({ ...e, status: 'present' })))
  }

  const stats = {
    present: entries.filter(e => e.status === 'present').length,
    absent:  entries.filter(e => e.status === 'absent').length,
    late:    entries.filter(e => e.status === 'late').length,
    unsure:  entries.filter(e => e.aiSuggested && e.aiSuggested !== e.status).length,
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      await onConfirm(entries.map(e => ({
        student_id: e.student.id,
        status: e.status,
        note: e.note,
      })))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* AI disclaimer */}
      <div
        className="flex items-start gap-3 p-3 rounded-[var(--radius-md)]"
        style={{ background: 'rgba(255,179,71,0.1)', border: '1px solid rgba(255,179,71,0.4)' }}
      >
        <span className="text-xl flex-shrink-0">⚠️</span>
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--color-secondary-dark)' }}>
            Kết quả AI chỉ là gợi ý — Vui lòng kiểm tra lại
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
            Click vào từng ô để đổi trạng thái: Có mặt → Vắng → Trễ → Có mặt.
            Bắt buộc bấm <strong>Xác nhận</strong> để lưu chính thức.
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Có mặt', count: stats.present, color: 'var(--color-primary)', icon: '✅' },
          { label: 'Vắng',   count: stats.absent,  color: 'var(--color-danger)',   icon: '❌' },
          { label: 'Trễ',    count: stats.late,    color: 'var(--color-secondary)', icon: '⏰' },
        ].map(s => (
          <div
            key={s.label}
            className="text-center py-3 rounded-[var(--radius-md)]"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-heading)' }}>
              {s.icon} {s.count}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={markAllPresent}>
          ✅ Tất cả có mặt
        </Button>
        <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<RotateCcw size={14} />}>
          Chụp lại
        </Button>
      </div>

      {/* Student grid — click để đổi trạng thái */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {entries.map(entry => {
          const cfg = STATUS_CONFIG[entry.status]
          const aiDiff = entry.aiSuggested && entry.aiSuggested !== entry.status

          return (
            <button
              key={entry.student.id}
              onClick={() => toggleStatus(entry.student.id)}
              className={cn(
                'flex items-center gap-2 p-2.5 rounded-[var(--radius-md)]',
                'text-left transition-all duration-150',
                'hover:scale-[1.02] active:scale-[0.98]',
                'border-2',
              )}
              style={{
                background: cfg.bg,
                borderColor: cfg.color,
              }}
              title={`Click để đổi → ${STATUS_CONFIG[cfg.next].label}`}
            >
              <AvatarDisplay config={entry.student.avatar_config} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate" style={{ fontSize: '0.7rem', color: 'var(--color-text)' }}>
                  {entry.student.name.split(' ').slice(-2).join(' ')}
                </p>
                <span
                  className="inline-flex items-center gap-1 font-bold"
                  style={{ fontSize: '0.65rem', color: cfg.color }}
                >
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              {/* AI suggestion mismatch indicator */}
              {aiDiff && (
                <span
                  title={`AI gợi ý: ${entry.aiSuggested}`}
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: 'var(--color-secondary)' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {stats.unsure > 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
          🟡 {stats.unsure} học sinh có trạng thái khác với gợi ý AI — vui lòng kiểm tra kỹ
        </p>
      )}

      {/* Confirm button */}
      <Button
        size="lg"
        onClick={handleConfirm}
        isLoading={saving || isLoading}
        leftIcon={<Save size={18} />}
        className="w-full"
      >
        ✅ Xác nhận & Lưu điểm danh ({stats.present} có mặt)
      </Button>
    </div>
  )
}
