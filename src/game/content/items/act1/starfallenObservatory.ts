import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Starfallen Observatory — normal and boss Equipment. */
export const STARFALLEN_OBSERVATORY_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Starfallen Observatory. */
  'starfall-ring': combatEquipment({
    id: 'starfall-ring',
    name: 'Starfall Ring',
    description: 'Starfall Ring reserves more Focus and makes each prepared channel more efficient.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['focus', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxFocus: 16, focusEfficiencyPct: 0.12 },
    sellValue: 180,
  }, 'Starfallen Observatory'),

  /** Normal drop — Starfallen Observatory. */
  'lenskeeper-earring': combatEquipment({
    id: 'lenskeeper-earring',
    name: 'Lenskeeper Earring',
    description: 'Lenskeeper Earring steadies the Observatory lens, giving spellcasters more power with shorter recoveries.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['spell'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 20, cooldownRecoveryPct: 0.07 },
    sellValue: 180,
  }, 'Starfallen Observatory'),

  /** Normal drop — Starfallen Observatory. */
  'astral-pendant': combatEquipment({
    id: 'astral-pendant',
    name: 'Astral Pendant',
    description: 'Astral Pendant stores a deep reserve of Mana and restores it steadily between volleys.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 2.2,
    buildTags: ['mana', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxMana: 42, manaRegen: 3 },
    sellValue: 180,
  }, 'Starfallen Observatory'),

  /** Boss drop — Fallen Astromancer. */
  'fallen-astromancer-lens': combatEquipment({
    id: 'fallen-astromancer-lens',
    name: 'Fallen Astromancer Lens',
    description: 'Fallen Astromancer Lens strengthens every school-neutral spell with a deep Mana reserve behind it.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 2.2,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { spellPower: 22, maxMana: 30 },
    combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.10, originSourceKinds: ['spell'] }] },
    sellValue: 180,
  }, 'Fallen Astromancer'),
}
