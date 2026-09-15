import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { combatEquipment } from '../shared/itemAuthoring'

/** ACT 0 — Whispering Woods — normal and boss Equipment. */
export const WHISPERING_WOODS_ITEMS: AuthoredItemRegistry = {
  /** Normal drop — Whispering Woods. */
  'windthread-charm': combatEquipment({
    id: 'windthread-charm',
    name: 'Windthread Charm',
    description: 'A knot of silver thread wound around a captured gust, keeping a sliver of the mind clear even while several spells compete for attention.',
    icon: '~',
    color: '#b9d8d0',
    equipmentTier: 1.0,
    buildTags: ['spell', 'air', 'focus'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'amulet',
    stats: { maxMana: 10, maxFocus: 10, spellPower: 8 },
    combat: { modifiers: [{ key: 'spell-damage-percent', value: 0.1, originSourceKinds: ['spell'], damageTypes: ['air'] }] },
    sellValue: 40,
  }, 'Whispering Woods'),

  /** Normal drop — Whispering Woods. */
  'grovekeeper-mantle': combatEquipment({
    id: 'grovekeeper-mantle',
    name: 'Grovekeeper Mantle',
    description: 'Living fibers run through bark-soft cloth, stiffening under impact like a grove closing ranks around its keeper.',
    icon: '▼',
    color: '#9eaa75',
    equipmentTier: 1.0,
    buildTags: ['defense'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'cape',
    stats: { maxHealth: 15, defense: 3, resistances: { physical: 0.03 } },
    sellValue: 40,
  }, 'Whispering Woods'),

  /** Normal drop — Whispering Woods. */
  'wispglass-earring': combatEquipment({
    id: 'wispglass-earring',
    name: 'Wispglass Earring',
    description: 'A loop of translucent wispglass rings without sound whenever mana slips from a spell, drawing the loose current back toward its wearer.',
    icon: '◌',
    color: '#c8b8ff',
    equipmentTier: 1.0,
    buildTags: ['spell', 'mana', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'earring',
    stats: { maxMana: 12, manaRegen: 1, spellPower: 5, cooldownRecoveryPct: 0.03 },
    sellValue: 40,
  }, 'Whispering Woods'),

  /** Normal drop — Whispering Woods. */
  'wispbound-ring': combatEquipment({
    id: 'wispbound-ring',
    name: 'Wispbound Ring',
    description: 'A pale ring that drinks the mana left between incantations and returns it in a slow, steady pulse against the wearer\'s hand.',
    icon: 'O',
    color: '#c3a7ff',
    equipmentTier: 1.0,
    buildTags: ['spell', 'mana', 'sustain'],
    equipmentBudgetProfile: 'standard',
    equipmentSlot: 'ring',
    stats: { maxMana: 10, manaRegen: 1, spellPower: 5 },
    sellValue: 40,
  }, 'Whispering Woods'),

  /** Boss drop — Forest Heart. */
  'heartseed-necklace': combatEquipment({
    id: 'heartseed-necklace',
    name: 'Heartseed Necklace',
    description: 'The seed still beats faintly against the chest; when its wearer falters, roots of light flare outward before the killing blow can land.',
    icon: '✤',
    color: '#f4c46e',
    equipmentTier: 1.0,
    buildTags: ['defense', 'healing', 'barrier', 'sustain'],
    equipmentBudgetProfile: 'boss',
    equipmentSlot: 'amulet',
    stats: { maxHealth: 25, defense: 10, resistances: { physical: 0.03 } },
    combat: {
      modifiers: [{ key: 'healing-done-percent', value: 0.05 }],
      rules: [{ id: 'living-seed', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 30 }, oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 20 } }], ui: { name: 'Living Seed' } }],
    },
    sellValue: null,
  }, 'Forest Heart'),
}
