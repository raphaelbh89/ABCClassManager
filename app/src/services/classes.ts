// src/services/classes.ts
// CRUD Lớp học gọi trực tiếp Local SQLite API
import type { Class } from '@/types'

export async function getClasses(): Promise<Class[]> {
  try {
    const res = await fetch('/api/classes', { cache: 'no-store' })
    if (!res.ok) throw new Error('Lỗi lấy danh sách lớp')
    return await res.json()
  } catch {
    return []
  }
}

export async function getClassById(id: string): Promise<Class | null> {
  const classes = await getClasses()
  return classes.find(c => c.id === id) || null
}

export async function createClass(params: {
  name: string
  school_year: string
  grade_level: number
}): Promise<Class> {
  const res = await fetch('/api/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Không thể tạo lớp')
  return await res.json()
}

export async function updateClass(
  id: string,
  params: Partial<Pick<Class, 'name' | 'school_year' | 'grade_level' | 'is_active'>>
): Promise<Class> {
  const res = await fetch('/api/classes', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...params }),
  })
  if (!res.ok) throw new Error('Không thể cập nhật lớp')
  return await res.json()
}

export async function deleteClass(id: string): Promise<void> {
  const res = await fetch(`/api/classes?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Không thể xoá lớp')
}
