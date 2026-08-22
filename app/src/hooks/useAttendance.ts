'use client'
// src/hooks/useAttendance.ts
import { useState, useCallback } from 'react'
import {
  getAttendanceSessions, getAttendanceByDate,
  saveAttendance, updateAttendanceRecord
} from '@/services/attendance'
import type { AttendanceSession, AttendanceStatus } from '@/types'

export function useAttendance(classId: string | null) {
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [todaySession, setTodaySession] = useState<AttendanceSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!classId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getAttendanceSessions(classId)
      setSessions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải lịch sử')
    } finally {
      setIsLoading(false)
    }
  }, [classId])

  const fetchToday = useCallback(async () => {
    if (!classId) return
    const today = new Date().toISOString().slice(0, 10)
    const session = await getAttendanceByDate(classId, today)
    setTodaySession(session)
    return session
  }, [classId])

  const confirmAttendance = useCallback(async (
    records: { student_id: string; status: AttendanceStatus; note?: string }[]
  ) => {
    if (!classId) throw new Error('Chưa chọn lớp')
    const today = new Date().toISOString().slice(0, 10)
    const session = await saveAttendance({ class_id: classId, date: today, records })
    setTodaySession(session)
    setSessions(prev => {
      const filtered = prev.filter(s => s.date !== today)
      return [session, ...filtered]
    })
    return session
  }, [classId])

  const quickUpdateRecord = useCallback(async (
    sessionId: string,
    studentId: string,
    status: AttendanceStatus
  ) => {
    await updateAttendanceRecord(sessionId, studentId, status)
    // Optimistic update trong session hiện tại
    const update = (s: AttendanceSession): AttendanceSession => ({
      ...s,
      records: s.records?.map(r =>
        r.student_id === studentId ? { ...r, status } : r
      ),
    })
    setTodaySession(prev => prev ? update(prev) : prev)
    setSessions(prev => prev.map(s => s.id === sessionId ? update(s) : s))
  }, [])

  return {
    sessions, todaySession, isLoading, error,
    fetchSessions, fetchToday, confirmAttendance, quickUpdateRecord,
  }
}
