// src/app/api/students/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')

    let query = 'SELECT * FROM students WHERE is_active = 1'
    let params: any[] = []

    if (classId) {
      query += ' AND class_id = ?'
      params.push(classId)
    }

    query += ' ORDER BY name ASC'
    const rows = db.prepare(query).all(...params) as any[]

    const students = rows.map(r => ({
      ...r,
      avatar_config: JSON.parse(r.avatar_config || '{}'),
      is_active: Boolean(r.is_active),
    }))

    return NextResponse.json(students)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ─── Bulk import từ Excel/CSV: body.students là mảng { name, english_name } ───
    if (Array.isArray(body.students)) {
      const classId: string = body.class_id
      const items: { name: string; english_name?: string | null }[] = body.students
      if (!classId) return NextResponse.json({ error: 'Missing class_id' }, { status: 400 })
      if (items.length === 0) return NextResponse.json({ error: 'Danh sách trống' }, { status: 400 })

      const ids: string[] = []
      const insertStmt = db.prepare(`
        INSERT INTO students (id, class_id, name, english_name, avatar_config)
        VALUES (?, ?, ?, ?, ?)
      `)
      const tx = db.transaction(() => {
        for (const it of items) {
          const id = `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          insertStmt.run(
            id,
            classId,
            String(it.name).trim(),
            it.english_name ? String(it.english_name).trim() : null,
            JSON.stringify({ type: 'owl', color: '#4CAF82' }),
          )
          ids.push(id)
        }
      })
      tx()

      const created = db.prepare(`SELECT * FROM students WHERE id IN (${ids.map(() => '?').join(',')})`).all(...ids) as any[]
      return NextResponse.json(created.map(r => ({
        ...r,
        avatar_config: JSON.parse(r.avatar_config || '{}'),
        is_active: Boolean(r.is_active),
      })))
    }

    const { class_id, name, english_name, avatar_config, seat_row = null, seat_col = null } = body

    const id = `st-${Date.now()}`
    db.prepare(`
      INSERT INTO students (id, class_id, name, english_name, avatar_config, seat_row, seat_col)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, class_id, name.trim(), english_name?.trim() || null, JSON.stringify(avatar_config || { type: 'owl', color: '#4CAF82' }), seat_row, seat_col)

    const created = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any
    return NextResponse.json({
      ...created,
      avatar_config: JSON.parse(created.avatar_config || '{}'),
      is_active: Boolean(created.is_active),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { action, id, name, english_name, avatar_config, seat_row, seat_col, seatMap } = body

    // Batch update sơ đồ ghế
    if (action === 'batch_seats' && Array.isArray(seatMap)) {
      const updateStmt = db.prepare('UPDATE students SET seat_row = ?, seat_col = ? WHERE id = ?')
      const tx = db.transaction((items: any[]) => {
        for (const item of items) {
          updateStmt.run(item.seat_row, item.seat_col, item.student_id)
        }
      })
      tx(seatMap)
      return NextResponse.json({ success: true })
    }

    // Update 1 học sinh
    const current = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updatedAvatar = avatar_config ? JSON.stringify(avatar_config) : current.avatar_config
    const updatedName = name !== undefined ? name.trim() : current.name
    const updatedEnglishName = english_name !== undefined ? (english_name ? String(english_name).trim() || null : null) : (current.english_name ?? null)
    const updatedRow = seat_row !== undefined ? seat_row : current.seat_row
    const updatedCol = seat_col !== undefined ? seat_col : current.seat_col

    db.prepare(`
      UPDATE students
      SET name = ?, english_name = ?, avatar_config = ?, seat_row = ?, seat_col = ?
      WHERE id = ?
    `).run(updatedName, updatedEnglishName, updatedAvatar, updatedRow, updatedCol, id)

    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id) as any
    return NextResponse.json({
      ...updated,
      avatar_config: JSON.parse(updated.avatar_config || '{}'),
      is_active: Boolean(updated.is_active),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    db.prepare('UPDATE students SET is_active = 0 WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
