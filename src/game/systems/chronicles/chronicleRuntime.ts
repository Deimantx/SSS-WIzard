import { CHRONICLE_OBJECTIVES, CHRONICLE_OBJECTIVE_BY_ID, type ChronicleCondition, type ChronicleReward } from '../../content/chronicles/chronicles'
import { STARTING_SCHOOL_CONFIG } from '../../content/onboarding/startingSchool'
import { grantItem } from '../inventory/itemAcquisition'
import { grantArcanePoints } from '../arcaneCore/arcaneCoreProgression'
import { getArtifactTotalInvestedRanks } from '../artifacts/artifactProgression'
import { pushNotification } from '../../engine'
import type { ChronicleChapterId, ChronicleEventId, ChronicleObjectiveId, GameState, GuildRankId } from '../../types'

export const createInitialChronicleProgress = () => ({ completedObjectiveIds: [], grantedUnlockRewardIds: [], eventFlags: {} }) satisfies GameState['progress']['chronicle']

const rankOrder: GuildRankId[] = ['outsider', 'initiate', 'apprentice', 'adept', 'magister', 'circle-master']
const safeCount = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
const hasAutoCast = (state: GameState) => Object.values(state.activities.autoCast).some(Boolean) || state.spellPresets.presets.some((preset) => preset.slots.some((slot) => slot.autoCast))
const selectedStartingArtifact = (state: GameState) => state.progress.startingSchoolId ? STARTING_SCHOOL_CONFIG[state.progress.startingSchoolId].artifactId : null
const activeSpellSlotCount = (state: GameState) => {
  const selected = state.spellPresets.presets.find((preset) => preset.id === state.spellPresets.selectedPresetId)
  return selected?.slots.filter((slot) => Boolean(slot.spellId)).length ?? state.combat.activeSpellLoadout?.slots.filter((slot) => Boolean(slot.spellId)).length ?? 0
}
const hasCompletedGuildRequests = (state: GameState) => Object.values(state.progress.requestClaims).filter(Boolean).length
const isRankAtLeast = (current: GuildRankId, required: GuildRankId) => rankOrder.indexOf(current) >= rankOrder.indexOf(required)

export interface ChronicleConditionValue {
  current: number
  target: number
}

export const getChronicleConditionValue = (state: GameState, condition: ChronicleCondition): ChronicleConditionValue => {
  switch (condition.type) {
    case 'starting-school-selected': return { current: state.progress.startingSchoolId ? 1 : 0, target: 1 }
    case 'lifetime-kills': return { current: safeCount(state.progress.lifetimeKills), target: condition.count }
    case 'boss-kill': return { current: safeCount(state.progress.bossKillsByBoss[condition.bossId]), target: condition.count }
    case 'dungeon-entered': return { current: state.ui.lastEnteredCombatDungeonId === condition.dungeonId || state.combat.dungeonId === condition.dungeonId ? 1 : 0, target: 1 }
    case 'auto-cast-enabled': return { current: hasAutoCast(state) ? 1 : 0, target: 1 }
    case 'channeling-acolytes': return { current: safeCount(state.activities.channeling.acolytesAssigned), target: condition.count }
    case 'chronicle-event': return { current: state.progress.chronicle.eventFlags[condition.eventId] ? 1 : 0, target: 1 }
    case 'school-level': return { current: state.progress.startingSchoolId ? safeCount(state.schools[state.progress.startingSchoolId].level) : 0, target: condition.level }
    case 'artifact-invested-ranks': {
      const artifactId = selectedStartingArtifact(state)
      return { current: artifactId ? getArtifactTotalInvestedRanks(state, artifactId) : 0, target: condition.ranks }
    }
    case 'guild-request-claimed': return { current: hasCompletedGuildRequests(state), target: condition.count }
    case 'guild-rank': return { current: Math.max(0, rankOrder.indexOf(state.progress.guildRank)), target: Math.max(0, rankOrder.indexOf(condition.rank)) }
    case 'guardian-selected': return { current: state.guardians.selectedGuardianId ? 1 : 0, target: 1 }
    case 'guardian-combat-completed': return { current: state.progress.chronicle.eventFlags['first-guardian-combat-completed'] ? 1 : 0, target: 1 }
    case 'crystal-equipped': return { current: state.crystals.equippedSlots.filter(Boolean).length, target: condition.count }
    case 'arcane-core-invested-nodes': return { current: Object.values(state.arcaneCore.nodes).filter((node) => node && safeCount(node.rank) > 0).length, target: condition.count }
    case 'spell-loadout-slots': return { current: activeSpellSlotCount(state), target: condition.count }
    case 'world-tier-kill': return { current: state.progress.chronicle.eventFlags['first-wt2-kill'] ? 1 : 0, target: condition.count }
  }
}

export const evaluateChronicleCondition = (state: GameState, condition: ChronicleCondition): boolean => {
  switch (condition.type) {
    case 'starting-school-selected': return state.progress.startingSchoolId !== null
    case 'lifetime-kills': return safeCount(state.progress.lifetimeKills) >= condition.count
    case 'boss-kill': return safeCount(state.progress.bossKillsByBoss[condition.bossId]) >= condition.count
    case 'dungeon-entered': return state.combat.active && (state.ui.lastEnteredCombatDungeonId === condition.dungeonId || state.combat.dungeonId === condition.dungeonId)
    case 'auto-cast-enabled': return hasAutoCast(state)
    case 'channeling-acolytes': return safeCount(state.activities.channeling.acolytesAssigned) >= condition.count
    case 'chronicle-event': return state.progress.chronicle.eventFlags[condition.eventId] === true
    case 'school-level': return condition.school === 'starting' && Boolean(state.progress.startingSchoolId) && state.schools[state.progress.startingSchoolId!].level >= condition.level
    case 'artifact-invested-ranks': {
      const artifactId = selectedStartingArtifact(state)
      return condition.artifact === 'starting' && artifactId !== null && getArtifactTotalInvestedRanks(state, artifactId) >= condition.ranks
    }
    case 'guild-request-claimed': return hasCompletedGuildRequests(state) >= condition.count
    case 'guild-rank': return isRankAtLeast(state.progress.guildRank, condition.rank)
    case 'guardian-selected': return state.guardians.selectedGuardianId !== null
    case 'guardian-combat-completed': return state.progress.chronicle.eventFlags['first-guardian-combat-completed'] === true
    case 'crystal-equipped': return state.crystals.equippedSlots.filter(Boolean).length >= condition.count
    case 'arcane-core-invested-nodes': return Object.values(state.arcaneCore.nodes).filter((node) => node && safeCount(node.rank) > 0).length >= condition.count
    case 'spell-loadout-slots': return activeSpellSlotCount(state) >= condition.count
    case 'world-tier-kill': return condition.tier === 2 && condition.count <= 1 && state.progress.chronicle.eventFlags['first-wt2-kill'] === true
  }
}

export const isChronicleObjectiveUnlocked = (state: GameState, objective: (typeof CHRONICLE_OBJECTIVES)[number]) => {
  const completed = new Set(state.progress.chronicle.completedObjectiveIds)
  const all = objective.prerequisiteIds?.every((id) => completed.has(id)) ?? true
  const any = objective.unlockAnyPrerequisiteIds ? objective.unlockAnyPrerequisiteIds.some((id) => completed.has(id)) : true
  return all && any && (!objective.unlockCondition || evaluateChronicleCondition(state, objective.unlockCondition))
}

const grantChronicleReward = (state: GameState, reward: ChronicleReward) => {
  if (reward.type === 'item') grantItem(state, reward.itemId, reward.quantity)
  else if (reward.type === 'crystal') state.crystals.owned[reward.variantId] = Math.max(0, state.crystals.owned[reward.variantId] ?? 0) + Math.max(0, Math.floor(reward.quantity))
  else {
    const result = grantArcanePoints(state.arcaneCore, reward.amount)
    state.arcaneCore = result.state
  }
}

export interface ChronicleReconciliationResult {
  newlyUnlocked: ChronicleObjectiveId[]
  newlyCompleted: ChronicleObjectiveId[]
}

export const reconcileChronicleProgress = (state: GameState, options: { notify?: boolean } = {}): ChronicleReconciliationResult => {
  const chronicle = state.progress.chronicle ?? (state.progress.chronicle = createInitialChronicleProgress())
  const validIds = new Set(CHRONICLE_OBJECTIVES.map((objective) => objective.id))
  chronicle.completedObjectiveIds = [...new Set(chronicle.completedObjectiveIds.filter((id) => validIds.has(id)))]
  chronicle.grantedUnlockRewardIds = [...new Set(chronicle.grantedUnlockRewardIds.filter((id) => validIds.has(id)))]
  const newlyUnlocked: ChronicleObjectiveId[] = []
  const newlyCompleted: ChronicleObjectiveId[] = []
  let changed = true
  while (changed) {
    changed = false
    for (const objective of CHRONICLE_OBJECTIVES) {
      if (!isChronicleObjectiveUnlocked(state, objective)) continue
      if (objective.onUnlockReward?.length && !chronicle.grantedUnlockRewardIds.includes(objective.id)) {
        chronicle.grantedUnlockRewardIds.push(objective.id)
        newlyUnlocked.push(objective.id)
        objective.onUnlockReward.forEach((reward) => grantChronicleReward(state, reward))
        changed = true
      }
      if (chronicle.completedObjectiveIds.includes(objective.id) || !evaluateChronicleCondition(state, objective.condition)) continue
      chronicle.completedObjectiveIds.push(objective.id)
      newlyCompleted.push(objective.id)
      objective.onCompleteReward?.forEach((reward) => grantChronicleReward(state, reward))
      changed = true
    }
  }
  if (options.notify !== false) newlyCompleted.forEach((id) => pushNotification(state, `Chronicle complete: ${CHRONICLE_OBJECTIVE_BY_ID[id].title}`, 'success', { key: `chronicle-complete:${id}`, cooldownMs: 1000 }))
  return { newlyUnlocked, newlyCompleted }
}

export const recordChronicleEvent = (state: GameState, eventId: ChronicleEventId) => {
  state.progress.chronicle.eventFlags[eventId] = true
  return reconcileChronicleProgress(state)
}

export const isChronicleObjectiveComplete = (state: GameState, objectiveId: ChronicleObjectiveId) => state.progress.chronicle.completedObjectiveIds.includes(objectiveId)
export const isChronicleChapterComplete = (state: GameState, chapterId: 'first-frontier' | 'shattered-frontier') => CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId && objective.track === 'main').every((objective) => isChronicleObjectiveComplete(state, objective.id))

export type ChronicleObjectiveStatus = 'completed' | 'current' | 'available' | 'locked'

export const getChronicleMainObjective = (state: GameState, chapterId?: 'first-frontier' | 'shattered-frontier') => CHRONICLE_OBJECTIVES.find((objective) => objective.track === 'main' && (!chapterId || objective.chapterId === chapterId) && !isChronicleObjectiveComplete(state, objective.id)) ?? null

export const getChronicleObjectiveStatus = (state: GameState, objective: (typeof CHRONICLE_OBJECTIVES)[number]): ChronicleObjectiveStatus => {
  if (isChronicleObjectiveComplete(state, objective.id)) return 'completed'
  if (!isChronicleObjectiveUnlocked(state, objective)) return 'locked'
  const main = getChronicleMainObjective(state, objective.chapterId)
  return objective.track === 'main' && main?.id === objective.id ? 'current' : 'available'
}

export const getChronicleActiveChapter = (state: GameState) => getChronicleMainObjective(state)?.chapterId ?? 'first-frontier'

export const isChronicleChapterAvailable = (state: GameState, chapterId: 'first-frontier' | 'shattered-frontier') => chapterId === 'first-frontier' || CHRONICLE_OBJECTIVES.some((objective) => objective.chapterId === chapterId && (isChronicleObjectiveComplete(state, objective.id) || isChronicleObjectiveUnlocked(state, objective)))

export const getChronicleChapterProgress = (state: GameState, chapterId: 'first-frontier' | 'shattered-frontier') => {
  const objectives = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId)
  const completed = objectives.filter((objective) => isChronicleObjectiveComplete(state, objective.id)).length
  return { completed, total: objectives.length, percent: objectives.length ? Math.round(completed / objectives.length * 100) : 0 }
}

export const getChronicleTrackProgress = (state: GameState, chapterId: 'first-frontier' | 'shattered-frontier', track: 'main' | 'combat' | 'magic' | 'tower') => {
  const objectives = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId && objective.track === track)
  const completed = objectives.filter((objective) => isChronicleObjectiveComplete(state, objective.id)).length
  return { completed, total: objectives.length, percent: objectives.length ? Math.round(completed / objectives.length * 100) : 0 }
}

export const getChronicleOverviewObjectives = (state: GameState) => {
  const chapterId = getChronicleActiveChapter(state)
  const objectives = CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId && !isChronicleObjectiveComplete(state, objective.id) && isChronicleObjectiveUnlocked(state, objective))
  return objectives.sort((a, b) => {
    const aStatus = getChronicleObjectiveStatus(state, a)
    const bStatus = getChronicleObjectiveStatus(state, b)
    if (aStatus === 'current' && bStatus !== 'current') return -1
    if (bStatus === 'current' && aStatus !== 'current') return 1
    if (a.track === 'main' && b.track !== 'main') return -1
    if (b.track === 'main' && a.track !== 'main') return 1
    return CHRONICLE_OBJECTIVES.indexOf(a) - CHRONICLE_OBJECTIVES.indexOf(b)
  }).slice(0, 3)
}

export const getChronicleDisplayObjectives = (state: GameState) => CHRONICLE_OBJECTIVES.filter((objective) => isChronicleObjectiveComplete(state, objective.id) || isChronicleObjectiveUnlocked(state, objective))

const debugCompleteObjective = (state: GameState, objectiveId: ChronicleObjectiveId) => {
  const chronicle = state.progress.chronicle
  if (chronicle.completedObjectiveIds.includes(objectiveId)) return false
  const objective = CHRONICLE_OBJECTIVE_BY_ID[objectiveId]
  objective.onCompleteReward?.forEach((reward) => grantChronicleReward(state, reward))
  chronicle.completedObjectiveIds.push(objectiveId)
  return true
}

const debugCompleteWithPrerequisites = (state: GameState, objectiveId: ChronicleObjectiveId): ChronicleObjectiveId[] => {
  const objective = CHRONICLE_OBJECTIVE_BY_ID[objectiveId]
  if (!objective) return []
  const changed: ChronicleObjectiveId[] = []
  for (const prerequisiteId of objective.prerequisiteIds ?? []) changed.push(...debugCompleteWithPrerequisites(state, prerequisiteId))
  for (const prerequisiteId of objective.unlockAnyPrerequisiteIds ?? []) if (!objective.prerequisiteIds?.length) changed.push(...debugCompleteWithPrerequisites(state, prerequisiteId))
  if (debugCompleteObjective(state, objectiveId)) changed.push(objectiveId)
  return changed
}

export const debugCompleteChronicleObjective = (state: GameState, objectiveId: ChronicleObjectiveId) => debugCompleteWithPrerequisites(state, objectiveId)

export const debugCompleteChroniclePrerequisites = (state: GameState, objectiveId: ChronicleObjectiveId): ChronicleObjectiveId[] => {
  const objective = CHRONICLE_OBJECTIVE_BY_ID[objectiveId]
  if (!objective) return []
  const changed: ChronicleObjectiveId[] = []
  for (const prerequisiteId of [...(objective.prerequisiteIds ?? []), ...(objective.unlockAnyPrerequisiteIds ?? [])]) changed.push(...debugCompleteWithPrerequisites(state, prerequisiteId))
  return changed
}

export const debugCompleteChronicleChapter = (state: GameState, chapterId: ChronicleChapterId) => {
  const changed: ChronicleObjectiveId[] = []
  for (const objective of CHRONICLE_OBJECTIVES.filter((entry) => entry.chapterId === chapterId)) changed.push(...debugCompleteChronicleObjective(state, objective.id))
  return [...new Set(changed)]
}

const resetEventFlagsForChapter = (state: GameState, chapterId: ChronicleChapterId) => {
  const eventIds = new Set(CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId).flatMap((objective) => objective.condition.type === 'chronicle-event' ? [objective.condition.eventId] : objective.condition.type === 'guardian-combat-completed' ? ['first-guardian-combat-completed' as ChronicleEventId] : []))
  eventIds.forEach((eventId) => { delete state.progress.chronicle.eventFlags[eventId] })
}

export const debugResetChronicleChapter = (state: GameState, chapterId: ChronicleChapterId) => {
  const chapterIds = new Set(CHRONICLE_OBJECTIVES.filter((objective) => objective.chapterId === chapterId).map((objective) => objective.id))
  state.progress.chronicle.completedObjectiveIds = state.progress.chronicle.completedObjectiveIds.filter((id) => !chapterIds.has(id))
  resetEventFlagsForChapter(state, chapterId)
}

export const debugResetAllChronicles = (state: GameState) => {
  state.progress.chronicle.completedObjectiveIds = []
  state.progress.chronicle.eventFlags = {}
  // Granted gameplay rewards are intentionally retained: reset cannot safely remove
  // items, crystals, or Arcane Points that may already be spent elsewhere.
}
