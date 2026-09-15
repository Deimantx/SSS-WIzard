import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Rootscar Hollow — normal and boss Equipment. */
export const ROOTSCAR_HOLLOW_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Rootscar Hollow. */
  'briar-earring': combatEquipment({
    id: 'briar-earring',
    name: 'Briar Earring',
    description: 'Briar Earring carries the signature of Rootscar Hollow.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 30, spellPower: 16 },
    sellValue: 180,
  }, 'Rootscar Hollow'),

  /** Normal drop — Rootscar Hollow. */
  'rootbound-ring': combatEquipment({
    id: 'rootbound-ring',
    name: 'Rootbound Ring',
    description: 'Rootbound Ring carries the signature of Rootscar Hollow.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 24, manaRegen: 2 },
    sellValue: 180,
  }, 'Rootscar Hollow'),

  /** Normal drop — Rootscar Hollow. */
  'mossguard-mantle': combatEquipment({
    id: 'mossguard-mantle',
    name: 'Mossguard Mantle',
    description: 'Mossguard Mantle carries the signature of Rootscar Hollow.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 48, defense: 12 },
    sellValue: 180,
  }, 'Rootscar Hollow'),

  /** Boss drop — Rootscar Ancient. */
  'ancient-heart-knot': combatEquipment({
    id: 'ancient-heart-knot',
    name: 'Ancient Heart Knot',
    description: 'Ancient Heart Knot carries the signature of Rootscar Ancient.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 1.8,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 95, maxMana: 50 },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.04 }] },
    sellValue: 180,
  }, 'Rootscar Ancient'),
}
