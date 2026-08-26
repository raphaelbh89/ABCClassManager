// src/services/subjects.ts
// Subject Configuration Module — gọi API danh mục môn học
export interface SubjectItem {
  id: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
  question_count: number
  is_teaching: boolean
}

const LS_KEY = 'classmanager_teaching_subject_ids'

export async function getSubjects(): Promise<SubjectItem[]> {
  try {
    const res = await fetch('/api/subjects', { cache: 'no-store' })
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return []
  }
}

/** IDs môn giảng dạy — ưu tiên server, fallback localStorage mirror */
export function getTeachingSubjectIdsFromCache(): string[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : null
  } catch {
    return null
  }
}

export function cacheTeachingSubjectIds(ids: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids))
    // Mirror giá trị legacy để các trang cũ (chưa nâng cấp) vẫn đọc được
    const TRIO = ['subj-tieng-anh', 'subj-toan-tieng-anh', 'subj-khoa-hoc-tieng-anh']
    if (ids.length === 0) localStorage.setItem('classmanager_teaching_subject', 'all')
    else if (TRIO.every(id => ids.includes(id))) localStorage.setItem('classmanager_teaching_subject', 'all_english')
    else if (ids.length === 1) {
      const map: Record<string, string> = {
        'subj-tieng-anh': 'Tiếng Anh',
        'subj-toan-tieng-anh': 'Toán Tiếng Anh',
        'subj-khoa-hoc-tieng-anh': 'Khoa học Tiếng Anh',
      }
      localStorage.setItem('classmanager_teaching_subject', map[ids[0]] || 'all_english')
    }
  } catch {}
}

export async function createSubject(name: string, icon = '📘') {
  const res = await fetch('/api/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Không thể tạo môn học')
  return data as { id: string; name: string; icon: string }
}

export async function updateSubject(id: string, params: { name?: string; icon?: string }) {
  const res = await fetch('/api/subjects', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...params }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Không thể cập nhật môn học')
  return data
}

export async function deleteSubject(id: string) {
  const res = await fetch(`/api/subjects?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Không thể xoá môn học')
}

export async function setTeachingSubjects(subjectIds: string[]) {
  const res = await fetch('/api/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set_teaching', subjectIds }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Không thể lưu lựa chọn môn giảng dạy')
  cacheTeachingSubjectIds(subjectIds)
  return data
}
