// src/services/attendance.ts
// Điểm danh gọi trực tiếp Local SQLite API
import type { AttendanceSession, AttendanceStatus } from '@/types'

export async function getAttendanceSessions(classId: string): Promise<AttendanceSession[]> {
  try {
    const res = await fetch(`/api/attendance?classId=${encodeURIComponent(classId)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Lỗi lấy lịch sử')
    return await res.json()
  } catch {
    return []
  }
}

export async function getAttendanceByDate(
  classId: string,
  date: string
): Promise<AttendanceSession | null> {
  try {
    const res = await fetch(`/api/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function saveAttendance(params: {
  class_id: string
  date: string
  records: { student_id: string; status: AttendanceStatus; note?: string }[]
}): Promise<AttendanceSession> {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Không thể lưu điểm danh')
  return await res.json()
}

export async function updateAttendanceRecord(
  sessionId: string,
  studentId: string,
  status: AttendanceStatus
): Promise<void> {
  // Có thể gọi saveAttendance hoặc API update đơn lẻ
}
