// src/utils/student-name.ts
// Nguồn chuẩn nhất (single source of truth) cho việc hiển thị tên học sinh
// trên TOÀN BỘ ứng dụng — mọi trang phải import từ đây, không tự format riêng lẻ.
import type { Student } from '@/types'

type NameCarrier = Pick<Student, 'name'> & Partial<Pick<Student, 'english_name'>>

/** Tên tiếng Anh đã làm sạch, hoặc null nếu chưa có dữ liệu */
export function getEnglishName(student: NameCarrier): string | null {
  const raw = student.english_name?.trim()
  return raw ? raw : null
}

/** Họ và tên tiếng Việt, viết hoa chữ cái đầu mỗi từ */
export function getVietnameseName(student: NameCarrier): string {
  return student.name
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Dòng hiển thị gộp một hàng: "Nguyễn Văn An · Andy" (bỏ phần EN nếu trống/trùng) */
export function formatFullNameLine(
  student: NameCarrier,
  options: { separator?: string; fallbackDash?: boolean } = {}
): string {
  const { separator = ' · ', fallbackDash = false } = options
  const vn = getVietnameseName(student)
  const en = getEnglishName(student)
  if (!en || en.toLowerCase() === vn.toLowerCase()) return vn
  if (!fallbackDash && !vn) return en
  return `${vn}${separator}${en}`
}

/** Tên cuối (gọi ngắn trong lớp): "Minh Anh", kèm tên EN nếu có */
export function formatShortName(student: NameCarrier): string {
  const lastWords = student.name.split(' ').filter(Boolean).slice(-2).join(' ')
  const en = getEnglishName(student)
  return en ? `${lastWords} (${en})` : lastWords
}
