import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters/whisperingWoods'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { appendLog, barrierMultiplier, equipmentStats, playerBasicDamage, spellDamageMultiplier } from '../../engine'
import type { GameState } from '../../types'
import { clamp } from '../../utils'
import { applyStatus, cleanseStatuses, dispelStatuses, removeStatus } from './statusRuntime'
import type { CombatActor } from './magnitude'
import { getActorHealth, resolveMagnitude } from './magnitude'
import { getCombatModifiers, getResistance, isImmuneToDamage } from './modifiers'
import { runCombatTriggers, type CombatEventContext } from './triggerRuntime'
import type { CombatEffect, CombatSource, CombatTag, DamageType, EffectTarget } from './combatTypes'

const MAX_EFFECT_DEPTH = 20

const targetActor = (source: CombatSource, target: EffectTarget): CombatActor => target === 'self' ? source.actor : source.actor === 'player' ? 'enemy' : 'player'
const sourceTags = (source: CombatSource, effectTags?: CombatTag[]) => [...new Set([...(source.tags ?? []), ...(effectTags ?? [])])]

const emitTriggers = (state: GameState, event: 'on-damage-dealt' | 'on-damage-taken' | 'on-hp-threshold' | 'on-barrier-broken', source: CombatSource, target: CombatActor, tags: CombatTag[], execute: ExecuteCombatEffects, depth: number) => {
  const context: CombatEventContext = { source, target, sourceTags: tags }
  if (event !== 'on-hp-threshold') runCombatTriggers(state, source.actor, event, context, execute, depth)
  runCombatTriggers(state, target, event === 'on-hp-threshold' ? 'on-hp-threshold' : event, context, execute, depth)
}

const applyDamage = (state: GameState, raw: number, damageType: DamageType, source: CombatSource, target: CombatActor, tags: CombatTag[], execute: ExecuteCombatEffects, depth: number) => {
  if (raw <= 0 || isImmuneToDamage(state, target, damageType)) return 0
  let damage = raw
  const sourceModifierContext = { sourceTags: tags, damageType }
  const targetModifierContext = { sourceTags: tags, damageType }
  damage *= 1 + getCombatModifiers(state, source.actor, 'damage-dealt-percent', sourceModifierContext)
  if (tags.includes('basic-attack')) damage *= 1 + getCombatModifiers(state, source.actor, 'basic-attack-damage-percent', sourceModifierContext)
  if (source.kind === 'spell') damage *= 1 + getCombatModifiers(state, source.actor, 'spell-damage-percent', sourceModifierContext)
  if (source.kind === 'weapon' || tags.includes('melee')) damage *= 1 + getCombatModifiers(state, source.actor, 'melee-damage-percent', sourceModifierContext)
  if (source.kind === 'weapon' || tags.includes('ranged')) damage *= 1 + getCombatModifiers(state, source.actor, 'ranged-damage-percent', sourceModifierContext)
  damage *= 1 + getCombatModifiers(state, target, 'damage-taken-percent', targetModifierContext)
  damage *= 1 - getResistance(state, target, damageType)
  damage = Math.max(0, Math.round(damage))

  let barrier = target === 'player' ? state.combat.playerBarrier : state.combat.enemyBarrier
  const absorbed = Math.min(barrier, damage)
  barrier = Math.max(0, barrier - absorbed)
  if (target === 'player') state.combat.playerBarrier = barrier
  else state.combat.enemyBarrier = barrier
  const dealt = Math.max(0, damage - absorbed)
  if (target === 'player') state.player.health = Math.max(0, state.player.health - dealt)
  else state.combat.enemyHp = Math.max(0, state.combat.enemyHp - dealt)
  if (source.actor === 'player') state.combat.lastDamageDealt = dealt
  else state.combat.lastDamageTaken = dealt
  if (absorbed > 0 && barrier === 0) {
    appendLog(state, 'Barrier breaks.')
    runCombatTriggers(state, target, 'on-barrier-broken', { source, target, sourceTags: tags }, execute, depth)
  }
  emitTriggers(state, 'on-damage-dealt', source, target, tags, execute, depth)
  emitTriggers(state, 'on-damage-taken', source, target, tags, execute, depth)
  const hitEvent = tags.includes('basic-attack') ? 'on-basic-attack-hit' : source.kind === 'spell' ? 'on-spell-hit' : null
  if (hitEvent) {
    runCombatTriggers(state, source.actor, hitEvent, { source, target, sourceTags: tags }, execute, depth)
    runCombatTriggers(state, target, hitEvent, { source, target, sourceTags: tags }, execute, depth)
  }
  if (getActorHealth(state, target) <= 0 && dealt > 0) runCombatTriggers(state, source.actor, 'on-kill', { source, target, sourceTags: tags }, execute, depth)
  if (getActorHealth(state, target) > 0) emitTriggers(state, 'on-hp-threshold', source, target, tags, execute, depth)
  return dealt
}

const applyHealing = (state: GameState, raw: number, source: CombatSource, target: CombatActor, tags: CombatTag[]) => {
  const amount = Math.max(0, Math.round(raw * (1 + getCombatModifiers(state, source.actor, 'healing-done-percent', { sourceTags: tags }))))
  const received = Math.max(0, 1 + getCombatModifiers(state, target, 'healing-received-percent', { sourceTags: tags }))
  const before = getActorHealth(state, target)
  const max = target === 'player' ? state.player.maxHealth : state.combat.enemyMaxHp
  const healed = Math.max(0, Math.min(max, before + amount * received) - before)
  if (target === 'player') state.player.health += healed
  else state.combat.enemyHp += healed
  return Math.round(healed)
}

const applyBarrier = (state: GameState, raw: number, source: CombatSource, target: CombatActor, tags: CombatTag[]) => {
  const sourcePower = Math.max(0, 1 + getCombatModifiers(state, source.actor, 'barrier-power-percent', { sourceTags: tags }))
  const targetPower = Math.max(0, 1 + getCombatModifiers(state, target, 'barrier-received-percent', { sourceTags: tags }))
  const equipmentBonus = target === 'player' ? equipmentStats(state).barrierReceived ?? 0 : 0
  const amount = Math.max(0, Math.round(raw * sourcePower * targetPower * (target === 'player' ? barrierMultiplier(state) : 1) + equipmentBonus))
  if (target === 'player') state.combat.playerBarrier = Math.max(0, state.combat.playerBarrier + amount)
  else state.combat.enemyBarrier = Math.max(0, state.combat.enemyBarrier + amount)
  return amount
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
      let amount = resolveMagnitude(state, effect.magnitude, effectSource, target)
      if (effectSource.school) amount *= spellDamageMultiplier(state, effectSource.school)
      applyDamage(state, amount, effect.damageType, effectSource, target, tags, execute, depth)
      break
    }
    case 'heal': applyHealing(state, resolveMagnitude(state, effect.magnitude, source, target), source, target, tags); break
    case 'gain-barrier': applyBarrier(state, resolveMagnitude(state, effect.magnitude, source, target), source, target, tags); break
    case 'restore-resource':
    case 'drain-resource': executeResource(state, effect, source); break
    case 'apply-status': {
      const active = applyStatus(state, target, effect.statusId, { ...source, tags }, { durationMs: effect.durationMs, stacks: effect.stacks, potency: effect.potency })
      if (active) {
        const definition = STATUS_DEFINITIONS[effect.statusId]
        appendLog(state, `${definition.name} applied.`)
        runCombatTriggers(state, target, 'on-status-applied', { source, target, sourceTags: tags, statusId: effect.statusId }, execute, depth)
      }
      break
    }
    case 'remove-status': if (removeStatus(state, target, effect.statusId)) appendLog(state, `${STATUS_DEFINITIONS[effect.statusId]?.name ?? effect.statusId} removed.`); break
    case 'cleanse': cleanseStatuses(state, target, effect.mode, effect.tag); break
    case 'dispel': dispelStatuses(state, target, effect.mode, effect.tag); break
    case 'modify-action-timer': {
      if (target === 'player') state.combat.playerAttackTimerMs = Math.max(0, state.combat.playerAttackTimerMs + effect.amountMs)
      else state.combat.enemyActionTimerMs = Math.max(0, state.combat.enemyActionTimerMs + effect.amountMs)
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
    case 'interrupt': {
      if (target === 'enemy' && state.combat.enemyTelegraphMs > 0) {
        const actionId = state.combat.enemyTelegraphActionId
        state.combat.enemyTelegraphMs = 0
        state.combat.enemyTelegraphActionId = null
        state.combat.enemyActionTimerMs = state.combat.enemyIntervalMs
        appendLog(state, `${actionId ?? 'Special Attack'} interrupted.`)
      }
      break
    }
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
  const sourceMeta = sourceForLegacy(source, source === 'status' ? 'player' : 'player')
  return applyDamage(state, raw, 'physical', sourceMeta, 'enemy', sourceMeta.tags ?? [], executeCombatEffects, 0)
}

export const damagePlayer = (state: GameState, raw: number, source: CombatSource = sourceForLegacy('basic', 'enemy')) => {
  return applyDamage(state, raw, 'physical', source, 'player', source.tags ?? [], executeCombatEffects, 0)
}

export const gainBarrier = (state: GameState, amount: number, target: CombatActor, source: CombatSource = { actor: target, kind: 'system', sourceId: 'legacy-barrier' }) => applyBarrier(state, amount, source, target, source.tags ?? ['barrier'])

export const getBasicAttackTags = (state: GameState): CombatTag[] => {
  const weapon = state.equipment.weapon ? ITEMS[state.equipment.weapon] : undefined
  return [...new Set<CombatTag>(['basic-attack', 'direct', ...(weapon?.attackTags ?? []), ...(weapon ? ['weapon' as const] : [])])]
}

export const resolveBasicAttackInterval = (state: GameState, actor: CombatActor, baseInterval: number) => {
  const speed = getCombatModifiers(state, actor, 'basic-attack-speed-percent', { sourceTags: ['basic-attack'] })
  return Math.max(100, Math.round(baseInterval * Math.max(0.1, 1 - speed)))
}

export const getActiveBarrier = (state: GameState, actor: CombatActor) => actor === 'player' ? state.combat.playerBarrier : state.combat.enemyBarrier

export const getCombatDamagePreview = (state: GameState, raw: number, source: CombatSource, target: CombatActor, damageType: DamageType) => {
  const tags = source.tags ?? []
  const amount = resolveMagnitude(state, { type: 'flat', value: raw }, source, target)
  return { raw: amount, modified: clamp(Math.round(amount * (1 + getCombatModifiers(state, source.actor, 'damage-dealt-percent', { sourceTags: tags, damageType }) + getCombatModifiers(state, target, 'damage-taken-percent', { sourceTags: tags, damageType }))), 0, Number.MAX_SAFE_INTEGER), resistance: getResistance(state, target, damageType), barrier: getActiveBarrier(state, target) }
}

export const legacyPlayerDamageSource: CombatSource = { actor: 'enemy', kind: 'basic-attack', sourceId: 'enemy-basic-attack', tags: ['basic-attack', 'direct'] }
export const legacyPlayerBasicSource: CombatSource = { actor: 'player', kind: 'basic-attack', sourceId: 'player-basic-attack', tags: ['basic-attack', 'direct'] }
export { playerBasicDamage, MONSTERS }
