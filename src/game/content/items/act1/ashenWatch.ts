import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 1 — Ashen Watch — normal and boss Equipment. */
export const ASHEN_WATCH_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Ashen Watch. */
  'cinderwire-earring': combatEquipment({
    id: 'cinderwire-earring',
    name: 'Cinderwire Earring',
    description: 'Cinderwire Earring carries a live ember that sharpens Fire spellcraft and prolongs burning damage.',
    icon: '◍',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['spell', 'fire', 'dot'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { spellPower: 18, damageOverTimePct: 0.12 },
    sellValue: 180,
  }, 'Ashen Watch'),

  /** Normal drop — Ashen Watch. */
  'ashbrand-ring': combatEquipment({
    id: 'ashbrand-ring',
    name: 'Ashbrand Ring',
    description: 'Ashbrand Ring rewards decisive strikes with a sharper chance to critically ignite the enemy.',
    icon: 'O',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['fire', 'crit'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { critChance: 0.06, critDamage: 0.18 },
    sellValue: 180,
  }, 'Ashen Watch'),

  /** Normal drop — Ashen Watch. */
  'emberwatch-mantle': combatEquipment({
    id: 'emberwatch-mantle',
    name: 'Emberwatch Mantle',
    description: 'Emberwatch Mantle turns Ashen Watch’s heat into a sturdier frame and resistance to Fire.',
    icon: '▼',
    color: '#9eb9ed',
    equipmentTier: 1.8,
    buildTags: ['defense', 'fire', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 38, resistances: { fire: 0.10 } },
    sellValue: 180,
  }, 'Ashen Watch'),

  /** Boss drop — Flamebound Revenant. */
  'revenant-emberstone': combatEquipment({
    id: 'revenant-emberstone',
    name: 'Revenant Emberstone',
    description: 'Revenant Emberstone feeds Fire spells with critical force and extra damage against the Ashen Watch’s flame.',
    icon: '◇',
    color: '#d39bff',
    equipmentTier: 1.8,
    buildTags: ['fire', 'spell', 'crit'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { spellPower: 20, critChance: 0.04 },
    combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.12, originSourceKinds: ['spell'], damageTypes: ['fire'] }] },
    sellValue: 180,
  }, 'Flamebound Revenant'),
}
