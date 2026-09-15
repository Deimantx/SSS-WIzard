import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Graveglass Hollow — normal and boss Equipment. */
export const GRAVEGLASS_HOLLOW_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Graveglass Hollow. */
  'graveglass-earring': combatEquipment({
    id: 'graveglass-earring',
    name: 'Graveglass Earring',
    description: 'Graveglass Earring feeds lingering curses with raw spell force and longer-lasting damage over time.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'dot'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 18, damageOverTimePct: 0.14 },
    sellValue: 180,
  }, 'Graveglass Hollow'),

  /** Normal drop — Graveglass Hollow. */
  'shardbone-ring': combatEquipment({
    id: 'shardbone-ring',
    name: 'Shardbone Ring',
    description: 'Shardbone Ring turns the Hollow\'s brittle remains into a focused engine for critical strikes.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['crit'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { critChance: 0.08, critDamage: 0.22 },
    sellValue: 180,
  }, 'Graveglass Hollow'),

  /** Normal drop — Graveglass Hollow. */
  'mourner-veil-mantle': combatEquipment({
    id: 'mourner-veil-mantle',
    name: 'Mourner Veil Mantle',
    description: 'Mourner Veil Mantle protects a healthy frame while blunting the duration of incoming debuffs.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['defense', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'cape',
    stats: { maxHealth: 42, defense: 8 },
    combat: { modifiers: [{ key: 'status-duration-received-percent', value: -0.12, statusTags: ['debuff'] }] },
    sellValue: 180,
  }, 'Graveglass Hollow'),

  /** Boss drop — Graveglass Behemoth. */
  'behemoth-heartshard': combatEquipment({
    id: 'behemoth-heartshard',
    name: 'Behemoth Heartshard',
    description: 'Behemoth Heartshard amplifies spell and critical force whenever the target is already burdened by a debuff.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.2,
    buildTags: ['spell', 'crit', 'status'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { spellPower: 22, critChance: 0.06 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.12, condition: { type: 'target-has-status-tag', tag: 'debuff' } }] },
    sellValue: 180,
  }, 'Graveglass Behemoth'),
}
