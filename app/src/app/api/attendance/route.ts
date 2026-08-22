// src/app/api/attendance/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    if (!classId) return NextResponse.json({ error: 'Missing classId' }, { status: 400 })

    if (date) {
      const session = db.prepare('SELECT * FROM attendance_sessions WHERE class_id = ? AND date = ?').get(classId, date) as any
      if (!session) return NextResponse.json(null)

      const records = db.prepare('SELECT * FROM attendance_records WHERE session_id = ?').all(session.id)
      return NextResponse.json({ ...session, records })
    }

    const sessions = db.prepare('SELECT * FROM attendance_sessions WHERE class_id = ? ORDER BY date DESC LIMIT 30').all(classId) as any[]
    const sessionIds = sessions.map(s => s.id)

    const allRecords = sessionIds.length > 0
      ? (db.prepare(`SELECT * FROM attendance_records WHERE session_id IN (${sessionIds.map(() => '?').join(',')})`).all(...sessionIds) as any[])
      : []

    const result = sessions.map(s => ({
      ...s,
      records: allRecords.filter(r => r.session_id === s.id),
    }))

    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { class_id, date, records } = body

    let session = db.prepare('SELECT * FROM attendance_sessions WHERE class_id = ? AND date = ?').get(class_id, date) as any
    const sessionId = session ? session.id : `att-${Date.now()}`

    if (!session) {
      db.prepare(`
        INSERT INTO attendance_sessions (id, class_id, date, confirmed_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(sessionId, class_id, date)
    } else {
      db.prepare(`
        UPDATE attendance_sessions SET confirmed_at = datetime('now') WHERE id = ?
      `).run(sessionId)
    }

    // Xoá records cũ và lưu mới
    db.prepare('DELETE FROM attendance_records WHERE session_id = ?').run(sessionId)

    const insertRecord = db.prepare(`
      INSERT INTO attendance_records (id, session_id, student_id, status, note)
      VALUES (?, ?, ?, ?, ?)
    `)

    const tx = db.transaction((recs: any[]) => {
      for (const r of recs) {
        insertRecord.run(`rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, sessionId, r.student_id, r.status, r.note || null)
      }
    })
    tx(records)

    const updatedSession = db.prepare('SELECT * FROM attendance_sessions WHERE id = ?').get(sessionId) as any
    const updatedRecords = db.prepare('SELECT * FROM attendance_records WHERE session_id = ?').all(sessionId)

    return NextResponse.json({ ...updatedSession, records: updatedRecords })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
