import { BALANCE } from '../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../content/channeling/channelingDiscoveries'
import { ITEMS } from '../content/items/items'
import { MANA_PILLARS } from '../content/channeling/manaPillars'
import type { ChannelingDiscoveryId, EquipmentStats, GameState, ManaPillarId } from '../types'
import { clamp } from '../utils'

export interface ManaRegenBreakdown {
  baseNatural: number
  leylineConduitBonus: number
  stableLeylineBonus: number
  equipmentPassiveBonus: number
  developerBonus: number
  passiveBeforeResonance: number
  manaResonanceMultiplier: number
  passiveAfterResonance: number
  echoBase: number
  echoAttunementMultiplier: number
  echoDiscoveryMultiplier: number
  echoTotal: number
  total: number
}

export interface ManaCapacityBreakdown {
  base: number
  arcaneReservoirBonus: number
  deepReservoirBonus: number
  equipmentBonus: number
  futureFlatBonus: number
  developerCapacityBonus: number
  preAmplification: number
  astralExpansionMultiplier: number
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

const pillarLevel = (state: Pick<GameState, 'progress'>, id: ManaPillarId) => Math.max(0, Math.min(10, state.progress.channeling.pillars[id]?.level ?? 0))

export const getManaPillarLevel = (state: Pick<GameState, 'progress'>, id: ManaPillarId) => pillarLevel(state, id)

export const getManaCapacityBreakdown = (state: Pick<GameState, 'player' | 'progress' | 'equipment'> & Partial<Pick<GameState, 'debug'>>): ManaCapacityBreakdown => {
  const stats = equipmentStatsFor(state)
  const arcaneReservoirBonus = pillarLevel(state, 'arcane-reservoir') * 25
  const deepReservoirBonus = state.progress.channeling.discoveries['deep-reservoir'] ? BALANCE.channeling.deepReservoirCapacityBonus : 0
  const equipmentBonus = stats.maxMana ?? 0
  const futureFlatBonus = 0
  const developerCapacityBonus = state.debug?.bonusMaxManaFlat ?? 0
  const preAmplification = state.player.baseMaxMana + arcaneReservoirBonus + deepReservoirBonus + equipmentBonus + futureFlatBonus + developerCapacityBonus
  const astralExpansionMultiplier = 1 + pillarLevel(state, 'astral-expansion') * 0.05
  return {
    base: state.player.baseMaxMana,
    arcaneReservoirBonus,
    deepReservoirBonus,
    equipmentBonus,
    futureFlatBonus,
    preAmplification,
    astralExpansionMultiplier,
    developerCapacityBonus,
    total: Math.floor(preAmplification * astralExpansionMultiplier),
  }
}

export const getManaRegenBreakdown = (state: Pick<GameState, 'activities' | 'progress' | 'equipment'> & Partial<Pick<GameState, 'debug'>>): ManaRegenBreakdown => {
  const stats = equipmentStatsFor(state)
  const echoes = state.debug?.ignoreEchoLimit ? Math.max(0, state.activities.channeling.echoesAssigned) : clamp(state.activities.channeling.echoesAssigned, 0, BALANCE.channeling.maxEchoes)
  const baseNatural = BALANCE.channeling.baseNaturalRegenPerSecond
  const leylineConduitBonus = pillarLevel(state, 'leyline-conduit')
  const stableLeylineBonus = state.progress.channeling.discoveries['stable-leyline'] ? BALANCE.channeling.stableLeylineRegenBonus : 0
  const equipmentPassiveBonus = stats.manaRegen ?? 0
  const developerBonus = state.debug?.bonusManaRegenFlat ?? 0
  const passiveBeforeResonance = baseNatural + leylineConduitBonus + stableLeylineBonus + equipmentPassiveBonus + developerBonus
  const manaResonanceMultiplier = 1 + pillarLevel(state, 'mana-resonance') * 0.05
  const passiveAfterResonance = passiveBeforeResonance * manaResonanceMultiplier
  const echoBase = echoes * BALANCE.channeling.echoManaPerSecond
  const echoAttunementMultiplier = 1 + pillarLevel(state, 'echo-attunement') * 0.05
  const echoDiscoveryMultiplier = state.progress.channeling.discoveries['echo-resonance'] ? BALANCE.channeling.discoveryEchoMultiplier : 1
  const echoTotal = echoBase * echoAttunementMultiplier * echoDiscoveryMultiplier
  return { baseNatural, leylineConduitBonus, stableLeylineBonus, equipmentPassiveBonus, developerBonus, passiveBeforeResonance, manaResonanceMultiplier, passiveAfterResonance, echoBase, echoAttunementMultiplier, echoDiscoveryMultiplier, echoTotal, total: passiveAfterResonance + echoTotal }
}

export const manaRegenPerSecond = (state: Pick<GameState, 'activities' | 'progress' | 'equipment'> & Partial<Pick<GameState, 'debug'>>) => getManaRegenBreakdown(state).total

export const getManaPillarDefinition = (id: ManaPillarId) => MANA_PILLARS[id]

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
  const generated = manaRegenPerSecond(state) * delta / 1000
  state.player.mana = state.debug.allowManaOverCap
    ? Math.max(0, before + generated)
    : clamp(before + generated, 0, state.player.maxMana)
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
