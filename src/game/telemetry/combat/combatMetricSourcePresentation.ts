import { MONSTERS } from '../../content/monsters'
import { ITEMS } from '../../content/items/items'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { CombatMetricSourceContribution } from './combatTelemetryTypes'
import { resolveCombatSourceLabel } from '../../presentation/combat/combatSourcePresentation'

export type CombatMetricSourceIcon = 'swords' | 'sparkles' | 'flame' | 'shield' | 'heart' | 'activity'
export type CombatMetricSourceAccent = 'damage' | 'healing' | 'taken' | 'fire' | 'water' | 'earth' | 'air' | 'enemy' | 'status' | 'trait' | 'equipment' | 'neutral'

export interface CombatMetricSourcePresentation {
  name: string
  subtitle: string
  icon: CombatMetricSourceIcon
  accent: CombatMetricSourceAccent
}

export const presentCombatMetricSource = (source: CombatMetricSourceContribution): CombatMetricSourcePresentation => {
  if (source.kind === 'spell') {
    const name = resolveCombatSourceLabel({ kind: 'spell', sourceId: source.spellId ?? source.sourceId })
    const spell = source.spellId ? SPELLS[source.spellId] : undefined
    return name !== 'Unknown Spell' ? { name, subtitle: '', icon: 'sparkles', accent: spell?.school ?? 'neutral' } : { name: 'Unknown Spell', subtitle: '', icon: 'sparkles', accent: 'neutral' }
  }
  if (source.kind === 'basic-attack') return { name: 'Basic Attack', subtitle: source.monsterId ? MONSTERS[source.monsterId]?.name ?? 'Enemy' : 'Equipped weapon', icon: 'swords', accent: source.actor === 'enemy' ? 'enemy' : 'damage' }
  if (source.kind === 'equipment') {
    const item = source.sourceId ? ITEMS[source.sourceId as keyof typeof ITEMS] : undefined
    const provider = source.providerInstanceKey ? ` · ${source.providerInstanceKey}` : ''
    return { name: item?.name ?? 'Equipment Effect', subtitle: `Equipment${provider}`, icon: 'activity', accent: 'equipment' }
  }
  if (source.kind === 'action') {
    const name = resolveCombatSourceLabel({ kind: 'action', sourceId: source.actionId ?? source.sourceId })
    return name !== 'Enemy Action' ? { name, subtitle: source.monsterId ? MONSTERS[source.monsterId]?.name ?? 'Enemy Action' : 'Enemy Action', icon: 'swords', accent: 'enemy' } : { name: 'Unknown Action', subtitle: 'Enemy Action', icon: 'swords', accent: 'neutral' }
  }
  if (source.kind === 'status') {
    const originName = source.originSourceId ? resolveCombatSourceLabel({ kind: source.originSourceKind ?? 'status', sourceId: source.originSourceId }) : undefined
    const status = source.statusId ? STATUS_DEFINITIONS[source.statusId] : undefined
    const name = status?.name ?? 'Unknown Status'
    return { name, subtitle: originName ? `${originName} · Status effect` : 'Status effect', icon: 'flame', accent: status?.classification === 'buff' ? 'healing' : status ? 'status' : 'neutral' }
  }
  if (source.kind === 'trait') {
    const name = resolveCombatSourceLabel({ kind: 'trait', sourceId: source.traitId ?? source.sourceId })
    return name !== 'Trait Effect' ? { name, subtitle: source.monsterId ? MONSTERS[source.monsterId]?.name ?? 'Trait' : 'Trait', icon: 'activity', accent: 'trait' } : { name: 'Trait Effect', subtitle: 'Trait', icon: 'activity', accent: 'trait' }
  }
  return { name: 'Unknown Effect', subtitle: 'Combat effect', icon: 'activity', accent: 'neutral' }
}
