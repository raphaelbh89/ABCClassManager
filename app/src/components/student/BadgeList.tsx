'use client'
// src/components/student/BadgeList.tsx
import { Badge } from '@/components/common/Badge'
import type { Achievement } from '@/types'

const BADGE_MAP: Record<string, { icon: string; name: string; color: string }> = {
  first_step:    { icon: '🌱', name: 'Bước Khởi Đầu', color: '#4CAF82' },
  score_100:     { icon: '⭐', name: 'Tích Cực', color: '#29B6F6' },
  score_300:     { icon: '🌟', name: 'Xuất Sắc', color: '#FFB347' },
  dedicated_10:  { icon: '🔥', name: 'Chăm Chỉ', color: '#FF5252' },
  team_winner:   { icon: '🏆', name: 'Nhóm Vô Địch', color: '#7C4DFF' },
  perfect_week:  { icon: '💎', name: 'Chuyên Cần Vàng', color: '#FF80AB' },
}

interface BadgeListProps {
  achievements: Achievement[]
}

export function BadgeList({ achievements }: BadgeListProps) {
  if (achievements.length === 0) {
    return (
      <div className="text-center py-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Chưa mở khóa huy hiệu nào. Hãy tham gia lớp để nhận thưởng! 🏅
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {achievements.map(ach => {
        const info = BADGE_MAP[ach.badge_type] || { icon: '🏅', name: ach.badge_type, color: 'var(--color-accent)' }
        return (
          <div
            key={ach.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-transform hover:scale-105"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
            }}
            title={ach.trigger_description || info.name}
          >
            <span className="text-base">{info.icon}</span>
            <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
              {info.name}
            </span>
          </div>
        )
      })}
    </div>
  )
}
