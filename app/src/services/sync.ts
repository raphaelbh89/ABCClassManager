// src/services/sync.ts
// Quản lý kênh Realtime đồng bộ giữa Display Mode và Scanner qua Local Server API

export interface DuelPlayerState {
  id: string
  name: string
  avatar?: string
  hp: number // 0 - 100
  choice?: string
  isCorrect?: boolean
}

export interface TeamGroupState {
  id: string
  name: string
  color: string
  hp: number // 0 - 100
  score: number
  correctCount: number
  totalCount: number
}

export interface BossFightState {
  name: string
  avatar: string
  hp: number // 0 - 100
  maxHp: number
  isDefeated: boolean
  lastDamage: number
  overallAccuracy: number // % đúng cả lớp từ đầu đến giờ
  status: 'idle' | 'hit' | 'attack' | 'defeated'
}

export type RealtimeEvent =
  | { type: 'DISPLAY_READY'; roomCode: string }
  | {
      type: 'SHOW_QUESTION'
      question: any
      index: number
      total: number
      seconds?: number
      game_type?: 'classic' | 'arena' | 'team' | 'boss'
      duel_state?: { p1: DuelPlayerState; p2: DuelPlayerState }
      team_state?: TeamGroupState[]
      boss_state?: BossFightState
    }
  | { type: 'START_TIMER'; seconds: number }
  | { type: 'STOP_TIMER' }
  | { type: 'SCAN_PREVIEW'; counts: { red: number; green: number; yellow: number; blue: number } }
  | {
      type: 'REVEAL_ANSWER'
      correctAnswer: string
      isCorrectColor: string
      duel_state?: { p1: DuelPlayerState; p2: DuelPlayerState }
      team_state?: TeamGroupState[]
      boss_state?: BossFightState
      leaderboard?: { id: string; name: string; score: number; avatar?: any }[]
    }
  | {
      type: 'UPDATE_GAME_STATE'
      game_type: 'classic' | 'arena' | 'team' | 'boss'
      duel_state?: { p1: DuelPlayerState; p2: DuelPlayerState }
      team_state?: TeamGroupState[]
      boss_state?: BossFightState
      leaderboard?: { id: string; name: string; score: number; avatar?: any }[]
    }
  | { type: 'UPDATE_LEADERBOARD'; leaderboard: { id: string; name: string; score: number; avatar?: any }[] }
  | { type: 'TRIGGER_CONFETTI' }
  | { type: 'RESET_VIEW' }

export function subscribeToRoom(
  roomCode: string,
  onMessage: (event: RealtimeEvent) => void
) {
  let isSubscribed = true
  let lastTimestamp = 0

  const interval = setInterval(async () => {
    if (!isSubscribed) return
    try {
      const res = await fetch(`/api/realtime?roomCode=${encodeURIComponent(roomCode)}&since=${lastTimestamp}`)
      if (res.ok) {
        const data = await res.json()
        if (data.hasNew && data.event) {
          lastTimestamp = data.timestamp
          onMessage(data.event)
        }
      }
    } catch {}
  }, 200)

  return {
    unsubscribe: () => {
      isSubscribed = false
      clearInterval(interval)
    },
  }
}

export async function sendSyncEvent(
  _channel: any,
  event: RealtimeEvent,
  roomCode?: string
): Promise<void> {
  if (!roomCode) return
  try {
    await fetch('/api/realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, event }),
    })
  } catch {}
}
