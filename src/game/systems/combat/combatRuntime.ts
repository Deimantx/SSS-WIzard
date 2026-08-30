import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS, chooseMonster } from '../../content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../content/monsters'
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
  appendLog(state, `${monster.name} enters the dungeon.`)
}

export const spawnNextEnemy = (state: GameState) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  if (state.combat.pendingBossId) {
    const boss = state.combat.pendingBossId
    state.combat.pendingBossId = null
    if (MONSTERS[boss]) {
      spawnEnemy(state, boss)
      pushNotification(state, `${MONSTERS[boss].name} arrives via Auto Hunt`, 'warning')
      return
    }
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
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  state.combat.encounterTimerMs = dungeon.encounterDelayMs
  if (isBossMonster(monster)) {
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    const bossId = enemyId
    state.progress.bossKillsByBoss[bossId] = (state.progress.bossKillsByBoss[bossId] ?? 0) + 1
    if (state.combat.pendingBossId === enemyId) state.combat.pendingBossId = null
    state.progress.autoHuntBossUnlocked = true
    if (bossId === 'forest-heart' && !state.progress.firstBossKill) {
      state.progress.firstBossKill = true
      state.progress.guildUnlocked = true
      state.progress.guildRank = 'initiate'
      state.progress.emberStaffUnlocked = true
      state.progress.forestHeartUnlocked = true
      pushNotification(state, 'Forest Heart defeated - Guild unlocked', 'success')
      pushNotification(state, 'Four equipment recipes are now available', 'success')
    }
    if (bossId === 'forest-heart' && !state.progress.permanentFocusBonuses['forest-heart']) {
      state.progress.permanentFocusBonuses['forest-heart'] = BALANCE.focus.forestHeartBonus
      recalculateDerivedStats(state)
      pushNotification(state, 'WHISPERING WOODS COMPLETE / Howling Den unlocked.', 'success')
    }
    if (bossId === 'corrupted-greatbear' && state.progress.bossKillsByBoss[bossId] === 1) pushNotification(state, 'HOWLING DEN COMPLETE / Abandoned Catacombs unlocked.', 'success')
    if (bossId === 'archmage-edrin-shade' && state.progress.bossKillsByBoss[bossId] === 1) {
      pushNotification(state, 'FIRST CHAPTER COMPLETE', 'success')
      if (state.progress.magicLevelCap < BALANCE.schoolProgression.tutorialCompleteCap) {
        state.progress.magicLevelCap = Math.max(state.progress.magicLevelCap, BALANCE.schoolProgression.tutorialCompleteCap)
        pushNotification(state, `Magic School cap increased to ${state.progress.magicLevelCap}`, 'success')
      }
    }
    report?.recordNotable(`${monster.name} defeated`)
    appendLog(state, `${monster.name} defeated${drops ? ` - ${drops}` : ''}. Threat Cleared resets.`)
  } else {
    state.progress.lifetimeKills += 1
    state.progress.lifetimeKillsByMonster[enemyId] = (state.progress.lifetimeKillsByMonster[enemyId] ?? 0) + 1
    state.combat.threatCleared += 1
    if (enemyId === 'grove-sentinel') state.progress.requestProgress['sentinel-breaker'] = Math.max(state.progress.requestProgress['sentinel-breaker'] ?? 0, state.progress.lifetimeKillsByMonster[enemyId])
    if (state.combat.dungeonId === 'whispering-woods') state.progress.requestProgress['clear-the-woods'] = (state.progress.requestProgress['clear-the-woods'] ?? 0) + 1
    appendLog(state, `${monster.name} defeated${drops ? ` - ${drops}` : ''}`)
    if (state.combat.threatCleared === dungeon.threatRequired) pushNotification(state, `${MONSTERS[dungeon.boss].name} is ready`, 'success')
    if (state.progress.autoHuntBossByDungeon[dungeon.id] && state.combat.threatCleared >= dungeon.threatRequired && !state.combat.pendingBossId) {
      state.combat.pendingBossId = dungeon.boss
      pushNotification(state, `Auto Hunt Boss queued ${MONSTERS[dungeon.boss].name}`, 'info')
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
    Object.keys(state.combat.spellCooldowns).forEach((spellId) => { delete state.combat.spellCooldowns[spellId as keyof typeof state.combat.spellCooldowns] })
    state.combat.pendingBossId = null
    resetCombatRuleRuntime(state)
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    pushNotification(state, 'Defeated - recovering in the Tower', 'warning')
    appendLog(state, 'The wizard falls. Threat Cleared resets to 0.')
    return true
  }
  if (state.combat.enemyId && state.combat.enemyHp <= 0) {
    finishEnemy(state, report, onItemAcquired)
    return true
  }
  return false
}
