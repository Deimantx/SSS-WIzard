import { useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore'
import { emitGameFeelEvent } from './gameFeelStore'

const equipmentKey = (equipment: Record<string, string | null>) => Object.entries(equipment).sort(([a], [b]) => a.localeCompare(b)).map(([position, itemId]) => `${position}:${itemId ?? ''}`).join('|')

export function EquipmentFeelObserver() {
  const equipment = useGameStore((state) => state.equipment)
  const previous = useRef<string | null>(null)
  useEffect(() => {
    const next = equipmentKey(equipment)
    if (previous.current === null) { previous.current = next; return }
    if (previous.current === next) return
    previous.current = next
    const anchor = document.querySelector<HTMLElement>('.equipment-inspector-actions, .equipment-armory-card.equipped, .equipment-slot-card.selected')
    const rect = anchor?.getBoundingClientRect()
    emitGameFeelEvent({ type: 'equip', x: rect && rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth * 0.62, y: rect && rect.height > 0 ? rect.top + rect.height / 2 : 128, color: 'var(--ui-accent)', intensity: 1 })
  }, [equipment])
  return null
}
