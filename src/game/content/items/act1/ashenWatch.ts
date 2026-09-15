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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
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
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 48, defense: 12 },
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
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Flamebound Revenant'),
}
