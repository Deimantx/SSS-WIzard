import { FOCUS_IMPROVEMENT, getFocusImprovementBonus } from '../../content/focus/focusImprovement'
import { ITEMS } from '../../content/items/items'
import type { GameState } from '../../types'

export interface FocusCapacityBreakdown {
  base: number
  improvement: number
  permanentRewards: number
  equipment: number
  debug: number
  total: number
}

type FocusCapacityState = Pick<GameState, 'player' | 'progress' | 'equipment' | 'debug'>

const getEquipmentFocus = (state: Pick<GameState, 'equipment'>) => Object.values(state.equipment).reduce((total, itemId) => total + (itemId ? ITEMS[itemId]?.stats?.maxFocus ?? 0 : 0), 0)

/** The single authoritative breakdown used by derived stats and Focus UI. */
export const getFocusCapacityBreakdown = (state: FocusCapacityState, options: { improvementLevel?: number } = {}): FocusCapacityBreakdown => {
  const improvementLevel = options.improvementLevel ?? state.progress.focusImprovement.level
  const base = Math.max(0, state.player.baseMaxFocus)
  const improvement = getFocusImprovementBonus(improvementLevel)
  const permanentRewards = Object.values(state.progress.permanentFocusBonuses).reduce((sum, value) => sum + Math.max(0, value), 0)
  const equipment = getEquipmentFocus(state)
  const debug = state.debug.bonusMaxFocusFlat
  return { base, improvement, permanentRewards, equipment, debug, total: Math.max(0, base + improvement + permanentRewards + equipment + debug) }
}

export const getFocusCapacityAtImprovementLevel = (state: FocusCapacityState, level: number) => getFocusCapacityBreakdown(state, { improvementLevel: Math.max(0, Math.min(FOCUS_IMPROVEMENT.maxLevel, Math.floor(level))) }).total
