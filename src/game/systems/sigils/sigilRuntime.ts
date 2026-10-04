import type { EquipmentStats, GameState, SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilState, SigilStatId, SigilTier, SigilTraitId } from '../../types'
import { getSigilTierDefinition, resolveSigilTierFromEnemyPower } from '../../content/sigils/sigilTiers'
import { getSigilQualityDefinition, SIGIL_QUALITIES } from '../../content/sigils/sigilQualities'
import { getSigilSetBonuses, SIGIL_SETS } from '../../content/sigils/sigilSets'
import { SIGIL_MAIN_STAT_POOLS, SIGIL_STAT_DEFINITIONS, resolveSigilStats } from '../../content/sigils/sigilStats'
import { getEligibleSigilTraits, SIGIL_TRAITS } from '../../content/sigils/sigilTraits'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'
import { normalizeSigilState } from './sigilStateNormalization'

export const clampSigilRollQuality = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export const resolveSigilStatsForInstance = (sigil: SigilInstance): EquipmentStats => resolveSigilStats(sigil, getSigilTierDefinition)

export const getEquippedSigils = (state: Pick<GameState, 'sigils'>): SigilInstance[] => Object.values(state.sigils.equipped).flatMap((id) => id && state.sigils.storage[id] ? [state.sigils.storage[id]] : [])

export const getEquippedSigilSetCounts = (state: Pick<GameState, 'sigils'>): Partial<Record<SigilSetId, number>> => getEquippedSigils(state).reduce<Partial<Record<SigilSetId, number>>>((counts, sigil) => { counts[sigil.setId] = (counts[sigil.setId] ?? 0) + 1; return counts }, {})

export const getEquippedSigilInstanceStats = (state: Pick<GameState, 'sigils'>): EquipmentStats => {
  const total: EquipmentStats = {}
  getEquippedSigils(state).forEach((sigil) => addEquipmentStats(total, resolveSigilStatsForInstance(sigil)))
  return total
}

export const getEquippedSigilSetStats = (state: Pick<GameState, 'sigils'>): EquipmentStats => getSigilSetBonuses(getEquippedSigilSetCounts(state))

export const getEquippedSigilStats = (state: Pick<GameState, 'sigils'>): EquipmentStats => {
  const total = getEquippedSigilInstanceStats(state)
  addEquipmentStats(total, getEquippedSigilSetStats(state))
  return total
}

export const getSigilLabel = (sigil: Pick<SigilInstance, 'tier' | 'quality' | 'setId' | 'slot'>) => `T${sigil.tier} ${sigil.quality[0].toUpperCase()}${sigil.quality.slice(1)} ${SIGIL_SETS[sigil.setId].name} Sigil ${['I', 'II', 'III', 'IV', 'V', 'VI'][sigil.slot - 1]}`

const qualityRank = (quality: SigilQuality) => SIGIL_QUALITIES.findIndex((definition) => definition.id === quality)
export const compareSigilQuality = (left: SigilQuality, right: SigilQuality) => qualityRank(left) - qualityRank(right)

export interface SigilEnhancementCapView { current: number; next: number | null; requirement: string | null }

export const getSigilEnhancementCapView = (state: Pick<GameState, 'sigils' | 'progress'>): SigilEnhancementCapView => {
  const kills = state.progress.bossKillsByBoss
  if ((kills['black-gatekeeper'] ?? 0) > 0) return { current: 20, next: null, requirement: null }
  if ((kills['meridian-splitter'] ?? 0) > 0) return { current: 18, next: 20, requirement: 'Defeat the Black Gatekeeper.' }
  if ((kills['corrupted-elemental-gatekeeper'] ?? 0) > 0) return { current: 15, next: 18, requirement: 'Defeat Meridian Splitter.' }
  if ((kills['archmage-edrin-shade'] ?? 0) > 0) return { current: 12, next: 15, requirement: 'Defeat the Corrupted Elemental Gatekeeper.' }
  if ((kills['corrupted-greatbear'] ?? 0) > 0) return { current: 9, next: 12, requirement: 'Defeat Archmage Edrin Shade.' }
  if ((kills['forest-heart'] ?? 0) > 0) return { current: 6, next: 9, requirement: 'Defeat the Corrupted Greatbear.' }
  return { current: 3, next: 6, requirement: 'Defeat Forest Heart.' }
}

export const getSigilEnhancementCap = (state: Pick<GameState, 'sigils' | 'progress'>): number => getSigilEnhancementCapView(state).current

export const getSigilEnhancementCost = (sigil: Pick<SigilInstance, 'tier'>, nextRank: number) => Math.ceil(5 * Math.pow(Math.max(1, nextRank), 1.6) * getSigilTierDefinition(sigil.tier).craftCostMultiplier)
export const getSigilBaseSalvage = (quality: SigilQuality) => ({ common: 10, refined: 22, perfect: 55, legendary: 140 }[quality])
export const getSigilEnhancementInvestment = (sigil: Pick<SigilInstance, 'tier' | 'rollHistory' | 'rank'>) => Array.from({ length: Math.max(0, sigil.rank) }, (_, index) => getSigilEnhancementCost(sigil, index + 1)).reduce((sum, cost) => sum + cost, 0)
export const getSigilSalvageValue = (sigil: Pick<SigilInstance, 'quality' | 'tier' | 'rollHistory' | 'rank'>) => Math.floor(getSigilBaseSalvage(sigil.quality) * getSigilTierDefinition(sigil.tier).salvageMultiplier + getSigilEnhancementInvestment(sigil) * .2)

export const getSigilMainStatLabel = (sigil: Pick<SigilInstance, 'mainStatId'>) => SIGIL_STAT_DEFINITIONS[sigil.mainStatId].label
export const getSigilStatLabel = (statId: keyof typeof SIGIL_STAT_DEFINITIONS) => SIGIL_STAT_DEFINITIONS[statId].label

export const sanitizeSigilState = (state: Pick<GameState, 'sigils'>): SigilState => {
  state.sigils = normalizeSigilState(state.sigils)
  return state.sigils
}

export const getAvailableSigilTier = (state: Pick<GameState, 'sigils'>): SigilTier => resolveSigilTierFromEnemyPower(state.sigils.highestSourcePowerDefeated)

export const getActiveSigilTraitIds = (state: Pick<GameState, 'sigils'>): SigilTraitId[] => {
  const seen = new Set<SigilTraitId>()
  const active: SigilTraitId[] = []
  getEquippedSigils(state).forEach((sigil) => sigil.traitIds.forEach((traitId) => {
    const definition = SIGIL_TRAITS[traitId]
    if (!definition || (definition.unique && seen.has(traitId))) return
    if (definition.unique) seen.add(traitId)
    active.push(traitId)
  }))
  return active
}

export const getSigilSetActivation = (state: Pick<GameState, 'sigils'>, setId: SigilSetId) => {
  const pieces = getEquippedSigilSetCounts(state)[setId] ?? 0
  const definition = SIGIL_SETS[setId]
  return { pieces, active: definition.piecesRequired === 2 ? Math.floor(pieces / 2) > 0 : pieces >= 4, bonusCopies: definition.piecesRequired === 2 ? Math.floor(pieces / 2) : pieces >= 4 ? 1 : 0 }
}

export interface DebugSigilConfiguration {
  secondaryStatIds?: readonly SigilStatId[]
  rollQuality01?: number
  traitIds?: readonly SigilTraitId[]
}

/** Tester-only roll editing. It still applies authored slot, stat, set, and milestone legality. */
export const configureSigilForDebug = (state: GameState, instanceId: string, configuration: DebugSigilConfiguration) => {
  const sigil = state.sigils.storage[instanceId]
  if (!sigil) return false
  if (configuration.secondaryStatIds) {
    const selected = configuration.secondaryStatIds.filter((statId, index, list) => SIGIL_STAT_DEFINITIONS[statId] && statId !== sigil.mainStatId && list.indexOf(statId) === index).slice(0, 4)
    const quality01 = clampSigilRollQuality(configuration.rollQuality01 ?? .5)
    sigil.secondaries = selected.map((statId) => ({ statId, rolls: [{ quality01, rank: 0 }] }))
  } else if (configuration.rollQuality01 !== undefined) {
    const quality01 = clampSigilRollQuality(configuration.rollQuality01)
    sigil.secondaries.forEach((secondary) => secondary.rolls.forEach((roll) => { roll.quality01 = quality01 }))
  }
  if (configuration.traitIds) {
    const traitLimit = sigil.quality === 'legendary' ? sigil.rank >= 20 ? 2 : sigil.rank >= 15 ? 1 : 0 : sigil.quality === 'perfect' && sigil.rank >= 15 ? 1 : 0
    const eligible = new Set(getEligibleSigilTraits(sigil.setId))
    sigil.traitIds = configuration.traitIds.filter((traitId, index, list) => eligible.has(traitId) && list.indexOf(traitId) === index).slice(0, traitLimit)
  }
  return true
}
