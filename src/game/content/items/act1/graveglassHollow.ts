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
    buildTags: ['spell', 'crit', 'dot', 'status'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxHealth: 12, maxMana: 16, spellPower: 15, critChance: 0.05, damageOverTimePct: 0.08 },
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
    buildTags: ['spell', 'crit', 'dot', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxHealth: 10, maxMana: 14, spellPower: 13, critChance: 0.07, critDamage: 0.14 },
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
    buildTags: ['defense', 'crit', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 30, defense: 7, critChance: 0.04 },
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
    buildTags: ['spell', 'crit', 'dot', 'status'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 44, maxMana: 24, spellPower: 20, critChance: 0.08, damageOverTimePct: 0.12 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.1, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] },
    sellValue: 180,
  }, 'Graveglass Behemoth'),
}
