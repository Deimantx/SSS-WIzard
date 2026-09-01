import type { CombatEffect, CombatTag, DamageType, ModifierKey, StatusId } from './combatTypes'
import { STATUS_DEFINITIONS } from '../../content/statuses'

const DAMAGE_TYPES: readonly DamageType[] = ['physical', 'arcane', 'fire', 'water', 'earth', 'air']
const TAGS: readonly CombatTag[] = ['basic-attack', 'spell', 'weapon', 'equipment', 'melee', 'ranged', 'magic', 'direct', 'heal', 'dot', 'hot', 'status', 'special', 'trait', 'buff', 'debuff', 'control', 'barrier', ...DAMAGE_TYPES]
export const COMBAT_MODIFIER_KEYS: readonly ModifierKey[] = ['damage-dealt-percent', 'damage-taken-percent', 'basic-attack-damage-percent', 'basic-attack-speed-percent', 'action-speed-percent', 'spell-damage-percent', 'melee-damage-percent', 'ranged-damage-percent', 'healing-done-percent', 'healing-received-percent', 'barrier-power-percent', 'barrier-received-percent', 'mana-regen-percent', 'cooldown-recovery-percent', 'control-duration-received-percent', 'status-duration-dealt-percent', 'status-duration-received-percent', 'defense-flat', 'crit-chance', 'crit-damage', 'block-chance', 'damage-over-time-percent', 'resistance-percent']

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isTag = (value: unknown): value is CombatTag => typeof value === 'string' && TAGS.includes(value as CombatTag)
const isStatusId = (value: unknown): value is StatusId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(STATUS_DEFINITIONS, value)

const isMagnitude = (value: unknown) => {
  if (!isRecord(value) || typeof value.type !== 'string') return false
  if (value.type === 'flat' || value.type === 'source-max-health-percent' || value.type === 'target-max-health-percent' || value.type === 'source-basic-damage-percent' || value.type === 'target-missing-health-percent') return isFiniteNumber(value.value)
  if (value.type === 'spell-power') return isFiniteNumber(value.coefficient) && value.coefficient >= 0
  return value.type === 'school-level' && isFiniteNumber(value.base) && isFiniteNumber(value.perLevel) && ['fire', 'water', 'earth', 'air'].includes(String(value.school))
}

const isTarget = (value: unknown) => value === 'self' || value === 'opponent'
const isTags = (value: unknown) => value === undefined || Array.isArray(value) && value.every(isTag)
const isModifierOverrides = (value: unknown) => value === undefined || isRecord(value) && Object.entries(value).every(([key, entry]) => COMBAT_MODIFIER_KEYS.includes(key as ModifierKey) && isFiniteNumber(entry))

const isStatusModifierOverrides = (statusId: StatusId, value: unknown) => {
  if (!isModifierOverrides(value)) return false
  if (value === undefined) return true
  if (!isRecord(value)) return false
  const definition = STATUS_DEFINITIONS[statusId]
  const allowed = new Set(definition?.modifiers?.map((modifier) => modifier.key) ?? [])
  if (Object.keys(value).some((key) => !allowed.has(key as ModifierKey))) return false
  return definition?.stacking.mode !== 'strongest' || !definition.potencyKey || Object.prototype.hasOwnProperty.call(value, definition.potencyKey)
}

/** Defensive validator for runtime payloads restored from persisted saves. */
export const isPersistedCombatEffect = (value: unknown): value is CombatEffect => {
  if (!isRecord(value) || typeof value.type !== 'string') return false
  if (value.type === 'deal-damage') return isTarget(value.target) && DAMAGE_TYPES.includes(value.damageType as DamageType) && isMagnitude(value.magnitude) && isTags(value.tags) && (value.school === undefined || ['fire', 'water', 'earth', 'air'].includes(String(value.school)))
  if (value.type === 'heal') return isTarget(value.target) && isMagnitude(value.magnitude) && isTags(value.tags)
  if (value.type === 'gain-barrier') { const duration = value.durationMs; return isTarget(value.target) && isMagnitude(value.magnitude) && (value.mode === undefined || value.mode === 'add' || value.mode === 'replace') && (duration === undefined || duration === null || isFiniteNumber(duration) && duration >= 0) && isTags(value.tags) }
  if (value.type === 'restore-resource' || value.type === 'drain-resource') return isTarget(value.target) && String(value.resource) === 'mana' && isMagnitude(value.magnitude) && isTags(value.tags)
  if (value.type === 'apply-status') {
    const duration = value.durationMs
    const stacks = value.stacks
    if (!isTarget(value.target) || !isStatusId(value.statusId) || (duration !== undefined && duration !== null && (!isFiniteNumber(duration) || duration <= 0)) || (stacks !== undefined && (!isFiniteNumber(stacks) || stacks < 1)) || (value.statusSourceKey !== undefined && typeof value.statusSourceKey !== 'string') || !isStatusModifierOverrides(value.statusId, value.modifierOverrides) || !isTags(value.tags)) return false
    // Nested periodic overrides would make a restored payload recursive. The
    // authored definition is the safe fallback for that instance instead.
    return value.periodicEffects === undefined || STATUS_DEFINITIONS[value.statusId]?.periodic !== undefined && Array.isArray(value.periodicEffects) && value.periodicEffects.every(isPersistedCombatEffect) && !value.periodicEffects.some((effect) => effect.type === 'apply-status' && effect.periodicEffects !== undefined)
  }
  if (value.type === 'remove-status') return isTarget(value.target) && isStatusId(value.statusId)
  if (value.type === 'cleanse' || value.type === 'dispel') return isTarget(value.target) && (value.mode === 'one' || value.mode === 'all' || value.mode === 'tag') && (value.tag === undefined || isTag(value.tag))
  if (value.type === 'modify-action-timer') return isTarget(value.target) && isFiniteNumber(value.amountMs) && (value.action === 'basic-attack' || value.action === 'current')
  if (value.type === 'modify-cooldown') return isTarget(value.target) && isFiniteNumber(value.amountMs) && (value.spellId === undefined || typeof value.spellId === 'string')
  if (value.type === 'set-action-pattern') return isTarget(value.target) && typeof value.patternId === 'string' && value.patternId.trim().length > 0
  return false
}

export const normalizePersistedPeriodicEffects = (value: unknown, statusId: StatusId) => {
  const definition = STATUS_DEFINITIONS[statusId]
  if (!definition?.periodic || !Array.isArray(value)) return undefined
  // A persisted override is one atomic payload. Mixing valid and malformed
  // entries would silently change authored behavior, so fall back as a whole.
  return value.every(isPersistedCombatEffect) ? value as CombatEffect[] : undefined
}

export const hasValidStatusModifierOverrides = (statusId: StatusId, value: unknown) => isStatusModifierOverrides(statusId, value)
