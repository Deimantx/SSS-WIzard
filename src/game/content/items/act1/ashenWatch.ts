import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Ashen Watch — normal and boss Equipment. */
export const ASHEN_WATCH_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Ashen Watch. */
  'cinderwire-earring': combatEquipment({
    id: 'cinderwire-earring',
    name: 'Cinderwire Earring',
    description: 'Cinderwire Earring carries the signature of Ashen Watch.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'fire', 'crit', 'dot'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 20, spellPower: 14, critChance: 0.03 },
    sellValue: 180,
  }, 'Ashen Watch'),

  /** Normal drop — Ashen Watch. */
  'ashbrand-ring': combatEquipment({
    id: 'ashbrand-ring',
    name: 'Ashbrand Ring',
    description: 'Ashbrand Ring carries the signature of Ashen Watch.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'fire', 'crit', 'basic-attack'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 14, spellPower: 11, critChance: 0.05, critDamage: 0.12 },
    sellValue: 180,
  }, 'Ashen Watch'),

  /** Normal drop — Ashen Watch. */
  'emberwatch-mantle': combatEquipment({
    id: 'emberwatch-mantle',
    name: 'Emberwatch Mantle',
    description: 'Emberwatch Mantle carries the signature of Ashen Watch.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['defense', 'fire', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 29, defense: 7, resistances: { fire: 0.06 } },
    sellValue: 180,
  }, 'Ashen Watch'),

  /** Boss drop — Flamebound Revenant. */
  'revenant-emberstone': combatEquipment({
    id: 'revenant-emberstone',
    name: 'Revenant Emberstone',
    description: 'Revenant Emberstone carries the signature of Flamebound Revenant.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 1.8,
    buildTags: ['spell', 'fire', 'crit', 'dot'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 46, maxMana: 26, spellPower: 17, critChance: 0.05 },
    combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, sourceKinds: ['spell'], damageTypes: ['fire'] }] },
    sellValue: 180,
  }, 'Flamebound Revenant'),
}
