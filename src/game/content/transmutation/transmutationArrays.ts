import type { ItemId, TransmutationArrayId } from '../../types'
import { RANK_ONE_TOWER_UPGRADE_COSTS, type RankOneUpgradeLevel } from '../tower/rankOneUpgradeCosts'

export type ElementalFragmentKey = 'fire' | 'water' | 'earth' | 'air'

export interface TransmutationArrayDefinition {
  id: TransmutationArrayId
  name: string
  description: string
  effect: 'craft-speed-percent' | 'preservation-chance' | 'replication-chance' | 'mana-cost-reduction-percent' | 'echo-capacity'
  effectLabel: string
  valuePerLevel: number
  maxLevel: 10
  fragmentWeights: Record<ElementalFragmentKey, number>
  dominantElement: ElementalFragmentKey
}

export interface TransmutationArrayLevelCost {
  fragments: Record<ElementalFragmentKey, number>
  lifeEssence: number
}

export const TRANSMUTATION_ARRAY_IDS: readonly TransmutationArrayId[] = [
  'temporal-array',
  'conservation-array',
  'replication-array',
  'mana-refinement-array',
  'echo-stabilization-array',
]

export const TRANSMUTATION_ARRAYS: Record<TransmutationArrayId, TransmutationArrayDefinition> = {
  'temporal-array': {
    id: 'temporal-array',
    name: 'Temporal Array',
    description: 'Accelerates the temporal cadence of active Transmutation work.',
    effect: 'craft-speed-percent',
    effectLabel: 'TRANSMUTATION CRAFTING SPEED',
    valuePerLevel: 0.03,
    maxLevel: 10,
    fragmentWeights: { fire: 1, water: 0.6, earth: 0.8, air: 1.6 },
    dominantElement: 'air',
  },
  'conservation-array': {
    id: 'conservation-array',
    name: 'Conservation Array',
    description: 'Stabilizes consumed matter, occasionally preserving every ingredient used by a Transmutation cycle.',
    effect: 'preservation-chance',
    effectLabel: 'INGREDIENT PRESERVATION',
    valuePerLevel: 0.005,
    maxLevel: 10,
    fragmentWeights: { fire: 0.6, water: 0.8, earth: 1.6, air: 1 },
    dominantElement: 'earth',
  },
  'replication-array': {
    id: 'replication-array',
    name: 'Replication Array',
    description: 'Creates an unstable duplicate of the finished Transmutation without requiring another cycle.',
    effect: 'replication-chance',
    effectLabel: 'BONUS OUTPUT REPLICATION',
    valuePerLevel: 0.02,
    maxLevel: 10,
    fragmentWeights: { fire: 1.6, water: 0.6, earth: 1, air: 0.8 },
    dominantElement: 'fire',
  },
  'mana-refinement-array': {
    id: 'mana-refinement-array',
    name: 'Mana Refinement Array',
    description: 'Refines the Mana pattern used by Transmutation, reducing the Mana required to complete each cycle.',
    effect: 'mana-cost-reduction-percent',
    effectLabel: 'TRANSMUTATION MANA COST',
    valuePerLevel: 0.02,
    maxLevel: 10,
    fragmentWeights: { fire: 0.8, water: 1.6, earth: 0.6, air: 1 },
    dominantElement: 'water',
  },
  'echo-stabilization-array': {
    id: 'echo-stabilization-array',
    name: 'Echo Stabilization Array',
    description: 'Strengthens the Transmutation lattice, allowing more Arcane Echoes to operate simultaneously.',
    effect: 'echo-capacity',
    effectLabel: 'TRANSMUTATION ECHO CAPACITY',
    valuePerLevel: 1,
    maxLevel: 10,
    fragmentWeights: { fire: 0.8, water: 1.2, earth: 0.6, air: 1.4 },
    dominantElement: 'air',
  },
}

const fragmentItemIds: Record<ElementalFragmentKey, ItemId> = {
  fire: 'fire-fragment',
  water: 'water-fragment',
  earth: 'earth-fragment',
  air: 'air-fragment',
}

export const getTransmutationArrayLevelCost = (arrayId: TransmutationArrayId, level: number): TransmutationArrayLevelCost | null => {
  const definition = TRANSMUTATION_ARRAYS[arrayId]
  const base = level >= 1 && level <= 10 ? RANK_ONE_TOWER_UPGRADE_COSTS[level as RankOneUpgradeLevel] : null
  if (!definition || !base) return null
  return {
    fragments: (Object.keys(fragmentItemIds) as ElementalFragmentKey[]).reduce((result, element) => {
      result[element] = Math.round(base.primary * definition.fragmentWeights[element])
      return result
    }, {} as Record<ElementalFragmentKey, number>),
    lifeEssence: base.lifeEssence,
  }
}

export const createInitialTransmutationArrays = () => Object.fromEntries(
  TRANSMUTATION_ARRAY_IDS.map((id) => [id, { rank: 1, level: 0 }]),
) as Record<TransmutationArrayId, { rank: number; level: number }>

export const getTransmutationArrayFragmentItemId = (element: ElementalFragmentKey) => fragmentItemIds[element]
