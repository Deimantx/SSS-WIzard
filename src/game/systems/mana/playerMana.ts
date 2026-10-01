import { BALANCE } from '../../core/balance/balance'
import { getPlayerBuildStaticStats } from '../../core/equipment/equipmentStats'
import { getCombatModifiers } from '../combat/modifiers'
import { getArcaneCoreManaRegenMultiplier } from '../arcane-core/arcaneCoreRuntime'
import type { GameState } from '../../types'
import { clamp } from '../../utils'
import { stabilizeResourceValue } from '../../presentation/resources/resourcePresentation'

export interface PlayerManaRegenBreakdown {
  base: number
  equipment: number
  developer: number
  combatMultiplier: number
  arcaneCore: number
  total: number
}

export interface PlayerManaCapacityBreakdown {
  base: number
  equipment: number
  equipmentPercent: number
  developerFlat: number
  developerPercent: number
  total: number
}

export const getPlayerManaCapacityBreakdown = (state: Pick<GameState, 'player' | 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'debug' | 'arcaneCore'>>): PlayerManaCapacityBreakdown => {
  const equipment = getPlayerBuildStaticStats(state).maxMana ?? 0
  const equipmentPercent = getPlayerBuildStaticStats(state).maxManaPct ?? 0
  const developerFlat = state.debug?.playerStats?.maxManaFlat ?? 0
  const permanent = Object.values((state as Partial<GameState>).progress?.permanentManaBonuses ?? {}).reduce((sum, value) => sum + Math.max(0, value), 0)
  const developerPercent = state.debug?.playerStats?.maxManaPercent ?? 0
  const total = Math.max(0, Math.floor((state.player.baseMaxMana + equipment + developerFlat + permanent) * (1 + equipmentPercent + developerPercent)))
  return { base: state.player.baseMaxMana, equipment, equipmentPercent, developerFlat, developerPercent, total }
}

export const getPlayerManaRegenBreakdown = (state: Pick<GameState, 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'player' | 'combat' | 'debug' | 'arcaneCore'>>): PlayerManaRegenBreakdown => {
  const stats = getPlayerBuildStaticStats(state)
  const base = BALANCE.mana.baseRegenPerSecond
  const equipment = stats.manaRegen ?? 0
  const developer = state.debug?.playerStats?.manaRegenFlat ?? 0
  const combatMultiplier = state.player && state.combat ? Math.max(0, 1 + getCombatModifiers(state as never, 'player', 'mana-regen-percent')) : 1
  const arcaneCore = 0
  const coreMultiplier = state.player ? getArcaneCoreManaRegenMultiplier(state as never) : 1
  return { base, equipment, developer, combatMultiplier, arcaneCore, total: Math.max(0, (base + equipment + developer + arcaneCore) * combatMultiplier * coreMultiplier) }
}

export const playerManaRegenPerSecond = (state: Parameters<typeof getPlayerManaRegenBreakdown>[0]) => getPlayerManaRegenBreakdown(state).total

export const advancePlayerMana = (state: GameState, deltaMs: number, regenOverride?: number) => {
  const delta = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0)
  const before = state.player.mana
  const capacity = state.player.maxMana
  const generated = Math.max(0, regenOverride ?? playerManaRegenPerSecond(state)) * delta / 1000
  state.player.mana = stabilizeResourceValue(state.debug.allowManaOverCap ? Math.max(0, before + generated) : clamp(before + generated, 0, capacity))
  return { gained: state.player.mana - before }
}
