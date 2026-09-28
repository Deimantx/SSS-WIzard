import { describe, expect, it } from 'vitest'
import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { createInitialState } from '../../../store/initialState'
import { contributeGuildProject, getGuildProjectStatus } from './guildProjects'
import { getGuildProgressionBonuses } from './guildSelectors'
import { contributeGuildCommissionChainDelivery, recordGuildCommissionChainProgress, startGuildCommissionChain } from './guildCommissionChains'

describe('Guild long-term services', () => {
  it('accepts partial project contributions, then pays its one-time rewards', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    const project = GUILD_PROJECTS[0]
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
    expect(state.progress.guildReputation).toBe(project.reputationReward)
    expect(state.progress.guildPointsEarned).toBe(project.advancementPointsReward)
    expect(getGuildProgressionBonuses(state).guildReputationMultiplier).toBe(1.01)
    expect(contributeGuildProject(state, project.id, first.itemId, 1)).toBe(false)
  })

  it('gates projects by Guild Rank and prerequisites before accepting contributions', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'initiate'
    expect(getGuildProjectStatus(state, 'expand-research-wing')).toMatchObject({ available: false, reason: 'rank-required' })
    state.progress.guildRank = 'apprentice'
    expect(getGuildProjectStatus(state, 'expand-research-wing')).toMatchObject({ available: false, reason: 'prerequisite-required', missingProjects: ['restore-arcane-archive'] })
    state.inventory['artifact-essence'] = 20
    expect(contributeGuildProject(state, 'expand-research-wing', 'artifact-essence', 10)).toBe(false)
  })

  it('activates modest Research and Transmutation project effects only after completion', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'apprentice'
    state.progress.arcaneGuild.completedProjectIds.push('restore-arcane-archive', 'expand-research-wing')
    expect(getGuildProgressionBonuses(state).researchSpeedMultiplier).toBe(1.03)
    expect(getGuildProgressionBonuses(state).transmutationSpeedMultiplier).toBe(1)
    state.progress.arcaneGuild.completedProjectIds.push('rebuild-transmutation-hall')
    expect(getGuildProgressionBonuses(state).transmutationSpeedMultiplier).toBe(1.03)
  })

  it('advances and completes a repeatable multi-stage Commission Chain', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildRank = 'adept'
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
    const completeChain = () => {
      expect(startGuildCommissionChain(state, chain)).toBe(true)
      expect(recordGuildCommissionChainProgress(state, 'research', 3)).toBe(true)
      expect(recordGuildCommissionChainProgress(state, 'transmutation', 4)).toBe(true)
      state.inventory['earth-fragment'] = 10
      expect(contributeGuildCommissionChainDelivery(state, 'max')).toBe(true)
    }
    completeChain()
    expect(state.progress.guildPointsEarned).toBe(1)
    expect(state.progress.guildReputation).toBe(420)
    completeChain()
    expect(state.progress.guildPointsEarned).toBe(1)
    expect(state.progress.guildReputation).toBe(700)
  })
})
