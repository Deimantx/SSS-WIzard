import { BALANCE } from '../../core/balance/balance'
import { deriveFocusReservations } from '../../engine'
import { TRANSMUTATION_RECIPES as RECIPES } from '../../content/recipes/recipes'
import { getRecipeStatus } from '../transmutation/transmutationSelectors'
import { formatSpellRank, getSpellRank } from '../spells'
import type { FocusReservation, GameState, ResearchJobStatus, SpellId } from '../../types'

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

export const FOCUS_USAGE_GROUPS: readonly FocusReservation['sourceType'][] = ['channeling', 'research', 'transmutation', 'autocast']

const plural = (count: number, singular: string) => `${count} ${singular}${count === 1 ? '' : 's'}`
const researchStatusLabel = (status: ResearchJobStatus | undefined) => status ? status.replace('-', ' ').toUpperCase() : 'RUNNING'

export function getFocusUsageEntries(state: GameState): FocusUsageEntry[] {
  return deriveFocusReservations(state).map((reservation) => {
    if (reservation.sourceType === 'channeling') {
      const echoes = Math.max(0, Math.floor(state.activities.channeling.echoesAssigned))
      return { ...reservation, detail: `${plural(echoes, 'Echo')} × ${BALANCE.channeling.echoFocusCost} Focus`, status: 'ACTIVE' }
    }
    if (reservation.sourceType === 'research') {
      const job = state.activities.research.slots[reservation.sourceId as keyof typeof state.activities.research.slots]
      const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? reservation.amount / BALANCE.research.echoFocusCost))
      return { ...reservation, detail: `${plural(echoes, 'Echo')} × ${BALANCE.research.echoFocusCost} Focus`, status: researchStatusLabel(job?.status) }
    }
    if (reservation.sourceType === 'transmutation') {
      const job = state.activities.transmutation.jobs[reservation.sourceId.replace('transmutation-', '') as keyof typeof state.activities.transmutation.jobs]
      const recipe = RECIPES[reservation.sourceId.replace('transmutation-', '') as keyof typeof RECIPES]
      const echoes = Math.max(0, Math.floor(job?.echoesAssigned ?? reservation.amount / BALANCE.transmutation.echoFocusCost))
      const status = recipe ? getRecipeStatus(state, recipe).replace('-', ' ').toUpperCase() : 'ACTIVE'
      return { ...reservation, detail: `${plural(echoes, 'Echo')} × ${BALANCE.transmutation.echoFocusCost} Focus`, status }
    }
    const rank = getSpellRank(state, reservation.sourceId as SpellId)
    return { ...reservation, detail: `${rank ? formatSpellRank(rank) : 'Spell'} · ${reservation.amount} Focus`, status: 'ENABLED' }
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
