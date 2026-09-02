import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { MonsterDefinition } from '../../content/monsters'
import type { CombatActionDefinition, CombatEffect, CombatSource, DamageType } from '../../systems/combat/combatTypes'
import { scaleMagnitude, type Magnitude } from '../../systems/combat/combatTypes'
import { formatSpellMagnitude } from '../spells/spellEffectTooltipModel'
import { formatTime } from '../../utils'

export type CombatEffectPresentationKind = 'damage' | 'heal' | 'barrier' | 'status' | 'control' | 'resource' | 'cooldown' | 'pattern'
export type CombatEffectPresentationTone = 'damage' | 'heal' | 'barrier' | 'control' | 'dot' | 'buff' | 'debuff' | 'utility'

export interface CombatEffectPresentation {
  kind: CombatEffectPresentationKind
  tone: CombatEffectPresentationTone
  label: string
  value?: string
  detail?: string
  /** Current authored base amount when a Monster context is available. */
  basePreview?: string
  /** Human-readable source coefficient for the authored base amount. */
  scalingLabel?: string
  /** Total authored DoT amount, distinct from the per-tick chip value. */
  totalBasePreview?: string
  damageType?: DamageType
  damageTypes?: DamageType[]
  statusId?: string
  targetLabel?: string
  timeLabel?: string
}

export interface CombatActionPresentation {
  id: string
  name: string
  description: string
  actionTimeMs: number
  effects: CombatEffectPresentation[]
}

const capitalize = (value: string) => `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`
const actorLabel = (source: CombatSource, target: 'self' | 'opponent') => {
  const actor = target === 'self' ? source.actor : source.actor === 'player' ? 'enemy' : 'player'
  return actor === 'player' ? 'Player' : 'Enemy'
}

const formatPreviewValue = (value: number) => {
  const rounded = Math.round((value + 1e-9) * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1)
}
const formatCoefficient = (value: number) => formatPreviewValue(value * 100)

/** Resolves only Monster-independent base previews; it never invents a target or live GameState. */
export const resolveMonsterBaseMagnitudePreview = (monster: MonsterDefinition, magnitude: Magnitude): number | null => {
  if (magnitude.type === 'flat') return magnitude.value
  if (magnitude.type === 'source-basic-damage-percent') return monster.basicAttackDamage * magnitude.value
  if (magnitude.type === 'source-max-health-percent') return monster.maxHealth * magnitude.value
  return null
}

export const formatMonsterScalingLabel = (magnitude: Magnitude) => {
  if (magnitude.type === 'source-basic-damage-percent') return `${formatCoefficient(magnitude.value)}% Basic Attack Damage`
  if (magnitude.type === 'source-max-health-percent') return `${formatCoefficient(magnitude.value)}% Max Health`
  return undefined
}

/** Classifies authored effects for scan-level UI without inspecting action IDs or prose. */
export const getCombatEffectPresentationTone = (effect: CombatEffect): CombatEffectPresentationTone => {
  if (effect.type === 'deal-damage') return effect.tags?.includes('dot') ? 'dot' : 'damage'
  if (effect.type === 'heal') return 'heal'
  if (effect.type === 'gain-barrier') return 'barrier'
  if (effect.type === 'modify-action-timer') return 'control'
  if (effect.type === 'apply-status') {
    const tags = [...(effect.tags ?? []), ...(STATUS_DEFINITIONS[effect.statusId]?.tags ?? [])]
    if (tags.includes('control')) return 'control'
    if (tags.includes('dot') || effect.periodicEffects?.some((periodicEffect) => periodicEffect.type === 'deal-damage' || ('tags' in periodicEffect && periodicEffect.tags?.includes('dot')))) return 'dot'
    if (tags.includes('buff')) return 'buff'
    if (tags.includes('debuff')) return 'debuff'
    return 'utility'
  }
  if (effect.type === 'remove-status' || effect.type === 'cleanse' || effect.type === 'dispel') return 'control'
  return 'utility'
}

export interface CombatActionPresentationOptions {
  monster?: MonsterDefinition
}

export const formatCombatEffect = (effect: CombatEffect, source: CombatSource, options: CombatActionPresentationOptions = {}): CombatEffectPresentation => {
  const target = actorLabel(source, effect.target)
  const tone = getCombatEffectPresentationTone(effect)
  if (effect.type === 'deal-damage') {
    const components = effect.components
    const damageTypes = [...new Set(components.map((component) => component.damageType))]
    const previews = options.monster ? components.map((component) => resolveMonsterBaseMagnitudePreview(options.monster!, component.magnitude)) : []
    const preview = previews.length > 0 && previews.every((value): value is number => value !== null) ? previews.reduce((sum, value) => sum + value, 0) : null
    const value = preview === null ? components.map((component) => `${capitalize(component.damageType)} ${formatSpellMagnitude(component.magnitude)}`).join(' + ') : formatPreviewValue(preview)
    const scalingLabel = options.monster ? components.map((component) => formatMonsterScalingLabel(component.magnitude)).filter(Boolean).join(' + ') || undefined : undefined
    return { kind: 'damage', tone, label: damageTypes.length === 1 ? `${capitalize(damageTypes[0])} Damage` : 'Split Damage', value, basePreview: preview === null ? undefined : formatPreviewValue(preview), scalingLabel, detail: `Target: ${target}`, damageType: damageTypes.length === 1 ? damageTypes[0] : undefined, damageTypes, targetLabel: target }
  }
  if (effect.type === 'heal') {
    const preview = options.monster ? resolveMonsterBaseMagnitudePreview(options.monster, effect.magnitude) : null
    return { kind: 'heal', tone, label: 'Heal', value: preview === null ? formatSpellMagnitude(effect.magnitude) : formatPreviewValue(Math.round(preview)), basePreview: preview === null ? undefined : formatPreviewValue(Math.round(preview)), scalingLabel: options.monster ? formatMonsterScalingLabel(effect.magnitude) : undefined, detail: `Target: ${target}`, targetLabel: target }
  }
  if (effect.type === 'gain-barrier') {
    const preview = options.monster ? resolveMonsterBaseMagnitudePreview(options.monster, effect.magnitude) : null
    return { kind: 'barrier', tone, label: 'Barrier', value: preview === null ? formatSpellMagnitude(effect.magnitude) : formatPreviewValue(Math.round(preview)), basePreview: preview === null ? undefined : formatPreviewValue(Math.round(preview)), scalingLabel: options.monster ? formatMonsterScalingLabel(effect.magnitude) : undefined, detail: `${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} ${target}`, targetLabel: target, timeLabel: effect.durationMs ? formatTime(effect.durationMs) : undefined }
  }
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const duration = effect.durationMs === undefined ? status?.defaultDurationMs : effect.durationMs
    const periodic = effect.periodicEffects ?? status?.periodic?.effects
    const periodicDamage = periodic?.find((entry) => entry.type === 'deal-damage')
    const intervalMs = status?.periodic?.intervalMs
    const tickCount = duration !== null && duration !== undefined && intervalMs ? Math.floor(duration / intervalMs) : 0
    const tickComponent = periodicDamage?.components[0]
    const totalMagnitude = tickComponent && tickCount > 0 ? scaleMagnitude(tickComponent.magnitude, tickCount) : undefined
    const tickPreview = options.monster && tickComponent ? resolveMonsterBaseMagnitudePreview(options.monster, tickComponent.magnitude) : null
    const totalPreview = options.monster && totalMagnitude ? resolveMonsterBaseMagnitudePreview(options.monster, totalMagnitude) : null
    const value = periodicDamage?.type === 'deal-damage' && tickComponent && intervalMs
      ? `${tickPreview === null ? formatSpellMagnitude(tickComponent.magnitude) : formatPreviewValue(tickPreview)} / ${formatTime(intervalMs)}`
      : undefined
    const scalingLabel = options.monster && totalMagnitude ? formatMonsterScalingLabel(totalMagnitude) : undefined
    const totalBasePreview = totalPreview === null || !periodicDamage || periodicDamage.type !== 'deal-damage' || !tickComponent ? undefined : `${formatPreviewValue(totalPreview)} ${capitalize(tickComponent.damageType)}`
    return { kind: 'status', tone, label: `Applies ${status?.name ?? capitalize(effect.statusId)}`, value, scalingLabel, totalBasePreview, detail: `Target: ${target}`, damageType: periodicDamage?.type === 'deal-damage' && tickComponent ? tickComponent.damageType : undefined, statusId: effect.statusId, targetLabel: target, timeLabel: duration === null || duration === undefined ? undefined : formatTime(duration) }
  }
  if (effect.type === 'modify-action-timer') return { kind: 'control', tone, label: effect.action === 'basic-attack' ? 'Basic Attack' : 'Current Action', value: `${effect.amountMs >= 0 ? '+' : '-'}${Math.abs(effect.amountMs) / 1000}s`, detail: effect.amountMs >= 0 ? `Delayed: ${target}` : `Accelerated: ${target}`, targetLabel: target, timeLabel: `${Math.abs(effect.amountMs) / 1000}s` }
  if (effect.type === 'restore-resource' || effect.type === 'drain-resource') return { kind: 'resource', tone, label: `${effect.type === 'restore-resource' ? 'Restore' : 'Drain'} ${capitalize(effect.resource)}`, value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'remove-status' || effect.type === 'cleanse' || effect.type === 'dispel') return { kind: 'control', tone, label: capitalize(effect.type.replace(/-/g, ' ')), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'modify-cooldown') return { kind: 'cooldown', tone, label: effect.amountMs >= 0 ? 'Delay Spell Cooldown' : 'Reduce Spell Cooldown', value: `${Math.abs(effect.amountMs) / 1000}s`, detail: `Target: ${target}`, targetLabel: target, timeLabel: `${Math.abs(effect.amountMs) / 1000}s` }
  return { kind: 'pattern', tone, label: 'Action Pattern', detail: 'Changes the enemy sequence', targetLabel: target }
}

export const buildCombatActionPresentation = (action: CombatActionDefinition, source: CombatSource = { actor: 'enemy', kind: 'action' }, options: CombatActionPresentationOptions = {}): CombatActionPresentation => ({ id: action.id, name: action.name, description: action.description, actionTimeMs: action.actionTimeMs, effects: action.effects.map((effect) => formatCombatEffect(effect, source, options)) })
