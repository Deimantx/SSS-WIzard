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

describe('Crystal navigation visibility', () => {
  const crystalItem = navigationGroups.flatMap((group) => group.items).find((item) => item.id === 'crystals')!

  it('hides Crystals before Meridian Splitter evidence and reveals it after', () => {
    const state = createInitialState()
    expect(isNavigationItemVisible(crystalItem, state)).toBe(false)
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    expect(isNavigationItemVisible(crystalItem, state)).toBe(true)
  })

  it('keeps Collection and Bestiary under World', () => {
    const world = navigationGroups.find((group) => group.id === 'world')!
    const hero = navigationGroups.find((group) => group.id === 'hero')!
    expect(world.items.map((item) => item.id)).toContain('collection')
    expect(world.items.map((item) => item.id)).toContain('bestiary')
    expect(hero.items.map((item) => item.id)).not.toContain('collection')
    expect(hero.items.map((item) => item.id)).not.toContain('bestiary')
  })
})
