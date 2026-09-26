import type { CanonicalSpellId, GameState } from '../../types'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { getActiveBarrier } from '../combat/barrierRuntime'
import type { CombatConditionContext, CombatEffect, CombatEventSink, CombatResolutionContext, CombatSource, CombatTrigger } from '../combat/combatTypes'
import { getArcaneCoreSpecialEffects } from './arcaneCoreProgression'
import { ARCANE_CORE_MECHANIC_REGISTRY } from '../../content/arcaneCore/arcaneCoreMechanics'

export type ArcaneCoreCastOrigin = 'auto' | 'manual-direct' | 'manual-queued'
export type ArcaneCoreCastMode = 'auto' | 'manual'

export const getArcaneCoreCastMode = (origin: ArcaneCoreCastOrigin): ArcaneCoreCastMode => origin === 'auto' ? 'auto' : 'manual'

export interface ArcaneCoreSpellCastContext {
  origin: ArcaneCoreCastOrigin
  spellId: CanonicalSpellId
  loadoutSlotIndex: number | null
  damaging: boolean
  nominalManaCost: number
  maxMana: number
  playerMana: number
  enemyHealthPercent: number
  paidMana?: number
  manaBeforeCost?: number
  manaAfterCost?: number
  manaWasFullAtStart?: boolean
  previousCastOrigin?: ArcaneCoreCastOrigin | null
  previousConsecutiveAutoCasts?: number
}

export interface ArcaneCoreCastModifiers {
  free: boolean
  damageMultiplier: number
  effectivenessMultiplier: number
  actionSpeedMultiplier: number
  manaCostMultiplier: number
  manaRefundPercent: number
  manaRestoreFlat: number
  manaOverflowBarrier: number
  critChanceBonus: number
  critDamageBonus: number
  guaranteedCrit: boolean
  statusDurationMultiplier: number
}

const rankValue = (rank: number, values: readonly number[]) => values[Math.max(1, Math.min(values.length, Math.floor(rank))) - 1] ?? values[values.length - 1] ?? 0
export const advanceNoRepeatSequence = <T>(sequence: readonly T[], value: T): T[] => sequence.includes(value) ? [value] : [...sequence, value]
type ArcaneCoreMechanicEntry = Extract<ReturnType<typeof getArcaneCoreSpecialEffects>[number], { type: 'arcane-core-mechanic' }> & { behavior: (typeof ARCANE_CORE_MECHANIC_REGISTRY)[string]['runtime'] }
const entries = (state: Pick<GameState, 'arcaneCore'>): ArcaneCoreMechanicEntry[] => getArcaneCoreSpecialEffects(state.arcaneCore).flatMap((effect) => {
  if (effect.type !== 'arcane-core-mechanic') return []
  const behavior = ARCANE_CORE_MECHANIC_REGISTRY[effect.mechanicId]?.runtime
  const registration = ARCANE_CORE_MECHANIC_RUNTIME_HANDLER_REGISTRATIONS[effect.mechanicId]
  return behavior && registration ? [{ ...effect, behavior }] : []
})

type ArcaneCoreEffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => void
const controlStatusIds = new Set(['chilled', 'frozen', 'tremored', 'stunned', 'entangled', 'silenced'])
const rankPercent = (rank: number, values: readonly number[]) => rankValue(rank, values)
const ARCANE_CORE_MECHANIC_IDS: Record<string, string> = {
  opportunist: 'power:r1:S5', arcaneSpark: 'power:r1:S3', overcharge: 'power:r1:S4', finisher: 'power:r1:S6', openingVolley: 'power:r1:S7', manaEdge: 'power:r1:S8', unstablePower: 'power:r1:M',
  criticalFeedback: 'power:r2:S3', criticalRecovery: 'power:r2:S4',
  perfectWindow: 'power:r2:S5', markedPrecision: 'power:r2:S6', criticalFinish: 'power:r2:S8', perfectPrecision: 'power:r2:M',
  spellSequence: 'power:r3:S3', arcaneMomentum: 'power:r3:S4', rapidEscalation: 'power:r3:S5', heavyFollowUp: 'power:r3:S6', debuffAssault: 'power:r3:S7', executionChain: 'power:r3:S8', arcaneOverload: 'power:r3:M',
  criticalCascade: 'power:r4:S3', killSurge: 'power:r4:S4', burstWindow: 'power:r4:S5', aggressiveRotation: 'power:r4:S6', risingViolence: 'power:r4:S7', cooldownPunisher: 'power:r4:S8', perfectExecution: 'power:r4:M',
  burningMomentum: 'power:r5:S3', detonationTheory: 'power:r5:S4', lingeringExecution: 'power:r5:S5', ruinTransfer: 'power:r5:S6', corrodedDefense: 'power:r5:S7', deepWounds: 'power:r5:S8', chainReaction: 'power:r5:M',
  overcast: 'power:r6:S3', manaBurn: 'power:r6:S4', cataclysmicReserve: 'power:r6:S5', criticalCataclysm: 'power:r6:S6', unstableRotation: 'power:r6:S7', desperatePower: 'power:r6:S8', cataclysm: 'power:r6:M',
  sovereignSequence: 'power:r7:S3', firstBlood: 'power:r7:S4', lastWord: 'power:r7:S5', dominatingWeakness: 'power:r7:S6', sovereignCrit: 'power:r7:S7', victoryMomentum: 'power:r7:S8', sovereignCasting: 'power:r7:M',
  perfectCycle: 'power:r8:S3', arcaneEcho: 'power:r8:S4', apotheosisExecution: 'power:r8:S5', apotheosisRuin: 'power:r8:S6', limitBreak: 'power:r8:S7', absoluteMomentum: 'power:r8:S8', arcaneApotheosis: 'power:r8:M',
  secondSkin: 'vitality:r1:S3', emergencyPulse: 'vitality:r1:S4', protectiveCasting: 'vitality:r1:S5', recoveryWindowVitality: 'vitality:r1:S6', overhealWard: 'vitality:r1:S7', victoryRecovery: 'vitality:r1:S8', refuseDeath: 'vitality:r1:M',
  stonewall: 'vitality:r2:S3', reinforcedWard: 'vitality:r2:S4', painToMana: 'vitality:r2:S5', barrierRecovery: 'vitality:r2:S6', guardedRecovery: 'vitality:r2:S7', lowHealthGuard: 'vitality:r2:S8', unyielding: 'vitality:r2:M',
  reactiveWard: 'vitality:r3:S3', wardRenewal: 'vitality:r3:S4', barrierMemory: 'vitality:r3:S5', aegisMomentum: 'vitality:r3:S6', stableProtection: 'vitality:r3:S7', barrierPulse: 'vitality:r3:S8', arcaneAegis: 'vitality:r3:M',
  lastBreath: 'vitality:r4:S3', emergencyAegis: 'vitality:r4:S4', crisisConversion: 'vitality:r4:S5', ironWill: 'vitality:r4:S6', recoverySurge: 'vitality:r4:S7', survivalInstinct: 'vitality:r4:S8', immortalGuard: 'vitality:r4:M',
  fortress: 'vitality:r5:S3', layeredWard: 'vitality:r5:S4', wardBattery: 'vitality:r5:S5', bastionCast: 'vitality:r5:S6', reinforcedRecovery: 'vitality:r5:S7', safeOffensive: 'vitality:r5:S8', livingBastion: 'vitality:r5:M',
  regenerativeCasting: 'vitality:r6:S3', healingMomentum: 'vitality:r6:S4', overflowingLife: 'vitality:r6:S5', barrierBreakRecovery: 'vitality:r6:S6', renewalCycle: 'vitality:r6:S7', victoryRenewal: 'vitality:r6:S8', renewal: 'vitality:r6:M',
  lastRefuge: 'vitality:r7:S3', defiantCasting: 'vitality:r7:S4', painConversion: 'vitality:r7:S5', undyingWill: 'vitality:r7:S6', comeback: 'vitality:r7:S7', victoryRestoration: 'vitality:r7:S8', undying: 'vitality:r7:M',
  perfectRestoration: 'vitality:r8:S3', eternalFortress: 'vitality:r8:S4', phoenixPulse: 'vitality:r8:S5', lifeBattery: 'vitality:r8:S6', unbrokenCycle: 'vitality:r8:S7', eternalRecovery: 'vitality:r8:S8', eternalAegis: 'vitality:r8:M',
  conservation: 'mana:r1:S5', emergencyFlow: 'mana:r1:S6', fullReservoir: 'mana:r1:S7', quietMind: 'mana:r1:S8', deepBreathing: 'mana:r1:M',
  castingHarmony: 'mana:r2:S5', manualReservoir: 'mana:r2:S6', alternatingMind: 'mana:r2:S7', efficientQueue: 'mana:r2:S8', dualMind: 'mana:r2:M',
  highCurrent: 'mana:r3:S5', lowTide: 'mana:r3:S6', spellCycle: 'mana:r3:S7', preparedSlot: 'mana:r3:S8', arcaneRecirculation: 'mana:r3:M',
  overflowWard: 'mana:r4:S5', manaToTempo: 'mana:r4:S6', stableReserve: 'mana:r4:S7', emergencyConversion: 'mana:r4:S8', transcendence: 'mana:r4:M',
  balancedMind: 'mana:r5:S5', manualBattery: 'mana:r5:S6', convergentQueue: 'mana:r5:S7', reservoirCycle: 'mana:r5:S8', deepReservoir: 'mana:r5:M',
  overchannelRecovery: 'mana:r6:S5', deepDraw: 'mana:r6:S6', arcaneReturn: 'mana:r6:S7', reservoirBreak: 'mana:r6:S8', overchannelMajor: 'mana:r6:M',
  astralReserve: 'mana:r7:S5', astralRelease: 'mana:r7:S6', astralRotation: 'mana:r7:S7', astralCascade: 'mana:r7:S8', astralEquilibrium: 'mana:r7:M',
  zeroPoint: 'mana:r8:S5', eventHorizon: 'mana:r8:S6', singularityManual: 'mana:r8:S7', manaCollapse: 'mana:r8:S8', arcaneSingularity: 'mana:r8:M',
  delayedFate: 'control:r1:S3', openingControl: 'control:r1:S4', controlledStrike: 'control:r1:S5', recoveryWindowControl: 'control:r1:S6', manualTiming: 'control:r1:S7', tempoTheft: 'control:r1:S8', temporalFlow: 'control:r1:M',
  layeredControl: 'control:r2:S3', controlledFlow: 'control:r2:S4', debuffPressure: 'control:r2:S5', slowBurn: 'control:r2:S6', suppressionWindow: 'control:r2:S7', controlRefresh: 'control:r2:S8', perfectTiming: 'control:r2:M',
  chainControl: 'control:r3:S3', dominatingWeaknessControl: 'control:r3:S4', suppressedEnemy: 'control:r3:S5', statusEcho: 'control:r3:S6', queuedDominion: 'control:r3:S7', timelineBreak: 'control:r3:S8', dominion: 'control:r3:M',
  aftershock: 'control:r4:S3', tremorLock: 'control:r4:S4', coldPrecision: 'control:r4:S5', controlConversion: 'control:r4:S6', absolutePressure: 'control:r4:S7', actionDenial: 'control:r4:S8', arcaneLock: 'control:r4:M',
  spellInterference: 'control:r5:S3', statusFracture: 'control:r5:S4', interferencePulse: 'control:r5:S5', debuffTheft: 'control:r5:S6', manualDisruption: 'control:r5:S7', interferenceChain: 'control:r5:S8', temporalFracture: 'control:r5:M',
  preparedCast: 'control:r6:S3', queuedPrecision: 'control:r6:S4', stolenTime: 'control:r6:S5', temporalRefund: 'control:r6:S6', precisionWindow: 'control:r6:S7', chronoCycle: 'control:r6:S8', timeCompression: 'control:r6:M',
  lockdownDelay: 'control:r7:S3', controlCascade: 'control:r7:S4', tacticalQueue: 'control:r7:S5', controlledTarget: 'control:r7:S6', controlledSuppression: 'control:r7:S7', noEscape: 'control:r7:S8', totalLockdown: 'control:r7:M',
  absoluteDelay: 'control:r8:S3', statusRecursion: 'control:r8:S4', timelineTheft: 'control:r8:S5', absoluteQueue: 'control:r8:S6', stasisCollapse: 'control:r8:S7', endlessPressure: 'control:r8:S8', absoluteStasis: 'control:r8:M',
  secondChance: 'power:r2:S7',
  // Keep the stable branch/ring/slot identity of the ranked save data,
  // while replacing the authored mechanic set. These aliases let the mature
  // event adapter continue to consume the new authored markers safely.
  ...({
    opportunist: 'power:r1:S5', finisher: 'power:r1:S6', openingVolley: 'power:r1:S7', manaEdge: 'power:r1:S8', arcaneRhythm: 'power:r1:M',
    criticalRecovery: 'power:r2:S5', markedPrecision: 'power:r2:S6', secondChance: 'power:r2:S7', perfectWindow: 'power:r2:S8', perfectPrecision: 'power:r2:M',
    spellSequence: 'power:r3:S5', arcaneMomentum: 'power:r3:S6', rapidEscalation: 'power:r3:S7', debuffAssault: 'power:r3:S8', arcaneOverload: 'power:r3:M',
    killSurge: 'power:r4:S5', burstWindow: 'power:r4:S6', aggressiveRotation: 'power:r4:S7', cooldownPunisher: 'power:r4:S8', perfectExecution: 'power:r4:M',
    burningMomentum: 'power:r5:S5', detonationTheory: 'power:r5:S6', lingeringExecution: 'power:r5:S7', deepWounds: 'power:r5:S8', unstablePower: 'power:r5:M',
    overcast: 'power:r6:S5', manaBurn: 'power:r6:S6', cataclysmicReserve: 'power:r6:S7', criticalCataclysm: 'power:r6:S8', cataclysm: 'power:r6:M',
    sovereignSequence: 'power:r7:S5', firstBlood: 'power:r7:S6', lastWord: 'power:r7:S7', dominatingWeakness: 'power:r7:S8', sovereignCasting: 'power:r7:M',
    perfectCycle: 'power:r8:S5', arcaneEcho: 'power:r8:S6', apotheosisExecution: 'power:r8:S7', limitBreak: 'power:r8:S8', arcaneApotheosis: 'power:r8:M',
    secondSkin: 'vitality:r1:S5', emergencyPulse: 'vitality:r1:S6', recoveryWindowVitality: 'vitality:r1:S7', victoryRecovery: 'vitality:r1:S8', secondWind: 'vitality:r1:M',
    stonewall: 'vitality:r2:S5', barrierRecovery: 'vitality:r2:S6', guardedRecovery: 'vitality:r2:S7', lowHealthGuard: 'vitality:r2:S8', unyielding: 'vitality:r2:M',
    reactiveWard: 'vitality:r3:S5', wardRenewal: 'vitality:r3:S6', barrierMemory: 'vitality:r3:S7', stableProtection: 'vitality:r3:S8', arcaneAegis: 'vitality:r3:M',
    lastBreath: 'vitality:r4:S5', emergencyAegis: 'vitality:r4:S6', recoverySurge: 'vitality:r4:S7', survivalInstinct: 'vitality:r4:S8', livingBastion: 'vitality:r4:M',
    layeredWard: 'vitality:r5:S5', wardBattery: 'vitality:r5:S6', bastionCast: 'vitality:r5:S7', reinforcedRecovery: 'vitality:r5:S8', renewal: 'vitality:r5:M',
    regenerativeCasting: 'vitality:r6:S5', healingMomentum: 'vitality:r6:S6', barrierBreakRecovery: 'vitality:r6:S7', renewalCycle: 'vitality:r6:S8', refuseDeath: 'vitality:r6:M',
    lastRefuge: 'vitality:r7:S5', defiantCasting: 'vitality:r7:S6', painConversion: 'vitality:r7:S7', comeback: 'vitality:r7:S8', undying: 'vitality:r7:M',
    phoenixPulse: 'vitality:r8:S5', lifeBattery: 'vitality:r8:S6', unbrokenCycle: 'vitality:r8:S7', eternalRecovery: 'vitality:r8:S8', eternalAegis: 'vitality:r8:M',
    conservation: 'mana:r1:S5', emergencyFlow: 'mana:r1:S6', fullReservoir: 'mana:r1:S7', quietMind: 'mana:r1:S8', deepBreathing: 'mana:r1:M',
    castingHarmony: 'mana:r2:S5', manualReservoir: 'mana:r2:S6', alternatingMind: 'mana:r2:S7', efficientQueue: 'mana:r2:S8', dualMind: 'mana:r2:M',
    highCurrent: 'mana:r3:S5', lowTide: 'mana:r3:S6', spellCycle: 'mana:r3:S7', preparedSlot: 'mana:r3:S8', arcaneRecirculation: 'mana:r3:M',
    overflowWard: 'mana:r4:S5', manaToTempo: 'mana:r4:S6', stableReserve: 'mana:r4:S7', emergencyConversion: 'mana:r4:S8', transcendence: 'mana:r4:M',
    balancedMind: 'mana:r5:S5', manualBattery: 'mana:r5:S6', convergentQueue: 'mana:r5:S7', reservoirCycle: 'mana:r5:S8', deepReservoir: 'mana:r5:M',
    overchannelRecovery: 'mana:r6:S5', deepDraw: 'mana:r6:S6', arcaneReturn: 'mana:r6:S7', reservoirBreak: 'mana:r6:S8', overchannelMajor: 'mana:r6:M',
    astralReserve: 'mana:r7:S5', astralRelease: 'mana:r7:S6', astralRotation: 'mana:r7:S7', astralCascade: 'mana:r7:S8', astralEquilibrium: 'mana:r7:M',
    zeroPoint: 'mana:r8:S5', eventHorizon: 'mana:r8:S6', singularityManual: 'mana:r8:S7', manaCollapse: 'mana:r8:S8', arcaneSingularity: 'mana:r8:M',
    openingControl: 'control:r1:S5', controlledStrike: 'control:r1:S6', recoveryWindowControl: 'control:r1:S7', tempoTheft: 'control:r1:S8', controlledTempo: 'control:r1:M',
    layeredControl: 'control:r2:S5', controlledFlow: 'control:r2:S6', debuffPressure: 'control:r2:S7', controlRefresh: 'control:r2:S8', suppressionWindow: 'control:r2:M',
    chainControl: 'control:r3:S5', statusEcho: 'control:r3:S6', queuedDominion: 'control:r3:S7', suppressedEnemy: 'control:r3:S8', temporalFlow: 'control:r3:M',
    aftershock: 'control:r4:S5', tremorLock: 'control:r4:S6', coldPrecision: 'control:r4:S7', controlConversion: 'control:r4:S8', perfectTiming: 'control:r4:M',
    spellInterference: 'control:r5:S5', statusFracture: 'control:r5:S6', debuffTheft: 'control:r5:S7', manualDisruption: 'control:r5:S8', dominion: 'control:r5:M',
    preparedCast: 'control:r6:S5', queuedPrecision: 'control:r6:S6', temporalRefund: 'control:r6:S7', chronoCycle: 'control:r6:S8', temporalFracture: 'control:r6:M',
    lockdownDelay: 'control:r7:S5', controlCascade: 'control:r7:S6', controlledTarget: 'control:r7:S7', noEscape: 'control:r7:S8', totalLockdown: 'control:r7:M',
    absoluteDelay: 'control:r8:S5', statusRecursion: 'control:r8:S6', timelineTheft: 'control:r8:S7', stasisCollapse: 'control:r8:S8', absoluteStasis: 'control:r8:M',
  } as Record<string, string>),
} as const
const ARCANE_CORE_RUNTIME_MECHANIC_NAMES = new Set([
  'opportunist', 'finisher', 'openingVolley', 'manaEdge', 'arcaneRhythm', 'criticalRecovery', 'markedPrecision', 'secondChance', 'perfectWindow', 'perfectPrecision',
  'spellSequence', 'arcaneMomentum', 'rapidEscalation', 'debuffAssault', 'arcaneOverload', 'killSurge', 'burstWindow', 'aggressiveRotation', 'cooldownPunisher', 'perfectExecution',
  'burningMomentum', 'detonationTheory', 'lingeringExecution', 'deepWounds', 'unstablePower', 'overcast', 'manaBurn', 'cataclysmicReserve', 'criticalCataclysm', 'cataclysm',
  'sovereignSequence', 'firstBlood', 'lastWord', 'dominatingWeakness', 'sovereignCasting', 'perfectCycle', 'arcaneEcho', 'apotheosisExecution', 'limitBreak', 'arcaneApotheosis',
  'secondSkin', 'emergencyPulse', 'recoveryWindowVitality', 'victoryRecovery', 'secondWind', 'stonewall', 'barrierRecovery', 'guardedRecovery', 'lowHealthGuard', 'unyielding',
  'reactiveWard', 'wardRenewal', 'barrierMemory', 'stableProtection', 'arcaneAegis', 'lastBreath', 'emergencyAegis', 'recoverySurge', 'survivalInstinct', 'livingBastion',
  'layeredWard', 'wardBattery', 'bastionCast', 'reinforcedRecovery', 'renewal', 'regenerativeCasting', 'healingMomentum', 'barrierBreakRecovery', 'renewalCycle', 'refuseDeath',
  'lastRefuge', 'defiantCasting', 'painConversion', 'comeback', 'undying', 'phoenixPulse', 'lifeBattery', 'unbrokenCycle', 'eternalRecovery', 'eternalAegis',
  'conservation', 'emergencyFlow', 'fullReservoir', 'quietMind', 'deepBreathing', 'castingHarmony', 'manualReservoir', 'alternatingMind', 'efficientQueue', 'dualMind',
  'highCurrent', 'lowTide', 'spellCycle', 'preparedSlot', 'arcaneRecirculation', 'overflowWard', 'manaToTempo', 'stableReserve', 'emergencyConversion', 'transcendence',
  'balancedMind', 'manualBattery', 'convergentQueue', 'reservoirCycle', 'deepReservoir', 'overchannelRecovery', 'deepDraw', 'arcaneReturn', 'reservoirBreak', 'overchannelMajor',
  'astralReserve', 'astralRelease', 'astralRotation', 'astralCascade', 'astralEquilibrium', 'zeroPoint', 'eventHorizon', 'singularityManual', 'manaCollapse', 'arcaneSingularity',
  'openingControl', 'controlledStrike', 'recoveryWindowControl', 'tempoTheft', 'controlledTempo', 'layeredControl', 'controlledFlow', 'debuffPressure', 'controlRefresh', 'suppressionWindow',
  'chainControl', 'statusEcho', 'queuedDominion', 'suppressedEnemy', 'temporalFlow', 'aftershock', 'tremorLock', 'coldPrecision', 'controlConversion', 'perfectTiming',
  'spellInterference', 'statusFracture', 'debuffTheft', 'manualDisruption', 'dominion', 'preparedCast', 'queuedPrecision', 'temporalRefund', 'chronoCycle', 'temporalFracture',
  'lockdownDelay', 'controlCascade', 'controlledTarget', 'noEscape', 'totalLockdown', 'absoluteDelay', 'statusRecursion', 'timelineTheft', 'stasisCollapse', 'absoluteStasis',
])

export type ArcaneCoreMechanicRuntimeHandlerFamily = 'arcane-core-mechanic-adapter'
export interface ArcaneCoreMechanicRuntimeHandlerRegistration { family: ArcaneCoreMechanicRuntimeHandlerFamily }

// These registrations are the executable boundary for the compatibility
// adapter. They are keyed from the explicit current Arcane Core mechanic name list,
// not inferred from branch/ring/slot geometry. `entries` below refuses to
// activate an authored mechanic unless it has one of these registrations.
const MECHANIC_RUNTIME_REGISTRATION_NAMES = [...ARCANE_CORE_RUNTIME_MECHANIC_NAMES]
const MECHANIC_RUNTIME_REGISTRATION_ENTRIES = MECHANIC_RUNTIME_REGISTRATION_NAMES.map((name) => [ARCANE_CORE_MECHANIC_IDS[name], { family: 'arcane-core-mechanic-adapter' as const }] as const)
export const ARCANE_CORE_MECHANIC_RUNTIME_HANDLER_REGISTRATIONS: Readonly<Record<string, ArcaneCoreMechanicRuntimeHandlerRegistration>> = Object.fromEntries(MECHANIC_RUNTIME_REGISTRATION_ENTRIES)

export const validateArcaneCoreMechanicRuntimeCoverage = () => {
  const errors: string[] = []
  const duplicateIds = MECHANIC_RUNTIME_REGISTRATION_ENTRIES.map(([id]) => id).filter((id, index, ids) => ids.indexOf(id) !== index)
  duplicateIds.forEach((id) => errors.push(`duplicate Arcane Core Arcane Core runtime registration ${id}`))
  const authoredIds = new Set(Object.keys(ARCANE_CORE_MECHANIC_REGISTRY))
  const registeredIds = new Set(Object.keys(ARCANE_CORE_MECHANIC_RUNTIME_HANDLER_REGISTRATIONS))
  authoredIds.forEach((id) => { if (!registeredIds.has(id)) errors.push(`missing executable Arcane Core Arcane Core runtime registration ${id}`) })
  registeredIds.forEach((id) => { if (!authoredIds.has(id)) errors.push(`orphan Arcane Core Arcane Core runtime registration ${id}`) })
  return errors
}
// The current catalog intentionally prunes retired mechanic names. Keep their typed
// aliases for the compatibility adapter, but make them inert so a new node
// occupying the same stable slot cannot accidentally activate retired logic.
Object.entries(ARCANE_CORE_MECHANIC_IDS).forEach(([name]) => {
  if (!ARCANE_CORE_RUNTIME_MECHANIC_NAMES.has(name)) (ARCANE_CORE_MECHANIC_IDS as Record<string, string>)[name] = `__retired-arcane-core:${name}`
})
const hasMechanic = (state: Pick<GameState, 'arcaneCore'>, mechanicId: string) => entries(state).some((entry) => entry.mechanicId === mechanicId)
const mechanicRank = (state: Pick<GameState, 'arcaneCore'>, mechanicId: string) => entries(state).find((entry) => entry.mechanicId === mechanicId)?.rank ?? 0

export const getArcaneCoreManaRegenMultiplier = (state: GameState | Pick<GameState, 'arcaneCore' | 'player'>) => {
  const rank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.emergencyFlow)
  const runtime = 'combat' in state ? state.combat.arcaneCoreRuntime : undefined
  if (runtime?.manaRegenDisabledUntilMs && runtime.manaRegenDisabledUntilMs > runtime.elapsedMs) return 0
  return rank > 0 && state.player.mana / Math.max(1, state.player.maxMana) < 0.25 ? 1 + rankValue(rank, [0.05, 0.10, 0.15, 0.20, 0.25]) : 1
}

const isControlEvent = (context: CombatConditionContext) => Boolean(context.eventStatusTags?.includes('control') || (context.statusId && controlStatusIds.has(context.statusId)))
const isNegativeStatusEvent = (context: CombatConditionContext) => Boolean(context.statusId && STATUS_DEFINITIONS[context.statusId]?.classification === 'debuff')
const delayEnemyAction = (state: GameState, amountMs: number) => {
  if (state.combat.enemyActionDurationMs <= 0 || state.combat.enemyActionTimerMs <= 0) return 0
  const before = state.combat.enemyActionTimerMs
  state.combat.enemyActionTimerMs = Math.min(state.combat.enemyActionDurationMs, before + Math.max(0, amountMs))
  const applied = state.combat.enemyActionTimerMs - before
  if (applied <= 0) return 0
  const runtime = state.combat.arcaneCoreRuntime
  const previousDelay = runtime.totalEnemyDelayMs ?? 0
  runtime.totalEnemyDelayMs = previousDelay + applied
  const previousCredit = runtime.timelineDelayCreditMs ?? 0
  const earnedStacks = Math.max(0, Math.floor(runtime.totalEnemyDelayMs / 1000) - Math.floor(previousCredit / 1000))
  if (earnedStacks > 0) {
    runtime.timelineDelayCreditMs = runtime.totalEnemyDelayMs
    if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.timelineTheft)) runtime.stolenTimeStacks = Math.min(5, (runtime.stolenTimeStacks ?? 0) + earnedStacks)
  }
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.absoluteStasis) && !runtime.absoluteStasisUsed && runtime.totalEnemyDelayMs >= 3000) {
    runtime.absoluteStasisUsed = true
    runtime.absoluteStasisUntilMs = runtime.elapsedMs + 3000
  }
  return applied
}
const reduceLongestCooldown = (state: GameState, amountMs: number) => {
  const candidate = Object.entries(state.combat.spellCooldowns).sort((left, right) => right[1] - left[1])[0]
  if (!candidate) return
  state.combat.spellCooldowns[candidate[0] as CanonicalSpellId] = Math.max(0, candidate[1] - Math.max(0, amountMs))
}
const reduceAllCooldowns = (state: GameState, amountMs: number) => Object.keys(state.combat.spellCooldowns).forEach((spellId) => { state.combat.spellCooldowns[spellId as CanonicalSpellId] = Math.max(0, state.combat.spellCooldowns[spellId as CanonicalSpellId] - Math.max(0, amountMs)) })
export const recordArcaneCoreCooldownCompletion = (state: GameState, previousCooldownMs: number, nextCooldownMs: number) => {
  if (previousCooldownMs > 0 && nextCooldownMs <= 0 && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.burstWindow)) {
    state.combat.arcaneCoreRuntime.burstWindowReady = true
  }
}
const arcaneCoreEventReady = (state: GameState, key: string, cooldownMs = 0) => ((state.combat.arcaneCoreRuntime.arcaneCoreEventLastAtMs?.[key] ?? -Infinity) + cooldownMs <= state.combat.arcaneCoreRuntime.elapsedMs)
const markArcaneCoreEvent = (state: GameState, key: string) => { state.combat.arcaneCoreRuntime.arcaneCoreEventLastAtMs = { ...(state.combat.arcaneCoreRuntime.arcaneCoreEventLastAtMs ?? {}), [key]: state.combat.arcaneCoreRuntime.elapsedMs } }

export const getArcaneCoreHealingReceivedBonusPct = (state: Pick<GameState, 'combat'>) => {
  const runtime = state.combat.arcaneCoreRuntime
  const now = runtime.elapsedMs
  const recoveryWindow = runtime.recoveryWindowUntilMs && runtime.recoveryWindowUntilMs > now ? Math.max(0, (runtime.recoveryWindowMultiplier ?? 1) - 1) : 0
  const reinforcedRecovery = runtime.reinforcedRecoveryUntilMs && runtime.reinforcedRecoveryUntilMs > now ? Math.max(0, (runtime.reinforcedRecoveryMultiplier ?? 1) - 1) : 0
  return recoveryWindow + reinforcedRecovery
}

/**
 * Shared event adapter for Arcane Core trigger/conversion mechanics. Authored nodes
 * stay data-driven; this function supplies common status, barrier, health,
 * kill, and timeline hooks to every node that uses those primitives.
 */
export const processArcaneCoreCombatEvent = (state: GameState, actor: 'player' | 'enemy', event: CombatTrigger, context: CombatConditionContext, executeEffects?: ArcaneCoreEffectExecutor, depth = 0, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => {
  if (context.source?.kind === 'arcane-core') return
  const enemyStatusCount = state.combat.enemyStatuses.filter((status) => STATUS_DEFINITIONS[status.statusId]?.classification === 'debuff').length
  const source: CombatSource = { actor: 'player', kind: 'arcane-core', sourceId: 'arcane-core-mechanic', tags: ['special'] }
  const effects: CombatEffect[] = []
  const runtime = state.combat.arcaneCoreRuntime
  const pushHeal = (percent: number) => effects.push({ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: percent } })
  const pushBarrier = (percent: number) => effects.push({ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: percent }, mode: 'add', durationMs: null })
  const pushBarrierFlat = (amount: number, conversionGenerated = false) => effects.push({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: amount }, mode: 'add', durationMs: null, ...(conversionGenerated ? { tags: ['conversion-generated'] as const } : {}) })
  const pushConversionHeal = (percent: number) => effects.push({ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: percent }, tags: ['conversion-generated'] })
  const pushMana = (amount: number) => effects.push({ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: amount } })

  if (event === 'on-status-applied' && actor === 'player' && context.eventTarget === 'enemy') {
    if (isNegativeStatusEvent(context) && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.opportunist)) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.opportunist), [0.01, 0.02, 0.03, 0.04, 0.05]))
    if (isControlEvent(context)) {
      const openingRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.openingControl)
      if (openingRanks && (runtime.controlStatusApplications ?? 0) === 0) delayEnemyAction(state, rankPercent(openingRanks, [50, 100, 150, 200, 250]))
      const layeredRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.layeredControl)
      if (layeredRanks && enemyStatusCount >= 2) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(layeredRanks, [0.01, 0.02, 0.03, 0.04, 0.05]))
      const refreshRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.controlRefresh)
      if (refreshRanks) runtime.nextControlStatusDurationMultiplier = Math.max(runtime.nextControlStatusDurationMultiplier ?? 1, 1 + rankPercent(refreshRanks, [0.01, 0.02, 0.03, 0.04, 0.05]))
      const chainRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.chainControl)
      if (chainRanks && (runtime.controlStatusApplications ?? 0) >= 2) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(chainRanks, [0.01, 0.02, 0.03, 0.04, 0.05]))
      const coldPrecisionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.coldPrecision)
      if (coldPrecisionRanks && state.combat.enemyStatuses.some((status) => controlStatusIds.has(status.statusId))) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(coldPrecisionRanks, [0.015, 0.03, 0.045, 0.06, 0.075]))
      const tremorRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.tremorLock)
      if (tremorRanks) delayEnemyAction(state, rankPercent(tremorRanks, [50, 100, 150, 200, 250]))
      const interferenceRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.spellInterference)
      if (interferenceRanks) delayEnemyAction(state, rankPercent(interferenceRanks, [50, 100, 150, 200, 250]))
      const theftRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.debuffTheft)
      if (theftRanks) pushMana(rankPercent(theftRanks, [1, 2, 3, 4, 5]))
      const temporalRefundRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.temporalRefund)
      if (temporalRefundRanks) reduceLongestCooldown(state, rankPercent(temporalRefundRanks, [40, 80, 120, 160, 200]))
      const chronoRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.chronoCycle)
      if (chronoRanks && (runtime.controlStatusApplications ?? 0) % 4 === 3) delayEnemyAction(state, rankPercent(chronoRanks, [100, 200, 300, 400, 500]))
      const cascadeRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.controlCascade)
      const controlKinds = new Set(state.combat.enemyStatuses.filter((status) => controlStatusIds.has(status.statusId)).map((status) => status.statusId))
      if (cascadeRanks && controlKinds.size >= 3) delayEnemyAction(state, rankPercent(cascadeRanks, [100, 200, 300, 400, 500]))
      const controlRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.delayedFate)
      if (controlRanks) delayEnemyAction(state, rankPercent(controlRanks, [20, 40, 60, 80, 100]))
      const temporalRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.temporalFlow)
      if (temporalRanks && (runtime.controlStatusApplications ?? 0) === 0) { delayEnemyAction(state, 300); runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1.05) }
      const controlledTempoRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.controlledTempo)
      if (controlledTempoRanks && !runtime.controlledTempoUsed) { delayEnemyAction(state, 150); runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1.03); runtime.controlledTempoUsed = true }
      const suppressionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.suppressionWindow)
      if (suppressionRanks && state.combat.enemyActionDurationMs > 0 && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs <= 0.25 && (runtime.perfectTimingUntilMs ?? 0) <= runtime.elapsedMs) { delayEnemyAction(state, 250); runtime.perfectTimingUntilMs = runtime.elapsedMs + 8_000 }
      const timelineRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.timelineBreak)
      if (timelineRanks && (runtime.controlStatusApplications ?? 0) % 4 === 3) delayEnemyAction(state, rankPercent(timelineRanks, [100, 200, 300, 400, 500]))
      const fractureRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.statusFracture)
      if (fractureRanks && enemyStatusCount >= 3) delayEnemyAction(state, rankPercent(fractureRanks, [50, 100, 150, 200, 250]))
      const lockRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.lockdownDelay)
      if (lockRanks) delayEnemyAction(state, rankPercent(lockRanks, [75, 150, 225, 300, 375]))
      const absoluteRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.absoluteDelay)
      if (absoluteRanks) delayEnemyAction(state, rankPercent(absoluteRanks, [100, 200, 300, 400, 500]))
      const controlFlowRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.controlledFlow)
      if (controlFlowRanks) pushMana(rankPercent(controlFlowRanks, [1, 2, 3, 4, 5]))
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.perfectTiming)
        && state.combat.enemyActionDurationMs > 0
        && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs <= 0.25
        && (runtime.perfectTimingUntilMs ?? 0) <= runtime.elapsedMs) {
        delayEnemyAction(state, 500)
        runtime.perfectTimingUntilMs = runtime.elapsedMs + 7_000
      }
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.temporalFracture) && (runtime.controlStatusApplications ?? 0) % 4 === 3) {
        delayEnemyAction(state, 500)
        reduceAllCooldowns(state, 300)
        runtime.temporalFractureCount = (runtime.temporalFractureCount ?? 0) + 1
      }
      const stasisCollapseRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.stasisCollapse)
      if (stasisCollapseRanks && (runtime.controlStatusApplications ?? 0) % 5 === 4) {
        runtime.stasisCollapseUntilMs = runtime.elapsedMs + rankPercent(stasisCollapseRanks, [250, 500, 750, 1000, 1250])
      }
      runtime.controlStatusApplications = (runtime.controlStatusApplications ?? 0) + 1
    }
  }

  if ((event === 'on-status-expired' || event === 'on-status-removed') && context.eventTarget === 'enemy' && isControlEvent(context)) {
    if (event === 'on-status-expired') {
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.statusEcho)) runtime.nextControlStatusDurationMultiplier = 1 + rankPercent(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.statusEcho), [0.02, 0.04, 0.06, 0.08, 0.10])
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.statusRecursion)) runtime.nextControlStatusDurationMultiplier = 1 + rankPercent(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.statusRecursion), [0.03, 0.06, 0.09, 0.12, 0.15])
      const recoveryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.recoveryWindowControl)
      if (recoveryRanks) reduceLongestCooldown(state, rankPercent(recoveryRanks, [40, 80, 120, 160, 200]))
      const noEscapeRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.noEscape)
      if (noEscapeRanks && state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) < 0.25) delayEnemyAction(state, rankPercent(noEscapeRanks, [100, 200, 300, 400, 500]))
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.aftershock)) effects.push({ type: 'apply-status', target: 'opponent', statusId: 'chilled', durationMs: rankPercent(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.aftershock), [1000, 2000, 3000, 4000, 5000]) })
    }
    const conversionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.controlConversion)
    if (event === 'on-status-removed' && conversionRanks) { pushMana(rankPercent(conversionRanks, [1, 2, 3, 4, 5])); reduceLongestCooldown(state, rankPercent(conversionRanks, [100, 200, 300, 400, 500])) }
  }

  if (event === 'on-barrier-broken' && actor === 'player') {
    const breakRecoveryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.barrierBreakRecovery)
    if (breakRecoveryRanks) pushHeal(rankPercent(breakRecoveryRanks, [0.0075, 0.015, 0.0225, 0.03, 0.0375]))
    const emergencyPulseRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.emergencyPulse)
    if (emergencyPulseRanks && arcaneCoreEventReady(state, 'emergency-pulse', 8_000) && state.player.health / Math.max(1, state.player.maxHealth) < 0.5) { pushHeal(rankPercent(emergencyPulseRanks, [0.01, 0.015, 0.02, 0.025, 0.03])); markArcaneCoreEvent(state, 'emergency-pulse') }
    const barrierRecoveryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.barrierRecovery)
    if (barrierRecoveryRanks) pushHeal(rankPercent(barrierRecoveryRanks, [0.01, 0.015, 0.02, 0.025, 0.03]))
    const barrierMemoryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.barrierMemory)
    if (barrierMemoryRanks) { runtime.barrierMemoryMultiplier = rankPercent(barrierMemoryRanks, [0.05, 0.10, 0.15, 0.20, 0.25]); runtime.barrierMemoryUntilMs = runtime.elapsedMs + 8_000 }
    const wardBatteryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.wardBattery)
    if (wardBatteryRanks) runtime.nextHealingActionSpeedMultiplier = 1 + rankPercent(wardBatteryRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
    const lastRefugeRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.lastRefuge)
    if (lastRefugeRanks && (context.currentHpPercent ?? 100) < 15 && arcaneCoreEventReady(state, 'last-refuge')) { pushBarrier(rankPercent(lastRefugeRanks, [0.05, 0.075, 0.10, 0.125, 0.15])); markArcaneCoreEvent(state, 'last-refuge') }
    const aegisRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.arcaneAegis)
    if (aegisRanks && context.previousBarrier && (runtime.arcaneAegisLastAtMs ?? -Infinity) + 10_000 <= runtime.elapsedMs) {
      pushBarrierFlat(context.previousBarrier * 0.20)
      runtime.arcaneAegisLastAtMs = runtime.elapsedMs
    }
    const pulseRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.barrierPulse)
    if (pulseRanks) reduceAllCooldowns(state, rankPercent(pulseRanks, [200, 400, 600, 800, 1000]))
  }

  if (event === 'on-barrier-gained' && actor === 'player') {
    const stableProtectionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.stableProtection)
    const conversionGenerated = context.sourceTags?.includes('conversion-generated') ?? false
    if (stableProtectionRanks && !conversionGenerated && (context.barrierGained ?? 0) > 0) {
      pushBarrierFlat((context.barrierGained ?? 0) * rankPercent(stableProtectionRanks, [0.01, 0.02, 0.03, 0.04, 0.05]), true)
    }
    const renewalRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.wardRenewal)
    if (renewalRanks) pushHeal(rankPercent(renewalRanks, [0.002, 0.004, 0.006, 0.008, 0.01]))
    const momentumRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.aegisMomentum)
    if (momentumRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(momentumRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    const eternalAegisRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.eternalAegis)
    if (eternalAegisRanks && (context.barrierGained ?? 0) > 0) pushConversionHeal(Math.min(0.03, (context.barrierGained ?? 0) * 0.15 / Math.max(1, state.player.maxHealth)))
    const memoryMultiplier = runtime.barrierMemoryUntilMs && runtime.barrierMemoryUntilMs > runtime.elapsedMs ? runtime.barrierMemoryMultiplier ?? 0 : 0
    if (memoryMultiplier > 0 && (context.barrierGained ?? 0) > 0) pushBarrierFlat((context.barrierGained ?? 0) * memoryMultiplier, true)
    const layeredWardRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.layeredWard)
    if (layeredWardRanks && arcaneCoreEventReady(state, 'layered-ward', 3_000)) { pushBarrier(rankPercent(layeredWardRanks, [0.005, 0.01, 0.015, 0.02, 0.025])); markArcaneCoreEvent(state, 'layered-ward') }
    const lifeBatteryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.lifeBattery)
    if (lifeBatteryRanks) runtime.barrierMemoryMultiplier = Math.max(runtime.barrierMemoryMultiplier ?? 0, rankPercent(lifeBatteryRanks, [0.02, 0.04, 0.06, 0.08, 0.10]))
    const unbrokenCycleRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.unbrokenCycle)
    if (unbrokenCycleRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(unbrokenCycleRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
    const renewalCycleRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.renewalCycle)
    if (renewalCycleRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(renewalCycleRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
  }

  if (event === 'on-heal' && actor === 'player' && (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.livingBastion) || hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.eternalAegis)) && (context.amount ?? 0) > 0) {
    const eternal = hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.eternalAegis)
    const living = hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.livingBastion) && getActiveBarrier(state, 'player') > 0
    const conversion = Math.min(state.player.maxHealth * 0.03, (context.amount ?? 0) * (eternal ? 0.15 : 0.10))
    if (conversion > 0 && (eternal || living)) pushBarrierFlat(conversion, true)
  }

  if (event === 'on-heal' && actor === 'player' && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.overhealWard) && (context.overheal ?? 0) > 0) {
    const conversion = rankPercent(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.overhealWard), [0.10, 0.20, 0.30, 0.40, 0.50])
    const barrierPercent = Math.min(0.05, conversion * (context.overheal ?? 0) / Math.max(1, state.player.maxHealth))
    if (barrierPercent > 0) pushBarrier(barrierPercent)
  }

  if (event === 'on-action-start' && actor === 'player') {
    const renewalRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.renewal)
    if (renewalRanks && arcaneCoreEventReady(state, 'renewal', 12_000)) {
      if (state.player.health / Math.max(1, state.player.maxHealth) < 0.5) pushHeal(0.04)
      else pushBarrier(0.04)
      markArcaneCoreEvent(state, 'renewal')
    }
  }

  if (event === 'on-spell-cast' && actor === 'player') {
    const regenerativeRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.regenerativeCasting)
    if (regenerativeRanks && (context.sourceTags?.includes('spell') || context.sourceTags?.includes('magic')) && arcaneCoreEventReady(state, 'regenerative-casting', 2_000)) { pushHeal(rankPercent(regenerativeRanks, [0.005, 0.01, 0.015, 0.02, 0.025])); markArcaneCoreEvent(state, 'regenerative-casting') }
  }

  if (event === 'on-damage-dealt' && actor === 'player' && (context.healthDamage ?? 0) > 0) {
    if (runtime.arcaneOverloadReady && context.source?.kind === 'spell' && context.sourceTags?.includes('direct')) {
      const echoDamage = Math.max(0, (context.amount ?? context.healthDamage ?? 0) * 0.15)
      if (echoDamage > 0) effects.push({ type: 'deal-damage', target: 'opponent', components: [{ damageType: context.damageType ?? 'arcane', magnitude: { type: 'flat', value: echoDamage } }], tags: ['special'] })
      runtime.arcaneOverloadReady = false
    }
    if (runtime.arcaneEchoReady && context.source?.kind === 'spell' && context.sourceTags?.includes('direct')) {
      const echoRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.arcaneEcho)
      const echoDamage = Math.max(0, (context.amount ?? context.healthDamage ?? 0) * rankPercent(echoRank, [0.05, 0.10, 0.15, 0.20, 0.25]))
      if (echoDamage > 0) effects.push({ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'arcane', magnitude: { type: 'flat', value: echoDamage } }], tags: ['special'] })
      runtime.arcaneEchoReady = false
    }
    if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.burningMomentum) && context.sourceTags?.includes('dot')) runtime.ruinStacks = Math.min(5, (runtime.ruinStacks ?? 0) + 1)
    if (context.sourceTags?.includes('dot') && context.eventTarget === 'enemy' && (context.currentHp ?? 1) <= 0) {
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.chainReaction)) runtime.chainReactionReady = true
      if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.ruinTransfer)) { runtime.ruinTransferReady = true; runtime.ruinTransferMultiplier = 1 + rankPercent(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.ruinTransfer), [0.03, 0.06, 0.09, 0.12, 0.15]) }
    }
  }

  if (event === 'on-damage-taken' && actor === 'player') {
    const recoveryWindowRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.recoveryWindowVitality)
    if (recoveryWindowRanks && (context.healthDamage ?? 0) > 0) {
      runtime.recoveryWindowUntilMs = runtime.elapsedMs + 3_000
      runtime.recoveryWindowMultiplier = 1 + rankPercent(recoveryWindowRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
    }
    const reinforcedRecoveryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.reinforcedRecovery)
    if (reinforcedRecoveryRanks && (context.barrierDamage ?? 0) > 0) {
      runtime.reinforcedRecoveryUntilMs = runtime.elapsedMs + 3_000
      runtime.reinforcedRecoveryMultiplier = 1 + rankPercent(reinforcedRecoveryRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    }
    const painRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.painToMana)
    if (painRanks && (runtime.lastDamageTakenAtMs ?? -Infinity) + 1000 <= runtime.elapsedMs) { pushMana((context.healthDamage ?? 0) * rankPercent(painRanks, [0.01, 0.02, 0.03, 0.04, 0.05])); runtime.lastDamageTakenAtMs = runtime.elapsedMs }
    const reactiveRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.reactiveWard)
    if (reactiveRanks && (context.previousBarrier ?? 0) <= 0) pushBarrier(rankPercent(reactiveRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const survivalRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.survivalInstinct)
    if (survivalRanks && (context.currentHpPercent ?? 100) < 10) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(survivalRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.secondWind) && !runtime.secondWindUsed && (context.currentHpPercent ?? 100) < 30) {
      pushHeal(0.05)
      runtime.secondWindUsed = true
    }
    if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.refuseDeath) && !runtime.refuseDeathThresholdUsed && (context.currentHpPercent ?? 100) < 15) {
      pushBarrier(0.10)
      runtime.refuseDeathThresholdUsed = true
    }
    const guardedRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.guardedRecovery)
    if (guardedRanks && arcaneCoreEventReady(state, 'guarded-recovery', 3_000)) { pushMana(state.player.maxMana * rankPercent(guardedRanks, [0.01, 0.02, 0.03, 0.04, 0.05])); markArcaneCoreEvent(state, 'guarded-recovery') }
    const painConversionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.painConversion)
    if (painConversionRanks && arcaneCoreEventReady(state, 'pain-conversion', 1_000)) { pushMana((context.healthDamage ?? 0) * rankPercent(painConversionRanks, [0.01, 0.02, 0.03, 0.04, 0.05])); markArcaneCoreEvent(state, 'pain-conversion') }
    const emergencyAegisRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.emergencyAegis)
    if (emergencyAegisRanks && (context.currentHpPercent ?? 100) < 20 && getActiveBarrier(state, 'player') <= 0 && arcaneCoreEventReady(state, 'emergency-aegis', 10_000)) { pushBarrier(rankPercent(emergencyAegisRanks, [0.03, 0.04, 0.05, 0.06, 0.07])); markArcaneCoreEvent(state, 'emergency-aegis') }
    const phoenixRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.phoenixPulse)
    if (phoenixRanks && (context.currentHpPercent ?? 100) < 20 && arcaneCoreEventReady(state, 'phoenix-pulse')) { pushHeal(rankPercent(phoenixRanks, [0.03, 0.04, 0.05, 0.06, 0.08])); markArcaneCoreEvent(state, 'phoenix-pulse') }
  }

  if (event === 'on-heal' && actor === 'player') {
    const momentumRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.healingMomentum)
    if (momentumRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(momentumRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    const surgeRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.recoverySurge)
    if (surgeRanks && (context.previousHpPercent ?? 100) < 25) pushHeal(rankPercent(surgeRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const eternalRecoveryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.eternalRecovery)
    if (eternalRecoveryRanks && (context.previousHpPercent ?? 100) < 50 && arcaneCoreEventReady(state, 'eternal-recovery', 5_000)) { pushHeal(rankPercent(eternalRecoveryRanks, [0.005, 0.01, 0.015, 0.02, 0.025])); markArcaneCoreEvent(state, 'eternal-recovery') }
    const renewalCycleRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.renewalCycle)
    if (renewalCycleRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(renewalCycleRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
    const comebackRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.comeback)
    if (comebackRanks && (context.previousHpPercent ?? 100) < 25 && (context.currentHpPercent ?? 0) >= 25 && arcaneCoreEventReady(state, 'comeback', 5_000)) {
      runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1 + rankPercent(comebackRanks, [0.02, 0.04, 0.06, 0.08, 0.10]))
      markArcaneCoreEvent(state, 'comeback')
    }
  }

  if (event === 'on-kill' && actor === 'player' && context.eventTarget === 'enemy') {
    const killSurgeRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.killSurge)
    if (killSurgeRanks) reduceAllCooldowns(state, rankPercent(killSurgeRanks, [100, 200, 300, 400, 500]))
    const recoveryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.victoryRecovery)
    if (recoveryRanks) pushHeal(rankPercent(recoveryRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const restorationRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.victoryRestoration)
    if (restorationRanks) pushHeal(rankPercent(restorationRanks, [0.02, 0.04, 0.06, 0.08, 0.10]))
    const chainRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.executionChain)
    if (chainRanks) runtime.nextEnemyDamageMultiplier = Math.max(runtime.nextEnemyDamageMultiplier ?? 1, 1 + rankPercent(chainRanks, [0.03, 0.06, 0.09, 0.12, 0.15]))
    if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.victoryMomentum)) runtime.victoryMomentumReady = true
  }

  if (event === 'on-action-start' && actor === 'player' && context.source?.actor === 'enemy' && state.combat.enemyStatuses.some((status) => controlStatusIds.has(status.statusId))) {
    const tempoRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.tempoTheft)
    if (tempoRanks) pushMana(rankPercent(tempoRanks, [1, 2, 3, 4, 5]))
  }

  if (effects.length && executeEffects) executeEffects(state, effects, source, depth + 1, uiEvents, resolution)
}

/** Shared classification used by Power/Mana/Control nodes that describe cost bands. */
export const classifyArcaneCoreSpellCost = (context: Pick<ArcaneCoreSpellCastContext, 'nominalManaCost' | 'maxMana'>) => {
  const ratio = context.nominalManaCost / Math.max(1, context.maxMana)
  return { ratio, low: ratio < 0.08, high: ratio >= 0.12, overcharged: ratio >= 0.15, extreme: ratio >= 0.2 }
}

/**
 * Resolves the reusable Arcane Core cast primitives. Authored node names remain data;
 * this adapter owns sequence counters, AUTO/MANUAL alternation, cost bands,
 * temporary next-cast tokens, and encounter-local cycle rewards.
 */
export const getArcaneCoreCastModifiers = (state: GameState, context: ArcaneCoreSpellCastContext, preview = false): ArcaneCoreCastModifiers => {
  const runtime = state.combat.arcaneCoreRuntime
  const previousCastOrigin = Object.prototype.hasOwnProperty.call(context, 'previousCastOrigin') ? context.previousCastOrigin : runtime.lastCastOrigin
  const previousConsecutiveAutoCasts = context.previousConsecutiveAutoCasts ?? (runtime.consecutiveAutoCasts ?? 0)
  const castNumber = runtime.spellCastCount + (preview ? 1 : 0)
  // `damagingSpellCount` is the player's successful damaging-cast sequence.
  // Keep the separately named enemy counter for enemy-action mechanics; it
  // must not replace the player sequence when resolving Core nodes.
  const damagingNumber = runtime.damagingSpellCount
  const nextDamagingNumber = preview && context.damaging ? damagingNumber + 1 : damagingNumber
  const costBand = classifyArcaneCoreSpellCost(context)
  let damageMultiplier = 1
  let effectivenessMultiplier = 1
  let actionSpeedMultiplier = 1
  let manaCostMultiplier = 1
  let manaRefundPercent = 0
  let manaRestoreFlat = 0
  let critChanceBonus = 0
  let critDamageBonus = 0
  let guaranteedCrit = false
  let statusDurationMultiplier = 1

  const spell = SPELLS[context.spellId]
  const hasHealing = Boolean(spell?.effects.some((effect) => effect.type === 'heal'))
  const hasBarrier = Boolean(spell?.effects.some((effect) => effect.type === 'gain-barrier'))
  const hasNegativeStatus = Boolean(spell?.effects.some((effect) => effect.type === 'apply-status' && effect.target === 'opponent'))
  const hasControlStatus = Boolean(spell?.effects.some((effect) => effect.type === 'apply-status' && effect.target === 'opponent' && ['chilled', 'frozen', 'tremored', 'stunned', 'entangled', 'silenced'].includes(effect.statusId)))
  const hasDamageOverTime = Boolean(spell?.effects.some((effect) => effect.type === 'apply-status' && effect.periodicEffects?.some((periodic) => periodic.type === 'deal-damage')))
  const hasDirectDamage = Boolean(spell?.effects.some((effect) => effect.type === 'deal-damage' && (effect.tags ?? []).includes('direct')))
  const enemyStatuses = state.combat.enemyStatuses
  const negativeStatusCount = enemyStatuses.filter((status) => status.statusId !== 'haste' && status.statusId !== 'quickening' && status.statusId !== 'gust' && status.statusId !== 'tailwind' && status.statusId !== 'regeneration' && status.statusId !== 'fortified' && status.statusId !== 'purified').length
  const hasControl = enemyStatuses.some((status) => ['chilled', 'frozen', 'tremored', 'stunned', 'entangled', 'silenced'].includes(status.statusId))
  const deck = state.combat.activeSpellLoadout?.slots ?? []
  const autoSlots = deck.filter((slot) => slot.autoCast).length
  const manualSlots = deck.length - autoSlots
  const currentBarrier = getActiveBarrier(state, 'player')
  const currentHealthPercent = state.player.health / Math.max(1, state.player.maxHealth) * 100
  const currentManaPercent = context.playerMana / Math.max(1, context.maxMana) * 100
  const spellSequence = context.damaging ? (runtime.recentDamagingSpellSequence ?? []) : []
  const allSpellSequence = runtime.recentSpellSequence ?? []
  const loadoutSlotSequence = runtime.recentLoadoutSlotSequence ?? []
  const previewNoRepeatSequence = advanceNoRepeatSequence
  const spellSequenceNumber = (preview ? previewNoRepeatSequence(spellSequence, context.spellId) : spellSequence).length
  const aggressiveRotationNumber = (preview ? previewNoRepeatSequence(allSpellSequence, context.spellId) : allSpellSequence).length
  const sovereignSequenceNumber = (preview ? previewNoRepeatSequence(spellSequence, context.spellId) : spellSequence).length
  const previewLoadoutSequence = context.loadoutSlotIndex === null || context.loadoutSlotIndex === undefined
    ? loadoutSlotSequence
    : preview ? previewNoRepeatSequence(loadoutSlotSequence, context.loadoutSlotIndex) : loadoutSlotSequence
  const previousMode = previousCastOrigin ? getArcaneCoreCastMode(previousCastOrigin) : null
  const currentMode = getArcaneCoreCastMode(context.origin)
  const alternatingCastNumber = preview && previousMode && previousMode !== currentMode
    ? (runtime.alternatingCastStreak ?? 0) + 1
    : runtime.alternatingCastStreak ?? 0
  const manaBeforeCost = context.manaBeforeCost ?? context.playerMana
  const paidMana = context.paidMana ?? (preview ? 0 : context.nominalManaCost)
  const projectedManaAfterCost = context.manaAfterCost ?? Math.max(0, manaBeforeCost - paidMana)
  let free = false

  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.absoluteStasis) && (runtime.absoluteStasisUntilMs ?? 0) > runtime.elapsedMs) actionSpeedMultiplier *= 1.15

  // The modifier is evaluated both during preview and immediately after the
  // cast is committed. Count the spell being evaluated in both paths.
  const autoCastNumber = (runtime.autoCastCount ?? 0) + (context.origin === 'auto' ? 1 : 0)
  if (context.origin === 'auto' && autoSlots > 0 && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.castingHarmony) && autoCastNumber > 0 && autoCastNumber % 3 === 0) {
    manaRestoreFlat += rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.castingHarmony), [1, 2, 3, 4, 5])
  }
  if (context.origin !== 'auto' && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.timelineTheft) && (runtime.stolenTimeStacks ?? 0) > 0) {
    actionSpeedMultiplier *= 1 + Math.min(0.20, (runtime.stolenTimeStacks ?? 0) * rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.timelineTheft), [0.008, 0.016, 0.024, 0.032, 0.04]))
    if (!preview) runtime.stolenTimeStacks = 0
  }
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.eventHorizon) && currentManaPercent < 25 && (runtime.overflowCharges ?? 0) > 0) {
    manaRestoreFlat += context.maxMana * 0.05
    if (!preview) runtime.overflowCharges = Math.max(0, (runtime.overflowCharges ?? 0) - 1)
  }
  const singularityTrigger = hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.arcaneSingularity)
    && !runtime.singularityUsed
    && paidMana > 0
    && projectedManaAfterCost < context.maxMana * 0.10
  if (singularityTrigger) {
    manaRestoreFlat += Math.max(0, context.maxMana * 0.5 - projectedManaAfterCost)
    if (!preview) {
      runtime.singularityUsed = true
      runtime.manaRegenDisabledUntilMs = runtime.elapsedMs + 5_000
      runtime.singularityUntilMs = runtime.elapsedMs + 5_000
    }
  }
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.arcaneSingularity) && (runtime.singularityUntilMs ?? 0) > runtime.elapsedMs) manaCostMultiplier *= 0.6
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.deepBreathing) && paidMana > 0 && manaBeforeCost >= context.maxMana * 0.25 && projectedManaAfterCost < context.maxMana * 0.25 && !runtime.deepBreathingUsed) {
    manaRestoreFlat += context.maxMana * 0.10
    if (!preview) runtime.deepBreathingUsed = true
  }
  manaRestoreFlat += runtime.nextManaRestoreFlat ?? 0
  if (!preview) runtime.nextManaRestoreFlat = 0
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.immortalGuard) && hasHealing && (runtime.immortalGuardUntilMs ?? 0) > runtime.elapsedMs) {
    actionSpeedMultiplier *= 100
    if (!preview) runtime.immortalGuardUntilMs = undefined
  }
  if (context.damaging && hasDirectDamage && (runtime.ruinStacks ?? 0) > 0 && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.burningMomentum)) {
    damageMultiplier += (runtime.ruinStacks ?? 0) * rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.burningMomentum), [0.01, 0.02, 0.03, 0.04, 0.05])
    if (!preview) runtime.ruinStacks = 0
  }
  if (context.damaging && hasDirectDamage && runtime.chainReactionReady && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.chainReaction)) {
    damageMultiplier += 0.40
    if (!preview) runtime.chainReactionReady = false
  }
  if (context.damaging && hasDamageOverTime && runtime.ruinTransferReady && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.ruinTransfer)) {
    effectivenessMultiplier *= runtime.ruinTransferMultiplier ?? 1
    if (!preview) { runtime.ruinTransferReady = false; runtime.ruinTransferMultiplier = 1 }
  }

  for (const entry of entries(state)) {
    const rank = entry.rank
    const mechanicId = entry.mechanicId
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.conservation && castNumber % 6 === 0) manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneSpark && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneMomentum && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.perfectCycle && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.06, 0.12, 0.18, 0.24, 0.30])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneEcho && context.damaging && nextDamagingNumber % 6 === 0 && !preview) runtime.arcaneEchoReady = true
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneRhythm && context.damaging && nextDamagingNumber % 5 === 0) damageMultiplier += 0.10
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.unstablePower && context.damaging && nextDamagingNumber % 5 === 0) { damageMultiplier += 0.30; manaCostMultiplier *= 1.15 }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.overcharge && costBand.ratio >= 0.10) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.overcast && costBand.overcharged) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.manaBurn && projectedManaAfterCost / Math.max(1, context.maxMana) < 0.2) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.desperatePower && context.playerMana / Math.max(1, context.maxMana) < 0.2) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.manaEdge && context.playerMana / Math.max(1, context.maxMana) > 0.8) damageMultiplier += rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.finisher && context.enemyHealthPercent < 25) damageMultiplier += rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.burstWindow && context.damaging && runtime.burstWindowReady) {
      damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
      if (!preview) runtime.burstWindowReady = false
    }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.deepWounds && context.damaging && hasDamageOverTime && negativeStatusCount > 0) effectivenessMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if ((mechanicId === ARCANE_CORE_MECHANIC_IDS.openingVolley || mechanicId === ARCANE_CORE_MECHANIC_IDS.firstBlood) && context.damaging && damagingNumber <= 1) damageMultiplier += rankValue(rank, mechanicId === ARCANE_CORE_MECHANIC_IDS.openingVolley ? [0.01, 0.02, 0.03, 0.04, 0.05] : [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.apotheosisExecution && context.enemyHealthPercent < 20) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.perfectExecution && context.enemyHealthPercent < 20) damageMultiplier += 0.10
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.timeCompression && alternatingCastNumber >= 2) actionSpeedMultiplier *= 1.2
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.zeroPoint && castNumber % 8 === 0) manaCostMultiplier *= 1 - rankValue(rank, [0.2, 0.4, 0.6, 0.8, 1])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.cataclysm && costBand.overcharged && !runtime.cataclysmUsed) { damageMultiplier += 0.30; manaCostMultiplier *= 1.15; if (!preview) runtime.cataclysmUsed = true }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.overchannelMajor && runtime.overchannelUntilMs && runtime.overchannelUntilMs > runtime.elapsedMs) { actionSpeedMultiplier *= 1.10; effectivenessMultiplier *= 1.075 }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.overchannelRecovery && runtime.overchannelUntilMs && runtime.overchannelUntilMs > runtime.elapsedMs) manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.queuedPrecision && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.preparedCast && context.origin !== 'auto' && damagingNumber === 0) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.manualTiming && context.origin !== 'auto') actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.absoluteQueue && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])

    // Arcane Core condition and sequence primitives. These stay keyed to authored
    // mechanic names, while the counters and cost bands remain shared.
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.perfectWindow && context.enemyHealthPercent > 90) critDamageBonus += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.criticalFinish && context.damaging && context.enemyHealthPercent < 25) critDamageBonus += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.markedPrecision && hasControl) critChanceBonus += rankValue(rank, [0.002, 0.004, 0.006, 0.008, 0.010])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.perfectPrecision && context.damaging && (runtime.failedCritStreak ?? 0) >= 2) critChanceBonus += 0.15
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.spellSequence && context.damaging && spellSequenceNumber >= 3) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.aggressiveRotation && aggressiveRotationNumber >= 4) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.rapidEscalation && context.damaging && (runtime.lastSuccessfulCastAtMs ?? -Infinity) >= runtime.elapsedMs - 3000) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.heavyFollowUp && context.damaging && costBand.low && runtime.nextLowCostDamageMultiplier && runtime.nextLowCostDamageMultiplier > 1) damageMultiplier *= runtime.nextLowCostDamageMultiplier
    if ((mechanicId === ARCANE_CORE_MECHANIC_IDS.debuffAssault || mechanicId === ARCANE_CORE_MECHANIC_IDS.corrodedDefense || mechanicId === ARCANE_CORE_MECHANIC_IDS.debuffPressure) && negativeStatusCount >= 2) damageMultiplier += rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((mechanicId === ARCANE_CORE_MECHANIC_IDS.dominatingWeakness || mechanicId === ARCANE_CORE_MECHANIC_IDS.absolutePressure) && negativeStatusCount >= 3) damageMultiplier += rankValue(rank, mechanicId === ARCANE_CORE_MECHANIC_IDS.absolutePressure ? [0.015, 0.03, 0.045, 0.06, 0.075] : [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.risingViolence) damageMultiplier += Math.floor(Math.max(0, 100 - context.enemyHealthPercent) / 25) * rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.cooldownPunisher && (spell?.cooldownMs ?? 0) >= 20_000) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.lingeringExecution && hasDamageOverTime && context.enemyHealthPercent < 35) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.unstableRotation && context.damaging && (runtime.costBandHistory ?? []).length >= 2 && (runtime.costBandHistory ?? [])[((runtime.costBandHistory ?? []).length) - 2] === 'high' && (runtime.costBandHistory ?? [])[(runtime.costBandHistory ?? []).length - 1] === 'low' && costBand.high) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.sovereignSequence && context.damaging && sovereignSequenceNumber >= 5) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.firstBlood && context.damaging && (runtime.enemyDamagingSpellCount ?? 0) <= 1) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.lastWord && context.damaging && context.enemyHealthPercent < 20 && !runtime.lastWordUsed) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.sovereignCrit && context.damaging && runtime.nextNonCritDamageMultiplier && runtime.nextNonCritDamageMultiplier > 1) damageMultiplier *= runtime.nextNonCritDamageMultiplier
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.victoryMomentum && context.damaging && runtime.victoryMomentumReady) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.sovereignCasting && context.damaging && (runtime.sovereigntyCharges ?? 0) > 0) damageMultiplier += 0.12
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.absoluteMomentum && context.damaging && aggressiveRotationNumber >= 3) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.limitBreak && costBand.extreme && !runtime.limitBreakUsed) { manaRefundPercent = Math.max(manaRefundPercent, 0.25); if (!preview) runtime.limitBreakUsed = true }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneApotheosis && runtime.apotheosisUntilMs && runtime.apotheosisUntilMs > runtime.elapsedMs) { damageMultiplier += 0.20; manaCostMultiplier *= 0.85; actionSpeedMultiplier *= 1.10 }

    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.protectiveCasting && currentBarrier > 0 && !context.damaging) actionSpeedMultiplier *= 1 + rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.defiantCasting && currentHealthPercent < 35 && (hasHealing || hasBarrier)) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.safeOffensive && currentBarrier >= state.player.maxHealth * 0.1 && context.damaging) damageMultiplier += rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.bastionCast && currentBarrier > 0 && !context.damaging) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.lastBreath && runtime.nextHealingActionSpeedMultiplier && hasHealing) actionSpeedMultiplier *= runtime.nextHealingActionSpeedMultiplier

    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.fullReservoir && currentManaPercent > 90 && runtime.elapsedMs - (runtime.lastSuccessfulCastAtMs ?? runtime.encounterStartedAtMs ?? 0) >= 3000) manaCostMultiplier *= 1 - rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.deepReservoir && (runtime.spellCastCount + (preview ? 1 : 0)) === 1) free = true
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.manualReservoir && currentMode === 'manual' && previousMode === 'auto') manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.alternatingMind && previousMode && previousMode !== currentMode) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.efficientQueue && context.origin === 'manual-queued') manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.dualMind && runtime.dualMindPreparedUntilMs && runtime.dualMindPreparedUntilMs > runtime.elapsedMs && runtime.dualMindPreparedOrigin === currentMode) {
      manaCostMultiplier *= 0.92
      actionSpeedMultiplier *= 1.05
      if (!preview) {
        runtime.dualMindPreparedOrigin = undefined
        runtime.dualMindPreparedUntilMs = undefined
      }
    }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.preparedSlot && context.loadoutSlotIndex !== null && !runtime.castLoadoutSlots?.includes(context.loadoutSlotIndex)) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneRecirculation && (runtime.spellCastCount + (preview ? 1 : 0)) % 10 === 0) manaRefundPercent = 0.5
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.preparedCast && context.origin !== 'auto' && (runtime.manualCastCount ?? 0) <= 1) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.queuedPrecision && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.balancedMind && autoSlots >= 2 && manualSlots >= 2) { actionSpeedMultiplier *= 1 + rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025]) }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.reservoirCycle && context.origin === 'auto' && runtime.reservoirCycleReady) {
      manaRestoreFlat += context.maxMana * rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
      if (!preview) runtime.reservoirCycleReady = false
    }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.deepDraw && currentManaPercent < 20) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.arcaneReturn) manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.astralRotation && context.loadoutSlotIndex !== null && previewLoadoutSequence.length >= 3) manaRefundPercent = Math.max(manaRefundPercent, rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]))
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.astralCascade && context.origin !== 'auto' && previousConsecutiveAutoCasts >= 3) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.singularityManual && context.origin !== 'auto' && runtime.nextAutoRefundPercent) {
      manaRefundPercent = Math.max(manaRefundPercent, runtime.nextAutoRefundPercent)
      if (!preview) runtime.nextAutoRefundPercent = undefined
    }
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.manaCollapse && runtime.manaCollapseReady) {
      actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
      if (!preview) runtime.manaCollapseReady = false
    }

    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.manualTiming && context.origin !== 'auto' && state.combat.enemyActionDurationMs > 0 && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs < 0.25) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if ((mechanicId === ARCANE_CORE_MECHANIC_IDS.controlledStrike || mechanicId === ARCANE_CORE_MECHANIC_IDS.controlledTarget) && hasControl && context.damaging) damageMultiplier += rankValue(rank, mechanicId === ARCANE_CORE_MECHANIC_IDS.controlledTarget ? [0.025, 0.05, 0.075, 0.10, 0.125] : [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((mechanicId === ARCANE_CORE_MECHANIC_IDS.debuffPressure || mechanicId === ARCANE_CORE_MECHANIC_IDS.endlessPressure) && negativeStatusCount >= (mechanicId === ARCANE_CORE_MECHANIC_IDS.endlessPressure ? 4 : 2)) damageMultiplier += rankValue(rank, mechanicId === ARCANE_CORE_MECHANIC_IDS.endlessPressure ? [0.03, 0.06, 0.09, 0.12, 0.15] : [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.queuedDominion && context.origin === 'manual-queued' && hasNegativeStatus) statusDurationMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.suppressionWindow && runtime.nextActionSpeedMultiplier && runtime.nextActionSpeedMultiplier > 1) actionSpeedMultiplier *= runtime.nextActionSpeedMultiplier
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.statusEcho && hasControl && runtime.nextControlStatusDurationMultiplier) statusDurationMultiplier *= runtime.nextControlStatusDurationMultiplier
    if (mechanicId === ARCANE_CORE_MECHANIC_IDS.statusRecursion && hasControl && runtime.nextControlStatusDurationMultiplier) statusDurationMultiplier *= runtime.nextControlStatusDurationMultiplier
  }

  const lowHealthGuardRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.lowHealthGuard)
  if (lowHealthGuardRanks && currentHealthPercent < 25 && hasHealing) effectivenessMultiplier *= 1 + rankValue(lowHealthGuardRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
  const highCurrentRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.highCurrent)
  if (highCurrentRanks && context.damaging && currentManaPercent > 70) damageMultiplier += rankValue(highCurrentRanks, [0.005, 0.01, 0.015, 0.02, 0.025])
  const astralReserveRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.astralReserve)
  if (astralReserveRanks && context.damaging && currentManaPercent > 75) damageMultiplier += rankValue(astralReserveRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
  const astralEquilibriumRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.astralEquilibrium)
  if (astralEquilibriumRanks && currentManaPercent > 75) effectivenessMultiplier *= 1.075
  if (astralEquilibriumRanks && currentManaPercent < 25) actionSpeedMultiplier *= 1.075
  const astralReleaseRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.astralRelease)
  if (astralReleaseRanks && currentManaPercent < 25 && arcaneCoreEventReady(state, 'astral-release', 4_000)) {
    actionSpeedMultiplier *= 1 + rankValue(astralReleaseRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (!preview) markArcaneCoreEvent(state, 'astral-release')
  }
  const quietMindRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.quietMind)
  if (quietMindRanks && currentManaPercent < 30 && arcaneCoreEventReady(state, 'quiet-mind', 5_000)) { manaRestoreFlat += context.maxMana * rankValue(quietMindRanks, [0.01, 0.015, 0.02, 0.025, 0.03]); if (!preview) markArcaneCoreEvent(state, 'quiet-mind') }
  const stableReserveRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.stableReserve)
  if (stableReserveRanks && currentManaPercent > 75) manaCostMultiplier *= 1 - rankValue(stableReserveRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
  const emergencyConversionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.emergencyConversion)
  if (emergencyConversionRanks && runtime.emergencyConversionReady) {
    manaRestoreFlat += context.maxMana * rankValue(emergencyConversionRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (!preview) runtime.emergencyConversionReady = false
  }
  const manualBatteryRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.manualBattery)
  if (manualBatteryRanks && context.origin !== 'auto') manaRestoreFlat += rankValue(manualBatteryRanks, [1, 2, 3, 4, 5])
  const convergentQueueRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.convergentQueue)
  if (convergentQueueRanks && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(convergentQueueRanks, [0.01, 0.02, 0.03, 0.04, 0.05])
  const reservoirBreakRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.reservoirBreak)
  if (reservoirBreakRanks && currentManaPercent > 80 && context.damaging) damageMultiplier += rankValue(reservoirBreakRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
  const manualDisruptionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.manualDisruption)
  if (manualDisruptionRanks && context.origin !== 'auto' && state.combat.enemyActionTimerMs > 0) damageMultiplier += rankValue(manualDisruptionRanks, [0.01, 0.02, 0.03, 0.04, 0.05])

  const detonationTheoryRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.detonationTheory)
  const detonationTheoryEligible = Boolean(
    detonationTheoryRank
    && context.damaging
    && spell?.effects.some((effect) => effect.type === 'detonate-status'
      && effect.target === 'opponent'
      && effect.consume !== false
      && enemyStatuses.some((active) => active.statusId === effect.statusId
        && (active.remainingMs === null || (active.remainingMs ?? 0) > 0)
        && active.source.actor === 'player'
        && (active.periodicEffects ?? STATUS_DEFINITIONS[active.statusId]?.periodic?.effects ?? []).some((periodic) => periodic.type === 'deal-damage'))),
  )
  if (detonationTheoryEligible) {
    damageMultiplier += rankValue(detonationTheoryRank, [0.03, 0.06, 0.09, 0.12, 0.15])
  }
  if (!context.damaging && (hasHealing || hasBarrier) && runtime.nextSelfTargetActionSpeedMultiplier) actionSpeedMultiplier *= runtime.nextSelfTargetActionSpeedMultiplier

  const nextDamageMultiplier = runtime.nextDamageMultiplier ?? 1
  const nextEnemyDamageMultiplier = runtime.nextEnemyDamageMultiplier ?? 1
  const nextEffectivenessMultiplier = runtime.nextEffectivenessMultiplier ?? 1
  const nextActionSpeedMultiplier = runtime.nextActionSpeedMultiplier ?? 1
  const nextManaRefundPercent = runtime.nextManaRefundPercent ?? 0
  critChanceBonus += runtime.nextCritChanceBonus ?? 0
  critDamageBonus += runtime.nextCritDamageBonus ?? 0
  guaranteedCrit = guaranteedCrit || runtime.nextGuaranteedCrit === true
  if (!preview) {
    if (context.origin === 'auto') runtime.autoCastCount = (runtime.autoCastCount ?? 0) + 1
    if (context.damaging) {
      runtime.nextDamageMultiplier = 1
      if (nextEnemyDamageMultiplier > 1) runtime.nextEnemyDamageMultiplier = 1
    }
    runtime.nextEffectivenessMultiplier = 1
    runtime.nextActionSpeedMultiplier = 1
    runtime.nextManaRefundPercent = 0
    if (context.damaging) {
      runtime.nextCritChanceBonus = 0
      runtime.nextCritDamageBonus = 0
      runtime.nextGuaranteedCrit = false
    }
    if (context.damaging && costBand.low) runtime.nextLowCostDamageMultiplier = undefined
    if (context.damaging && runtime.victoryMomentumReady) runtime.victoryMomentumReady = false
    if (context.origin !== 'auto' && runtime.echoCharges) runtime.echoCharges = 0
    if (context.origin === 'auto' && runtime.manualCharges) runtime.manualCharges = 0
    if (!context.damaging) runtime.nextSelfTargetActionSpeedMultiplier = undefined
    if (hasHealing) runtime.nextHealingActionSpeedMultiplier = undefined
    if (hasControlStatus) runtime.nextControlStatusDurationMultiplier = undefined
  }
  const overflowWardRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.overflowWard)
  const overflowConversion = hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.transcendence) ? 0.5 : overflowWardRanks ? rankValue(overflowWardRanks, [0.10, 0.15, 0.20, 0.25, 0.30]) : 0
  const manaOverflowBarrier = overflowConversion > 0
    ? Math.min(state.player.maxHealth * (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.transcendence) ? 0.05 : 0.03), Math.max(0, context.playerMana + manaRestoreFlat - context.maxMana) * overflowConversion)
    : 0
  return {
    free: free || manaCostMultiplier <= 0,
    damageMultiplier: damageMultiplier * nextDamageMultiplier * nextEnemyDamageMultiplier,
    effectivenessMultiplier: effectivenessMultiplier * nextEffectivenessMultiplier,
    actionSpeedMultiplier: actionSpeedMultiplier * nextActionSpeedMultiplier,
    manaCostMultiplier,
    manaRefundPercent: Math.max(0, Math.min(1, manaRefundPercent + nextManaRefundPercent)),
    manaRestoreFlat,
    manaOverflowBarrier,
    critChanceBonus,
    critDamageBonus,
    guaranteedCrit,
    statusDurationMultiplier,
  }
}

export const commitArcaneCoreSpellCast = (state: GameState, context: ArcaneCoreSpellCastContext) => {
  const runtime = state.combat.arcaneCoreRuntime
  const previousOrigin = runtime.spellCastCount > 0 ? runtime.lastCastOrigin ?? null : null
  const previousConsecutiveAutoCasts = runtime.consecutiveAutoCasts ?? 0
  const currentMode = getArcaneCoreCastMode(context.origin)
  const previousMode = previousOrigin ? getArcaneCoreCastMode(previousOrigin) : null
  runtime.spellCastCount += 1
  if (context.damaging) runtime.damagingSpellCount += 1
  runtime.recentSpellSequence = advanceNoRepeatSequence(runtime.recentSpellSequence ?? [], context.spellId)
  runtime.recentDamagingSpellSequence = context.damaging ? advanceNoRepeatSequence(runtime.recentDamagingSpellSequence ?? [], context.spellId) : []
  runtime.recentLoadoutSlotSequence = context.loadoutSlotIndex === null || context.loadoutSlotIndex === undefined
    ? []
    : advanceNoRepeatSequence(runtime.recentLoadoutSlotSequence ?? [], context.loadoutSlotIndex)
  runtime.alternatingCastStreak = previousMode && previousMode !== currentMode ? (runtime.alternatingCastStreak ?? 0) + 1 : 1
  runtime.consecutiveAutoCasts = context.origin === 'auto' ? (runtime.consecutiveAutoCasts ?? 0) + 1 : 0
  runtime.consecutiveManualCasts = context.origin === 'auto' ? 0 : (runtime.consecutiveManualCasts ?? 0) + 1
  runtime.manualCastCount = context.origin === 'auto' ? (runtime.manualCastCount ?? 0) : (runtime.manualCastCount ?? 0) + 1
  if (context.origin === 'auto') runtime.echoCharges = Math.min(5, (runtime.echoCharges ?? 0) + 1)
  else runtime.manualCharges = Math.min(5, (runtime.manualCharges ?? 0) + 1)
  const band = classifyArcaneCoreSpellCost(context)
  const bandName: 'low' | 'high' | 'overcharged' | 'extreme' = band.extreme ? 'extreme' : band.overcharged ? 'overcharged' : band.high ? 'high' : 'low'
  runtime.costBandHistory = [...(runtime.costBandHistory ?? []), bandName].slice(-3)
  const paidMana = Math.max(0, context.paidMana ?? context.nominalManaCost)
  const manaBeforeCost = context.manaBeforeCost ?? context.playerMana
  const manaAfterCost = context.manaAfterCost ?? Math.max(0, manaBeforeCost - paidMana)
  const manaSpendSequence = runtime.manaSpendSequence ?? 0
  runtime.manaSpendSequence = paidMana > 0 ? manaSpendSequence + 1 : manaSpendSequence
  runtime.recentManaSpend = [...(runtime.recentManaSpend ?? []), ...(paidMana > 0 ? [{ atMs: runtime.elapsedMs, amount: paidMana, sequence: runtime.manaSpendSequence }] : [])].filter((entry) => entry.atMs >= runtime.elapsedMs - 4_000)
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.eventHorizon) && context.manaWasFullAtStart === true) {
    runtime.overflowCharges = Math.min(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.eventHorizon), (runtime.overflowCharges ?? 0) + 1)
  }
  if (context.damaging && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.arcaneOverload) && runtime.damagingSpellCount % 6 === 0) runtime.arcaneOverloadReady = true
  runtime.lastCastOrigin = context.origin
  runtime.lastSpellId = context.spellId
  runtime.lastLoadoutSlotIndex = context.loadoutSlotIndex
  if (context.origin === 'manual-queued' && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.tacticalQueue)) reduceAllCooldowns(state, rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.tacticalQueue), [50, 100, 150, 200, 250]))
  const result = getArcaneCoreCastModifiers(state, { ...context, previousCastOrigin: previousOrigin, previousConsecutiveAutoCasts })
  runtime.lastSuccessfulCastAtMs = runtime.elapsedMs
  const dualMindRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.dualMind)
  if (dualMindRank) {
    runtime.dualMindPreparedOrigin = currentMode === 'auto' ? 'manual' : 'auto'
    runtime.dualMindPreparedUntilMs = runtime.elapsedMs + 5_000
  }
  if (context.loadoutSlotIndex !== null && context.loadoutSlotIndex !== undefined) runtime.castLoadoutSlots = [...new Set([...(runtime.castLoadoutSlots ?? []), context.loadoutSlotIndex])]
  const spellCycleSequence = runtime.recentSpellSequence ?? []
  if (mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.spellCycle) && spellCycleSequence.length >= 3) runtime.recentSpellSequence = []
  if (mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.aggressiveRotation) && (runtime.recentSpellSequence ?? []).length >= 4) runtime.recentSpellSequence = []
  if (context.damaging && (runtime.recentDamagingSpellSequence ?? []).length >= 5) runtime.recentDamagingSpellSequence = []
  const cataclysmicReserveRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.cataclysmicReserve)
  if (cataclysmicReserveRank && band.overcharged) runtime.nextCritChanceBonus = Math.max(runtime.nextCritChanceBonus ?? 0, rankValue(cataclysmicReserveRank, [0.01, 0.02, 0.03, 0.04, 0.05]))
  const spellCycleRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.spellCycle)
  if (spellCycleRank && spellCycleSequence.length >= 3) {
    result.manaRestoreFlat += rankValue(spellCycleRank, [1, 2, 3, 4, 5])
  }
  if (context.damaging && mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.spellSequence) && (runtime.recentDamagingSpellSequence ?? []).length >= 3) runtime.recentDamagingSpellSequence = []
  if (context.damaging && mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.sovereignSequence) && (runtime.recentDamagingSpellSequence ?? []).length >= 5) runtime.recentDamagingSpellSequence = []
  const manaToTempoRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.manaToTempo)
  if (manaToTempoRank && result.manaRestoreFlat >= context.maxMana * 0.05) runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1 + rankValue(manaToTempoRank, [0.01, 0.02, 0.03, 0.04, 0.05]))
  const singularityManualRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.singularityManual)
  if (singularityManualRank && context.origin === 'auto') runtime.nextAutoRefundPercent = rankValue(singularityManualRank, [0.02, 0.04, 0.06, 0.08, 0.10])
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.lastWord) && context.damaging && context.enemyHealthPercent < 20) runtime.lastWordUsed = true
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.arcaneApotheosis) && context.damaging && runtime.damagingSpellCount >= 8 && !runtime.apotheosisUntilMs) runtime.apotheosisUntilMs = runtime.elapsedMs + 6000
  const recentManaTotal = (runtime.recentManaSpend ?? []).reduce((sum, entry) => sum + entry.amount, 0)
  const latestManaSpendSequence = runtime.manaSpendSequence ?? 0
  const reservoirCycleRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.reservoirCycle)
  if (reservoirCycleRank && !runtime.reservoirCycleReady && paidMana > 0 && recentManaTotal >= context.maxMana * 0.20 && latestManaSpendSequence > (runtime.reservoirCycleTriggeredSpendSequence ?? 0)) {
    runtime.reservoirCycleReady = true
    runtime.reservoirCycleTriggeredAtMs = runtime.elapsedMs
    runtime.reservoirCycleTriggeredSpendSequence = latestManaSpendSequence
  }
  const lowTideRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.lowTide)
  if (lowTideRank && paidMana > 0 && manaBeforeCost >= context.maxMana * 0.30 && manaAfterCost < context.maxMana * 0.30) runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1 + rankValue(lowTideRank, [0.02, 0.04, 0.06, 0.08, 0.10]))
  const manaCollapseRank = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.manaCollapse)
  const emergencyConversionRanks = mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.emergencyConversion)
  if (manaCollapseRank && !runtime.manaCollapseReady && paidMana > 0 && manaBeforeCost >= context.maxMana * 0.25 && manaAfterCost < context.maxMana * 0.25 && (runtime.manaCollapseLastAtMs ?? -Infinity) + 5_000 <= runtime.elapsedMs) {
    runtime.manaCollapseReady = true
    runtime.manaCollapseLastAtMs = runtime.elapsedMs
  }
  if (emergencyConversionRanks && paidMana > 0 && manaAfterCost / Math.max(1, context.maxMana) < 0.20) runtime.emergencyConversionReady = true
  const overchannelActive = (runtime.overchannelUntilMs ?? 0) > runtime.elapsedMs
  if (overchannelActive && paidMana > 0) runtime.overchannelSpendFloorSequence = latestManaSpendSequence
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.overchannelMajor) && !overchannelActive && paidMana > 0 && recentManaTotal >= context.maxMana * 0.25 && latestManaSpendSequence > Math.max(runtime.overchannelTriggeredSpendSequence ?? 0, runtime.overchannelSpendFloorSequence ?? 0)) {
    runtime.overchannelUntilMs = runtime.elapsedMs + 5_000
    runtime.manaRegenDisabledUntilMs = runtime.elapsedMs + 5_000
    runtime.overchannelTriggeredAtMs = runtime.elapsedMs
    runtime.overchannelTriggeredSpendSequence = latestManaSpendSequence
    runtime.overchannelSpendFloorSequence = latestManaSpendSequence
  }
  return result
}

/** Resolves the Arcane Core lethal-survival tokens without coupling the generic combat
 * resolver to catalog names. The caller owns the final HP assignment. */
export const tryConsumeArcaneCoreSurvivalMechanic = (state: GameState) => {
  const runtime = state.combat.arcaneCoreRuntime
  if (hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.undying) && !runtime.immortalGuardUsed) {
    runtime.immortalGuardUsed = true
    runtime.undyingUntilMs = runtime.elapsedMs + 1_500
    runtime.lastSurvivalToken = 'undying'
    return 'undying' as const
  }
  return null
}

/** Commits direct-hit crit state after the combat resolver has rolled the hit. */
export const recordArcaneCoreCriticalResult = (state: GameState, critical: boolean) => {
  const runtime = state.combat.arcaneCoreRuntime
  runtime.failedCritStreak = critical ? 0 : (runtime.failedCritStreak ?? 0) + 1
  if (critical && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.criticalFeedback) && (runtime.criticalFeedbackLastAtMs ?? -Infinity) + 750 <= runtime.elapsedMs) {
    reduceAllCooldowns(state, rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.criticalFeedback), [30, 60, 90, 120, 150]))
    runtime.criticalFeedbackLastAtMs = runtime.elapsedMs
  }
  if (critical && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.criticalRecovery) && (runtime.criticalRecoveryLastAtMs ?? -Infinity) + 750 <= runtime.elapsedMs) {
    state.player.mana = Math.min(state.player.maxMana, state.player.mana + rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.criticalRecovery), [1, 2, 3, 4, 5]))
    runtime.criticalRecoveryLastAtMs = runtime.elapsedMs
  }
  const latestCostBand = runtime.costBandHistory?.[Math.max(0, (runtime.costBandHistory?.length ?? 1) - 1)]
  if (critical && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.criticalCataclysm) && runtime.lastSpellId && (latestCostBand === 'overcharged' || latestCostBand === 'extreme')) {
    const remaining = state.combat.spellCooldowns[runtime.lastSpellId] ?? 0
    state.combat.spellCooldowns[runtime.lastSpellId] = Math.max(0, remaining - rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.criticalCataclysm), [200, 400, 600, 800, 1000]))
  }
  if (!critical && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.secondChance)) {
    runtime.nextCritChanceBonus = rankValue(mechanicRank(state, ARCANE_CORE_MECHANIC_IDS.secondChance), [0.002, 0.004, 0.006, 0.008, 0.010])
  }
  if (!critical && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.perfectPrecision) && (runtime.failedCritStreak ?? 0) >= 2) {
    runtime.nextCritChanceBonus = Math.max(runtime.nextCritChanceBonus ?? 0, 0.15)
    // Perfect Precision empowers the next attempt; a failed empowered attempt
    // starts a fresh two-miss window instead of repeatedly stacking the bonus.
    runtime.failedCritStreak = 0
  }
  if (!critical && (runtime.sovereigntyCharges ?? 0) > 0 && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.sovereignCasting)) runtime.sovereigntyCharges = Math.max(0, (runtime.sovereigntyCharges ?? 0) - 1)
  if (critical && hasMechanic(state, ARCANE_CORE_MECHANIC_IDS.sovereignCrit)) runtime.nextNonCritDamageMultiplier = 1
}
