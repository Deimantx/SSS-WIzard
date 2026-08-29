import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { appendLog, playerBasicDamage, spellDamageMultiplier } from '../../engine'
import type { GameState } from '../../types'
import { applyStatus, cleanseStatuses, dispelStatuses, removeStatus } from './statusRuntime'
import type { CombatActor } from './magnitude'
import { getActorHealth, resolveMagnitude } from './magnitude'
import { consumeBarrier, gainBarrierResult, gainBarrier as gainBarrierRuntime, getActiveBarrier } from './barrierRuntime'
import { getCombatModifiers, getResistance, isImmuneToDamage } from './modifiers'
import { runCombatTriggers, type CombatEventContext } from './triggerRuntime'
import { resolveActiveEnemyAction, setEnemyActionPattern } from './actionRuntime'
import type { CombatEffect, CombatSource, CombatTag, DamageType, EffectTarget } from './combatTypes'

const MAX_EFFECT_DEPTH = 20

const targetActor = (source: CombatSource, target: EffectTarget): CombatActor => target === 'self' ? source.actor : source.actor === 'player' ? 'enemy' : 'player'
const sourceTags = (source: CombatSource, effectTags?: CombatTag[]) => [...new Set<CombatTag>([...(source.tags ?? []), ...(effectTags ?? [])])]

export interface DamageBreakdown {
  raw: number
  sourceModified: number
  targetModified: number
  resistance: number
  resolvedBeforeBarrier: number
  barrierAbsorbed: number
  healthDamage: number
  immune: boolean
}

export const calculateCombatDamage = (state: GameState, raw: number, damageType: DamageType, source: CombatSource, target: CombatActor, tags: CombatTag[] = source.tags ?? []): DamageBreakdown => {
  const amount = Math.max(0, raw)
  if (amount <= 0 || isImmuneToDamage(state, target, damageType)) return { raw: amount, sourceModified: 0, targetModified: 0, resistance: getResistance(state, target, damageType), resolvedBeforeBarrier: 0, barrierAbsorbed: 0, healthDamage: 0, immune: amount > 0 }
  const modifierContext = { source, sourceTags: tags, damageType }
  let sourceModified = amount * (1 + getCombatModifiers(state, source.actor, 'damage-dealt-percent', modifierContext))
  if (tags.includes('basic-attack')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'basic-attack-damage-percent', modifierContext)
  if (source.kind === 'spell') sourceModified *= 1 + getCombatModifiers(state, source.actor, 'spell-damage-percent', modifierContext)
  if (tags.includes('melee')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'melee-damage-percent', modifierContext)
  if (tags.includes('ranged')) sourceModified *= 1 + getCombatModifiers(state, source.actor, 'ranged-damage-percent', modifierContext)
  if (source.kind === 'spell' && source.school) sourceModified *= spellDamageMultiplier(state, source.school)
  const targetModified = sourceModified * (1 + getCombatModifiers(state, target, 'damage-taken-percent', modifierContext))
  const resistance = getResistance(state, target, damageType)
  const resolvedBeforeBarrier = Math.max(0, Math.round(targetModified * (1 - resistance)))
  const barrierAbsorbed = Math.min(getActiveBarrier(state, target), resolvedBeforeBarrier)
  return { raw: amount, sourceModified, targetModified, resistance, resolvedBeforeBarrier, barrierAbsorbed, healthDamage: Math.max(0, resolvedBeforeBarrier - barrierAbsorbed), immune: false }
}

const applyDamage = (state: GameState, raw: number, damageType: DamageType, source: CombatSource, target: CombatActor, tags: CombatTag[], execute: ExecuteCombatEffects, depth: number) => {
  const breakdown = calculateCombatDamage(state, raw, damageType, source, target, tags)
  if (breakdown.resolvedBeforeBarrier <= 0) return 0
  const previousHp = getActorHealth(state, target)
  const maxHp = target === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const barrierBefore = getActiveBarrier(state, target)
  consumeBarrier(state, target, breakdown.resolvedBeforeBarrier)
  const dealt = breakdown.healthDamage
  if (target === 'player') state.player.health = Math.max(0, state.player.health - dealt)
  else state.combat.enemyHp = Math.max(0, state.combat.enemyHp - dealt)
  const currentHp = getActorHealth(state, target)
  if (source.actor === 'player') state.combat.lastDamageDealt = dealt
  else state.combat.lastDamageTaken = dealt
  const context: CombatEventContext = {
    source, eventTarget: target, changedActor: target, sourceTags: tags, amount: breakdown.resolvedBeforeBarrier, healthDamage: dealt, barrierDamage: breakdown.barrierAbsorbed, damageType, previousBarrier: barrierBefore, currentBarrier: getActiveBarrier(state, target),
    previousHp, currentHp, previousHpPercent: previousHp / Math.max(1, maxHp) * 100, currentHpPercent: currentHp / Math.max(1, maxHp) * 100,
  }
  if (breakdown.barrierAbsorbed > 0 && barrierBefore > 0 && getActiveBarrier(state, target) === 0) {
    appendLog(state, 'Barrier breaks.')
    runCombatTriggers(state, target, 'on-barrier-broken', context, execute, depth)
  }
  // Damage events belong to the actor that dealt or received the damage.
  runCombatTriggers(state, source.actor, 'on-damage-dealt', context, execute, depth)
  runCombatTriggers(state, target, 'on-damage-taken', context, execute, depth)
  const hitEvent = tags.includes('basic-attack') ? 'on-basic-attack-hit' : source.kind === 'spell' ? 'on-spell-hit' : null
  if (hitEvent) runCombatTriggers(state, source.actor, hitEvent, context, execute, depth)
  if (currentHp <= 0 && dealt > 0) runCombatTriggers(state, source.actor, 'on-kill', context, execute, depth)
  if (dealt > 0) {
    const thresholdActors = [...new Set<CombatActor>([target, source.actor])]
    thresholdActors.forEach((thresholdActor) => runCombatTriggers(state, thresholdActor, 'on-hp-threshold', context, execute, depth))
  }
  return dealt
}

const applyHealing = (state: GameState, raw: number, source: CombatSource, target: CombatActor, tags: CombatTag[], execute: ExecuteCombatEffects, depth: number) => {
  const amount = Math.max(0, Math.round(raw * (1 + getCombatModifiers(state, source.actor, 'healing-done-percent', { source, sourceTags: tags }))))
  const received = Math.max(0, 1 + getCombatModifiers(state, target, 'healing-received-percent', { source, sourceTags: tags }))
  const before = getActorHealth(state, target)
  const max = target === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const healed = Math.max(0, Math.min(max, before + Math.round(amount * received)) - before)
  if (target === 'player') state.player.health += healed
  else state.combat.enemyHp += healed
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
    runCombatTriggers(state, source.actor, 'on-heal', context, execute, depth)
    runCombatTriggers(state, target, 'on-heal-received', context, execute, depth)
    const thresholdActors = [...new Set<CombatActor>([target, source.actor])]
    thresholdActors.forEach((thresholdActor) => runCombatTriggers(state, thresholdActor, 'on-hp-threshold', context, execute, depth))
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

export type ExecuteCombatEffects = (state: GameState, effects: CombatEffect[], source: CombatSource, depth?: number) => void

export const executeCombatEffect = (state: GameState, effect: CombatEffect, source: CombatSource, depth = 0, execute: ExecuteCombatEffects = executeCombatEffects) => {
  if (depth >= MAX_EFFECT_DEPTH) return
  const target = targetActor(source, effect.target)
  const tags = sourceTags(source, 'tags' in effect ? effect.tags : undefined)
  switch (effect.type) {
    case 'deal-damage': {
      const effectSource = effect.school ? { ...source, school: effect.school } : source
      applyDamage(state, resolveMagnitude(state, effect.magnitude, effectSource, target), effect.damageType, effectSource, target, tags, execute, depth)
      break
    }
    case 'heal': applyHealing(state, resolveMagnitude(state, effect.magnitude, source, target), source, target, tags, execute, depth); break
    case 'gain-barrier': {
      const result = gainBarrierResult(state, resolveMagnitude(state, effect.magnitude, source, target), source, target, tags, { mode: effect.mode ?? 'add', durationMs: effect.durationMs === undefined ? null : effect.durationMs })
      if (result.gained > 0) runCombatTriggers(state, target, 'on-barrier-gained', { source, eventTarget: target, changedActor: target, sourceTags: tags, previousBarrier: result.previous, currentBarrier: result.current, barrierGained: result.gained, amount: result.gained }, execute, depth)
      break
    }
    case 'restore-resource':
    case 'drain-resource': executeResource(state, effect, source); break
    case 'apply-status': {
      const statusSource = { ...source, tags }
      const active = applyStatus(state, target, effect.statusId, statusSource, { durationMs: effect.durationMs, stacks: effect.stacks })
      if (active) {
        const definition = STATUS_DEFINITIONS[effect.statusId]
        appendLog(state, `${definition.name} applied.`)
        // Application events belong to the applier; the status holder is the target.
        runCombatTriggers(state, source.actor, 'on-status-applied', { source: statusSource, eventTarget: target, changedActor: target, sourceTags: tags, statusId: effect.statusId, eventStatusTags: definition.tags }, execute, depth)
      }
      break
    }
    case 'remove-status': if (removeStatus(state, target, effect.statusId, { executeEffects: execute, source, depth })) appendLog(state, `${STATUS_DEFINITIONS[effect.statusId]?.name ?? effect.statusId} removed.`); break
    case 'cleanse': cleanseStatuses(state, target, effect.mode, effect.tag, { executeEffects: execute, source, depth }); break
    case 'dispel': dispelStatuses(state, target, effect.mode, effect.tag, { executeEffects: execute, source, depth }); break
    case 'modify-action-timer': {
      if (target === 'player') state.combat.playerAttackTimerMs = Math.max(0, state.combat.playerAttackTimerMs + effect.amountMs)
      else if (effect.action === 'current' && state.combat.enemyTelegraphActionId) {
        state.combat.enemyTelegraphMs = Math.max(0, state.combat.enemyTelegraphMs + effect.amountMs)
        if (state.combat.enemyTelegraphMs <= 0) resolveActiveEnemyAction(state, execute, depth)
      } else state.combat.enemyActionTimerMs = Math.max(0, state.combat.enemyActionTimerMs + effect.amountMs)
      appendLog(state, `${effect.amountMs >= 0 ? 'Action delayed' : 'Action timer changed'} by ${Math.abs(effect.amountMs)}ms.`)
      break
    }
    case 'modify-cooldown': {
      if (target === 'player') {
        const ids = effect.spellId ? [effect.spellId] : Object.keys(state.combat.spellCooldowns)
        ids.forEach((id) => { if (id in state.combat.spellCooldowns) state.combat.spellCooldowns[id as keyof typeof state.combat.spellCooldowns] = Math.max(0, state.combat.spellCooldowns[id as keyof typeof state.combat.spellCooldowns] + effect.amountMs) })
      }
      break
    }
    case 'set-action-pattern': if (target === 'enemy') setEnemyActionPattern(state, effect.patternId); break
  }
}

export const executeCombatEffects: ExecuteCombatEffects = (state, effects, source, depth = 0) => {
  if (depth >= MAX_EFFECT_DEPTH) return
  effects.forEach((effect) => executeCombatEffect(state, effect, source, depth, executeCombatEffects))
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

export const resolveBasicAttackInterval = (state: GameState, actor: CombatActor, baseInterval: number) => {
  const speed = getCombatModifiers(state, actor, 'basic-attack-speed-percent', { sourceTags: ['basic-attack'] })
  return Math.max(100, Math.round(baseInterval * Math.max(0.1, 1 - speed)))
}

export { getActiveBarrier }

export const getCombatDamagePreview = (state: GameState, raw: number, source: CombatSource, target: CombatActor, damageType: DamageType) => {
  const breakdown = calculateCombatDamage(state, raw, damageType, source, target, source.tags ?? [])
  return { ...breakdown, modified: breakdown.resolvedBeforeBarrier, barrier: getActiveBarrier(state, target) }
}

export const legacyPlayerDamageSource: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'enemy-basic-attack', tags: ['basic-attack', 'direct'] }
export const legacyPlayerBasicSource: CombatSource = { actor: 'player', kind: 'basic-attack', sourceId: 'player-basic-attack', tags: ['basic-attack', 'direct'] }
export { playerBasicDamage, MONSTERS }
