import type { ArcaneCoreState, GameState } from '../../types'
import { getArcaneCoreSpecialEffects } from './arcaneCoreProgression'
import { selectFreeFocus, selectUsedFocus } from '../focus/focusReservations'
import { commitArcaneCoreV6SpellCast, tryConsumeArcaneCoreV6Survival, type ArcaneCoreSpellCastContext } from './arcaneCoreV6Runtime'

const special = (state: Pick<ArcaneCoreState, 'nodes'>, type: import('../../types').ArcaneCoreSpecialEffect['type']) => getArcaneCoreSpecialEffects(state).filter((effect) => effect.type === type)

export const isArcaneCoreSpellFree = (state: Pick<GameState, 'arcaneCore' | 'combat'>) => {
  const nextCast = state.combat.arcaneCoreRuntime.spellCastCount + 1
  return special(state.arcaneCore, 'nth-spell-free').some((effect) => effect.type === 'nth-spell-free' && nextCast % effect.every === 0)
}

export const getArcaneCoreDynamicSpellPower = (state: Pick<GameState, 'arcaneCore' | 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'player'>) => {
  const perReservedFocus = special(state.arcaneCore, 'reserved-focus-spell-power').reduce((sum, effect) => effect.type === 'reserved-focus-spell-power' ? sum + effect.spellPowerPerReservedFocus : sum, 0)
  return selectUsedFocus(state) * perReservedFocus
}

export const getArcaneCoreDynamicManaRegen = (state: Pick<GameState, 'arcaneCore' | 'activities' | 'progress' | 'equipment' | 'artifactProgress' | 'player'>) => {
  const perFreeFocus = special(state.arcaneCore, 'free-focus-mana-regen').reduce((sum, effect) => effect.type === 'free-focus-mana-regen' ? sum + effect.manaRegenPerFreeFocus : sum, 0)
  return selectFreeFocus(state) * perFreeFocus
}

export const beginArcaneCoreSpellCast = (state: GameState, damaging: boolean, context?: ArcaneCoreSpellCastContext) => {
  if (context) {
    const v6 = commitArcaneCoreV6SpellCast(state, context)
    const runtime = state.combat.arcaneCoreRuntime
    const cooldownPulse = special(state.arcaneCore, 'nth-spell-cooldown-pulse').some((effect) => effect.type === 'nth-spell-cooldown-pulse' && runtime.spellCastCount % effect.every === 0)
    if (cooldownPulse) runtime.cooldownPulseSpellCount += 1
    return { ...v6, cooldownPulse }
  }
  const runtime = state.combat.arcaneCoreRuntime
  runtime.spellCastCount += 1
  if (damaging) runtime.damagingSpellCount += 1
  const free = special(state.arcaneCore, 'nth-spell-free').some((effect) => effect.type === 'nth-spell-free' && runtime.spellCastCount % effect.every === 0)
  const damageMultiplier = special(state.arcaneCore, 'nth-damaging-spell-bonus').reduce((multiplier, effect) => effect.type === 'nth-damaging-spell-bonus' && runtime.damagingSpellCount % effect.every === 0 ? multiplier * effect.damageMultiplier : multiplier, 1)
  const cooldownPulse = special(state.arcaneCore, 'nth-spell-cooldown-pulse').some((effect) => effect.type === 'nth-spell-cooldown-pulse' && runtime.spellCastCount % effect.every === 0)
  if (cooldownPulse) runtime.cooldownPulseSpellCount += 1
  return { free, damageMultiplier, cooldownPulse, effectivenessMultiplier: 1, actionSpeedMultiplier: 1, manaCostMultiplier: 1, manaRefundPercent: 0, manaRestoreFlat: 0, critChanceBonus: 0, critDamageBonus: 0, guaranteedCrit: false, statusDurationMultiplier: 1 }
}

export const getArcaneCoreCooldownPulseReduction = (state: Pick<GameState, 'arcaneCore' | 'combat'>) => {
  const count = state.combat.arcaneCoreRuntime.spellCastCount
  return special(state.arcaneCore, 'nth-spell-cooldown-pulse').reduce((reduction, effect) => effect.type === 'nth-spell-cooldown-pulse' && count % effect.every === 0 ? Math.max(reduction, effect.cooldownReductionMs) : reduction, 0)
}

export const tryConsumeArcaneCoreSurvival = (state: GameState) => {
  if (tryConsumeArcaneCoreV6Survival(state)) return true
  const effect = special(state.arcaneCore, 'lethal-survival')[0]
  if (!effect || effect.type !== 'lethal-survival' || !effect.oncePerDungeonRun || state.combat.arcaneCoreRuntime.survivalInstinctUsed) return false
  state.combat.arcaneCoreRuntime.survivalInstinctUsed = true
  return true
}

export const resetArcaneCoreCombatRuntime = (state: GameState) => {
  state.combat.arcaneCoreRuntime = { elapsedMs: 0, autoCastCount: 0, damagingSpellCount: 0, spellCastCount: 0, cooldownPulseSpellCount: 0, survivalInstinctUsed: false, lastCastOrigin: 'auto', lastSpellId: null, lastLoadoutSlotIndex: null, differentSpellStreak: 0, alternatingCastStreak: 0, enemyDamagingSpellCount: 0, nextDamageMultiplier: 1, nextEffectivenessMultiplier: 1, nextActionSpeedMultiplier: 1, nextManaRefundPercent: 0, nextCritChanceBonus: 0, nextCritDamageBonus: 0, nextGuaranteedCrit: false, failedCritStreak: 0, costBandHistory: [], castLoadoutSlots: [], echoCharges: 0, manualCharges: 0, manualCastCount: 0, differentLoadoutSlotStreak: 0, consecutiveAutoCasts: 0, consecutiveManualCasts: 0, sovereigntyCharges: 0, lastWordUsed: false, victoryMomentumReady: false, ruinStacks: 0, chainReactionReady: false, refuseDeathUsed: false, lastSurvivalToken: undefined, immortalGuardUsed: false, overflowCharges: 0, singularityUsed: false, absoluteStasisUsed: false, stolenTimeStacks: 0 }
}

/** Advances the monotonic V6 clock exactly once for each simulated combat slice. */
export const advanceArcaneCoreV6RuntimeTime = (state: GameState, deltaMs: number) => {
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0
  state.combat.arcaneCoreRuntime.elapsedMs = Math.max(0, state.combat.arcaneCoreRuntime.elapsedMs + delta)
}

/** Encounter-scoped V6 counters reset between enemies without touching the saved profile. */
export const resetArcaneCoreEncounterRuntime = (state: GameState) => {
  const runtime = state.combat.arcaneCoreRuntime
  runtime.elapsedMs = 0
  runtime.autoCastCount = 0
  runtime.damagingSpellCount = 0
  runtime.spellCastCount = 0
  runtime.cooldownPulseSpellCount = 0
  runtime.survivalInstinctUsed = false
  runtime.lastCastOrigin = 'auto'
  runtime.lastSpellId = null
  runtime.lastLoadoutSlotIndex = null
  runtime.differentSpellStreak = 0
  runtime.alternatingCastStreak = 0
  runtime.enemyDamagingSpellCount = 0
  runtime.nextDamageMultiplier = 1
  runtime.nextEffectivenessMultiplier = 1
  runtime.nextActionSpeedMultiplier = 1
  runtime.nextManaRefundPercent = 0
  runtime.nextCritChanceBonus = 0
  runtime.nextCritDamageBonus = 0
  runtime.nextGuaranteedCrit = false
  runtime.failedCritStreak = 0
  runtime.lastSuccessfulCastAtMs = undefined
  runtime.nextLowCostDamageMultiplier = undefined
  runtime.costBandHistory = []
  runtime.lastWordUsed = false
  runtime.sovereigntyCharges = 0
  runtime.nextNonCritDamageMultiplier = undefined
  runtime.criticalFeedbackLastAtMs = undefined
  runtime.nextCritChanceBonus = 0
  runtime.ruinStacks = 0
  runtime.chainReactionReady = false
  runtime.refuseDeathUsed = false
  runtime.lastSurvivalToken = undefined
  runtime.barrierMemoryMultiplier = undefined
  runtime.barrierMemoryUntilMs = undefined
  runtime.immortalGuardUsed = false
  runtime.immortalGuardUntilMs = undefined
  runtime.overflowCharges = 0
  runtime.singularityUsed = false
  runtime.perfectTimingUntilMs = undefined
  runtime.temporalFractureCount = 0
  runtime.stolenTimeStacks = 0
  runtime.absoluteStasisUsed = false
  runtime.absoluteStasisUntilMs = undefined
  runtime.victoryMomentumReady = false
  runtime.apotheosisUntilMs = undefined
  runtime.overchannelUntilMs = undefined
  runtime.manaRegenDisabledUntilMs = undefined
  runtime.nextHealingActionSpeedMultiplier = undefined
  runtime.nextSelfTargetActionSpeedMultiplier = undefined
  runtime.castLoadoutSlots = []
  runtime.echoCharges = 0
  runtime.manualCharges = 0
  runtime.manualCastCount = 0
  runtime.differentLoadoutSlotStreak = 0
  runtime.consecutiveAutoCasts = 0
  runtime.consecutiveManualCasts = 0
  runtime.lastCastAtFullMana = false
  runtime.nextAutoRefundPercent = undefined
  runtime.lastManaBand = undefined
  runtime.nextControlStatusDurationMultiplier = undefined
  runtime.controlStatusApplications = 0
  runtime.lastDamageTakenAtMs = undefined
}
