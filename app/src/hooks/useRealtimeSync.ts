'use client'
// src/hooks/useRealtimeSync.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { subscribeToRoom, sendSyncEvent, type RealtimeEvent } from '@/services/sync'

export function useRealtimeSync(roomCode?: string | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)
  const subRef = useRef<{ unsubscribe: () => void } | null>(null)

  useEffect(() => {
    if (!roomCode) return

    const sub = subscribeToRoom(roomCode, (event: RealtimeEvent) => {
      setLastEvent(event)
    })
    subRef.current = sub
    setIsConnected(true)

    return () => {
      sub.unsubscribe()
      subRef.current = null
      setIsConnected(false)
    }
  }, [roomCode])

  const broadcast = useCallback(async (event: RealtimeEvent) => {
    if (!roomCode) return
    await sendSyncEvent(null, event, roomCode)
  }, [roomCode])

  return {
    isConnected,
    lastEvent,
    broadcast,
  }
}
