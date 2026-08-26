'use client'
// src/components/student/StudentNameText.tsx
// Component hiển thị tên HS chuẩn nhất toàn app:
// layout 'stacked'  → tên Việt trên, tên Anh dưới (sơ đồ ghế, card dọc)
// layout 'inline'   → "Nguyễn Văn An · Andy" một hàng (pill đua vịt, dropdown, bảng)
import { formatFullNameLine, getEnglishName, getVietnameseName } from '@/utils/student-name'

interface StudentNameTextProps {
  student: { name: string; english_name?: string | null }
  layout?: 'stacked' | 'inline'
  sizeVn?: number
  sizeEn?: number
  colorVn?: string
  colorEn?: string
  classNameVn?: string
  classNameEn?: string
}

export function StudentNameText({
  student,
  layout = 'stacked',
  sizeVn = 0.82,
  sizeEn = 0.72,
  colorVn = 'var(--color-text)',
  colorEn = 'var(--color-primary)',
  classNameVn = 'font-bold leading-tight truncate w-full',
  classNameEn = 'italic font-semibold leading-tight truncate w-full',
}: StudentNameTextProps) {
  const vn = getVietnameseName(student)
  const en = getEnglishName(student)

  if (layout === 'inline') {
    return (
      <span className="truncate" style={{ fontSize: sizeVn, color: colorVn }}>
        {vn}
        {en && (
          <span className={classNameEn} style={{ fontSize: Math.max(sizeEn, sizeVn - 0.08), color: colorEn }}>
            {' · '}
            {en}
          </span>
        )}
      </span>
    )
  }

  return (
    <div className="flex flex-col justify-center min-w-0 flex-1">
      <p className={classNameVn} style={{ fontSize: sizeVn, color: colorVn }}>
        {vn}
      </p>
      <p className={classNameEn} style={{ fontSize: sizeEn, color: en ? colorEn : 'var(--color-text-muted)' }}>
        {en || '—'}
      </p>
    </div>
  )
}
