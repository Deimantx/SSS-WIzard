import { GUILD_PROJECTS } from '../../content/guild/guildProjects'
import { grantItem } from '../inventory/itemAcquisition'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import type { GameState, ItemId } from '../../types'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'

const safe = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
export const contributeGuildProject = (state: GameState, projectId: string, itemId: ItemId, amount: number | 'max') => {
  const guild = state.progress.arcaneGuild
  const project = GUILD_PROJECTS.find((entry) => entry.id === projectId)
  const requirement = project?.requirements.find((entry) => entry.itemId === itemId)
  if (!state.progress.guildUnlocked || !project || !requirement || guild.completedProjectIds.includes(projectId) || state.protectedItems[itemId]) return false
  const contributed = guild.projects[projectId]?.[itemId] ?? 0
  const remaining = Math.max(0, requirement.quantity - contributed)
  const wanted = amount === 'max' ? remaining : Math.min(remaining, safe(amount))
  const quantity = Math.min(wanted, getConsumableQuantity(state, itemId))
  if (quantity < 1) return false
  state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity)
  guild.projects[projectId] ??= {}
  guild.projects[projectId][itemId] = contributed + quantity
  if (project.requirements.every((entry) => (guild.projects[projectId]?.[entry.itemId] ?? 0) >= entry.quantity)) {
    guild.completedProjectIds.push(projectId)
    state.progress.guildReputation = safe(state.progress.guildReputation) + project.reputationReward
    state.progress.guildPointsEarned = safe(state.progress.guildPointsEarned) + project.advancementPointsReward
    pushNotification(state, `${project.name} completed ? +${project.reputationReward} Guild Reputation ? +${project.advancementPointsReward} Advancement Point.`, 'success')
    reconcileChronicleProgress(state)
  }
  return true
}

export const debugCompleteGuildProject = (state: GameState, projectId: string) => { const project = GUILD_PROJECTS.find((entry) => entry.id === projectId); if (!project) return false; for (const requirement of project.requirements) { const remaining = Math.max(0, requirement.quantity - (state.progress.arcaneGuild.projects[projectId]?.[requirement.itemId] ?? 0)); if (!remaining) continue; grantItem(state, requirement.itemId, remaining); contributeGuildProject(state, projectId, requirement.itemId, 'max') } return state.progress.arcaneGuild.completedProjectIds.includes(projectId) }
