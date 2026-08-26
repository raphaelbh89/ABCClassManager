'use client'
// src/components/attendance/SeatingGrid.tsx
// Sơ đồ ghế kéo-thả dùng @dnd-kit
import { useCallback, useMemo, useState } from 'react'
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { cn } from '@/utils/cn'
import { AvatarDisplay } from '@/components/student/AvatarDisplay'
import type { Student } from '@/types'
import { GripVertical, UserX } from 'lucide-react'
import { getEnglishName, getVietnameseName } from '@/utils/student-name'

// ─── Toạ độ ghế (row, col) → key ───
const seatKey = (row: number, col: number) => `${row}-${col}`

type AttendanceStatusValue = 'present' | 'absent' | 'late'

interface SeatingGridProps {
  students: Student[]
  rows: number
  cols: number
  onSeatChange: (moves: { student_id: string; seat_row: number | null; seat_col: number | null }[]) => void
  readOnly?: boolean
  /** Trạng thái điểm danh hôm nay: studentId → status. Học sinh 'absent' sẽ bị làm mờ khung ghế */
  attendanceStatus?: Record<string, AttendanceStatusValue>
}

// ─── Droppable Seat Cell ───
function SeatCell({
  row, col, student, isDragOver, readOnly, status,
}: {
  row: number
  col: number
  student?: Student
  isDragOver: boolean
  readOnly?: boolean
  status?: AttendanceStatusValue
}) {
  const isAbsent = Boolean(student && status === 'absent')
  const isLate = Boolean(student && status === 'late')

  const { setNodeRef, isOver } = useDroppable({ id: seatKey(row, col) })
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: student?.id ?? `empty-${row}-${col}`,
    disabled: !student || readOnly,
    data: { student, row, col },
  })

  const ref = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node)
    if (student) setDragRef(node)
  }, [setNodeRef, setDragRef, student])

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex items-center gap-2.5 transition-all duration-150',
        'rounded-[var(--radius-md)] border-2 min-h-[88px] px-2.5 pb-2 pt-6 text-left select-none',
        student
          ? isAbsent
            // Học sinh nghỉ học: khung mờ đi, viền đứt nét
            ? 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] opacity-40 saturate-[0.35]'
            : isDragging
              ? 'opacity-40 border-[var(--color-primary)] bg-[var(--color-surface-alt)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-md)]'
          : isOver || isDragOver
            ? 'border-[var(--color-primary)] border-dashed bg-[rgba(76,175,130,0.08)]'
            : 'border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] opacity-60',
        student && !readOnly && 'cursor-grab active:cursor-grabbing',
      )}
      {...(student && !readOnly ? { ...attributes, ...listeners } : {})}
    >
      {/* Seat label */}
      <span
        className="absolute top-1 left-1.5 font-bold leading-none"
        style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}
      >
        {row + 1}-{col + 1}
      </span>

      {/* Cờ trạng thái điểm danh trong ngày */}
      {student && isAbsent && (
        <span
          className="absolute top-1 right-1.5 font-black leading-none"
          style={{ fontSize: '0.6rem', color: 'var(--color-danger, #e74c3c)' }}
        >
          ✕ Vắng
        </span>
      )}
      {student && isLate && (
        <span
          className="absolute top-1 right-1.5 font-bold leading-none text-amber-500"
          style={{ fontSize: '0.6rem' }}
        >
          ⏰ Muộn
        </span>
      )}

      {student ? (
        <>
          {/* Avatar nằm một bên */}
          <div className="flex-shrink-0">
            <AvatarDisplay config={student.avatar_config} size="sm" />
          </div>

          {/* Cột chữ: Tên tiếng Việt ở trên, Tên tiếng Anh ở dưới */}
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <p
              className="font-bold leading-tight truncate w-full"
              style={{ fontSize: '0.82rem', color: 'var(--color-text)' }}
            >
              {getVietnameseName(student)}
            </p>
            <p
              className="italic leading-tight truncate w-full"
              style={{ fontSize: '0.72rem', color: student.english_name ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 600 }}
            >
              {getEnglishName(student) || '—'}
            </p>
          </div>
        </>
      ) : (
        <UserX size={16} style={{ color: 'var(--color-border)' }} className="mx-auto" />
      )}
    </div>
  )
}

// ─── Drag Overlay (hiển thị khi đang kéo) ───
function DragCard({ student }: { student: Student }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)]"
      style={{ background: 'var(--color-surface)', border: '2px solid var(--color-primary)' }}
    >
      <GripVertical size={14} style={{ color: 'var(--color-primary)' }} />
      <AvatarDisplay config={student.avatar_config} size="xs" />
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
          {getVietnameseName(student)}
        </span>
        {getEnglishName(student) && (
          <span className="italic text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
            {getEnglishName(student)}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───
export function SeatingGrid({ students, rows, cols, onSeatChange, readOnly = false, attendanceStatus }: SeatingGridProps) {
  const [activeStudent, setActiveStudent] = useState<Student | null>(null)

  // Xây map: seatKey → student
  const seatMap = useMemo(() => {
    const map = new Map<string, Student>()
    students.forEach(s => {
      if (s.seat_row != null && s.seat_col != null) {
        map.set(seatKey(s.seat_row, s.seat_col), s)
      }
    })
    return map
  }, [students])

  // Học sinh chưa có ghế
  const unseated = useMemo(
    () => students.filter(s => s.seat_row == null || s.seat_col == null),
    [students]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const student = active.data.current?.student as Student | undefined
    setActiveStudent(student ?? null)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveStudent(null)
    if (!over || !active.data.current?.student) return

    const draggedStudent = active.data.current.student as Student
    const fromRow: number | null = active.data.current.row ?? null
    const fromCol: number | null = active.data.current.col ?? null
    const toKey = over.id as string

    if (toKey === seatKey(fromRow!, fromCol!)) return // không đổi

    const [toRow, toCol] = toKey.split('-').map(Number)
    const targetStudent = seatMap.get(toKey)

    const moves: { student_id: string; seat_row: number | null; seat_col: number | null }[] = [
      { student_id: draggedStudent.id, seat_row: toRow, seat_col: toCol },
    ]

    // Đổi chỗ nếu ô đích đang có học sinh
    if (targetStudent) {
      moves.push({ student_id: targetStudent.id, seat_row: fromRow, seat_col: fromCol })
    }

    onSeatChange(moves)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4">
        {/* Grid sơ đồ ghế — cuộn ngang khi màn hình hẹp thay vì bóp vỡ ô */}
        <div className="overflow-x-auto scrollbar-none -mx-1 px-1 pb-1">
          <div className="min-w-[520px]">
          {/* Nhãn cột */}
          <div className="flex gap-2 mb-1 pl-0">
            <div className="w-4" /> {/* spacer */}
            {Array.from({ length: cols }, (_, c) => (
              <div
                key={c}
                className="flex-1 text-center font-bold truncate"
                style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}
              >
                Cột {c + 1}
              </div>
            ))}
          </div>

          {/* Các hàng */}
          {Array.from({ length: rows }, (_, r) => (
            <div key={r} className="flex gap-2 mb-2 items-center">
              {/* Nhãn hàng */}
              <div
                className="w-4 text-center font-bold flex-shrink-0"
                style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}
              >
                {r + 1}
              </div>
              {Array.from({ length: cols }, (_, c) => {
                const cellStudent = seatMap.get(seatKey(r, c))
                return (
                  <div key={c} className="flex-1 min-w-0">
                    <SeatCell
                      row={r}
                      col={c}
                      student={cellStudent}
                      isDragOver={false}
                      readOnly={readOnly}
                      status={cellStudent ? attendanceStatus?.[cellStudent.id] : undefined}
                    />
                  </div>
                )
              })}
            </div>
          ))}
          </div>
        </div>

        {/* Học sinh chưa có ghế */}
        {unseated.length > 0 && (
          <div>
            <p
              className="font-semibold mb-2"
              style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}
            >
              ⚠️ Chưa gán ghế ({unseated.length} học sinh)
            </p>
            <div className="flex flex-wrap gap-2">
              {unseated.map(s => (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1.5 rounded-[var(--radius-md)]',
                    attendanceStatus?.[s.id] === 'absent' && 'opacity-40 saturate-[0.35]'
                  )}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px dashed var(--color-secondary)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  <AvatarDisplay config={s.avatar_config} size="sm" />
                  <div className="flex flex-col leading-tight">
                    <span style={{ fontSize: '0.8rem' }}>{getVietnameseName(s)}</span>
                    <span className="italic" style={{ fontSize: '0.7rem', color: s.english_name ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                      {getEnglishName(s) || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeStudent ? <DragCard student={activeStudent} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
