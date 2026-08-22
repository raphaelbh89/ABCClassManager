// src/app/api/classes/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { generateRoomCode } from '@/utils/roomCode'

export async function GET() {
  try {
    const classes = db.prepare('SELECT * FROM classes WHERE is_active = 1 ORDER BY created_at DESC').all()
    return NextResponse.json(classes)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, school_year, grade_level, teacher_id = 'teacher-1' } = body

    const id = `class-${Date.now()}`
    const room_code = generateRoomCode(6)

    db.prepare(`
      INSERT INTO classes (id, teacher_id, name, school_year, grade_level, room_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, teacher_id, name.trim(), school_year, grade_level, room_code)

    // Tạo 5 tiêu chí mặc định
    const defaultCriteria = [
      { id: `crit-${Date.now()}-1`, name: 'Học tập', icon: '📚', order: 0 },
      { id: `crit-${Date.now()}-2`, name: 'Kỷ luật', icon: '⚡', order: 1 },
      { id: `crit-${Date.now()}-3`, name: 'Hợp tác nhóm', icon: '🤝', order: 2 },
      { id: `crit-${Date.now()}-4`, name: 'Sáng tạo', icon: '💡', order: 3 },
      { id: `crit-${Date.now()}-5`, name: 'Chuyên cần', icon: '🌟', order: 4 },
    ]
    for (const c of defaultCriteria) {
      db.prepare(`
        INSERT INTO criteria (id, class_id, name, icon, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `).run(c.id, id, c.name, c.icon, c.order)
    }

    const created = db.prepare('SELECT * FROM classes WHERE id = ?').get(id)
    return NextResponse.json(created)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, name, school_year, grade_level, is_active = 1 } = body

    db.prepare(`
      UPDATE classes
      SET name = ?, school_year = ?, grade_level = ?, is_active = ?
      WHERE id = ?
    `).run(name, school_year, grade_level, is_active ? 1 : 0, id)

    const updated = db.prepare('SELECT * FROM classes WHERE id = ?').get(id)
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    db.prepare('DELETE FROM classes WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
