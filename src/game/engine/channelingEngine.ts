import { BALANCE } from '../data/balance'
import { CHANNELING_DISCOVERIES } from '../data/channelingDiscoveries'
import { CHANNELING_UPGRADES, getChannelingRankCost } from '../data/channeling'
import { ITEMS } from '../data/items'
import type { ChannelingDiscoveryId, ChannelingUpgradeId, EquipmentStats, GameState } from '../types'
import { clamp } from '../utils'

export interface ManaRegenBreakdown {
  baseNatural: number
  conduitBonus: number
  stableLeylineBonus: number
  echoBase: number
  echoMultiplier: number
  echoTotal: number
  equipmentBonus: number
  total: number
}

export interface ManaCapacityBreakdown {
  base: number
  reservoirBonus: number
  discoveryBonus: number
  equipmentBonus: number
  total: number
}

const equipmentStatsFor = (state: Pick<GameState, 'equipment'>): EquipmentStats => {
  const total: EquipmentStats = {}
  Object.values(state.equipment).forEach((itemId) => {
    if (!itemId || !ITEMS[itemId]) return
    Object.entries(ITEMS[itemId].stats ?? {}).forEach(([key, value]) => {
      total[key as keyof EquipmentStats] = (total[key as keyof EquipmentStats] ?? 0) + (value ?? 0)
    })
  })
  return total
}

const channelingProgress = (state: Pick<GameState, 'progress'>) => state.progress.channeling

export const getManaCapacityBreakdown = (state: Pick<GameState, 'player' | 'progress' | 'equipment'>): ManaCapacityBreakdown => {
  const progress = channelingProgress(state)
  const stats = equipmentStatsFor(state)
  return {
    base: state.player.baseMaxMana,
    reservoirBonus: progress.manaReservoirRank * BALANCE.channeling.reservoirCapacityPerRank,
    discoveryBonus: progress.discoveries['deep-reservoir'] ? BALANCE.channeling.deepReservoirCapacityBonus : 0,
    equipmentBonus: stats.maxMana ?? 0,
    total: state.player.baseMaxMana + progress.manaReservoirRank * BALANCE.channeling.reservoirCapacityPerRank + (progress.discoveries['deep-reservoir'] ? BALANCE.channeling.deepReservoirCapacityBonus : 0) + (stats.maxMana ?? 0),
  }
}

export const getManaRegenBreakdown = (state: Pick<GameState, 'activities' | 'progress' | 'equipment'>): ManaRegenBreakdown => {
  const progress = channelingProgress(state)
  const stats = equipmentStatsFor(state)
  const echoes = clamp(state.activities.channeling.echoesAssigned, 0, BALANCE.channeling.maxEchoes)
  const echoMultiplier = progress.discoveries['echo-resonance'] ? BALANCE.channeling.discoveryEchoMultiplier : 1
  const echoBase = echoes * BALANCE.channeling.echoManaPerSecond
  const echoTotal = echoBase * echoMultiplier
  const baseNatural = BALANCE.channeling.baseNaturalRegenPerSecond
  const conduitBonus = progress.leylineConduitRank * BALANCE.channeling.conduitManaRegenPerRank
  const stableLeylineBonus = progress.discoveries['stable-leyline'] ? 1 : 0
  const equipmentBonus = stats.manaRegen ?? 0
  return { baseNatural, conduitBonus, stableLeylineBonus, echoBase, echoMultiplier, echoTotal, equipmentBonus, total: baseNatural + conduitBonus + stableLeylineBonus + echoTotal + equipmentBonus }
}

export const manaRegenPerSecond = (state: Pick<GameState, 'activities' | 'progress' | 'equipment'>) => getManaRegenBreakdown(state).total

export const getChannelingUpgradeRank = (state: Pick<GameState, 'progress'>, upgradeId: ChannelingUpgradeId) => upgradeId === 'mana-reservoir' ? state.progress.channeling.manaReservoirRank : state.progress.channeling.leylineConduitRank

export const getChannelingUpgradeCost = (upgradeId: ChannelingUpgradeId, nextRank: number) => CHANNELING_UPGRADES[upgradeId] && getChannelingRankCost(nextRank)

export const checkChannelingDiscoveries = (state: GameState): ChannelingDiscoveryId[] => {
  const channeling = state.progress.channeling
  const newlyCompleted: ChannelingDiscoveryId[] = []
  const conditions: Record<ChannelingDiscoveryId, boolean> = {
    'stable-leyline': channeling.totalManaGenerated >= BALANCE.channeling.stableLeylineThreshold,
    'echo-resonance': channeling.fiveEchoSustainMs >= BALANCE.channeling.echoResonanceDurationMs,
    'deep-reservoir': state.player.maxMana >= BALANCE.channeling.deepReservoirThreshold,
  }
  CHANNELING_DISCOVERIES.forEach(({ id }) => {
    if (!channeling.discoveries[id] && conditions[id]) {
      channeling.discoveries[id] = true
      newlyCompleted.push(id)
    }
  })
  return newlyCompleted
}

export const advanceChanneling = (state: GameState, deltaMs: number) => {
  const delta = Math.max(0, deltaMs)
  const before = state.player.mana
  state.player.mana = clamp(before + manaRegenPerSecond(state) * delta / 1000, 0, state.player.maxMana)
  const gained = state.player.mana - before
  state.progress.channeling.totalManaGenerated += gained
  if (!state.progress.channeling.discoveries['echo-resonance']) {
    state.progress.channeling.fiveEchoSustainMs = state.activities.channeling.echoesAssigned === BALANCE.channeling.maxEchoes
      ? state.progress.channeling.fiveEchoSustainMs + delta
      : 0
  }
  const discoveries = checkChannelingDiscoveries(state)
  return { gained, discoveries }
}

