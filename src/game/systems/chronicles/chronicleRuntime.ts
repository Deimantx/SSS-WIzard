import { CHRONICLE_OBJECTIVES, CHRONICLE_OBJECTIVE_BY_ID, type ChronicleCondition, type ChronicleReward } from '../../content/chronicles/chronicles'
import { STARTING_SCHOOL_CONFIG } from '../../content/onboarding/startingSchool'
import { grantItem } from '../inventory/itemAcquisition'
import { grantArcanePoints } from '../arcaneCore/arcaneCoreProgression'
import { getArtifactTotalInvestedRanks } from '../artifacts/artifactProgression'
import { pushNotification } from '../../engine'
import type { ChronicleEventId, ChronicleObjectiveId, GameState, GuildRankId } from '../../types'

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

const prerequisitesComplete = (state: GameState, objective: (typeof CHRONICLE_OBJECTIVES)[number]) => {
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
      if (!prerequisitesComplete(state, objective)) continue
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

export const getChronicleMainObjective = (state: GameState) => CHRONICLE_OBJECTIVES.find((objective) => objective.track === 'main' && !isChronicleObjectiveComplete(state, objective.id)) ?? null

export const getChronicleDisplayObjectives = (state: GameState) => CHRONICLE_OBJECTIVES.filter((objective) => isChronicleObjectiveComplete(state, objective.id) || prerequisitesComplete(state, objective))
