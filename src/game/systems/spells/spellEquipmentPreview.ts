import { ITEMS } from '../../content/items/items'
import { SPELLS } from '../../content/spells/spells'
import type { GameState, ItemId, SchoolId, SpellId } from '../../types'
import type { CombatModifier } from '../../systems/combat/combatTypes'

export interface SpellEquipmentModifier {
  itemId: ItemId
  itemName: string
  stat: 'spell-power' | 'spell-damage' | 'barrier'
  label: string
  value: number
}

export interface SpellEquipmentBonusPreview {
  current: SpellEquipmentModifier[]
  totalPercent: number
  spellPower: number
  future: string[]
}

const modifierForSpell = (modifier: CombatModifier, school: SchoolId, barrier: boolean) => {
  const expectedKey = barrier ? 'barrier-power-percent' : 'spell-damage-percent'
  return modifier.key === expectedKey
    && (!modifier.sourceKinds?.length || modifier.sourceKinds.includes('spell'))
    && (!modifier.damageTypes?.length || modifier.damageTypes.includes(school))
}

/** Reads the same authored item stats used by runtime equipment calculations. */
export const getSpellEquipmentBonusPreview = (state: Pick<GameState, 'equipment'>, spellId: SpellId): SpellEquipmentBonusPreview => {
  const spell = SPELLS[spellId]
  if (!spell) return { current: [], totalPercent: 0, spellPower: 0, future: [] }
  const affectsDamage = spell.effects.some((effect) => effect.type === 'deal-damage' && effect.components.some((component) => component.damageType === spell.school))
  const affectsBarrier = spell.effects.some((effect) => effect.type === 'gain-barrier')
  const appliesModifier = spell.school === 'water' ? affectsBarrier : affectsDamage
  const current: SpellEquipmentModifier[] = []
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId) return
    const item = ITEMS[itemId]
    if (!item || !appliesModifier) return
    const isBarrier = spell.school === 'water'
    const modifier = item.combat?.modifiers?.find((entry) => modifierForSpell(entry, spell.school, isBarrier))
    if (!modifier || modifier.value === 0) return
    current.push({ itemId, itemName: item.name, stat: isBarrier ? 'barrier' : 'spell-damage', label: isBarrier ? 'Water Barrier' : `${spell.school[0].toUpperCase()}${spell.school.slice(1)} Spell Damage`, value: modifier.value })
  })
  return {
    current,
    totalPercent: current.filter((modifier) => modifier.stat !== 'spell-power').reduce((sum, modifier) => sum + modifier.value, 0),
    spellPower: Object.values(state.equipment).reduce((sum, itemId) => sum + (itemId ? ITEMS[itemId]?.stats?.spellPower ?? 0 : 0), 0),
    future: ['Additional school-specific equipment modifiers will appear here when authored.'],
  }
}
