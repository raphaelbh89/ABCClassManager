// src/services/questions.ts
// Ngân hàng câu hỏi gọi trực tiếp Local SQLite API
import type { Question, QuestionType } from '@/types'

export async function getQuestions(subject?: string): Promise<Question[]> {
  try {
    const url = subject && subject !== 'all' ? `/api/questions?subject=${encodeURIComponent(subject)}` : '/api/questions'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error('Lỗi lấy câu hỏi')
    return await res.json()
  } catch {
    return []
  }
}

export async function createQuestion(params: {
  subject?: string
  content: string
  question_type: QuestionType
  options: { label: string; text: string }[]
  correct_answer: string
  duration_seconds?: number
}): Promise<Question> {
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Không thể thêm câu hỏi')
  return await res.json()
}

export async function updateQuestion(
  id: string,
  params: Partial<Pick<Question, 'content' | 'question_type' | 'options' | 'correct_answer' | 'duration_seconds' | 'subject'>>
): Promise<Question> {
  const res = await fetch('/api/questions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...params }),
  })
  if (!res.ok) throw new Error('Không thể cập nhật câu hỏi')
  return await res.json()
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`/api/questions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Không thể xoá câu hỏi')
}

export async function seedSampleQuestions(): Promise<Question[]> {
  return await getQuestions()
}
