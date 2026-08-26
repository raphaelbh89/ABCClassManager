// src/app/api/subjects/route.ts
// Subject Configuration Module: CRUD môn học + lựa chọn môn giảng dạy của giáo viên
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    const rows = db.prepare(`
      SELECT s.id, s.name, s.icon, s.sort_order, s.is_active,
        (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id AND q.is_active = 1) AS question_count,
        EXISTS(SELECT 1 FROM teacher_subjects ts WHERE ts.subject_id = s.id AND ts.teacher_id = 'teacher-1') AS is_teaching
      FROM subjects s
      WHERE s.is_active = 1
      ORDER BY s.sort_order ASC, s.created_at ASC
    `).all() as any[]

    return NextResponse.json(rows.map(r => ({
      ...r,
      is_active: Boolean(r.is_active),
      is_teaching: Boolean(r.is_teaching),
    })))
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ─── Lưu lựa chọn môn giảng dạy của giáo viên ───
    if (body.action === 'set_teaching') {
      const ids: string[] = Array.isArray(body.subjectIds) ? body.subjectIds : []
      if (!Array.isArray(ids)) return NextResponse.json({ error: 'subjectIds phải là mảng' }, { status: 400 })

      const validIds = ids.filter((id: string) =>
        db.prepare('SELECT id FROM subjects WHERE id = ? AND is_active = 1').get(id)
      )

      const tx = db.transaction(() => {
        db.prepare("DELETE FROM teacher_subjects WHERE teacher_id = 'teacher-1'").run()
        const ins = db.prepare('INSERT OR IGNORE INTO teacher_subjects (id, teacher_id, subject_id) VALUES (?, ?, ?)')
        for (const sid of validIds) ins.run(`ts-${sid}`, 'teacher-1', sid)
      })
      tx()

      return NextResponse.json({ success: true, count: validIds.length })
    }

    // ─── Tạo môn học mới ───
    const name = String(body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Tên môn học không được để trống' }, { status: 400 })

    const dup = db.prepare('SELECT id FROM subjects WHERE LOWER(name) = LOWER(?) AND is_active = 1').get(name)
    if (dup) return NextResponse.json({ error: `Môn học "${name}" đã tồn tại` }, { status: 409 })

    const icon = String(body.icon || '📘').trim().slice(0, 4) || '📘'
    const maxOrder = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS m FROM subjects').get() as any).m
    const id = `subj-${Date.now()}`
    db.prepare('INSERT INTO subjects (id, name, icon, sort_order) VALUES (?, ?, ?, ?)').run(id, name, icon, maxOrder + 1)

    return NextResponse.json({ id, name, icon, sort_order: maxOrder + 1, is_teaching: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, icon } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const current = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id) as any
    if (!current) return NextResponse.json({ error: 'Không tìm thấy môn học' }, { status: 404 })

    const newName = name !== undefined ? String(name).trim() : current.name
    if (!newName) return NextResponse.json({ error: 'Tên môn học không được để trống' }, { status: 400 })
    const newIcon = icon !== undefined ? String(icon).trim().slice(0, 4) || current.icon : current.icon

    db.prepare('UPDATE subjects SET name = ?, icon = ? WHERE id = ?').run(newName, newIcon, id)

    // Đồng bộ tên môn trong ngân hàng câu hỏi đang dùng môn này
    db.prepare('UPDATE questions SET subject = ? WHERE subject_id = ? AND subject = ?').run(newName, id, current.name)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const inUse = (db.prepare('SELECT COUNT(*) AS n FROM questions WHERE subject_id = ? AND is_active = 1').get(id) as any).n
    if (inUse > 0) {
      return NextResponse.json(
        { error: `Môn học này đang có ${inUse} câu hỏi — không thể xoá. Hãy chuyển các câu hỏi sang môn khác trước.` },
        { status: 409 }
      )
    }

    db.prepare('DELETE FROM subjects WHERE id = ?').run(id) // CASCADE xoá cả teacher_subjects
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
