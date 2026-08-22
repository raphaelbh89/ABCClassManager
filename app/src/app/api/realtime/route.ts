// src/app/api/realtime/route.ts
// Kênh Realtime In-Memory Server Broadcast giữa Display Mode & Scanner Mode
import { NextResponse } from 'next/server'

// Map lưu trữ sự kiện mới nhất theo từng roomCode
const roomEvents = new Map<string, { event: any; timestamp: number }>()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomCode = searchParams.get('roomCode')
  const since = Number(searchParams.get('since') || 0)

  if (!roomCode) return NextResponse.json({ error: 'Missing roomCode' }, { status: 400 })

  const data = roomEvents.get(roomCode.toUpperCase())
  if (data && data.timestamp > since) {
    return NextResponse.json({ hasNew: true, event: data.event, timestamp: data.timestamp })
  }

  return NextResponse.json({ hasNew: false, timestamp: since })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roomCode, event } = body
    if (!roomCode || !event) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const timestamp = Date.now()
    roomEvents.set(roomCode.toUpperCase(), { event, timestamp })

    return NextResponse.json({ success: true, timestamp })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const roomCode = searchParams.get('roomCode')
  if (roomCode) {
    roomEvents.delete(roomCode.toUpperCase())
  }
  return NextResponse.json({ success: true })
}
