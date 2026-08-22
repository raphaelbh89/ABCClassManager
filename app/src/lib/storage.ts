// src/lib/storage.ts
// Fallback Local Storage Storage Manager để app chạy mượt mà ngay cả khi chưa kết nối Supabase Cloud

import type { Class, Student, Question, Criterion, Evaluation, AttendanceSession } from '@/types'

const SAMPLE_CLASSES: Class[] = [
  {
    id: 'class-3a',
    teacher_id: 'teacher-demo',
    name: 'Lớp 3A',
    school_year: '2025-2026',
    grade_level: 3,
    room_code: 'LOP3A',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'class-3b',
    teacher_id: 'teacher-demo',
    name: 'Lớp 3B',
    school_year: '2025-2026',
    grade_level: 3,
    room_code: 'LOP3B',
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

const SAMPLE_STUDENTS: Student[] = [
  { id: 'st-1', class_id: 'class-3a', name: 'Nguyễn Văn An', avatar_config: { type: 'owl', color: '#4CAF82' }, seat_row: 0, seat_col: 0, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-2', class_id: 'class-3a', name: 'Trần Thị Bình', avatar_config: { type: 'cat', color: '#FFB347' }, seat_row: 0, seat_col: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-3', class_id: 'class-3a', name: 'Lê Hoàng Cúc', avatar_config: { type: 'rocket', color: '#7C4DFF' }, seat_row: 0, seat_col: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-4', class_id: 'class-3a', name: 'Phạm Minh Đức', avatar_config: { type: 'robot', color: '#29B6F6' }, seat_row: 0, seat_col: 3, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-5', class_id: 'class-3a', name: 'Vũ Ngọc Hân', avatar_config: { type: 'dragon', color: '#FF5252' }, seat_row: 1, seat_col: 0, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-6', class_id: 'class-3a', name: 'Đỗ Quốc Khánh', avatar_config: { type: 'star', color: '#FFB347' }, seat_row: 1, seat_col: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-7', class_id: 'class-3a', name: 'Bùi Mai Linh', avatar_config: { type: 'owl', color: '#7C4DFF' }, seat_row: 1, seat_col: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'st-8', class_id: 'class-3a', name: 'Hoàng Gia Nam', avatar_config: { type: 'rocket', color: '#4CAF82' }, seat_row: 1, seat_col: 3, is_active: true, created_at: new Date().toISOString() },
]

export function getLocalData<T>(key: string, defaultData: T): T {
  if (typeof window === 'undefined') return defaultData
  try {
    const item = localStorage.getItem(`classmanager_${key}`)
    return item ? JSON.parse(item) : defaultData
  } catch {
    return defaultData
  }
}

export function setLocalData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`classmanager_${key}`, JSON.stringify(data))
  } catch {}
}

export function initLocalDatabase() {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem('classmanager_classes')) {
    setLocalData('classes', SAMPLE_CLASSES)
  }
  if (!localStorage.getItem('classmanager_students')) {
    setLocalData('students', SAMPLE_STUDENTS)
  }
}
