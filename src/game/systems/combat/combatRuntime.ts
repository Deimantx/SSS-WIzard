import { BALANCE } from '../../data/balance'
import { DUNGEONS, chooseMonster } from '../../data/dungeons'
import { ITEMS } from '../../data/items'
import { MONSTERS } from '../../data/monsters'
import { barrierMultiplier, equipmentStats, recalculateDerivedStats } from '../../engine'
import type { GameState, MonsterId, StatusEffect } from '../../types'
import { formatTime } from '../../utils'
import { appendLog, pushNotification } from '../../engine'
import { resolveMonsterLoot } from '../loot'

export const addStatus = (statuses: StatusEffect[], next: StatusEffect) => {
  const existing = statuses.find((status) => status.id === next.id)
  if (existing) Object.assign(existing, next)
  else statuses.push(next)
}

export const applyBarrier = (state: GameState, amount: number) => {
  const received = equipmentStats(state).barrierReceived ?? 0
  const next = Math.round(amount * barrierMultiplier(state) + received)
  addStatus(state.combat.playerStatuses, { id: 'barrier', remainingMs: 9000, value: next })
  return next
}

export const damageEnemy = (state: GameState, raw: number, source: 'basic' | 'spell' | 'status' = 'spell') => {
  if (!state.combat.enemyId) return 0
  let damage = raw
  if (source === 'basic' && state.combat.enemyId === 'thornling') damage *= 0.85
  const absorbed = Math.min(state.combat.enemyBarrier, damage)
  state.combat.enemyBarrier -= absorbed
  const dealt = Math.max(0, Math.round(damage - absorbed))
  state.combat.enemyHp = Math.max(0, state.combat.enemyHp - dealt)
  state.combat.lastDamageDealt = dealt
  return dealt
}

export const damagePlayer = (state: GameState, raw: number) => {
  let damage = raw
  const barrier = state.combat.playerStatuses.find((status) => status.id === 'barrier')
  if (barrier) {
    const absorbed = Math.min(barrier.value, damage)
    barrier.value -= absorbed
    damage -= absorbed
    if (barrier.value <= 0) state.combat.playerStatuses = state.combat.playerStatuses.filter((status) => status.id !== 'barrier')
  }
  const dealt = Math.max(0, Math.round(damage))
  state.player.health = Math.max(0, state.player.health - dealt)
  state.combat.lastDamageTaken = dealt
  return dealt
}

export const spawnEnemy = (state: GameState, enemyId: MonsterId, boss = false) => {
  const monster = MONSTERS[enemyId]
  state.combat.enemyId = enemyId
  state.combat.enemyHp = monster.maxHealth
  state.combat.enemyMaxHp = monster.maxHealth
  state.combat.enemyBarrier = enemyId === 'stone-root' ? Math.round(monster.maxHealth * 0.15) : 0
  state.combat.enemyActionIndex = 0
  state.combat.enemyIntervalMs = monster.attackIntervalMs
  state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs
  state.combat.enemyTelegraphMs = 0
  state.combat.enemyTelegraphActionId = null
  state.combat.enemySpecialUsed = {}
  state.combat.inBossFight = boss
  state.combat.playerAttackTimerMs = 0
  state.combat.enemyAttackTimerMs = monster.attackIntervalMs
  state.combat.enemyStatuses = []
  if (!state.progress.discoveredMonsters.includes(enemyId)) state.progress.discoveredMonsters.push(enemyId)
  appendLog(state, `${monster.name} enters the clearing.`)
}

export const spawnNextEnemy = (state: GameState) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  if (state.combat.pendingBossId) {
    const boss = state.combat.pendingBossId
    state.combat.pendingBossId = null
    spawnEnemy(state, boss, true)
    pushNotification(state, `${MONSTERS[boss].name} arrives via Auto Hunt`, 'warning')
    return
  }
  spawnEnemy(state, chooseMonster(dungeon.monsterPool))
}

export const finishEnemy = (state: GameState) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const drops = resolveMonsterLoot(state, enemyId)
  state.combat.enemyId = null
  state.combat.enemyHp = 0
  state.combat.enemyBarrier = 0
  state.combat.enemyTelegraphMs = 0
  state.combat.enemyTelegraphActionId = null
  state.combat.encounterTimerMs = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods'].encounterDelayMs
  if (monster.boss) {
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
  if (special.effect === 'damage' || special.effect === 'damage-thorn' || special.effect === 'damage-delay') damagePlayer(state, special.amount)
  if (special.effect === 'damage-thorn') addStatus(state.combat.playerStatuses, { id: 'thorn-wound', remainingMs: 6000, value: 3, tickIntervalMs: 2000, nextTickMs: 2000 })
  if (special.effect === 'damage-delay') addStatus(state.combat.playerStatuses, { id: 'attack-delay', remainingMs: special.delayMs ?? 700, value: special.delayMs ?? 700 })
  if (special.effect === 'barrier') state.combat.enemyBarrier += special.amount
  if (special.effect === 'heal') state.combat.enemyHp = Math.min(state.combat.enemyMaxHp, state.combat.enemyHp + special.amount)
  appendLog(state, `${special.name} resolves${special.effect === 'barrier' ? ` · +${special.amount} Barrier` : ''}.`)
}

export const executeEnemyAction = (state: GameState) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const step = monster.actionSequence[state.combat.enemyActionIndex % monster.actionSequence.length]
  state.combat.enemyActionIndex = (state.combat.enemyActionIndex + 1) % monster.actionSequence.length
  if (step.kind === 'special' && step.specialAttackId) {
    const special = monster.specialAttacks[step.specialAttackId]
    state.combat.enemyTelegraphMs = special.telegraphMs
    state.combat.enemyTelegraphActionId = step.specialAttackId
    appendLog(state, `${special.name} telegraphed · ${formatTime(special.telegraphMs)}`)
  } else {
    damagePlayer(state, monster.attackDamage)
    appendLog(state, `${monster.name} Basic hits for ${state.combat.lastDamageTaken}.`)
    if (monster.traits.some((trait) => trait.effect === 'thorn')) addStatus(state.combat.playerStatuses, { id: 'thorn-wound', remainingMs: 6000, value: 3, tickIntervalMs: 2000, nextTickMs: 2000 })
  }
  state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs
}
