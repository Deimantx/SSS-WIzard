import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Black Gate — normal and boss Equipment. */
export const BLACK_GATE_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Black Gate. */
  'gatebound-ring': combatEquipment({
    id: 'gatebound-ring',
    name: 'Gatebound Ring',
    description: 'Gatebound Ring carries the signature of Black Gate.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Normal drop — Black Gate. */
  'portal-echo-earring': combatEquipment({
    id: 'portal-echo-earring',
    name: 'Portal Echo Earring',
    description: 'Portal Echo Earring carries the signature of Black Gate.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Normal drop — Black Gate. */
  'blackgate-pendant': combatEquipment({
    id: 'blackgate-pendant',
    name: 'Blackgate Pendant',
    description: 'Blackgate Pendant carries the signature of Black Gate.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Normal drop — Black Gate. */
  'voidward-mantle': combatEquipment({
    id: 'voidward-mantle',
    name: 'Voidward Mantle',
    description: 'Voidward Mantle carries the signature of Black Gate.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 48, defense: 12 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Boss drop — Black Gatekeeper. */
  'black-gatekeepers-seal': combatEquipment({
    id: 'black-gatekeepers-seal',
    name: "Black Gatekeeper's Seal",
    description: "Black Gatekeeper's Seal carries the signature of Black Gatekeeper.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 3,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Black Gatekeeper'),
}
