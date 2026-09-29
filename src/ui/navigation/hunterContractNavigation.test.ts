import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { getNavigationIntent, setNavigationIntent } from './navigationIntent'
import { openHunterContractInCombat } from './hunterContractNavigation'

describe('Hunter Contract Combat navigation', () => {
  beforeEach(() => setNavigationIntent({ combatDungeonId: null, combatMonsterId: null }))

  it('opens Gloamridge with an exact active Contract target selected without starting combat', () => {
    const state = createInitialState()
    state.progress.huntersOrder.activeContract = { id: 'nightglass-test', targetSpec: { type: 'monster', monsterId: 'nightglass-alpha' }, target: 1, progress: 0, tier: 'prestigious', reputationReward: 500, marksReward: 12 }
    const setScreen = vi.fn()

    expect(openHunterContractInCombat(state, setScreen)).toBe(true)
    expect(getNavigationIntent()).toMatchObject({ combatDungeonId: 'hunters-ground', combatMonsterId: 'nightglass-alpha' })
    expect(setScreen).toHaveBeenCalledWith('combat')
    expect(state.combat.enemyId).toBeNull()
  })

  it('prefers a requested matching quarry and falls back to the authored deterministic target for a mismatch', () => {
    const state = createInitialState()
    state.progress.huntersOrder.activeContract = { id: 'family-test', targetSpec: { type: 'family', familyId: 'Gloamridge Predators' }, target: 20, progress: 0, tier: 'routine', reputationReward: 100, marksReward: 3 }
    const setScreen = vi.fn()

    openHunterContractInCombat(state, setScreen, 'gloamfang-stalker')
    expect(getNavigationIntent().combatMonsterId).toBe('gloamfang-stalker')
    openHunterContractInCombat(state, setScreen, 'runehorn-brute')
    expect(getNavigationIntent().combatMonsterId).toBe('ashen-tracker')
  })

  it('does not navigate when no Contract is active', () => {
    const state = createInitialState()
    setNavigationIntent({ combatDungeonId: 'whispering-woods', combatMonsterId: 'forest-wisp' })
    const setScreen = vi.fn()

    expect(openHunterContractInCombat(state, setScreen)).toBe(false)
    expect(setScreen).not.toHaveBeenCalled()
    expect(getNavigationIntent()).toMatchObject({ combatDungeonId: 'whispering-woods', combatMonsterId: 'forest-wisp' })
  })
})
