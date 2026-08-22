// src/services/games.ts
// Quản lý phiên game và lưu điểm RPG cho học sinh qua Local Server API
import type { GameSession, GameType } from '@/types'

/** Tạo phiên game mới */
export async function createGameSession(params: {
  class_id: string
  game_type: GameType
  template?: Record<string, any>
  room_code?: string
}): Promise<GameSession> {
  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error('Lỗi tạo phiên trò chơi')
  }

  return await res.json()
}

/** Cập nhật trạng thái game session */
export async function updateGameStatus(
  sessionId: string,
  status: 'waiting' | 'active' | 'finished'
): Promise<void> {
  await fetch('/api/games', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: sessionId, status }),
  })
}

/** Lưu điểm kết quả cho học sinh và cộng vào bảng evaluations */
export async function recordGameScore(params: {
  student_id: string
  class_id: string
  scoreDelta: number
  game_name: string
}): Promise<void> {
  try {
    // Lấy tiêu chí đầu tiên của lớp
    const critRes = await fetch(`/api/evaluations?type=criteria&classId=${encodeURIComponent(params.class_id)}`)
    const criteria = await critRes.json()
    const criteriaId = criteria?.[0]?.id

    if (criteriaId) {
      await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: params.student_id,
          criteria_id: criteriaId,
          score: params.scoreDelta,
          note: `Thắng Quiz: ${params.game_name}`,
          session_type: 'game',
        }),
      })
    }
  } catch {}
}
