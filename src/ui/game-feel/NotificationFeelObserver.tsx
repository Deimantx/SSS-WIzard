import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { emitGameFeelEvent } from './gameFeelStore'

export function NotificationFeelObserver() {
  const notifications = useGameStore((state) => state.notifications)
  const ready = useRef(false)
  const seen = useRef(new Set<string>())
  useEffect(() => {
    if (!ready.current) { notifications.forEach((note) => seen.current.add(note.id)); ready.current = true; return }
    notifications.forEach((note) => {
      if (seen.current.has(note.id)) return
      seen.current.add(note.id)
      if (note.key?.startsWith('action-') || note.text.includes('Auto-Cast enabled') || note.text.includes('Cannot enable Auto-Cast')) return
      if (note.tone === 'warning') emitGameFeelEvent({ type: 'error', x: window.innerWidth - 170, y: 58, color: 'var(--ui-warning)', intensity: 0.8 })
      if (note.tone === 'success') emitGameFeelEvent({ type: 'success', x: window.innerWidth - 170, y: 58, color: 'var(--ui-success)', intensity: 0.9 })
    })
    const ids = new Set(notifications.map((note) => note.id))
    seen.current.forEach((id) => { if (!ids.has(id)) seen.current.delete(id) })
  }, [notifications])
  return null
}
