import type { CombatEffect, CombatModifier, CombatTag, StatusDefinition, StatusId } from '../../systems/combat/combatTypes'

// Periodic effects are authored relative to the status holder. The runtime
// maps the holder to self/opponent while retaining the original source.
const damage = (damageType: 'physical' | 'fire', value: number): CombatEffect => ({ type: 'deal-damage', target: 'self', damageType, magnitude: { type: 'flat', value }, tags: ['dot', damageType] })
const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['heal', 'hot'] })
const modifier = (key: CombatModifier['key'], value: number, extra: Omit<CombatModifier, 'key' | 'value'> = {}): CombatModifier => ({ key, value, ...extra })
const COMBAT_TAGS: readonly CombatTag[] = ['basic-attack', 'spell', 'weapon', 'equipment', 'melee', 'ranged', 'magic', 'direct', 'heal', 'dot', 'hot', 'status', 'special', 'trait', 'buff', 'debuff', 'control', 'barrier', 'physical', 'arcane', 'fire', 'water', 'earth', 'air']

export const STATUS_DEFINITIONS: Record<StatusId, StatusDefinition> = {
  burning: {
    id: 'burning', name: 'Burning', description: 'Takes Fire damage over time.', classification: 'debuff', tags: ['debuff', 'dot', 'fire'], defaultDurationMs: 5000,
    stacking: { mode: 'refresh' }, periodic: { intervalMs: 1000, effects: [damage('fire', 5)] }, cleanseable: true, dispellable: false,
  },
  quickening: {
    id: 'quickening', name: 'Quickening', description: 'Basic Attacks resolve 25% faster.', classification: 'buff', tags: ['buff', 'air'], defaultDurationMs: 6000,
    stacking: { mode: 'refresh' }, modifiers: [modifier('basic-attack-speed-percent', 0.25)], cleanseable: false, dispellable: true,
  },
  haste: {
    id: 'haste', name: 'Haste', description: 'Action speed increased by 15%.', classification: 'buff', tags: ['buff'], defaultDurationMs: null,
    stacking: { mode: 'refresh' }, modifiers: [modifier('action-speed-percent', 0.15)], cleanseable: false, dispellable: true,
  },
  'spectral-fade': {
    id: 'spectral-fade', name: 'Spectral Fade', description: 'Damage taken is reduced by 25%.', classification: 'buff', tags: ['buff'], defaultDurationMs: 5000,
    stacking: { mode: 'strongest' }, modifiers: [modifier('damage-taken-percent', -0.25)], cleanseable: false, dispellable: true,
  },
  'thorn-wound': {
    id: 'thorn-wound', name: 'Thorn Wound', description: 'Thorns deal physical damage over time.', classification: 'debuff', tags: ['debuff', 'dot'], defaultDurationMs: 6000,
    stacking: { mode: 'refresh' }, periodic: { intervalMs: 2000, effects: [damage('physical', 3)] }, cleanseable: true, dispellable: false,
  },
  bleeding: {
    id: 'bleeding', name: 'Bleeding', description: 'Takes 4 Physical damage every 2 seconds.', classification: 'debuff', tags: ['debuff', 'dot', 'physical'], defaultDurationMs: 8000,
    stacking: { mode: 'refresh' }, periodic: { intervalMs: 2000, effects: [damage('physical', 4)] }, cleanseable: true, dispellable: false,
  },
  chilled: {
    id: 'chilled', name: 'Chilled', description: 'Basic Attacks and Action cadence are 20% slower.', classification: 'debuff', tags: ['debuff', 'control', 'water'], defaultDurationMs: 5000,
    stacking: { mode: 'strongest' }, modifiers: [modifier('basic-attack-speed-percent', -0.2), modifier('action-speed-percent', -0.2)], cleanseable: true, dispellable: false, ui: { alert: 'important', icon: 'control' },
  },
  regeneration: {
    id: 'regeneration', name: 'Regeneration', description: 'Restores Health over time.', classification: 'buff', tags: ['buff', 'hot', 'water'], defaultDurationMs: 6000,
    stacking: { mode: 'refresh' }, periodic: { intervalMs: 1000, effects: [heal(5)] }, cleanseable: false, dispellable: true,
  },
  fortified: {
    id: 'fortified', name: 'Fortified', description: 'Damage taken is reduced by 15%.', classification: 'buff', tags: ['buff', 'earth'], defaultDurationMs: 8000,
    stacking: { mode: 'strongest' }, modifiers: [modifier('damage-taken-percent', -0.15)], cleanseable: false, dispellable: true,
  },
  shock: {
    id: 'shock', name: 'Shock', description: 'Each stack increases Air damage taken by 4%.', classification: 'debuff', tags: ['debuff', 'air'], defaultDurationMs: 8000,
    stacking: { mode: 'stacks', maxStacks: 5 }, modifiers: [modifier('damage-taken-percent', 0.04, { damageTypes: ['air'], perStack: true })], cleanseable: true, dispellable: false,
  },
  staggered: {
    id: 'staggered', name: 'Staggered', description: 'Recently suffered a stagger.', classification: 'debuff', tags: ['debuff', 'control', 'earth'], defaultDurationMs: 1000,
    stacking: { mode: 'refresh' }, cleanseable: true, dispellable: false, ui: { alert: 'important', icon: 'control' },
  },
  vulnerable: {
    id: 'vulnerable', name: 'Vulnerable', description: 'Damage taken is increased by 15%.', classification: 'debuff', tags: ['debuff'], defaultDurationMs: 6000,
    stacking: { mode: 'strongest' }, modifiers: [modifier('damage-taken-percent', 0.15)], cleanseable: true, dispellable: false, ui: { alert: 'important', icon: 'status' },
  },
  purified: {
    id: 'purified', name: 'Purified', description: 'Incoming control and debuff durations are reduced by 50%.', classification: 'buff', tags: ['buff', 'water'], defaultDurationMs: 4000,
    stacking: { mode: 'refresh' }, modifiers: [modifier('status-duration-received-percent', -0.5, { statusTags: ['debuff'] })], cleanseable: false, dispellable: true,
  },
  stunned: {
    id: 'stunned', name: 'Stunned', description: 'Cannot start or resolve normal actions.', classification: 'debuff', tags: ['debuff', 'control'], defaultDurationMs: 3000,
    stacking: { mode: 'refresh' }, preventsAction: true, cleanseable: true, dispellable: false, ui: { alert: 'critical', icon: 'control' },
  },
}

export const getStatusDefinition = (statusId: StatusId) => STATUS_DEFINITIONS[statusId]
export const STATUS_ORDER = Object.keys(STATUS_DEFINITIONS) as StatusId[]

export const validateStatusDefinitions = () => {
  const errors: string[] = []
  const ids = Object.values(STATUS_DEFINITIONS).map((definition) => definition.id)
  if (new Set(ids).size !== ids.length) errors.push('duplicate status id')
  const validateCondition = (owner: string, condition: import('../../systems/combat/combatTypes').CombatCondition | undefined): void => {
    if (!condition) return
    if ((condition.type === 'self-hp-below-percent' || condition.type === 'target-hp-below-percent' || condition.type === 'self-hp-above-percent' || condition.type === 'target-hp-above-percent') && (!Number.isFinite(condition.percent) || condition.percent < 0 || condition.percent > 100)) errors.push(`${owner}: invalid HP threshold`)
    if ((condition.type === 'self-status-stacks-at-least' || condition.type === 'target-status-stacks-at-least') && (!Number.isInteger(condition.stacks) || condition.stacks < 1)) errors.push(`${owner}: invalid status stack threshold`)
    if ((condition.type === 'self-barrier-at-least' || condition.type === 'self-barrier-at-most' || condition.type === 'target-barrier-at-least' || condition.type === 'target-barrier-at-most') && (!Number.isFinite(condition.value) || condition.value < 0)) errors.push(`${owner}: invalid Barrier amount`)
    if (condition.type === 'event-action-is' && !condition.actionId.trim()) errors.push(`${owner}: action id is required`)
    if (condition.type === 'event-action-has-tag' && !COMBAT_TAGS.includes(condition.tag)) errors.push(`${owner}: invalid action tag`)
    if (condition.type === 'all' || condition.type === 'any') condition.conditions.forEach((entry) => validateCondition(owner, entry))
    if (condition.type === 'not') validateCondition(owner, condition.condition)
  }
  const validateEffects = (owner: string, effects: CombatEffect[]) => effects.forEach((effect) => {
    if ('magnitude' in effect) {
      const magnitude = effect.magnitude
      if ('value' in magnitude && !Number.isFinite(magnitude.value)) errors.push(`${owner}: non-finite magnitude`)
      if (magnitude.type === 'school-level' && (!Number.isFinite(magnitude.base) || !Number.isFinite(magnitude.perLevel))) errors.push(`${owner}: non-finite school magnitude`)
    }
    if (effect.type === 'apply-status' && !STATUS_DEFINITIONS[effect.statusId]) errors.push(`${owner}: unknown status ${effect.statusId}`)
    if (effect.type === 'set-action-pattern' && !effect.patternId.trim()) errors.push(`${owner}: action pattern id is required`)
  })
  Object.entries(STATUS_DEFINITIONS).forEach(([key, definition]) => {
    if (key !== definition.id) errors.push(`${key}: key/id mismatch`)
    if (definition.defaultDurationMs !== null && definition.defaultDurationMs < 0) errors.push(`${definition.id}: negative duration`)
    if (definition.defaultDurationMs !== null && !Number.isFinite(definition.defaultDurationMs)) errors.push(`${definition.id}: non-finite duration`)
    if (definition.periodic && definition.periodic.intervalMs <= 0) errors.push(`${definition.id}: periodic interval must be positive`)
    if (definition.stacking.maxStacks !== undefined && definition.stacking.maxStacks < 1) errors.push(`${definition.id}: maxStacks must be at least one`)
    if (definition.stacking.maxDurationMs !== undefined && (!Number.isFinite(definition.stacking.maxDurationMs) || definition.stacking.maxDurationMs < 0)) errors.push(`${definition.id}: invalid max duration`)
    definition.modifiers?.forEach((entry) => { if (!Number.isFinite(entry.value)) errors.push(`${definition.id}: non-finite modifier`); validateCondition(`${definition.id}:modifier`, entry.condition) })
    validateEffects(`${definition.id}: periodic`, definition.periodic?.effects ?? [])
    definition.triggers?.forEach((rule) => { if (rule.priority !== undefined && (!Number.isInteger(rule.priority) || !Number.isFinite(rule.priority))) errors.push(`${definition.id}:${rule.id}: invalid priority`); if (rule.cooldownMs !== undefined && (!Number.isInteger(rule.cooldownMs) || !Number.isFinite(rule.cooldownMs) || rule.cooldownMs < 0)) errors.push(`${definition.id}:${rule.id}: invalid cooldown`); validateCondition(`${definition.id}:${rule.id}`, rule.condition); validateEffects(`${definition.id}:${rule.id}`, rule.effects) })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-statuses] ${errors.join('; ')}`)
  return errors
}

validateStatusDefinitions()
