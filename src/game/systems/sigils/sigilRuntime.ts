import type { EquipmentStats, GameState, SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilState, SigilTier, SigilTraitId } from '../../types'
import { getSigilTierDefinition, resolveSigilTierFromEnemyPower } from '../../content/sigils/sigilTiers'
import { getSigilQualityDefinition, SIGIL_QUALITIES } from '../../content/sigils/sigilQualities'
import { getSigilSetBonuses, SIGIL_SETS } from '../../content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS, resolveSigilStats } from '../../content/sigils/sigilStats'
import { SIGIL_TRAITS } from '../../content/sigils/sigilTraits'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'

export const clampSigilRollQuality = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export const resolveSigilStatsForInstance = (sigil: SigilInstance): EquipmentStats => resolveSigilStats(sigil, getSigilTierDefinition)

export const getEquippedSigils = (state: Pick<GameState, 'sigils'>): SigilInstance[] => Object.values(state.sigils.equipped).flatMap((id) => id && state.sigils.storage[id] ? [state.sigils.storage[id]] : [])

export const getEquippedSigilSetCounts = (state: Pick<GameState, 'sigils'>): Partial<Record<SigilSetId, number>> => getEquippedSigils(state).reduce<Partial<Record<SigilSetId, number>>>((counts, sigil) => { counts[sigil.setId] = (counts[sigil.setId] ?? 0) + 1; return counts }, {})

export const getEquippedSigilStats = (state: Pick<GameState, 'sigils'>): EquipmentStats => {
  const total: EquipmentStats = {}
  getEquippedSigils(state).forEach((sigil) => addEquipmentStats(total, resolveSigilStatsForInstance(sigil)))
  addEquipmentStats(total, getSigilSetBonuses(getEquippedSigilSetCounts(state)))
  return total
}

export const getSigilLabel = (sigil: Pick<SigilInstance, 'tier' | 'quality' | 'setId' | 'slot'>) => `T${sigil.tier} ${sigil.quality[0].toUpperCase()}${sigil.quality.slice(1)} ${SIGIL_SETS[sigil.setId].name} Sigil ${['I', 'II', 'III', 'IV', 'V', 'VI'][sigil.slot - 1]}`

const qualityRank = (quality: SigilQuality) => SIGIL_QUALITIES.findIndex((definition) => definition.id === quality)
export const compareSigilQuality = (left: SigilQuality, right: SigilQuality) => qualityRank(left) - qualityRank(right)

export const getSigilEnhancementCap = (state: Pick<GameState, 'sigils' | 'progress'>): number => {
  const kills = state.progress.bossKillsByBoss
  if (state.sigils.hasDefeatedWorldTier2Boss) return 20
  if ((kills['meridian-splitter'] ?? 0) > 0) return 18
  if ((kills['corrupted-elemental-gatekeeper'] ?? 0) > 0) return 15
  if ((kills['archmage-edrin-shade'] ?? 0) > 0) return 12
  if ((kills['corrupted-greatbear'] ?? 0) > 0) return 9
  if ((kills['forest-heart'] ?? 0) > 0) return 6
  return 3
}

export const getSigilEnhancementCost = (sigil: Pick<SigilInstance, 'tier'>, nextRank: number) => Math.ceil(5 * Math.pow(Math.max(1, nextRank), 1.6) * getSigilTierDefinition(sigil.tier).craftCostMultiplier)
export const getSigilBaseSalvage = (quality: SigilQuality) => ({ common: 10, refined: 22, perfect: 55, legendary: 140 }[quality])
export const getSigilEnhancementInvestment = (sigil: Pick<SigilInstance, 'tier' | 'rollHistory' | 'rank'>) => Array.from({ length: Math.max(0, sigil.rank) }, (_, index) => getSigilEnhancementCost(sigil, index + 1)).reduce((sum, cost) => sum + cost, 0)
export const getSigilSalvageValue = (sigil: Pick<SigilInstance, 'quality' | 'tier' | 'rollHistory' | 'rank'>) => Math.floor(getSigilBaseSalvage(sigil.quality) * getSigilTierDefinition(sigil.tier).salvageMultiplier + getSigilEnhancementInvestment(sigil) * .2)

export const getSigilMainStatLabel = (sigil: Pick<SigilInstance, 'mainStatId'>) => SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label
export const getSigilStatLabel = (statId: keyof typeof SIGIL_STAT_DEFINITIONS) => SIGIL_STAT_DEFINITIONS[statId].label

export const sanitizeSigilState = (state: Pick<GameState, 'sigils'>): SigilState => state.sigils

export const getAvailableSigilTier = (state: Pick<GameState, 'sigils'>): SigilTier => resolveSigilTierFromEnemyPower(state.sigils.highestSourcePowerDefeated)

export const getActiveSigilTraitIds = (state: Pick<GameState, 'sigils'>): SigilTraitId[] => {
  const seen = new Set<SigilTraitId>()
  const active: SigilTraitId[] = []
  getEquippedSigils(state).forEach((sigil) => sigil.traitIds.forEach((traitId) => {
    const definition = SIGIL_TRAITS[traitId]
    if (!definition || (definition.unique && seen.has(traitId))) return
    seen.add(traitId)
    active.push(traitId)
  }))
  return active
}

export const getSigilSetActivation = (state: Pick<GameState, 'sigils'>, setId: SigilSetId) => {
  const pieces = getEquippedSigilSetCounts(state)[setId] ?? 0
  const definition = SIGIL_SETS[setId]
  return { pieces, active: definition.piecesRequired === 2 ? Math.floor(pieces / 2) > 0 : pieces >= 4, bonusCopies: definition.piecesRequired === 2 ? Math.floor(pieces / 2) : pieces >= 4 ? 1 : 0 }
}
