'use client'
// src/components/student/StudentCard.tsx
// Card học sinh kiểu RPG — hiển thị trong danh sách
import { cn } from '@/utils/cn'
import { AvatarDisplay } from './AvatarDisplay'
import { Badge } from '@/components/common/Badge'
import type { Student } from '@/types'

interface StudentCardProps {
  student: Student
  /** Điểm tổng đã tính từ evaluations (truyền từ ngoài vào) */
  totalScore?: number
  /** Số huy hiệu */
  badgeCount?: number
  onClick?: () => void
  compact?: boolean
  className?: string
}

/** Tính cấp độ từ điểm tổng */
function calcLevel(score: number): { level: number; label: string; color: string } {
  if (score >= 400) return { level: 5, label: 'Huyền Thoại', color: '#7C4DFF' }
  if (score >= 300) return { level: 4, label: 'Xuất Sắc', color: '#FFB347' }
  if (score >= 200) return { level: 3, label: 'Tiến Bộ', color: '#4CAF82' }
  if (score >= 100) return { level: 2, label: 'Cố Gắng', color: '#29B6F6' }
  return { level: 1, label: 'Khởi Đầu', color: '#636E72' }
}

const STARS = (level: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} style={{ color: i < level ? '#FFB347' : '#DFE6E9' }}>★</span>
  ))

export function StudentCard({
  student,
  totalScore = 0,
  badgeCount = 0,
  onClick,
  compact = false,
  className,
}: StudentCardProps) {
  const { level, label, color } = calcLevel(totalScore)

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 p-3',
          'rounded-[var(--radius-md)] border border-[var(--color-border)]',
          'bg-[var(--color-surface)]',
          onClick && 'cursor-pointer hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-sm)]',
          'transition-all duration-[var(--transition-fast)]',
          className
        )}
      >
        <AvatarDisplay config={student.avatar_config} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            {student.name}
          </p>
          <div className="flex items-center gap-1" style={{ fontSize: '0.7rem' }}>
            {STARS(level)}
            <span style={{ color: 'var(--color-text-muted)', marginLeft: 2 }}>Cấp {level}</span>
          </div>
        </div>
        {badgeCount > 0 && (
          <Badge variant="secondary">🏅 {badgeCount}</Badge>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-3 p-5 text-center',
        'rounded-[var(--radius-lg)] border border-[var(--color-border)]',
        'bg-[var(--color-surface)] shadow-[var(--shadow-card)]',
        onClick && 'cursor-pointer hover:shadow-[var(--shadow-lg)] hover:-translate-y-1',
        'transition-all duration-[var(--transition-normal)]',
        className
      )}
    >
      {/* Avatar */}
      <AvatarDisplay config={student.avatar_config} size="lg" showRing />

      {/* Name */}
      <div>
        <p className="font-bold" style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
          {student.name}
        </p>
        {/* Stars */}
        <div className="flex justify-center gap-0.5 mt-1" style={{ fontSize: '1rem' }}>
          {STARS(level)}
        </div>
      </div>

      {/* Level badge */}
      <span
        className="px-3 py-1 rounded-full text-xs font-bold text-white"
        style={{ background: color }}
      >
        Cấp {level} · {label}
      </span>

      {/* Stats */}
      <div className="flex gap-3 text-center w-full">
        <div className="flex-1">
          <p className="font-bold" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-primary)' }}>
            {totalScore}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Điểm</p>
        </div>
        <div className="w-px" style={{ background: 'var(--color-border)' }} />
        <div className="flex-1">
          <p className="font-bold" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-secondary)' }}>
            {badgeCount}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Huy hiệu</p>
        </div>
        {student.seat_row != null && (
          <>
            <div className="w-px" style={{ background: 'var(--color-border)' }} />
            <div className="flex-1">
              <p className="font-bold" style={{ fontSize: 'var(--text-lg)', color: 'var(--color-info)' }}>
                {student.seat_row + 1}-{(student.seat_col ?? 0) + 1}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Ghế</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
