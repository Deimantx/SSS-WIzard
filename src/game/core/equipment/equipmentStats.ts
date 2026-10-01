import { ITEMS } from '../../content/items/items'
import type { CombatModifier, CombatTag, DamageType, EquipmentStats, GameState, ModifierKey } from '../../types'
import { getArtifactEffectiveStats, getActiveArtifactCombatProviders, isArtifactItem } from '../../systems/artifacts/artifactProgression'
import { getArcaneCoreStaticStats } from '../../systems/arcane-core/arcaneCoreProgression'
import { addEquipmentStats } from './equipmentStatAggregation'
import { getEquippedCrystalStats } from '../../systems/crystals/crystalStats'
import { getEquippedSigilInstanceStats, getEquippedSigilSetStats } from '../../systems/sigils/sigilRuntime'

export { addEquipmentStats } from './equipmentStatAggregation'

export interface EquipmentModifierContext {
  sourceKinds?: CombatModifier['sourceKinds']
  sourceTags?: CombatTag[]
  originSourceKinds?: CombatModifier['originSourceKinds']
  originTags?: CombatModifier['originTags']
  damageType?: DamageType
  statusTags?: CombatTag[]
}

export type EquipmentStatsState = Pick<GameState, 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'arcaneCore' | 'crystals' | 'sigils'>>

export interface PlayerBuildStaticStatSources {
  equipment: EquipmentStats
  artifact: EquipmentStats
  arcaneCore: EquipmentStats
  crystal: EquipmentStats
  sigil: EquipmentStats
  sigilSet: EquipmentStats
}

/** Aggregates authored equipped-item stats for every derived combat/system selector. */
export const getEffectiveEquipmentItemStats = (state: EquipmentStatsState, itemId: import('../../types').ItemId): EquipmentStats =>
  isArtifactItem(itemId) ? getArtifactEffectiveStats(state, itemId) : (ITEMS[itemId]?.stats ?? {})

export const getEquippedItemStatSources = (state: EquipmentStatsState): Pick<PlayerBuildStaticStatSources, 'equipment' | 'artifact'> => {
  const equipment: EquipmentStats = {}
  const artifact: EquipmentStats = {}
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId || !ITEMS[itemId]) return
    addEquipmentStats(isArtifactItem(itemId) ? artifact : equipment, getEffectiveEquipmentItemStats(state, itemId))
  })
  return { equipment, artifact }
}

/** Resolves each always-on static player build source once for sheet and Combat consumers. */
export const getPlayerBuildStaticStatSources = (state: EquipmentStatsState): PlayerBuildStaticStatSources => {
  const items = getEquippedItemStatSources(state)
  return {
    ...items,
    arcaneCore: state.arcaneCore ? getArcaneCoreStaticStats(state.arcaneCore) : {},
    crystal: state.crystals ? getEquippedCrystalStats(state as Pick<GameState, 'crystals'>) : {},
    sigil: state.sigils ? getEquippedSigilInstanceStats(state as Pick<GameState, 'sigils'>) : {},
    sigilSet: state.sigils ? getEquippedSigilSetStats(state as Pick<GameState, 'sigils'>) : {},
  }
}

export const getEquippedItemStats = (state: EquipmentStatsState): EquipmentStats => {
  const { equipment, artifact } = getEquippedItemStatSources(state)
  const total = { ...equipment }
  addEquipmentStats(total, artifact)
  return total
}

/** Aggregates every always-on static player build source exactly once. */
export const getPlayerBuildStaticStats = (state: EquipmentStatsState): EquipmentStats => {
  const total: EquipmentStats = {}
  Object.values(getPlayerBuildStaticStatSources(state)).forEach((source) => addEquipmentStats(total, source))
  return total
}

/** Sums unconditional authored Equipment modifiers for stable sheet read models. */
export const getEquipmentCombatModifierTotal = (state: EquipmentStatsState, key: ModifierKey, context: EquipmentModifierContext = {}) => {
  const sourceTags = context.sourceTags ?? []
  const originTags = context.originTags ?? []
  return Object.values(state.equipment).reduce((total, itemId) => {
    const artifactProviders = itemId && isArtifactItem(itemId) ? getActiveArtifactCombatProviders(state, itemId) : []
    const modifiers = itemId ? [...(ITEMS[itemId]?.combat?.modifiers ?? []), ...artifactProviders.flatMap(provider => provider.modifiers)] : []
    return total + modifiers.reduce((itemTotal, modifier) => {
      if (modifier.key !== key || modifier.condition) return itemTotal
      if (context.sourceKinds?.length && (!modifier.sourceKinds || !context.sourceKinds.some((kind) => modifier.sourceKinds?.includes(kind)))) return itemTotal
      if (modifier.sourceTags?.length && !modifier.sourceTags.every((tag) => sourceTags.includes(tag))) return itemTotal
      if (context.originSourceKinds?.length && (!modifier.originSourceKinds || !context.originSourceKinds.some((kind) => modifier.originSourceKinds?.includes(kind)))) return itemTotal
      if (modifier.originTags?.length && !modifier.originTags.every((tag) => originTags.includes(tag))) return itemTotal
      if (context.damageType && modifier.damageTypes?.length && !modifier.damageTypes.includes(context.damageType)) return itemTotal
      if (context.statusTags && modifier.statusTags?.length && !modifier.statusTags.every((tag) => context.statusTags?.includes(tag))) return itemTotal
      return itemTotal + modifier.value
    }, 0)
  }, 0)
}
