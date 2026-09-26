import { BALANCE } from '../../core/balance/balance'
import type { GameState } from '../../types'
import { getGuildProgressionBonuses } from '../guild/guildSelectors'

export interface AcolyteCapacityBreakdown {
  base: number
  permanentBonuses: number
  developerBonus: number
  guildBonus: number
  override: number | null
  total: number
}

export const getAcolyteCapacityBreakdown = (state: Pick<GameState, 'tower'> & Partial<Pick<GameState, 'debug' | 'progress'>>): AcolyteCapacityBreakdown => {
  const roster = state.tower?.acolytes
  const base = Math.max(0, Math.floor(roster?.base ?? BALANCE.acolytes.startingCount))
  const permanentBonuses = Object.values(roster?.permanentBonuses ?? {}).reduce((sum, value) => sum + Math.max(0, Math.floor(Number.isFinite(value) ? value : 0)), 0)
  const developerBonus = Math.max(0, Math.floor(state.debug?.bonusAcolytes ?? 0))
  const guildBonus = state.progress ? getGuildProgressionBonuses({ progress: state.progress }).bonusAcolytes : 0
  const override = state.debug?.acolyteTotalOverride === null || state.debug?.acolyteTotalOverride === undefined
    ? null
    : Math.max(0, Math.floor(state.debug.acolyteTotalOverride))
  const total = override ?? base + permanentBonuses + developerBonus + guildBonus
  return { base, permanentBonuses, developerBonus, guildBonus, override, total }
}

export const selectTotalAcolytes = (state: Pick<GameState, 'tower'> & Partial<Pick<GameState, 'debug'>>) => getAcolyteCapacityBreakdown(state).total
