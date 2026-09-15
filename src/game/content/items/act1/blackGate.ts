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
    buildTags: ['spell', 'hybrid', 'crit', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxHealth: 30, maxMana: 28, spellPower: 16, critChance: 0.05 },
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
    buildTags: ['spell', 'hybrid', 'focus', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxHealth: 24, maxMana: 34, spellPower: 18, maxFocus: 8 },
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
    buildTags: ['spell', 'hybrid', 'mana', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 50, maxMana: 38, maxFocus: 14, spellPower: 19 },
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
    buildTags: ['defense', 'hybrid', 'barrier', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 62, defense: 17, maxMana: 20, barrierPowerPct: 0.1, resistances: { fire: 0.08, water: 0.08, earth: 0.08, air: 0.08 } },
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
    buildTags: ['spell', 'hybrid', 'defense', 'focus'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 82, maxMana: 50, maxFocus: 18, defense: 20, spellPower: 23 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.12 }] },
    sellValue: 180,
  }, 'Black Gatekeeper'),
}
