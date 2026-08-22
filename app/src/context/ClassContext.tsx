'use client'
// src/context/ClassContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getClasses } from '@/services/classes'
import type { Class } from '@/types'

interface ClassContextType {
  classes: Class[]
  currentClass: Class | null
  setCurrentClass: (cls: Class) => void
  isLoading: boolean
  refreshClasses: () => Promise<void>
}

const ClassContext = createContext<ClassContextType | undefined>(undefined)

export function ClassProvider({ children }: { children: React.ReactNode }) {
  const [classes, setClasses] = useState<Class[]>([])
  const [currentClass, setCurrentClassState] = useState<Class | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshClasses = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getClasses()
      setClasses(data)

      // Khôi phục lớp đã chọn từ localStorage hoặc chọn lớp đầu tiên
      const savedClassId = localStorage.getItem('classmanager_selected_class_id')
      const matched = data.find(c => c.id === savedClassId)

      if (matched) {
        setCurrentClassState(matched)
      } else if (data.length > 0) {
        setCurrentClassState(data[0])
        localStorage.setItem('classmanager_selected_class_id', data[0].id)
      }
    } catch {
      setClasses([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshClasses()
  }, [refreshClasses])

  const setCurrentClass = useCallback((cls: Class) => {
    setCurrentClassState(cls)
    localStorage.setItem('classmanager_selected_class_id', cls.id)
  }, [])

  return (
    <ClassContext.Provider
      value={{
        classes,
        currentClass,
        setCurrentClass,
        isLoading,
        refreshClasses,
      }}
    >
      {children}
    </ClassContext.Provider>
  )
}

export function useCurrentClass() {
  const context = useContext(ClassContext)
  if (!context) {
    throw new Error('useCurrentClass must be used within a ClassProvider')
  }
  return context
}
