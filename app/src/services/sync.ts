// src/services/sync.ts
// Quản lý kênh Realtime đồng bộ giữa Display Mode và Scanner qua Local Server API

export type RealtimeEvent =
  | { type: 'DISPLAY_READY'; roomCode: string }
  | { type: 'SHOW_QUESTION'; question: any; index: number; total: number }
  | { type: 'START_TIMER'; seconds: number }
  | { type: 'STOP_TIMER' }
  | { type: 'SCAN_PREVIEW'; counts: { red: number; green: number; yellow: number; blue: number } }
  | { type: 'REVEAL_ANSWER'; correctAnswer: string; isCorrectColor: string }
  | { type: 'UPDATE_LEADERBOARD'; leaderboard: { id: string; name: string; score: number; avatar?: any }[] }
  | { type: 'TRIGGER_CONFETTI' }
  | { type: 'RESET_VIEW' }

export function subscribeToRoom(
  roomCode: string,
  onMessage: (event: RealtimeEvent) => void
) {
  let isSubscribed = true
  let lastTimestamp = Date.now()

  // Polling chu kỳ 200ms siêu nhẹ với Local Server API (< 2ms response time)
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
