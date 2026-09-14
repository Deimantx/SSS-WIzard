import { describe, expect, it } from 'vitest'
import { navigationGroups, isNavigationItemVisible } from './navigation'
import { SUMMONING_UNLOCK_BOSS_ID } from '../game/content/guardians/guardians'
import { createInitialState } from '../store/initialState'

describe('Summoning navigation visibility', () => {
  const summoningItem = navigationGroups.flatMap((group) => group.items).find((item) => item.id === 'tower-summoning')!

  it('does not render Summoning before the Gatekeeper completion record exists', () => {
    const state = createInitialState()
    expect(isNavigationItemVisible(summoningItem, state)).toBe(false)
  })

  it('reveals Summoning from the same canonical completion record', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID] = 1
    expect(isNavigationItemVisible(summoningItem, state)).toBe(true)
  })
})
