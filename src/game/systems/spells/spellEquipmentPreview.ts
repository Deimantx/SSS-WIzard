import { ITEMS } from '../../content/items/items'
import { SPELLS } from '../../content/spells/spells'
import type { GameState, ItemId, SchoolId, SpellId } from '../../types'

export interface SpellEquipmentModifier {
  itemId: ItemId
  itemName: string
  stat: 'spell-damage' | 'barrier'
  label: string
  value: number
}

export interface SpellEquipmentBonusPreview {
  current: SpellEquipmentModifier[]
  totalPercent: number
  future: string[]
}

type SpellDamageStat = 'fireSpellDamagePct' | 'earthSpellDamagePct' | 'airSpellDamagePct'

const statForSchool = (school: SchoolId): SpellDamageStat | 'waterBarrierPct' | null => {
  if (school === 'water') return 'waterBarrierPct'
  if (school === 'fire' || school === 'earth' || school === 'air') return `${school}SpellDamagePct` as SpellDamageStat
  return null
}

/** Reads the same authored item stats used by runtime equipment calculations. */
export const getSpellEquipmentBonusPreview = (state: Pick<GameState, 'equipment'>, spellId: SpellId): SpellEquipmentBonusPreview => {
  const spell = SPELLS[spellId]
  if (!spell) return { current: [], totalPercent: 0, future: [] }
  const statKey = statForSchool(spell.school)
  if (!statKey) return { current: [], totalPercent: 0, future: [] }
  const affectsDamage = spell.effects.some((effect) => effect.type === 'deal-damage' && (effect.school ?? effect.damageType) === spell.school)
  const affectsBarrier = spell.effects.some((effect) => effect.type === 'gain-barrier')
  const appliesModifier = statKey === 'waterBarrierPct' ? affectsBarrier : affectsDamage
  const current: SpellEquipmentModifier[] = []
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId) return
    const item = ITEMS[itemId]
    const value = item?.stats?.[statKey]
    if (!item || !statKey || !appliesModifier || typeof value !== 'number' || value === 0) return
    const isBarrier = statKey === 'waterBarrierPct'
    current.push({ itemId, itemName: item.name, stat: isBarrier ? 'barrier' : 'spell-damage', label: isBarrier ? 'Water Barrier' : `${spell.school[0].toUpperCase()}${spell.school.slice(1)} Spell Damage`, value })
  })
  return {
    current,
    totalPercent: current.reduce((sum, modifier) => sum + modifier.value, 0),
    future: ['Additional school-specific equipment modifiers will appear here when authored.'],
  }
}
