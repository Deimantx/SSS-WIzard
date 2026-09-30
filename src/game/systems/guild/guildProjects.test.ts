import { describe, expect, it } from 'vitest'
import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { createInitialState } from '../../../store/initialState'
import { contributeGuildProject, getGuildProjectStatus, debugCompleteGuildProjectPrerequisites } from './guildProjects'
import { getGuildProgressionBonuses } from './guildSelectors'
import { contributeGuildCommissionChainDelivery, recordGuildCommissionChainProgress, startGuildCommissionChain } from './guildCommissionChains'
import { completeTransmutationCycle } from '../transmutation/transmutationEngine'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'
import { GUILD_STANDINGS } from '../../content/guild/guildStandings'
import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'

describe('Guild long-term services', () => {
  it('accepts partial project contributions, then pays its one-time rewards', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    const project = GUILD_PROJECTS[0]
    const initialReputation = GUILD_STANDINGS.find((standing) => standing.id === project.minimumStandingId)!.reputation
    state.progress.guildReputation = initialReputation
    const first = project.requirements[0]
    state.inventory[first.itemId] = first.quantity
    expect(contributeGuildProject(state, project.id, first.itemId, Math.floor(first.quantity / 2))).toBe(true)
    expect(state.progress.arcaneGuild.completedProjectIds).not.toContain(project.id)
    for (const requirement of project.requirements) {
      const contributed = state.progress.arcaneGuild.projects[project.id]?.[requirement.itemId] ?? 0
      state.inventory[requirement.itemId] = requirement.quantity - contributed
      contributeGuildProject(state, project.id, requirement.itemId, 'max')
    }
    expect(state.progress.arcaneGuild.completedProjectIds).toContain(project.id)
    expect(state.progress.guildReputation).toBe(initialReputation + project.reputationReward)
    expect(state.progress.guildPointsEarned).toBe(project.advancementPointsReward)
    expect(getGuildProgressionBonuses(state).guildReputationMultiplier).toBe(1.01)
    expect(contributeGuildProject(state, project.id, first.itemId, 1)).toBe(false)
  })

  it('gates projects by Guild Rank and prerequisites before accepting contributions', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    expect(getGuildProjectStatus(state, 'expand-research-wing')).toMatchObject({ available: false, reason: 'standing-required' })
    state.progress.guildReputation = GUILD_STANDINGS.find((standing) => standing.id === GUILD_PROJECTS.find((entry) => entry.id === 'expand-research-wing')!.minimumStandingId)!.reputation
    state.progress.guildRank = 'apprentice'
    expect(getGuildProjectStatus(state, 'expand-research-wing')).toMatchObject({ available: false, reason: 'prerequisite-required', missingProjects: ['restore-arcane-archive'] })
    state.inventory['artifact-essence'] = 20
    expect(contributeGuildProject(state, 'expand-research-wing', 'artifact-essence', 10)).toBe(false)
  })

  it('completes authored Guild Project prerequisites for regression setup', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    expect(debugCompleteGuildProjectPrerequisites(state, 'expand-research-wing')).toBe(true)
    expect(state.progress.arcaneGuild.completedProjectIds).toContain('restore-arcane-archive')
    expect(state.progress.arcaneGuild.completedProjectIds).not.toContain('expand-research-wing')
    expect(state.progress.guildPointsEarned).toBe(1)
  })

  it('activates modest Research and Transmutation project effects only after completion', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'apprentice'
    state.progress.arcaneGuild.completedProjectIds.push('restore-arcane-archive', 'expand-research-wing')
    expect(getGuildProgressionBonuses(state).researchSpeedMultiplier).toBe(1.03)
    expect(getGuildProgressionBonuses(state).guildReputationMultiplier).toBe(1.01)
    expect(getGuildProgressionBonuses(state).transmutationSpeedMultiplier).toBe(1)
    state.progress.arcaneGuild.completedProjectIds.push('rebuild-transmutation-hall')
    expect(getGuildProgressionBonuses(state).transmutationSpeedMultiplier).toBe(1.03)
  })

  it('advances and completes a repeatable multi-stage Commission Chain', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'adept'
    state.progress.guildReputation = GUILD_STANDINGS.find((standing) => standing.id === GUILD_COMMISSION_CHAINS.find((entry) => entry.id === 'study-ember-resonance')!.minimumStandingId)!.reputation
    expect(startGuildCommissionChain(state, 'study-ember-resonance')).toBe(true)
    expect(recordGuildCommissionChainProgress(state, 'delivery', 8, 'fire-fragment')).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain?.stageIndex).toBe(1)
    expect(recordGuildCommissionChainProgress(state, 'transmutation', 3)).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain?.stageIndex).toBe(2)
    expect(recordGuildCommissionChainProgress(state, 'research', 2)).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain).toBeNull()
    expect(state.progress.guildPointsEarned).toBe(1)
    expect(startGuildCommissionChain(state, 'study-ember-resonance')).toBe(true)
  })

  it('awards a Chain Advancement Point only on first clear and pays its authored repeat reward', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'adept'
    const chain = 'stable-leyline-survey'
    const chainDefinition = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chain)!
    const initialReputation = GUILD_STANDINGS.find((standing) => standing.id === chainDefinition.minimumStandingId)!.reputation
    state.progress.guildReputation = initialReputation
    const completeChain = () => {
      expect(startGuildCommissionChain(state, chain)).toBe(true)
      expect(recordGuildCommissionChainProgress(state, 'research', 3)).toBe(true)
      expect(recordGuildCommissionChainProgress(state, 'transmutation', 4)).toBe(true)
      state.inventory['earth-fragment'] = 10
      expect(contributeGuildCommissionChainDelivery(state, 'max')).toBe(true)
    }
    completeChain()
    expect(state.progress.guildPointsEarned).toBe(1)
    expect(state.progress.guildReputation).toBe(initialReputation + chainDefinition.reputationReward)
    completeChain()
    expect(state.progress.guildPointsEarned).toBe(1)
    expect(state.progress.guildReputation).toBe(initialReputation + chainDefinition.reputationReward + chainDefinition.repeatReputationReward)
  })

  it('validates the authored item for Production Chain stages', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'magister'
    state.progress.guildReputation = GUILD_STANDINGS.find((standing) => standing.id === GUILD_COMMISSION_CHAINS.find((entry) => entry.id === 'prismatic-synthesis')!.minimumStandingId)!.reputation
    expect(startGuildCommissionChain(state, 'prismatic-synthesis')).toBe(true)
    state.inventory['prismatic-fragment'] = 5
    expect(contributeGuildCommissionChainDelivery(state, 'max')).toBe(true)
    expect(recordGuildCommissionChainProgress(state, 'production', 2, 'fire-fragment')).toBe(false)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 1, stageProgress: 0 })
    state.progress.transmutation.arrays['replication-array'].level = 10
    state.resonance.water = 10
    expect(completeTransmutationCycle(state, TRANSMUTATION_RECIPES['water-fragment'], { mode: 'live', random: () => 0 })).toBe(true)
    expect(state.inventory['water-fragment']).toBe(2)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 1, stageProgress: 2 })
    expect(recordGuildCommissionChainProgress(state, 'production', 10, 'water-fragment')).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 2, stageProgress: 0 })
    expect(recordGuildCommissionChainProgress(state, 'transmutation', 6)).toBe(true)
    expect(state.progress.arcaneGuild.activeCommissionChain).toMatchObject({ stageIndex: 3, stageProgress: 0 })
  })
})
