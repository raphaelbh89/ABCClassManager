'use client'
// src/hooks/useEvaluations.ts
import { useState, useCallback, useEffect } from 'react'
import {
  getCriteriaByClass,
  createEvaluation,
  getStudentEvaluations,
  getStudentAchievements,
  getStudentRadarStats
} from '@/services/evaluations'
import type { Criterion, Evaluation, Achievement } from '@/types'

export function useEvaluations(classId?: string | null, studentId?: string | null) {
  const [criteria, setCriteria] = useState<Criterion[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [radarStats, setRadarStats] = useState<{ name: string; icon: string; score: number; maxScore: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCriteria = useCallback(async () => {
    if (!classId) return
    try {
      const data = await getCriteriaByClass(classId)
      setCriteria(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lấy tiêu chí')
    }
  }, [classId])

  const fetchStudentData = useCallback(async () => {
    if (!studentId || !classId) return
    setIsLoading(true)
    setError(null)
    try {
      const [evals, achs, stats] = await Promise.all([
        getStudentEvaluations(studentId),
        getStudentAchievements(studentId),
        getStudentRadarStats(studentId, classId),
      ])
      setEvaluations(evals)
      setAchievements(achs)
      setRadarStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu học sinh')
    } finally {
      setIsLoading(false)
    }
  }, [studentId, classId])

  useEffect(() => {
    if (classId) fetchCriteria()
  }, [classId, fetchCriteria])

  useEffect(() => {
    if (studentId && classId) fetchStudentData()
  }, [studentId, classId, fetchStudentData])

  const giveScore = useCallback(async (params: {
    studentId: string
    criteriaId: string
    score: number
    note?: string
    sessionType?: 'quick' | 'periodic' | 'game'
  }) => {
    const newEval = await createEvaluation({
      student_id: params.studentId,
      criteria_id: params.criteriaId,
      score: params.score,
      note: params.note,
      session_type: params.sessionType || 'quick',
    })
    
    // Cập nhật state nếu đang xem học sinh này
    if (studentId === params.studentId) {
      setEvaluations(prev => [newEval, ...prev])
      if (classId) {
        getStudentRadarStats(studentId, classId).then(setRadarStats)
        getStudentAchievements(studentId).then(setAchievements)
      }
    }
    return newEval
  }, [studentId, classId])

  return {
    criteria,
    evaluations,
    achievements,
    radarStats,
    isLoading,
    error,
    fetchStudentData,
    giveScore,
  }
}
