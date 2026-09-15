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
    buildTags: ['spell', 'earth', 'defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxHealth: 20, maxMana: 12, spellPower: 11, defense: 4 },
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
    buildTags: ['spell', 'earth', 'defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxHealth: 28, maxMana: 12, defense: 5, manaRegen: 2 },
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
    buildTags: ['defense', 'earth', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 42, defense: 10, resistances: { earth: 0.08 } },
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
    buildTags: ['defense', 'earth', 'sustain', 'barrier'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 58, maxMana: 18, defense: 15, healthRegen: 2, resistances: { earth: 0.1 } },
    combat: { modifiers: [{ key: 'control-duration-received-percent', value: -0.12 }] },
    sellValue: 180,
  }, 'Rootscar Ancient'),
}
