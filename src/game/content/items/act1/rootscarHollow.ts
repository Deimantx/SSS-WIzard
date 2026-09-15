import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Rootscar Hollow — normal and boss Equipment. */
export const ROOTSCAR_HOLLOW_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Rootscar Hollow. */
  'briar-earring': combatEquipment({
    id: 'briar-earring',
    name: 'Briar Earring',
    description: 'Briar Earring threads living roots through each spell, adding Earth pressure and a small reserve of health.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['earth', 'spell', 'sustain'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'earring',
    stats: { spellPower: 14, maxHealth: 26 },
    combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.08, originSourceKinds: ['spell'], damageTypes: ['earth'] }] },
    sellValue: 180,
  }, 'Rootscar Hollow'),

  /** Normal drop — Rootscar Hollow. */
  'rootbound-ring': combatEquipment({
    id: 'rootbound-ring',
    name: 'Rootbound Ring',
    description: 'Rootbound Ring favors a patient defender, pairing a tougher guard with reliable natural recovery.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['defense', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { defense: 7, healthRegen: 2 },
    sellValue: 180,
  }, 'Rootscar Hollow'),

  /** Normal drop — Rootscar Hollow. */
  'mossguard-mantle': combatEquipment({
    id: 'mossguard-mantle',
    name: 'Mossguard Mantle',
    description: 'Mossguard Mantle layers living bark over the shoulders, strengthening both health and Defense.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['defense', 'earth', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 54, defense: 11 },
    sellValue: 180,
  }, 'Rootscar Hollow'),

  /** Boss drop — Rootscar Ancient. */
  'ancient-heart-knot': combatEquipment({
    id: 'ancient-heart-knot',
    name: 'Ancient Heart Knot',
    description: 'Ancient Heart Knot steadies the body with old-root resilience and shortens the grip of hostile control.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 1.8,
    buildTags: ['earth', 'defense', 'sustain'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 62, defense: 14 },
    combat: { modifiers: [{ key: 'control-duration-received-percent', value: -0.15 }] },
    sellValue: 180,
  }, 'Rootscar Ancient'),
}
