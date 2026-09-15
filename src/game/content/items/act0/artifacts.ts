import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { equipment } from '../shared/itemAuthoring'

/** ACT 0 — T1 Artifacts. Crafted in Artificing; static stats come from ARTIFACTS. */
export const ACT0_ARTIFACTS: AuthoredItemRegistry = {
  /** Artifact — Whispering Woods / Fire path. */
  'ember-staff': equipment({
    id: 'ember-staff',
    name: 'Ember Staff',
    description: 'A blackened staff veined with embers that never cool; each reforging wakes a deeper furnace sealed within its core.',
    icon: '⚒',
    color: '#ff956f',
    equipmentTier: 1.0,
    buildTags: ['spell', 'fire', 'dot', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Whispering Woods / Water path. */
  'tideglass-wand': equipment({
    id: 'tideglass-wand',
    name: 'Tideglass Wand',
    description: 'Sea-blue glass beads with cold water even in dry air, bending every incantation into a steadier and more deliberate current.',
    icon: '◇',
    color: '#64b7ff',
    equipmentTier: 1.0,
    buildTags: ['spell', 'water', 'barrier', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Whispering Woods / Earth path. */
  'stoneheart-scepter': equipment({
    id: 'stoneheart-scepter',
    name: 'Stoneheart Scepter',
    description: 'Carved around a living stone core, the scepter answers every spell with a deeper pulse, as though the earth itself were listening.',
    icon: '⬟',
    color: '#d5a36b',
    equipmentTier: 1.0,
    buildTags: ['spell', 'earth', 'defense', 'barrier'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Whispering Woods / Air path. */
  'windthread-wand': equipment({
    id: 'windthread-wand',
    name: 'Windthread Wand',
    description: 'Silverwood bound with threads of captive wind trembles before a spell is spoken, snapping released magic forward like a drawn bowstring.',
    icon: '~',
    color: '#b9d8d0',
    equipmentTier: 1.0,
    buildTags: ['spell', 'air', 'crit', 'mana'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Whispering Woods / armor path. */
  'wispweave-robe': equipment({
    id: 'wispweave-robe',
    name: 'Wispweave Robe',
    description: 'Pale spirit-thread tightens around incoming force as though unseen hands were pulling every stitch into place at the moment of impact.',
    icon: '◇',
    color: '#a9b8d8',
    equipmentTier: 1.0,
    buildTags: ['defense', 'sustain', 'barrier', 'mana'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'armor',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Whispering Woods / helmet path. */
  'wispveil-hood': equipment({
    id: 'wispveil-hood',
    name: 'Wispveil Hood',
    description: 'Violet mist clings to the inside of this hood; beneath its veil, wandering thoughts sharpen and hostile enchantments struggle to take hold.',
    icon: '◇',
    color: '#b8a8e8',
    equipmentTier: 1.0,
    buildTags: ['spell', 'mana', 'status', 'crit'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'helmet',
    sellValue: null,
    canDestroy: false,
  }),
}
