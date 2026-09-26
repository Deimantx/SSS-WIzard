import type { ItemId, ManaPillarId } from '../../types'
import { RANK_ONE_TOWER_UPGRADE_COSTS, type RankOneUpgradeLevel } from '../tower/rankOneUpgradeCosts'

export interface ManaPillarLevelCost {
  fragment: number
  lifeEssence: number
}

export interface ManaPillarDefinition {
  id: ManaPillarId
  name: string
  description: string
  effect: 'flat-regen' | 'flat-capacity' | 'passive-regen-percent' | 'capacity-percent' | 'echo-percent'
  effectLabel: string
  valuePerLevel: number
  maxLevel: 10
  fragmentRequirements: readonly ItemId[]
}

export const MANA_PILLAR_IDS: readonly ManaPillarId[] = [
  'leyline-conduit',
  'arcane-reservoir',
  'mana-resonance',
  'astral-expansion',
  'echo-attunement',
]

export const PILLAR_LEVEL_COSTS: Record<RankOneUpgradeLevel, ManaPillarLevelCost> = Object.fromEntries(
  (Object.keys(RANK_ONE_TOWER_UPGRADE_COSTS) as unknown as RankOneUpgradeLevel[]).map((level) => [level, { fragment: RANK_ONE_TOWER_UPGRADE_COSTS[level].primary, lifeEssence: RANK_ONE_TOWER_UPGRADE_COSTS[level].lifeEssence }]),
) as Record<RankOneUpgradeLevel, ManaPillarLevelCost>

export const MANA_PILLARS: Record<ManaPillarId, ManaPillarDefinition> = {
  'leyline-conduit': {
    id: 'leyline-conduit',
    name: 'Leyline Conduit',
    description: 'Strengthens the tower\'s natural connection to the leyline.',
    effect: 'flat-regen',
    effectLabel: 'FLUX / ACOLYTE',
    valuePerLevel: 0.25,
    maxLevel: 10,
    fragmentRequirements: ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'],
  },
  'arcane-reservoir': {
    id: 'arcane-reservoir',
    name: 'Arcane Reservoir',
    description: 'Expands the tower\'s capacity to hold Arcane Flux.',
    effect: 'flat-capacity',
    effectLabel: 'MAX ARCANE FLUX',
    valuePerLevel: 100,
    maxLevel: 10,
    fragmentRequirements: ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'],
  },
  'mana-resonance': {
    id: 'mana-resonance',
    name: 'Flux Resonance',
    description: 'Amplifies total Arcane Flux production.',
    effect: 'passive-regen-percent',
    effectLabel: 'FLUX PRODUCTION',
    valuePerLevel: 3,
    maxLevel: 10,
    fragmentRequirements: ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'],
  },
  'astral-expansion': {
    id: 'astral-expansion',
    name: 'Astral Expansion',
    description: 'Amplifies final Arcane Flux capacity.',
    effect: 'capacity-percent',
    effectLabel: 'FLUX CAPACITY',
    valuePerLevel: 2,
    maxLevel: 10,
    fragmentRequirements: ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'],
  },
  'echo-attunement': {
    id: 'echo-attunement',
    name: 'Acolyte Attunement',
    description: 'Increases output from Channeling Acolytes.',
    effect: 'echo-percent',
    effectLabel: 'ACOLYTE OUTPUT',
    valuePerLevel: 2,
    maxLevel: 10,
    fragmentRequirements: ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'],
  },
}

export const getManaPillarLevelCost = (level: number): ManaPillarLevelCost | null => (
  level >= 1 && level <= 10 ? PILLAR_LEVEL_COSTS[level as keyof typeof PILLAR_LEVEL_COSTS] : null
)

export const createInitialManaPillars = () => Object.fromEntries(
  MANA_PILLAR_IDS.map((id) => [id, { rank: 1, level: 0 }]),
) as Record<ManaPillarId, { rank: number; level: number }>
