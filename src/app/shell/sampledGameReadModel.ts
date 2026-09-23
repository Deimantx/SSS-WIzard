import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

/** Presentation-only sampling; gameplay state remains exact in GameStore. */
export function useSampledGameReadModel<T>(selector: (state: GameState) => T, intervalMs = 250): T {
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const [value, setValue] = useState(() => selector(useGameStore.getState()))

  useEffect(() => {
    let active = true
    const refresh = () => {
      if (active) setValue(selectorRef.current(useGameStore.getState()))
    }
    refresh()
    const interval = window.setInterval(refresh, intervalMs)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [intervalMs])

  return value
}
