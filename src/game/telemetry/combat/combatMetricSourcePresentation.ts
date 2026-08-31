import { MONSTERS } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { getTraitDefinition } from '../../content/traits'
import type { CombatMetricSourceContribution } from './combatTelemetryTypes'

export type CombatMetricSourceIcon = 'swords' | 'sparkles' | 'flame' | 'shield' | 'heart' | 'activity'
export type CombatMetricSourceAccent = 'damage' | 'healing' | 'taken' | 'fire' | 'water' | 'earth' | 'air' | 'enemy' | 'status' | 'trait' | 'neutral'

export interface CombatMetricSourcePresentation {
  name: string
  subtitle: string
  icon: CombatMetricSourceIcon
  accent: CombatMetricSourceAccent
}

export const presentCombatMetricSource = (source: CombatMetricSourceContribution): CombatMetricSourcePresentation => {
  if (source.kind === 'spell') {
    const spell = source.spellId ? SPELLS[source.spellId] : undefined
    return spell ? { name: spell.name, subtitle: '', icon: 'sparkles', accent: spell.school } : { name: 'Unknown Spell', subtitle: '', icon: 'sparkles', accent: 'neutral' }
  }
  if (source.kind === 'basic-attack') return { name: 'Basic Attack', subtitle: source.monsterId ? MONSTERS[source.monsterId]?.name ?? 'Enemy' : 'Equipped weapon', icon: 'swords', accent: source.actor === 'enemy' ? 'enemy' : 'damage' }
  if (source.kind === 'action') {
    const action = source.monsterId && source.actionId ? MONSTERS[source.monsterId]?.actions[source.actionId] : undefined
    return action ? { name: action.name, subtitle: source.monsterId ? MONSTERS[source.monsterId]?.name ?? 'Enemy Action' : 'Enemy Action', icon: 'swords', accent: 'enemy' } : { name: 'Unknown Action', subtitle: 'Enemy Action', icon: 'swords', accent: 'neutral' }
  }
  if (source.kind === 'status') {
    const status = source.statusId ? STATUS_DEFINITIONS[source.statusId] : undefined
    return status ? { name: status.name, subtitle: 'Status effect', icon: 'flame', accent: status.classification === 'buff' ? 'healing' : 'status' } : { name: 'Unknown Status', subtitle: 'Status effect', icon: 'flame', accent: 'neutral' }
  }
  if (source.kind === 'trait') {
    const trait = source.traitId ? getTraitDefinition(source.traitId) : undefined
    return trait ? { name: trait.name, subtitle: source.monsterId ? MONSTERS[source.monsterId]?.name ?? 'Trait' : 'Trait', icon: 'activity', accent: 'trait' } : { name: 'Trait Effect', subtitle: 'Trait', icon: 'activity', accent: 'trait' }
  }
  return { name: 'Unknown Effect', subtitle: 'Combat effect', icon: 'activity', accent: 'neutral' }
}
