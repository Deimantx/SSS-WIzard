import { BALANCE } from '../../core/balance/balance'
import { deriveActiveCombatFocusReservations, deriveActiveNonCombatFocusReservations } from './focusReservations'
import type { FocusReservation, GameState } from '../../types'
import { getCombatEntryPreset, getSpellPresetFocusProjection } from '../spells'

export interface FocusUsageEntry {
  id: string
  label: string
  sourceType: FocusReservation['sourceType']
  sourceId: string
  amount: number
  detail: string
  status?: string
}

export interface FocusUsageGroup {
  sourceType: (typeof FOCUS_USAGE_GROUPS)[number]
  entries: FocusUsageEntry[]
  amount: number
}

export interface CombatFocusUsagePresentation {
  amount: number
  status: 'ACTIVE' | 'INACTIVE'
}

export const FOCUS_USAGE_GROUPS: readonly FocusReservation['sourceType'][] = ['channeling', 'research', 'transmutation', 'combat']

const plural = (count: number, singular: string) => `${count} ${singular}${count === 1 ? '' : 's'}`

/** Returns one readable usage row per active system. */
export function getFocusUsageEntries(state: GameState): FocusUsageEntry[] {
  const reservations = deriveActiveNonCombatFocusReservations(state)
  const entries: FocusUsageEntry[] = []
  const channeling = reservations.filter((reservation) => reservation.sourceType === 'channeling')
  if (channeling.length) {
    const echoes = Math.max(0, Math.floor(state.activities.channeling.echoesAssigned))
    entries.push({ ...channeling[0], id: 'channeling-summary', sourceId: 'echoes', amount: channeling.reduce((sum, reservation) => sum + reservation.amount, 0), detail: `${plural(echoes, 'Echo')}`, status: 'ACTIVE' })
  }

  const research = reservations.filter((reservation) => reservation.sourceType === 'research')
  if (research.length) {
    const echoes = research.reduce((sum, reservation) => sum + Math.max(0, Math.floor((state.activities.research.slots[reservation.sourceId as keyof typeof state.activities.research.slots]?.echoesAssigned ?? reservation.amount / BALANCE.research.echoFocusCost))), 0)
    entries.push({ id: 'research-summary', label: 'Research Allocation', sourceType: 'research', sourceId: 'research', amount: research.reduce((sum, reservation) => sum + reservation.amount, 0), detail: `${plural(echoes, 'Echo')} Â· ${plural(research.length, 'active project')}`, status: 'ACTIVE' })
  }

  const transmutation = reservations.filter((reservation) => reservation.sourceType === 'transmutation')
  if (transmutation.length) {
    const echoes = transmutation.reduce((sum, reservation) => {
      const job = state.activities.transmutation.jobs[reservation.sourceId as keyof typeof state.activities.transmutation.jobs]
      return sum + Math.max(0, Math.floor(job?.echoesAssigned ?? reservation.amount / BALANCE.transmutation.echoFocusCost))
    }, 0)
    entries.push({ id: 'transmutation-summary', label: 'Transmutation Allocation', sourceType: 'transmutation', sourceId: 'transmutation', amount: transmutation.reduce((sum, reservation) => sum + reservation.amount, 0), detail: `${plural(echoes, 'Echo')} Â· ${plural(transmutation.length, 'active job')}`, status: 'ACTIVE' })
  }

  const combatReservations = deriveActiveCombatFocusReservations(state)
  if (combatReservations.length) entries.push({
    id: 'combat-autocast',
    label: 'Combat Auto-Cast',
    sourceType: 'combat',
    sourceId: 'combat',
    amount: combatReservations.reduce((sum, reservation) => sum + reservation.amount, 0),
    detail: `${plural(combatReservations.length, 'Auto-Cast Spell')}`,
    status: 'ACTIVE',
  })
  return entries
}

/** Returns the combat tile shown on Focus without turning a prepared loadout into an active reservation. */
export function getCombatFocusUsagePresentation(state: GameState): CombatFocusUsagePresentation {
  const activeReservations = deriveActiveCombatFocusReservations(state)
  if (activeReservations.length) return { amount: activeReservations.reduce((sum, reservation) => sum + reservation.amount, 0), status: 'ACTIVE' }
  const preset = getCombatEntryPreset(state)
  const projection = preset ? getSpellPresetFocusProjection(state, preset) : null
  return { amount: projection?.presetAutoCastFocus ?? 0, status: 'INACTIVE' }
}

/** Presentation-only entries; inactive prepared combat is intentionally excluded from active Focus totals. */
export function getFocusUsagePresentationEntries(state: GameState): FocusUsageEntry[] {
  const combat = getCombatFocusUsagePresentation(state)
  return [
    ...getFocusUsageEntries(state).filter((entry) => entry.sourceType !== 'combat'),
    { id: 'combat-autocast', label: 'Combat Auto-Cast', sourceType: 'combat', sourceId: 'combat', amount: combat.amount, detail: combat.status, status: combat.status },
  ]
}

export function getFocusUsagePresentationGroups(state: GameState): FocusUsageGroup[] {
  const entries = getFocusUsagePresentationEntries(state)
  return FOCUS_USAGE_GROUPS.map((sourceType) => {
    const groupEntries = entries.filter((entry) => entry.sourceType === sourceType)
    const activeAmount = groupEntries.filter((entry) => entry.status === 'ACTIVE').reduce((sum, entry) => sum + entry.amount, 0)
    return { sourceType, entries: groupEntries, amount: activeAmount }
  })
}

/** Groups the authoritative reservation entries for Focus Load and Active Focus Usage. */
export function getFocusUsageGroups(state: GameState): FocusUsageGroup[] {
  const entries = getFocusUsageEntries(state)
  return FOCUS_USAGE_GROUPS.map((sourceType) => {
    const groupEntries = entries.filter((entry) => entry.sourceType === sourceType)
    return { sourceType, entries: groupEntries, amount: groupEntries.reduce((sum, entry) => sum + entry.amount, 0) }
  })
}
