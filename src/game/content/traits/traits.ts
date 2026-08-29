import { STATUS_DEFINITIONS } from '../statuses'
import type { CombatCondition, CombatEffect, CombatModifier, CombatTag, Magnitude, TraitDefinition, TraitId } from '../../systems/combat/combatTypes'

const gainBarrier = (magnitude: Magnitude): CombatEffect => ({
  type: 'gain-barrier',
  target: 'self',
  magnitude,
  mode: 'add',
  durationMs: null,
  tags: ['barrier'],
})

const applyStatus = (statusId: Extract<CombatEffect, { type: 'apply-status' }>['statusId'], durationMs?: number | null): CombatEffect => ({
  type: 'apply-status',
  target: 'self',
  statusId,
  durationMs,
})
const COMBAT_TAGS: readonly CombatTag[] = ['basic-attack', 'spell', 'weapon', 'equipment', 'melee', 'ranged', 'magic', 'direct', 'heal', 'dot', 'hot', 'status', 'special', 'trait', 'buff', 'debuff', 'control', 'barrier', 'physical', 'arcane', 'fire', 'water', 'earth', 'air']

export const TRAIT_DEFINITIONS: Record<TraitId, TraitDefinition> = {
  'forest-wisp-flicker': {
    id: 'forest-wisp-flicker',
    name: 'Flicker',
    description: 'After Arc Spark resolves, gains Haste for 3 seconds.',
    rules: [{ id: 'forest-wisp-flicker-arc-spark', event: 'on-action-resolve', condition: { type: 'event-action-is', actionId: 'arc-spark' }, effects: [applyStatus('haste', 3000)], }],
  },
  'thornling-barkskin': {
    id: 'thornling-barkskin',
    name: 'Barkskin',
    description: 'Basic Attack damage received is reduced by 15%.',
    modifiers: [{ key: 'damage-taken-percent', value: -0.15, sourceTags: ['basic-attack'] }],
  },
  'stone-rooted-shell': {
    id: 'stone-rooted-shell',
    name: 'Rooted Shell',
    description: 'Starts with Barrier equal to 15% max HP.',
    rules: [{
      id: 'stone-rooted-shell-start',
      event: 'on-combat-start',
      effects: [gainBarrier({ type: 'source-max-health-percent', value: 0.15 })],
      oncePerEncounter: true,
    }],
  },
  'grove-sentinel-ancient-growth': {
    id: 'grove-sentinel-ancient-growth',
    name: 'Ancient Growth',
    description: 'At 40% HP, gains a large Barrier once.',
    rules: [{
      id: 'grove-sentinel-ancient-growth-threshold',
      event: 'on-hp-threshold',
      condition: { type: 'self-hp-below-percent', percent: 40 },
      effects: [gainBarrier({ type: 'flat', value: 80 })],
      oncePerEncounter: true,
    }],
  },
  'forest-heart-living-core': {
    id: 'forest-heart-living-core',
    name: 'Living Core',
    description: 'At 50% HP, gains 15% Action speed once.',
    rules: [{
      id: 'forest-heart-living-core-threshold',
      event: 'on-hp-threshold',
      condition: { type: 'self-hp-below-percent', percent: 50 },
      effects: [applyStatus('haste')],
      oncePerEncounter: true,
    }],
  },
  'cavefang-wolf-predator-instinct': {
    id: 'cavefang-wolf-predator-instinct', name: 'Predator Instinct', description: 'Deals 25% more damage while the target is at or below 35% HP.',
    modifiers: [{ key: 'damage-dealt-percent', value: 0.25, condition: { type: 'target-hp-below-percent', percent: 35 } }],
  },
  'razorclaw-lynx-relentless-hunter': {
    id: 'razorclaw-lynx-relentless-hunter', name: 'Relentless Hunter', description: 'Deals 20% more damage to Bleeding targets.',
    modifiers: [{ key: 'damage-dealt-percent', value: 0.2, condition: { type: 'target-has-status', statusId: 'bleeding' } }],
  },
  'corrupted-dire-wolf-arcane-corruption': {
    id: 'corrupted-dire-wolf-arcane-corruption', name: 'Arcane Corruption', description: 'Corruption grants 10% resistance to Fire, Water, Earth, and Air.',
  },
  'corrupted-greatbear-thick-hide': {
    id: 'corrupted-greatbear-thick-hide', name: 'Thick Hide', description: 'Basic Attack damage received is reduced by 20%.',
    modifiers: [{ key: 'damage-taken-percent', value: -0.2, sourceTags: ['basic-attack'] }],
  },
  'corrupted-greatbear-unstable-corruption': {
    id: 'corrupted-greatbear-unstable-corruption', name: 'Unstable Corruption', description: 'At 50% HP, gains Haste and shifts to the Corrupted Pattern once.',
    rules: [{ id: 'corrupted-greatbear-unstable-corruption-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }, { type: 'set-action-pattern', target: 'self', patternId: 'corrupted' }], oncePerEncounter: true }],
  },
  'restless-skeleton-brittle-bones': {
    id: 'restless-skeleton-brittle-bones', name: 'Brittle Bones', description: 'Physical damage is reduced by 25%.',
  },
  'grave-wraith-ethereal-form': {
    id: 'grave-wraith-ethereal-form', name: 'Ethereal Form', description: 'Physical damage is reduced by 50%; Fire, Water, Earth, and Air damage are increased by 25%.',
  },
  'fallen-acolyte-grave-channeling': {
    id: 'fallen-acolyte-grave-channeling', name: 'Grave Channeling', description: 'Below 50% HP, healing done is increased by 50%.',
    modifiers: [{ key: 'healing-done-percent', value: 0.5, condition: { type: 'self-hp-below-percent', percent: 50 } }],
  },
  'archmage-edrin-arcane-remnant': {
    id: 'archmage-edrin-arcane-remnant', name: 'Arcane Remnant', description: 'Resists Fire, Water, Earth, and Air damage by 15%.',
  },
  'archmage-edrin-unbound-spirit': {
    id: 'archmage-edrin-unbound-spirit', name: 'Unbound Spirit', description: 'At 50% HP, gains Haste and shifts to the Unbound Pattern once.',
    rules: [{ id: 'archmage-edrin-unbound-spirit-threshold', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }, { type: 'set-action-pattern', target: 'self', patternId: 'unbound' }], oncePerEncounter: true }],
  },
}

const isTraitId = (traitId: string): traitId is TraitId => Object.prototype.hasOwnProperty.call(TRAIT_DEFINITIONS, traitId)
export const getTraitDefinition = (traitId: string) => isTraitId(traitId) ? TRAIT_DEFINITIONS[traitId] : undefined
export const getTraitDefinitions = (traitIds: readonly string[]) => traitIds.flatMap((traitId) => {
  const definition = getTraitDefinition(traitId)
  return definition ? [definition] : []
})

const validateCondition = (owner: string, condition: CombatCondition | undefined, errors: string[]) => {
  if (!condition) return
  if (condition.type === 'self-hp-below-percent' || condition.type === 'target-hp-below-percent' || condition.type === 'self-hp-above-percent' || condition.type === 'target-hp-above-percent') {
    if (!Number.isFinite(condition.percent) || condition.percent < 0 || condition.percent > 100) errors.push(`${owner}: invalid HP threshold`)
  }
  if (condition.type === 'self-status-stacks-at-least' || condition.type === 'target-status-stacks-at-least') {
    if (!Number.isInteger(condition.stacks) || condition.stacks < 1) errors.push(`${owner}: invalid status stack threshold`)
  }
  if (condition.type === 'self-barrier-at-least' || condition.type === 'self-barrier-at-most' || condition.type === 'target-barrier-at-least' || condition.type === 'target-barrier-at-most') {
    if (!Number.isFinite(condition.value) || condition.value < 0) errors.push(`${owner}: invalid Barrier amount`)
  }
  if (condition.type === 'event-action-is' && !condition.actionId.trim()) errors.push(`${owner}: action id is required`)
  if (condition.type === 'event-action-has-tag' && !COMBAT_TAGS.includes(condition.tag)) errors.push(`${owner}: invalid action tag`)
  if (condition.type === 'all' || condition.type === 'any') condition.conditions.forEach((entry) => validateCondition(owner, entry, errors))
  if (condition.type === 'not') validateCondition(owner, condition.condition, errors)
}

const validateEffects = (owner: string, effects: CombatEffect[], errors: string[]) => effects.forEach((effect) => {
  if ('magnitude' in effect) {
    const magnitude = effect.magnitude
    if ('value' in magnitude && (!Number.isFinite(magnitude.value) || magnitude.value < 0)) errors.push(`${owner}: invalid magnitude`)
    if (magnitude.type === 'school-level' && (!Number.isFinite(magnitude.base) || !Number.isFinite(magnitude.perLevel))) errors.push(`${owner}: invalid school magnitude`)
  }
  if (effect.type === 'apply-status' && !STATUS_DEFINITIONS[effect.statusId]) errors.push(`${owner}: unknown status ${effect.statusId}`)
  if (effect.type === 'set-action-pattern' && !effect.patternId.trim()) errors.push(`${owner}: action pattern id is required`)
  if ('durationMs' in effect && effect.durationMs !== null && effect.durationMs !== undefined && (!Number.isFinite(effect.durationMs) || effect.durationMs < 0)) errors.push(`${owner}: invalid duration`)
})

export const validateTraitDefinitions = () => {
  const errors: string[] = []
  const definitions = Object.entries(TRAIT_DEFINITIONS)
  const ids = definitions.map(([, definition]) => definition.id)
  if (new Set(ids).size !== ids.length) errors.push('duplicate trait id')
  definitions.forEach(([key, definition]) => {
    const owner = `[combat-traits] ${key}`
    if (key !== definition.id) errors.push(`${owner}: key/id mismatch`)
    if (!definition.name.trim()) errors.push(`${owner}: name is required`)
    if (!definition.description.trim()) errors.push(`${owner}: description is required`)
    definition.modifiers?.forEach((modifier: CombatModifier) => {
      if (!Number.isFinite(modifier.value)) errors.push(`${owner}: non-finite modifier`)
      if (modifier.perStack) errors.push(`${owner}: Trait modifiers may not use perStack`)
      validateCondition(`${owner}/modifier`, modifier.condition, errors)
    })
    const ruleIds = (definition.rules ?? []).map((rule) => rule.id)
    if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${owner}: duplicate rule id`)
    definition.rules?.forEach((rule) => {
      if (rule.priority !== undefined && (!Number.isInteger(rule.priority) || !Number.isFinite(rule.priority))) errors.push(`${owner}/${rule.id}: invalid priority`)
      if (rule.cooldownMs !== undefined && (!Number.isInteger(rule.cooldownMs) || !Number.isFinite(rule.cooldownMs) || rule.cooldownMs < 0)) errors.push(`${owner}/${rule.id}: invalid cooldown`)
      validateCondition(`${owner}/${rule.id}`, rule.condition, errors)
      validateEffects(`${owner}/${rule.id}`, rule.effects, errors)
    })
  })
  if (errors.length && import.meta.env.DEV) console.error(errors.join('; '))
  return errors
}

validateTraitDefinitions()

export type { TraitId } from '../../systems/combat/combatTypes'
