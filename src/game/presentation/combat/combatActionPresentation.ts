import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { CombatActionDefinition, CombatEffect, CombatSource } from '../../systems/combat/combatTypes'
import { formatSpellMagnitude } from '../spells/spellEffectTooltipModel'
import { formatTime } from '../../utils'

export type CombatEffectPresentationKind = 'damage' | 'heal' | 'barrier' | 'status' | 'control' | 'resource' | 'cooldown' | 'pattern'

export interface CombatEffectPresentation {
  kind: CombatEffectPresentationKind
  label: string
  value?: string
  detail?: string
  damageType?: string
  statusId?: string
  targetLabel?: string
  timeLabel?: string
}

export interface CombatActionPresentation {
  id: string
  name: string
  description: string
  telegraphMs: number
  recoveryMs?: number
  effects: CombatEffectPresentation[]
}

const capitalize = (value: string) => `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}`
const actorLabel = (source: CombatSource, target: 'self' | 'opponent') => {
  const actor = target === 'self' ? source.actor : source.actor === 'player' ? 'enemy' : 'player'
  return actor === 'player' ? 'Player' : 'Enemy'
}

export const formatCombatEffect = (effect: CombatEffect, source: CombatSource): CombatEffectPresentation => {
  const target = actorLabel(source, effect.target)
  if (effect.type === 'deal-damage') return { kind: 'damage', label: `${capitalize(effect.damageType)} Damage`, value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, damageType: effect.damageType, targetLabel: target }
  if (effect.type === 'heal') return { kind: 'heal', label: 'Heal', value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'gain-barrier') return { kind: 'barrier', label: 'Barrier', value: formatSpellMagnitude(effect.magnitude), detail: `${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} ${target}`, targetLabel: target, timeLabel: effect.durationMs ? formatTime(effect.durationMs) : undefined }
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const duration = effect.durationMs === undefined ? status?.defaultDurationMs : effect.durationMs
    return { kind: 'status', label: `Applies ${status?.name ?? capitalize(effect.statusId)}`, detail: `Target: ${target}`, statusId: effect.statusId, targetLabel: target, timeLabel: duration === null || duration === undefined ? undefined : formatTime(duration) }
  }
  if (effect.type === 'modify-action-timer') return { kind: 'control', label: effect.action === 'basic-attack' ? 'Basic Attack' : 'Current Action', value: `${effect.amountMs >= 0 ? '+' : '-'}${Math.abs(effect.amountMs) / 1000}s`, detail: effect.amountMs >= 0 ? `Delayed: ${target}` : `Accelerated: ${target}`, targetLabel: target, timeLabel: `${Math.abs(effect.amountMs) / 1000}s` }
  if (effect.type === 'restore-resource' || effect.type === 'drain-resource') return { kind: 'resource', label: `${effect.type === 'restore-resource' ? 'Restore' : 'Drain'} ${capitalize(effect.resource)}`, value: formatSpellMagnitude(effect.magnitude), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'remove-status' || effect.type === 'cleanse' || effect.type === 'dispel') return { kind: 'control', label: capitalize(effect.type.replace(/-/g, ' ')), detail: `Target: ${target}`, targetLabel: target }
  if (effect.type === 'modify-cooldown') return { kind: 'cooldown', label: effect.amountMs >= 0 ? 'Delay Spell Cooldown' : 'Reduce Spell Cooldown', value: `${Math.abs(effect.amountMs) / 1000}s`, detail: `Target: ${target}`, targetLabel: target, timeLabel: `${Math.abs(effect.amountMs) / 1000}s` }
  return { kind: 'pattern', label: 'Action Pattern', detail: 'Changes the enemy sequence', targetLabel: target }
}

export const buildCombatActionPresentation = (action: CombatActionDefinition, source: CombatSource = { actor: 'enemy', kind: 'action' }): CombatActionPresentation => ({ id: action.id, name: action.name, description: action.description, telegraphMs: action.telegraphMs, recoveryMs: action.recoveryMs, effects: action.effects.map((effect) => formatCombatEffect(effect, source)) })
