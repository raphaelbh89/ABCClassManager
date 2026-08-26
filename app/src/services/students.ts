// src/services/students.ts
// CRUD Học sinh gọi trực tiếp Local SQLite API
import type { Student, AvatarConfig } from '@/types'

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  try {
    const res = await fetch(`/api/students?classId=${encodeURIComponent(classId)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Lỗi lấy danh sách học sinh')
    return await res.json()
  } catch {
    return []
  }
}

export async function getStudentById(id: string): Promise<Student | null> {
  try {
    const res = await fetch('/api/students', { cache: 'no-store' })
    const all: Student[] = await res.json()
    return all.find(s => s.id === id) || null
  } catch {
    return null
  }
}

export async function createStudent(params: {
  class_id: string
  name: string
  english_name?: string | null
  avatar_config?: AvatarConfig
  seat_row?: number
  seat_col?: number
}): Promise<Student> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Không thể thêm học sinh')
  return await res.json()
}

export async function bulkImportStudents(
  classId: string,
  rows: { name: string; english_name?: string | null }[]
): Promise<Student[]> {
  const res = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ class_id: classId, students: rows }),
  })
  if (!res.ok) throw new Error('Không thể nhập danh sách học sinh')
  return await res.json()
}

export async function updateStudent(
  id: string,
  params: Partial<Pick<Student, 'name' | 'english_name' | 'avatar_config' | 'seat_row' | 'seat_col' | 'is_active'>>
): Promise<Student> {
  const res = await fetch('/api/students', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...params }),
  })
  if (!res.ok) throw new Error('Không thể cập nhật học sinh')
  return await res.json()
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`/api/students?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Không thể xoá học sinh')
}

export async function saveSeatLayout(
  seatMap: { student_id: string; seat_row: number | null; seat_col: number | null }[]
): Promise<void> {
  const res = await fetch('/api/students', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'batch_seats', seatMap }),
  })
  if (!res.ok) throw new Error('Không thể lưu sơ đồ ghế')
}
