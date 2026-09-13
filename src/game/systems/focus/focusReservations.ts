import { BALANCE } from '../../core/balance/balance'
import { ITEMS } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { SPELLS } from '../../content/spells/spells'
import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../content/recipes/recipes'
import { RESEARCH_SLOT_ORDER } from '../research/researchReservations'
import { getSpellAutoCastFocusCost } from '../spells/spellProgression'
import type { FocusReservation, GameState, SpellId } from '../../types'

export type FocusReservationState = {
  activities: Pick<GameState['activities'], 'channeling' | 'research' | 'transmutation' | 'autoCast'>
  progress: Pick<GameState['progress'], 'spellRanks'>
  equipment: GameState['equipment']
  artifactProgress: GameState['artifactProgress']
}
export type FocusUsageState = FocusReservationState & Pick<GameState, 'player'>

export const deriveFocusReservations = (state: FocusReservationState): FocusReservation[] => {
  const reservations: FocusReservation[] = []
  const echoes = state.activities.channeling.echoesAssigned
  if (echoes > 0) reservations.push({ id: 'channeling-echoes', sourceType: 'channeling', sourceId: 'echoes', amount: echoes * BALANCE.channeling.echoFocusCost, label: 'Arcane Echo Channeling' })
  const research = state.activities.research
  const researchJobs = research.slots
    ? RESEARCH_SLOT_ORDER.map((slotId) => ({ slotId, job: research.slots[slotId] })).filter((entry): entry is { slotId: typeof RESEARCH_SLOT_ORDER[number]; job: NonNullable<typeof entry.job> } => Boolean(entry.job && entry.job.echoesAssigned > 0))
    : research.running && research.itemId && research.targetSchoolId ? [{ slotId: 'research-1' as const, job: { itemId: research.itemId, targetSchoolId: research.targetSchoolId, requestedQuantity: research.requestedQuantity ?? research.remainingQuantity ?? 0, remainingQuantity: research.remainingQuantity ?? 0, progressMs: research.progressMs ?? 0, echoesAssigned: 1, status: 'running' as const } }] : []
  researchJobs.forEach(({ slotId, job }) => reservations.push({ id: `research-${slotId}`, sourceType: 'research', sourceId: slotId, amount: Math.max(0, Math.floor(job.echoesAssigned)) * BALANCE.research.echoFocusCost, label: `Research · ${ITEMS[job.itemId]?.name ?? job.itemId} → ${SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId}` }))
  RECIPE_ORDER.forEach((recipeId) => {
    const echoes = Math.max(0, Math.floor(state.activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0))
    if (!echoes) return
    reservations.push({ id: `transmutation-${recipeId}`, sourceType: 'transmutation', sourceId: recipeId, amount: echoes * BALANCE.transmutation.echoFocusCost, label: `Transmutation · ${RECIPES[recipeId].name}` })
  })
  Object.entries(state.activities.autoCast).forEach(([spellId, active]) => {
    if (!active) return
    const spell = SPELLS[spellId as SpellId]
    const amount = getSpellAutoCastFocusCost(state, spellId as SpellId)
    if (!spell || amount === null) return
    reservations.push({ id: `autocast-${spellId}`, sourceType: 'autocast', sourceId: spellId, amount, label: `${spell.name} Auto-Cast` })
  })
  return reservations
}

export const selectUsedFocus = (state: FocusReservationState) => deriveFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
export const selectRawFreeFocus = (state: FocusUsageState) => state.player.maxFocus - selectUsedFocus(state)
export const selectFreeFocus = (state: FocusUsageState) => Math.max(0, selectRawFreeFocus(state))
export const usedFocus = selectUsedFocus
export const freeFocus = selectFreeFocus
export const canReserveFocus = (state: FocusUsageState, amount: number) => selectFreeFocus(state) >= amount
