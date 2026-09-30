import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { grantItem } from '../inventory/itemAcquisition'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import type { GameState, ItemId } from '../../types'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import { GUILD_RANKS } from '../../content/guild/guildRanks'
import { getGuildProgressionBonuses } from './guildSelectors'
import { grantGuildReputation } from './guildReputation'
import { BALANCE } from '../../core/balance/balance'
import { GUILD_STANDINGS, isGuildStandingAtLeast } from '../../content/guild/guildStandings'

const safe = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
export const getGuildProjectEffectiveRequirements = (state: Pick<GameState, 'progress'>, projectId: string) => {
  const project = GUILD_PROJECTS.find((entry) => entry.id === projectId)
  if (!project) return []
  const multiplier = getGuildProgressionBonuses(state).projectMaterialMultiplier
  return project.requirements.map((entry) => ({ ...entry, quantity: Math.max(1, Math.ceil(entry.quantity * multiplier)) }))
}
export const getGuildProjectStatus = (state: Pick<GameState, 'progress'>, projectId: string) => {
  const guild = state.progress.arcaneGuild
  const project = GUILD_PROJECTS.find((entry) => entry.id === projectId)
  if (!project) return { project: null, complete: false, available: false, reason: 'unknown-project' as const, missingProjects: [] as string[] }
  const complete = guild.completedProjectIds.includes(projectId)
  const missingProjects = (project.prerequisiteProjectIds ?? []).filter((id) => !guild.completedProjectIds.includes(id))
  const reason = complete ? 'complete' as const : !state.progress.guildUnlocked ? 'guild-locked' as const : !isGuildStandingAtLeast(state.progress.guildReputation, project.minimumStandingId) ? 'standing-required' as const : missingProjects.length ? 'prerequisite-required' as const : null
  return { project, complete, available: reason === null, reason, missingProjects }
}

export const contributeGuildProject = (state: GameState, projectId: string, itemId: ItemId, amount: number | 'max') => {
  const guild = state.progress.arcaneGuild
  const project = GUILD_PROJECTS.find((entry) => entry.id === projectId)
  const requirement = project ? getGuildProjectEffectiveRequirements(state, projectId).find((entry) => entry.itemId === itemId) : undefined
  if (!getGuildProjectStatus(state, projectId).available || !project || !requirement || state.protectedItems[itemId]) return false
  const contributed = guild.projects[projectId]?.[itemId] ?? 0
  const remaining = Math.max(0, requirement.quantity - contributed)
  const wanted = amount === 'max' ? remaining : Math.min(remaining, safe(amount))
  const quantity = Math.min(wanted, getConsumableQuantity(state, itemId))
  if (quantity < 1) return false
  state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity)
  guild.projects[projectId] ??= {}
  guild.projects[projectId][itemId] = contributed + quantity
  if (getGuildProjectEffectiveRequirements(state, projectId).every((entry) => (guild.projects[projectId]?.[entry.itemId] ?? 0) >= entry.quantity)) {
    guild.completedProjectIds.push(projectId)
    grantGuildReputation(state, project.reputationReward)
    state.progress.guildPointsEarned = safe(state.progress.guildPointsEarned) + project.advancementPointsReward
    if (project.effect?.type === 'commission-refresh') guild.freeRefreshes = Math.min(BALANCE.arcaneGuild.maxFreeRefreshes, guild.freeRefreshes + Math.max(0, safe(project.effect.amount)))
    pushNotification(state, `${project.name} completed · +${project.reputationReward} Guild Reputation · +${project.advancementPointsReward} Advancement Point.`, 'success')
    reconcileChronicleProgress(state)
  }
  return true
}

export const debugCompleteGuildProject = (state: GameState, projectId: string) => { const project = GUILD_PROJECTS.find((entry) => entry.id === projectId); if (!project) return false; for (const requirement of getGuildProjectEffectiveRequirements(state, projectId)) { const remaining = Math.max(0, requirement.quantity - (state.progress.arcaneGuild.projects[projectId]?.[requirement.itemId] ?? 0)); if (!remaining) continue; grantItem(state, requirement.itemId, remaining); contributeGuildProject(state, projectId, requirement.itemId, 'max') } return state.progress.arcaneGuild.completedProjectIds.includes(projectId) }
export const debugGrantGuildProjectRequirements = (state: GameState, projectId: string) => {
  if (!GUILD_PROJECTS.some((project) => project.id === projectId)) return false
  for (const requirement of getGuildProjectEffectiveRequirements(state, projectId)) {
    const contributed = state.progress.arcaneGuild.projects[projectId]?.[requirement.itemId] ?? 0
    const remaining = Math.max(0, requirement.quantity - contributed)
    if (remaining) grantItem(state, requirement.itemId, remaining)
  }
  return true
}

export const debugCompleteGuildProjectPrerequisites = (state: GameState, projectId: string) => {
  const visiting = new Set<string>()
  const completePrerequisites = (id: string): boolean => {
    const project = GUILD_PROJECTS.find((entry) => entry.id === id)
    if (!project || visiting.has(id)) return false
    visiting.add(id)
    const standing = GUILD_STANDINGS.find((entry) => entry.id === project.minimumStandingId)
    if (standing) grantGuildReputation(state, Math.max(0, standing.reputation - state.progress.guildReputation))
    for (const rank of GUILD_RANKS) if (rank.order >= (GUILD_RANKS.find((entry) => entry.id === project.minimumGuildRank)?.order ?? 0)) { state.progress.guildRank = rank.id; break }
    for (const prerequisiteId of project.prerequisiteProjectIds ?? []) {
      if (!state.progress.arcaneGuild.completedProjectIds.includes(prerequisiteId)) {
        if (!completePrerequisites(prerequisiteId) || !debugCompleteGuildProject(state, prerequisiteId)) return false
      }
    }
    visiting.delete(id)
    return true
  }
  const target = GUILD_PROJECTS.find((entry) => entry.id === projectId)
  if (!target) return false
  const standing = GUILD_STANDINGS.find((entry) => entry.id === target.minimumStandingId)
  if (standing) grantGuildReputation(state, Math.max(0, standing.reputation - state.progress.guildReputation))
  for (const rank of GUILD_RANKS) if (rank.order >= (GUILD_RANKS.find((entry) => entry.id === target.minimumGuildRank)?.order ?? 0)) { state.progress.guildRank = rank.id; break }
  return (target.prerequisiteProjectIds ?? []).every((prerequisiteId) => completePrerequisites(prerequisiteId) && debugCompleteGuildProject(state, prerequisiteId))
}
