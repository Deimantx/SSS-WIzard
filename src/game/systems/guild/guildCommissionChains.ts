import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'
import { pushNotification } from '../../engine'
import { grantItem } from '../inventory/itemAcquisition'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import type { GameState, ItemId } from '../../types'

type GuildCommissionChainCategory = 'delivery' | 'production' | 'research' | 'transmutation'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import { getGuildProgressionBonuses } from './guildSelectors'
import { grantGuildReputation } from './guildReputation'
import { GUILD_STANDINGS, isGuildStandingAtLeast } from '../../content/guild/guildStandings'

const safe = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0))
export const startGuildCommissionChain = (state: GameState, chainId: string) => {
  const guild = state.progress.arcaneGuild
  const chain = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chainId)
  if (!state.progress.guildUnlocked || !chain || guild.activeCommissionChain || !isGuildStandingAtLeast(state.progress.guildReputation, chain.minimumStandingId)) return false
  guild.activeCommissionChain = { id: chain.id, stageIndex: 0, stageProgress: 0 }
  pushNotification(state, `${chain.name} started.`, 'info')
  return true
}
export const contributeGuildCommissionChainDelivery = (state: GameState, amount: number | 'max') => {
  const active = state.progress.arcaneGuild.activeCommissionChain
  const chain = active && GUILD_COMMISSION_CHAINS.find((entry) => entry.id === active.id)
  const stage = chain?.stages[active?.stageIndex ?? 0]
  if (!active || stage?.category !== 'delivery' || state.protectedItems[stage.itemId]) return false
  const remaining = Math.max(0, stage.target - active.stageProgress)
  const wanted = amount === 'max' ? remaining : Math.min(remaining, safe(amount))
  const quantity = Math.min(wanted, getConsumableQuantity(state, stage.itemId))
  if (quantity < 1) return false
  state.inventory[stage.itemId] = Math.max(0, (state.inventory[stage.itemId] ?? 0) - quantity)
  recordGuildCommissionChainProgress(state, 'delivery', quantity, stage.itemId)
  return true
}

export const recordGuildCommissionChainProgress = (state: GameState, category: GuildCommissionChainCategory, amount = 1, itemId?: ItemId) => {
  const active = state.progress.arcaneGuild.activeCommissionChain
  const chain = active && GUILD_COMMISSION_CHAINS.find((entry) => entry.id === active.id)
  if (!active || !chain || amount <= 0) return false
  let remaining = safe(amount)
  let changed = false
  while (remaining > 0 && active.stageIndex < chain.stages.length) {
    const stage = chain.stages[active.stageIndex]
    const requiresItemMatch = stage.category === 'delivery' || stage.category === 'production'
    if (stage.category !== category || (requiresItemMatch && stage.itemId !== itemId)) break
    const step = Math.min(remaining, stage.target - active.stageProgress)
    active.stageProgress += step
    remaining -= step
    changed = true
    if (active.stageProgress >= stage.target) { active.stageIndex += 1; active.stageProgress = 0 }
  }
  if (active.stageIndex >= chain.stages.length) {
    const guild = state.progress.arcaneGuild
    const firstCompletion = !guild.completedChainIds.includes(chain.id)
    const reputationAwarded = Math.round((firstCompletion ? chain.reputationReward : chain.repeatReputationReward) * (firstCompletion ? 1 : getGuildProgressionBonuses(state).repeatStudyReputationMultiplier))
    const pointsAwarded = firstCompletion ? chain.advancementPointsReward : 0
    grantGuildReputation(state, reputationAwarded)
    if (firstCompletion) guild.completedChainIds.push(chain.id)
    state.progress.guildPointsEarned = safe(state.progress.guildPointsEarned) + pointsAwarded
    guild.activeCommissionChain = null
    pushNotification(state, `${chain.name} completed · +${reputationAwarded} Guild Reputation${pointsAwarded ? ` · +${pointsAwarded} first-clear Advancement Point` : ' · repeat reward'}.`, 'success')
    reconcileChronicleProgress(state)
  }
  return changed
}

export const debugCompleteGuildCommissionChain = (state: GameState, chainId: string) => { const chain = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chainId); if (!chain) return false; const requiredStanding = GUILD_STANDINGS.find((standing) => standing.id === chain.minimumStandingId); if (requiredStanding) grantGuildReputation(state, Math.max(0, requiredStanding.reputation - state.progress.guildReputation)); if (!state.progress.arcaneGuild.activeCommissionChain && !startGuildCommissionChain(state, chainId)) return false; while (state.progress.arcaneGuild.activeCommissionChain?.id === chainId) { const active = state.progress.arcaneGuild.activeCommissionChain; const stage = chain.stages[active.stageIndex]; if (stage.category === 'delivery') { const remaining = stage.target - active.stageProgress; grantItem(state, stage.itemId, remaining); contributeGuildCommissionChainDelivery(state, remaining) } else recordGuildCommissionChainProgress(state, stage.category, stage.target - active.stageProgress, 'itemId' in stage ? stage.itemId : undefined) } return state.progress.arcaneGuild.activeCommissionChain === null }

export const debugCompleteGuildStudyStage = (state: GameState) => {
  const active = state.progress.arcaneGuild.activeCommissionChain
  const chain = active && GUILD_COMMISSION_CHAINS.find((entry) => entry.id === active.id)
  const stage = chain?.stages[active?.stageIndex ?? 0]
  if (!active || !chain || !stage) return false
  const remaining = Math.max(0, stage.target - active.stageProgress)
  if (stage.category === 'delivery') { grantItem(state, stage.itemId, remaining); return contributeGuildCommissionChainDelivery(state, remaining) }
  return recordGuildCommissionChainProgress(state, stage.category, remaining, 'itemId' in stage ? stage.itemId : undefined)
}

export const debugResetGuildStudy = (state: GameState, chainId: string) => {
  const guild = state.progress.arcaneGuild
  if (guild.activeCommissionChain?.id === chainId) guild.activeCommissionChain = null
  const completedIndex = guild.completedChainIds.indexOf(chainId)
  if (completedIndex < 0) return false
  guild.completedChainIds.splice(completedIndex, 1)
  const chain = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chainId)
  state.progress.guildPointsEarned = Math.max(0, state.progress.guildPointsEarned - (chain?.advancementPointsReward ?? 0))
  return true
}

export const debugSetGuildStudyFirstClear = (state: GameState, chainId: string, complete: boolean) => {
  const guild = state.progress.arcaneGuild
  const index = guild.completedChainIds.indexOf(chainId)
  if (complete && index < 0) {
    const chain = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chainId)
    if (!chain) return false
    guild.completedChainIds.push(chainId)
    state.progress.guildPointsEarned += chain.advancementPointsReward
    return true
  }
  if (!complete && index >= 0) return debugResetGuildStudy(state, chainId)
  return false
}
