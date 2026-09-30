import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { canPromoteGuild, promoteGuild, purchaseGuildSkillNode, resetGuildSkillTree } from './guildRuntime'
import { getGuildAdvancementPointEconomy, getGuildCommissionChoiceCount, getGuildPointsAvailable, getGuildProgressionBonuses, getGuildPromotionProgress } from './guildSelectors'
import { GUILD_COMMISSION_TEMPLATES } from '../../content/guild/guildRequests'
import { ARCANE_REGISTRY_SETS } from '../../content/guild/registry/registrySets'
import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'
import { GUILD_SKILL_NODES, GUILD_MAJOR_PROGRAM_IDS, GUILD_REGULAR_PROGRAM_IDS } from '../../content/guild/guildSkills'
import { GUILD_STANDINGS, getGuildStanding } from '../../content/guild/guildStandings'
import { GUILD_RANKS } from '../../content/guild/guildRanks'
import { GUILD_FACILITIES } from '../../content/guild/guildFacilities'
import { ITEMS } from '../../content/items/items'
import { reconcileArcaneRegistrySets } from './arcaneRegistry'

describe('Guild progression runtime', () => {
  it('promotes on authored macro-standing requirements and awards eight advancement points', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    state.progress.guildReputation = 6000
    state.progress.arcaneGuild.completedCommissions = 5
    state.progress.guildPointsEarned = 11
    expect(canPromoteGuild(state)).toBe(true)
    expect(promoteGuild(state)).toBe(true)
    expect(state.progress.guildRank).toBe('apprentice')
    expect(state.progress.guildPointsEarned).toBe(19)
    expect(state.progress.permanentManaBonuses['guild-apprentice']).toBeUndefined()
  })

  it('funds every authored Advancement Board purchase from bounded one-time sources', () => {
    const economy = getGuildAdvancementPointEconomy()
    expect(economy.totalBoardPointCost).toBe(104)
    expect(economy.maxBoundedPoints).toBe(economy.totalBoardPointCost)
    expect(economy.sources).toEqual({ promotions: 32, registrySets: 40, projects: 17, studies: 15 })
    expect(economy.regularCost).toBe(96)
    expect(economy.majorCost).toBe(8)
    expect(economy.majorThresholds).toEqual([10, 20, 30, 42, 54, 66, 80, 94])
    expect(economy.majorMilestones.every((milestone) => milestone.reachableAtRank !== null)).toBe(true)
    for (const threshold of economy.majorThresholds) expect(economy.maxBoundedPoints).toBeGreaterThanOrEqual(threshold + 1)
    expect(GUILD_COMMISSION_TEMPLATES.every((template) => template.baseAdvancementPoints === 0)).toBe(true)
    expect(GUILD_COMMISSION_TEMPLATES).toHaveLength(36)
    expect(GUILD_COMMISSION_TEMPLATES.every((template) => Boolean(template.minimumStandingId))).toBe(true)
    expect(Object.fromEntries(['supply', 'channeling', 'production', 'research', 'transmutation', 'mixed'].map((category) => [category, GUILD_COMMISSION_TEMPLATES.filter((template) => template.category === category).length]))).toEqual({ supply: 6, channeling: 6, production: 6, research: 6, transmutation: 6, mixed: 6 })
    expect(GUILD_STANDINGS.map((standing) => standing.reputation)).toEqual([0, 1000, 2000, 3000, 4000, 6000, 8800, 11600, 14400, 17200, 20800, 26000, 31200, 36400, 41600, 48000, 58000, 68000, 78000, 88000, 100000, 124000, 148000, 176000, 208000])
    expect(GUILD_COMMISSION_CHAINS).toHaveLength(15)
    expect(GUILD_PROJECTS).toHaveLength(17)
    expect(Object.fromEntries(GUILD_FACILITIES.map((facility) => [facility.id, GUILD_PROJECTS.filter((project) => project.facilityId === facility.id).length]))).toEqual({ archive: 3, 'research-wing': 3, 'transmutation-hall': 3, 'leyline-annex': 3, 'acolyte-quarters': 2, 'commission-office': 3 })
    expect(ARCANE_REGISTRY_SETS).toHaveLength(20)
    expect(ARCANE_REGISTRY_SETS.every((set) => set.entryIds.length > 0 && set.entryIds.every((itemId) => Boolean(ITEMS[itemId])))).toBe(true)
    expect(GUILD_REGULAR_PROGRAM_IDS).toHaveLength(24)
    expect(GUILD_MAJOR_PROGRAM_IDS).toHaveLength(8)
    expect(Object.values(GUILD_SKILL_NODES).filter((node) => !node.legacy).reduce((sum, node) => sum + node.maxRank, 0)).toBe(104)
  })

  it('derives all 25 Guild Standing boundaries from canonical Reputation', () => {
    expect(GUILD_STANDINGS).toHaveLength(25)
    for (let index = 0; index < GUILD_STANDINGS.length; index += 1) {
      const standing = GUILD_STANDINGS[index]
      expect(getGuildStanding(standing.reputation)).toBe(standing)
      if (index > 0) expect(getGuildStanding(standing.reputation - 1)).toBe(GUILD_STANDINGS[index - 1])
    }
    expect(getGuildStanding(52_000)).toBe(GUILD_STANDINGS[15])
    expect(getGuildStanding(99_999)).toBe(GUILD_STANDINGS[19])
    expect(getGuildStanding(208_000)).toBe(GUILD_STANDINGS[24])
    expect(GUILD_STANDINGS.map((standing) => standing.reputation)).toEqual([0, 1000, 2000, 3000, 4000, 6000, 8800, 11600, 14400, 17200, 20800, 26000, 31200, 36400, 41600, 48000, 58000, 68000, 78000, 88000, 100000, 124000, 148000, 176000, 208000])
    expect(GUILD_RANKS.filter((rank) => rank.promotion).map((rank) => rank.promotion!.reputation)).toEqual([0, 6000, 20800, 48000, 100000])
  })

  it('keeps fully registered Sets locked until their authored Standing gate', () => {
    const state = createInitialState()
    const set = ARCANE_REGISTRY_SETS.find((entry) => entry.minimumStandingId === 'circle-master-5')!
    state.progress.arcaneRegistry.registeredEntries = Object.fromEntries(set.entryIds.map((itemId) => [itemId, 1]))
    expect(reconcileArcaneRegistrySets(state)).toBe(0)
    expect(state.progress.arcaneRegistry.completedSetIds).not.toContain(set.id)
    state.progress.guildReputation = GUILD_STANDINGS.find((entry) => entry.id === set.minimumStandingId)!.reputation
    expect(reconcileArcaneRegistrySets(state)).toBeGreaterThan(0)
    expect(state.progress.arcaneRegistry.completedSetIds).toContain(set.id)
  })

  it('scales Commission Board choice breakpoints with canonical Standing', () => {
    const state = createInitialState()
    state.progress.guildReputation = 11599
    expect(getGuildCommissionChoiceCount(state)).toBe(3)
    state.progress.guildReputation = 11600
    expect(getGuildCommissionChoiceCount(state)).toBe(4)
    state.progress.guildReputation = 67999
    expect(getGuildCommissionChoiceCount(state)).toBe(4)
    state.progress.guildReputation = 68000
    expect(getGuildCommissionChoiceCount(state)).toBe(5)
    state.progress.guildSkillNodeRanks['major-favored-contractor'] = 1
    expect(getGuildCommissionChoiceCount(state)).toBe(6)
  })

  it('applies independent Scholarship ranks through the canonical bonus vector', () => {
    const state = createInitialState()
    state.progress.guildPointsEarned = 2
    state.progress.guildReputation = 2000
    expect(purchaseGuildSkillNode(state, 'scholarship-peer-review')).toBe(true)
    expect(purchaseGuildSkillNode(state, 'scholarship-measured-inquiry')).toBe(true)
    expect(getGuildPointsAvailable(state)).toBe(0)
    expect(getGuildProgressionBonuses(state).researchSpeedMultiplier).toBe(1.0075)
    expect(getGuildProgressionBonuses(state).researchXpMultiplier).toBe(1.015)
    expect(getGuildProgressionBonuses(state).combatArcanePointMultiplier).toBe(1)
  })

  it('gates each regular program on its Reputation-derived Guild Standing', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildPointsEarned = 2
    expect(GUILD_REGULAR_PROGRAM_IDS.map((id) => GUILD_SKILL_NODES[id].minimumStandingId)).toEqual(GUILD_STANDINGS.slice(1).map((standing) => standing.id))
    expect(purchaseGuildSkillNode(state, 'scholarship-measured-inquiry')).toBe(false)
    state.progress.guildReputation = 1000
    expect(purchaseGuildSkillNode(state, 'scholarship-measured-inquiry')).toBe(true)
    expect(purchaseGuildSkillNode(state, 'scholarship-peer-review')).toBe(false)
  })

  it('blocks respec while Expanded Quarters would strand an Acolyte', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['tower-expanded-quarters'] = 1
    state.activities.channeling.acolytesAssigned = state.tower.acolytes.base + 1
    expect(resetGuildSkillTree(state)).toEqual({ ok: false, reason: 'Unassign an Acolyte before removing Expanded Quarters.' })
  })

  it('keeps the same Acolyte safety rule for the V4 Expanded Quarters Major', () => {
    const state = createInitialState()
    state.progress.guildSkillNodeRanks['major-expanded-quarters'] = 1
    state.activities.channeling.acolytesAssigned = state.tower.acolytes.base + 1
    expect(resetGuildSkillTree(state)).toEqual({ ok: false, reason: 'Unassign an Acolyte before removing Expanded Quarters.' })
  })

  it('uses authored rank definitions for later promotions', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'apprentice'
    state.progress.guildReputation = 20800
    state.progress.arcaneRegistry.completedSetIds = ['ember-fundamentals']
    state.progress.arcaneGuild.completedChainIds = ['study-ember-resonance']
    const promotion = getGuildPromotionProgress(state)
    expect(promotion.nextRank?.id).toBe('adept')
    expect(promotion.contractClaims).toBe(0)
    expect(promotion.eligible).toBe(true)
    expect(canPromoteGuild(state)).toBe(true)
  })
})
