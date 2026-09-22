import type { AuthoredItemRegistry } from './itemAuthoring'
import { material, universalMaterial } from './itemAuthoring'

/** SHARED — global materials used across Act 0 and Act 1. */
export const SHARED_ITEMS: AuthoredItemRegistry = {
  /** Special cache: opens into Crystal Dust or a Tier 1 Crystal after the Meridian clear. */
  'tier-1-crystal-cache': {
    id: 'tier-1-crystal-cache',
    name: 'Tier 1 Crystal Cache',
    description: 'A sealed resonance cache. Open it for Crystal Dust or a Tier 1 Crystal.',
    icon: '◇',
    color: '#c9a8ff',
    kind: 'material',
    category: 'boss-loot',
    inventoryCategory: 'special',
    materialSubtype: 'arcane',
    materialTier: 1,
    source: 'Combat → eligible enemies after Meridian Splitter',
    sourceNavigation: 'combat',
    sellValue: null,
    canDestroy: false,
    actionRestrictionReason: 'Crystal Caches must be opened; they cannot be sold or destroyed.',
  },

  /** Shared material: Artifact progression catalyst. */
  'artifact-essence': universalMaterial(
    'artifact-essence',
    'Artifact Essence',
    'A concentrated echo released by dungeon enemies. It gives permanent Artifacts the force to take shape and grow.',
    '✦',
    '#d9b8ff',
    'material',
    'Combat → all dungeon enemies',
    'arcane',
    'combat',
  ),

  /** Shared material: advanced multi-element Transmutation catalyst. */
  'prismatic-fragment': universalMaterial(
    'prismatic-fragment',
    'Prismatic Fragment',
    'A harmonized shard formed from all four elemental forces. Used in advanced Transmutation and to forge or strengthen multi-element magical Artifacts.',
    '*',
    '#c8a8ff',
    'material',
    'Transmutation',
    'arcane',
    'tower-transmutation',
  ),

  /** Shared material: universal monster-loot catalyst. */
  'life-essence': universalMaterial(
    'life-essence',
    'Life Essence',
    'Vital residue released when living magic is defeated. A universal catalyst for permanent Tower upgrades.',
    '+',
    '#8fe0c0',
    'monster-loot',
    'All monsters',
    undefined,
    'combat',
  ),

  /** Shared Transmutation material: Fire. */
  'fire-fragment': material('fire-fragment', 'Fire Fragment', 'A hot shard of transmuted elemental force.', '◆', '#ff745d', 'elemental', 'Transmutation', 'fire', undefined, 'tower-transmutation'),

  /** Shared Transmutation material: Water. */
  'water-fragment': material('water-fragment', 'Water Fragment', 'A cool fragment shaped by transmutation.', '◇', '#64b7ff', 'elemental', 'Transmutation', 'water', undefined, 'tower-transmutation'),

  /** Shared Transmutation material: Earth. */
  'earth-fragment': material('earth-fragment', 'Earth Fragment', 'Dense mineral magic made by transmutation.', '⬟', '#d5a36b', 'elemental', 'Transmutation', 'earth', undefined, 'tower-transmutation'),

  /** Shared Transmutation material: Air. */
  'air-fragment': material('air-fragment', 'Air Fragment', 'A weightless mote formed through transmutation.', '≈', '#b9d8d0', 'elemental', 'Transmutation', 'air', undefined, 'tower-transmutation'),
}
