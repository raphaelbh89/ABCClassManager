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
    const { class_id, name, avatar_config, seat_row = null, seat_col = null } = body

    const id = `st-${Date.now()}`
    db.prepare(`
      INSERT INTO students (id, class_id, name, avatar_config, seat_row, seat_col)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, class_id, name.trim(), JSON.stringify(avatar_config || { type: 'owl', color: '#4CAF82' }), seat_row, seat_col)

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
    const { action, id, name, avatar_config, seat_row, seat_col, seatMap } = body

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
    const updatedRow = seat_row !== undefined ? seat_row : current.seat_row
    const updatedCol = seat_col !== undefined ? seat_col : current.seat_col

    db.prepare(`
      UPDATE students
      SET name = ?, avatar_config = ?, seat_row = ?, seat_col = ?
      WHERE id = ?
    `).run(updatedName, updatedAvatar, updatedRow, updatedCol, id)

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
