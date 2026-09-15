import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Fractured Approach — normal and boss Equipment. */
export const FRACTURED_APPROACH_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Fractured Approach. */
  'galeglass-earring': combatEquipment({
    id: 'galeglass-earring',
    name: 'Galeglass Earring',
    description: 'A clear shard of frontier glass that catches stray wind and turns it into a sharper rhythm for every spell.',
    icon: '≈',
    color: '#b9d8d0',
    equipmentTier: 1.6,
    buildTags: ['spell', 'air', 'mana'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 18, spellPower: 10, cooldownRecoveryPct: 0.04 },
    sellValue: 140,
  }, 'Fractured Approach'),

  /** Normal drop — Fractured Approach. */
  'riftwind-ring': combatEquipment({
    id: 'riftwind-ring',
    name: 'Riftwind Ring',
    description: 'A fractured ring that pulls unstable air into a narrow current, rewarding precise and rapid casting.',
    icon: 'O',
    color: '#8cc9cf',
    equipmentTier: 1.6,
    buildTags: ['spell', 'air', 'crit', 'basic-attack'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 12, spellPower: 9, critChance: 0.03, critDamage: 0.10, cooldownRecoveryPct: 0.03 },
    sellValue: 140,
  }, 'Fractured Approach'),

  /** Normal drop — Fractured Approach. */
  'waystone-pendant': combatEquipment({
    id: 'waystone-pendant',
    name: 'Waystone Pendant',
    description: 'A waystone fragment steadies the wearer between broken roads, expanding both Mana reserves and Air spell pressure.',
    icon: '◇',
    color: '#9eb9ed',
    equipmentTier: 1.6,
    buildTags: ['spell', 'air', 'mana', 'focus'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'amulet',
    stats: { maxMana: 20, maxFocus: 10, spellPower: 8 },
    combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.08, originSourceKinds: ['spell'], damageTypes: ['air'] }] },
    sellValue: 140,
  }, 'Fractured Approach'),

  /** Normal drop — Fractured Approach. */
  'fractured-ward-mantle': combatEquipment({
    id: 'fractured-ward-mantle',
    name: 'Fractured Ward Mantle',
    description: 'Broken ward-pylons are stitched into a mantle that turns the frontier\'s unstable magic into a thin protective shell.',
    icon: '▼',
    color: '#9a9fba',
    equipmentTier: 1.6,
    buildTags: ['defense', 'air'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 25, defense: 6, resistances: { air: 0.04, arcane: 0.04 } },
    sellValue: 140,
  }, 'Fractured Approach'),

  /** Boss drop — Corrupted Elemental Gatekeeper. */
  'gatekeeper-sigil': combatEquipment({
    id: 'gatekeeper-sigil',
    name: 'Gatekeeper Sigil',
    description: 'The Gatekeeper\'s fractured seal still resists the collapse of the frontier, lending its bearer a measured ward against incoming force.',
    icon: '✤',
    color: '#d276a3',
    equipmentTier: 1.7,
    buildTags: ['defense', 'air', 'sustain'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 35, maxMana: 25, defense: 8, spellPower: 10, resistances: { fire: 0.03, water: 0.03, earth: 0.03, air: 0.03 } },
    combat: { modifiers: [{ key: 'damage-taken-percent', value: -0.03 }] },
    sellValue: null,
  }, 'Corrupted Elemental Gatekeeper'),
}
