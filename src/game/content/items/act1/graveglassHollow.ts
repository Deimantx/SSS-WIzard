import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Graveglass Hollow — normal and boss Equipment. */
export const GRAVEGLASS_HOLLOW_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Graveglass Hollow. */
  'graveglass-earring': combatEquipment({
    id: 'graveglass-earring',
    name: 'Graveglass Earring',
    description: 'Graveglass Earring carries the signature of Graveglass Hollow.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Graveglass Hollow'),

  /** Normal drop — Graveglass Hollow. */
  'shardbone-ring': combatEquipment({
    id: 'shardbone-ring',
    name: 'Shardbone Ring',
    description: 'Shardbone Ring carries the signature of Graveglass Hollow.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Graveglass Hollow'),

  /** Normal drop — Graveglass Hollow. */
  'mourner-veil-mantle': combatEquipment({
    id: 'mourner-veil-mantle',
    name: 'Mourner Veil Mantle',
    description: 'Mourner Veil Mantle carries the signature of Graveglass Hollow.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 48, defense: 12 },
    sellValue: 180,
  }, 'Graveglass Hollow'),

  /** Boss drop — Graveglass Behemoth. */
  'behemoth-heartshard': combatEquipment({
    id: 'behemoth-heartshard',
    name: 'Behemoth Heartshard',
    description: 'Behemoth Heartshard carries the signature of Graveglass Behemoth.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Graveglass Behemoth'),
}
