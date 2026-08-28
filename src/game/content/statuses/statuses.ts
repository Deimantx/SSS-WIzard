import type { CombatEffect, StatusDefinition, StatusId, StatusModifier } from '../../systems/combat/combatTypes'

// Periodic effects are authored relative to the status holder. The runtime
// maps the holder to self/opponent while retaining the original source.
const damage = (damageType: 'physical' | 'fire', value: number): CombatEffect => ({ type: 'deal-damage', target: 'self', damageType, magnitude: { type: 'flat', value }, tags: ['status', 'dot'] })
const heal = (value: number): CombatEffect => ({ type: 'heal', target: 'self', magnitude: { type: 'flat', value }, tags: ['status', 'hot'] })
const modifier = (key: StatusModifier['key'], value: number, extra: Omit<StatusModifier, 'key' | 'value'> = {}): StatusModifier => ({ key, value, ...extra })

export const STATUS_DEFINITIONS: Record<StatusId, StatusDefinition> = {
  burning: {
    id: 'burning', name: 'Burning', description: 'Takes Fire damage over time.', classification: 'debuff', tags: ['debuff', 'dot', 'fire'], defaultDurationMs: 5000,
    stacking: { mode: 'refresh' }, periodic: { intervalMs: 1000, effects: [damage('fire', 5)] }, cleanseable: true, dispellable: false,
  },
  quickening: {
    id: 'quickening', name: 'Quickening', description: 'Basic Attacks resolve 25% faster.', classification: 'buff', tags: ['buff', 'air'], defaultDurationMs: 6000,
    stacking: { mode: 'refresh' }, modifiers: [modifier('basic-attack-speed-percent', 0.25)], cleanseable: false, dispellable: true,
  },
  'thorn-wound': {
    id: 'thorn-wound', name: 'Thorn Wound', description: 'Thorns deal physical damage over time.', classification: 'debuff', tags: ['debuff', 'dot'], defaultDurationMs: 6000,
    stacking: { mode: 'refresh' }, periodic: { intervalMs: 2000, effects: [damage('physical', 3)] }, cleanseable: true, dispellable: false,
  },
  chilled: {
    id: 'chilled', name: 'Chilled', description: 'Basic Attacks resolve 20% slower.', classification: 'debuff', tags: ['debuff', 'control', 'water'], defaultDurationMs: 5000,
    stacking: { mode: 'strongest' }, modifiers: [modifier('basic-attack-speed-percent', -0.2)], cleanseable: true, dispellable: false,
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
    stacking: { mode: 'refresh' }, cleanseable: true, dispellable: false,
  },
  vulnerable: {
    id: 'vulnerable', name: 'Vulnerable', description: 'Damage taken is increased by 15%.', classification: 'debuff', tags: ['debuff'], defaultDurationMs: 6000,
    stacking: { mode: 'strongest' }, modifiers: [modifier('damage-taken-percent', 0.15)], cleanseable: true, dispellable: false,
  },
  purified: {
    id: 'purified', name: 'Purified', description: 'Incoming control and debuff durations are reduced by 50%.', classification: 'buff', tags: ['buff', 'water'], defaultDurationMs: 4000,
    stacking: { mode: 'refresh' }, modifiers: [modifier('status-duration-received-percent', -0.5)], cleanseable: false, dispellable: true,
  },
  stunned: {
    id: 'stunned', name: 'Stunned', description: 'Cannot start or resolve normal actions.', classification: 'debuff', tags: ['debuff', 'control'], defaultDurationMs: 3000,
    stacking: { mode: 'refresh' }, preventsAction: true, cleanseable: true, dispellable: false,
  },
}

export const getStatusDefinition = (statusId: StatusId) => STATUS_DEFINITIONS[statusId]
export const STATUS_ORDER = Object.keys(STATUS_DEFINITIONS) as StatusId[]

export const validateStatusDefinitions = () => {
  const errors: string[] = []
  Object.values(STATUS_DEFINITIONS).forEach((definition) => {
    if (definition.defaultDurationMs !== null && definition.defaultDurationMs < 0) errors.push(`${definition.id}: negative duration`)
    if (definition.periodic && definition.periodic.intervalMs <= 0) errors.push(`${definition.id}: periodic interval must be positive`)
    if (definition.stacking.maxStacks !== undefined && definition.stacking.maxStacks < 1) errors.push(`${definition.id}: maxStacks must be at least one`)
    definition.periodic?.effects.forEach((effect) => { if (effect.type === 'apply-status' && !STATUS_DEFINITIONS[effect.statusId]) errors.push(`${definition.id}: unknown status ${effect.statusId}`) })
  })
  if (errors.length && import.meta.env.DEV) console.error(`[combat-statuses] ${errors.join('; ')}`)
  return errors
}

validateStatusDefinitions()
