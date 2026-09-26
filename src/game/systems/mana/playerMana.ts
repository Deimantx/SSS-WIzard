import { BALANCE } from '../../core/balance/balance'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import { getCombatModifiers } from '../combat/modifiers'
import { getArcaneCoreDynamicManaRegen, getArcaneCoreDynamicManaRegenMultiplier } from '../arcaneCore/arcaneCoreRuntime'
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
  developer: number
  total: number
}

export const getPlayerManaCapacityBreakdown = (state: Pick<GameState, 'player' | 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'debug' | 'arcaneCore'>>): PlayerManaCapacityBreakdown => {
  const equipment = getEquipmentStats(state).maxMana ?? 0
  const equipmentPercent = getEquipmentStats(state).maxManaPct ?? 0
  const developer = state.debug?.bonusMaxManaFlat ?? 0
  const total = Math.floor((state.player.baseMaxMana + equipment + developer) * (1 + equipmentPercent))
  return { base: state.player.baseMaxMana, equipment, equipmentPercent, developer, total }
}

export const getPlayerManaRegenBreakdown = (state: Pick<GameState, 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'player' | 'combat' | 'debug' | 'arcaneCore'>>): PlayerManaRegenBreakdown => {
  const stats = getEquipmentStats(state)
  const base = BALANCE.mana.baseRegenPerSecond
  const equipment = stats.manaRegen ?? 0
  const developer = state.debug?.bonusManaRegenFlat ?? 0
  const combatMultiplier = state.player && state.combat ? Math.max(0, 1 + getCombatModifiers(state as never, 'player', 'mana-regen-percent')) : 1
  const arcaneCore = state.player ? getArcaneCoreDynamicManaRegen(state as never) : 0
  const coreMultiplier = state.player ? getArcaneCoreDynamicManaRegenMultiplier(state as never) : 1
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
