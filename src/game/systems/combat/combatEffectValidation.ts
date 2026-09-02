import type { CombatCondition, CombatEffect, CombatModifier, CombatSource, CombatTag, CombatTriggerRule, DamageType, ModifierKey, StatusDefinition, StatusId } from './combatTypes'

export const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
export const COMBAT_TAGS: readonly CombatTag[] = ['basic-attack', 'spell', 'weapon', 'equipment', 'melee', 'ranged', 'magic', 'direct', 'heal', 'dot', 'hot', 'status', 'special', 'trait', 'buff', 'debuff', 'control', 'barrier', ...DAMAGE_TYPES]
export const COMBAT_SOURCE_KINDS: readonly CombatSource['kind'][] = ['basic-attack', 'spell', 'weapon', 'status', 'trait', 'action', 'equipment', 'system']
export const COMBAT_TRIGGERS: readonly CombatTriggerRule['event'][] = ['on-combat-start', 'on-basic-attack-hit', 'on-spell-hit', 'on-damage-dealt', 'on-damage-taken', 'on-barrier-broken', 'on-status-applied', 'on-hp-threshold', 'on-action-start', 'on-action-resolve', 'on-heal', 'on-heal-received', 'on-barrier-gained', 'on-status-removed', 'on-status-expired', 'on-kill']
export const COMBAT_MODIFIER_KEYS: readonly ModifierKey[] = ['damage-dealt-percent', 'damage-taken-percent', 'basic-attack-damage-percent', 'basic-attack-speed-percent', 'action-speed-percent', 'spell-damage-percent', 'melee-damage-percent', 'ranged-damage-percent', 'healing-done-percent', 'healing-received-percent', 'barrier-power-percent', 'barrier-received-flat', 'barrier-received-percent', 'mana-regen-percent', 'cooldown-recovery-percent', 'control-duration-received-percent', 'status-duration-dealt-percent', 'status-duration-received-percent', 'defense-flat', 'crit-chance', 'crit-damage', 'block-chance', 'damage-over-time-percent', 'resistance-percent']

/** Optional semantic lookups keep generic structural validation independent of content registries. */
export interface CombatValidationContext {
  hasStatus?: (statusId: string) => boolean
  getStatus?: (statusId: string) => StatusDefinition | undefined
  isPeriodicStatus?: (statusId: string) => boolean
}

export const createCombatValidationContext = (registry: Record<string, StatusDefinition>): CombatValidationContext => ({
  hasStatus: (statusId) => Object.prototype.hasOwnProperty.call(registry, statusId),
  getStatus: (statusId) => registry[statusId],
  isPeriodicStatus: (statusId) => Boolean(registry[statusId]?.periodic),
})

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isStringArray = (value: unknown, allowed: readonly string[]) => value === undefined || Array.isArray(value) && value.every((entry) => typeof entry === 'string' && allowed.includes(entry))
const isStatusId = (value: unknown, context: CombatValidationContext = {}): value is StatusId => typeof value === 'string' && value.trim().length > 0 && (context.hasStatus ? context.hasStatus(value) : true)
const isDamageType = (value: unknown): value is DamageType => typeof value === 'string' && DAMAGE_TYPES.includes(value as DamageType)
const isTag = (value: unknown): value is CombatTag => typeof value === 'string' && COMBAT_TAGS.includes(value as CombatTag)

export const validateMagnitude = (value: unknown, owner = 'magnitude'): string[] => {
  const errors: string[] = []
  if (!isRecord(value) || typeof value.type !== 'string') return [`${owner}: invalid magnitude`]
  switch (value.type) {
    case 'flat':
    case 'source-max-health-percent':
    case 'target-max-health-percent':
    case 'source-basic-damage-percent':
    case 'target-missing-health-percent':
      if (!isFiniteNumber(value.value) || value.value < 0) errors.push(`${owner}: ${value.type} value must be finite and non-negative`)
      break
    case 'spell-power':
      if (!isFiniteNumber(value.coefficient) || value.coefficient < 0) errors.push(`${owner}: Spell Power coefficient must be finite and non-negative`)
      break
    case 'school-level':
      if (!isFiniteNumber(value.base) || value.base < 0 || !isFiniteNumber(value.perLevel) || value.perLevel < 0 || !['fire', 'water', 'earth', 'air'].includes(String(value.school))) errors.push(`${owner}: invalid school-level magnitude`)
      break
    default:
      errors.push(`${owner}: unsupported magnitude type`)
  }
  return errors
}

export const validateCombatCondition = (value: unknown, owner = 'condition', context: CombatValidationContext = {}): string[] => {
  if (!isRecord(value) || typeof value.type !== 'string') return [`${owner}: invalid condition`]
  const errors: string[] = []
  const threshold = value.type === 'self-hp-below-percent' || value.type === 'target-hp-below-percent' || value.type === 'self-hp-above-percent' || value.type === 'target-hp-above-percent'
  if (threshold && (!isFiniteNumber(value.percent) || value.percent < 0 || value.percent > 100)) errors.push(`${owner}: invalid HP threshold`)
  if (value.type === 'self-status-stacks-at-least' || value.type === 'target-status-stacks-at-least') {
    if (typeof value.statusId !== 'string' || !isStatusId(value.statusId, context)) errors.push(`${owner}: invalid status reference`)
    if (!Number.isInteger(value.stacks) || Number(value.stacks) < 1) errors.push(`${owner}: invalid status stack threshold`)
  }
  if (value.type === 'self-has-status' || value.type === 'target-has-status' || value.type === 'event-status-is') {
    if (!isStatusId(value.statusId, context)) errors.push(`${owner}: invalid status reference`)
  }
  if (value.type === 'self-barrier-at-least' || value.type === 'self-barrier-at-most' || value.type === 'target-barrier-at-least' || value.type === 'target-barrier-at-most') {
    if (!isFiniteNumber(value.value) || value.value < 0) errors.push(`${owner}: invalid Barrier amount`)
  }
  if (value.type === 'source-has-tag' || value.type === 'event-status-has-tag' || value.type === 'event-action-has-tag') {
    if (typeof value.tag !== 'string' || !isTag(value.tag)) errors.push(`${owner}: invalid tag`)
  }
  if (value.type === 'event-action-is' && (typeof value.actionId !== 'string' || !value.actionId.trim())) errors.push(`${owner}: action id is required`)
  if (value.type === 'event-damage-type-is' && !isDamageType(value.damageType)) errors.push(`${owner}: invalid damage type`)
  if (value.type === 'all' || value.type === 'any') {
    if (!Array.isArray(value.conditions) || value.conditions.length === 0) errors.push(`${owner}: ${value.type} requires at least one condition`)
    else value.conditions.forEach((condition, index) => errors.push(...validateCombatCondition(condition, `${owner}.${value.type}[${index}]`, context)))
  } else if (value.type === 'not') {
    errors.push(...validateCombatCondition(value.condition, `${owner}.not`, context))
  }
  const known = ['always', 'self-hp-below-percent', 'target-hp-below-percent', 'self-has-status', 'target-has-status', 'self-has-barrier', 'target-has-barrier', 'self-hp-above-percent', 'target-hp-above-percent', 'self-status-stacks-at-least', 'target-status-stacks-at-least', 'self-barrier-at-least', 'self-barrier-at-most', 'target-barrier-at-least', 'target-barrier-at-most', 'source-has-tag', 'event-status-is', 'event-status-has-tag', 'event-action-is', 'event-action-has-tag', 'event-damage-type-is', 'target-has-status-tag', 'event-target-is-self', 'source-is-self', 'source-is-opponent', 'all', 'any', 'not']
  if (!known.includes(value.type)) errors.push(`${owner}: unsupported condition operator ${value.type}`)
  return errors
}

export const validateCombatModifier = (value: unknown, owner = 'modifier', context: CombatValidationContext = {}): string[] => {
  if (!isRecord(value)) return [`${owner}: invalid combat modifier`]
  const errors: string[] = []
  if (!COMBAT_MODIFIER_KEYS.includes(value.key as ModifierKey)) errors.push(`${owner}: invalid modifier key`)
  if (!isFiniteNumber(value.value)) errors.push(`${owner}: modifier value must be finite`)
  if (value.sourceKinds !== undefined && !isStringArray(value.sourceKinds, COMBAT_SOURCE_KINDS)) errors.push(`${owner}: invalid source kind filter`)
  if (value.originSourceKinds !== undefined && !isStringArray(value.originSourceKinds, COMBAT_SOURCE_KINDS)) errors.push(`${owner}: invalid origin source kind filter`)
  if (value.sourceTags !== undefined && (!Array.isArray(value.sourceTags) || !value.sourceTags.every((entry) => typeof entry === 'string' && COMBAT_TAGS.includes(entry as CombatTag)))) errors.push(`${owner}: invalid source tag filter`)
  if (value.originTags !== undefined && (!Array.isArray(value.originTags) || !value.originTags.every((entry) => typeof entry === 'string' && COMBAT_TAGS.includes(entry as CombatTag)))) errors.push(`${owner}: invalid origin tag filter`)
  if (value.statusIds !== undefined && (!Array.isArray(value.statusIds) || !value.statusIds.every((statusId) => isStatusId(statusId, context)))) errors.push(`${owner}: invalid status reference filter`)
  if (value.damageTypes !== undefined && (!Array.isArray(value.damageTypes) || !value.damageTypes.every(isDamageType))) errors.push(`${owner}: invalid damage type filter`)
  if (value.statusTags !== undefined && (!Array.isArray(value.statusTags) || !value.statusTags.every(isTag))) errors.push(`${owner}: invalid status tag filter`)
  if (value.perStack !== undefined && typeof value.perStack !== 'boolean') errors.push(`${owner}: perStack must be boolean`)
  if (value.condition !== undefined) errors.push(...validateCombatCondition(value.condition, `${owner}.condition`, context))
  return errors
}

const validateStatusOverrides = (statusId: StatusId, value: unknown, owner: string, context: CombatValidationContext = {}) => {
  if (value === undefined) return []
  if (!isRecord(value)) return [`${owner}: invalid modifier overrides`]
  const definition = context.getStatus?.(statusId)
  if (!definition) return Object.entries(value).flatMap(([key, entry]) => [
    ...(COMBAT_MODIFIER_KEYS.includes(key as ModifierKey) ? [] : [`${owner}: unknown modifier override ${key}`]),
    ...(!isFiniteNumber(entry) ? [`${owner}: non-finite modifier override`] : []),
  ])
  const allowed = new Set(definition?.modifiers?.map((modifier) => modifier.key) ?? [])
  const errors = Object.entries(value).flatMap(([key, entry]) => [
    ...(COMBAT_MODIFIER_KEYS.includes(key as ModifierKey) ? [] : [`${owner}: unknown modifier override ${key}`]),
    ...(allowed.has(key as ModifierKey) ? [] : [`${owner}: modifier override ${key} is not defined by ${statusId}`]),
    ...(!isFiniteNumber(entry) ? [`${owner}: non-finite modifier override`] : []),
  ])
  if (definition?.stacking.mode === 'strongest' && definition.potencyKey && !Object.prototype.hasOwnProperty.call(value, definition.potencyKey)) errors.push(`${owner}: strongest override must include potency key ${definition.potencyKey}`)
  return errors
}

const validateCombatEffectInternal = (value: unknown, owner: string, context: CombatValidationContext, periodicDepth: number): string[] => {
  if (!isRecord(value) || typeof value.type !== 'string') return [`${owner}: invalid combat effect`]
  const errors: string[] = []
  if (value.type === 'deal-damage') {
    if (!isTarget(value.target)) errors.push(`${owner}: invalid target`)
    if (!Array.isArray(value.components) || value.components.length === 0) errors.push(`${owner}: damage Hit requires at least one component`)
    else value.components.forEach((component, index) => {
      if (!isRecord(component) || typeof component.damageType !== 'string' || !isDamageType(component.damageType)) errors.push(`${owner}.components[${index}]: invalid damage type`)
      errors.push(...validateMagnitude(isRecord(component) ? component.magnitude : undefined, `${owner}.components[${index}].magnitude`))
    })
    if (value.school !== undefined && !['fire', 'water', 'earth', 'air'].includes(String(value.school))) errors.push(`${owner}: invalid school`)
    if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every(isTag))) errors.push(`${owner}: invalid tags`)
    return errors
  }
  if (value.type === 'heal') {
    if (!isTarget(value.target)) errors.push(`${owner}: invalid target`)
    errors.push(...validateMagnitude(value.magnitude, `${owner}.magnitude`))
    if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every(isTag))) errors.push(`${owner}: invalid tags`)
    return errors
  }
  if (value.type === 'gain-barrier') {
    if (!isTarget(value.target)) errors.push(`${owner}: invalid target`)
    errors.push(...validateMagnitude(value.magnitude, `${owner}.magnitude`))
    if (value.mode !== undefined && value.mode !== 'add' && value.mode !== 'replace') errors.push(`${owner}: invalid Barrier mode`)
    if (value.durationMs !== undefined && value.durationMs !== null && (!isFiniteNumber(value.durationMs) || value.durationMs < 0)) errors.push(`${owner}: invalid Barrier duration`)
    if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every(isTag))) errors.push(`${owner}: invalid tags`)
    return errors
  }
  if (value.type === 'restore-resource' || value.type === 'drain-resource') {
    if (!isTarget(value.target) || value.resource !== 'mana') errors.push(`${owner}: invalid resource target`)
    errors.push(...validateMagnitude(value.magnitude, `${owner}.magnitude`))
    if (value.tags !== undefined && (!Array.isArray(value.tags) || !value.tags.every(isTag))) errors.push(`${owner}: invalid tags`)
    return errors
  }
  if (value.type === 'apply-status') {
    const validStatus = isStatusId(value.statusId, context)
    const isPeriodicStatus = context.isPeriodicStatus ? context.isPeriodicStatus(value.statusId as string) : true
    if (!isTarget(value.target) || !validStatus) errors.push(`${owner}: invalid status target/reference`)
    if (periodicDepth > 0 && validStatus && context.isPeriodicStatus && isPeriodicStatus) errors.push(`${owner}: nested periodic status spawning is not supported`)
    if (value.durationMs !== undefined && value.durationMs !== null && (!isFiniteNumber(value.durationMs) || value.durationMs <= 0)) errors.push(`${owner}: status duration must be positive and finite`)
    if (value.stacks !== undefined && (!Number.isInteger(value.stacks) || Number(value.stacks) < 1)) errors.push(`${owner}: invalid status stacks`)
    if (value.statusSourceKey !== undefined && typeof value.statusSourceKey !== 'string') errors.push(`${owner}: invalid status source key`)
    if (validStatus) errors.push(...validateStatusOverrides(value.statusId as StatusId, value.modifierOverrides, `${owner}.modifierOverrides`, context))
    if (value.periodicEffects !== undefined) {
      if (!Array.isArray(value.periodicEffects) || !validStatus || !isPeriodicStatus) errors.push(`${owner}: periodic override requires a periodic status`)
      else value.periodicEffects.forEach((effect, index) => errors.push(...validateCombatEffectInternal(effect, `${owner}.periodic[${index}]`, context, periodicDepth + 1)))
    }
    if (!isStringArray(value.tags, COMBAT_TAGS)) errors.push(`${owner}: invalid tags`)
    return errors
  }
  if (value.type === 'remove-status') {
    if (!isTarget(value.target) || !isStatusId(value.statusId, context)) errors.push(`${owner}: invalid status target/reference`)
    return errors
  }
  if (value.type === 'cleanse' || value.type === 'dispel') {
    if (!isTarget(value.target) || !['one', 'all', 'tag'].includes(String(value.mode)) || (value.tag !== undefined && !isTag(value.tag))) errors.push(`${owner}: invalid cleanse/dispel payload`)
    return errors
  }
  if (value.type === 'modify-action-timer') {
    if (!isTarget(value.target) || !isFiniteNumber(value.amountMs) || !['basic-attack', 'current'].includes(String(value.action))) errors.push(`${owner}: invalid action timer payload`)
    return errors
  }
  if (value.type === 'modify-cooldown') {
    if (!isTarget(value.target) || !isFiniteNumber(value.amountMs) || (value.spellId !== undefined && typeof value.spellId !== 'string')) errors.push(`${owner}: invalid cooldown payload`)
    return errors
  }
  if (value.type === 'set-action-pattern') {
    if (!isTarget(value.target) || typeof value.patternId !== 'string' || !value.patternId.trim()) errors.push(`${owner}: invalid action pattern payload`)
    return errors
  }
  return [`${owner}: unsupported combat effect type ${value.type}`]
}

export const validateCombatEffect = (value: unknown, owner = 'effect', context: CombatValidationContext = {}): string[] => validateCombatEffectInternal(value, owner, context, 0)

/** Validates an effect list in a periodic tick context, where spawning a new
 * periodic status would otherwise create an unsupported recursive tree. */
export const validatePeriodicEffectList = (value: unknown, owner = 'periodic', context: CombatValidationContext = {}): string[] => {
  if (!Array.isArray(value)) return [`${owner}: periodic effects must be an array`]
  return value.flatMap((effect, index) => validateCombatEffectInternal(effect, `${owner}[${index}]`, context, 1))
}

export const validateCombatTriggerRule = (value: unknown, owner = 'rule', context: CombatValidationContext = {}): string[] => {
  if (!isRecord(value)) return [`${owner}: invalid combat trigger rule`]
  const errors: string[] = []
  if (typeof value.id !== 'string' || !value.id.trim()) errors.push(`${owner}: rule id is required`)
  if (!COMBAT_TRIGGERS.includes(value.event as CombatTriggerRule['event'])) errors.push(`${owner}: invalid trigger event`)
  if (value.priority !== undefined && !isFiniteNumber(value.priority)) errors.push(`${owner}: priority must be finite`)
  if (value.cooldownMs !== undefined && (!isFiniteNumber(value.cooldownMs) || value.cooldownMs < 0)) errors.push(`${owner}: cooldown must be finite and non-negative`)
  if (value.chance !== undefined && (!isFiniteNumber(value.chance) || value.chance < 0 || value.chance > 1)) errors.push(`${owner}: chance must be between 0 and 1`)
  if (value.oncePerEncounter !== undefined && typeof value.oncePerEncounter !== 'boolean') errors.push(`${owner}: oncePerEncounter must be boolean`)
  if (value.condition !== undefined) errors.push(...validateCombatCondition(value.condition, `${owner}.condition`, context))
  if (!Array.isArray(value.effects) || value.effects.length === 0) errors.push(`${owner}: at least one effect is required`)
  else value.effects.forEach((effect, index) => errors.push(...validateCombatEffect(effect, `${owner}.effects[${index}]`, context)))
  return errors
}

export const validateCombatProvider = (provider: unknown, owner = 'provider', context: CombatValidationContext = {}): string[] => {
  if (provider === undefined) return []
  if (!isRecord(provider)) return [`${owner}: invalid combat provider`]
  const errors: string[] = []
  if (provider.modifiers !== undefined) {
    if (!Array.isArray(provider.modifiers)) errors.push(`${owner}.modifiers: expected an array`)
    else provider.modifiers.forEach((modifier, index) => errors.push(...validateCombatModifier(modifier, `${owner}.modifiers[${index}]`, context)))
  }
  if (provider.rules !== undefined) {
    if (!Array.isArray(provider.rules)) errors.push(`${owner}.rules: expected an array`)
    else {
      const seen = new Set<string>()
      provider.rules.forEach((rule, index) => {
        if (isRecord(rule) && typeof rule.id === 'string' && seen.has(rule.id)) errors.push(`${owner}: duplicate rule id ${rule.id}`)
        if (isRecord(rule) && typeof rule.id === 'string') seen.add(rule.id)
        errors.push(...validateCombatTriggerRule(rule, `${owner}.rules[${index}]`, context))
      })
    }
  }
  return errors
}

/** Defensive validator for runtime payloads restored from persisted saves. */
export const isPersistedCombatEffect = (value: unknown, context: CombatValidationContext = {}): value is CombatEffect => validateCombatEffect(value, 'effect', context).length === 0

/**
 * Converts the pre-Hit persisted damage payload once at the save boundary.
 * Authored content and runtime code only accept the component representation;
 * this keeps existing suspended status applications loadable without keeping
 * a second runtime payload format.
 */
export const normalizePersistedCombatEffect = (value: unknown, context: CombatValidationContext = {}): CombatEffect | undefined => {
  if (isPersistedCombatEffect(value, context)) return value
  if (!isRecord(value) || value.type !== 'deal-damage' || !isTarget(value.target) || !isDamageType(value.damageType)) return undefined
  const migrated: CombatEffect = {
    type: 'deal-damage',
    target: value.target,
    components: [{ damageType: value.damageType, magnitude: value.magnitude as never }],
    ...(value.school !== undefined ? { school: value.school as never } : {}),
    ...(Array.isArray(value.tags) ? { tags: value.tags as never } : {}),
  }
  return isPersistedCombatEffect(migrated, context) ? migrated : undefined
}

export const normalizePersistedPeriodicEffects = (value: unknown, statusId: StatusId, context: CombatValidationContext = {}) => {
  if (!context.isPeriodicStatus?.(statusId) || !Array.isArray(value)) return undefined
  const normalized = value.map((effect) => normalizePersistedCombatEffect(effect, context))
  if (!normalized.every((effect): effect is CombatEffect => Boolean(effect))) return undefined
  return validatePeriodicEffectList(normalized, 'periodic', context).length === 0 ? normalized : undefined
}

export const hasValidStatusModifierOverrides = (statusId: StatusId, value: unknown, context: CombatValidationContext = {}) => validateStatusOverrides(statusId, value, 'modifierOverrides', context).length === 0

function isTarget(value: unknown): value is 'self' | 'opponent' {
  return value === 'self' || value === 'opponent'
}
