import { ITEMS, getResearchXp } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { BALANCE } from '../../core/balance/balance'
import { getEquippedReservedQuantity } from '../../core/equipment/equipmentRules'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { manaRegenPerSecond } from '../../engine/channelingEngine'
import { selectFreeFocus } from '../../engine'
import type { GameState, ItemId, ResearchJobState, ResearchJobStatus, ResearchSlotId, SchoolId } from '../../types'
import { clamp } from '../../utils'
import { RESEARCH_SLOT_ORDER } from './researchReservations'
import { getSchoolProgressInfo } from '../schools'
import { CONTINUOUS_MANA_EPSILON, continuousManaPerSecond, estimateContinuousFundingRatio, getContinuousManaDemandPerSecond } from '../simulation/continuousManaScheduler'

export interface PreparedResearchJob extends ResearchJobState { slotId: ResearchSlotId }

const finiteQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const finiteProgress = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const isProtected = (state: Pick<GameState, 'protectedItems' | 'equipment'>, itemId: ResearchJobState['itemId']) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)
const rawOwned = (state: Pick<GameState, 'inventory' | 'equipment'>, itemId: ResearchJobState['itemId']) => Math.max(0, finiteQuantity(state.inventory[itemId]) - getEquippedReservedQuantity(state, itemId))

export const getPreparedResearchJobs = (state: Pick<GameState, 'activities'>): PreparedResearchJob[] => {
  const research = state.activities.research
  const jobs = research?.slots
    ? RESEARCH_SLOT_ORDER.flatMap((slotId) => {
      const job = research.slots[slotId]
      return job && finiteQuantity(job.remainingQuantity) > 0 ? [{ ...job, slotId }] : []
    })
    : []
  if (jobs.length > 0 || !research?.running || !research.itemId || !research.targetSchoolId) return jobs
  // A V8-shaped in-memory activity is converted by the engine; selectors stay
  // useful for compatibility until the next simulation step.
  return [{ slotId: 'research-1', itemId: research.itemId, targetSchoolId: research.targetSchoolId, requestedQuantity: finiteQuantity(research.requestedQuantity) || finiteQuantity(research.remainingQuantity), remainingQuantity: finiteQuantity(research.remainingQuantity), progressMs: finiteProgress(research.progressMs), echoesAssigned: 1, status: research.status === 'waiting-mana' ? 'waiting-mana' : research.status === 'mana-limited' ? 'mana-limited' : research.status === 'level-cap' ? 'level-cap' : 'running' }]
}

export const getPreparedResearchCount = (state: Pick<GameState, 'activities'>) => getPreparedResearchJobs(state).length
export const getResearchEchoesAssigned = (state: Pick<GameState, 'activities'>) => getPreparedResearchJobs(state).reduce((total, job) => total + finiteQuantity(job.echoesAssigned), 0)
export const getResearchEchoCapacity = (state: Pick<GameState, 'activities'> & Partial<Pick<GameState, 'debug'>>) => state.debug?.ignoreEchoLimit ? Number.MAX_SAFE_INTEGER : BALANCE.research.maxEchoes
export const getResearchEchoFocusCost = () => BALANCE.research.echoFocusCost
export const getResearchFocusReserved = (state: Pick<GameState, 'activities'>) => getResearchEchoesAssigned(state) * getResearchEchoFocusCost()

export function getResearchAvailableQuantity(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment'>, itemId: ItemId) {
  return getConsumableQuantity(state, itemId)
}

export const getResearchJob = (state: Pick<GameState, 'activities'>, slotId: ResearchSlotId): ResearchJobState | null => {
  const research = state.activities.research
  const stored = research?.slots?.[slotId]
  if (stored) return stored
  if (slotId === 'research-1' && research?.running && research.itemId && research.targetSchoolId) return { itemId: research.itemId, targetSchoolId: research.targetSchoolId, requestedQuantity: finiteQuantity(research.requestedQuantity) || finiteQuantity(research.remainingQuantity), remainingQuantity: finiteQuantity(research.remainingQuantity), progressMs: finiteProgress(research.progressMs), echoesAssigned: 1, status: research.status === 'waiting-mana' ? 'waiting-mana' : research.status === 'mana-limited' ? 'mana-limited' : research.status === 'level-cap' ? 'level-cap' : 'running' }
  return null
}

export function getResearchJobStatus(state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'schools' | 'progress' | 'player'>, slotId: ResearchSlotId): ResearchJobStatus | 'empty' {
  const job = getResearchJob(state, slotId)
  if (!job || finiteQuantity(job.remainingQuantity) <= 0) return 'empty'
  const item = ITEMS[job.itemId]
  if (!item || !item.researchSchool || !SCHOOLS[job.targetSchoolId]) return 'missing-item'
  if (isProtected(state, job.itemId)) return 'protected'
  if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) return 'level-cap'
  if (rawOwned(state, job.itemId) < 1) return 'missing-item'
  if (finiteQuantity(job.echoesAssigned) <= 0) return 'prepared'
  const demand = getContinuousManaDemandPerSecond(state)
  const ratio = estimateContinuousFundingRatio(state.player.mana, manaRegenPerSecond(state), demand, BALANCE.tickMs)
  if (ratio <= CONTINUOUS_MANA_EPSILON) return 'waiting-mana'
  if (ratio < 1 - CONTINUOUS_MANA_EPSILON) return 'mana-limited'
  return 'running'
}

export const getResearchJobProgressPercent = (state: Pick<GameState, 'activities'>, slotId: ResearchSlotId) => {
  const job = getResearchJob(state, slotId)
  return job ? clamp(finiteProgress(job.progressMs) / BALANCE.research.durationPerItemMs * 100, 0, 100) : 0
}

export const getResearchEffectiveDuration = (job: Pick<ResearchJobState, 'echoesAssigned'>) => {
  const echoes = finiteQuantity(job.echoesAssigned)
  return echoes > 0 ? BALANCE.research.durationPerItemMs / echoes : null
}

export const getResearchItemsPerHour = (job: Pick<ResearchJobState, 'echoesAssigned'>) => finiteQuantity(job.echoesAssigned) * 3_600_000 / BALANCE.research.durationPerItemMs
export const getResearchXpPerHour = (job: Pick<ResearchJobState, 'itemId' | 'targetSchoolId' | 'echoesAssigned'>) => getResearchItemsPerHour(job) * getResearchXp(job.itemId, job.targetSchoolId)
export const getResearchManaPerSecond = (job: Pick<ResearchJobState, 'echoesAssigned'>) => continuousManaPerSecond(BALANCE.research.manaCostPerItem, BALANCE.research.durationPerItemMs, finiteQuantity(job.echoesAssigned))

export const getResearchBatchEtaMs = (job: Pick<ResearchJobState, 'remainingQuantity' | 'progressMs' | 'echoesAssigned'>) => {
  const echoes = finiteQuantity(job.echoesAssigned)
  const remaining = finiteQuantity(job.remainingQuantity)
  if (!echoes || !remaining) return null
  const current = Math.max(0, BALANCE.research.durationPerItemMs - finiteProgress(job.progressMs)) / echoes
  return current + Math.max(0, remaining - 1) * BALANCE.research.durationPerItemMs / echoes
}

export const getResearchJobXpPerItem = (job: Pick<ResearchJobState, 'itemId' | 'targetSchoolId'>) => getResearchXp(job.itemId, job.targetSchoolId)
export const getResearchSchoolName = (schoolId: SchoolId) => SCHOOLS[schoolId]?.name ?? schoolId

export interface ResearchNextLevelEta {
  etaMs: number | null
  beyondBatch: boolean
}

/** Estimate when this prepared batch alone reaches its target school's next level. */
export const getResearchNextLevelEtaMs = (state: Pick<GameState, 'activities' | 'inventory' | 'protectedItems' | 'equipment' | 'schools' | 'progress' | 'player'>, slotId: ResearchSlotId): ResearchNextLevelEta => {
  const job = getResearchJob(state, slotId)
  if (!job || finiteQuantity(job.remainingQuantity) <= 0 || finiteQuantity(job.echoesAssigned) <= 0) return { etaMs: null, beyondBatch: false }
  const status = getResearchJobStatus(state, slotId)
  if (status !== 'running') return { etaMs: null, beyondBatch: false }
  const school = getSchoolProgressInfo(state, job.targetSchoolId)
  if (school.atCap || school.nextLevelXp === null) return { etaMs: null, beyondBatch: false }
  const xpPerItem = getResearchJobXpPerItem(job)
  const neededXp = Math.max(0, school.nextLevelXp - school.xp)
  const itemsNeeded = Math.ceil(neededXp / Math.max(1, xpPerItem))
  const remaining = finiteQuantity(job.remainingQuantity)
  if (itemsNeeded > remaining) return { etaMs: null, beyondBatch: true }
  const echoes = finiteQuantity(job.echoesAssigned)
  const currentItemMs = Math.max(0, BALANCE.research.durationPerItemMs - finiteProgress(job.progressMs)) / echoes
  const futureItemMs = BALANCE.research.durationPerItemMs / echoes
  return { etaMs: currentItemMs + Math.max(0, itemsNeeded - 1) * futureItemMs, beyondBatch: false }
}
