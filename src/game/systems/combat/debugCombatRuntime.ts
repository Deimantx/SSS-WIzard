import { DUNGEONS, chooseMonster } from '../../content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { DungeonId, GameState, ItemId, MonsterId } from '../../types'
import type { CombatEventSink } from './combatTypes'
import { advanceCombatState, type AdvanceContext } from '../simulation/advanceGameState'
import { finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { resetEnemyActionRuntime } from './actionRuntime'
import { resetCombatRuleRuntime } from './triggerRuntime'

export interface DebugCombatRuntimeContext {
  uiEvents?: CombatEventSink
  onItemAcquired?: (itemId: ItemId, quantity: number) => void
}

const resetEncounterWithoutRewards = (state: GameState) => {
  state.combat.enemyId = null
  state.combat.enemyHp = 0
  state.combat.enemyMaxHp = 0
  state.combat.enemyBarrier = 0
  state.combat.enemyBarrierRemainingMs = null
  state.combat.encounterTimerMs = 0
  state.combat.enemyStatuses = []
  state.combat.autoCastManaStarvedSpells = []
  state.combat.inBossFight = false
  resetCombatRuleRuntime(state)
  resetEnemyActionRuntime(state)
}

export const despawnEnemyForDebug = (state: GameState) => {
  if (!state.combat.enemyId) return false
  resetEncounterWithoutRewards(state)
  return true
}

export const forceKillEnemyForDebug = (state: GameState, context: DebugCombatRuntimeContext = {}) => {
  if (!state.combat.enemyId) return false
  state.combat.enemyHp = 0
  return resolveCombatDeaths(state, undefined, context.onItemAcquired, context.uiEvents, { forceEnemyDeath: true })
}

const ensureDungeon = (state: GameState, dungeonId: DungeonId) => {
  state.combat.active = true
  state.combat.dungeonId = dungeonId
}

export interface FastResolveResult { resolved: number; bossReady: boolean }

export const fastResolveNormalEnemiesForDebug = (
  state: GameState,
  requested: number,
  dungeonId: DungeonId = state.combat.dungeonId ?? 'whispering-woods',
  stopAtBossReady = true,
  context: DebugCombatRuntimeContext = {},
): FastResolveResult => {
  const dungeon = DUNGEONS[dungeonId]
  if (!dungeon) return { resolved: 0, bossReady: false }
  ensureDungeon(state, dungeonId)
  const count = Math.min(1000, Math.max(0, Number.isFinite(requested) ? Math.floor(requested) : 0))
  let resolved = 0
  while (resolved < count) {
    if (stopAtBossReady && state.combat.threatCleared >= dungeon.threatRequired) break
    if (state.combat.enemyId) {
      // Never turn an active boss into a synthetic normal kill.
      if (isBossMonster(MONSTERS[state.combat.enemyId])) break
      resetEncounterWithoutRewards(state)
    }
    const enemyId = chooseMonster(dungeon.monsterPool)
    spawnEnemy(state, enemyId, context.uiEvents)
    state.combat.enemyHp = 0
    if (!resolveCombatDeaths(state, undefined, context.onItemAcquired, context.uiEvents, { forceEnemyDeath: true })) break
    resolved += 1
  }
  return { resolved, bossReady: state.combat.threatCleared >= dungeon.threatRequired }
}

export const clearToBossForDebug = (state: GameState, dungeonId: DungeonId, context: DebugCombatRuntimeContext = {}) => {
  const dungeon = DUNGEONS[dungeonId]
  if (!dungeon) return { resolved: 0, bossReady: false }
  const remaining = Math.max(0, dungeon.threatRequired - state.combat.threatCleared)
  return fastResolveNormalEnemiesForDebug(state, remaining, dungeonId, true, context)
}

export const jumpToBossForDebug = (state: GameState, dungeonId: DungeonId, context: DebugCombatRuntimeContext = {}) => {
  const dungeon = DUNGEONS[dungeonId]
  if (!dungeon) return false
  ensureDungeon(state, dungeonId)
  despawnEnemyForDebug(state)
  state.combat.threatCleared = Math.max(state.combat.threatCleared, dungeon.threatRequired)
  state.combat.pendingBossId = null
  spawnEnemy(state, dungeon.boss, context.uiEvents)
  return true
}

export const restartBossForDebug = (state: GameState, context: DebugCombatRuntimeContext = {}) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  if (!dungeon) return false
  const bossId = state.combat.enemyId && isBossMonster(MONSTERS[state.combat.enemyId]) ? state.combat.enemyId : dungeon.boss
  ensureDungeon(state, dungeon.id)
  despawnEnemyForDebug(state)
  state.combat.threatCleared = Math.max(state.combat.threatCleared, dungeon.threatRequired)
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
export { finishEnemy }
