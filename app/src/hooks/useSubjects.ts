'use client'
// src/hooks/useSubjects.ts
// Nguồn môn học dùng chung cho Settings / Ngân hàng câu hỏi / Trò chơi
import { useCallback, useEffect, useState } from 'react'
import { getSubjects, getTeachingSubjectIdsFromCache, type SubjectItem } from '@/services/subjects'

export function useSubjects() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await getSubjects()
      setSubjects(list)
      setError(null)
    } catch {
      setError('Không tải được danh sách môn học')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSubjects() }, [fetchSubjects])

  /** Môn giáo viên đang dạy: cache localStorage trước (hiện tức thì), sau đó lấy từ server */
  const teachingSubjects = (() => {
    const cached = typeof window !== 'undefined' ? getTeachingSubjectIdsFromCache() : null
    const ids = cached ?? subjects.filter(s => s.is_teaching).map(s => s.id)
    return subjects.filter(s => ids.includes(s.id))
  })()

  const teachingSubjectIds = (() => {
    const cached = typeof window !== 'undefined' ? getTeachingSubjectIdsFromCache() : null
    if (cached) return cached
    return subjects.filter(s => s.is_teaching).map(s => s.id)
  })()

  return { subjects, teachingSubjects, teachingSubjectIds, isLoading, error, refetch: fetchSubjects }
}
