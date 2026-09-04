import { ITEMS, getResearchXp } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { BALANCE } from '../../core/balance/balance'
import { getEquippedReservedQuantity } from '../../core/equipment/equipmentRules'
import { grantSchoolXp } from '../../engine'
import type { GameState, ItemId, ResearchActivity, ResearchJobState, ResearchSlotId, SchoolId } from '../../types'
import { allocateContinuousMana, CONTINUOUS_MANA_EPSILON, requestedManaForProgress, type ContinuousManaAllocation, type ContinuousManaFundingResult, type ContinuousManaWorkRequest } from '../simulation/continuousManaScheduler'
import { RESEARCH_SLOT_ORDER } from './researchReservations'

export interface ResearchAdvanceContext {
  mode: 'live' | 'banked'
  report?: { recordResearch: (itemId: ItemId, schoolId: SchoolId, xp: number) => void; recordResearchStoppedAtCap: () => void }
}

const finiteQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const finiteProgress = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const isProtected = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)
const getRawAvailable = (state: GameState, itemId: ItemId) => Math.max(0, finiteQuantity(state.inventory[itemId]) - getEquippedReservedQuantity(state, itemId))
const requestKey = (slotId: ResearchSlotId) => `research-${slotId}`

const emptySlots = () => ({ 'research-1': null, 'research-2': null, 'research-3': null, 'research-4': null } as Record<ResearchSlotId, ResearchJobState | null>)

/** Normalizes an old in-memory activity into the slot model before simulation. */
export const ensureResearchActivity = (state: GameState): ResearchActivity => {
  const research = state.activities.research as ResearchActivity
  if (!research.slots || typeof research.slots !== 'object') research.slots = emptySlots()
  const hasSlot = RESEARCH_SLOT_ORDER.some((slotId) => research.slots[slotId] !== null && research.slots[slotId] !== undefined)
  if (!hasSlot && research.running && research.itemId && research.targetSchoolId && ITEMS[research.itemId]?.researchSchool) {
    research.slots['research-1'] = {
      itemId: research.itemId,
      targetSchoolId: research.targetSchoolId,
      requestedQuantity: finiteQuantity(research.requestedQuantity) || finiteQuantity(research.remainingQuantity),
      remainingQuantity: finiteQuantity(research.remainingQuantity),
      progressMs: finiteProgress(research.progressMs),
      echoesAssigned: 1,
      status: research.status === 'waiting-mana' ? 'waiting-mana' : research.status === 'level-cap' ? 'level-cap' : 'running',
    }
  }
  return research
}

/** Consumes one owned copy without subtracting the job's own reservation. */
export const consumePreparedResearchItem = (state: GameState, slotId: ResearchSlotId) => {
  const job = state.activities.research.slots[slotId]
  if (!job || getRawAvailable(state, job.itemId) < 1) return false
  state.inventory[job.itemId] = Math.max(0, finiteQuantity(state.inventory[job.itemId]) - 1)
  return true
}

const stopBlocked = (job: ResearchJobState, status: ResearchJobState['status'], context: ResearchAdvanceContext) => {
  const changed = job.status !== status
  job.status = status
  job.echoesAssigned = 0
  const progress = finiteProgress(job.progressMs)
  // A blocked full bar belongs to the old completion-burst model and cannot
  // be carried into continuous funding as a free completed item.
  job.progressMs = progress >= BALANCE.research.durationPerItemMs ? 0 : Math.min(BALANCE.research.durationPerItemMs, progress)
  if (status === 'level-cap' && changed) context.report?.recordResearchStoppedAtCap()
}

const normalizeJobProgress = (job: ResearchJobState) => {
  const progress = finiteProgress(job.progressMs)
  // A full waiting-Mana bar was never funded. Reset it rather than granting
  // an item immediately after hydration or the next simulation tick.
  if (progress >= BALANCE.research.durationPerItemMs) {
    job.progressMs = 0
    return 0
  }
  job.progressMs = progress
  return progress
}

/** Builds all eligible Research demand before any item, XP, or school state mutates. */
export const buildResearchWorkRequests = (state: GameState, deltaMs: number, context: ResearchAdvanceContext = { mode: 'live' }): ContinuousManaWorkRequest[] => {
  const research = ensureResearchActivity(state)
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0
  const requests: ContinuousManaWorkRequest[] = []

  for (const slotId of RESEARCH_SLOT_ORDER) {
    const job = research.slots[slotId]
    if (!job) continue
    job.requestedQuantity = finiteQuantity(job.requestedQuantity)
    job.remainingQuantity = finiteQuantity(job.remainingQuantity)
    job.echoesAssigned = finiteQuantity(job.echoesAssigned)
    const progress = normalizeJobProgress(job)
    if (job.remainingQuantity <= 0) { research.slots[slotId] = null; continue }
    const item = ITEMS[job.itemId]
    if (!item || !item.researchSchool || !SCHOOLS[job.targetSchoolId]) { stopBlocked(job, 'missing-item', context); continue }
    if (isProtected(state, job.itemId)) { stopBlocked(job, 'protected', context); continue }
    if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { stopBlocked(job, 'level-cap', context); continue }
    if (job.echoesAssigned <= 0) { job.status = 'prepared'; continue }
    const availableItems = Math.min(job.remainingQuantity, getRawAvailable(state, job.itemId))
    if (availableItems < 1) { stopBlocked(job, 'missing-item', context); continue }
    const workCapacity = Math.max(0, availableItems * BALANCE.research.durationPerItemMs - progress)
    const requestedProgressMs = Math.min(delta * job.echoesAssigned, workCapacity)
    if (requestedProgressMs <= CONTINUOUS_MANA_EPSILON) continue
    requests.push({
      key: requestKey(slotId),
      system: 'research',
      sourceId: slotId,
      requestedProgressMs,
      manaPerCycle: BALANCE.research.manaCostPerItem,
      cycleDurationMs: BALANCE.research.durationPerItemMs,
      requestedMana: requestedManaForProgress(BALANCE.research.manaCostPerItem, requestedProgressMs, BALANCE.research.durationPerItemMs),
    })
  }
  return requests
}

const completeResearchCycle = (state: GameState, slotId: ResearchSlotId, job: ResearchJobState, context: ResearchAdvanceContext) => {
  if (isProtected(state, job.itemId)) return 'protected' as const
  if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) return 'level-cap' as const
  if (!consumePreparedResearchItem(state, slotId)) return 'missing-item' as const
  const xp = getResearchXp(job.itemId, job.targetSchoolId)
  const levels = grantSchoolXp(state, job.targetSchoolId, xp)
  context.report?.recordResearch(job.itemId, job.targetSchoolId, xp)
  job.remainingQuantity -= 1
  return 'complete' as const
}

/** Applies only Research work funded by the shared scheduler. */
export const applyResearchAllocations = (state: GameState, requests: readonly ContinuousManaWorkRequest[], allocations: Record<string, ContinuousManaAllocation>, context: ResearchAdvanceContext) => {
  const requested = new Map(requests.map((request) => [request.key, request]))
  const research = ensureResearchActivity(state)

  for (const slotId of RESEARCH_SLOT_ORDER) {
    const job = research.slots[slotId]
    if (!job) continue
    const request = requested.get(requestKey(slotId))
    const allocation = allocations[requestKey(slotId)]
    const fundedProgressMs = allocation?.fundedProgressMs ?? 0
    const progress = normalizeJobProgress(job)
    if (fundedProgressMs > CONTINUOUS_MANA_EPSILON) job.progressMs = progress + fundedProgressMs

    while (job.progressMs >= BALANCE.research.durationPerItemMs - CONTINUOUS_MANA_EPSILON && job.remainingQuantity > 0) {
      const result = completeResearchCycle(state, slotId, job, context)
      if (result !== 'complete') {
        stopBlocked(job, result, context)
        break
      }
      job.progressMs = Math.max(0, job.progressMs - BALANCE.research.durationPerItemMs)
      if (job.remainingQuantity <= 0) { research.slots[slotId] = null; break }
    }

    const current = research.slots[slotId]
    if (!current) continue
    current.progressMs = Math.min(BALANCE.research.durationPerItemMs - CONTINUOUS_MANA_EPSILON, Math.max(0, current.progressMs))
    if (!request || request.requestedProgressMs <= CONTINUOUS_MANA_EPSILON) {
      if (current.echoesAssigned > 0 && current.status !== 'level-cap' && current.status !== 'protected' && current.status !== 'missing-item') current.status = 'running'
    } else if (fundedProgressMs <= CONTINUOUS_MANA_EPSILON) {
      current.status = 'waiting-mana'
    } else if (fundedProgressMs + CONTINUOUS_MANA_EPSILON < request.requestedProgressMs) {
      current.status = 'mana-limited'
    } else {
      current.status = current.echoesAssigned > 0 ? 'running' : 'prepared'
    }
  }
  return state
}

/** Advances every Echo-assigned prepared batch after shared funding is planned. */
export function advanceResearch(state: GameState, deltaMs: number, context: ResearchAdvanceContext = { mode: 'live' }, funding?: ContinuousManaFundingResult) {
  const requests = buildResearchWorkRequests(state, deltaMs, context)
  const result = funding ?? allocateContinuousMana(state, requests)
  applyResearchAllocations(state, requests, result.allocations, context)
  return state
}

/** DEBUG ONLY: completes one prepared Research item without normal timing or Mana funding. */
export const forceCompleteResearchCycle = (state: GameState, slotId: ResearchSlotId, context: ResearchAdvanceContext) => {
  const job = state.activities.research.slots[slotId]
  if (!job || job.remainingQuantity <= 0 || isProtected(state, job.itemId) || state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) return false
  const result = completeResearchCycle(state, slotId, job, context)
  if (result !== 'complete') return false
  job.progressMs = 0
  if (job.remainingQuantity <= 0) state.activities.research.slots[slotId] = null
  return true
}
