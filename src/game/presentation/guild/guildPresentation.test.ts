import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getGuildRecommendedRequestIds, getGuildRequestPresentation, getGuildRankProgressPresentation, getGuildSkillBranchProgress } from './guildPresentation'

describe('Guild presentation read model', () => {
  it('prioritizes ready and nearly complete contracts for the overview board', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.requestProgress = { 'field-supplies': 10 }

    expect(getGuildRecommendedRequestIds(state)).toEqual(['field-supplies'])
    expect(getGuildRequestPresentation(state, 'field-supplies')).toMatchObject({ complete: false, percent: 40, remaining: 15 })
  })

  it('exposes promotion readiness without duplicating rank formulas in the screen', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    state.progress.guildReputation = 175
    state.progress.requestClaims = { 'field-supplies': true }

    expect(getGuildRankProgressPresentation(state)).toMatchObject({ status: 'ready', requirementsComplete: 2, requirementCount: 2 })
  })

  it('exposes authored skill branch progress for the overview summary', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['hunter-arcane-quarry'] = 1

    expect(getGuildSkillBranchProgress(state, 'hunter')).toEqual({ purchased: 1, total: 4 })
    expect(getGuildSkillBranchProgress(state, 'tower')).toEqual({ purchased: 0, total: 4 })
  })
})
