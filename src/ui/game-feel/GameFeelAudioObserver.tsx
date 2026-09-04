import { useEffect, useRef } from 'react'
import { useSyncExternalStore } from 'react'
import { getGameFeelEvents, subscribeGameFeelEvents } from './gameFeelStore'
import { playUiSound, type UiSoundName } from './audio/uiAudioEngine'
import type { GameFeelEvent } from './gameFeelTypes'

const SOUND_BY_EVENT: Partial<Record<GameFeelEvent['type'], UiSoundName>> = { unlock: 'unlock', equip: 'equip', unequip: 'click', protect: 'success', unprotect: 'click', sell: 'confirm', destroy: 'success', 'autocast-on': 'focus', 'autocast-off': 'click', focus: 'focus', echo: 'focus', error: 'error', success: 'success' }

export const getGameFeelSound = (event: Pick<GameFeelEvent, 'type' | 'sound'>): UiSoundName | null => {
  if (event.sound === false) return null
  return event.sound ?? SOUND_BY_EVENT[event.type] ?? null
}

export function GameFeelAudioObserver() {
  const events = useSyncExternalStore(subscribeGameFeelEvents, getGameFeelEvents, getGameFeelEvents)
  const ready = useRef(false)
  const seen = useRef(new Set<string>())
  useEffect(() => {
    const currentIds = new Set(events.map((event) => event.id))
    if (!ready.current) { events.forEach((event) => seen.current.add(event.id)); ready.current = true; return }
    events.forEach((event) => { if (seen.current.has(event.id)) return; seen.current.add(event.id); const sound = getGameFeelSound(event); if (sound) playUiSound(sound) })
    seen.current.forEach((id) => { if (!currentIds.has(id)) seen.current.delete(id) })
  }, [events])
  return null
}
