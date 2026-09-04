import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { ITEMS } from '../../game/content/items/items'
import { emitGameFeelEvent } from './gameFeelStore'

export function AcquisitionFeelObserver() {
  const acquisitions = useGameStore((state) => state.recentAcquisitions)
  const ready = useRef(false)
  const newest = useRef<string | null>(null)
  useEffect(() => {
    const latest = acquisitions[0]
    const latestKey = latest ? `${latest.itemId}:${latest.timestamp}:${latest.amount}` : null
    if (!ready.current) { newest.current = latestKey; ready.current = true; return }
    if (!latest || latestKey === newest.current) return
    newest.current = latestKey
    const tile = document.querySelector<HTMLElement>(`[data-item-id="${latest.itemId}"]`)
    const rect = tile?.getBoundingClientRect()
    const point = rect && rect.width > 0 && rect.height > 0 ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: window.innerWidth * 0.55, y: 104 }
    emitGameFeelEvent({ type: 'item-gain', ...point, color: ITEMS[latest.itemId]?.color, intensity: latest.amount > 1 ? 1.05 : 0.86 })
  }, [acquisitions])
  return null
}
