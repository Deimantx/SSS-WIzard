import { BALANCE } from '../game/data/balance'
import { createInitialManaPillars } from '../game/data/manaPillars'
import type { GameState } from '../game/types'

export const SAVE_VERSION = 6

export const createInitialState = (): GameState => ({
  saveVersion: SAVE_VERSION,
  player: { health: BALANCE.player.maxHealth, maxHealth: BALANCE.player.maxHealth, mana: BALANCE.mana.startingMana, maxMana: BALANCE.mana.maxMana, maxFocus: BALANCE.focus.startingMax, baseMaxHealth: BALANCE.player.maxHealth, baseMaxMana: BALANCE.mana.maxMana, baseMaxFocus: BALANCE.focus.startingMax, godMode: false },
  schools: { fire: { xp: 0, level: 1 }, water: { xp: 0, level: 1 }, earth: { xp: 0, level: 1 }, air: { xp: 0, level: 1 } },
  currencies: { gold: 0 },
  inventory: { 'apprentice-wand': 1 },
  protectedItems: { 'apprentice-wand': true },
  equipment: { weapon: 'apprentice-wand', offhand: null, armor: null, helmet: null, amulet: null, earrings: null, ring1: null, ring2: null },
  activities: {
    channeling: { echoesAssigned: 0 },
    condense: { running: false, element: 'fire', progressMs: 0 },
    research: { running: false, itemId: null, targetSchoolId: null, requestedQuantity: 0, remainingQuantity: 0, progressMs: 0, durationPerItemMs: BALANCE.research.durationPerItemMs, xpPerItem: BALANCE.research.xpPerFragment, manaPerItem: BALANCE.research.manaCostPerItem, focusCost: BALANCE.research.focusCost, status: 'idle' },
    transmutation: { running: false, recipeId: null, progressMs: 0 },
    autoCast: { 'fire-bolt': false, 'water-ward': false, 'earth-spike': false, 'air-lance': false, ignite: false, 'flow-mend': false, stoneguard: false, quickening: false },
  },
  combat: { active: false, dungeonId: null, enemyId: null, enemyHp: 0, enemyMaxHp: 0, enemyBarrier: 0, enemyActionIndex: 0, enemyActionTimerMs: 0, enemyIntervalMs: 0, enemyTelegraphMs: 0, enemyTelegraphActionId: null, enemySpecialUsed: {}, pendingBossId: null, playerAttackTimerMs: 0, enemyAttackTimerMs: 0, encounterTimerMs: 0, spellCooldowns: { 'fire-bolt': 0, 'water-ward': 0, 'earth-spike': 0, 'air-lance': 0, ignite: 0, 'flow-mend': 0, stoneguard: 0, quickening: 0 }, playerStatuses: [], enemyStatuses: [], threatCleared: 0, inBossFight: false, log: [], lastDamageDealt: 0, lastDamageTaken: 0 },
  progress: { magicLevelCap: BALANCE.mainBoss.startingMagicLevelCap, unlockedSpells: [], discoveredMonsters: [], lifetimeKills: 0, firstBossKill: false, firstMainBossKill: false, guildUnlocked: false, emberStaffUnlocked: false, forestHeartUnlocked: false, autoHuntBossUnlocked: false, guildRank: 'outsider', requestProgress: {}, guildReputation: 0, requestClaims: {}, permanentFocusBonuses: {}, lifetimeKillsByMonster: {}, bossKillsByBoss: {}, autoHuntBossByDungeon: { 'whispering-woods': false }, channeling: { pillars: createInitialManaPillars(), totalManaGenerated: 0, fiveEchoSustainMs: 0, discoveries: { 'stable-leyline': false, 'echo-resonance': false, 'deep-reservoir': false } } },
  ui: { screen: 'home' },
  offlineBankMs: 0,
  lastSavedAt: Date.now(),
  notifications: [],
  debug: { bonusManaRegenFlat: 0, bonusMaxManaFlat: 0, bonusMaxFocusFlat: 0, allowManaOverCap: false, allowFocusOverCap: false, ignoreEchoLimit: false },
})
