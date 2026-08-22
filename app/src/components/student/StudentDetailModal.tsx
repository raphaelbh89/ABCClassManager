'use client'
// src/components/student/StudentDetailModal.tsx
import { Modal } from '@/components/common/Modal'
import { AvatarDisplay } from './AvatarDisplay'
import { RadarStats } from './RadarStats'
import { BadgeList } from './BadgeList'
import { Button } from '@/components/common/Button'
import { useEvaluations } from '@/hooks/useEvaluations'
import { Award, TrendingUp, History } from 'lucide-react'
import type { Student } from '@/types'

interface StudentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  student: Student | null
  classId: string | null
}

export function StudentDetailModal({
  isOpen,
  onClose,
  student,
  classId,
}: StudentDetailModalProps) {
  const { radarStats, achievements, evaluations, isLoading } = useEvaluations(
    classId,
    student?.id
  )

  if (!student) return null

  const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧙 Hồ sơ Nhân vật RPG" size="lg">
      <div className="flex flex-col gap-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Header thông tin nhân vật */}
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-[var(--color-surface-alt)]" style={{ borderColor: 'var(--color-border)' }}>
          <AvatarDisplay config={student.avatar_config} size="lg" showRing />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              {student.name}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {student.seat_row != null
                ? `Vị trí: Hàng ${student.seat_row + 1}, Cột ${(student.seat_col ?? 0) + 1}`
                : 'Chưa xếp chỗ'}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>
                ⭐ {totalScore} Điểm kinh nghiệm
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-accent)] text-white">
                Cấp {Math.min(5, Math.floor(totalScore / 100) + 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Biểu đồ Radar Stats RPG */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            <TrendingUp size={18} style={{ color: 'var(--color-primary)' }} />
            <span>Biểu đồ Chỉ số Kỹ năng (RPG Radar Stats)</span>
          </div>
          <div className="p-3 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Đang tải chỉ số...
              </div>
            ) : (
              <RadarStats stats={radarStats} />
            )}
          </div>
        </div>

        {/* Danh sách Huy hiệu / Thành tích */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            <Award size={18} style={{ color: 'var(--color-secondary)' }} />
            <span>Huy hiệu & Thành tích ({achievements.length})</span>
          </div>
          <div className="p-3 rounded-xl border bg-white" style={{ borderColor: 'var(--color-border)' }}>
            <BadgeList achievements={achievements} />
          </div>
        </div>

        {/* Lịch sử đánh giá gần đây */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
            <History size={18} style={{ color: 'var(--color-info)' }} />
            <span>Lịch sử nhận điểm</span>
          </div>
          <div className="p-3 rounded-xl border bg-white flex flex-col gap-2 max-h-40 overflow-y-auto" style={{ borderColor: 'var(--color-border)' }}>
            {evaluations.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>
                Chưa có lịch sử điểm nào.
              </p>
            ) : (
              evaluations.slice(0, 8).map(ev => (
                <div key={ev.id} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <span className="font-semibold">{ev.note || 'Đánh giá tích cực'}</span>
                    <span className="text-[10px] ml-2" style={{ color: 'var(--color-text-muted)' }}>
                      ({ev.session_type})
                    </span>
                  </div>
                  <span className={`font-bold ${ev.score >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-danger)]'}`}>
                    {ev.score > 0 ? `+${ev.score}` : ev.score}đ
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  )
}
