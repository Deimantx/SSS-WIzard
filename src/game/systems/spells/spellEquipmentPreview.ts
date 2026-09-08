import { ITEMS } from '../../content/items/items'
import { SPELLS } from '../../content/spells/spells'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
import { getCombatModifierContributions, type CombatModifierState } from '../combat/modifiers'
import { getSpellCombatSource } from './spellSource'
import type { CombatSource, CombatTag, DamageType, ItemId, SpellId } from '../../types'
import { getSpellPowerBreakdown } from './spellPower'

export interface SpellEquipmentModifier {
  itemId: ItemId
  itemName: string
  stat: 'spell-power' | 'spell-damage' | 'barrier' | 'damage-over-time' | 'status-duration'
  label: string
  value: number
}

export interface SpellEquipmentBonusPreview {
  current: SpellEquipmentModifier[]
  totalPercent: number
  spellPower: number
  future: string[]
}

interface SpellEquipmentPreviewContext {
  source: CombatSource
  tags: CombatTag[]
  key: 'spell-damage-percent' | 'barrier-power-percent' | 'status-duration-dealt-percent'
  damageType?: DamageType
  statusTags?: CombatTag[]
  label: string
  stat: SpellEquipmentModifier['stat']
}

const unique = <T,>(values: T[]) => [...new Set(values)]
const relevantEffectContexts = (spellId: SpellId): SpellEquipmentPreviewContext[] => {
  const spell = SPELLS[spellId]
  return spell.effects.flatMap((effect): SpellEquipmentPreviewContext[] => {
    const source = getSpellCombatSource(spellId)
    if (effect.type === 'deal-damage') return effect.components.map((component) => ({ source, tags: unique([...(source.tags ?? []), ...(effect.tags ?? [])]), key: 'spell-damage-percent' as const, damageType: component.damageType, label: `${component.damageType[0].toUpperCase()}${component.damageType.slice(1)} Spell Damage`, stat: 'spell-damage' as const }))
    if (effect.type === 'gain-barrier') return [{ source, tags: unique([...(source.tags ?? []), ...(effect.tags ?? [])]), key: 'barrier-power-percent' as const, damageType: undefined, label: 'Barrier Power', stat: 'barrier' as const }]
    if (effect.type === 'apply-status') {
      const statusTags = STATUS_DEFINITIONS[effect.statusId]?.tags ?? []
      return [{ source, tags: [...(source.tags ?? [])], statusTags, key: 'status-duration-dealt-percent' as const, damageType: undefined, label: 'Status Duration', stat: 'status-duration' as const }]
    }
    return []
  })
}

/**
 * Compact inspector-only projection. The actual effect values use the
 * canonical effective Spell selectors; this list only names contributing
 * equipped providers for the expandable inspector section.
 */
export const getSpellEquipmentBonusPreview = (state: CombatModifierState, spellId: SpellId): SpellEquipmentBonusPreview => {
  const spell = SPELLS[spellId]
  if (!spell) return { current: [], totalPercent: 0, spellPower: 0, future: [] }
  const current: SpellEquipmentModifier[] = []
  relevantEffectContexts(spellId).forEach((context) => {
    const contributions = getCombatModifierContributions(state, 'player', context.key, { source: context.source, sourceTags: context.tags, damageType: context.damageType, statusTags: context.statusTags }, 'unconditional')
    contributions.filter((entry) => entry.sourceType === 'equipment' || entry.sourceType === 'artifact' || entry.sourceType === 'equipment-stats').forEach((entry) => {
      const itemId = entry.sourceId as ItemId | undefined
      if (!itemId || !ITEMS[itemId]) return
      if (current.some((existing) => existing.itemId === itemId && existing.stat === context.stat && existing.value === entry.value)) return
      current.push({ itemId, itemName: entry.sourceName ?? ITEMS[itemId].name, stat: context.stat, label: context.label, value: entry.value })
    })
  })
  const spellPower = getSpellPowerBreakdown(state).equipment
  return {
    current,
    totalPercent: current.reduce((sum, modifier) => sum + (modifier.stat === 'spell-power' ? 0 : modifier.value), 0),
    spellPower,
    future: [],
  }
}
