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
    buildTags: ['spell', 'status', 'dot', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxHealth: 24, maxMana: 16, spellPower: 15, statusDurationPct: 0.1 },
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
    buildTags: ['spell', 'status', 'dot', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxHealth: 20, maxMana: 18, spellPower: 16, statusDurationPct: 0.14 },
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
    buildTags: ['spell', 'status', 'dot', 'focus'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 38, maxMana: 26, spellPower: 16, maxFocus: 8, statusDurationPct: 0.18 },
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
    buildTags: ['spell', 'status', 'dot', 'focus'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 56, maxMana: 36, maxFocus: 10, spellPower: 21, statusDurationPct: 0.2 },
    combat: { modifiers: [{ key: 'status-duration-dealt-percent', value: 0.12, statusTags: ['debuff'] }] },
    sellValue: 180,
  }, 'Unspoken Prelate'),
}
