import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceArcaneFlux, getArcaneFluxProductionPerSecond } from './channelingRuntime'
import { advancePlayerMana } from '../mana/playerMana'
import { getManaCapacityBreakdown } from '../../engine/channelingEngine'

describe('Arcane Flux and Player Mana separation', () => {
  it('generates Flux from Channeling Acolytes and clamps at capacity', () => {
    const state = createInitialState()
    state.activities.channeling.acolytesAssigned = 2

    expect(getArcaneFluxProductionPerSecond(state).total).toBe(4)
    advanceArcaneFlux(state, 1000)
    expect(state.tower.resources.arcaneFlux).toBe(4)

    state.tower.resources.arcaneFlux = 499
    advanceArcaneFlux(state, 1000)
    expect(state.tower.resources.arcaneFlux).toBe(500)
  })

  it('regenerates Player Mana with zero Channeling Acolytes', () => {
    const state = createInitialState()
    state.player.mana = 0
    state.activities.channeling.acolytesAssigned = 0

    advancePlayerMana(state, 1000)

    expect(state.player.mana).toBe(10)
    expect(state.tower.resources.arcaneFlux).toBe(0)
  })

  it('shows Developer Max Mana percentage as a distinct capacity contribution', () => {
    const state = createInitialState()
    state.debug.playerStats.maxManaFlat = 25
    state.debug.playerStats.maxManaPercent = 0.5

    expect(getManaCapacityBreakdown(state)).toMatchObject({ developerCapacityBonus: 25, developerCapacityPercent: 0.5 })
    expect(getManaCapacityBreakdown(state).total).toBe(Math.floor((state.player.baseMaxMana + 25) * 1.5))
  })
})
