import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getBestiaryEntryPresentation } from './bestiaryEntryPresentation'

describe('Bestiary entry presentation', () => {
  it('hides combat details for an undiscovered quarry', () => {
    const entry = getBestiaryEntryPresentation(createInitialState(), 'nightglass-alpha')
    expect(entry).toMatchObject({ name: 'Unknown Quarry', discovered: false, locations: ['Gloamridge'], defeats: null, combat: null, roleTags: [] })
  })

  it('uses authored Hunter metadata and current contract relation after discovery', () => {
    const state = createInitialState()
    state.progress.discoveredMonsters = ['nightglass-alpha']
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    state.progress.huntersOrder.reputation = 32500
    state.progress.huntersOrder.activeContract = { id: 'prestige-family', targetSpec: { type: 'family', familyId: 'Gloamridge Predators' }, target: 150, progress: 0, tier: 'prestigious', reputationReward: 500, marksReward: 5 }
    const entry = getBestiaryEntryPresentation(state, 'nightglass-alpha')
    expect(entry).toMatchObject({ name: 'Nightglass Alpha', family: 'Gloamridge Predators', hunter: { tier: 'prestigious', minimumRank: 'master-hunter', relation: 'eligible', authorization: { authorized: true } } })
  })
})
