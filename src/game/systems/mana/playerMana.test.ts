import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getPlayerManaCapacityBreakdown } from './playerMana'

describe('Player Mana capacity', () => {
  it('reports Developer flat and percentage contributions separately', () => {
    const state = createInitialState()
    state.debug.playerStats.maxManaFlat = 20
    state.debug.playerStats.maxManaPercent = 0.5

    expect(getPlayerManaCapacityBreakdown(state)).toMatchObject({ developerFlat: 20, developerPercent: 0.5 })
    expect(getPlayerManaCapacityBreakdown(state).total).toBe(Math.floor((state.player.baseMaxMana + 20) * 1.5))
  })
})
