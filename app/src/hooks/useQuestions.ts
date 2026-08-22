'use client'
// src/hooks/useQuestions.ts
import { useState, useCallback, useEffect } from 'react'
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  seedSampleQuestions,
} from '@/services/questions'
import type { Question, QuestionType } from '@/types'

export function useQuestions(selectedSubject?: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      let data = await getQuestions(selectedSubject)
      if (data.length === 0 && (!selectedSubject || selectedSubject === 'all')) {
        // Nếu chưa có câu hỏi nào thì tự động tạo câu hỏi mẫu
        data = await seedSampleQuestions()
      }
      setQuestions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lấy câu hỏi')
    } finally {
      setIsLoading(false)
    }
  }, [selectedSubject])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const addQuestion = useCallback(async (params: {
    subject?: string
    content: string
    question_type: QuestionType
    options: { label: string; text: string }[]
    correct_answer: string
    duration_seconds?: number
  }) => {
    const created = await createQuestion(params)
    setQuestions(prev => [created, ...prev])
    return created
  }, [])

  const editQuestion = useCallback(async (
    id: string,
    params: Partial<Pick<Question, 'content' | 'question_type' | 'options' | 'correct_answer' | 'duration_seconds' | 'subject'>>
  ) => {
    const updated = await updateQuestion(id, params)
    setQuestions(prev => prev.map(q => (q.id === id ? updated : q)))
    return updated
  }, [])

  const removeQuestion = useCallback(async (id: string) => {
    await deleteQuestion(id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }, [])

  return {
    questions,
    isLoading,
    error,
    refetch: fetchQuestions,
    addQuestion,
    editQuestion,
    removeQuestion,
  }
}
