import { BALANCE } from '../game/data/balance'
import { createInitialManaPillars } from '../game/data/manaPillars'
import type { GameState } from '../game/types'
import { COMBAT_RNG_DEFAULT_SEED } from '../game/core/balance/combatRng'
import { createInitialTransmutationArrays } from '../game/content/transmutation/transmutationArrays'
import { createInitialGuardiansState } from '../game/content/guardians/guardians'
import { DUNGEON_ORDER } from '../game/content/dungeons/dungeons'
import { CANONICAL_SPELL_IDS } from '../game/content/spells/spells'
import { createEmptyResonanceState } from '../game/systems/resonance/resonanceRuntime'
import { createInitialWorldTierState } from '../game/systems/world-tier/worldTierRuntime'
import { createInitialCrystalState } from '../game/systems/crystals/crystalRuntime'
import { ARCANE_CORE_SCHEMA_VERSION } from '../game/content/arcaneCore/arcaneCoreBalance'
import { createInitialChronicleProgress } from '../game/systems/chronicles/chronicleRuntime'

// Combat Action System V3 stores authored base work plus remaining work for
// dynamic-rate action progression.
export const SAVE_VERSION = 49

const emptySpellRecord = <T>(value: T) => Object.fromEntries(CANONICAL_SPELL_IDS.map((spellId) => [spellId, value])) as Record<import('../game/types').SpellId, T>

export const createInitialState = (): GameState => {
  const state = ({
  saveVersion: SAVE_VERSION,
  player: { health: BALANCE.player.maxHealth, maxHealth: BALANCE.player.maxHealth, mana: BALANCE.mana.startingMana, maxMana: BALANCE.mana.maxMana, baseMaxHealth: BALANCE.player.maxHealth, baseMaxMana: BALANCE.mana.maxMana, healthRegenTimerMs: BALANCE.player.healthRegenIntervalMs },
  schools: { fire: { xp: 0, level: 1 }, water: { xp: 0, level: 1 }, earth: { xp: 0, level: 1 }, air: { xp: 0, level: 1 } },
  currencies: { gold: 0 },
  resonance: createEmptyResonanceState(),
  tower: { acolytes: { base: BALANCE.acolytes.startingCount, permanentBonuses: {} }, resources: { arcaneFlux: 0 } },
  worldTier: createInitialWorldTierState(),
  inventory: {},
  crystals: createInitialCrystalState(),
  protectedItems: {},
  equipment: { weapon: null, armor: null, head: null },
  arcaneCore: { arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: 0, nodes: {} },
  artifactProgress: {},
  guardians: createInitialGuardiansState(),
  activities: {
    channeling: { acolytesAssigned: 0 },
    research: { slots: { 'research-1': null, 'research-2': null, 'research-3': null, 'research-4': null } },
    transmutation: { jobs: {} },
    artificing: { activeJob: null, activeRecipeId: null, progressMs: 0 },
    autoCast: emptySpellRecord(false), autoCastPriority: [],
  },
  combat: { active: false, dungeonId: null, enemyId: null, targetEnemyId: null, enemyWorldTier: null, enemyInstanceSerial: 0, enemyInstanceKey: null, enemyHp: 0, enemyMaxHp: 0, enemyBarrier: 0, playerBarrier: 0, enemyBarrierRemainingMs: null, playerBarrierRemainingMs: null, enemyActionPatternId: null, enemyNextActionIndex: 0, enemyCurrentStepId: null, enemyCurrentActionId: null, enemyCurrentActionPatternId: null, enemyActionTimerMs: 0, enemyActionDurationMs: 0, triggeredRuleIds: [], ruleCooldowns: {}, pendingBossId: null, pendingPlayerSpellCast: null, queuedPlayerSpellId: null, activeSpellLoadout: null, encounterTimerMs: 0, dungeonSequenceIndex: null, spellCooldowns: emptySpellRecord(0), arcaneCoreRuntime: { elapsedMs: 0, encounterStartedAtMs: 0, autoCastCount: 0, damagingSpellCount: 0, spellCastCount: 0, cooldownPulseSpellCount: 0, survivalInstinctUsed: false, lastCastOrigin: null, lastSpellId: null, lastLoadoutSlotIndex: null, recentSpellSequence: [], recentDamagingSpellSequence: [], recentLoadoutSlotSequence: [], alternatingCastStreak: 0, enemyDamagingSpellCount: 0, nextDamageMultiplier: 1, nextEnemyDamageMultiplier: 1, nextEffectivenessMultiplier: 1, nextActionSpeedMultiplier: 1, nextManaRefundPercent: 0, nextCritChanceBonus: 0, nextCritDamageBonus: 0, nextGuaranteedCrit: false, failedCritStreak: 0, costBandHistory: [], castLoadoutSlots: [], echoCharges: 0, manualCharges: 0, manualCastCount: 0, consecutiveAutoCasts: 0, consecutiveManualCasts: 0, sovereigntyCharges: 0, lastWordUsed: false, victoryMomentumReady: false, ruinTransferReady: false, ruinTransferMultiplier: 1, ruinStacks: 0, chainReactionReady: false, refuseDeathUsed: false, immortalGuardUsed: false, overflowCharges: 0, singularityUsed: false, reservoirCycleReady: false, manaCollapseReady: false, emergencyConversionReady: false, dualMindPreparedOrigin: undefined, dualMindPreparedUntilMs: undefined, absoluteStasisUsed: false, stolenTimeStacks: 0, totalEnemyDelayMs: 0, timelineDelayCreditMs: 0 }, playerStatuses: [], enemyStatuses: [], threatCleared: 0, inBossFight: false, log: [], lastDamageDealt: 0, lastDamageTaken: 0, combatRngState: COMBAT_RNG_DEFAULT_SEED, guardian: { activeGuardianId: null, attackTimerMs: 0, suppressedForEncounter: false } },
  progress: { magicLevelCap: BALANCE.schoolProgression.startingCap, spellRanks: {}, discoveredMonsters: [], discoveredItems: [], lifetimeKills: 0, firstBossKill: false, firstMainBossKill: false, guildUnlocked: false, emberStaffUnlocked: false, forestHeartUnlocked: false, autoHuntBossUnlocked: false, guildRank: 'outsider', requestProgress: {}, guildReputation: 0, requestClaims: {}, guildPointsEarned: 0, guildSkillNodeRanks: {}, chronicle: createInitialChronicleProgress(), permanentManaBonuses: {}, startingSchoolId: null, tutorialStage: 'choose-school', lifetimeKillsByMonster: {}, bossKillsByBoss: {}, autoHuntBossByDungeon: Object.fromEntries(DUNGEON_ORDER.map((dungeonId) => [dungeonId, false])) as GameState['progress']['autoHuntBossByDungeon'], channeling: { pillars: createInitialManaPillars(), totalManaGenerated: 0, totalFluxGenerated: 0, fiveEchoSustainMs: 0, discoveries: { 'stable-leyline': false, 'echo-resonance': false, 'deep-reservoir': false } }, transmutation: { arrays: createInitialTransmutationArrays() } },
  storyProgress: { pendingEventIds: [], completedEventIds: [] },
  darkPortal: { recoveredShards: [] },
  spellPresets: { presets: [], selectedPresetId: null },
  ui: { screen: 'home', lastEnteredCombatDungeonId: undefined },
  offlineBankMs: 0,
  lastSavedAt: Date.now(),
  notifications: [],
    debug: { bonusManaRegenFlat: 0, bonusMaxManaFlat: 0, allowManaOverCap: false, showLockedTransmutationRecipes: false, showLockedArtificingRecipes: false, playerImmortal: false, enemyImmortal: false, infiniteMana: false, ignoreSpellCooldowns: false, disableAutoCast: false, freezePlayerActions: false, freezeEnemyActions: false, combatPaused: false, combatTimeScale: 1, artifactFreeRankPurchase: false, artifactIgnoreOwnership: false, arcaneCoreFreeCosts: false, arcaneCoreIgnorePrerequisites: false, bonusAcolytes: 0, acolyteTotalOverride: null, ignoreAcolyteLimit: false, arcaneFluxCapacityOverride: null },
  }) as GameState
  state.combat.arcaneCoreRuntime.lastCastOrigin = null
  state.combat.arcaneCoreRuntime.recentSpellSequence = []
  state.combat.arcaneCoreRuntime.recentDamagingSpellSequence = []
  state.combat.arcaneCoreRuntime.recentLoadoutSlotSequence = []
  state.combat.arcaneCoreRuntime.manaSpendSequence = 0
  state.combat.arcaneCoreRuntime.reservoirCycleTriggeredSpendSequence = 0
  state.combat.arcaneCoreRuntime.overchannelTriggeredSpendSequence = 0
  state.combat.arcaneCoreRuntime.overchannelSpendFloorSequence = 0
  return state
}
