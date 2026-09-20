import type { CanonicalSpellId, GameState } from '../../types'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { selectFreeFocus, selectUsedFocus } from '../focus/focusReservations'
import { getActiveBarrier } from '../combat/barrierRuntime'
import type { CombatConditionContext, CombatEffect, CombatEventSink, CombatResolutionContext, CombatSource, CombatTrigger } from '../combat/combatTypes'
import { getArcaneCoreSpecialEffects } from './arcaneCoreProgression'

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
type V6Entry = Extract<ReturnType<typeof getArcaneCoreSpecialEffects>[number], { type: 'v6-mechanic' }>
const entries = (state: Pick<GameState, 'arcaneCore'>): V6Entry[] => getArcaneCoreSpecialEffects(state.arcaneCore).filter((effect): effect is V6Entry => effect.type === 'v6-mechanic')

type V6EffectExecutor = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink, resolution?: CombatResolutionContext) => void
const controlStatusIds = new Set(['chilled', 'frozen', 'tremored', 'stunned', 'entangled', 'silenced'])
const rankPercent = (rank: number, values: readonly number[]) => rankValue(rank, values)
const matchesScope = (entry: V6Entry, scope?: string) => !scope || entry.mechanicId === scope || entry.mechanicId.replace(/:r(\d+):/, ':$1:') === scope
const hasEntry = (state: GameState, displayName: string, scope?: string) => entries(state).some((entry) => entry.displayName === displayName && matchesScope(entry, scope))
const nodeRank = (state: GameState, displayName: string, scope?: string) => entries(state).filter((entry) => entry.displayName === displayName && matchesScope(entry, scope)).reduce((rank, entry) => Math.max(rank, entry.rank), 0)
const V6_MECHANICS = {
  criticalFeedback: 'power:r2:S3',
  secondChance: 'power:r2:S7',
  burningMomentum: 'power:r5:S3',
  chainReaction: 'power:r5:M',
  overhealWard: 'vitality:r1:S7',
  refuseDeath: 'vitality:r1:M',
  barrierMemory: 'vitality:r3:S5',
  immortalGuard: 'vitality:r4:M',
  echoHarmony: 'focus:r2:S3',
  eventHorizon: 'focus:r8:S4',
  arcaneSingularity: 'focus:r8:M',
  perfectTiming: 'control:r2:M',
  temporalFracture: 'control:r5:M',
  timelineTheft: 'control:r8:S5',
  absoluteStasis: 'control:r8:M',
} as const
const hasMechanic = (state: GameState, mechanicId: string) => entries(state).some((entry) => entry.mechanicId === mechanicId)
const mechanicRank = (state: GameState, mechanicId: string) => entries(state).find((entry) => entry.mechanicId === mechanicId)?.rank ?? 0
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
  const pushMana = (amount: number) => effects.push({ type: 'restore-resource', target: 'self', resource: 'mana', magnitude: { type: 'flat', value: amount } })

  if (event === 'on-status-applied' && actor === 'player' && context.eventTarget === 'enemy') {
    if (isNegativeStatusEvent(context) && hasEntry(state, 'Opportunist')) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(nodeRank(state, 'Opportunist'), [0.02, 0.04, 0.06, 0.08, 0.10]))
    if (isControlEvent(context)) {
      const controlRanks = nodeRank(state, 'Delayed Fate')
      if (controlRanks) delayEnemyAction(state, rankPercent(controlRanks, [20, 40, 60, 80, 100]))
      const temporalRanks = nodeRank(state, 'Temporal Flow')
      if (temporalRanks && (runtime.controlStatusApplications ?? 0) === 0) { delayEnemyAction(state, 500); runtime.nextActionSpeedMultiplier = Math.max(runtime.nextActionSpeedMultiplier ?? 1, 1.1) }
      const timelineRanks = nodeRank(state, 'Timeline Break')
      if (timelineRanks && (runtime.controlStatusApplications ?? 0) % 4 === 3) delayEnemyAction(state, rankPercent(timelineRanks, [100, 200, 300, 400, 500]))
      const fractureRanks = nodeRank(state, 'Status Fracture')
      if (fractureRanks && enemyStatusCount >= 3) delayEnemyAction(state, rankPercent(fractureRanks, [50, 100, 150, 200, 250]))
      const lockRanks = nodeRank(state, 'Lockdown Delay')
      if (lockRanks) delayEnemyAction(state, rankPercent(lockRanks, [75, 150, 225, 300, 375]))
      const absoluteRanks = nodeRank(state, 'Absolute Delay')
      if (absoluteRanks) delayEnemyAction(state, rankPercent(absoluteRanks, [100, 200, 300, 400, 500]))
      const controlFlowRanks = nodeRank(state, 'Controlled Flow')
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
      if (hasEntry(state, 'Status Echo')) runtime.nextControlStatusDurationMultiplier = 1 + rankPercent(nodeRank(state, 'Status Echo'), [0.02, 0.04, 0.06, 0.08, 0.10])
      if (hasEntry(state, 'Status Recursion')) runtime.nextControlStatusDurationMultiplier = 1 + rankPercent(nodeRank(state, 'Status Recursion'), [0.03, 0.06, 0.09, 0.12, 0.15])
      const recoveryRanks = nodeRank(state, 'Recovery Window', 'control:1:S6')
      if (recoveryRanks) reduceLongestCooldown(state, rankPercent(recoveryRanks, [100, 200, 300, 400, 500]))
      const noEscapeRanks = nodeRank(state, 'No Escape')
      if (noEscapeRanks && state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) < 0.25) delayEnemyAction(state, rankPercent(noEscapeRanks, [100, 200, 300, 400, 500]))
      if (hasEntry(state, 'Aftershock')) effects.push({ type: 'apply-status', target: 'opponent', statusId: 'chilled', durationMs: rankPercent(nodeRank(state, 'Aftershock'), [1000, 2000, 3000, 4000, 5000]) })
    }
    const conversionRanks = nodeRank(state, 'Control Conversion')
    if (event === 'on-status-removed' && conversionRanks) { pushMana(rankPercent(conversionRanks, [1, 2, 3, 4, 5])); reduceLongestCooldown(state, rankPercent(conversionRanks, [100, 200, 300, 400, 500])) }
  }

  if (event === 'on-barrier-broken' && actor === 'player') {
    const secondSkinRanks = nodeRank(state, 'Second Skin')
    if (secondSkinRanks) pushHeal(rankPercent(secondSkinRanks, [0.0025, 0.005, 0.0075, 0.01, 0.0125]))
    const breakRecoveryRanks = nodeRank(state, 'Barrier Break Recovery')
    if (breakRecoveryRanks) pushHeal(rankPercent(breakRecoveryRanks, [0.0075, 0.015, 0.0225, 0.03, 0.0375]))
    const aegisRanks = nodeRank(state, 'Arcane Aegis')
    if (aegisRanks && context.previousBarrier) effects.push({ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: context.previousBarrier * 0.25 }, mode: 'add', durationMs: null })
    const pulseRanks = nodeRank(state, 'Barrier Pulse')
    if (pulseRanks) reduceAllCooldowns(state, rankPercent(pulseRanks, [200, 400, 600, 800, 1000]))
  }

  if (event === 'on-barrier-gained' && actor === 'player') {
    const renewalRanks = nodeRank(state, 'Ward Renewal')
    if (renewalRanks) pushHeal(rankPercent(renewalRanks, [0.002, 0.004, 0.006, 0.008, 0.01]))
    const momentumRanks = nodeRank(state, 'Aegis Momentum')
    if (momentumRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(momentumRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
  }

  if (event === 'on-heal' && actor === 'player' && hasMechanic(state, V6_MECHANICS.overhealWard) && (context.overheal ?? 0) > 0) {
    const conversion = rankPercent(mechanicRank(state, V6_MECHANICS.overhealWard), [0.10, 0.20, 0.30, 0.40, 0.50])
    const barrierPercent = Math.min(0.05, conversion * (context.overheal ?? 0) / Math.max(1, state.player.maxHealth))
    if (barrierPercent > 0) pushBarrier(barrierPercent)
  }

  if (event === 'on-damage-dealt' && actor === 'player' && (context.healthDamage ?? 0) > 0) {
    if (hasMechanic(state, V6_MECHANICS.burningMomentum) && context.sourceTags?.includes('dot')) runtime.ruinStacks = Math.min(5, (runtime.ruinStacks ?? 0) + 1)
    if (hasMechanic(state, V6_MECHANICS.chainReaction) && context.sourceTags?.includes('dot') && context.eventTarget === 'enemy' && (context.currentHp ?? 1) <= 0) runtime.chainReactionReady = true
  }

  if (event === 'on-damage-taken' && actor === 'player') {
    const painRanks = nodeRank(state, 'Pain to Mana')
    if (painRanks && (runtime.lastDamageTakenAtMs ?? -Infinity) + 1000 <= runtime.elapsedMs) { pushMana((context.healthDamage ?? 0) * rankPercent(painRanks, [0.01, 0.02, 0.03, 0.04, 0.05])); runtime.lastDamageTakenAtMs = runtime.elapsedMs }
    const reactiveRanks = nodeRank(state, 'Reactive Ward')
    if (reactiveRanks && (context.previousBarrier ?? 0) <= 0) pushBarrier(rankPercent(reactiveRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const survivalRanks = nodeRank(state, 'Survival Instinct')
    if (survivalRanks && (context.currentHpPercent ?? 100) < 10) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(survivalRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
  }

  if (event === 'on-heal' && actor === 'player') {
    const momentumRanks = nodeRank(state, 'Healing Momentum')
    if (momentumRanks) runtime.nextSelfTargetActionSpeedMultiplier = 1 + rankPercent(momentumRanks, [0.02, 0.04, 0.06, 0.08, 0.10])
    const surgeRanks = nodeRank(state, 'Recovery Surge')
    if (surgeRanks && (context.previousHpPercent ?? 100) < 25) pushHeal(rankPercent(surgeRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
  }

  if (event === 'on-kill' && actor === 'player' && context.eventTarget === 'enemy') {
    const recoveryRanks = nodeRank(state, 'Victory Recovery')
    if (recoveryRanks) pushHeal(rankPercent(recoveryRanks, [0.005, 0.01, 0.015, 0.02, 0.025]))
    const restorationRanks = nodeRank(state, 'Victory Restoration')
    if (restorationRanks) pushHeal(rankPercent(restorationRanks, [0.02, 0.04, 0.06, 0.08, 0.10]))
    const focusedRanks = nodeRank(state, 'Focused Recovery')
    if (focusedRanks) pushMana(rankPercent(focusedRanks, [2, 4, 6, 8, 10]))
    const chainRanks = nodeRank(state, 'Execution Chain')
    if (chainRanks) runtime.nextDamageMultiplier = Math.max(runtime.nextDamageMultiplier ?? 1, 1 + rankPercent(chainRanks, [0.03, 0.06, 0.09, 0.12, 0.15]))
    runtime.victoryMomentumReady = true
  }

  if (event === 'on-action-start' && actor === 'player' && context.source?.actor === 'enemy' && state.combat.enemyStatuses.some((status) => controlStatusIds.has(status.statusId))) {
    const tempoRanks = nodeRank(state, 'Tempo Theft')
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
    manaCostMultiplier *= 0.5
    manaRestoreFlat += Math.max(0, context.maxMana * 0.5 - context.playerMana)
    if (!preview) {
      runtime.singularityUsed = true
      runtime.manaRegenDisabledUntilMs = runtime.elapsedMs + 5_000
    }
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

  for (const entry of entries(state)) {
    const rank = entry.rank
    const name = entry.displayName
    const scope = entry.mechanicId.replace(/:r(\d+):/, ':$1:')
    if (!context.damaging && /damaging Spell|Damage|Crit|DoT|Ruin|Execution|Volley|Assault|Power|Precision|Echo|Momentum|Overload|Overcharge|First Blood|Last Word/i.test(name)) continue
    if (name === 'Arcane Spark' && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Arcane Momentum' && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (name === 'Perfect Cycle' && context.damaging && nextDamagingNumber % 4 === 0) damageMultiplier += rankValue(rank, [0.06, 0.12, 0.18, 0.24, 0.30])
    if (name === 'Arcane Echo' && context.damaging && nextDamagingNumber % 6 === 0) damageMultiplier += rankValue(rank, [0.05, 0.10, 0.15, 0.20, 0.25])
    if (name === 'Arcane Overload' && context.damaging && nextDamagingNumber % 6 === 0) damageMultiplier += 0.25
    if (name === 'Unstable Power' && context.damaging && nextDamagingNumber % 5 === 0) { damageMultiplier += 0.5; manaCostMultiplier *= 1.25 }
    if (name === 'Overcharge' && costBand.ratio >= 0.10) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Overcast' && costBand.overcharged) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (name === 'Mana Burn' && context.playerMana / Math.max(1, context.maxMana) < 0.2) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Desperate Power' && context.playerMana / Math.max(1, context.maxMana) < 0.2) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Mana Edge' && context.playerMana / Math.max(1, context.maxMana) > 0.8) damageMultiplier += rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (name === 'Finisher' && context.enemyHealthPercent < 25) damageMultiplier += rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((name === 'Opening Volley' || name === 'First Blood') && context.damaging && damagingNumber <= 1) damageMultiplier += rankValue(rank, name === 'Opening Volley' ? [0.03, 0.06, 0.09, 0.12, 0.15] : [0.04, 0.08, 0.12, 0.16, 0.20])
    if (name === 'Apotheosis Execution' && context.enemyHealthPercent < 20) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (name === 'Perfect Execution' && context.enemyHealthPercent < 20) damageMultiplier += 0.15
    if (name === 'Convergence' && alternatingPreview >= (preview ? 3 : 4)) { free = true; actionSpeedMultiplier *= 1.2 }
    if (name === 'Time Compression' && (runtime.alternatingCastStreak ?? 0) >= (preview ? 1 : 2)) actionSpeedMultiplier *= 1.2
    if (name === 'Zero Point' && castNumber % 8 === 0) manaCostMultiplier *= 1 - rankValue(rank, [0.2, 0.4, 0.6, 0.8, 1])
    if (name === 'Cataclysm' && costBand.overcharged && damagingNumber === 0) { damageMultiplier += 0.4; manaCostMultiplier *= 1.2 }
    if (name === 'Overchannel' && scope === 'focus:6:M' && runtime.overchannelUntilMs && runtime.overchannelUntilMs > runtime.elapsedMs) { actionSpeedMultiplier *= 1.15; effectivenessMultiplier *= 1.1 }
    if (name === 'Overchannel' && scope === 'focus:6:S3' && currentManaPercent > 80 && costBand.high) effectivenessMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Queued Precision' && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Prepared Cast' && context.origin !== 'auto' && damagingNumber === 0) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Manual Timing' && context.origin !== 'auto') actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Absolute Queue' && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])

    // V6 condition and sequence primitives. These stay keyed to authored
    // mechanic names, while the counters and cost bands remain shared.
    if (name === 'Perfect Window' && context.enemyHealthPercent > 90) critDamageBonus += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Marked Precision' && hasControl) critChanceBonus += rankValue(rank, [0.002, 0.004, 0.006, 0.008, 0.010])
    if (name === 'Perfect Precision' && context.damaging && (runtime.failedCritStreak ?? 0) >= 2) guaranteedCrit = true
    if (name === 'Spell Sequence' && context.damaging && differentSpellPreview >= 3) damageMultiplier += rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (name === 'Rapid Escalation' && context.damaging && (runtime.lastSuccessfulCastAtMs ?? -Infinity) >= runtime.elapsedMs - 3000) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Heavy Follow-Up' && context.damaging && costBand.low && runtime.nextLowCostDamageMultiplier && runtime.nextLowCostDamageMultiplier > 1) damageMultiplier *= runtime.nextLowCostDamageMultiplier
    if ((name === 'Debuff Assault' || name === 'Corroded Defense' || name === 'Debuff Pressure') && negativeStatusCount >= 2) damageMultiplier += rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((name === 'Dominating Weakness' || name === 'Absolute Pressure') && negativeStatusCount >= 3) damageMultiplier += rankValue(rank, name === 'Absolute Pressure' ? [0.015, 0.03, 0.045, 0.06, 0.075] : [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Rising Violence') damageMultiplier += Math.floor(Math.max(0, 100 - context.enemyHealthPercent) / 25) * rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (name === 'Cooldown Punisher' && (spell?.cooldownMs ?? 0) >= 20_000) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if ((name === 'Lingering Execution' || name === 'Ruin Transfer') && hasDamageOverTime && context.enemyHealthPercent < 35) damageMultiplier += rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Unstable Rotation' && context.damaging && (runtime.costBandHistory ?? []).length >= 2 && (runtime.costBandHistory ?? [])[((runtime.costBandHistory ?? []).length) - 2] === 'high' && (runtime.costBandHistory ?? [])[(runtime.costBandHistory ?? []).length - 1] === 'low' && costBand.high) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (name === 'Sovereign Sequence' && context.damaging && differentSpellPreview >= 5) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (name === 'First Blood' && context.damaging && (runtime.enemyDamagingSpellCount ?? 0) <= 1) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (name === 'Last Word' && context.damaging && context.enemyHealthPercent < 20 && !runtime.lastWordUsed) damageMultiplier += rankValue(rank, [0.04, 0.08, 0.12, 0.16, 0.20])
    if (name === 'Sovereign Crit' && context.damaging && runtime.nextNonCritDamageMultiplier && runtime.nextNonCritDamageMultiplier > 1) damageMultiplier *= runtime.nextNonCritDamageMultiplier
    if (name === 'Victory Momentum' && context.damaging && runtime.victoryMomentumReady) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Sovereign Casting' && context.damaging && (runtime.sovereigntyCharges ?? 0) > 0) damageMultiplier += 0.15
    if (name === 'Absolute Momentum' && context.damaging && differentSpellPreview >= 3) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Limit Break' && costBand.extreme) manaRefundPercent = Math.max(manaRefundPercent, 0)
    if (name === 'Arcane Apotheosis' && runtime.apotheosisUntilMs && runtime.apotheosisUntilMs > runtime.elapsedMs) { damageMultiplier += 0.20; manaCostMultiplier *= 0.85; actionSpeedMultiplier *= 1.10 }

    if (name === 'Protective Casting' && currentBarrier > 0 && !context.damaging) actionSpeedMultiplier *= 1 + rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (name === 'Defiant Casting' && currentHealthPercent < 35 && (hasHealing || hasBarrier)) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Safe Offensive' && currentBarrier >= state.player.maxHealth * 0.1 && context.damaging) damageMultiplier += rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025])
    if (name === 'Bastion Cast' && currentBarrier > 0 && !context.damaging) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Last Breath' && runtime.nextHealingActionSpeedMultiplier && hasHealing) actionSpeedMultiplier *= runtime.nextHealingActionSpeedMultiplier

    if (name === 'Full Reservoir' && currentManaPercent > 90 && runtime.lastSuccessfulCastAtMs !== undefined && runtime.elapsedMs - runtime.lastSuccessfulCastAtMs >= 3000) manaCostMultiplier *= 1 - rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Deep Reservoir' && (runtime.spellCastCount + (preview ? 1 : 0)) === 1) free = true
    if (name === 'Manual Reservoir' && context.origin !== 'auto' && runtime.lastCastOrigin === 'auto') manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (name === 'Alternating Mind' && runtime.lastCastOrigin && runtime.lastCastOrigin !== context.origin) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Efficient Queue' && context.origin === 'manual-queued') manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Echo Discipline' && autoSlots > 0 && manualSlots >= Math.ceil(deck.length / 2)) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Dual Mind' && runtime.lastCastOrigin && runtime.lastCastOrigin !== context.origin) { manaCostMultiplier *= 0.85; actionSpeedMultiplier *= 1.10 }
    if (name === 'Prepared Slot' && context.loadoutSlotIndex !== null && !runtime.castLoadoutSlots?.includes(context.loadoutSlotIndex)) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Resonance' && (runtime.spellCastCount + (preview ? 1 : 0)) % 10 === 0) manaRefundPercent = 1
    if (name === 'Echo Battery' && context.origin === 'manual-direct' && (runtime.echoCharges ?? 0) > 0) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]) * (runtime.echoCharges ?? 0)
    if (name === 'Manual Charge' && context.origin === 'auto' && (runtime.manualCharges ?? 0) > 0) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]) * (runtime.manualCharges ?? 0)
    if (name === 'Prepared Cast' && context.origin !== 'auto' && (runtime.manualCastCount ?? 0) <= 1) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Queued Precision' && context.origin === 'manual-queued') effectivenessMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Balanced Mind' && autoSlots >= 2 && manualSlots >= 2) { actionSpeedMultiplier *= 1 + rankValue(rank, [0.005, 0.01, 0.015, 0.02, 0.025]) }
    if (name === 'Convergent Queue' && context.origin === 'manual-queued') { /* cooldown reduction is applied by the queue boundary */ }
    if (name === 'Reserved Conversion' && context.origin === 'auto' && (runtime.enemyDamagingSpellCount ?? 0) === 0) manaRestoreFlat += Math.floor(reservedFocus / 20) * rankValue(rank, [1, 2, 3, 4, 5])
    if (name === 'Free Focus Surge' && context.origin !== 'auto' && (runtime.enemyDamagingSpellCount ?? 0) === 0) actionSpeedMultiplier *= 1 + Math.floor(freeFocus / 20) * rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Deep Draw' && currentManaPercent < 20) manaCostMultiplier *= 1 - rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Arcane Return') manaRestoreFlat += rankValue(rank, [1, 2, 3, 4, 5])
    if (name === 'Empty Mind' && currentManaPercent < 20 && context.damaging) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Astral Rotation' && context.loadoutSlotIndex !== null && runtime.differentLoadoutSlotStreak && runtime.differentLoadoutSlotStreak >= 2) manaRefundPercent = Math.max(manaRefundPercent, rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05]))
    if (name === 'Echo Cascade' && context.origin !== 'auto' && (runtime.consecutiveAutoCasts ?? 0) >= 3) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10]);
    if (name === 'Manual Cascade' && context.origin === 'auto' && (runtime.consecutiveManualCasts ?? 0) >= 3) effectivenessMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if (name === 'Singularity Echo' && context.origin !== 'auto' && runtime.lastCastOrigin === 'auto' && runtime.lastCastAtFullMana) effectivenessMultiplier *= 1 + rankValue(rank, [0.03, 0.06, 0.09, 0.12, 0.15])
    if (name === 'Singularity Manual' && context.origin === 'auto' && runtime.nextAutoRefundPercent) manaRefundPercent = Math.max(manaRefundPercent, runtime.nextAutoRefundPercent)
    if (name === 'Focus Collapse') {
      if (context.origin === 'auto' && reservedFocus > state.player.maxFocus * 0.75) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
      if (context.origin !== 'auto' && reservedFocus < state.player.maxFocus * 0.25) actionSpeedMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    }
    if (name === 'Perfect Conservation' && runtime.lastManaBand !== undefined && runtime.lastManaBand === Math.floor(currentManaPercent / 25)) manaRefundPercent = Math.max(manaRefundPercent, 0)

    if (name === 'Manual Timing' && context.origin !== 'auto' && state.combat.enemyActionDurationMs > 0 && state.combat.enemyActionTimerMs / state.combat.enemyActionDurationMs < 0.25) actionSpeedMultiplier *= 1 + rankValue(rank, [0.02, 0.04, 0.06, 0.08, 0.10])
    if ((name === 'Controlled Strike' || name === 'Controlled Target') && hasControl && context.damaging) damageMultiplier += rankValue(rank, name === 'Controlled Target' ? [0.025, 0.05, 0.075, 0.10, 0.125] : [0.01, 0.02, 0.03, 0.04, 0.05])
    if ((name === 'Debuff Pressure' || name === 'Endless Pressure') && negativeStatusCount >= (name === 'Endless Pressure' ? 4 : 2)) damageMultiplier += rankValue(rank, name === 'Endless Pressure' ? [0.03, 0.06, 0.09, 0.12, 0.15] : [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Queued Dominion' && context.origin === 'manual-queued' && hasNegativeStatus) statusDurationMultiplier *= 1 + rankValue(rank, [0.01, 0.02, 0.03, 0.04, 0.05])
    if (name === 'Suppression Window' && runtime.nextActionSpeedMultiplier && runtime.nextActionSpeedMultiplier > 1) actionSpeedMultiplier *= runtime.nextActionSpeedMultiplier
    if (name === 'Status Echo' && hasControl && runtime.nextControlStatusDurationMultiplier) statusDurationMultiplier *= runtime.nextControlStatusDurationMultiplier
    if (name === 'Status Recursion' && hasControl && runtime.nextControlStatusDurationMultiplier) statusDurationMultiplier *= runtime.nextControlStatusDurationMultiplier
  }

  if (!context.damaging && (hasHealing || hasBarrier) && runtime.nextSelfTargetActionSpeedMultiplier) actionSpeedMultiplier *= runtime.nextSelfTargetActionSpeedMultiplier

  const nextDamageMultiplier = runtime.nextDamageMultiplier ?? 1
  const nextEffectivenessMultiplier = runtime.nextEffectivenessMultiplier ?? 1
  const nextActionSpeedMultiplier = runtime.nextActionSpeedMultiplier ?? 1
  const nextManaRefundPercent = runtime.nextManaRefundPercent ?? 0
  critChanceBonus += runtime.nextCritChanceBonus ?? 0
  critDamageBonus += runtime.nextCritDamageBonus ?? 0
  guaranteedCrit = guaranteedCrit || runtime.nextGuaranteedCrit === true
  if (!preview) {
    if (context.origin === 'auto') runtime.autoCastCount = (runtime.autoCastCount ?? 0) + 1
    if (context.damaging) runtime.nextDamageMultiplier = 1
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
    damageMultiplier: damageMultiplier * nextDamageMultiplier,
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
  if (runtime.spellCastCount === 1 && entries(state).some((entry) => entry.displayName === 'Sovereign Casting')) runtime.sovereigntyCharges = 3
  runtime.lastCastOrigin = context.origin
  runtime.lastSpellId = context.spellId
  runtime.lastLoadoutSlotIndex = context.loadoutSlotIndex
  const result = getArcaneCoreV6CastModifiers(state, context)
  if (entries(state).some((entry) => entry.displayName === 'Last Word') && context.damaging && context.enemyHealthPercent < 20) runtime.lastWordUsed = true
  if (entries(state).some((entry) => entry.displayName === 'Arcane Apotheosis') && context.damaging && runtime.damagingSpellCount >= 8 && !runtime.apotheosisUntilMs) runtime.apotheosisUntilMs = runtime.elapsedMs + 6000
  if (entries(state).some((entry) => entry.displayName === 'Overchannel' && matchesScope(entry, 'focus:6:M')) && band.ratio >= 0.25) {
    runtime.overchannelUntilMs = runtime.elapsedMs + 5000
    runtime.manaRegenDisabledUntilMs = runtime.elapsedMs + 5000
  }
  return result
}

/** Resolves the V6 lethal-survival tokens without coupling the generic combat
 * resolver to catalog names. The caller owns the final HP assignment. */
export const tryConsumeArcaneCoreV6Survival = (state: GameState) => {
  const runtime = state.combat.arcaneCoreRuntime
  if (hasMechanic(state, V6_MECHANICS.refuseDeath) && !runtime.refuseDeathUsed) {
    runtime.refuseDeathUsed = true
    runtime.lastSurvivalToken = 'refuse-death'
    return 'refuse-death' as const
  }
  if (hasMechanic(state, V6_MECHANICS.immortalGuard) && !runtime.immortalGuardUsed) {
    runtime.immortalGuardUsed = true
    runtime.immortalGuardUntilMs = runtime.elapsedMs + 6_000
    runtime.lastSurvivalToken = 'immortal-guard'
    return 'immortal-guard' as const
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
  if (!critical && hasMechanic(state, V6_MECHANICS.secondChance)) {
    runtime.nextCritChanceBonus = rankValue(mechanicRank(state, V6_MECHANICS.secondChance), [0.002, 0.004, 0.006, 0.008, 0.010])
  }
  if (!critical && (runtime.sovereigntyCharges ?? 0) > 0 && entries(state).some((entry) => entry.displayName === 'Sovereign Casting')) runtime.sovereigntyCharges = Math.max(0, (runtime.sovereigntyCharges ?? 0) - 1)
  if (critical && entries(state).some((entry) => entry.displayName === 'Sovereign Crit')) runtime.nextNonCritDamageMultiplier = 1
}
