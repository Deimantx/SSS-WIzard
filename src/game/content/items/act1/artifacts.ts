import type { AuthoredItemRegistry } from '../shared/itemAuthoring'
import { equipment } from '../shared/itemAuthoring'

/** ACT 1 — T2 Artifacts. Crafted in Artificing; static stats come from ARTIFACTS. */
export const ACT1_ARTIFACTS: AuthoredItemRegistry = {
  /** Artifact — Fractured Approach / Air path. */
  'galeshard-staff': equipment({
    id: 'galeshard-staff',
    name: 'Galeshard Staff',
    description: 'A frontier staff cut from wind-scoured crystal, carrying the sharp rhythm of unstable Air.',
    icon: '✦',
    color: '#a9d6e5',
    equipmentTier: 1.7,
    buildTags: ['spell', 'air', 'crit', 'mana'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Flooded Reliquary / Water path. */
  'reliquary-scepter': equipment({
    id: 'reliquary-scepter',
    name: 'Reliquary Scepter',
    description: 'A drowned scepter that turns cold currents into deliberate spellcraft.',
    icon: '◇',
    color: '#83c9e8',
    equipmentTier: 1.8,
    buildTags: ['spell', 'water', 'barrier'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Ashen Watch / Fire path. */
  'pyrebound-staff': equipment({
    id: 'pyrebound-staff',
    name: 'Pyrebound Staff',
    description: 'A staff that keeps a watchfire burning through every incantation.',
    icon: '⚒',
    color: '#ff956f',
    equipmentTier: 1.8,
    buildTags: ['spell', 'fire', 'dot'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Rootscar Hollow / Earth path. */
  'rootheart-scepter': equipment({
    id: 'rootheart-scepter',
    name: 'Rootheart Scepter',
    description: 'A living scepter that answers each spell with a patient pulse.',
    icon: '⬟',
    color: '#9eaa75',
    equipmentTier: 1.8,
    buildTags: ['spell', 'earth', 'defense'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'weapon',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Crossroads of Ruin / T2.5 Armor path. */
  'convergence-robe': equipment({
    id: 'convergence-robe',
    name: 'Convergence Robe',
    description: 'A layered robe where the roads of Act 1 meet, turning pressure from every direction into a steadier ward.',
    icon: '◇',
    color: '#c8b1ff',
    equipmentTier: 2,
    buildTags: ['defense', 'barrier', 'mana', 'sustain'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'armor',
    sellValue: null,
    canDestroy: false,
  }),

  /** Artifact — Crossroads of Ruin / T2.5 Helmet path. */
  'waystone-circlet': equipment({
    id: 'waystone-circlet',
    name: 'Waystone Circlet',
    description: 'A circlet cut from a stable waystone, keeping the wizard anchored while every school pulls at the same spell.',
    icon: '◇',
    color: '#b9a7ff',
    equipmentTier: 2,
    buildTags: ['spell', 'mana', 'focus', 'status'],
    equipmentBudgetProfile: 'signature',
    equipmentSlot: 'helmet',
    sellValue: null,
    canDestroy: false,
  }),
}
