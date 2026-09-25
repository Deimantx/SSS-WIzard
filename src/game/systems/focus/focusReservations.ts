import { BALANCE } from '../../core/balance/balance'
import { ITEMS } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { SPELLS } from '../../content/spells/spells'
import { TRANSMUTATION_RECIPES as RECIPES, TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../../content/recipes/recipes'
import { RESEARCH_SLOT_ORDER } from '../research/researchReservations'
import { getSpellAutoCastFocusCost } from '../spells/spellProgression'
import type { FocusReservation, GameState, SpellId, SpellPresetSlot } from '../../types'

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
  return reservations
}

const getAutoCastSlots = (slots: readonly SpellPresetSlot[] | null | undefined) => slots?.filter((slot) => slot.autoCast) ?? []

export const deriveActiveCombatFocusReservations = (state: FocusReservationState): FocusReservation[] => {
  if (!state.combat?.active) return []
  return getAutoCastSlots(state.combat.activeSpellLoadout?.slots).flatMap((slot) => {
    const spell = SPELLS[slot.spellId as SpellId]
    const amount = getSpellAutoCastFocusCost(state, slot.spellId as SpellId)
    return spell && amount !== null
      ? [{ id: `combat-${slot.spellId}`, sourceType: 'combat' as const, sourceId: slot.spellId, amount, label: `${spell.name} Auto-Cast` }]
      : []
  })
}

export const deriveFocusReservations = (state: FocusReservationState): FocusReservation[] => [
  ...deriveActiveNonCombatFocusReservations(state),
  ...deriveActiveCombatFocusReservations(state),
]

export interface CombatFocusReadiness {
  maxFocus: number
  activeNonCombatFocus: number
  combatFocusRequired: number
  availableForCombat: number
  missingFocus: number
  projectedTotalFocus: number
  projectedFreeFocus: number
  ready: boolean
  autoCastSpellIds: SpellId[]
  autoCastSpellCount: number
}

/** Projects a prepared combat loadout against active non-combat reservations. */
export const getCombatFocusReadiness = (state: FocusUsageState, slots: readonly SpellPresetSlot[] | null | undefined): CombatFocusReadiness => {
  const maxFocus = Math.max(0, state.player.maxFocus)
  const activeNonCombatFocus = deriveActiveNonCombatFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
  const autoCastSlots = getAutoCastSlots(slots)
  const autoCastSpellIds = autoCastSlots.map((slot) => slot.spellId as SpellId)
  const combatFocusRequired = autoCastSlots.reduce((sum, slot) => sum + (getSpellAutoCastFocusCost(state, slot.spellId as SpellId) ?? 0), 0)
  const availableForCombat = Math.max(0, maxFocus - activeNonCombatFocus)
  const missingFocus = Math.max(0, combatFocusRequired - availableForCombat)
  const projectedTotalFocus = activeNonCombatFocus + combatFocusRequired
  return { maxFocus, activeNonCombatFocus, combatFocusRequired, availableForCombat, missingFocus, projectedTotalFocus, projectedFreeFocus: maxFocus - projectedTotalFocus, ready: missingFocus === 0 || Boolean(state.debug?.allowFocusOverCap), autoCastSpellIds, autoCastSpellCount: autoCastSpellIds.length }
}

export const selectUsedFocus = (state: FocusReservationState) => deriveFocusReservations(state).reduce((sum, reservation) => sum + reservation.amount, 0)
export const selectRawFreeFocus = (state: FocusUsageState) => state.player.maxFocus - selectUsedFocus(state)
export const selectFreeFocus = (state: FocusUsageState) => Math.max(0, selectRawFreeFocus(state))
export const usedFocus = selectUsedFocus
export const freeFocus = selectFreeFocus
export const canReserveFocus = (state: FocusUsageState, amount: number) => selectFreeFocus(state) >= amount
