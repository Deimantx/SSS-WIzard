import { describe, expect, it } from 'vitest'
import { navigationGroups, isNavigationItemVisible, isScreenNavigationAllowed } from './navigation'
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

describe('Crystal navigation visibility', () => {
  const crystalItem = navigationGroups.flatMap((group) => group.items).find((item) => item.id === 'crystals')!

  it('hides Crystals before Meridian Splitter evidence and reveals it after', () => {
    const state = createInitialState()
    expect(isNavigationItemVisible(crystalItem, state)).toBe(false)
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    expect(isNavigationItemVisible(crystalItem, state)).toBe(true)
  })

  it('places Arcane Guild and gated Hunter’s Order under Progression', () => {
    const world = navigationGroups.find((group) => group.id === 'world')!
    expect(world.items.map((item) => item.id)).toEqual(['arcane-guild', 'hunters-order'])
    const state = createInitialState()
    expect(isNavigationItemVisible(world.items[1], state)).toBe(false)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isNavigationItemVisible(world.items[1], state)).toBe(true)
  })
})

describe('Artificing navigation visibility', () => {
  const artificingItem = navigationGroups.flatMap((group) => group.items).find((item) => item.id === 'tower-artificing')!

  it.each([
    ['choose-school', false],
    ['combat', false],
    ['first-kill', true],
    ['tower-work', true],
    ['channeling', true],
    ['transmutation', true],
    ['research', true],
    ['complete', true],
  ] as const)('is %s %s', (tutorialStage, visible) => {
    const state = createInitialState()
    state.progress.tutorialStage = tutorialStage
    expect(isNavigationItemVisible(artificingItem, state)).toBe(visible)
    expect(isScreenNavigationAllowed(state, 'tower-artificing')).toBe(visible)
  })
})
