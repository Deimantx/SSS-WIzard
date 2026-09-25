import { BALANCE } from '../../core/balance/balance'
import { deriveActiveCombatFocusReservations, deriveActiveNonCombatFocusReservations } from './focusReservations'
import { TRANSMUTATION_RECIPES as RECIPES } from '../../content/recipes/recipes'
import { getRecipeStatus } from '../transmutation/transmutationSelectors'
import type { FocusReservation, GameState, ResearchJobStatus } from '../../types'

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

export const FOCUS_USAGE_GROUPS: readonly FocusReservation['sourceType'][] = ['channeling', 'research', 'transmutation', 'combat']

const plural = (count: number, singular: string) => `${count} ${singular}${count === 1 ? '' : 's'}`
const researchStatusLabel = (status: ResearchJobStatus | undefined) => status ? status.replace('-', ' ').toUpperCase() : 'RUNNING'

/** Returns active usage rows. Combat Auto-Cast is intentionally one aggregate row. */
export function getFocusUsageEntries(state: GameState): FocusUsageEntry[] {
  const entries = deriveActiveNonCombatFocusReservations(state).map((reservation) => {
    if (reservation.sourceType === 'channeling') {
      const echoes = Math.max(0, Math.floor(state.activities.channeling.echoesAssigned))
      return { ...reservation, detail: `${plural(echoes, 'Echo')} x ${BALANCE.channeling.echoFocusCost} Focus`, status: 'ACTIVE' }
    }
    if (reservation.sourceType === 'research') {
      const job = state.activities.research.slots[reservation.sourceId as keyof typeof state.activities.research.slots]
      const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? reservation.amount / BALANCE.research.echoFocusCost))
      return { ...reservation, detail: `${plural(echoes, 'Echo')} x ${BALANCE.research.echoFocusCost} Focus`, status: researchStatusLabel(job?.status) }
    }
    const job = state.activities.transmutation.jobs[reservation.sourceId.replace('transmutation-', '') as keyof typeof state.activities.transmutation.jobs]
    const recipe = RECIPES[reservation.sourceId.replace('transmutation-', '') as keyof typeof RECIPES]
    const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? reservation.amount / BALANCE.transmutation.echoFocusCost))
    const status = recipe ? getRecipeStatus(state, recipe).replace('-', ' ').toUpperCase() : 'ACTIVE'
    return { ...reservation, detail: `${plural(echoes, 'Echo')} x ${BALANCE.transmutation.echoFocusCost} Focus`, status }
  })
  const combatReservations = deriveActiveCombatFocusReservations(state)
  if (combatReservations.length) entries.push({
    id: 'combat-autocast',
    label: 'Combat Auto-Cast',
    sourceType: 'combat',
    sourceId: 'combat',
    amount: combatReservations.reduce((sum, reservation) => sum + reservation.amount, 0),
    detail: `${combatReservations.length} Auto-Cast Spell${combatReservations.length === 1 ? '' : 's'} x ${combatReservations.map((entry) => entry.label.replace(/ Auto-Cast$/, '')).join(' x ')}`,
    status: 'ACTIVE',
  })
  return entries
}

/** Groups the authoritative reservation entries for Focus Load and Active Focus Usage. */
export function getFocusUsageGroups(state: GameState): FocusUsageGroup[] {
  const entries = getFocusUsageEntries(state)
  return FOCUS_USAGE_GROUPS.map((sourceType) => {
    const groupEntries = entries.filter((entry) => entry.sourceType === sourceType)
    return { sourceType, entries: groupEntries, amount: groupEntries.reduce((sum, entry) => sum + entry.amount, 0) }
  })
}
