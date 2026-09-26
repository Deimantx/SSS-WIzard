import { BALANCE } from '../../game/core/balance/balance'
import { getResearchJobStatus } from '../../game/systems/research/researchSelectors'
import { getTransmutationJob } from '../../game/systems/transmutation/transmutationSelectors'
import { canAssignAcolyte, selectFreeAcolytes, selectUsedAcolytes } from '../../game/systems/acolytes'
import { pushNotification } from '../../game/engine'
import type { GameState, ResearchSlotId, TransmutationRecipeId } from '../../game/types'
import { TRANSMUTATION_RECIPES } from '../../game/content/recipes/recipes'

const noFreeAcolytes = (state: GameState) => pushNotification(state, 'No free Acolytes. Unassign an Acolyte from another Tower job.', 'warning', { key: 'acolyte-capacity', cooldownMs: 1200 })
const eligible = (state: GameState, current: boolean) => !current && (canAssignAcolyte(state) || state.debug.ignoreAcolyteLimit)

export const assignChannelingAcolyteAction = (state: GameState) => {
  if (!eligible(state, false)) { noFreeAcolytes(state); return false }
  state.activities.channeling.acolytesAssigned = Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0)) + 1
  if (state.progress.tutorialStage === 'first-kill' || state.progress.tutorialStage === 'tower-work') state.progress.tutorialStage = 'channeling'
  return true
}

export const removeChannelingAcolyteAction = (state: GameState) => {
  const current = Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0))
  if (!current) return false
  state.activities.channeling.acolytesAssigned = current - 1
  return true
}

export const setChannelingAcolytesDebugAction = (state: GameState, amount: number) => {
  const target = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const nonChanneling = Math.max(0, selectUsedAcolytes(state) - Math.max(0, Math.floor(state.activities.channeling.acolytesAssigned ?? 0)))
  const capacity = state.debug.ignoreAcolyteLimit ? target : Math.max(0, Math.floor((state.tower.acolytes.base + Object.values(state.tower.acolytes.permanentBonuses).reduce((sum, value) => sum + value, 0) + state.debug.bonusAcolytes) - nonChanneling))
  state.activities.channeling.acolytesAssigned = Math.min(target, capacity)
}

export const assignResearchAcolyteAction = (state: GameState, slotId: ResearchSlotId) => {
  const job = state.activities.research.slots[slotId]
  if (!job || job.acolyteAssigned) return false
  const status = getResearchJobStatus(state, slotId)
  if (status === 'level-cap' || status === 'protected' || status === 'missing-item') return false
  if (!canAssignAcolyte(state)) { noFreeAcolytes(state); return false }
  job.acolyteAssigned = true
  job.status = 'running'
  if (state.progress.tutorialStage === 'first-kill' || state.progress.tutorialStage === 'tower-work') state.progress.tutorialStage = 'research'
  return true
}

export const removeResearchAcolyteAction = (state: GameState, slotId: ResearchSlotId) => {
  const job = state.activities.research.slots[slotId]
  if (!job?.acolyteAssigned) return false
  job.acolyteAssigned = false
  if (job.status === 'running' || job.status === 'flux-limited' || job.status === 'waiting-flux') job.status = 'prepared'
  return true
}

export const assignOneResearchAcolyteEachAction = (state: GameState) => {
  let assigned = 0
  for (const slotId of ['research-1', 'research-2', 'research-3', 'research-4'] as ResearchSlotId[]) if (assignResearchAcolyteAction(state, slotId)) assigned += 1
  return assigned
}

export const clearResearchAcolytesAction = (state: GameState) => {
  for (const job of Object.values(state.activities.research.slots)) if (job) { job.acolyteAssigned = false; if (job.status === 'running' || job.status === 'flux-limited' || job.status === 'waiting-flux') job.status = 'prepared' }
}

export const assignTransmutationAcolyteAction = (state: GameState, recipeId: TransmutationRecipeId) => {
  const recipe = TRANSMUTATION_RECIPES[recipeId]
  const job = getTransmutationJob(state, recipeId)
  if (!recipe || job?.acolyteAssigned) return false
  if (!canAssignAcolyte(state)) { noFreeAcolytes(state); return false }
  state.activities.transmutation.jobs[recipeId] = { ...(job ?? { progressMs: 0 }), acolyteAssigned: true }
  if (state.progress.tutorialStage === 'first-kill' || state.progress.tutorialStage === 'tower-work') state.progress.tutorialStage = 'transmutation'
  return true
}

export const removeTransmutationAcolyteAction = (state: GameState, recipeId: TransmutationRecipeId) => {
  const job = state.activities.transmutation.jobs[recipeId]
  if (!job?.acolyteAssigned) return false
  job.acolyteAssigned = false
  return true
}

export const clearTransmutationAcolytesAction = (state: GameState) => Object.values(state.activities.transmutation.jobs).forEach((job) => { if (job) job.acolyteAssigned = false })

export const getAcolyteDebugSummary = (state: GameState) => ({ total: state.debug.acolyteTotalOverride ?? state.tower.acolytes.base + Object.values(state.tower.acolytes.permanentBonuses).reduce((sum, value) => sum + value, 0) + state.debug.bonusAcolytes, used: selectUsedAcolytes(state), free: selectFreeAcolytes(state) })

export const resetAcolytesAction = (state: GameState) => {
  state.tower.acolytes.permanentBonuses = {}
  state.debug.bonusAcolytes = 0
  state.debug.acolyteTotalOverride = null
  state.activities.channeling.acolytesAssigned = 0
  clearResearchAcolytesAction(state)
  clearTransmutationAcolytesAction(state)
}
