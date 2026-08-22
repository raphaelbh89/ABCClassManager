// src/app/api/games/route.ts
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { generateRoomCode } from '@/utils/roomCode'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const roomCode = searchParams.get('roomCode') || searchParams.get('room_code')

    // Nếu tìm theo roomCode cụ thể
    if (roomCode) {
      const row = db.prepare('SELECT * FROM game_sessions WHERE room_code = ? ORDER BY created_at DESC LIMIT 1').get(roomCode.toUpperCase()) as any
      if (row) {
        return NextResponse.json({
          ...row,
          template: JSON.parse(row.template || '{}'),
        })
      }
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    let query = 'SELECT * FROM game_sessions'
    let params: any[] = []

    if (classId) {
      query += ' WHERE class_id = ?'
      params.push(classId)
    }

    query += ' ORDER BY created_at DESC LIMIT 20'
    const rows = db.prepare(query).all(...params) as any[]

    const games = rows.map(r => ({
      ...r,
      template: JSON.parse(r.template || '{}'),
    }))

    return NextResponse.json(games)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { class_id, game_type, template, room_code } = body

    const id = `game-${Date.now()}`
    const finalRoomCode = room_code || generateRoomCode(6)

    db.prepare(`
      INSERT INTO game_sessions (id, class_id, game_type, template, status, room_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, class_id, game_type, JSON.stringify(template || {}), 'waiting', finalRoomCode)

    const created = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(id) as any
    return NextResponse.json({
      ...created,
      template: JSON.parse(created.template || '{}'),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, status } = body

    const updates: string[] = ['status = ?']
    const params: any[] = [status]

    if (status === 'active') {
      updates.push("started_at = datetime('now')")
    } else if (status === 'finished') {
      updates.push("finished_at = datetime('now')")
    }

    params.push(id)

    db.prepare(`
      UPDATE game_sessions
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params)

    const updated = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(id) as any
    return NextResponse.json({
      ...updated,
      template: JSON.parse(updated.template || '{}'),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
