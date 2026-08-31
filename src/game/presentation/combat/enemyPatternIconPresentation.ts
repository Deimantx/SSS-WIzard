import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { ActionStep, CombatActionDefinition, CombatEffect } from '../../systems/combat/combatTypes'

export type EnemyPatternIconKind = 'basic-attack' | 'direct-damage' | 'dot-damage' | 'barrier' | 'heal' | 'buff' | 'debuff' | 'control' | 'resource' | 'multi-effect'

const hasTag = (effect: CombatEffect, tag: string) => (effect as { tags?: string[] }).tags?.includes(tag) ?? false
const isDotEffect = (effect: CombatEffect) => hasTag(effect, 'dot') || effect.type === 'apply-status' && Boolean(STATUS_DEFINITIONS[effect.statusId]?.tags.includes('dot'))
const isControlEffect = (effect: CombatEffect) => effect.type === 'modify-action-timer' || hasTag(effect, 'control') || effect.type === 'apply-status' && STATUS_DEFINITIONS[effect.statusId]?.tags.includes('control')
const isBuffEffect = (effect: CombatEffect) => effect.type === 'apply-status' && (effect.target === 'self' || hasTag(effect, 'buff') || STATUS_DEFINITIONS[effect.statusId]?.classification === 'buff')
const isDebuffEffect = (effect: CombatEffect) => effect.type === 'apply-status' && (effect.target === 'opponent' || hasTag(effect, 'debuff') || STATUS_DEFINITIONS[effect.statusId]?.classification === 'debuff')

/** Maps authored universal combat effects to a presentation-only pattern icon category. */
export function classifyEnemyActionPatternIcon(action: CombatActionDefinition): EnemyPatternIconKind {
  const effects = action.effects
  if (effects.some((effect) => effect.type === 'gain-barrier')) return 'barrier'
  if (effects.some((effect) => effect.type === 'heal') && !effects.some((effect) => effect.type === 'deal-damage')) return 'heal'
  if (effects.some((effect) => effect.type === 'deal-damage' && !isDotEffect(effect))) return 'direct-damage'
  if (effects.some(isDotEffect)) return 'dot-damage'
  if (effects.some(isControlEffect)) return 'control'
  if (effects.some(isBuffEffect)) return 'buff'
  if (effects.some(isDebuffEffect)) return 'debuff'
  if (effects.some((effect) => effect.type === 'restore-resource' || effect.type === 'drain-resource')) return 'resource'
  return 'multi-effect'
}

export function classifyEnemyPatternStep(step: ActionStep, action?: CombatActionDefinition): EnemyPatternIconKind {
  return step.type === 'basic' ? 'basic-attack' : action ? classifyEnemyActionPatternIcon(action) : 'multi-effect'
}
