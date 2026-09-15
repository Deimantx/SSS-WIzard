import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Hall of Unbound Names — normal and boss Equipment. */
export const HALL_OF_UNBOUND_NAMES_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Hall of Unbound Names. */
  'nameless-ring': combatEquipment({
    id: 'nameless-ring',
    name: 'Nameless Ring',
    description: 'Nameless Ring carries the signature of Hall of Unbound Names.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Hall of Unbound Names'),

  /** Normal drop — Hall of Unbound Names. */
  'whisper-earring': combatEquipment({
    id: 'whisper-earring',
    name: 'Whisper Earring',
    description: 'Whisper Earring carries the signature of Hall of Unbound Names.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Hall of Unbound Names'),

  /** Normal drop — Hall of Unbound Names. */
  'unbound-seal-pendant': combatEquipment({
    id: 'unbound-seal-pendant',
    name: 'Unbound Seal Pendant',
    description: 'Unbound Seal Pendant carries the signature of Hall of Unbound Names.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.7,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
    sellValue: 180,
  }, 'Hall of Unbound Names'),

  /** Boss drop — Unspoken Prelate. */
  'prelates-unspoken-seal': combatEquipment({
    id: 'prelates-unspoken-seal',
    name: "Prelate's Unspoken Seal",
    description: "Prelate's Unspoken Seal carries the signature of Unspoken Prelate.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.7,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Unspoken Prelate'),
}
