import { COMBAT_LOCATIONS, hasBossEncounter } from '../../content/combat-locations/worldNavigation'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { getCombatEncounterMode, getCombatLocationById, isCombatTargetForLocation } from '../../content/combat-locations'
import type { CombatLocationId, GameState, ItemId, MonsterId } from '../../types'
import type { CombatEventSink } from './combatTypes'
import { advanceCombatState, type AdvanceContext } from '../simulation/advanceGameState'
import { abandonCurrentEncounter, finishEnemy, resolveCombatDeaths, spawnEnemy, spawnNextEnemy, type CombatLootObserver } from './combatRuntime'
import { resolveBossThreatRequirement } from './combatThreat'

export interface DebugCombatRuntimeContext {
  uiEvents?: CombatEventSink
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
  onCombatLoot?: CombatLootObserver
}

const resetEncounterWithoutRewards = (state: GameState) => {
  abandonCurrentEncounter(state)
}

export const despawnEnemyForDebug = (state: GameState) => {
  if (!state.combat.enemyId) return false
  resetEncounterWithoutRewards(state)
  return true
}

export const forceKillEnemyForDebug = (state: GameState, context: DebugCombatRuntimeContext = {}) => {
  if (!state.combat.enemyId) return false
  state.combat.enemyHp = 0
  return resolveCombatDeaths(state, undefined, context.onItemAcquired, context.uiEvents, { forceEnemyDeath: true, onLootResolved: context.onCombatLoot })
}

const ensureDungeon = (state: GameState, locationId: CombatLocationId) => {
  state.combat.active = true
  state.combat.locationId = locationId
}

export interface FastResolveResult { resolved: number; bossReady: boolean }

export const fastResolveNormalEnemiesForDebug = (
  state: GameState,
  requested: number,
  locationId: CombatLocationId = state.combat.locationId ?? 'whispering-woods',
  stopAtBossReady = true,
  context: DebugCombatRuntimeContext = {},
): FastResolveResult => {
  const dungeon = COMBAT_LOCATIONS[locationId]
  if (!dungeon) return { resolved: 0, bossReady: false }
  if (!hasBossEncounter(dungeon)) {
    ensureDungeon(state, locationId)
    const result = fastResolveBosslessNormalEnemies(state, requested, locationId, context)
    return { resolved: result, bossReady: false }
  }
  ensureDungeon(state, locationId)
  const threatRequired = resolveBossThreatRequirement(dungeon.id)
  const count = Math.min(1000, Math.max(0, Number.isFinite(requested) ? Math.floor(requested) : 0))
  let resolved = 0
  const sequenceDungeon = getCombatEncounterMode(getCombatLocationById(locationId)) === 'sequence'
  const location = getCombatLocationById(locationId)
  if (!sequenceDungeon && !isCombatTargetForLocation(location, locationId, state.combat.targetEnemyId)) {
    state.combat.targetEnemyId = dungeon.monsterPool.find((monsterId) => isCombatTargetForLocation(location, locationId, monsterId)) ?? null
  }
  while (resolved < count) {
    if (!state.combat.active) break
    if (!sequenceDungeon && stopAtBossReady && state.combat.threatCleared >= threatRequired) break
    if (state.combat.enemyId) {
      // Never turn an active boss into a synthetic normal kill.
      if (isBossMonster(MONSTERS[state.combat.enemyId])) break
      resetEncounterWithoutRewards(state)
    }
    spawnNextEnemy(state, context.uiEvents)
    state.combat.enemyHp = 0
    if (!resolveCombatDeaths(state, undefined, context.onItemAcquired, context.uiEvents, { forceEnemyDeath: true, onLootResolved: context.onCombatLoot })) break
    resolved += 1
  }
  return { resolved, bossReady: sequenceDungeon ? (state.combat.sequenceIndex ?? 0) >= (dungeon.encounterSequence?.length ?? 0) : state.combat.threatCleared >= threatRequired }
}

const fastResolveBosslessNormalEnemies = (state: GameState, requested: number, locationId: CombatLocationId, context: DebugCombatRuntimeContext) => {
  const dungeon = COMBAT_LOCATIONS[locationId]
  const count = Math.min(1000, Math.max(0, Number.isFinite(requested) ? Math.floor(requested) : 0))
  let resolved = 0
  while (resolved < count && state.combat.active) {
    if (state.combat.enemyId) { if (isBossMonster(MONSTERS[state.combat.enemyId])) break; resetEncounterWithoutRewards(state) }
    if (!spawnNextEnemy(state, context.uiEvents)) break
    state.combat.enemyHp = 0
    if (!resolveCombatDeaths(state, undefined, context.onItemAcquired, context.uiEvents, { forceEnemyDeath: true, onLootResolved: context.onCombatLoot })) break
    resolved += 1
  }
  return resolved
}

export const clearToBossForDebug = (state: GameState, locationId: CombatLocationId, context: DebugCombatRuntimeContext = {}) => {
  const dungeon = COMBAT_LOCATIONS[locationId]
  if (!dungeon || !hasBossEncounter(dungeon)) return { resolved: 0, bossReady: false }
  if (getCombatEncounterMode(getCombatLocationById(locationId)) === 'sequence') return fastResolveNormalEnemiesForDebug(state, dungeon.encounterSequence?.length ?? 0, locationId, false, context)
  const requirement = resolveBossThreatRequirement(dungeon.id)
  const remaining = Math.max(0, requirement - state.combat.threatCleared)
  return fastResolveNormalEnemiesForDebug(state, remaining, locationId, true, context)
}

export const jumpToBossForDebug = (state: GameState, locationId: CombatLocationId, context: DebugCombatRuntimeContext = {}) => {
  const dungeon = COMBAT_LOCATIONS[locationId]
  if (!dungeon || !hasBossEncounter(dungeon)) return false
  ensureDungeon(state, locationId)
  despawnEnemyForDebug(state)
  if (getCombatEncounterMode(getCombatLocationById(locationId)) === 'sequence') state.combat.sequenceIndex = dungeon.encounterSequence?.length ?? 0
  state.combat.threatCleared = Math.max(state.combat.threatCleared, resolveBossThreatRequirement(dungeon.id))
  state.combat.pendingBossId = null
  spawnEnemy(state, dungeon.boss, context.uiEvents)
  return true
}

export const restartBossForDebug = (state: GameState, context: DebugCombatRuntimeContext = {}) => {
  const dungeon = COMBAT_LOCATIONS[state.combat.locationId ?? 'whispering-woods']
  if (!dungeon || !hasBossEncounter(dungeon)) return false
  const bossId = state.combat.enemyId && isBossMonster(MONSTERS[state.combat.enemyId]) ? state.combat.enemyId : dungeon.boss
  ensureDungeon(state, dungeon.id)
  despawnEnemyForDebug(state)
  if (getCombatEncounterMode(getCombatLocationById(dungeon.id)) === 'sequence') state.combat.sequenceIndex = dungeon.encounterSequence?.length ?? 0
  state.combat.threatCleared = Math.max(state.combat.threatCleared, resolveBossThreatRequirement(dungeon.id))
  state.combat.pendingBossId = null
  spawnEnemy(state, bossId, context.uiEvents)
  return true
}

export const advanceCombatOnlyForDebug = (state: GameState, durationMs: number, context: AdvanceContext) => {
  if (!state.combat.active) return state
  return advanceCombatState(state, Math.max(0, Number.isFinite(durationMs) ? durationMs : 0), context)
}

// Kept as a named helper for callers that explicitly need the normal finish
// implementation while bypassing the runtime immortality guard.
export { finishEnemy, spawnNextEnemy }
