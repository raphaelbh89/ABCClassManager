// src/services/evaluations.ts
// Chấm điểm RPG & Radar Stats gọi trực tiếp Local SQLite API
import type { Criterion, Evaluation, Achievement } from '@/types'

export async function getCriteriaByClass(classId: string): Promise<Criterion[]> {
  try {
    const res = await fetch(`/api/evaluations?type=criteria&classId=${encodeURIComponent(classId)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Lỗi lấy tiêu chí')
    return await res.json()
  } catch {
    return []
  }
}

export async function createEvaluation(params: {
  student_id: string
  criteria_id: string
  score: number
  note?: string
  session_type: 'quick' | 'periodic' | 'game'
}): Promise<Evaluation> {
  const res = await fetch('/api/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Lỗi chấm điểm')
  return await res.json()
}

export async function getStudentEvaluations(studentId: string): Promise<Evaluation[]> {
  try {
    const res = await fetch(`/api/evaluations?studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function getStudentAchievements(studentId: string): Promise<Achievement[]> {
  try {
    const res = await fetch(`/api/evaluations?type=achievements&studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function getStudentRadarStats(studentId: string, classId: string) {
  try {
    const res = await fetch(`/api/evaluations?type=radar&studentId=${encodeURIComponent(studentId)}&classId=${encodeURIComponent(classId)}`, { cache: 'no-store' })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}
