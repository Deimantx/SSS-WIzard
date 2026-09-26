import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { canPromoteGuild, promoteGuild, purchaseGuildSkillNode, resetGuildSkillTree } from './guildRuntime'
import { getGuildPointsAvailable, getGuildProgressionBonuses, getGuildPromotionProgress } from './guildSelectors'

describe('Guild progression runtime', () => {
  it('promotes after any three claimed requests and awards one promotion point', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    state.progress.guildReputation = 175
    state.progress.requestClaims = { 'field-supplies': true, 'thin-the-pack': true, 'den-stalker': true }
    state.progress.guildPointsEarned = 3
    expect(canPromoteGuild(state)).toBe(true)
    expect(promoteGuild(state)).toBe(true)
    expect(state.progress.guildRank).toBe('apprentice')
    expect(state.progress.guildPointsEarned).toBe(4)
    expect(state.progress.permanentManaBonuses['guild-apprentice']).toBeUndefined()
  })

  it('enforces sequential skill nodes and exposes the authored bonus vector', () => {
    const state = createInitialState()
    state.progress.guildPointsEarned = 2
    expect(purchaseGuildSkillNode(state, 'hunter-resonant-pursuit')).toBe(false)
    expect(purchaseGuildSkillNode(state, 'hunter-arcane-quarry')).toBe(true)
    expect(purchaseGuildSkillNode(state, 'hunter-resonant-pursuit')).toBe(true)
    expect(getGuildPointsAvailable(state)).toBe(0)
    expect(getGuildProgressionBonuses(state).combatArcanePointMultiplier).toBe(1.05)
    expect(getGuildProgressionBonuses(state).combatResonanceMultiplier).toBe(1.05)
  })

  it('blocks respec while Expanded Quarters would strand an Acolyte', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['tower-expanded-quarters'] = 1
    state.activities.channeling.acolytesAssigned = state.tower.acolytes.base + 1
    expect(resetGuildSkillTree(state)).toEqual({ ok: false, reason: 'Unassign an Acolyte before removing Expanded Quarters.' })
  })

  it('uses authored rank definitions for later promotions', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'apprentice'
    state.progress.guildReputation = 600
    state.progress.requestClaims = { 'field-supplies': true, 'thin-the-pack': true, 'den-stalker': true, 'greatbear-contract': true }
    state.progress.requestProgress = { 'arcane-supply': 20, 'clear-the-woods': 30 }
    state.progress.chronicle.completedObjectiveIds = ['m5-fallen-archmage']
    const promotion = getGuildPromotionProgress(state)
    expect(promotion.nextRank?.id).toBe('adept')
    expect(promotion.contractClaims).toBe(6)
    expect(promotion.eligible).toBe(true)
    expect(canPromoteGuild(state)).toBe(true)
  })
})
