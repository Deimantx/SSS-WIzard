import { ITEMS } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../content/recipes/recipes'
import { RESEARCH_SLOT_ORDER } from '../research/researchReservations'
import type { FocusReservation, GameState } from '../../types'

export type FocusReservationState = {
  activities: Pick<GameState['activities'], 'channeling' | 'research' | 'transmutation' | 'autoCast'>
  progress: Pick<GameState['progress'], 'spellRanks'>
  equipment: GameState['equipment']
  artifactProgress: GameState['artifactProgress']
  arcaneCore: GameState['arcaneCore']
  combat?: Pick<GameState['combat'], 'active' | 'activeSpellLoadout'>
  debug?: Pick<GameState['debug'], 'allowFocusOverCap'>
}
export type FocusUsageState = FocusReservationState & { player: Pick<GameState['player'], 'maxFocus'> }

export const deriveActiveNonCombatFocusReservations = (state: Omit<FocusReservationState, 'combat'> | FocusReservationState): FocusReservation[] => {
  const reservations: FocusReservation[] = []
  const acolytes = Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0))
  if (acolytes > 0) reservations.push({ id: 'channeling-acolytes', sourceType: 'channeling', sourceId: 'acolytes', amount: 0, label: 'Acolyte Channeling' })
  const research = state.activities.research
  const researchJobs = research.slots
    ? RESEARCH_SLOT_ORDER.map((slotId) => ({ slotId, job: research.slots[slotId] })).filter((entry): entry is { slotId: typeof RESEARCH_SLOT_ORDER[number]; job: NonNullable<typeof entry.job> } => Boolean(entry.job?.acolyteAssigned))
    : research.running && research.itemId && research.targetSchoolId ? [{ slotId: 'research-1' as const, job: { itemId: research.itemId, targetSchoolId: research.targetSchoolId, requestedQuantity: research.requestedQuantity ?? research.remainingQuantity ?? 0, remainingQuantity: research.remainingQuantity ?? 0, progressMs: research.progressMs ?? 0, echoesAssigned: 1, status: 'running' as const } }] : []
  researchJobs.forEach(({ slotId, job }) => reservations.push({ id: `research-${slotId}`, sourceType: 'research', sourceId: slotId, amount: 0, label: `Research · ${ITEMS[job.itemId]?.name ?? job.itemId} → ${SCHOOLS[job.targetSchoolId]?.name ?? job.targetSchoolId}` }))
  RECIPE_ORDER.forEach((recipeId) => {
    if (!state.activities.transmutation.jobs[recipeId]?.acolyteAssigned) return
    reservations.push({ id: `transmutation-${recipeId}`, sourceType: 'transmutation', sourceId: recipeId, amount: 0, label: `Transmutation · ${RECIPES[recipeId].name}` })
  })
  return reservations
}

export const deriveFocusReservations = (state: FocusReservationState): FocusReservation[] => deriveActiveNonCombatFocusReservations(state)

export const selectUsedFocus = (state: FocusReservationState) => deriveFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
export const selectRawFreeFocus = (state: FocusUsageState) => state.player.maxFocus - selectUsedFocus(state)
export const selectFreeFocus = (state: FocusUsageState) => Math.max(0, selectRawFreeFocus(state))
export const usedFocus = selectUsedFocus
export const freeFocus = selectFreeFocus
export const canReserveFocus = (state: FocusUsageState, amount: number) => selectFreeFocus(state) >= amount
