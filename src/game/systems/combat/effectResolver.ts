import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { appendLog, playerBasicDamage, spellDamageMultiplier } from '../../engine'
import type { GameState, SpellId, StatusId, TraitId } from '../../types'
import { applyStatus, cleanseStatuses, dispelStatuses, removeStatus } from './statusRuntime'
import type { CombatActor } from './magnitude'
import { getActorHealth, resolveMagnitude } from './magnitude'
import { consumeBarrier, gainBarrierResult, gainBarrier as gainBarrierRuntime, getActiveBarrier } from './barrierRuntime'
import { getCombatModifiers, getResistance, isImmuneToDamage } from './modifiers'
import { getBlockChance, getCritChance, getCritDamageMultiplier, getDefense, getDefenseReduction } from './combatStats'
import { nextCombatRandom } from './combatRng'
import { runCombatTriggers, type CombatEventContext } from './triggerRuntime'
import { getCurrentEnemyActionStep, MAX_ACTION_WORK_MS, setEnemyActionPattern } from './actionRuntime'
import { getRootCombatSourceProvenance } from './combatProvenance'
import type { CombatEffect, CombatEventSink, CombatLogCategory, CombatSource, CombatTag, DamageType, EffectTarget } from './combatTypes'

const MAX_EFFECT_DEPTH = 20

const targetActor = (source: CombatSource, target: EffectTarget): CombatActor => target === 'self' ? source.actor : source.actor === 'player' ? 'enemy' : 'player'
const sourceTags = (source: CombatSource, effectTags?: CombatTag[]) => [...new Set<CombatTag>([...(source.tags ?? []), ...(effectTags ?? [])])]
const logSource = (state: GameState, source: CombatSource) => {
  if (source.actor === 'player') return { kind: 'player' as const }
  if (source.actor !== 'enemy') return { kind: 'system' as const }
  const root = getRootCombatSourceProvenance(source)
  const monsterId = source.sourceMonsterId ?? root.originMonsterId ?? root.sourceMonsterId
  // Attribution is provenance, not ownership liveness. A detached source
  // must remain attributable to the authored Enemy without borrowing the
  // current encounter's modifiers or trigger rules.
  return monsterId ? { kind: 'enemy' as const, monsterId } : { kind: 'system' as const }
}
const logCategory = (source: CombatSource, tags: CombatTag[], fallback: CombatLogCategory): CombatLogCategory => source.kind === 'spell' ? 'spell' : source.kind === 'action' ? 'enemy-action' : source.kind === 'trait' ? 'trait' : tags.includes('basic-attack') ? 'basic-attack' : fallback
const eventFields = (state: GameState, source: CombatSource, target: CombatActor) => {
  const root = getRootCombatSourceProvenance(source)
  return {
  source: logSource(state, source),
  sourceKind: source.kind,
  dungeonId: state.combat.dungeonId ?? undefined,
  target,
  targetMonsterId: target === 'enemy' ? state.combat.enemyId ?? undefined : undefined,
  sourceId: source.sourceId,
  originSourceId: root.sourceId,
  originSourceKind: root.sourceKind,
  originTags: root.tags,
  originSchool: root.school,
  sourceMonsterId: source.sourceMonsterId,
  sourceInstanceKey: source.sourceInstanceKey,
  originMonsterId: root.originMonsterId ?? root.sourceMonsterId,
  originInstanceKey: root.originInstanceKey ?? root.sourceInstanceKey,
  providerInstanceKey: root.providerInstanceKey,
  ruleId: source.ruleId,
  statusInstanceKey: source.statusInstanceKey,
  spellId: source.kind === 'spell' ? source.sourceId as SpellId : undefined,
  actionId: source.kind === 'action' ? source.sourceId : undefined,
  traitId: source.kind === 'trait' ? source.sourceId as TraitId : undefined,
  statusId: source.statusId ?? (source.kind === 'status' ? source.sourceId as StatusId : undefined),
  itemId: source.kind === 'equipment' || source.kind === 'weapon' ? source.sourceId as import('../../types').ItemId : undefined,
  }
}

export interface DamageBreakdown {
  raw: number
  sourceModified: number
  critical: boolean
  critChance: number
  critMultiplier: number
  afterCrit: number
  targetModified: number
  defense: number
  defenseReduction: number
  afterDefense: number
  resistance: number
  afterResistance: number
  blocked: boolean
  blockChance: number
  blockReduction: number
  blockedAmount: number
  resolvedBeforeBarrier: number
  barrierAbsorbed: number
  healthDamage: number
  immune: boolean
}

interface DamageRolls {
  critical?: boolean
  blocked?: boolean
}

const isDirectHit = (tags: CombatTag[]) => tags.includes('direct') && !tags.includes('dot')

const emptyDamageBreakdown = (raw: number, resistance: number, direct: boolean, critChance: number, critMultiplier: number, blockChance: number, immune: boolean): DamageBreakdown => ({
  raw,
  sourceModified: 0,
  critical: false,
  critChance: direct ? critChance : 0,
  critMultiplier: direct ? critMultiplier : 1,
  afterCrit: 0,
  targetModified: 0,
  defense: 0,
  defenseReduction: 0,
  afterDefense: 0,
  resistance,
  afterResistance: 0,
  blocked: false,
  blockChance: direct ? blockChance : 0,
  blockReduction: 0,
  blockedAmount: 0,
  resolvedBeforeBarrier: 0,
  barrierAbsorbed: 0,
  healthDamage: 0,
  immune,
})

const calculateCombatDamageWithRolls = (state: GameState, raw: number, damageType: DamageType, source: CombatSource, target: CombatActor, tags: CombatTag[], rolls: DamageRolls = {}): DamageBreakdown => {
  const amount = Math.max(0, raw)
  const direct = isDirectHit(tags)
  const critChance = direct ? getCritChance(state, source.actor, source) : 0
  const critMultiplier = direct ? getCritDamageMultiplier(state, source.actor, source) : 1
  const blockChance = direct ? getBlockChance(state, target, source) : 0
  const resistance = getResistance(state, target, damageType, { source, sourceTags: tags })
  if (amount <= 0 || isImmuneToDamage(state, target, damageType)) return emptyDamageBreakdown(amount, resistance, direct, critChance, critMultiplier, blockChance, amount > 0 && isImmuneToDamage(state, target, damageType))
  const modifierContext = { source, sourceTags: tags, damageType }
  let sourceModified = amount * (1 + getCombatModifiers(state, source.actor, 'damage-dealt-percent', modifierContext))
  if (tags.includes('basic-attack')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'basic-attack-damage-percent', modifierContext)
  const root = getRootCombatSourceProvenance(source)
  const spellOrigin = source.kind === 'spell' || root.sourceKind === 'spell'
  if (spellOrigin) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'spell-damage-percent', modifierContext)
  if (tags.includes('melee')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'melee-damage-percent', modifierContext)
  if (tags.includes('ranged')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'ranged-damage-percent', modifierContext)
  if (spellOrigin && root.school) sourceModified *= spellDamageMultiplier(state, root.school)
  if (tags.includes('dot')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'damage-over-time-percent', modifierContext)
  const critical = direct && rolls.critical === true
  const afterCrit = sourceModified * (critical ? critMultiplier : 1)
  const targetModified = afterCrit * (1 + getCombatModifiers(state, target, 'damage-taken-percent', modifierContext))
  const defenseReduction = direct ? getDefenseReduction(state, target) : 0
  const defense = direct ? getDefense(state, target) : 0
  const afterDefense = targetModified * (1 - defenseReduction)
  const afterResistance = Math.max(0, afterDefense * (1 - resistance))
  const blocked = direct && rolls.blocked === true
  const blockReduction = blocked ? 0.5 : 0
  const blockedAmount = blocked ? afterResistance * blockReduction : 0
  const resolvedBeforeBarrier = Math.max(0, afterResistance - blockedAmount)
  // Keep fractional base damage intact. Player-facing log formatting may
  // round it, but rounding every periodic tick would turn 100/6 into 17*6.
  const barrierAbsorbed = Math.min(getActiveBarrier(state, target), resolvedBeforeBarrier)
  return { raw: amount, sourceModified, critical, critChance, critMultiplier, afterCrit, targetModified, defense, defenseReduction, afterDefense, resistance, afterResistance, blocked, blockChance, blockReduction, blockedAmount, resolvedBeforeBarrier, barrierAbsorbed, healthDamage: Math.max(0, resolvedBeforeBarrier - barrierAbsorbed), immune: false }
}

export const calculateCombatDamage = (state: GameState, raw: number, damageType: DamageType, source: CombatSource, target: CombatActor, tags: CombatTag[] = source.tags ?? []): DamageBreakdown => calculateCombatDamageWithRolls(state, raw, damageType, source, target, tags)

const applyDamage = (state: GameState, raw: number, damageType: DamageType, source: CombatSource, target: CombatActor, tags: CombatTag[], execute: ExecuteCombatEffects, depth: number, uiEvents?: CombatEventSink) => {
  const rolls: DamageRolls = {}
  if (isDirectHit(tags)) {
    rolls.critical = nextCombatRandom(state) < getCritChance(state, source.actor, source)
    rolls.blocked = nextCombatRandom(state) < getBlockChance(state, target, source)
  }
  const breakdown = calculateCombatDamageWithRolls(state, raw, damageType, source, target, tags, rolls)
  if (breakdown.resolvedBeforeBarrier <= 0) return 0
  const previousHp = getActorHealth(state, target)
  const maxHp = target === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const barrierBefore = getActiveBarrier(state, target)
  consumeBarrier(state, target, breakdown.resolvedBeforeBarrier)
  const dealt = breakdown.healthDamage
  const immortal = target === 'player' ? state.debug.playerImmortal : state.debug.enemyImmortal
  const nextHealth = Math.max(0, previousHp - dealt)
  if (target === 'player') state.player.health = immortal ? Math.max(1, nextHealth) : nextHealth
  else state.combat.enemyHp = immortal ? Math.max(1, nextHealth) : nextHealth
  const currentHp = getActorHealth(state, target)
  if (source.actor === 'player') state.combat.lastDamageDealt = dealt
  else state.combat.lastDamageTaken = dealt
  uiEvents?.push({ ...eventFields(state, source, target), category: logCategory(source, tags, 'damage'), damageType, amount: breakdown.resolvedBeforeBarrier, healthDamage: dealt, barrierAbsorbed: breakdown.barrierAbsorbed, barrierBefore, barrierAfter: getActiveBarrier(state, target), critical: breakdown.critical, critChance: breakdown.critChance, critMultiplier: breakdown.critMultiplier, blocked: breakdown.blocked, blockChance: breakdown.blockChance, blockReduction: breakdown.blockReduction, blockedAmount: breakdown.blockedAmount })
  const context: CombatEventContext = {
    source, eventTarget: target, changedActor: target, sourceTags: tags, amount: breakdown.resolvedBeforeBarrier, healthDamage: dealt, barrierDamage: breakdown.barrierAbsorbed, damageType, previousBarrier: barrierBefore, currentBarrier: getActiveBarrier(state, target),
    previousHp, currentHp, previousHpPercent: previousHp / Math.max(1, maxHp) * 100, currentHpPercent: currentHp / Math.max(1, maxHp) * 100,
  }
  if (breakdown.barrierAbsorbed > 0 && barrierBefore > 0 && getActiveBarrier(state, target) === 0) {
    appendLog(state, 'Barrier breaks.')
    runCombatTriggers(state, target, 'on-barrier-broken', context, execute, depth, [], uiEvents)
  }
  // Damage events belong to the actor that dealt or received the damage.
  runCombatTriggers(state, source.actor, 'on-damage-dealt', context, execute, depth, [], uiEvents)
  runCombatTriggers(state, target, 'on-damage-taken', context, execute, depth, [], uiEvents)
  const hitEvent = tags.includes('basic-attack') ? 'on-basic-attack-hit' : source.kind === 'spell' ? 'on-spell-hit' : null
  if (hitEvent) runCombatTriggers(state, source.actor, hitEvent, context, execute, depth, [], uiEvents)
  // A prevented lethal hit is still a real hit, but it is not a kill.
  if (currentHp <= 0 && dealt > 0) runCombatTriggers(state, source.actor, 'on-kill', context, execute, depth, [], uiEvents)
  if (dealt > 0) {
    const thresholdActors = [...new Set<CombatActor>([target, source.actor])]
    thresholdActors.forEach((thresholdActor) => runCombatTriggers(state, thresholdActor, 'on-hp-threshold', context, execute, depth, [], uiEvents))
  }
  return dealt
}

const applyHealing = (state: GameState, raw: number, source: CombatSource, target: CombatActor, tags: CombatTag[], execute: ExecuteCombatEffects, depth: number, uiEvents?: CombatEventSink) => {
  const amount = Math.max(0, Math.round(raw * (1 + getCombatModifiers(state, source.actor, 'healing-done-percent', { source, sourceTags: tags }))))
  const received = Math.max(0, 1 + getCombatModifiers(state, target, 'healing-received-percent', { source, sourceTags: tags }))
  const before = getActorHealth(state, target)
  const max = target === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const healed = Math.max(0, Math.min(max, before + Math.round(amount * received)) - before)
  const attemptedAmount = Math.max(0, Math.round(amount * received))
  if (target === 'player') state.player.health += healed
  else state.combat.enemyHp += healed
  if (attemptedAmount > 0) {
    uiEvents?.push({ ...eventFields(state, source, target), category: 'heal', amount: healed, attemptedAmount, effectiveAmount: healed, overheal: Math.max(0, attemptedAmount - healed) })
  }
  if (healed > 0) {
    const context: CombatEventContext = {
      source,
      eventTarget: target,
      changedActor: target,
      sourceTags: tags,
      amount: healed,
      previousHp: before,
      currentHp: before + healed,
      previousHpPercent: before / Math.max(1, max) * 100,
      currentHpPercent: (before + healed) / Math.max(1, max) * 100,
    }
    runCombatTriggers(state, source.actor, 'on-heal', context, execute, depth, [], uiEvents)
    runCombatTriggers(state, target, 'on-heal-received', context, execute, depth, [], uiEvents)
    const thresholdActors = [...new Set<CombatActor>([target, source.actor])]
    thresholdActors.forEach((thresholdActor) => runCombatTriggers(state, thresholdActor, 'on-hp-threshold', context, execute, depth, [], uiEvents))
  }
  return healed
}

const executeResource = (state: GameState, effect: Extract<CombatEffect, { type: 'restore-resource' | 'drain-resource' }>, source: CombatSource) => {
  if (effect.resource !== 'mana') return 0
  const actor = targetActor(source, effect.target)
  if (actor !== 'player') return 0
  const amount = Math.round(resolveMagnitude(state, effect.magnitude, source, actor))
  const before = state.player.mana
  state.player.mana = effect.type === 'restore-resource' ? Math.min(state.player.maxMana, state.player.mana + amount) : Math.max(0, state.player.mana - amount)
  return Math.abs(state.player.mana - before)
}

export type ExecuteCombatEffects = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number, uiEvents?: CombatEventSink) => void

export const executeCombatEffect = (state: GameState, effect: CombatEffect, source: CombatSource, depth = 0, execute: ExecuteCombatEffects = executeCombatEffects, uiEvents?: CombatEventSink) => {
  if (depth >= MAX_EFFECT_DEPTH) return
  const target = targetActor(source, effect.target)
  const tags = sourceTags(source, 'tags' in effect ? effect.tags : undefined)
  switch (effect.type) {
    case 'deal-damage': {
      const effectSource = effect.school ? { ...source, school: effect.school } : source
      applyDamage(state, resolveMagnitude(state, effect.magnitude, effectSource, target), effect.damageType, effectSource, target, tags, execute, depth, uiEvents)
      break
    }
    case 'heal': applyHealing(state, resolveMagnitude(state, effect.magnitude, source, target), source, target, tags, execute, depth, uiEvents); break
    case 'gain-barrier': {
      const mode = effect.mode ?? 'add'
      const result = gainBarrierResult(state, resolveMagnitude(state, effect.magnitude, source, target), source, target, tags, { mode, durationMs: effect.durationMs === undefined ? null : effect.durationMs })
      if (result.current > 0 && (result.gained > 0 || mode === 'replace')) {
        const granted = mode === 'replace' ? result.current : result.gained
        uiEvents?.push({ ...eventFields(state, source, target), category: 'barrier', amount: granted, barrierGranted: granted, barrierMode: mode, barrierBefore: result.previous, barrierAfter: result.current, durationMs: effect.durationMs })
        if (result.gained > 0) runCombatTriggers(state, target, 'on-barrier-gained', { source, eventTarget: target, changedActor: target, sourceTags: tags, previousBarrier: result.previous, currentBarrier: result.current, barrierGained: result.gained, amount: result.gained }, execute, depth, [], uiEvents)
      }
      break
    }
    case 'restore-resource':
    case 'drain-resource': executeResource(state, effect, source); break
    case 'apply-status': {
      const statusSource = { ...source, tags }
      const active = applyStatus(state, target, effect.statusId, statusSource, { durationMs: effect.durationMs, stacks: effect.stacks, periodicEffects: effect.periodicEffects, statusSourceKey: effect.statusSourceKey, modifierOverrides: effect.modifierOverrides })
      if (active) {
        const definition = STATUS_DEFINITIONS[effect.statusId]
        appendLog(state, `${definition.name} applied.`)
        uiEvents?.push({ ...eventFields(state, source, target), category: 'status', statusId: effect.statusId, statusPhase: 'apply', durationMs: active.remainingMs, stacks: active.stacks, statusInstanceKey: active.instanceKey })
        // Application events belong to the applier; the status holder is the target.
        runCombatTriggers(state, source.actor, 'on-status-applied', { source: statusSource, eventTarget: target, changedActor: target, sourceTags: tags, statusId: effect.statusId, eventStatusTags: definition.tags }, execute, depth, [], uiEvents)
      }
      break
    }
    case 'remove-status': if (removeStatus(state, target, effect.statusId, { executeEffects: execute, source, depth, uiEvents })) appendLog(state, `${STATUS_DEFINITIONS[effect.statusId]?.name ?? effect.statusId} removed.`); break
    case 'cleanse': cleanseStatuses(state, target, effect.mode, effect.tag, { executeEffects: execute, source, depth, uiEvents }); break
    case 'dispel': dispelStatuses(state, target, effect.mode, effect.tag, { executeEffects: execute, source, depth, uiEvents }); break
    case 'modify-action-timer': {
      // Player V1 has one explicit timed normal-action lane: Basic Attack.
      // `current` therefore maps to that same lane until a player action queue exists.
      if (!Number.isFinite(effect.amountMs)) break
      const adjustWork = (value: number) => Math.max(0, Math.min(MAX_ACTION_WORK_MS, (Number.isFinite(value) ? value : 0) + effect.amountMs))
      let applied = false
      if (target === 'player') {
        state.combat.playerAttackTimerMs = adjustWork(state.combat.playerAttackTimerMs)
        applied = true
      } else if (effect.action === 'current') {
        // Current means the committed action, whether Basic or Skill.
        if (state.combat.enemyCurrentStepId) {
          state.combat.enemyActionTimerMs = adjustWork(state.combat.enemyActionTimerMs)
          applied = true
        }
      } else if (effect.action === 'basic-attack') {
        // A Basic-specific modifier never reaches a committed Skill and never
        // creates a timer for a future action.
        if (getCurrentEnemyActionStep(state)?.type === 'basic') {
          state.combat.enemyActionTimerMs = adjustWork(state.combat.enemyActionTimerMs)
          applied = true
        }
      }
      if (!applied) break
      appendLog(state, `${effect.amountMs >= 0 ? 'Action delayed' : 'Action timer changed'} by ${Math.abs(effect.amountMs)}ms.`)
      uiEvents?.push({ ...eventFields(state, source, target), category: 'system', sourceId: 'action-timer', amount: Math.abs(effect.amountMs), durationMs: effect.amountMs })
      break
    }
    case 'modify-cooldown': {
      if (target === 'player' && Number.isFinite(effect.amountMs)) {
        const ids = effect.spellId ? [effect.spellId] : Object.keys(state.combat.spellCooldowns)
        ids.forEach((id) => { if (id in state.combat.spellCooldowns) state.combat.spellCooldowns[id as keyof typeof state.combat.spellCooldowns] = Math.max(0, Math.min(MAX_ACTION_WORK_MS, state.combat.spellCooldowns[id as keyof typeof state.combat.spellCooldowns] + effect.amountMs)) })
      }
      break
    }
    case 'set-action-pattern': if (target === 'enemy') setEnemyActionPattern(state, effect.patternId, uiEvents); break
  }
}

export const executeCombatEffects: ExecuteCombatEffects = (state, effects, source, depth = 0, uiEvents) => {
  if (depth >= MAX_EFFECT_DEPTH) return
  effects.forEach((effect) => executeCombatEffect(state, effect, source, depth, executeCombatEffects, uiEvents))
}

const sourceForLegacy = (source: 'basic' | 'spell' | 'status', actor: 'player' | 'enemy'): CombatSource => ({
  actor, kind: source === 'basic' ? 'basic-attack' : source === 'status' ? 'status' : 'spell',
  sourceId: source, tags: source === 'basic' ? ['basic-attack', 'direct'] : source === 'status' ? ['status', 'dot'] : ['spell', 'magic', 'direct'],
})

export const damageEnemy = (state: GameState, raw: number, source: 'basic' | 'spell' | 'status' = 'spell') => {
  if (!state.combat.enemyId) return 0
  const sourceMeta = sourceForLegacy(source, 'player')
  return applyDamage(state, raw, 'physical', sourceMeta, 'enemy', sourceMeta.tags ?? [], executeCombatEffects, 0)
}

export const damagePlayer = (state: GameState, raw: number, source: CombatSource = sourceForLegacy('basic', 'enemy')) => applyDamage(state, raw, 'physical', source, 'player', source.tags ?? [], executeCombatEffects, 0)

export const gainBarrier = (state: GameState, amount: number, target: CombatActor, source: CombatSource = { actor: target, kind: 'system', sourceId: 'legacy-barrier' }) => gainBarrierRuntime(state, amount, source, target, source.tags ?? ['barrier'], { mode: 'add', durationMs: null })

export const getBasicAttackTags = (state: GameState): CombatTag[] => {
  const weapon = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined
  return [...new Set<CombatTag>(['basic-attack', 'direct', ...(weapon?.attackTags ?? []), ...(weapon ? ['weapon' as const] : [])])]
}

export { getActiveBarrier }

export const getCombatDamagePreview = (state: GameState, raw: number, source: CombatSource, target: CombatActor, damageType: DamageType) => {
  const breakdown = calculateCombatDamage(state, raw, damageType, source, target, source.tags ?? [])
  return { ...breakdown, modified: breakdown.resolvedBeforeBarrier, barrier: getActiveBarrier(state, target) }
}

export const legacyPlayerDamageSource: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'enemy-basic-attack', tags: ['basic-attack', 'direct'] }
export const legacyPlayerBasicSource: CombatSource = { actor: 'player', kind: 'basic-attack', sourceId: 'player-basic-attack', tags: ['basic-attack', 'direct'] }
export { playerBasicDamage, MONSTERS }
