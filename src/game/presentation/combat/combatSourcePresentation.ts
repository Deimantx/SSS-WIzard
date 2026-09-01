import { ITEMS } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { getTraitDefinitions } from '../../content/traits'
import type { CombatLogEntry, CombatSource } from '../../systems/combat/combatTypes'

const unknownSource = (kind?: CombatSource['kind']) => kind === 'equipment' || kind === 'weapon' ? 'Equipment Effect' : kind === 'action' ? 'Enemy Action' : kind === 'status' ? 'Status Effect' : 'Unknown Source'

/** Resolves authored source metadata without exposing internal IDs to players. */
export const resolveCombatSourceLabel = (source: Pick<CombatSource, 'kind' | 'sourceId' | 'originSourceId' | 'originSourceKind' | 'sourceMonsterId' | 'originMonsterId'>): string => {
  const id = source.sourceId
  if (source.kind === 'status' && source.originSourceId && source.originSourceKind) return resolveCombatSourceLabel({ kind: source.originSourceKind, sourceId: source.originSourceId })
  if (source.kind === 'status' && source.originSourceId) {
    const origin = source.originSourceId
    if (SPELLS[origin as keyof typeof SPELLS]) return SPELLS[origin as keyof typeof SPELLS].name
    if (ITEMS[origin as keyof typeof ITEMS]) return ITEMS[origin as keyof typeof ITEMS].name
    if (getTraitDefinitions([origin])[0]) return getTraitDefinitions([origin])[0].name
  }
  if (source.kind === 'action' && source.sourceId && source.sourceMonsterId) return MONSTERS[source.sourceMonsterId]?.actions[source.sourceId]?.name ?? 'Enemy Action'
  if (source.kind === 'spell' && id) return SPELLS[id as keyof typeof SPELLS]?.name ?? 'Unknown Spell'
  if ((source.kind === 'equipment' || source.kind === 'weapon') && id) return ITEMS[id as keyof typeof ITEMS]?.name ?? 'Equipment Effect'
  if (source.kind === 'trait' && id) return getTraitDefinitions([id])[0]?.name ?? 'Trait Effect'
  if (source.kind === 'action' && id) {
    const action = Object.values(MONSTERS).map((monster) => monster.actions[id]).find(Boolean)
    return action?.name ?? 'Enemy Action'
  }
  if (source.kind === 'status' && id) return STATUS_DEFINITIONS[id as keyof typeof STATUS_DEFINITIONS]?.name ?? 'Status Effect'
  if (source.kind === 'basic-attack') return 'Basic Attack'
  return unknownSource(source.kind)
}

/** Resolves the original authored source for a status-derived combat event. */
export const resolveCombatEventOriginLabel = (entry: CombatLogEntry): string | undefined => {
  const id = entry.originSourceId
  if (!id) return undefined
  if (entry.sourceKind === 'status') {
    if (entry.originSourceKind === 'spell' || (!entry.originSourceKind && entry.source.kind === 'player')) return SPELLS[id as keyof typeof SPELLS]?.name ?? 'Unknown Spell'
    if (entry.originSourceKind === 'equipment' || entry.originSourceKind === 'weapon') return ITEMS[id as keyof typeof ITEMS]?.name ?? 'Equipment Effect'
    if (entry.originSourceKind === 'trait') return getTraitDefinitions([id])[0]?.name ?? 'Trait Effect'
    if (entry.originSourceKind === 'action' || (!entry.originSourceKind && entry.source.kind === 'enemy')) {
      const monsterId = entry.originMonsterId ?? (entry.source.kind === 'enemy' ? entry.source.monsterId : entry.targetMonsterId)
      return monsterId ? MONSTERS[monsterId]?.actions[id]?.name ?? 'Enemy Action' : 'Enemy Action'
    }
  }
  if (entry.sourceKind === 'spell') return SPELLS[id as keyof typeof SPELLS]?.name ?? 'Unknown Spell'
  if (entry.sourceKind === 'trait') return getTraitDefinitions([id])[0]?.name ?? 'Trait Effect'
  if (entry.sourceKind === 'equipment' || entry.sourceKind === 'weapon') return ITEMS[id as keyof typeof ITEMS]?.name ?? 'Equipment Effect'
  if (entry.sourceKind === 'action' && entry.source.kind === 'enemy') return MONSTERS[entry.originMonsterId ?? entry.source.monsterId]?.actions[id]?.name ?? 'Enemy Action'
  return undefined
}
