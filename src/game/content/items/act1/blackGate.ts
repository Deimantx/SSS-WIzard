import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Black Gate — normal and boss Equipment. */
export const BLACK_GATE_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Black Gate. */
  'gatebound-ring': combatEquipment({
    id: 'gatebound-ring',
    name: 'Gatebound Ring',
    description: 'Gatebound Ring turns critical openings into faster, more decisive spell rotations.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['crit', 'spell'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { critChance: 0.07, cooldownRecoveryPct: 0.09 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Normal drop — Black Gate. */
  'portal-echo-earring': combatEquipment({
    id: 'portal-echo-earring',
    name: 'Portal Echo Earring',
    description: 'Portal Echo Earring channels the Gate into raw spell power backed by a deep Mana reserve.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['spell', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 26, maxMana: 28 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Normal drop — Black Gate. */
  'blackgate-pendant': combatEquipment({
    id: 'blackgate-pendant',
    name: 'Blackgate Pendant',
    description: 'Blackgate Pendant opens a larger Focus reserve and makes each use more efficient.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['focus', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'amulet',
    stats: { maxFocus: 20, focusEfficiencyPct: 0.16 },
    sellValue: 180,
  }, 'Black Gate'),

  /** Normal drop — Black Gate. */
  'voidward-mantle': combatEquipment({
    id: 'voidward-mantle',
    name: 'Voidward Mantle',
    description: 'Voidward Mantle surrounds the wearer with a broad elemental ward and a heavy defensive frame.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 3,
    buildTags: ['defense', 'hybrid'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 82, defense: 17, resistances: { fire: 0.06, water: 0.06, earth: 0.06, air: 0.06 } },
    sellValue: 180,
  }, 'Black Gate'),

  /** Boss drop — Black Gatekeeper. */
  'black-gatekeepers-seal': combatEquipment({
    id: 'black-gatekeepers-seal',
    name: "Black Gatekeeper's Seal",
    description: "Black Gatekeeper's Seal joins a durable frame to powerful spellcraft and a steady increase to damage dealt.",
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 3,
    buildTags: ['spell', 'hybrid', 'defense'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 68, spellPower: 24 },
    combat: { modifiers: [{ key: 'damage-dealt-percent', value: 0.12 }] },
    sellValue: 180,
  }, 'Black Gatekeeper'),
}
