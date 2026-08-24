import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { BALANCE, SCHOOL_LEVEL_XP } from '../game/data/balance'
import { DUNGEONS, chooseMonster } from '../game/data/dungeons'
import { GUILD_REQUESTS } from '../game/data/guildRequests'
import { ITEMS, getResearchXp } from '../game/data/items'
import { MONSTERS } from '../game/data/monsters'
import { SCHOOLS } from '../game/data/schools'
import { SPELLS } from '../game/data/spells'
import { RECIPES as RECIPE_DATA } from '../game/data/recipes'
import { appendLog, barrierMultiplier, canReserveFocus, completeResearchCycle, equipmentStats, manaRegenPerSecond, playerBasicDamage, pushNotification, recalculateDerivedStats, selectFreeFocus, selectUsedFocus, spellDamageMultiplier } from '../game/engine'
import { loadSave, saveGame as persistSave, clearSave } from '../persistence/saveManager'
import { createInitialState } from './initialState'
import type { DungeonId, EquipmentSlot, GameState, ItemId, PanelLayout, SchoolId, ScreenId, SpellEffect, SpellId, StatusEffect } from '../game/types'
import { clamp, formatTime } from '../game/utils'

export interface GameActions {
  tick: (deltaMs: number) => void
  setScreen: (screen: ScreenId) => void
  channelMana: () => void
  toggleAutoChannel: () => void
  toggleCondense: (element?: SchoolId) => void
  setResearchConfig: (itemId: ItemId, targetSchoolId: SchoolId, quantity: number) => void
  toggleResearch: (itemId?: ItemId, targetSchoolId?: SchoolId, quantity?: number) => void
  toggleTransmutation: (recipeId?: string) => void
  castSpell: (spellId: SpellId) => void
  toggleAutoCast: (spellId: SpellId) => void
  enterDungeon: () => void
  leaveDungeon: () => void
  engageBoss: (bossId: 'grove-sentinel' | 'forest-heart') => void
  toggleAutoHunt: () => void
  killCurrentEnemy: () => void
  saveGame: () => void
  resetSave: () => void
  setDebug: (enabled: boolean) => void
  toggleEditMode: () => void
  dismissNotification: (id: string) => void
  setPlayer: (changes: Partial<GameState['player']>) => void
  setSchoolDebug: (school: SchoolId, xp: number, level?: number) => void
  setLevelCap: (cap: number) => void
  setThreat: (amount: number) => void
  addItem: (itemId: ItemId, quantity: number) => void
  removeItem: (itemId: ItemId, quantity: number) => void
  toggleItemProtection: (itemId: ItemId) => void
  equipItem: (itemId: ItemId) => void
  unequipItem: (slot: EquipmentSlot) => void
  unlockAllSpells: () => void
  donateGuildRequest: (requestId: string, amount: number | 'max') => void
  claimGuildReward: (requestId: string) => void
  promoteGuild: () => void
  setGuildReputation: (amount: number) => void
  setBossKills: (bossId: 'grove-sentinel' | 'forest-heart', amount: number) => void
  preset: (name: 'fresh' | 'research' | 'combat' | 'boss' | 'guild' | 'main-boss' | 'chapter-complete') => void
  resumeFromHidden: (elapsedMs: number) => void
  setLayout: (screen: ScreenId, panelId: string, layout: PanelLayout) => void
  resetLayout: (screen: ScreenId) => void
  resetAllLayouts: () => void
}

export type GameStore = GameState & GameActions

const loadInitialState = () => {
  const loaded = loadSave()
  const state = loaded.state ?? createInitialState()
  if (loaded.error) state.notifications.push({ id: `save-error-${Date.now()}`, text: `Save recovery: ${loaded.error}`, tone: 'warning' })
  recalculateDerivedStats(state)
  return state
}

const spellUnlocked = (state: GameState, spellId: SpellId) => state.progress.unlockedSpells.includes(spellId)
const isEquipped = (state: GameState, itemId: ItemId) => Object.values(state.equipment).includes(itemId)
const isProtected = (state: GameState, itemId: ItemId) => Boolean(state.protectedItems[itemId]) || isEquipped(state, itemId)

const unlockSchoolSpells = (state: GameState, school: SchoolId) => {
  Object.values(SPELLS).filter((spell) => spell.school === school && state.schools[school].level >= spell.unlockLevel).forEach((spell) => { if (!state.progress.unlockedSpells.includes(spell.id)) state.progress.unlockedSpells.push(spell.id) })
}

const addStatus = (statuses: StatusEffect[], next: StatusEffect) => {
  const existing = statuses.find((status) => status.id === next.id)
  if (existing) Object.assign(existing, next)
  else statuses.push(next)
}

const applyBarrier = (state: GameState, amount: number) => {
  const received = equipmentStats(state).barrierReceived ?? 0
  const next = Math.round(amount * barrierMultiplier(state) + received)
  addStatus(state.combat.playerStatuses, { id: 'barrier', remainingMs: 9000, value: next })
  return next
}

const damageEnemy = (state: GameState, raw: number, source: 'basic' | 'spell' | 'status' = 'spell') => {
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

const damagePlayer = (state: GameState, raw: number) => {
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

const rollLoot = (state: GameState, enemyId: keyof typeof MONSTERS) => {
  const drops: string[] = []
  MONSTERS[enemyId].loot.forEach((drop) => {
    if (Math.random() <= drop.chance) {
      const quantity = Math.floor(drop.min + Math.random() * (drop.max - drop.min + 1))
      state.inventory[drop.itemId] = (state.inventory[drop.itemId] ?? 0) + quantity
      drops.push(`${quantity} ${ITEMS[drop.itemId].name}`)
    }
  })
  return drops.join(', ')
}

const spawnEnemy = (state: GameState, enemyId: keyof typeof MONSTERS, boss = false) => {
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

const spawnNextEnemy = (state: GameState) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  if (state.combat.pendingBossId) { const boss = state.combat.pendingBossId; state.combat.pendingBossId = null; spawnEnemy(state, boss, true); pushNotification(state, `${MONSTERS[boss].name} arrives via Auto Hunt`, 'warning'); return }
  spawnEnemy(state, chooseMonster(dungeon.monsterPool))
}

const finishEnemy = (state: GameState) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const drops = rollLoot(state, enemyId)
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

const executeSpecial = (state: GameState, specialId: string) => {
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

const executeEnemyAction = (state: GameState) => {
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

const applySpellEffect = (state: GameState, spellId: SpellId, effect: SpellEffect) => {
  const spell = SPELLS[spellId]
  if (effect.type === 'damage') damageEnemy(state, (effect.amount + state.schools[spell.school].level * 2) * spellDamageMultiplier(state, spell.school), 'spell')
  if (effect.type === 'heal') state.player.health = Math.min(state.player.maxHealth, state.player.health + effect.amount)
  if (effect.type === 'barrier') applyBarrier(state, effect.amount)
  if (effect.type === 'dot') {
    damageEnemy(state, 10 * spellDamageMultiplier(state, spell.school), 'spell')
    addStatus(state.combat.enemyStatuses, { id: effect.statusId, remainingMs: effect.durationMs, value: effect.damagePerTick, tickIntervalMs: effect.tickMs, nextTickMs: effect.tickMs })
  }
  if (effect.type === 'buff') addStatus(state.combat.playerStatuses, { id: effect.statusId, remainingMs: effect.durationMs, value: effect.value })
}

const meetsAutoCondition = (state: GameState, spellId: SpellId) => {
  const condition = SPELLS[spellId].autoCondition
  if (!condition || condition.type === 'always') return true
  if (condition.type === 'health-below') return state.player.health / state.player.maxHealth * 100 < condition.percent
  const barrier = state.combat.playerStatuses.find((status) => status.id === 'barrier')?.value ?? 0
  return barrier < condition.value
}

const castSpellInternal = (state: GameState, spellId: SpellId, quiet = false) => {
  const spell = SPELLS[spellId]
  if (!spell || state.player.mana < spell.manaCost || state.combat.spellCooldowns[spellId] > 0) return false
  if ((spell.type === 'damage' || spell.type === 'dot') && !state.combat.enemyId) return false
  state.player.mana -= spell.manaCost
  state.combat.spellCooldowns[spellId] = spell.cooldownMs
  applySpellEffect(state, spellId, spell.effect)
  appendLog(state, `${spell.name} cast${spell.type === 'damage' || spell.type === 'dot' ? ` for ${state.combat.lastDamageDealt}` : ''}.`)
  if (!quiet) pushNotification(state, `${spell.name} cast`, 'info')
  return true
}

const tickStatuses = (state: GameState, delta: number) => {
  const playerStatuses: StatusEffect[] = []
  state.combat.playerStatuses.forEach((status) => {
    const next = { ...status, remainingMs: status.remainingMs - delta, nextTickMs: status.nextTickMs === undefined ? undefined : status.nextTickMs - delta }
    while (next.nextTickMs !== undefined && next.nextTickMs <= 0 && next.remainingMs > 0) {
      if (next.id === 'thorn-wound') damagePlayer(state, next.value)
      next.nextTickMs += next.tickIntervalMs ?? 1000
    }
    if (next.remainingMs > 0) playerStatuses.push(next)
  })
  state.combat.playerStatuses = playerStatuses
  const enemyStatuses: StatusEffect[] = []
  state.combat.enemyStatuses.forEach((status) => {
    const next = { ...status, remainingMs: status.remainingMs - delta, nextTickMs: status.nextTickMs === undefined ? undefined : status.nextTickMs - delta }
    while (next.nextTickMs !== undefined && next.nextTickMs <= 0 && next.remainingMs > 0 && state.combat.enemyId) {
      if (next.id === 'burning') damageEnemy(state, next.value, 'status')
      next.nextTickMs += next.tickIntervalMs ?? 1000
    }
    if (next.remainingMs > 0) enemyStatuses.push(next)
  })
  state.combat.enemyStatuses = enemyStatuses
}

const tickResearch = (state: GameState, delta: number) => {
  const job = state.activities.research
  if (!job.running) return
  if (!job.itemId || !job.targetSchoolId || job.remainingQuantity <= 0) { job.running = false; if (job.status !== 'paused') job.status = 'idle'; return }
  if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { job.running = false; job.status = 'level-cap'; return }
  if (isProtected(state, job.itemId)) { job.running = false; job.status = 'missing-item'; return }
  if (job.progressMs < job.durationPerItemMs) { job.progressMs += delta; job.status = 'running'; return }
  if (state.player.mana < job.manaPerItem) { job.running = true; job.status = 'waiting-mana'; return }
  state.player.mana -= job.manaPerItem
  const completed = completeResearchCycle(state, job.itemId, job.targetSchoolId)
  if (!completed.completed) { job.running = false; job.status = completed.reason === 'cap' ? 'level-cap' : 'missing-item'; return }
  job.remainingQuantity -= 1
  job.progressMs = 0
  job.status = job.remainingQuantity > 0 ? 'running' : 'completed'
  if (completed.levels && completed.levels.after > completed.levels.before) pushNotification(state, `${SCHOOLS[job.targetSchoolId].name} reached Level ${completed.levels.after}`, 'success')
  if (completed.spellId) pushNotification(state, `${SPELLS[completed.spellId].name} unlocked`, 'success')
  if (job.remainingQuantity <= 0) job.running = false
}

const tickCombat = (state: GameState, delta: number) => {
  if (!state.combat.active) return
  if (!state.combat.enemyId) { state.combat.encounterTimerMs -= delta; if (state.combat.encounterTimerMs <= 0) spawnNextEnemy(state); return }
  tickStatuses(state, delta)
  const enemy = MONSTERS[state.combat.enemyId]
  const quickening = state.combat.playerStatuses.find((status) => status.id === 'quickening')
  state.combat.playerAttackTimerMs -= delta
  Object.keys(state.combat.spellCooldowns).forEach((id) => { state.combat.spellCooldowns[id as SpellId] = Math.max(0, state.combat.spellCooldowns[id as SpellId] - delta) })
  if (state.combat.playerAttackTimerMs <= 0 && state.combat.enemyId) {
    const damage = damageEnemy(state, playerBasicDamage(state), 'basic')
    appendLog(state, `Basic Attack hits for ${damage}.`)
    const interval = BALANCE.player.basicAttackIntervalMs * (quickening ? 0.75 : 1)
    const delay = state.combat.playerStatuses.find((status) => status.id === 'attack-delay')?.value ?? 0
    state.combat.playerAttackTimerMs = interval + delay
  }
  if (state.combat.enemyId) Object.keys(state.activities.autoCast).forEach((id) => { const spellId = id as SpellId; if (state.activities.autoCast[spellId] && spellUnlocked(state, spellId) && state.combat.spellCooldowns[spellId] <= 0 && meetsAutoCondition(state, spellId)) castSpellInternal(state, spellId, true) })
  if (!state.combat.enemyId) return
  if (state.combat.enemyHp <= 0) { finishEnemy(state); return }
  if (enemy.id === 'grove-sentinel' && state.combat.enemyHp <= enemy.maxHealth * 0.4 && !state.combat.enemySpecialUsed['ancient-growth']) { state.combat.enemySpecialUsed['ancient-growth'] = true; state.combat.enemyBarrier += 80; appendLog(state, 'Ancient Growth triggers · +80 Barrier.') }
  if (enemy.id === 'forest-heart' && state.combat.enemyHp <= enemy.maxHealth * 0.5 && !state.combat.enemySpecialUsed['living-core']) { state.combat.enemySpecialUsed['living-core'] = true; state.combat.enemyIntervalMs = Math.round(state.combat.enemyIntervalMs * 0.85); appendLog(state, 'Living Core triggers · attack speed increased.') }
  if (state.combat.enemyTelegraphMs > 0) { state.combat.enemyTelegraphMs -= delta; if (state.combat.enemyTelegraphMs <= 0 && state.combat.enemyTelegraphActionId) { executeSpecial(state, state.combat.enemyTelegraphActionId); state.combat.enemyTelegraphActionId = null; state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs } }
  else { state.combat.enemyActionTimerMs -= delta; if (state.combat.enemyActionTimerMs <= 0) executeEnemyAction(state) }
  if (state.player.health <= 0 && !state.player.godMode) { state.combat.active = false; state.combat.enemyId = null; state.combat.threatCleared = 0; state.combat.inBossFight = false; pushNotification(state, 'Defeated · recovering in the Tower', 'warning'); appendLog(state, 'The wizard falls. Threat Cleared resets to 0.') }
}

export const useGameStore = create<GameStore>()(immer((set, get) => ({
  ...loadInitialState(),
  tick: (deltaMs) => set((state) => {
    const delta = Math.min(1000, Math.max(0, deltaMs))
    state.channelCooldownMs = Math.max(0, state.channelCooldownMs - delta)
    state.player.mana = clamp(state.player.mana + manaRegenPerSecond(state) * delta / 1000, 0, state.player.maxMana)
    if (!state.combat.active) state.player.health = clamp(state.player.health + BALANCE.player.healthRegenPerSecond * delta / 1000 * BALANCE.player.outOfCombatRegenMultiplier, 0, state.player.maxHealth)
    const condense = state.activities.condense
    if (condense.running) { if (condense.progressMs >= BALANCE.condense.durationMs) { if (state.player.mana >= BALANCE.condense.manaCost) { state.player.mana -= BALANCE.condense.manaCost; condense.progressMs = 0 } } else { condense.progressMs += delta; if (condense.progressMs >= BALANCE.condense.durationMs) { state.inventory[SCHOOLS[condense.element].fragment] = (state.inventory[SCHOOLS[condense.element].fragment] ?? 0) + 1; pushNotification(state, `${SCHOOLS[condense.element].name} Fragment condensed`, 'success') } } }
    tickResearch(state, delta)
    const transmutation = state.activities.transmutation
    if (transmutation.running && transmutation.recipeId) { const recipe = RECIPE_DATA[transmutation.recipeId]; if (!recipe) transmutation.running = false; else if (transmutation.progressMs < recipe.durationMs) transmutation.progressMs += delta; else { const canCraft = recipe.ingredients.every((ingredient) => (state.inventory[ingredient.itemId] ?? 0) >= ingredient.quantity && !isProtected(state, ingredient.itemId)); if (canCraft) { recipe.ingredients.forEach((ingredient) => { state.inventory[ingredient.itemId] = (state.inventory[ingredient.itemId] ?? 0) - ingredient.quantity }); state.inventory[recipe.output] = (state.inventory[recipe.output] ?? 0) + 1; state.activities.transmutation.running = false; state.activities.transmutation.progressMs = 0; pushNotification(state, `${recipe.name} transmuted`, 'success') } else { transmutation.running = false; pushNotification(state, 'Transmutation stopped · missing or protected ingredients', 'warning') } } }
    tickCombat(state, delta)
    return state
  }),
  setScreen: (screen) => set((state) => { state.ui.screen = screen; return state }),
  channelMana: () => set((state) => { if (state.channelCooldownMs > 0 || state.player.mana >= state.player.maxMana) return state; state.player.mana = clamp(state.player.mana + BALANCE.mana.manualChannelAmount, 0, state.player.maxMana); state.channelCooldownMs = BALANCE.mana.manualChannelCooldownMs; pushNotification(state, '+15 Mana channeled', 'info'); return state }),
  toggleAutoChannel: () => set((state) => { if (state.activities.autoChannel) state.activities.autoChannel = false; else if (canReserveFocus(state, BALANCE.mana.autoChannelFocus)) state.activities.autoChannel = true; else pushNotification(state, `Cannot start Auto Channeling · Requires ${BALANCE.mana.autoChannelFocus} Focus · Free Focus: ${selectFreeFocus(state)}`, 'warning'); return state }),
  toggleCondense: (element = get().activities.condense.element) => set((state) => { if (state.activities.condense.running) { state.activities.condense.running = false; return state } if (!canReserveFocus(state, BALANCE.condense.focusCost)) pushNotification(state, `Cannot start Condensation · Requires ${BALANCE.condense.focusCost} Focus`, 'warning'); else if (state.player.mana < BALANCE.condense.manaCost) pushNotification(state, 'Cannot start Condensation · Not enough Mana', 'warning'); else { state.activities.condense.element = element; state.player.mana -= BALANCE.condense.manaCost; state.activities.condense.running = true; state.activities.condense.progressMs = 0 } return state }),
  setResearchConfig: (itemId, targetSchoolId, quantity) => set((state) => { const job = state.activities.research; if (job.running) return state; job.itemId = itemId; job.targetSchoolId = targetSchoolId; job.requestedQuantity = Math.max(1, quantity); job.remainingQuantity = Math.max(1, quantity); job.progressMs = 0; job.xpPerItem = getResearchXp(itemId, targetSchoolId); job.status = 'idle'; return state }),
  toggleResearch: (itemId, targetSchoolId, quantity = 1) => set((state) => { const job = state.activities.research; if (job.running) { job.running = false; job.status = 'paused'; return state } if (itemId) { job.itemId = itemId; job.targetSchoolId = targetSchoolId ?? ITEMS[itemId].researchSchool ?? 'fire'; job.requestedQuantity = Math.max(1, quantity); job.remainingQuantity = Math.max(1, quantity); job.xpPerItem = getResearchXp(itemId, job.targetSchoolId) } if (!job.itemId || !job.targetSchoolId) { job.status = 'missing-item'; return state } if (isProtected(state, job.itemId)) { job.running = false; job.status = 'missing-item'; pushNotification(state, 'This item is protected. Unlock it before Research.', 'warning'); return state } if ((state.inventory[job.itemId] ?? 0) < 1) { job.running = false; job.status = 'missing-item'; pushNotification(state, 'Cannot start Research · item missing', 'warning'); return state } if (state.schools[job.targetSchoolId].level >= state.progress.magicLevelCap) { job.running = false; job.status = 'level-cap'; pushNotification(state, 'Level Cap Reached · Research queue preserved', 'warning'); return state } if (!canReserveFocus(state, job.focusCost)) { job.running = false; job.status = 'waiting-focus'; pushNotification(state, `Cannot start Research · Requires ${job.focusCost} Focus · Free Focus: ${selectFreeFocus(state)}`, 'warning'); return state } job.running = true; job.status = 'running'; return state }),
  toggleTransmutation: (recipeId = get().activities.transmutation.recipeId ?? 'ember-staff') => set((state) => { const recipe = RECIPE_DATA[recipeId]; if (state.activities.transmutation.running) { state.activities.transmutation.running = false; return state } if (!state.progress.emberStaffUnlocked) { pushNotification(state, 'Grove Sentinel must be defeated before using Transmutation.', 'warning'); return state } if (!recipe || !canReserveFocus(state, recipe.focusCost)) { pushNotification(state, `Cannot start Transmutation · Requires ${recipe?.focusCost ?? BALANCE.transmutation.focusCost} Focus`, 'warning'); return state } if (!recipe.ingredients.every((ingredient) => (state.inventory[ingredient.itemId] ?? 0) >= ingredient.quantity && !isProtected(state, ingredient.itemId))) { pushNotification(state, 'Missing or protected recipe ingredients.', 'warning'); return state } state.activities.transmutation = { running: true, recipeId, progressMs: 0 }; return state }),
  castSpell: (spellId) => set((state) => { if (!spellUnlocked(state, spellId)) return state; const spell = SPELLS[spellId]; if (state.combat.spellCooldowns[spellId] > 0) { pushNotification(state, `${spell.name} is cooling down`, 'warning'); return state } if (state.player.mana < spell.manaCost) { pushNotification(state, 'Not enough Mana', 'warning'); return state } if (!state.combat.active || ((spell.type === 'damage' || spell.type === 'dot') && !state.combat.enemyId)) { pushNotification(state, 'Enter combat before using that spell', 'warning'); return state } castSpellInternal(state, spellId); return state }),
  toggleAutoCast: (spellId) => set((state) => { if (!spellUnlocked(state, spellId)) return state; if (state.activities.autoCast[spellId]) state.activities.autoCast[spellId] = false; else if (canReserveFocus(state, SPELLS[spellId].autoCastFocus)) { state.activities.autoCast[spellId] = true; pushNotification(state, `${SPELLS[spellId].name} Auto-Cast enabled`, 'success') } else pushNotification(state, `Cannot enable Auto-Cast · Requires ${SPELLS[spellId].autoCastFocus} Focus · Free Focus: ${selectFreeFocus(state)}`, 'warning'); return state }),
  enterDungeon: () => set((state) => { if (state.combat.active) return state; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.encounterTimerMs = 0; state.player.health = Math.max(1, state.player.health); spawnNextEnemy(state); pushNotification(state, 'Whispering Woods entered', 'info'); return state }),
  leaveDungeon: () => set((state) => { state.combat = { ...createInitialState().combat, log: ['Left the dungeon. Threat Cleared resets.'] }; return state }),
  engageBoss: (bossId) => set((state) => { if (!state.combat.active) { pushNotification(state, 'Enter Whispering Woods first', 'warning'); return state } if (bossId === 'grove-sentinel' && state.combat.threatCleared < DUNGEONS['whispering-woods'].threatRequired) { pushNotification(state, `Grove Sentinel requires ${DUNGEONS['whispering-woods'].threatRequired} Threat Cleared`, 'warning'); return state } if (bossId === 'forest-heart' && !state.progress.forestHeartUnlocked) { pushNotification(state, 'Defeat Grove Sentinel to reveal Forest Heart', 'warning'); return state } spawnEnemy(state, bossId, true); pushNotification(state, `${MONSTERS[bossId].name} engaged`, 'warning'); return state }),
  toggleAutoHunt: () => set((state) => { const unlocked = state.progress.autoHuntBossUnlocked || (state.progress.bossKillsByBoss['grove-sentinel'] ?? 0) > 0 || state.progress.firstBossKill; if (!unlocked) { pushNotification(state, 'Auto Hunt unlocks after the first Grove Sentinel kill', 'warning'); return state } state.progress.autoHuntBossUnlocked = true; state.progress.autoHuntBossByDungeon['whispering-woods'] = !state.progress.autoHuntBossByDungeon['whispering-woods']; return state }),
  killCurrentEnemy: () => set((state) => { if (state.combat.enemyId) { state.combat.enemyHp = 0; finishEnemy(state) } return state }),
  saveGame: () => set((state) => { state.lastSavedAt = Date.now(); persistSave(state); pushNotification(state, 'Game saved', 'success'); return state }),
  resetSave: () => { clearSave(); set((state) => { Object.assign(state, createInitialState()); return state }) },
  setDebug: (enabled) => set((state) => { state.ui.showDebug = enabled; return state }),
  toggleEditMode: () => set((state) => { state.ui.editMode = !state.ui.editMode; return state }),
  dismissNotification: (id) => set((state) => { state.notifications = state.notifications.filter((note) => note.id !== id); return state }),
  setPlayer: (changes) => set((state) => { state.player = { ...state.player, ...changes }; recalculateDerivedStats(state); return state }),
  setSchoolDebug: (school, xp, level) => set((state) => { state.schools[school].xp = Math.max(0, xp); state.schools[school].level = level ?? Math.min(state.progress.magicLevelCap, Math.max(1, Math.floor(xp / 20) + 1)); unlockSchoolSpells(state, school); return state }),
  setLevelCap: (cap) => set((state) => { state.progress.magicLevelCap = Math.max(1, cap); Object.keys(state.schools).forEach((id) => { const school = id as SchoolId; state.schools[school].level = Math.min(state.schools[school].level, state.progress.magicLevelCap) }); return state }),
  setThreat: (amount) => set((state) => { state.combat.threatCleared = Math.max(0, amount); return state }),
  addItem: (itemId, quantity) => set((state) => { state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) + quantity); return state }),
  removeItem: (itemId, quantity) => set((state) => { if (isProtected(state, itemId)) return state; state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity); return state }),
  toggleItemProtection: (itemId) => set((state) => { if (isEquipped(state, itemId)) { pushNotification(state, 'Equipped items are always protected.', 'warning'); return state } state.protectedItems[itemId] = !state.protectedItems[itemId]; return state }),
  equipItem: (itemId) => set((state) => { const item = ITEMS[itemId]; if (!item.equipmentSlot || (state.inventory[itemId] ?? 0) < 1) return state; const old = state.equipment[item.equipmentSlot]; if (old) state.protectedItems[old] = false; state.equipment[item.equipmentSlot] = itemId; state.protectedItems[itemId] = true; recalculateDerivedStats(state); pushNotification(state, `${item.name} equipped`, 'success'); return state }),
  unequipItem: (slot) => set((state) => { const old = state.equipment[slot]; if (old) state.protectedItems[old] = false; state.equipment[slot] = null; recalculateDerivedStats(state); return state }),
  unlockAllSpells: () => set((state) => { state.progress.unlockedSpells = Object.keys(SPELLS) as SpellId[]; Object.keys(state.schools).forEach((id) => { const school = id as SchoolId; state.schools[school].level = Math.max(4, state.schools[school].level); state.schools[school].xp = Math.max(SCHOOL_LEVEL_XP(4), state.schools[school].xp) }); return state }),
  donateGuildRequest: (requestId, amount) => set((state) => { const request = GUILD_REQUESTS[requestId as keyof typeof GUILD_REQUESTS]; if (!request || request.kind !== 'donation' || !state.progress.guildUnlocked) return state; const current = state.progress.requestProgress[requestId] ?? 0; const remaining = request.target - current; const quantity = amount === 'max' ? Math.min(remaining, state.inventory[request.itemId] ?? 0) : Math.min(remaining, amount); if (quantity <= 0 || isProtected(state, request.itemId)) { pushNotification(state, 'Protected or missing Fire Fragments.', 'warning'); return state } state.inventory[request.itemId] = (state.inventory[request.itemId] ?? 0) - quantity; state.progress.requestProgress[requestId] = current + quantity; return state }),
  claimGuildReward: (requestId) => set((state) => { const request = GUILD_REQUESTS[requestId as keyof typeof GUILD_REQUESTS]; if (!request || state.progress.requestClaims[requestId] || (state.progress.requestProgress[requestId] ?? 0) < request.target) return state; state.progress.requestClaims[requestId] = true; state.progress.guildReputation += request.reputation; pushNotification(state, `${request.name} reward claimed · +${request.reputation} Reputation`, 'success'); return state }),
  promoteGuild: () => set((state) => { const complete = Object.values(GUILD_REQUESTS).every((request) => (state.progress.requestProgress[request.id] ?? 0) >= request.target); if (state.progress.guildRank === 'initiate' && complete && state.progress.guildReputation >= 175) { state.progress.guildRank = 'apprentice'; if (!state.progress.permanentFocusBonuses['guild-apprentice']) state.progress.permanentFocusBonuses['guild-apprentice'] = BALANCE.focus.guildApprenticeBonus; recalculateDerivedStats(state); pushNotification(state, 'Guild rank increased to Apprentice · +10 permanent Focus', 'success') } return state }),
  setGuildReputation: (amount) => set((state) => { state.progress.guildReputation = Math.max(0, amount); return state }),
  setBossKills: (bossId, amount) => set((state) => { state.progress.bossKillsByBoss[bossId] = Math.max(0, amount); state.progress.requestProgress['sentinel-breaker'] = state.progress.bossKillsByBoss['grove-sentinel'] ?? 0; return state }),
  preset: (name) => set((state) => { Object.assign(state, createInitialState()); if (name === 'research') { state.inventory['fire-fragment'] = 10; state.player.mana = 100; state.activities.autoChannel = true } if (name === 'combat') { state.inventory['fire-fragment'] = 10; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 20, level: 2 }; state.player.mana = 100; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnNextEnemy(state) } if (name === 'boss') { state.inventory['fire-fragment'] = 15; state.inventory['wisp-essence'] = 10; state.inventory['grove-bark'] = 2; state.progress.unlockedSpells = ['fire-bolt']; state.schools.fire = { xp: 80, level: 4 }; state.progress.guildUnlocked = true; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; state.combat.threatCleared = 20; spawnNextEnemy(state) } if (name === 'guild') { state.progress.guildUnlocked = true; state.progress.guildRank = 'initiate'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.inventory['fire-fragment'] = 20; state.progress.lifetimeKills = 30; state.progress.requestProgress['clear-the-woods'] = 30; state.progress.bossKillsByBoss['grove-sentinel'] = 2; state.progress.requestProgress['sentinel-breaker'] = 2; state.progress.guildReputation = 100 } if (name === 'main-boss' || name === 'chapter-complete') { state.inventory['fire-fragment'] = 20; state.inventory['wisp-essence'] = 12; state.inventory['grove-bark'] = 4; state.progress.guildUnlocked = true; state.progress.guildRank = 'apprentice'; state.progress.firstBossKill = true; state.progress.emberStaffUnlocked = true; state.progress.forestHeartUnlocked = true; state.progress.autoHuntBossUnlocked = true; state.progress.permanentFocusBonuses['forest-heart'] = 10; state.progress.permanentFocusBonuses['guild-apprentice'] = 10; state.progress.magicLevelCap = 20; state.schools.fire = { xp: 380, level: 20 }; state.progress.firstMainBossKill = true; state.inventory.heartseed = 1; recalculateDerivedStats(state); state.combat.active = true; state.combat.dungeonId = 'whispering-woods'; spawnEnemy(state, 'forest-heart', true) } return state }),
  resumeFromHidden: (elapsedMs) => set((state) => { if (elapsedMs > 1000) { state.offlineBankMs += elapsedMs; pushNotification(state, `${Math.round(elapsedMs / 1000)}s added to Offline Bank`, 'info') } return state }),
  setLayout: (screen, panelId, layout) => set((state) => { if (!state.ui.layouts[screen]) state.ui.layouts[screen] = {}; state.ui.layouts[screen]![panelId] = layout; return state }),
  resetLayout: (screen) => set((state) => { delete state.ui.layouts[screen]; return state }),
  resetAllLayouts: () => set((state) => { state.ui.layouts = {}; return state }),
})))

export const useGameStoreSelectors = { selectUsedFocus, selectFreeFocus }
export { selectUsedFocus, selectFreeFocus }
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state)
export const makeInitialState = createInitialState
