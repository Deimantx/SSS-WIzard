import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS, chooseMonster } from '../../content/dungeons/dungeons'
import { isBossMonster, MONSTERS } from '../../content/monsters/whisperingWoods'
import { recalculateDerivedStats, appendLog, pushNotification } from '../../engine'
import type { GameState, ItemId, MonsterId } from '../../types'
import { formatTime } from '../../utils'
import { executeCombatEffects, damageEnemy, damagePlayer, gainBarrier } from './effectResolver'
import { applyStatus, clearStatuses } from './statusRuntime'
import { runCombatTriggers } from './triggerRuntime'
import type { CombatSource, StatusId } from './combatTypes'
import { resolveBasicAttackInterval } from './effectResolver'
import { resolveMonsterLoot } from '../loot'
import { discoverMonster } from '../collection/discovery'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'

export { applyStatus, clearStatuses, damageEnemy, damagePlayer, executeCombatEffects, gainBarrier, resolveBasicAttackInterval }

export const applyBarrier = (state: GameState, amount: number) => gainBarrier(state, amount, 'player', { actor: 'player', kind: 'spell', sourceId: 'legacy-barrier', tags: ['barrier'] })

export const debugApplyStatus = (state: GameState, actor: 'player' | 'enemy', statusId: StatusId, durationMs?: number | null, stacks?: number) => applyStatus(state, actor, statusId, { actor: actor === 'player' ? 'enemy' : 'player', kind: 'system', sourceId: 'developer-tools', tags: ['status'] }, { durationMs, stacks })

export const spawnEnemy = (state: GameState, enemyId: MonsterId) => {
  const monster = MONSTERS[enemyId]
  state.combat.enemyId = enemyId
  state.combat.enemyHp = monster.maxHealth
  state.combat.enemyMaxHp = monster.maxHealth
  state.combat.enemyBarrier = 0
  state.combat.enemyActionIndex = 0
  state.combat.enemyIntervalMs = monster.attackIntervalMs
  state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs
  state.combat.enemyTelegraphMs = 0
  state.combat.enemyTelegraphActionId = null
  state.combat.triggeredRuleIds = []
  state.combat.inBossFight = isBossMonster(monster)
  state.combat.playerAttackTimerMs = 0
  state.combat.enemyStatuses = []
  discoverMonster(state, enemyId)
  runCombatTriggers(state, 'enemy', 'on-combat-start', { source: { actor: 'enemy', kind: 'system', sourceId: 'combat-start' } }, executeCombatEffects)
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
  state.combat.enemyTelegraphMs = 0
  state.combat.enemyTelegraphActionId = null
  state.combat.enemyStatuses = []
  state.combat.triggeredRuleIds = []
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

export const executeSpecial = (state: GameState, specialId: string) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const special = MONSTERS[enemyId].specialAttacks[specialId]
  if (!special) return
  const source: CombatSource = { actor: 'enemy', kind: 'special-attack', sourceId: special.id, tags: [...(special.tags ?? []), 'special'] }
  executeCombatEffects(state, special.effects, source)
  runCombatTriggers(state, 'enemy', 'on-special-resolve', { source, target: 'player', sourceTags: source.tags }, executeCombatEffects)
  appendLog(state, `${special.name} resolves.`)
}

export const executeEnemyAction = (state: GameState) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const step = monster.actionSequence[state.combat.enemyActionIndex % monster.actionSequence.length]
  state.combat.enemyActionIndex = (state.combat.enemyActionIndex + 1) % monster.actionSequence.length
  if (step.kind === 'special' && step.specialAttackId) {
    const special = monster.specialAttacks[step.specialAttackId]
    if (!special) return
    state.combat.enemyTelegraphMs = special.telegraphMs
    state.combat.enemyTelegraphActionId = step.specialAttackId
    appendLog(state, `${special.name} telegraphed · ${formatTime(special.telegraphMs)}`)
  } else {
    const source: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: `${enemyId}-basic-attack`, tags: ['basic-attack', 'direct'] }
    const damage = executeEnemyBasicAttack(state, source)
    appendLog(state, `${monster.name} Basic hits for ${damage}.`)
  }
  state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs
}

const executeEnemyBasicAttack = (state: GameState, source: CombatSource) => {
  const monster = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
  if (!monster) return 0
  const before = state.player.health
  damagePlayer(state, monster.attackDamage, source)
  return Math.max(0, before - state.player.health)
}
