import type { CrystalFamilyId, CrystalGroupId, CrystalTier, CrystalVariantId, EquipmentStats, ItemId } from '../../types'

export const CRYSTAL_SLOT_COUNT = 15
export const CRYSTAL_STARTING_UNLOCKED_SLOTS = 5
export const CRYSTAL_GROUP_CAP = 2
export const CRYSTAL_CACHE_ITEM_ID: ItemId = 'tier-1-crystal-cache'
export const CRYSTAL_CACHE_DROP_CHANCE = 0.01
export const CRYSTAL_CACHE_POWER_THRESHOLD = 3_000
export const CRYSTAL_CACHE_DUST = 25
export const CRYSTAL_TIER_MULTIPLIERS: Record<CrystalTier, number> = { 1: 1, 2: 1.5, 3: 2, 4: 2.5, 5: 3 }
export const CRYSTAL_CRUSH_DUST: Record<CrystalTier, number> = { 1: 20, 2: 60, 3: 150, 4: 400, 5: 1_000 }

export interface CrystalFamilyDefinition {
  id: CrystalFamilyId
  group: CrystalGroupId
  name: string
  icon: string
  color: string
  description: string
  tierOneStats: EquipmentStats
}

export const CRYSTAL_FAMILY_ORDER: readonly CrystalFamilyId[] = [
  'force', 'ruin', 'torment', 'cataclysm',
  'vitality', 'bulwark', 'renewal', 'ward',
  'reservoir', 'current', 'concentration', 'frugality',
  'keen-sight', 'tempo', 'control', 'discipline',
]

export const CRYSTAL_FAMILIES: Record<CrystalFamilyId, CrystalFamilyDefinition> = {
  force: { id: 'force', group: 'destruction', name: 'Force', icon: '✦', color: '#ff8c69', description: 'Raw spell pressure that raises Spell Power.', tierOneStats: { spellPower: 12 } },
  ruin: { id: 'ruin', group: 'destruction', name: 'Ruin', icon: '◈', color: '#ff6e87', description: 'Critical spells hit harder.', tierOneStats: { critDamage: 0.08 } },
  torment: { id: 'torment', group: 'destruction', name: 'Torment', icon: '✧', color: '#e77aff', description: 'Damage over time effects linger with greater force.', tierOneStats: { damageOverTimePct: 0.05 } },
  cataclysm: { id: 'cataclysm', group: 'destruction', name: 'Cataclysm', icon: '✹', color: '#ffbd72', description: 'A balanced destruction crystal.', tierOneStats: { spellPower: 7, critDamage: 0.04 } },
  vitality: { id: 'vitality', group: 'bastion', name: 'Vitality', icon: '♥', color: '#76e0a8', description: 'Expands maximum Health.', tierOneStats: { maxHealth: 70 } },
  bulwark: { id: 'bulwark', group: 'bastion', name: 'Bulwark', icon: '⬡', color: '#78c8ff', description: 'Hardens Defence.', tierOneStats: { defense: 12 } },
  renewal: { id: 'renewal', group: 'bastion', name: 'Renewal', icon: '⟲', color: '#83f0c0', description: 'Improves steady Health regeneration.', tierOneStats: { healthRegen: 0.7 } },
  ward: { id: 'ward', group: 'bastion', name: 'Ward', icon: '⟐', color: '#9d9bff', description: 'Strengthens barriers.', tierOneStats: { barrierPowerPct: 0.05 } },
  reservoir: { id: 'reservoir', group: 'flow', name: 'Reservoir', icon: '◉', color: '#6ed6ff', description: 'Expands maximum Mana.', tierOneStats: { maxMana: 45 } },
  current: { id: 'current', group: 'flow', name: 'Current', icon: '≈', color: '#72b9ff', description: 'Improves Mana regeneration.', tierOneStats: { manaRegen: 1 } },
  concentration: { id: 'concentration', group: 'flow', name: 'Concentration', icon: '⊙', color: '#b0a3ff', description: 'Deepens maximum Mana.', tierOneStats: { maxManaPct: 0.03 } },
  frugality: { id: 'frugality', group: 'flow', name: 'Frugality', icon: '◇', color: '#8ee7e0', description: 'Reduces spell Mana costs.', tierOneStats: { manaCostReductionPct: 0.03 } },
  'keen-sight': { id: 'keen-sight', group: 'precision', name: 'Keen Sight', icon: '◌', color: '#f1d37a', description: 'Finds critical openings more often.', tierOneStats: { critChance: 0.015 } },
  tempo: { id: 'tempo', group: 'precision', name: 'Tempo', icon: '»', color: '#ffae75', description: 'Accelerates cooldown recovery.', tierOneStats: { cooldownRecoveryPct: 0.025 } },
  control: { id: 'control', group: 'precision', name: 'Control', icon: '⊕', color: '#c4a0ff', description: 'Extends status duration.', tierOneStats: { statusDurationPct: 0.05 } },
  discipline: { id: 'discipline', group: 'precision', name: 'Discipline', icon: '⌁', color: '#b8d6ff', description: 'Strengthens Critical Damage.', tierOneStats: { critDamage: 0.05 } },
}

export const CRYSTAL_GROUP_LABELS: Record<CrystalGroupId, string> = {
  destruction: 'Destruction',
  bastion: 'Bastion',
  flow: 'Flow',
  precision: 'Precision',
}

export const CRYSTAL_UPGRADE_COSTS: Record<CrystalTier, { dust: number; materials: Partial<Record<ItemId, number>> }> = {
  1: { dust: 100, materials: { 'life-essence': 5 } },
  2: { dust: 250, materials: { 'life-essence': 10, 'artifact-essence': 5 } },
  3: { dust: 600, materials: { 'artifact-essence': 12, 'prismatic-fragment': 5 } },
  4: { dust: 1_500, materials: { 'artifact-essence': 25, 'prismatic-fragment': 10 } },
  5: { dust: 0, materials: {} },
}

export const CRYSTAL_VARIANT_IDS: readonly CrystalVariantId[] = CRYSTAL_FAMILY_ORDER.flatMap((familyId) => [1, 2, 3, 4, 5].map((tier) => `${familyId}-t${tier}` as CrystalVariantId))

export const getCrystalTier = (variantId: CrystalVariantId): CrystalTier => Number(variantId.slice(variantId.lastIndexOf('t') + 1)) as CrystalTier
export const getCrystalFamilyId = (variantId: CrystalVariantId): CrystalFamilyId => variantId.slice(0, variantId.lastIndexOf('-t')) as CrystalFamilyId
export const getCrystalFamily = (variantId: CrystalVariantId) => CRYSTAL_FAMILIES[getCrystalFamilyId(variantId)]
export const getCrystalVariantName = (variantId: CrystalVariantId) => `T${getCrystalTier(variantId)} Crystal of ${getCrystalFamily(variantId).name}`

export const getCrystalVariantStats = (variantId: CrystalVariantId): EquipmentStats => {
  const tier = getCrystalTier(variantId)
  const multiplier = CRYSTAL_TIER_MULTIPLIERS[tier]
  return Object.fromEntries(Object.entries(getCrystalFamily(variantId).tierOneStats).map(([key, value]) => [key, (value as number) * multiplier])) as EquipmentStats
}

export const getNextCrystalVariant = (variantId: CrystalVariantId): CrystalVariantId | null => {
  const tier = getCrystalTier(variantId)
  return tier >= 5 ? null : `${getCrystalFamilyId(variantId)}-t${tier + 1}` as CrystalVariantId
}
