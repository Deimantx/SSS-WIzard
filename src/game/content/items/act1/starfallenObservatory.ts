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
    buildTags: ['spell', 'mana', 'focus', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, maxFocus: 10, spellPower: 13, manaRegen: 2, focusEfficiencyPct: 0.08 },
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
    buildTags: ['spell', 'mana', 'focus', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 28, maxFocus: 8, spellPower: 15, focusEfficiencyPct: 0.06 },
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
    buildTags: ['spell', 'mana', 'focus', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 34, maxMana: 32, maxFocus: 14, spellPower: 13 },
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
    buildTags: ['spell', 'mana', 'focus', 'hybrid'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 50, maxMana: 44, maxFocus: 18, spellPower: 19 },
    combat: { modifiers: [{ key: 'mana-regen-percent', value: 0.1 }] },
    sellValue: 180,
  }, 'Fallen Astromancer'),
}
