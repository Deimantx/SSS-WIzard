import { ITEMS, getResearchXp } from '../../content/items/items'
import { SCHOOLS } from '../../content/schools/schools'
import { SPELLS } from '../../content/spells/spells'
import { BALANCE } from '../../core/balance/balance'
import { getEquippedReservedQuantity } from '../../core/equipment/equipmentRules'
import { grantSchoolXp, pushNotification } from '../../engine'
import type { GameState, ItemId, ResearchActivity, ResearchJobState, ResearchSlotId, SchoolId } from '../../types'
import { RESEARCH_SLOT_ORDER } from './researchReservations'

export interface ResearchAdvanceContext {
  mode: 'live' | 'banked'
  report?: { recordResearch: (itemId: ItemId, schoolId: SchoolId, xp: number) => void; recordResearchStoppedAtCap: () => void }
}

const finiteQuantity = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const finiteProgress = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
const isProtected = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)
const getRawAvailable = (state: GameState, itemId: ItemId) => Math.max(0, finiteQuantity(state.inventory[itemId]) - getEquippedReservedQuantity(state, itemId))

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
  job.progressMs = Math.min(BALANCE.research.durationPerItemMs, Math.max(0, finiteProgress(job.progressMs)))
  if (status === 'level-cap' && changed) context.report?.recordResearchStoppedAtCap()
}

const unlockSchoolSpell = (state: GameState, schoolId: SchoolId, level: number) => {
  const spell = Object.values(SPELLS).find((entry) => entry.school === schoolId && entry.unlockLevel === level)
  if (spell && !state.progress.unlockedSpells.includes(spell.id)) {
    state.progress.unlockedSpells.push(spell.id)
    pushNotification(state, `${spell.name} unlocked`, 'success')
    return spell.id
  }
  return undefined
}

/** Advances every Echo-assigned prepared batch in stable slot order. */
export function advanceResearch(state: GameState, deltaMs: number, context: ResearchAdvanceContext = { mode: 'live' }) {
  const research = ensureResearchActivity(state)
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0

  for (const slotId of RESEARCH_SLOT_ORDER) {
    const job = research.slots[slotId]
    if (!job) continue
    job.requestedQuantity = finiteQuantity(job.requestedQuantity)
    job.remainingQuantity = finiteQuantity(job.remainingQuantity)
    job.progressMs = finiteProgress(job.progressMs)
    job.echoesAssigned = finiteQuantity(job.echoesAssigned)
    if (job.remainingQuantity <= 0) { research.slots[slotId] = null; continue }

    const item = ITEMS[job.itemId]
    if (!item || !item.researchSchool || !SCHOOLS[job.targetSchoolId]) { stopBlocked(job, 'missing-item', context); continue }
    if (isProtected(state, job.itemId)) { stopBlocked(job, 'protected', context); continue }
    if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { stopBlocked(job, 'level-cap', context); continue }
    if (job.echoesAssigned <= 0) { job.status = 'prepared'; continue }

    job.progressMs += delta * job.echoesAssigned
    while (job.progressMs >= BALANCE.research.durationPerItemMs && job.remainingQuantity > 0) {
      // Every cycle is validated again. Another slot may have just raised this school to its cap.
      if (isProtected(state, job.itemId)) { stopBlocked(job, 'protected', context); break }
      if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { stopBlocked(job, 'level-cap', context); break }
      if (getRawAvailable(state, job.itemId) < 1) { stopBlocked(job, 'missing-item', context); break }
      if (state.player.mana < BALANCE.research.manaCostPerItem) {
        job.progressMs = BALANCE.research.durationPerItemMs
        job.status = 'waiting-mana'
        break
      }

      if (!consumePreparedResearchItem(state, slotId)) { stopBlocked(job, 'missing-item', context); break }
      state.player.mana -= BALANCE.research.manaCostPerItem
      const xp = getResearchXp(job.itemId, job.targetSchoolId)
      const levels = grantSchoolXp(state, job.targetSchoolId, xp)
      context.report?.recordResearch(job.itemId, job.targetSchoolId, xp)
      job.remainingQuantity -= 1
      job.progressMs -= BALANCE.research.durationPerItemMs
      if (levels.after > levels.before) pushNotification(state, `${SCHOOLS[job.targetSchoolId].name} reached Level ${levels.after}`, 'success')
      unlockSchoolSpell(state, job.targetSchoolId, levels.after)
      if (job.remainingQuantity <= 0) { research.slots[slotId] = null; break }
    }

    const current = research.slots[slotId]
    if (!current) continue
    if (current.status !== 'waiting-mana' && current.status !== 'level-cap' && current.status !== 'protected' && current.status !== 'missing-item') current.status = current.echoesAssigned > 0 ? 'running' : 'prepared'
  }
  return state
}
