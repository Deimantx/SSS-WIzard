import type { CanonicalSpellId, GameState } from '../../types'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { BALANCE } from '../../core/balance/balance'
import { selectFreeFocus, selectUsedFocus } from '../focus/focusReservations'
import { getActiveBarrier } from '../combat/barrierRuntime'
import type { CombatConditionContext, CombatEffect, CombatEventSink, CombatResolutionContext, CombatSource, CombatTrigger } from '../combat/combatTypes'
import { getArcaneCoreSpecialEffects } from './arcaneCoreProgression'
import { ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY } from '../../content/arcaneCore/arcaneCoreV6Runtime'

export type ArcaneCoreCastOrigin = 'auto' | 'manual-direct' | 'manual-queued'

export interface ArcaneCoreSpellCastContext {
  origin: ArcaneCoreCastOrigin
  spellId: CanonicalSpellId
  loadoutSlotIndex: number | null
  damaging: boolean
  manaCost: number
  maxMana: number
  playerMana: number
  enemyHealthPercent: number
}

export interface ArcaneCoreV6CastModifiers {
  free: boolean
  damageMultiplier: number
  effectivenessMultiplier: number
  actionSpeedMultiplier: number
  manaCostMultiplier: number
  manaRefundPercent: number
  manaRestoreFlat: number
  critChanceBonus: number
  critDamageBonus: number
  guaranteedCrit: boolean
  statusDurationMultiplier: number
}

const rankValue = (rank: number, values: readonly number[]) => values[Math.max(1, Math.min(values.length, Math.floor(rank))) - 1] ?? values[values.length - 1] ?? 0
type V6Entry = Extract<ReturnType<typeof getArcaneCoreSpecialEffects>[number], { type: 'v6-mechanic' }> & { behavior: NonNullable<(typeof ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY)[string]['behavior']> }
const entries = (state: Pick<GameState, 'arcaneCore'>): V6Entry[] => getArcaneCoreSpecialEffects(state.arcaneCore).flatMap((effect) => {
  if (effect.type !== 'v6-mechanic') return []
  const behavior = ARCANE_CORE_V6_IMPLEMENTATION_REGISTRY[effect.mechanicId]?.behavior
  return behavior ? [{ ...effect, behavior }] : []
})

type V6EffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => void
const controlStatusIds = new Set(['chilled', 'frozen', 'tremored', 'stunned', 'entangled', 'silenced'])
const rankPercent = (rank: number, values: readonly number[]) => rankValue(rank, values)
const V6_MECHANICS: Record<string, string> = {
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
  conservation: 'focus:r1:S3', emergencyFlow: 'focus:r1:S4', fullReservoir: 'focus:r1:S5', overflowSpark: 'focus:r1:S6', focusedRecovery: 'focus:r1:S7', quietMind: 'focus:r1:S8', deepReservoir: 'focus:r1:M',
  manualReservoir: 'focus:r2:S4', alternatingMind: 'focus:r2:S5', efficientQueue: 'focus:r2:S6', openFocus: 'focus:r2:S7', echoDiscipline: 'focus:r2:S8', dualMind: 'focus:r2:M',
  reservedPower: 'focus:r3:S3', freeMind: 'focus:r3:S4', resonantCast: 'focus:r3:S5', echoBattery: 'focus:r3:S6', manualCharge: 'focus:r3:S7', preparedSlot: 'focus:r3:S8', resonance: 'focus:r3:M',
  overflowWard: 'focus:r4:S3', manaToTempo: 'focus:r4:S4', stableReserve: 'focus:r4:S5', emptyMind: 'focus:r4:S6', emergencyConversion: 'focus:r4:S7', focusRelease: 'focus:r4:S8', transcendence: 'focus:r4:M',
  balancedMind: 'focus:r5:S3', echoBatteryII: 'focus:r5:S4', manualBattery: 'focus:r5:S5', convergentQueue: 'focus:r5:S6', reservedConversion: 'focus:r5:S7', freeFocusSurge: 'focus:r5:S8', convergence: 'focus:r5:M',
  deepDraw: 'focus:r6:S4', arcaneReturn: 'focus:r6:S5', reservoirBreak: 'focus:r6:S6', overchannelCycle: 'focus:r6:S7', emergencyFreeCast: 'focus:r6:S8', overchannelCondition: 'focus:r6:S3', overchannel: 'focus:r6:M',
  astralReservedPower: 'focus:r7:S3', astralOpenMind: 'focus:r7:S4', astralRotation: 'focus:r7:S5', echoCascade: 'focus:r7:S6', manualCascade: 'focus:r7:S7', astralRecovery: 'focus:r7:S8', astralMind: 'focus:r7:M',
  zeroPoint: 'focus:r8:S3', eventHorizon: 'focus:r8:S4', singularityEcho: 'focus:r8:S5', singularityManual: 'focus:r8:S6', focusCollapse: 'focus:r8:S7', perfectConservation: 'focus:r8:S8', arcaneSingularity: 'focus:r8:M',
  delayedFate: 'control:r1:S3', openingControl: 'control:r1:S4', controlledStrike: 'control:r1:S5', recoveryWindowControl: 'control:r1:S6', manualTiming: 'control:r1:S7', tempoTheft: 'control:r1:S8', temporalFlow: 'control:r1:M',
  layeredControl: 'control:r2:S3', controlledFlow: 'control:r2:S4', debuffPressure: 'control:r2:S5', slowBurn: 'control:r2:S6', suppressionWindow: 'control:r2:S7', controlRefresh: 'control:r2:S8', perfectTiming: 'control:r2:M',
  chainControl: 'control:r3:S3', dominatingWeaknessControl: 'control:r3:S4', suppressedEnemy: 'control:r3:S5', statusEcho: 'control:r3:S6', queuedDominion: 'control:r3:S7', timelineBreak: 'control:r3:S8', dominion: 'control:r3:M',
  aftershock: 'control:r4:S3', tremorLock: 'control:r4:S4', coldPrecision: 'control:r4:S5', controlConversion: 'control:r4:S6', absolutePressure: 'control:r4:S7', actionDenial: 'control:r4:S8', arcaneLock: 'control:r4:M',
  spellInterference: 'control:r5:S3', statusFracture: 'control:r5:S4', interferencePulse: 'control:r5:S5', debuffTheft: 'control:r5:S6', manualDisruption: 'control:r5:S7', interferenceChain: 'control:r5:S8', temporalFracture: 'control:r5:M',
  preparedCast: 'control:r6:S3', queuedPrecision: 'control:r6:S4', stolenTime: 'control:r6:S5', temporalRefund: 'control:r6:S6', precisionWindow: 'control:r6:S7', chronoCycle: 'control:r6:S8', timeCompression: 'control:r6:M',
  lockdownDelay: 'control:r7:S3', controlCascade: 'control:r7:S4', tacticalQueue: 'control:r7:S5', controlledTarget: 'control:r7:S6', controlledSuppression: 'control:r7:S7', noEscape: 'control:r7:S8', totalLockdown: 'control:r7:M',
  absoluteDelay: 'control:r8:S3', statusRecursion: 'control:r8:S4', timelineTheft: 'control:r8:S5', absoluteQueue: 'control:r8:S6', stasisCollapse: 'control:r8:S7', endlessPressure: 'control:r8:S8', absoluteStasis: 'control:r8:M',
  secondChance: 'power:r2:S7', echoHarmony: 'focus:r2:S3',
  // V7 keeps the stable branch/ring/slot identity of the ranked save data,
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
    conservation: 'focus:r1:S5', emergencyFlow: 'focus:r1:S6', fullReservoir: 'focus:r1:S7', quietMind: 'focus:r1:S8', deepBreathing: 'focus:r1:M',
    echoHarmony: 'focus:r2:S5', manualReservoir: 'focus:r2:S6', alternatingMind: 'focus:r2:S7', efficientQueue: 'focus:r2:S8', dualMind: 'focus:r2:M',
    reservedPower: 'focus:r3:S5', freeMind: 'focus:r3:S6', resonantCast: 'focus:r3:S7', preparedSlot: 'focus:r3:S8', resonance: 'focus:r3:M',
    overflowWard: 'focus:r4:S5', manaToTempo: 'focus:r4:S6', stableReserve: 'focus:r4:S7', emergencyConversion: 'focus:r4:S8', transcendence: 'focus:r4:M',
    balancedMind: 'focus:r5:S5', manualBattery: 'focus:r5:S6', convergentQueue: 'focus:r5:S7', reservedConversion: 'focus:r5:S8', convergence: 'focus:r5:M', deepReservoir: 'focus:r5:M',
    overchannel: 'focus:r6:S5', deepDraw: 'focus:r6:S6', arcaneReturn: 'focus:r6:S7', reservoirBreak: 'focus:r6:S8', overchannelCondition: 'focus:r6:M', overchannelMajor: 'focus:r6:M',
    astralReservedPower: 'focus:r7:S5', astralOpenMind: 'focus:r7:S6', astralRotation: 'focus:r7:S7', echoCascade: 'focus:r7:S8', astralMind: 'focus:r7:M',
    zeroPoint: 'focus:r8:S5', eventHorizon: 'focus:r8:S6', singularityManual: 'focus:r8:S7', focusCollapse: 'focus:r8:S8', arcaneSingularity: 'focus:r8:M',
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
const V7_MECHANIC_NAMES = new Set([
  'opportunist', 'finisher', 'openingVolley', 'manaEdge', 'arcaneRhythm', 'criticalRecovery', 'markedPrecision', 'secondChance', 'perfectWindow', 'perfectPrecision',
  'spellSequence', 'arcaneMomentum', 'rapidEscalation', 'debuffAssault', 'arcaneOverload', 'killSurge', 'burstWindow', 'aggressiveRotation', 'cooldownPunisher', 'perfectExecution',
  'burningMomentum', 'detonationTheory', 'lingeringExecution', 'deepWounds', 'unstablePower', 'overcast', 'manaBurn', 'cataclysmicReserve', 'criticalCataclysm', 'cataclysm',
  'sovereignSequence', 'firstBlood', 'lastWord', 'dominatingWeakness', 'sovereignCasting', 'perfectCycle', 'arcaneEcho', 'apotheosisExecution', 'limitBreak', 'arcaneApotheosis',
  'secondSkin', 'emergencyPulse', 'recoveryWindowVitality', 'victoryRecovery', 'secondWind', 'stonewall', 'barrierRecovery', 'guardedRecovery', 'lowHealthGuard', 'unyielding',
  'reactiveWard', 'wardRenewal', 'barrierMemory', 'stableProtection', 'arcaneAegis', 'lastBreath', 'emergencyAegis', 'recoverySurge', 'survivalInstinct', 'livingBastion',
  'layeredWard', 'wardBattery', 'bastionCast', 'reinforcedRecovery', 'renewal', 'regenerativeCasting', 'healingMomentum', 'barrierBreakRecovery', 'renewalCycle', 'refuseDeath',
  'lastRefuge', 'defiantCasting', 'painConversion', 'comeback', 'undying', 'phoenixPulse', 'lifeBattery', 'unbrokenCycle', 'eternalRecovery', 'eternalAegis',
  'conservation', 'emergencyFlow', 'fullReservoir', 'quietMind', 'deepBreathing', 'echoHarmony', 'manualReservoir', 'alternatingMind', 'efficientQueue', 'dualMind',
  'reservedPower', 'freeMind', 'resonantCast', 'preparedSlot', 'resonance', 'overflowWard', 'manaToTempo', 'stableReserve', 'emergencyConversion', 'transcendence',
  'balancedMind', 'manualBattery', 'convergentQueue', 'reservedConversion', 'convergence', 'deepReservoir', 'overchannel', 'deepDraw', 'arcaneReturn', 'reservoirBreak', 'overchannelMajor',
  'astralReservedPower', 'astralOpenMind', 'astralRotation', 'echoCascade', 'astralMind', 'zeroPoint', 'eventHorizon', 'singularityManual', 'focusCollapse', 'arcaneSingularity',
  'openingControl', 'controlledStrike', 'recoveryWindowControl', 'tempoTheft', 'controlledTempo', 'layeredControl', 'controlledFlow', 'debuffPressure', 'controlRefresh', 'suppressionWindow',
  'chainControl', 'statusEcho', 'queuedDominion', 'suppressedEnemy', 'temporalFlow', 'aftershock', 'tremorLock', 'coldPrecision', 'controlConversion', 'perfectTiming',
  'spellInterference', 'statusFracture', 'debuffTheft', 'manualDisruption', 'dominion', 'preparedCast', 'queuedPrecision', 'temporalRefund', 'chronoCycle', 'temporalFracture',
  'lockdownDelay', 'controlCascade', 'controlledTarget', 'noEscape', 'totalLockdown', 'absoluteDelay', 'statusRecursion', 'timelineTheft', 'stasisCollapse', 'absoluteStasis',
])
// V7 intentionally prunes the old V6-only mechanic names. Keep their typed
// aliases for the compatibility adapter, but make them inert so a new node
// occupying the same stable slot cannot accidentally activate retired logic.
Object.entries(V6_MECHANICS).forEach(([name]) => {
  if (!V7_MECHANIC_NAMES.has(name)) (V6_MECHANICS as Record<string, string>)[name] = `__retired-v6:${name}`
})
const hasMechanic = (state: GameState, mechanicId: string) => entries(state).some((entry) => entry.mechanicId === mechanicId)
const mechanicRank = (state: GameState, mechanicId: string) => entries(state).find((entry) => entry.mechanicId === mechanicId)?.rank ?? 0

export const getArcaneCoreV6DynamicSpellPower = (state: GameState) => {
  const rank = mechanicRank(state, V6_MECHANICS.astralMind)
  return rank > 0 ? Math.min(0.075, Math.floor(selectUsedFocus(state) / 10) * 0.005) * BALANCE.player.baseSpellPower : 0
}

export const getArcaneCoreV6DynamicManaRegen = (state: GameState) => {
  // V7 Astral Mind converts Free Focus into Action Speed, not raw Mana Regen.
  // Keep this adapter at zero so the retired V6 Free-Focus conversion cannot
  // silently remain active through the compatibility runtime.
  return 0
}

export const getArcaneCoreV6ManaRegenMultiplier = (state: GameState) => {
  const rank = mechanicRank(state, V6_MECHANICS.emergencyFlow)
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
    if (hasMechanic(state, V6_MECHANICS.timelineTheft)) runtime.stolenTimeStacks = Math.min(5, (runtime.stolenTimeStacks ?? 0) + earnedStacks)
  }
  if (hasMechanic(state, V6_MECHANICS.absoluteStasis) && !runtime.absoluteStasisUsed && runtime.totalEnemyDelayMs >= 3000) {
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

/**
 * Shared event adapter for V6 trigger/conversion mechanics. Authored nodes
 * stay data-driven; this function supplies common status, barrier, health,
 * kill, and timeline hooks to every node that uses those primitives.
 */
export const processArcaneCoreV6CombatEvent = (state: GameState, actor: 'player' | 'enemy', event: CombatTrigger, context: CombatConditionContext, executeEffects?: V6EffectExecutor, depth = 0, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => {
  if (context.source?.kind === 'arcane-core') return
  const enemyStatusCount = state.combat.enemyStatuses.filter((status) => STATUS_DEFINITIONS[status.statusId]?.classification === 'debuff').length
  const source: CombatSource = { actor: 'player', kind: 'arcane-core', sourceId: 'arcane-core-v6', tags: ['special'] }
  const effects: CombatEffect[] = []
  const runtime = state.combat.arcaneCoreRuntime
  const pushHeal = (percent: number) => effects.push({ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: percent } })
  const pushBarrier = (percent: number) => effects.push({ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: percent }, mode: 'add', durationMs: null })
  const pushBarrierFlat = (amount: number, conversionGenerated = false) => effects.push({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: amount }, mode: 'add', durationMs: null, ...(conversionGenerated ? { tags: ['conversion-generated'] as const } : {}) })
  const pushConversionHeal = (percent: number) => effects.push({ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: percent }, tags: ['conversion-generated'] })
  const pushMana = (amount: number) => effects.push({ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: amount } })

  if (event === 'on-status-applied' && actor === 'player' && context.eventTarget === 'enemy') {
    if (isNegativeStatusEvent(context) && hasMechanic(state, V6_MECHANICS.opportunist)) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(mechanicRank(state, V6_MECHANICS.opportunist), [0.02, 0.04, 0.06, 0.08, 0.10]))
    if (isControlEvent(context)) {
      const controlRanks = mechanicRank(state, V6_MECHANICS.delayedFate)
      if (controlRanks) delayEnemyAction(state, rankPercent(controlRanks, [20, 40, 60, 80, 100]))
      const temporalRanks = mechanicRank(state, V6_MECHANICS.temporalFlow)
      if (temporalRanks && (runtime.controlStatusApplications ?? 0) === 0) { delayEnemyAction(state, 300); runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1.05) }
      const controlledTempoRanks = mechanicRank(state, V6_MECHANICS.controlledTempo)
      if (controlledTempoRanks && !runtime.controlledTempoUsed) { delayEnemyAction(state, 150); runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1.03); runtime.controlledTempoUsed = true }
      const suppressionRanks = mechanicRank(state, V6_MECHANICS.suppressionWindow)
      if (suppressionRanks && state.combat.enemyActionDurationMs > 0 && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs <= 0.25 && (runtime.perfectTimingUntilMs ?? 0) <= runtime.elapsedMs) { delayEnemyAction(state, 250); runtime.perfectTimingUntilMs = runtime.elapsedMs + 8_000 }
      const timelineRanks = mechanicRank(state, V6_MECHANICS.timelineBreak)
      if (timelineRanks && (runtime.controlStatusApplications ?? 0) % 4 === 3) delayEnemyAction(state, rankPercent(timelineRanks, [100, 200, 300, 400, 500]))
      const fractureRanks = mechanicRank(state, V6_MECHANICS.statusFracture)
      if (fractureRanks && enemyStatusCount >= 3) delayEnemyAction(state, rankPercent(fractureRanks, [50, 100, 150, 200, 250]))
      const lockRanks = mechanicRank(state, V6_MECHANICS.lockdownDelay)
      if (lockRanks) delayEnemyAction(state, rankPercent(lockRanks, [75, 150, 225, 300, 375]))
      const absoluteRanks = mechanicRank(state, V6_MECHANICS.absoluteDelay)
      if (absoluteRanks) delayEnemyAction(state, rankPercent(absoluteRanks, [100, 200, 300, 400, 500]))
      const controlFlowRanks = mechanicRank(state, V6_MECHANICS.controlledFlow)
      if (controlFlowRanks) pushMana(rankPercent(controlFlowRanks, [1, 2, 3, 4, 5]))
      if (hasMechanic(state, V6_MECHANICS.perfectTiming)
        && state.combat.enemyActionDurationMs > 0
        && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs <= 0.25
        && (runtime.perfectTimingUntilMs ?? 0) <= runtime.elapsedMs) {
        delayEnemyAction(state, 750)
        runtime.perfectTimingUntilMs = runtime.elapsedMs + 5_000
      }
      if (hasMechanic(state, V6_MECHANICS.temporalFracture) && (runtime.controlStatusApplications ?? 0) % 4 === 3) {
        delayEnemyAction(state, 750)
        reduceAllCooldowns(state, 500)
        runtime.temporalFractureCount = (runtime.temporalFractureCount ?? 0) + 1
      }
      runtime.controlStatusApplications = (runtime.controlStatusApplications ?? 0) + 1
    }
  }

  if ((event === 'on-status-expired' || event === 'on-status-removed') && context.eventTarget === 'enemy' && isControlEvent(context)) {
    if (event === 'on-status-expired') {
      if (hasMechanic(state, V6_MECHANICS.statusEcho)) runtime.nextControlStatusDurationMultiplier = 1 + rankPercent(mechanicRank(state, V6_MECHANICS.statusEcho), [0.02, 0.04, 0.06, 0.08, 0.10])
      if (hasMechanic(state, V6_MECHANICS.statusRecursion)) runtime.nextControlStatusDurationMultiplier = 1 + rankPercent(mechanicRank(state, V6_MECHANICS.statusRecursion), [0.03, 0.06, 0.09, 0.12, 0.15])
      const recoveryRanks = mechanicRank(state, V6_MECHANICS.recoveryWindowControl)
      if (recoveryRanks) reduceLongestCooldown(state, rankPercent(recoveryRanks, [100, 200, 300, 400, 500]))
      const noEscapeRanks = mechanicRank(state, V6_MECHANICS.noEscape)
      if (noEscapeRanks && state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) < 0.25) delayEnemyAction(state, rankPercent(noEscapeRanks, [100, 200, 300, 400, 500]))
      if (hasMechanic(state, V6_MECHANICS.aftershock)) effects.push({ type: 'apply-status', target: 'opponent', statusId: 'chilled', durationMs: rankPercent(mechanicRank(state, V6_MECHANICS.aftershock), [1000, 2000, 3000, 4000, 5000]) })
    }
    const conversionRanks = mechanicRank(state, V6_MECHANICS.controlConversion)
    if (event === 'on-status-removed' && conversionRanks) { pushMana(rankPercent(conversionRanks, [1, 2, 3, 4, 5])); reduceLongestCooldown(state, rankPercent(conversionRanks, [100, 200, 300, 400, 500])) }
  }

  if (event === 'on-barrier-broken' && actor === 'player') {
    const secondSkinRanks = mechanicRank(state, V6_MECHANICS.secondSkin)
    if (secondSkinRanks) pushHeal(rankPercent(secondSkinRanks, [0.0025, 0.005, 0.0075, 0.01, 0.0125]))
    const breakRecoveryRanks = mechanicRank(state, V6_MECHANICS.barrierBreakRecovery)
    if (breakRecoveryRanks) pushHeal(rankPercent(breakRecoveryRanks, [0.0075, 0.015, 0.0225, 0.03, 0.0375]))
    const aegisRanks = mechanicRank(state, V6_MECHANICS.arcaneAegis)
    if (aegisRanks && context.previousBarrier && (runtime.arcaneAegisLastAtMs ?? -Infinity) + 10_000 <= runtime.elapsedMs) {
      pushBarrierFlat(context.previousBarrier * 0.20)
      runtime.arcaneAegisLastAtMs = runtime.elapsedMs
    }
    const pulseRanks = mechanicRank(state, V6_MECHANICS.barrierPulse)
    if (pulseRanks) reduceAllCooldowns(state, rankPercent(pulseRanks, [200, 400, 600, 800, 1000]))
  }

  if (event === 'on-barrier-gained' && actor === 'player') {
    const renewalRanks = mechanicRank(state, V6_MECHANICS.wardRenewal)
    if (renewalRanks) pushHeal(rankPercent(renewalRanks, [0.002, 0.004, 0.006, 0.008, 0.01]))
    const momentumRanks = mechanicRank(state, V6_MECHANICS.aegisMomentum)
    if (momentumRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(momentumRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    const eternalAegisRanks = mechanicRank(state, V6_MECHANICS.eternalAegis)
    if (eternalAegisRanks && (context.barrierGained ?? 0) > 0) pushConversionHeal(Math.min(0.03, (context.barrierGained ?? 0) * 0.15 / Math.max(1, state.player.maxHealth)))
  }

  if (event === 'on-heal' && actor === 'player' && (hasMechanic(state, V6_MECHANICS.livingBastion) || hasMechanic(state, V6_MECHANICS.eternalAegis)) && getActiveBarrier(state, 'player') > 0 && (context.amount ?? 0) > 0) {
    const conversion = Math.min(state.player.maxHealth * 0.03, (context.amount ?? 0) * (hasMechanic(state, V6_MECHANICS.eternalAegis) ? 0.15 : 0.10))
    if (conversion > 0) pushBarrierFlat(conversion, true)
  }

  if (event === 'on-heal' && actor === 'player' && hasMechanic(state, V6_MECHANICS.overhealWard) && (context.overheal ?? 0) > 0) {
    const conversion = rankPercent(mechanicRank(state, V6_MECHANICS.overhealWard), [0.10, 0.20, 0.30, 0.40, 0.50])
    const barrierPercent = Math.min(0.05, conversion * (context.overheal ?? 0) / Math.max(1, state.player.maxHealth))
    if (barrierPercent > 0) pushBarrier(barrierPercent)
  }

  if (event === 'on-damage-dealt' && actor === 'player' && (context.healthDamage ?? 0) > 0) {
    if (runtime.arcaneOverloadReady && context.source?.kind === 'spell' && context.sourceTags?.includes('direct')) {
      const echoDamage = Math.max(0, (context.amount ?? context.healthDamage ?? 0) * 0.15)
      if (echoDamage > 0) effects.push({ type: 'deal-damage', target: 'opponent', components: [{ damageType: context.damageType ?? 'arcane', magnitude: { type: 'flat', value: echoDamage } }], tags: ['special'] })
      runtime.arcaneOverloadReady = false
    }
    if (hasMechanic(state, V6_MECHANICS.burningMomentum) && context.sourceTags?.includes('dot')) runtime.ruinStacks = Math.min(5, (runtime.ruinStacks ?? 0) + 1)
    if (context.sourceTags?.includes('dot') && context.eventTarget === 'enemy' && (context.currentHp ?? 1) <= 0) {
      if (hasMechanic(state, V6_MECHANICS.chainReaction)) runtime.chainReactionReady = true
      if (hasMechanic(state, V6_MECHANICS.ruinTransfer)) { runtime.ruinTransferReady = true; runtime.ruinTransferMultiplier = 1 + rankPercent(mechanicRank(state, V6_MECHANICS.ruinTransfer), [0.03, 0.06, 0.09, 0.12, 0.15]) }
    }
  }

  if (event === 'on-damage-taken' && actor === 'player') {
    const painRanks = mechanicRank(state, V6_MECHANICS.painToMana)
    if (painRanks && (runtime.lastDamageTakenAtMs ?? -Infinity) + 1000 <= runtime.elapsedMs) { pushMana((context.healthDamage ?? 0) * rankPercent(painRanks, [0.01, 0.02, 0.03, 0.04, 0.05])); runtime.lastDamageTakenAtMs = runtime.elapsedMs }
    const reactiveRanks = mechanicRank(state, V6_MECHANICS.reactiveWard)
    if (reactiveRanks && (context.previousBarrier ?? 0) <= 0) pushBarrier(rankPercent(reactiveRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const survivalRanks = mechanicRank(state, V6_MECHANICS.survivalInstinct)
    if (survivalRanks && (context.currentHpPercent ?? 100) < 10) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(survivalRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (hasMechanic(state, V6_MECHANICS.secondWind) && !runtime.secondWindUsed && (context.currentHpPercent ?? 100) < 30) {
      pushHeal(0.05)
      runtime.secondWindUsed = true
    }
    if (hasMechanic(state, V6_MECHANICS.refuseDeath) && !runtime.refuseDeathThresholdUsed && (context.currentHpPercent ?? 100) < 15) {
      pushBarrier(0.10)
      runtime.refuseDeathThresholdUsed = true
    }
  }

  if (event === 'on-heal' && actor === 'player') {
    const momentumRanks = mechanicRank(state, V6_MECHANICS.healingMomentum)
    if (momentumRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(momentumRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    const surgeRanks = mechanicRank(state, V6_MECHANICS.recoverySurge)
    if (surgeRanks && (context.previousHpPercent ?? 100) < 25) pushHeal(rankPercent(surgeRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
  }

  if (event === 'on-kill' && actor === 'player' && context.eventTarget === 'enemy') {
    const recoveryRanks = mechanicRank(state, V6_MECHANICS.victoryRecovery)
    if (recoveryRanks) pushHeal(rankPercent(recoveryRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const restorationRanks = mechanicRank(state, V6_MECHANICS.victoryRestoration)
    if (restorationRanks) pushHeal(rankPercent(restorationRanks, [0.02, 0.04, 0.06, 0.08, 0.10]))
    const focusedRanks = mechanicRank(state, V6_MECHANICS.focusedRecovery)
    if (focusedRanks) pushMana(rankPercent(focusedRanks, [2, 4, 6, 8, 10]))
    const chainRanks = mechanicRank(state, V6_MECHANICS.executionChain)
    if (chainRanks) runtime.nextEnemyDamageMultiplier = Math.max(runtime.nextEnemyDamageMultiplier ?? 1, 1 + rankPercent(chainRanks, [0.03, 0.06, 0.09, 0.12, 0.15]))
    if (hasMechanic(state, V6_MECHANICS.victoryMomentum)) runtime.victoryMomentumReady = true
  }

  if (event === 'on-action-start' && actor === 'player' && context.source?.actor === 'enemy' && state.combat.enemyStatuses.some((status) => controlStatusIds.has(status.statusId))) {
    const tempoRanks = mechanicRank(state, V6_MECHANICS.tempoTheft)
    if (tempoRanks) pushMana(rankPercent(tempoRanks, [1, 2, 3, 4, 5]))
  }

  if (effects.length && executeEffects) executeEffects(state, effects, source, depth + 1, uiEvents, resolution)
}

/** Shared classification used by Power/Focus/Control nodes that describe cost bands. */
export const classifyArcaneCoreSpellCost = (context: Pick<ArcaneCoreSpellCastContext, 'manaCost' | 'maxMana'>) => {
  const ratio = context.manaCost / Math.max(1, context.maxMana)
  return { ratio, low: ratio < 0.08, high: ratio >= 0.12, overcharged: ratio >= 0.15, extreme: ratio >= 0.2 }
}

/**
 * Resolves the reusable V6 cast primitives. Authored node names remain data;
 * this adapter owns sequence counters, AUTO/MANUAL alternation, cost bands,
 * temporary next-cast tokens, and encounter-local cycle rewards.
 */
export const getArcaneCoreV6CastModifiers = (state: GameState, context: ArcaneCoreSpellCastContext, preview = false): ArcaneCoreV6CastModifiers => {
  const runtime = state.combat.arcaneCoreRuntime
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
  const reservedFocus = selectUsedFocus(state)
  const freeFocus = selectFreeFocus(state)
  const currentBarrier = getActiveBarrier(state, 'player')
  const currentHealthPercent = state.player.health / Math.max(1, state.player.maxHealth) * 100
  const currentManaPercent = context.playerMana / Math.max(1, context.maxMana) * 100
  const differentSpellPreview = preview && context.damaging && runtime.lastSpellId !== context.spellId ? (runtime.differentSpellStreak ?? 0) + 1 : runtime.differentSpellStreak ?? 0
  const alternatingPreview = preview && runtime.lastCastOrigin && runtime.lastCastOrigin !== context.origin ? (runtime.alternatingCastStreak ?? 0) + 1 : runtime.alternatingCastStreak ?? 0
  let free = false

  if (hasMechanic(state, V6_MECHANICS.absoluteStasis) && (runtime.absoluteStasisUntilMs ?? 0) > runtime.elapsedMs) actionSpeedMultiplier *= 1.15

  const autoCastNumber = (runtime.autoCastCount ?? 0) + (preview && context.origin === 'auto' ? 1 : 0)
  if (context.origin === 'auto' && autoSlots > 0 && hasMechanic(state, V6_MECHANICS.echoHarmony) && autoCastNumber > 0 && autoCastNumber % 3 === 0) {
    manaRestoreFlat += rankValue(mechanicRank(state, V6_MECHANICS.echoHarmony), [1, 2, 3, 4, 5])
  }
  if (context.origin !== 'auto' && hasMechanic(state, V6_MECHANICS.timelineTheft) && (runtime.stolenTimeStacks ?? 0) > 0) {
    actionSpeedMultiplier *= 1 + (runtime.stolenTimeStacks ?? 0) * rankValue(mechanicRank(state, V6_MECHANICS.timelineTheft), [0.02, 0.04, 0.06, 0.08, 0.10])
    if (!preview) runtime.stolenTimeStacks = 0
  }
  if (hasMechanic(state, V6_MECHANICS.eventHorizon) && currentManaPercent < 25 && (runtime.overflowCharges ?? 0) > 0) {
    manaRestoreFlat += context.maxMana * 0.05
    if (!preview) runtime.overflowCharges = Math.max(0, (runtime.overflowCharges ?? 0) - 1)
  }
  const singularityTrigger = hasMechanic(state, V6_MECHANICS.arcaneSingularity)
    && !runtime.singularityUsed
    && currentManaPercent < 10
  if (singularityTrigger) {
    manaCostMultiplier *= 0.6
    manaRestoreFlat += Math.max(0, context.maxMana * 0.5 - context.playerMana)
    if (!preview) {
      runtime.singularityUsed = true
      runtime.manaRegenDisabledUntilMs = runtime.elapsedMs + 5_000
    }
  }
  if (hasMechanic(state, V6_MECHANICS.deepBreathing) && currentManaPercent < 25 && !runtime.deepBreathingUsed) {
    manaRestoreFlat += context.maxMana * 0.10
    if (!preview) runtime.deepBreathingUsed = true
  }
  if (hasMechanic(state, V6_MECHANICS.immortalGuard) && hasHealing && (runtime.immortalGuardUntilMs ?? 0) > runtime.elapsedMs) {
    actionSpeedMultiplier *= 100
    if (!preview) runtime.immortalGuardUntilMs = undefined
  }
  if (context.damaging && hasDirectDamage && (runtime.ruinStacks ?? 0) > 0 && hasMechanic(state, V6_MECHANICS.burningMomentum)) {
    damageMultiplier += (runtime.ruinStacks ?? 0) * rankValue(mechanicRank(state, V6_MECHANICS.burningMomentum), [0.01, 0.02, 0.03, 0.04, 0.05])
    if (!preview) runtime.ruinStacks = 0
  }
  if (context.damaging && hasDirectDamage && runtime.chainReactionReady && hasMechanic(state, V6_MECHANICS.chainReaction)) {
    damageMultiplier += 0.40
    if (!preview) runtime.chainReactionReady = false
  }
  if (context.damaging && hasDamageOverTime && runtime.ruinTransferReady && hasMechanic(state, V6_MECHANICS.ruinTransfer)) {
    effectivenessMultiplier *= runtime.ruinTransferMultiplier ?? 1
    if (!preview) { runtime.ruinTransferReady = false; runtime.ruinTransferMultiplier = 1 }
  }

  for (const entry of entries(state)) {
    const rank = entry.rank
    const mechanicId = entry.mechanicId
    if (mechanicId === V6_MECHANICS.conservation && castNumber % 6 === 0) manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === V6_MECHANICS.arcaneSpark && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.arcaneMomentum && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === V6_MECHANICS.perfectCycle && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.06, 0.12, 0.18, 0.24, 0.30])
    if (mechanicId === V6_MECHANICS.arcaneEcho && context.damaging && nextDamagingNumber % 6 === 0) damageMultiplier += rankValue(rank, [0.05, 0.10, 0.15, 0.20, 0.25])
    if (mechanicId === V6_MECHANICS.arcaneRhythm && context.damaging && nextDamagingNumber % 5 === 0) damageMultiplier += 0.10
    if (mechanicId === V6_MECHANICS.unstablePower && context.damaging && nextDamagingNumber % 5 === 0) { damageMultiplier += 0.30; manaCostMultiplier *= 1.15 }
    if (mechanicId === V6_MECHANICS.overcharge && costBand.ratio >= 0.10) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.overcast && costBand.overcharged) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === V6_MECHANICS.manaBurn && context.playerMana / Math.max(1, context.maxMana) < 0.2) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.desperatePower && context.playerMana / Math.max(1, context.maxMana) < 0.2) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.manaEdge && context.playerMana / Math.max(1, context.maxMana) > 0.8) damageMultiplier += rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === V6_MECHANICS.finisher && context.enemyHealthPercent < 25) damageMultiplier += rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((mechanicId === V6_MECHANICS.openingVolley || mechanicId === V6_MECHANICS.firstBlood) && context.damaging && damagingNumber <= 1) damageMultiplier += rankValue(rank, mechanicId === V6_MECHANICS.openingVolley ? [0.03, 0.06, 0.09, 0.12, 0.15] : [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === V6_MECHANICS.apotheosisExecution && context.enemyHealthPercent < 20) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === V6_MECHANICS.perfectExecution && context.enemyHealthPercent < 20) damageMultiplier += 0.10
    if (mechanicId === V6_MECHANICS.convergence && alternatingPreview >= (preview ? 3 : 4)) { free = true; actionSpeedMultiplier *= 1.2 }
    if (mechanicId === V6_MECHANICS.timeCompression && (runtime.alternatingCastStreak ?? 0) >= (preview ? 1 : 2)) actionSpeedMultiplier *= 1.2
    if (mechanicId === V6_MECHANICS.zeroPoint && castNumber % 8 === 0) manaCostMultiplier *= 1 - rankValue(rank, [0.2, 0.4, 0.6, 0.8, 1])
    if (mechanicId === V6_MECHANICS.cataclysm && costBand.overcharged && damagingNumber === 0) { damageMultiplier += 0.30; manaCostMultiplier *= 1.15 }
    if (mechanicId === V6_MECHANICS.overchannelMajor && runtime.overchannelUntilMs && runtime.overchannelUntilMs > runtime.elapsedMs) { actionSpeedMultiplier *= 1.10; effectivenessMultiplier *= 1.075 }
    if (mechanicId === V6_MECHANICS.queuedPrecision && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.preparedCast && context.origin !== 'auto' && damagingNumber === 0) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.manualTiming && context.origin !== 'auto') actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.absoluteQueue && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])

    // V6 condition and sequence primitives. These stay keyed to authored
    // mechanic names, while the counters and cost bands remain shared.
    if (mechanicId === V6_MECHANICS.perfectWindow && context.enemyHealthPercent > 90) critDamageBonus += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.criticalFinish && context.damaging && context.enemyHealthPercent < 25) critDamageBonus += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.markedPrecision && hasControl) critChanceBonus += rankValue(rank, [0.002, 0.004, 0.006, 0.008, 0.010])
    if (mechanicId === V6_MECHANICS.perfectPrecision && context.damaging && (runtime.failedCritStreak ?? 0) >= 2) critChanceBonus += 0.15
    if (mechanicId === V6_MECHANICS.spellSequence && context.damaging && differentSpellPreview >= 3) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === V6_MECHANICS.rapidEscalation && context.damaging && (runtime.lastSuccessfulCastAtMs ?? -Infinity) >= runtime.elapsedMs - 3000) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.heavyFollowUp && context.damaging && costBand.low && runtime.nextLowCostDamageMultiplier && runtime.nextLowCostDamageMultiplier > 1) damageMultiplier *= runtime.nextLowCostDamageMultiplier
    if ((mechanicId === V6_MECHANICS.debuffAssault || mechanicId === V6_MECHANICS.corrodedDefense || mechanicId === V6_MECHANICS.debuffPressure) && negativeStatusCount >= 2) damageMultiplier += rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((mechanicId === V6_MECHANICS.dominatingWeakness || mechanicId === V6_MECHANICS.absolutePressure) && negativeStatusCount >= 3) damageMultiplier += rankValue(rank, mechanicId === V6_MECHANICS.absolutePressure ? [0.015, 0.03, 0.045, 0.06, 0.075] : [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.risingViolence) damageMultiplier += Math.floor(Math.max(0, 100 - context.enemyHealthPercent) / 25) * rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === V6_MECHANICS.cooldownPunisher && (spell?.cooldownMs ?? 0) >= 20_000) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.lingeringExecution && hasDamageOverTime && context.enemyHealthPercent < 35) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.unstableRotation && context.damaging && (runtime.costBandHistory ?? []).length >= 2 && (runtime.costBandHistory ?? [])[((runtime.costBandHistory ?? []).length) - 2] === 'high' && (runtime.costBandHistory ?? [])[(runtime.costBandHistory ?? []).length - 1] === 'low' && costBand.high) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === V6_MECHANICS.sovereignSequence && context.damaging && differentSpellPreview >= 5) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === V6_MECHANICS.firstBlood && context.damaging && (runtime.enemyDamagingSpellCount ?? 0) <= 1) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === V6_MECHANICS.lastWord && context.damaging && context.enemyHealthPercent < 20 && !runtime.lastWordUsed) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (mechanicId === V6_MECHANICS.sovereignCrit && context.damaging && runtime.nextNonCritDamageMultiplier && runtime.nextNonCritDamageMultiplier > 1) damageMultiplier *= runtime.nextNonCritDamageMultiplier
    if (mechanicId === V6_MECHANICS.victoryMomentum && context.damaging && runtime.victoryMomentumReady) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.sovereignCasting && context.damaging && (runtime.sovereigntyCharges ?? 0) > 0) damageMultiplier += 0.12
    if (mechanicId === V6_MECHANICS.absoluteMomentum && context.damaging && differentSpellPreview >= 3) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.limitBreak && costBand.extreme) manaRefundPercent = Math.max(manaRefundPercent, 0)
    if (mechanicId === V6_MECHANICS.arcaneApotheosis && runtime.apotheosisUntilMs && runtime.apotheosisUntilMs > runtime.elapsedMs) { damageMultiplier += 0.20; manaCostMultiplier *= 0.85; actionSpeedMultiplier *= 1.10 }

    if (mechanicId === V6_MECHANICS.protectiveCasting && currentBarrier > 0 && !context.damaging) actionSpeedMultiplier *= 1 + rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === V6_MECHANICS.defiantCasting && currentHealthPercent < 35 && (hasHealing || hasBarrier)) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.safeOffensive && currentBarrier >= state.player.maxHealth * 0.1 && context.damaging) damageMultiplier += rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (mechanicId === V6_MECHANICS.bastionCast && currentBarrier > 0 && !context.damaging) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.lastBreath && runtime.nextHealingActionSpeedMultiplier && hasHealing) actionSpeedMultiplier *= runtime.nextHealingActionSpeedMultiplier

    if (mechanicId === V6_MECHANICS.fullReservoir && currentManaPercent > 90 && runtime.lastSuccessfulCastAtMs !== undefined && runtime.elapsedMs - runtime.lastSuccessfulCastAtMs >= 3000) manaCostMultiplier *= 1 - rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.deepReservoir && (runtime.spellCastCount + (preview ? 1 : 0)) === 1) free = true
    if (mechanicId === V6_MECHANICS.manualReservoir && context.origin !== 'auto' && runtime.lastCastOrigin === 'auto') manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === V6_MECHANICS.alternatingMind && runtime.lastCastOrigin && runtime.lastCastOrigin !== context.origin) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.efficientQueue && context.origin === 'manual-queued') manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.echoDiscipline && autoSlots > 0 && manualSlots >= Math.ceil(deck.length / 2)) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.dualMind && runtime.lastCastOrigin && runtime.lastCastOrigin !== context.origin) { manaCostMultiplier *= 0.92; actionSpeedMultiplier *= 1.05 }
    if (mechanicId === V6_MECHANICS.preparedSlot && context.loadoutSlotIndex !== null && !runtime.castLoadoutSlots?.includes(context.loadoutSlotIndex)) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.resonance && (runtime.spellCastCount + (preview ? 1 : 0)) % 10 === 0) manaRefundPercent = 0.5
    if (mechanicId === V6_MECHANICS.echoBattery && context.origin === 'manual-direct' && (runtime.echoCharges ?? 0) > 0) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]) * (runtime.echoCharges ?? 0)
    if (mechanicId === V6_MECHANICS.manualCharge && context.origin === 'auto' && (runtime.manualCharges ?? 0) > 0) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]) * (runtime.manualCharges ?? 0)
    if (mechanicId === V6_MECHANICS.preparedCast && context.origin !== 'auto' && (runtime.manualCastCount ?? 0) <= 1) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.queuedPrecision && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.balancedMind && autoSlots >= 2 && manualSlots >= 2) { actionSpeedMultiplier *= 1 + rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025]) }
    if (mechanicId === V6_MECHANICS.reservedConversion && context.origin === 'auto' && (runtime.enemyDamagingSpellCount ?? 0) === 0) manaRestoreFlat += Math.floor(reservedFocus / 20) * rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === V6_MECHANICS.freeFocusSurge && context.origin !== 'auto' && (runtime.enemyDamagingSpellCount ?? 0) === 0) actionSpeedMultiplier *= 1 + Math.floor(freeFocus / 20) * rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.deepDraw && currentManaPercent < 20) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.arcaneReturn) manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (mechanicId === V6_MECHANICS.emptyMind && currentManaPercent < 20 && context.damaging) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.astralMind) actionSpeedMultiplier *= 1 + Math.min(0.075, Math.floor(freeFocus / 10) * 0.005)
    if (mechanicId === V6_MECHANICS.astralRotation && context.loadoutSlotIndex !== null && runtime.differentLoadoutSlotStreak && runtime.differentLoadoutSlotStreak >= 2) manaRefundPercent = Math.max(manaRefundPercent, rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]))
    if (mechanicId === V6_MECHANICS.echoCascade && context.origin !== 'auto' && (runtime.consecutiveAutoCasts ?? 0) >= 3) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.manualCascade && context.origin === 'auto' && (runtime.consecutiveManualCasts ?? 0) >= 3) effectivenessMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (mechanicId === V6_MECHANICS.singularityEcho && context.origin !== 'auto' && runtime.lastCastOrigin === 'auto' && runtime.lastCastAtFullMana) effectivenessMultiplier *= 1 + rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (mechanicId === V6_MECHANICS.singularityManual && context.origin === 'auto' && runtime.nextAutoRefundPercent) manaRefundPercent = Math.max(manaRefundPercent, runtime.nextAutoRefundPercent)
    if (mechanicId === V6_MECHANICS.focusCollapse) {
      if (context.origin === 'auto' && reservedFocus > state.player.maxFocus * 0.75) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
      if (context.origin !== 'auto' && reservedFocus < state.player.maxFocus * 0.25) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    }
    if (mechanicId === V6_MECHANICS.perfectConservation && runtime.lastManaBand !== undefined && runtime.lastManaBand === Math.floor(currentManaPercent / 25)) manaRefundPercent = Math.max(manaRefundPercent, 0)

    if (mechanicId === V6_MECHANICS.manualTiming && context.origin !== 'auto' && state.combat.enemyActionDurationMs > 0 && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs < 0.25) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if ((mechanicId === V6_MECHANICS.controlledStrike || mechanicId === V6_MECHANICS.controlledTarget) && hasControl && context.damaging) damageMultiplier += rankValue(rank, mechanicId === V6_MECHANICS.controlledTarget ? [0.025, 0.05, 0.075, 0.10, 0.125] : [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((mechanicId === V6_MECHANICS.debuffPressure || mechanicId === V6_MECHANICS.endlessPressure) && negativeStatusCount >= (mechanicId === V6_MECHANICS.endlessPressure ? 4 : 2)) damageMultiplier += rankValue(rank, mechanicId === V6_MECHANICS.endlessPressure ? [0.03, 0.06, 0.09, 0.12, 0.15] : [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.queuedDominion && context.origin === 'manual-queued' && hasNegativeStatus) statusDurationMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (mechanicId === V6_MECHANICS.suppressionWindow && runtime.nextActionSpeedMultiplier && runtime.nextActionSpeedMultiplier > 1) actionSpeedMultiplier *= runtime.nextActionSpeedMultiplier
    if (mechanicId === V6_MECHANICS.statusEcho && hasControl && runtime.nextControlStatusDurationMultiplier) statusDurationMultiplier *= runtime.nextControlStatusDurationMultiplier
    if (mechanicId === V6_MECHANICS.statusRecursion && hasControl && runtime.nextControlStatusDurationMultiplier) statusDurationMultiplier *= runtime.nextControlStatusDurationMultiplier
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
  return {
    free: free || manaCostMultiplier <= 0,
    damageMultiplier: damageMultiplier * nextDamageMultiplier * nextEnemyDamageMultiplier,
    effectivenessMultiplier: effectivenessMultiplier * nextEffectivenessMultiplier,
    actionSpeedMultiplier: actionSpeedMultiplier * nextActionSpeedMultiplier,
    manaCostMultiplier,
    manaRefundPercent: Math.max(0, Math.min(1, manaRefundPercent + nextManaRefundPercent)),
    manaRestoreFlat,
    critChanceBonus,
    critDamageBonus,
    guaranteedCrit,
    statusDurationMultiplier,
  }
}

export const commitArcaneCoreV6SpellCast = (state: GameState, context: ArcaneCoreSpellCastContext) => {
  const runtime = state.combat.arcaneCoreRuntime
  const previousOrigin = runtime.lastCastOrigin
  const previousSpell = runtime.lastSpellId
  const previousSlot = runtime.lastLoadoutSlotIndex
  runtime.spellCastCount += 1
  if (context.damaging) runtime.damagingSpellCount += 1
  runtime.differentSpellStreak = previousSpell && previousSpell !== context.spellId ? (runtime.differentSpellStreak ?? 0) + 1 : 1
  runtime.alternatingCastStreak = previousOrigin && previousOrigin !== context.origin ? (runtime.alternatingCastStreak ?? 0) + 1 : 1
  runtime.differentLoadoutSlotStreak = previousSlot !== null && previousSlot !== undefined && previousSlot !== context.loadoutSlotIndex ? (runtime.differentLoadoutSlotStreak ?? 0) + 1 : 1
  runtime.consecutiveAutoCasts = context.origin === 'auto' ? (runtime.consecutiveAutoCasts ?? 0) + 1 : 0
  runtime.consecutiveManualCasts = context.origin === 'auto' ? 0 : (runtime.consecutiveManualCasts ?? 0) + 1
  runtime.manualCastCount = context.origin === 'auto' ? (runtime.manualCastCount ?? 0) : (runtime.manualCastCount ?? 0) + 1
  if (context.origin === 'auto') runtime.echoCharges = Math.min(5, (runtime.echoCharges ?? 0) + 1)
  else runtime.manualCharges = Math.min(5, (runtime.manualCharges ?? 0) + 1)
  if (context.loadoutSlotIndex !== null && context.loadoutSlotIndex !== undefined) runtime.castLoadoutSlots = [...new Set([...(runtime.castLoadoutSlots ?? []), context.loadoutSlotIndex])]
  const band = classifyArcaneCoreSpellCost(context)
  const bandName: 'low' | 'high' | 'overcharged' | 'extreme' = band.extreme ? 'extreme' : band.overcharged ? 'overcharged' : band.high ? 'high' : 'low'
  runtime.costBandHistory = [...(runtime.costBandHistory ?? []), bandName].slice(-3)
  runtime.lastSuccessfulCastAtMs = runtime.elapsedMs
  runtime.lastCastAtFullMana = context.playerMana >= context.maxMana
  if (hasMechanic(state, V6_MECHANICS.eventHorizon) && context.playerMana >= context.maxMana) {
    runtime.overflowCharges = Math.min(mechanicRank(state, V6_MECHANICS.eventHorizon), (runtime.overflowCharges ?? 0) + 1)
  }
  if (runtime.spellCastCount === 1 && hasMechanic(state, V6_MECHANICS.sovereignCasting)) runtime.sovereigntyCharges = 3
  if (context.damaging && hasMechanic(state, V6_MECHANICS.arcaneOverload) && runtime.damagingSpellCount % 6 === 0) runtime.arcaneOverloadReady = true
  runtime.lastCastOrigin = context.origin
  runtime.lastSpellId = context.spellId
  runtime.lastLoadoutSlotIndex = context.loadoutSlotIndex
  if (context.origin === 'manual-queued' && hasMechanic(state, V6_MECHANICS.tacticalQueue)) reduceAllCooldowns(state, rankValue(mechanicRank(state, V6_MECHANICS.tacticalQueue), [50, 100, 150, 200, 250]))
  const result = getArcaneCoreV6CastModifiers(state, context)
  if (hasMechanic(state, V6_MECHANICS.lastWord) && context.damaging && context.enemyHealthPercent < 20) runtime.lastWordUsed = true
  if (hasMechanic(state, V6_MECHANICS.arcaneApotheosis) && context.damaging && runtime.damagingSpellCount >= 8 && !runtime.apotheosisUntilMs) runtime.apotheosisUntilMs = runtime.elapsedMs + 6000
  if (hasMechanic(state, V6_MECHANICS.overchannelMajor) && band.ratio >= 0.25) {
    runtime.overchannelUntilMs = runtime.elapsedMs + 5000
    runtime.manaRegenDisabledUntilMs = runtime.elapsedMs + 5000
  }
  return result
}

/** Resolves the V6 lethal-survival tokens without coupling the generic combat
 * resolver to catalog names. The caller owns the final HP assignment. */
export const tryConsumeArcaneCoreV6Survival = (state: GameState) => {
  const runtime = state.combat.arcaneCoreRuntime
  if (hasMechanic(state, V6_MECHANICS.undying) && !runtime.immortalGuardUsed) {
    runtime.immortalGuardUsed = true
    runtime.undyingUntilMs = runtime.elapsedMs + 1_500
    runtime.lastSurvivalToken = 'undying'
    return 'undying' as const
  }
  return null
}

/** Commits direct-hit crit state after the combat resolver has rolled the hit. */
export const recordArcaneCoreV6CriticalResult = (state: GameState, critical: boolean) => {
  const runtime = state.combat.arcaneCoreRuntime
  runtime.failedCritStreak = critical ? 0 : (runtime.failedCritStreak ?? 0) + 1
  if (critical && hasMechanic(state, V6_MECHANICS.criticalFeedback) && (runtime.criticalFeedbackLastAtMs ?? -Infinity) + 750 <= runtime.elapsedMs) {
    reduceAllCooldowns(state, rankValue(mechanicRank(state, V6_MECHANICS.criticalFeedback), [30, 60, 90, 120, 150]))
    runtime.criticalFeedbackLastAtMs = runtime.elapsedMs
  }
  if (critical && hasMechanic(state, V6_MECHANICS.criticalRecovery) && (runtime.criticalRecoveryLastAtMs ?? -Infinity) + 750 <= runtime.elapsedMs) {
    state.player.mana = Math.min(state.player.maxMana, state.player.mana + rankValue(mechanicRank(state, V6_MECHANICS.criticalRecovery), [1, 2, 3, 4, 5]))
    runtime.criticalRecoveryLastAtMs = runtime.elapsedMs
  }
  if (!critical && hasMechanic(state, V6_MECHANICS.secondChance)) {
    runtime.nextCritChanceBonus = rankValue(mechanicRank(state, V6_MECHANICS.secondChance), [0.002, 0.004, 0.006, 0.008, 0.010])
  }
  if (!critical && hasMechanic(state, V6_MECHANICS.perfectPrecision) && (runtime.failedCritStreak ?? 0) >= 2) {
    runtime.nextCritChanceBonus = Math.max(runtime.nextCritChanceBonus ?? 0, 0.15)
    // Perfect Precision empowers the next attempt; a failed empowered attempt
    // starts a fresh two-miss window instead of repeatedly stacking the bonus.
    runtime.failedCritStreak = 0
  }
  if (!critical && (runtime.sovereigntyCharges ?? 0) > 0 && hasMechanic(state, V6_MECHANICS.sovereignCasting)) runtime.sovereigntyCharges = Math.max(0, (runtime.sovereigntyCharges ?? 0) - 1)
  if (critical && hasMechanic(state, V6_MECHANICS.sovereignCrit)) runtime.nextNonCritDamageMultiplier = 1
}
