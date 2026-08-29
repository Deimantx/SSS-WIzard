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

const statForSchool = (school: SchoolId) => school === 'water' ? 'waterBarrierPct' : `${school}SpellDamagePct` as 'fireSpellDamagePct' | 'earthSpellDamagePct' | 'airSpellDamagePct'

/** Reads the same authored item stats used by runtime equipment calculations. */
export const getSpellEquipmentBonusPreview = (state: Pick<GameState, 'equipment'>, spellId: SpellId): SpellEquipmentBonusPreview => {
  const spell = SPELLS[spellId]
  if (!spell) return { current: [], totalPercent: 0, future: [] }
  const statKey = statForSchool(spell.school)
  const isBarrier = spell.school === 'water'
  const current: SpellEquipmentModifier[] = []
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId) return
    const item = ITEMS[itemId]
    const value = item?.stats?.[statKey]
    if (!item || typeof value !== 'number' || value === 0) return
    current.push({ itemId, itemName: item.name, stat: isBarrier ? 'barrier' : 'spell-damage', label: isBarrier ? 'Water Barrier' : `${spell.school[0].toUpperCase()}${spell.school.slice(1)} Spell Damage`, value })
  })
  return {
    current,
    totalPercent: current.reduce((sum, modifier) => sum + modifier.value, 0),
    future: ['Additional school-specific equipment modifiers will appear here when authored.'],
  }
}
