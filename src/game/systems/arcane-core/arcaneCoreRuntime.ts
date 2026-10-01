import type { ArcaneCoreState, GameState } from '../../types'
import { getArcaneCoreSpecialEffects } from './arcaneCoreProgression'
import { commitArcaneCoreSpellCast, getArcaneCoreManaRegenMultiplier as getCoreManaRegenMultiplier, getArcaneCoreHealingReceivedBonusPct as getCoreHealingReceivedBonusPct, tryConsumeArcaneCoreSurvivalMechanic, type ArcaneCoreSpellCastContext } from './arcaneCoreMechanicRuntime'

const special = (state: Pick<ArcaneCoreState, 'nodes'>, type: import('../../types').ArcaneCoreSpecialEffect['type']) => getArcaneCoreSpecialEffects(state).filter((effect) => effect.type === type)

export const isArcaneCoreSpellFree = (state: Pick<GameState, 'arcaneCore' | 'combat'>) => {
  const nextCast = state.combat.arcaneCoreRuntime.spellCastCount + 1
  return special(state.arcaneCore, 'nth-spell-free').some((effect) => effect.type === 'nth-spell-free' && nextCast % effect.every === 0)
}

export const getArcaneCoreManaRegenMultiplier = (state: Pick<GameState, 'arcaneCore' | 'player'>) => getCoreManaRegenMultiplier(state)

export const getArcaneCoreHealingReceivedBonusPct = (state: Pick<GameState, 'combat'>) => getCoreHealingReceivedBonusPct(state as never)

export const beginArcaneCoreSpellCast = (state: GameState, damaging: boolean, context?: ArcaneCoreSpellCastContext) => {
  if (context) {
    const mechanicCast = commitArcaneCoreSpellCast(state, context)
    const runtime = state.combat.arcaneCoreRuntime
    const cooldownPulse = special(state.arcaneCore, 'nth-spell-cooldown-pulse').some((effect) => effect.type === 'nth-spell-cooldown-pulse' && runtime.spellCastCount % effect.every === 0)
    if (cooldownPulse) runtime.cooldownPulseSpellCount += 1
    return { ...mechanicCast, cooldownPulse }
  }
  const runtime = state.combat.arcaneCoreRuntime
  runtime.spellCastCount += 1
  if (damaging) runtime.damagingSpellCount += 1
  const free = special(state.arcaneCore, 'nth-spell-free').some((effect) => effect.type === 'nth-spell-free' && runtime.spellCastCount % effect.every === 0)
  const damageMultiplier = special(state.arcaneCore, 'nth-damaging-spell-bonus').reduce((multiplier, effect) => effect.type === 'nth-damaging-spell-bonus' && runtime.damagingSpellCount % effect.every === 0 ? multiplier * effect.damageMultiplier : multiplier, 1)
  const cooldownPulse = special(state.arcaneCore, 'nth-spell-cooldown-pulse').some((effect) => effect.type === 'nth-spell-cooldown-pulse' && runtime.spellCastCount % effect.every === 0)
  if (cooldownPulse) runtime.cooldownPulseSpellCount += 1
  return { free, damageMultiplier, cooldownPulse, effectivenessMultiplier: 1, actionSpeedMultiplier: 1, manaCostMultiplier: 1, manaRefundPercent: 0, manaRestoreFlat: 0, manaOverflowBarrier: 0, critChanceBonus: 0, critDamageBonus: 0, guaranteedCrit: false, statusDurationMultiplier: 1 }
}

export const getArcaneCoreCooldownPulseReduction = (state: Pick<GameState, 'arcaneCore' | 'combat'>) => {
  const count = state.combat.arcaneCoreRuntime.spellCastCount
  return special(state.arcaneCore, 'nth-spell-cooldown-pulse').reduce((reduction, effect) => effect.type === 'nth-spell-cooldown-pulse' && count % effect.every === 0 ? Math.max(reduction, effect.cooldownReductionMs) : reduction, 0)
}

export const tryConsumeArcaneCoreSurvival = (state: GameState) => {
  if (tryConsumeArcaneCoreSurvivalMechanic(state)) return true
  const effect = special(state.arcaneCore, 'lethal-survival')[0]
  if (!effect || effect.type !== 'lethal-survival' || !effect.oncePerDungeonRun || state.combat.arcaneCoreRuntime.survivalInstinctUsed) return false
  state.combat.arcaneCoreRuntime.survivalInstinctUsed = true
  return true
}

const createArcaneCoreRuntime = () => ({
  elapsedMs: 0,
  encounterStartedAtMs: 0,
  autoCastCount: 0,
  damagingSpellCount: 0,
  spellCastCount: 0,
  cooldownPulseSpellCount: 0,
  survivalInstinctUsed: false,
  lastCastOrigin: null,
  lastSpellId: null,
  lastLoadoutSlotIndex: null,
  recentSpellSequence: [],
  recentDamagingSpellSequence: [],
  recentLoadoutSlotSequence: [],
  alternatingCastStreak: 0,
  enemyDamagingSpellCount: 0,
  nextDamageMultiplier: 1,
  nextEnemyDamageMultiplier: 1,
  nextEffectivenessMultiplier: 1,
  nextActionSpeedMultiplier: 1,
  recoveryWindowUntilMs: undefined,
  recoveryWindowMultiplier: undefined,
  reinforcedRecoveryUntilMs: undefined,
  reinforcedRecoveryMultiplier: undefined,
  stasisCollapseUntilMs: undefined,
  nextManaRefundPercent: 0,
  nextCritChanceBonus: 0,
  nextCritDamageBonus: 0,
  nextGuaranteedCrit: false,
  failedCritStreak: 0,
  costBandHistory: [],
  castLoadoutSlots: [],
  echoCharges: 0,
  manualCharges: 0,
  manualCastCount: 0,
  consecutiveAutoCasts: 0,
  consecutiveManualCasts: 0,
  sovereigntyCharges: 0,
  lastWordUsed: false,
  victoryMomentumReady: false,
  ruinTransferReady: false,
  ruinTransferMultiplier: 1,
  ruinStacks: 0,
  chainReactionReady: false,
  burstWindowReady: false,
  arcaneOverloadReady: false,
  arcaneEchoReady: false,
  cataclysmUsed: false,
  limitBreakUsed: false,
  recentManaSpend: [],
  manaSpendSequence: 0,
  reservoirCycleTriggeredAtMs: undefined,
  reservoirCycleTriggeredSpendSequence: 0,
  reservoirCycleReady: false,
  manaCollapseReady: false,
  manaCollapseLastAtMs: undefined,
  emergencyConversionReady: false,
  dualMindPreparedOrigin: undefined,
  dualMindPreparedUntilMs: undefined,
  overchannelTriggeredAtMs: undefined,
  overchannelTriggeredSpendSequence: 0,
  overchannelSpendFloorSequence: 0,
  artifactManaShiftReady: false,
  artifactManaShiftLastAtMs: undefined,
  nextManaRestoreFlat: 0,
  arcaneCoreEventLastAtMs: {},
  refuseDeathUsed: false,
  secondWindUsed: false,
  refuseDeathThresholdUsed: false,
  deepBreathingUsed: false,
  controlledTempoUsed: false,
  lastSurvivalToken: undefined,
  immortalGuardUsed: false,
  overflowCharges: 0,
  singularityUsed: false,
  absoluteStasisUsed: false,
  stolenTimeStacks: 0,
  totalEnemyDelayMs: 0,
  timelineDelayCreditMs: 0,
})

export const resetArcaneCoreCombatRuntime = (state: GameState) => { state.combat.arcaneCoreRuntime = createArcaneCoreRuntime() }

/** Advances the monotonic Arcane Core clock exactly once for each simulated combat slice. */
export const advanceArcaneCoreRuntimeTime = (state: GameState, deltaMs: number) => {
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0
  state.combat.arcaneCoreRuntime.elapsedMs = Math.max(0, state.combat.arcaneCoreRuntime.elapsedMs + delta)
}

/** Encounter-scoped Arcane Core counters reset between enemies without touching the saved profile. */
export const resetArcaneCoreEncounterRuntime = (state: GameState) => {
  const runtime = state.combat.arcaneCoreRuntime
  runtime.encounterStartedAtMs = runtime.elapsedMs
  runtime.autoCastCount = 0
  runtime.damagingSpellCount = 0
  runtime.spellCastCount = 0
  runtime.cooldownPulseSpellCount = 0
  runtime.survivalInstinctUsed = false
  runtime.lastCastOrigin = null
  runtime.lastSpellId = null
  runtime.lastLoadoutSlotIndex = null
  runtime.recentSpellSequence = []
  runtime.recentDamagingSpellSequence = []
  runtime.recentLoadoutSlotSequence = []
  runtime.alternatingCastStreak = 0
  runtime.enemyDamagingSpellCount = 0
  runtime.nextDamageMultiplier = 1
  runtime.nextEffectivenessMultiplier = 1
  runtime.nextActionSpeedMultiplier = 1
  runtime.recoveryWindowUntilMs = undefined
  runtime.recoveryWindowMultiplier = undefined
  runtime.reinforcedRecoveryUntilMs = undefined
  runtime.reinforcedRecoveryMultiplier = undefined
  runtime.stasisCollapseUntilMs = undefined
  runtime.nextManaRefundPercent = 0
  runtime.nextCritChanceBonus = 0
  runtime.nextCritDamageBonus = 0
  runtime.nextGuaranteedCrit = false
  runtime.failedCritStreak = 0
  runtime.lastSuccessfulCastAtMs = undefined
  runtime.nextLowCostDamageMultiplier = undefined
  runtime.costBandHistory = []
  runtime.lastWordUsed = false
  runtime.sovereigntyCharges = getArcaneCoreSpecialEffects(state.arcaneCore).some((effect) => effect.type === 'arcane-core-mechanic' && effect.displayName === 'Sovereign Casting') ? 3 : 0
  runtime.nextNonCritDamageMultiplier = undefined
  runtime.criticalFeedbackLastAtMs = undefined
  runtime.criticalRecoveryLastAtMs = undefined
  runtime.nextCritChanceBonus = 0
  runtime.ruinStacks = 0
  runtime.arcaneOverloadReady = false
  runtime.arcaneEchoReady = false
  runtime.burstWindowReady = false
  runtime.cataclysmUsed = false
  runtime.limitBreakUsed = false
  runtime.recentManaSpend = []
  runtime.manaSpendSequence = 0
  runtime.reservoirCycleTriggeredAtMs = undefined
  runtime.reservoirCycleTriggeredSpendSequence = 0
  runtime.reservoirCycleReady = false
  runtime.manaCollapseReady = false
  runtime.manaCollapseLastAtMs = undefined
  runtime.emergencyConversionReady = false
  runtime.dualMindPreparedOrigin = undefined
  runtime.dualMindPreparedUntilMs = undefined
  runtime.nextManaRestoreFlat = 0
  runtime.arcaneCoreEventLastAtMs = {}
  runtime.refuseDeathUsed = false
  runtime.secondWindUsed = false
  runtime.refuseDeathThresholdUsed = false
  runtime.deepBreathingUsed = false
  runtime.controlledTempoUsed = false
  runtime.lastSurvivalToken = undefined
  runtime.barrierMemoryMultiplier = undefined
  runtime.barrierMemoryUntilMs = undefined
  runtime.arcaneAegisLastAtMs = undefined
  // Immortal Guard is explicitly once per dungeon run and survives enemy spawn.
  runtime.immortalGuardUntilMs = undefined
  runtime.undyingUntilMs = undefined
  runtime.overflowCharges = 0
  runtime.singularityUsed = false
  runtime.singularityUntilMs = undefined
  runtime.perfectTimingUntilMs = undefined
  runtime.temporalFractureCount = 0
  runtime.stolenTimeStacks = 0
  runtime.absoluteStasisUsed = false
  runtime.absoluteStasisUntilMs = undefined
  // Victory Momentum and the next-enemy damage tokens intentionally survive.
  runtime.apotheosisUntilMs = undefined
  runtime.overchannelUntilMs = undefined
  runtime.overchannelTriggeredAtMs = undefined
  runtime.overchannelTriggeredSpendSequence = 0
  runtime.overchannelSpendFloorSequence = 0
  runtime.artifactManaShiftReady = false
  runtime.artifactManaShiftLastAtMs = undefined
  runtime.manaRegenDisabledUntilMs = undefined
  runtime.nextHealingActionSpeedMultiplier = undefined
  runtime.nextSelfTargetActionSpeedMultiplier = undefined
  runtime.castLoadoutSlots = []
  runtime.echoCharges = 0
  runtime.manualCharges = 0
  runtime.manualCastCount = 0
  runtime.consecutiveAutoCasts = 0
  runtime.consecutiveManualCasts = 0
  runtime.nextAutoRefundPercent = undefined
  runtime.nextControlStatusDurationMultiplier = undefined
  runtime.controlStatusApplications = 0
  runtime.lastDamageTakenAtMs = undefined
  runtime.renewalLastAtMs = undefined
  runtime.arcaneCoreEventLastAtMs = {}
}
