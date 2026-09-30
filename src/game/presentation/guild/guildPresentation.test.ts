import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getGuildRecommendedRequestIds, getGuildRequestPresentation, getGuildRankProgressPresentation, getGuildSkillBranchProgress, formatGuildCommissionObjective } from './guildPresentation'
import type { GuildCommissionState } from '../../types'

describe('Guild presentation read model', () => {
  it('formats Production and Mixed objectives using the shared category labels', () => {
    const production: GuildCommissionState = { id: 'p', templateId: 'produce-water-fragments', category: 'production', quality: 'routine', objectives: [{ kind: 'production', itemId: 'water-fragment', target: 12, progress: 0 }], reputationReward: 10, advancementPointReward: 0 }
    const mixed: GuildCommissionState = { id: 'm', templateId: 'mixed-materials-research', category: 'mixed', quality: 'special', objectives: [{ kind: 'item-supply', itemId: 'life-essence', target: 12, progress: 0 }, { kind: 'research', target: 3, progress: 0 }], reputationReward: 10, advancementPointReward: 0 }
    expect(formatGuildCommissionObjective(production)).toBe('Produce 12 Water Fragment')
    expect(formatGuildCommissionObjective(mixed)).toBe('Deliver 12 Life Essence + Complete 3 Research cycles')
  })

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
    state.progress.guildReputation = 1500
    state.progress.arcaneGuild.completedCommissions = 5

    expect(getGuildRankProgressPresentation(state)).toMatchObject({ status: 'ready', requirementsComplete: 2, requirementCount: 2 })
  })

  it('exposes authored skill branch progress for the overview summary', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['scholarship-measured-inquiry'] = 1

    expect(getGuildSkillBranchProgress(state, 'scholarship')).toEqual({ purchased: 1, total: 6 })
    expect(getGuildSkillBranchProgress(state, 'tower-operations')).toEqual({ purchased: 0, total: 6 })
  })
})
