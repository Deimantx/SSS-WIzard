import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { canPromoteGuild, promoteGuild, purchaseGuildSkillNode, resetGuildSkillTree } from './guildRuntime'
import { getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildProgressionBonuses, getGuildPromotionProgress } from './guildSelectors'
import { GUILD_COMMISSION_TEMPLATES } from '../../content/guild/guildRequests'

describe('Guild progression runtime', () => {
  it('promotes on authored reputation thresholds and awards advancement points', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    state.progress.guildReputation = 175
    state.progress.requestClaims = { 'field-supplies': true, 'thin-the-pack': true, 'den-stalker': true }
    state.progress.guildPointsEarned = 11
    expect(canPromoteGuild(state)).toBe(true)
    expect(promoteGuild(state)).toBe(true)
    expect(state.progress.guildRank).toBe('apprentice')
    expect(state.progress.guildPointsEarned).toBe(21)
    expect(state.progress.permanentManaBonuses['guild-apprentice']).toBeUndefined()
  })

  it('funds every authored Advancement Board purchase from bounded one-time sources', () => {
    const economy = getGuildAdvancementPointEconomy()
    expect(economy.totalBoardPointCost).toBe(62)
    expect(economy.maxBoundedPoints).toBe(economy.totalBoardPointCost)
    expect(economy.pointsByRank).toEqual({ outsider: 15, initiate: 16, apprentice: 27, adept: 40, magister: 52, 'circle-master': 62 })
    expect(economy.majorMilestones).toEqual([
      { threshold: 10, pointsRequired: 11, reachableAtRank: 'outsider' },
      { threshold: 20, pointsRequired: 21, reachableAtRank: 'apprentice' },
      { threshold: 30, pointsRequired: 31, reachableAtRank: 'adept' },
      { threshold: 40, pointsRequired: 41, reachableAtRank: 'magister' },
      { threshold: 50, pointsRequired: 51, reachableAtRank: 'magister' },
      { threshold: 60, pointsRequired: 61, reachableAtRank: 'circle-master' },
    ])
    for (const threshold of economy.majorThresholds) expect(economy.maxBoundedPoints).toBeGreaterThanOrEqual(threshold + 1)
    expect(GUILD_COMMISSION_TEMPLATES.every((template) => template.baseAdvancementPoints === 0)).toBe(true)
  })

  it('enforces sequential skill nodes and exposes the authored bonus vector', () => {
    const state = createInitialState()
    state.progress.guildPointsEarned = 2
    expect(purchaseGuildSkillNode(state, 'hunter-resonant-pursuit')).toBe(false)
    expect(purchaseGuildSkillNode(state, 'hunter-arcane-quarry')).toBe(true)
    expect(purchaseGuildSkillNode(state, 'hunter-resonant-pursuit')).toBe(true)
    expect(getGuildPointsAvailable(state)).toBe(0)
    expect(getGuildProgressionBonuses(state).researchSpeedMultiplier).toBe(1.005)
    expect(getGuildProgressionBonuses(state).researchXpMultiplier).toBe(1.01)
    expect(getGuildProgressionBonuses(state).combatArcanePointMultiplier).toBe(1)
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
    expect(promotion.contractClaims).toBe(1)
    expect(promotion.eligible).toBe(true)
    expect(canPromoteGuild(state)).toBe(true)
  })
})
