import { ITEMS } from '../../game/content/items/items'
import { SCHOOLS } from '../../game/content/schools/schools'
import { BALANCE } from '../../game/core/balance/balance'
import { pushNotification } from '../../game/engine'
import { getResearchAvailableQuantity } from '../../game/systems/research/researchSelectors'
import { RESEARCH_SLOT_ORDER } from '../../game/systems/research/researchReservations'
import type { GameState, ItemId, ResearchJobState, ResearchSlotId, SchoolId } from '../../game/types'
import { assignResearchAcolyteAction as assignResearchAcolyteRuntimeAction, removeResearchAcolyteAction as removeResearchAcolyteRuntimeAction, assignOneResearchAcolyteEachAction as assignOneResearchAcolyteEachRuntimeAction, clearResearchAcolytesAction as clearResearchAcolytesRuntimeAction } from './acolyteActions'

const validSchool = (schoolId: SchoolId) => Boolean(SCHOOLS[schoolId])
const finiteQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 0
const isProtected = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)
const makeJob = (itemId: ItemId, targetSchoolId: SchoolId, quantity: number): ResearchJobState => ({ itemId, targetSchoolId, requestedQuantity: quantity, remainingQuantity: quantity, progressMs: 0, acolyteAssigned: false, status: 'prepared' })

const notify = (state: GameState, text: string) => pushNotification(state, text, 'warning', { key: 'research-action', cooldownMs: 1200 })

export const prepareResearchAction = (state: GameState, itemId: ItemId, targetSchoolId: SchoolId, requestedQuantity: number) => {
  const item = ITEMS[itemId]
  const quantity = finiteQuantity(requestedQuantity)
  if (!item || item.kind !== 'material' || !item.researchSchool) { notify(state, 'That item cannot be researched.'); return false }
  if (!validSchool(targetSchoolId)) { notify(state, 'Choose a valid target Magic School.'); return false }
  if (quantity < 1) { notify(state, 'Research quantity must be at least 1.'); return false }
  if (isProtected(state, itemId)) { notify(state, 'This item is protected. Unprotect it before preparing Research.'); return false }
  if (getResearchAvailableQuantity(state, itemId) < quantity) { notify(state, 'Not enough unreserved items for this Research batch.'); return false }

  const existingSlot = RESEARCH_SLOT_ORDER.find((slotId) => {
    const job = state.activities.research.slots[slotId]
    return job?.itemId === itemId && job.targetSchoolId === targetSchoolId
  })
  const slotId = existingSlot ?? RESEARCH_SLOT_ORDER.find((candidate) => !state.activities.research.slots[candidate])
  if (!slotId) { notify(state, `Research supports ${BALANCE.research.maxPreparedSlots} prepared batches.`); return false }
  const existing = state.activities.research.slots[slotId]
  if (existing) {
    existing.requestedQuantity += quantity
    existing.remainingQuantity += quantity
    if (!existing.acolyteAssigned) existing.status = 'prepared'
  } else {
    state.activities.research.slots[slotId] = makeJob(itemId, targetSchoolId, quantity)
  }
  return true
}

export const removePreparedResearchAction = (state: GameState, slotId: ResearchSlotId) => {
  if (!RESEARCH_SLOT_ORDER.includes(slotId)) return false
  if (!state.activities.research.slots[slotId]) return false
  state.activities.research.slots[slotId] = null
  return true
}

export const assignResearchAcolyteAction = (state: GameState, slotId: ResearchSlotId) => {
  return assignResearchAcolyteRuntimeAction(state, slotId)
}

export const assignOneResearchAcolyteEachAction = (state: GameState) => {
  return assignOneResearchAcolyteEachRuntimeAction(state) > 0
}

export const removeResearchAcolyteAction = (state: GameState, slotId: ResearchSlotId) => {
  return removeResearchAcolyteRuntimeAction(state, slotId)
}

export const assignMaxResearchAcolytesAction = (state: GameState, slotId: ResearchSlotId) => {
  return assignResearchAcolyteRuntimeAction(state, slotId) ? 1 : 0
}

export const pauseResearchAction = (state: GameState, slotId: ResearchSlotId) => {
  return removeResearchAcolyteRuntimeAction(state, slotId)
}

export const setResearchAcolytesAction = (state: GameState, slotId: ResearchSlotId, amount: number, force = false) => {
  if (amount > 0) return assignResearchAcolyteRuntimeAction(state, slotId)
  return removeResearchAcolyteRuntimeAction(state, slotId)
}

export const clearResearchAcolytesAction = (state: GameState) => {
  clearResearchAcolytesRuntimeAction(state)
}

export const clearPreparedResearchAction = (state: GameState) => {
  RESEARCH_SLOT_ORDER.forEach((slotId) => { state.activities.research.slots[slotId] = null })
}
