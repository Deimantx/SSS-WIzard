import { describe, expect, it } from 'vitest'
import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { createInitialState } from '../../../store/initialState'
import { contributeGuildProject } from './guildProjects'
import { recordGuildCommissionChainProgress, startGuildCommissionChain } from './guildCommissionChains'

describe('Guild long-term services', () => {
  it('accepts partial project contributions, then pays its one-time rewards', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
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
    expect(contributeGuildProject(state, project.id, first.itemId, 1)).toBe(false)
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
})
