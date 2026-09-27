import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getGuildRecommendedRequestIds, getGuildRequestPresentation, getGuildRankProgressPresentation } from './guildPresentation'

describe('Guild presentation read model', () => {
  it('prioritizes ready and nearly complete contracts for the overview board', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.requestProgress = { 'thin-the-pack': 30, 'field-supplies': 10, 'den-stalker': 1 }

    expect(getGuildRecommendedRequestIds(state)).toEqual(['thin-the-pack', 'field-supplies'])
    expect(getGuildRequestPresentation(state, 'thin-the-pack')).toMatchObject({ complete: true, percent: 100, remaining: 0 })
  })

  it('exposes promotion readiness without duplicating rank formulas in the screen', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    state.progress.guildReputation = 175
    state.progress.requestClaims = { 'field-supplies': true, 'thin-the-pack': true, 'den-stalker': true }

    expect(getGuildRankProgressPresentation(state)).toMatchObject({ status: 'ready', requirementsComplete: 2, requirementCount: 2 })
  })
})
