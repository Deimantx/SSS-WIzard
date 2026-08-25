import { advanceGameState } from '../simulation/advanceGameState'
import { pushNotification } from '../../engine'
import type { GameState } from '../../types'
import { formatOfflineBank } from '../../utils'

export interface OfflineBankResult {
  ok: boolean
  error?: string
}

type StateSetter = (recipe: (state: GameState) => void) => void
type SilentSave = () => void

let active = false
export const isOfflineBankSimulationActive = () => active

const isMajorNotification = (text: string) => /Arcane Discovery|reached Level|unlocked|defeated|Defeated|FIRST CHAPTER|Guild unlocked|mastered|ready/i.test(text)

const yieldToBrowser = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0))

export const advanceWithOfflineBank = async (
  durationMs: number,
  getState: () => GameState,
  setState: StateSetter,
  silentSave: SilentSave,
): Promise<OfflineBankResult> => {
  const duration = Math.floor(durationMs)
  if (active) return { ok: false, error: 'Offline Bank is already advancing.' }
  if (!Number.isFinite(duration) || duration <= 0) return { ok: false, error: 'Choose a positive duration.' }
  if (duration > 3_600_000) return { ok: false, error: 'Offline Bank advances are limited to one hour.' }
  const available = Math.max(0, getState().offlineBankMs)
  if (duration > available) return { ok: false, error: 'Not enough time in the Offline Bank.' }

  active = true
  const previousNotifications = getState().notifications
  const previousIds = new Set(previousNotifications.map((note) => note.id))
  try {
    const steps = Math.ceil(duration / 1000)
    let remaining = duration
    for (let index = 0; index < steps; index += 1) {
      const step = Math.min(1000, remaining)
      remaining -= step
      setState((state) => {
        state.offlineBankMs = Math.max(0, state.offlineBankMs - step)
        advanceGameState(state, step, { mode: 'banked', suppressRoutineNotifications: true })
      })
      if (index > 0 && index % 50 === 0) await yieldToBrowser()
    }

    setState((state) => {
      const majorEvents = state.notifications.filter((note) => !previousIds.has(note.id) && isMajorNotification(note.text))
      state.notifications = [...previousNotifications, ...majorEvents].slice(-5)
      pushNotification(state, `Advanced ${formatOfflineBank(duration)} using Offline Bank.`, 'info')
    })
    silentSave()
    return { ok: true }
  } finally {
    active = false
  }
}

