import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { CombatActionDefinition, CombatEffect, CombatSource, DamageType } from '../../systems/combat/combatTypes'
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
  damageType?: DamageType
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

export const formatCombatEffect = (effect: CombatEffect, source: CombatSource): CombatEffectPresentation => {
  const target = actorLabel(source, effect.target)
  const tone = getCombatEffectPresentationTone(effect)
  if (effect.type === 'deal-damage') return { kind: 'damage', tone, label: `${capitalize(effect.damageType)} Damage`, value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, damageType: effect.damageType, targetLabel: target }
  if (effect.type === 'heal') return { kind: 'heal', tone, label: 'Heal', value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'gain-barrier') return { kind: 'barrier', tone, label: 'Barrier', value: formatSpellMagnitude(effect.magnitude), detail: `${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} ${target}`, targetLabel: target, timeLabel: effect.durationMs ? formatTime(effect.durationMs) : undefined }
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const duration = effect.durationMs === undefined ? status?.defaultDurationMs : effect.durationMs
    const periodic = effect.periodicEffects ?? status?.periodic?.effects
    const periodicDamage = periodic?.find((entry) => entry.type === 'deal-damage')
    const value = periodicDamage?.type === 'deal-damage' && periodicDamage.magnitude.type === 'flat' && status?.periodic
      ? `${formatSpellMagnitude(periodicDamage.magnitude)} / ${formatTime(status.periodic.intervalMs)}`
      : undefined
    return { kind: 'status', tone, label: `Applies ${status?.name ?? capitalize(effect.statusId)}`, value, detail: `Target: ${target}`, damageType: periodicDamage?.type === 'deal-damage' ? periodicDamage.damageType : undefined, statusId: effect.statusId, targetLabel: target, timeLabel: duration === null || duration === undefined ? undefined : formatTime(duration) }
  }
  if (effect.type === 'modify-action-timer') return { kind: 'control', tone, label: effect.action === 'basic-attack' ? 'Basic Attack' : 'Current Action', value: `${effect.amountMs >= 0 ? '+' : '-'}${Math.abs(effect.amountMs) / 1000}s`, detail: effect.amountMs >= 0 ? `Delayed: ${target}` : `Accelerated: ${target}`, targetLabel: target, timeLabel: `${Math.abs(effect.amountMs) / 1000}s` }
  if (effect.type === 'restore-resource' || effect.type === 'drain-resource') return { kind: 'resource', tone, label: `${effect.type === 'restore-resource' ? 'Restore' : 'Drain'} ${capitalize(effect.resource)}`, value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'remove-status' || effect.type === 'cleanse' || effect.type === 'dispel') return { kind: 'control', tone, label: capitalize(effect.type.replace(/-/g, ' ')), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'modify-cooldown') return { kind: 'cooldown', tone, label: effect.amountMs >= 0 ? 'Delay Spell Cooldown' : 'Reduce Spell Cooldown', value: `${Math.abs(effect.amountMs) / 1000}s`, detail: `Target: ${target}`, targetLabel: target, timeLabel: `${Math.abs(effect.amountMs) / 1000}s` }
  return { kind: 'pattern', tone, label: 'Action Pattern', detail: 'Changes the enemy sequence', targetLabel: target }
}

export const buildCombatActionPresentation = (action: CombatActionDefinition, source: CombatSource = { actor: 'enemy', kind: 'action' }): CombatActionPresentation => ({ id: action.id, name: action.name, description: action.description, actionTimeMs: action.actionTimeMs, effects: action.effects.map((effect) => formatCombatEffect(effect, source)) })
