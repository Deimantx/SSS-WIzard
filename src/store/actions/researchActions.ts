import { ITEMS, getResearchXp } from '../../game/content/items/items'
import { canReserveFocusAction } from './focusActions'
import { pushNotification, selectFreeFocus } from '../../game/engine'
import type { GameState, ItemId, SchoolId } from '../../game/types'

const isProtected = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)

export const setResearchConfigAction = (state: GameState, itemId: ItemId, targetSchoolId: SchoolId, quantity: number) => {
  const job = state.activities.research
  if (job.running) return
  job.itemId = itemId
  job.targetSchoolId = targetSchoolId
  job.requestedQuantity = Math.max(1, quantity)
  job.remainingQuantity = Math.max(1, quantity)
  job.progressMs = 0
  job.xpPerItem = getResearchXp(itemId, targetSchoolId)
  job.status = 'idle'
}

export const toggleResearchAction = (state: GameState, itemId?: ItemId, targetSchoolId?: SchoolId, quantity = 1) => {
  const job = state.activities.research
  if (job.running) { job.running = false; job.status = 'paused'; return }
  if (itemId) {
    job.itemId = itemId
    job.targetSchoolId = targetSchoolId ?? ITEMS[itemId].researchSchool ?? 'fire'
    job.requestedQuantity = Math.max(1, quantity)
    job.remainingQuantity = Math.max(1, quantity)
    job.xpPerItem = getResearchXp(itemId, job.targetSchoolId)
  }
  if (!job.itemId || !job.targetSchoolId) { job.status = 'missing-item'; return }
  if (isProtected(state, job.itemId)) { job.running = false; job.status = 'missing-item'; pushNotification(state, 'This item is protected. Unlock it before Research.', 'warning'); return }
  if ((state.inventory[job.itemId] ?? 0) < 1) { job.running = false; job.status = 'missing-item'; pushNotification(state, 'Cannot start Research - item missing', 'warning'); return }
  if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { job.running = false; job.status = 'level-cap'; pushNotification(state, 'Level Cap Reached - Research queue preserved', 'warning'); return }
  if (!canReserveFocusAction(state, job.focusCost)) { job.running = false; job.status = 'waiting-focus'; pushNotification(state, `Cannot start Research - Requires ${job.focusCost} Focus - Free Focus: ${selectFreeFocus(state)}`, 'warning'); return }
  job.running = true
  job.status = 'running'
}
