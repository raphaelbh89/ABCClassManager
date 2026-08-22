'use client'
// src/hooks/useStudents.ts
// Custom hook quản lý state học sinh theo lớp
import { useState, useEffect, useCallback } from 'react'
import {
  getStudentsByClass, createStudent,
  updateStudent, deleteStudent, saveSeatLayout
} from '@/services/students'
import type { Student, AvatarConfig } from '@/types'

export function useStudents(classId: string | null) {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    if (!classId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await getStudentsByClass(classId)
      setStudents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }, [classId])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const addStudent = useCallback(async (params: {
    name: string
    avatar_config?: AvatarConfig
    seat_row?: number
    seat_col?: number
  }) => {
    if (!classId) throw new Error('Chưa chọn lớp')
    const newStudent = await createStudent({ class_id: classId, ...params })
    setStudents(prev => [...prev, newStudent])
    return newStudent
  }, [classId])

  const editStudent = useCallback(async (
    id: string,
    params: Partial<Pick<Student, 'name' | 'avatar_config' | 'seat_row' | 'seat_col'>>
  ) => {
    const updated = await updateStudent(id, params)
    setStudents(prev => prev.map(s => s.id === id ? updated : s))
    return updated
  }, [])

  const removeStudent = useCallback(async (id: string) => {
    await deleteStudent(id)
    setStudents(prev => prev.filter(s => s.id !== id))
  }, [])

  const updateSeatMap = useCallback(async (
    seatMap: { student_id: string; seat_row: number | null; seat_col: number | null }[]
  ) => {
    // Optimistic update
    setStudents(prev => prev.map(s => {
      const seat = seatMap.find(m => m.student_id === s.id)
      if (!seat) return s
      return { ...s, seat_row: seat.seat_row, seat_col: seat.seat_col }
    }))
    await saveSeatLayout(seatMap)
  }, [])

  return { students, isLoading, error, refetch: fetchStudents, addStudent, editStudent, removeStudent, updateSeatMap }
}
