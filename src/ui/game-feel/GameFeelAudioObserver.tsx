import { useEffect, useRef } from 'react'
import { useSyncExternalStore } from 'react'
import { getGameFeelEvents, subscribeGameFeelEvents } from './gameFeelStore'
import { playUiSound, type UiSoundName } from './audio/uiAudioEngine'
import type { GameFeelEvent } from './gameFeelTypes'

const SOUND_BY_EVENT: Partial<Record<GameFeelEvent['type'], UiSoundName>> = { 'craft-complete': 'craft', unlock: 'unlock', 'item-gain': 'item-gain', equip: 'equip', focus: 'focus', error: 'error', success: 'success' }

export function GameFeelAudioObserver() {
  const events = useSyncExternalStore(subscribeGameFeelEvents, getGameFeelEvents, getGameFeelEvents)
  const ready = useRef(false)
  const seen = useRef(new Set<string>())
  useEffect(() => {
    const currentIds = new Set(events.map((event) => event.id))
    if (!ready.current) { events.forEach((event) => seen.current.add(event.id)); ready.current = true; return }
    events.forEach((event) => { if (seen.current.has(event.id)) return; seen.current.add(event.id); const sound = SOUND_BY_EVENT[event.type]; if (sound) playUiSound(sound) })
    seen.current.forEach((id) => { if (!currentIds.has(id)) seen.current.delete(id) })
  }, [events])
  return null
}
