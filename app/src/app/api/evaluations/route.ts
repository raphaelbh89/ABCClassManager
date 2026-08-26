// src/app/api/evaluations/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const studentId = searchParams.get('studentId')
    const type = searchParams.get('type') // 'criteria' | 'radar' | 'achievements' | 'evaluations'

    if (type === 'criteria' && classId) {
      const criteria = db.prepare('SELECT * FROM criteria WHERE class_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(classId)
      return NextResponse.json(criteria)
    }

    // Tổng điểm + số huy hiệu của TẤT CẢ học sinh trong lớp (cho card danh sách)
    if (type === 'summary' && classId) {
      const rows = db.prepare(`
        SELECT s.id AS student_id,
          COALESCE((SELECT SUM(e.score) FROM evaluations e WHERE e.student_id = s.id), 0) AS total_score,
          (SELECT COUNT(*) FROM achievements a WHERE a.student_id = s.id) AS badge_count
        FROM students s
        WHERE s.class_id = ? AND s.is_active = 1
      `).all(classId)
      return NextResponse.json(rows)
    }

    if (type === 'radar' && studentId && classId) {
      const criteria = db.prepare('SELECT * FROM criteria WHERE class_id = ? AND is_active = 1 ORDER BY sort_order ASC').all(classId) as any[]
      const evals = db.prepare('SELECT criteria_id, score FROM evaluations WHERE student_id = ?').all(studentId) as any[]

      const scoreMap = new Map<string, number>()
      for (const ev of evals) {
        scoreMap.set(ev.criteria_id, (scoreMap.get(ev.criteria_id) || 0) + ev.score)
      }

      const radarStats = criteria.map(c => ({
        name: c.name,
        icon: c.icon,
        score: scoreMap.get(c.id) || 0,
        maxScore: c.max_score,
      }))
      return NextResponse.json(radarStats)
    }

    if (type === 'achievements' && studentId) {
      const achs = db.prepare('SELECT * FROM achievements WHERE student_id = ? ORDER BY earned_at DESC').all(studentId)
      return NextResponse.json(achs)
    }

    if (studentId) {
      const evals = db.prepare('SELECT * FROM evaluations WHERE student_id = ? ORDER BY evaluated_at DESC').all(studentId)
      return NextResponse.json(evals)
    }

    return NextResponse.json([])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ─── Cộng điểm hàng loạt: body.awards = [{ student_id, score, note }] ───
    // Dùng cho điểm tham gia trò chơi (cả lớp / nhiều tay đua cùng lúc)
    if (Array.isArray(body.awards)) {
      const awards: { student_id: string; criteria_id?: string; score: number; note?: string }[] = body.awards
      if (awards.length === 0) return NextResponse.json({ error: 'Danh sách trống' }, { status: 400 })

      // Nếu caller không truyền criteria_id thì dùng tiêu chí đầu tiên của lớp học sinh đó
      const defaultCritByClass = new Map<string, string>()
      const critForStudent = db.prepare('SELECT class_id FROM students WHERE id = ?')
      const firstCriteria = db.prepare('SELECT id FROM criteria WHERE class_id = ? AND is_active = 1 ORDER BY sort_order ASC LIMIT 1')

      const insertStmt = db.prepare(`
        INSERT INTO evaluations (id, student_id, criteria_id, score, note, session_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      const studentExists = db.prepare('SELECT id FROM students WHERE id = ? AND is_active = 1')

      let inserted = 0
      let skipped = 0
      const touchedStudents = new Set<string>()

      const tx = db.transaction(() => {
        for (const a of awards) {
          if (!studentExists.get(a.student_id)) { skipped++; continue }
          let critId = a.criteria_id
          if (!critId) {
            const clsId = (critForStudent.get(a.student_id) as any)?.class_id
            if (!clsId) { skipped++; continue }
            if (!defaultCritByClass.has(clsId)) {
              const c = firstCriteria.get(clsId) as any
              defaultCritByClass.set(clsId, c?.id || '')
            }
            critId = defaultCritByClass.get(clsId)!
            if (!critId) { skipped++; continue }
          }
          insertStmt.run(
            `eval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            a.student_id,
            critId,
            a.score,
            a.note || null,
            body.session_type || 'game',
          )
          inserted++
          touchedStudents.add(a.student_id)
        }
      })
      tx()

      // Kiểm tra huy hiệu cho các học sinh vừa được cộng
      for (const sid of touchedStudents) {
        const totalScore = (db.prepare('SELECT SUM(score) as total FROM evaluations WHERE student_id = ?').get(sid) as any)?.total || 0
        const count = (db.prepare('SELECT count(*) as count FROM evaluations WHERE student_id = ?').get(sid) as any)?.count || 0
        if (count >= 1) awardBadge(sid, 'first_step', 'Nhận đánh giá đầu tiên')
        if (totalScore >= 100) awardBadge(sid, 'score_100', 'Đạt mốc 100 điểm tổng')
        if (totalScore >= 300) awardBadge(sid, 'score_300', 'Đạt mốc 300 điểm - Xuất Sắc')
      }

      return NextResponse.json({ inserted, skipped })
    }

    const { student_id, criteria_id, score, note, session_type = 'quick' } = body

    const id = `eval-${Date.now()}`
    db.prepare(`
      INSERT INTO evaluations (id, student_id, criteria_id, score, note, session_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, student_id, criteria_id, score, note || null, session_type)

    // Tự động kiểm tra trao huy hiệu
    const totalScore = (db.prepare('SELECT SUM(score) as total FROM evaluations WHERE student_id = ?').get(student_id) as any)?.total || 0
    const count = (db.prepare('SELECT count(*) as count FROM evaluations WHERE student_id = ?').get(student_id) as any)?.count || 0

    if (count >= 1) awardBadge(student_id, 'first_step', 'Nhận đánh giá đầu tiên')
    if (totalScore >= 100) awardBadge(student_id, 'score_100', 'Đạt mốc 100 điểm tổng')
    if (totalScore >= 300) awardBadge(student_id, 'score_300', 'Đạt mốc 300 điểm - Xuất Sắc')

    const created = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id)
    return NextResponse.json(created)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function awardBadge(studentId: string, badgeType: string, desc: string) {
  const existing = db.prepare('SELECT id FROM achievements WHERE student_id = ? AND badge_type = ?').get(studentId, badgeType)
  if (!existing) {
    db.prepare(`
      INSERT INTO achievements (id, student_id, badge_type, trigger_description)
      VALUES (?, ?, ?, ?)
    `).run(`ach-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, studentId, badgeType, desc)
  }
}
