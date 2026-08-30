import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { CombatActionDefinition, CombatEffect, CombatSource } from '../../systems/combat/combatTypes'
import { formatSpellMagnitude } from '../spells/spellEffectTooltipModel'
import { formatTime } from '../../utils'

export interface CombatEffectPresentation {
  label: string
  detail: string
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
  if (effect.type === 'deal-damage') return { label: `${formatSpellMagnitude(effect.magnitude)} ${capitalize(effect.damageType)} Damage`, detail: `Target · ${target}` }
  if (effect.type === 'heal') return { label: `Heal ${formatSpellMagnitude(effect.magnitude)}`, detail: `Target · ${target}` }
  if (effect.type === 'gain-barrier') return { label: `Gain ${formatSpellMagnitude(effect.magnitude)} Barrier`, detail: `${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} · ${target}${effect.durationMs ? ` · ${formatTime(effect.durationMs)}` : ''}` }
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const duration = effect.durationMs === undefined ? status?.defaultDurationMs : effect.durationMs
    return { label: `Applies ${status?.name ?? capitalize(effect.statusId)}`, detail: `Target · ${target}${duration === null || duration === undefined ? '' : ` · ${formatTime(duration)}`}` }
  }
  if (effect.type === 'modify-action-timer') return { label: `${effect.action === 'basic-attack' ? 'Basic Attack' : 'Current Action'} ${effect.amountMs >= 0 ? 'delayed' : 'accelerated'}`, detail: `${Math.abs(effect.amountMs) / 1000}s · ${target}` }
  if (effect.type === 'restore-resource' || effect.type === 'drain-resource') return { label: `${effect.type === 'restore-resource' ? 'Restore' : 'Drain'} ${formatSpellMagnitude(effect.magnitude)} ${capitalize(effect.resource)}`, detail: `Target · ${target}` }
  if (effect.type === 'remove-status' || effect.type === 'cleanse' || effect.type === 'dispel') return { label: capitalize(effect.type.replace(/-/g, ' ')), detail: `Target · ${target}` }
  if (effect.type === 'modify-cooldown') return { label: `${effect.amountMs >= 0 ? 'Delay' : 'Reduce'} Spell Cooldown`, detail: `${Math.abs(effect.amountMs) / 1000}s · ${target}` }
  return { label: 'Changes Action Pattern', detail: 'Target · Enemy' }
}

export const buildCombatActionPresentation = (action: CombatActionDefinition, source: CombatSource = { actor: 'enemy', kind: 'action' }): CombatActionPresentation => ({ id: action.id, name: action.name, description: action.description, telegraphMs: action.telegraphMs, recoveryMs: action.recoveryMs, effects: action.effects.map((effect) => formatCombatEffect(effect, source)) })
