import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS, chooseMonster } from '../../content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../content/monsters/whisperingWoods'
import { recalculateDerivedStats, appendLog, pushNotification } from '../../engine'
import type { GameState, ItemId, MonsterId } from '../../types'
import { executeCombatEffects, damageEnemy, damagePlayer, gainBarrier } from './effectResolver'
import { gainBarrier as gainBarrierRuntime } from './barrierRuntime'
import { applyStatus, clearStatuses } from './statusRuntime'
import { resetCombatRuleRuntime, runCombatTriggers } from './triggerRuntime'
import type { StatusId } from './combatTypes'
import { resolveBasicAttackInterval } from './effectResolver'
import { initializeEnemyActionRuntime, resetEnemyActionRuntime, scheduleEnemyRecovery } from './actionRuntime'
import { resolveMonsterLoot } from '../loot'
import { discoverMonster } from '../collection/discovery'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'

export { applyStatus, clearStatuses, damageEnemy, damagePlayer, executeCombatEffects, gainBarrier, resolveBasicAttackInterval }

export const applyBarrier = (state: GameState, amount: number) => gainBarrierRuntime(state, amount, { actor: 'player', kind: 'spell', sourceId: 'legacy-barrier', tags: ['barrier'] }, 'player', ['barrier'], { mode: 'replace', durationMs: 9000 })

export const debugApplyStatus = (state: GameState, actor: 'player' | 'enemy', statusId: StatusId, durationMs?: number | null, stacks?: number) => applyStatus(state, actor, statusId, { actor, kind: 'system', sourceId: 'developer-tools', tags: ['status'] }, { durationMs, stacks })

export const spawnEnemy = (state: GameState, enemyId: MonsterId) => {
  const monster = MONSTERS[enemyId]
  state.combat.enemyId = enemyId
  state.combat.enemyHp = monster.maxHealth
  state.combat.enemyMaxHp = monster.maxHealth
  state.combat.enemyBarrier = 0
  state.combat.enemyBarrierRemainingMs = null
  initializeEnemyActionRuntime(state)
  resetCombatRuleRuntime(state)
  state.combat.inBossFight = isBossMonster(monster)
  state.combat.playerAttackTimerMs = 0
  state.combat.enemyStatuses = []
  discoverMonster(state, enemyId)
  runCombatTriggers(state, 'enemy', 'on-combat-start', { source: { actor: 'enemy', kind: 'system', sourceId: 'combat-start' } }, executeCombatEffects)
  runCombatTriggers(state, 'player', 'on-combat-start', { source: { actor: 'player', kind: 'system', sourceId: 'combat-start' }, eventTarget: 'enemy' }, executeCombatEffects)
  scheduleEnemyRecovery(state, monster.actionIntervalMs)
  appendLog(state, `${monster.name} enters the clearing.`)
}

export const spawnNextEnemy = (state: GameState) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  if (state.combat.pendingBossId) {
    const boss = state.combat.pendingBossId
    state.combat.pendingBossId = null
    spawnEnemy(state, boss)
    pushNotification(state, `${MONSTERS[boss].name} arrives via Auto Hunt`, 'warning')
    return
  }
  spawnEnemy(state, chooseMonster(dungeon.monsterPool))
}

export const finishEnemy = (state: GameState, report?: SimulationReportCollector, onItemAcquired?: (itemId: ItemId, quantity: number) => void) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const drops = resolveMonsterLoot(state, enemyId, (itemId, quantity) => { onItemAcquired?.(itemId, quantity); report?.recordLoot(itemId, quantity) })
  report?.recordKill(enemyId)
  state.combat.enemyId = null
  state.combat.enemyHp = 0
  state.combat.enemyBarrier = 0
  state.combat.enemyBarrierRemainingMs = null
  resetEnemyActionRuntime(state)
  state.combat.enemyStatuses = []
  resetCombatRuleRuntime(state)
  state.combat.encounterTimerMs = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods'].encounterDelayMs
  if (isBossMonster(monster)) {
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    const bossId = enemyId as 'grove-sentinel' | 'forest-heart'
    state.progress.bossKillsByBoss[bossId] = (state.progress.bossKillsByBoss[bossId] ?? 0) + 1
    if (bossId === 'grove-sentinel') state.progress.requestProgress['sentinel-breaker'] = state.progress.bossKillsByBoss[bossId]
    if (bossId === 'grove-sentinel') state.progress.autoHuntBossUnlocked = true
    if (bossId === 'grove-sentinel' && !state.progress.firstBossKill) {
      state.progress.firstBossKill = true
      state.progress.guildUnlocked = true
      state.progress.guildRank = 'initiate'
      state.progress.emberStaffUnlocked = true
      state.progress.forestHeartUnlocked = true
      pushNotification(state, 'Grove Sentinel defeated · Guild unlocked', 'success')
      pushNotification(state, 'Four equipment recipes are now available', 'success')
    }
    if (bossId === 'forest-heart' && !state.progress.firstMainBossKill) {
      state.progress.firstMainBossKill = true
      state.progress.magicLevelCap = BALANCE.mainBoss.firstBossMagicLevelCap
      if (!state.progress.permanentFocusBonuses['forest-heart']) state.progress.permanentFocusBonuses['forest-heart'] = BALANCE.focus.forestHeartBonus
      recalculateDerivedStats(state)
      pushNotification(state, 'Magic School cap increased to 20', 'success')
      pushNotification(state, 'FIRST CHAPTER COMPLETE · +10 permanent Focus', 'success')
    }
    report?.recordNotable(`${monster.name} defeated`)
    appendLog(state, `${monster.name} defeated${drops ? ` · ${drops}` : ''}. Threat Cleared resets.`)
  } else {
    state.progress.lifetimeKills += 1
    state.progress.lifetimeKillsByMonster[enemyId] = (state.progress.lifetimeKillsByMonster[enemyId] ?? 0) + 1
    state.combat.threatCleared += 1
    state.progress.requestProgress['clear-the-woods'] = state.progress.lifetimeKills
    appendLog(state, `${monster.name} defeated${drops ? ` · ${drops}` : ''}`)
    if (state.combat.threatCleared === DUNGEONS['whispering-woods'].threatRequired) pushNotification(state, 'Grove Sentinel is ready', 'success')
    if (state.progress.autoHuntBossByDungeon['whispering-woods'] && state.combat.threatCleared >= DUNGEONS['whispering-woods'].threatRequired) {
      state.combat.pendingBossId = 'grove-sentinel'
      pushNotification(state, 'Auto Hunt Boss queued Grove Sentinel', 'info')
    }
  }
}

export const resolveCombatDeaths = (state: GameState, report?: SimulationReportCollector, onItemAcquired?: (itemId: ItemId, quantity: number) => void) => {
  if (state.player.health <= 0 && !state.player.godMode) {
    report?.recordPlayerDeath()
    state.combat.active = false
    state.combat.enemyId = null
    state.combat.enemyHp = 0
    state.combat.enemyBarrier = 0
    state.combat.enemyBarrierRemainingMs = null
    resetEnemyActionRuntime(state)
    state.combat.playerBarrier = 0
    state.combat.playerBarrierRemainingMs = null
    state.combat.playerStatuses = []
    state.combat.enemyStatuses = []
    resetCombatRuleRuntime(state)
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    pushNotification(state, 'Defeated · recovering in the Tower', 'warning')
    appendLog(state, 'The wizard falls. Threat Cleared resets to 0.')
    return true
  }
  if (state.combat.enemyId && state.combat.enemyHp <= 0) {
    finishEnemy(state, report, onItemAcquired)
    return true
  }
  return false
}
