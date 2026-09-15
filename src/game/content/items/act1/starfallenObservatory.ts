import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Starfallen Observatory — normal and boss Equipment. */
export const STARFALLEN_OBSERVATORY_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Starfallen Observatory. */
  'starfall-ring': combatEquipment({
    id: 'starfall-ring',
    name: 'Starfall Ring',
    description: 'Starfall Ring carries the signature of Starfallen Observatory.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Starfallen Observatory'),

  /** Normal drop — Starfallen Observatory. */
  'lenskeeper-earring': combatEquipment({
    id: 'lenskeeper-earring',
    name: 'Lenskeeper Earring',
    description: 'Lenskeeper Earring carries the signature of Starfallen Observatory.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Starfallen Observatory'),

  /** Normal drop — Starfallen Observatory. */
  'astral-pendant': combatEquipment({
    id: 'astral-pendant',
    name: 'Astral Pendant',
    description: 'Astral Pendant carries the signature of Starfallen Observatory.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 36, maxMana: 18 },
    sellValue: 180,
  }, 'Starfallen Observatory'),

  /** Boss drop — Fallen Astromancer. */
  'fallen-astromancer-lens': combatEquipment({
    id: 'fallen-astromancer-lens',
    name: 'Fallen Astromancer Lens',
    description: 'Fallen Astromancer Lens carries the signature of Fallen Astromancer.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Fallen Astromancer'),
}
