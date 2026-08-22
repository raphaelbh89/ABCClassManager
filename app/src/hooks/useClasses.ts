'use client'
// src/hooks/useClasses.ts
// Custom hook quản lý state danh sách lớp học
import { useState, useEffect, useCallback } from 'react'
import { getClasses, createClass, updateClass, deleteClass } from '@/services/classes'
import type { Class } from '@/types'

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getClasses()
      setClasses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  const addClass = useCallback(async (params: {
    name: string; school_year: string; grade_level: number
  }) => {
    const newClass = await createClass(params)
    setClasses(prev => [newClass, ...prev])
    return newClass
  }, [])

  const editClass = useCallback(async (
    id: string,
    params: Partial<Pick<Class, 'name' | 'school_year' | 'grade_level' | 'is_active'>>
  ) => {
    const updated = await updateClass(id, params)
    setClasses(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }, [])

  const removeClass = useCallback(async (id: string) => {
    await deleteClass(id)
    setClasses(prev => prev.filter(c => c.id !== id))
  }, [])

  return { classes, isLoading, error, refetch: fetchClasses, addClass, editClass, removeClass }
}
