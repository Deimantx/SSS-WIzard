import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'
import { pushNotification } from '../../engine'
import { grantItem } from '../inventory/itemAcquisition'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import type { GameState, ItemId } from '../../types'

type GuildCommissionChainCategory = 'delivery' | 'production' | 'research' | 'transmutation'
import { GUILD_RANKS } from '../../content/guild/guildRanks'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'

const guildRankOrder = GUILD_RANKS.map((rank) => rank.id)
const rankRequired = (state: GameState, required: (typeof guildRankOrder)[number]) => guildRankOrder.indexOf(state.progress.guildRank) >= guildRankOrder.indexOf(required)
const safe = (n: number) => Math.max(0, Math.floor(Number.isFinite(n) ? n : 0))
export const startGuildCommissionChain = (state: GameState, chainId: string) => {
  const guild = state.progress.arcaneGuild
  const chain = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chainId)
  if (!state.progress.guildUnlocked || !chain || guild.activeCommissionChain || !rankRequired(state, chain.minimumRank)) return false
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
    const reputationAwarded = firstCompletion ? chain.reputationReward : chain.repeatReputationReward
    const pointsAwarded = firstCompletion ? chain.advancementPointsReward : 0
    state.progress.guildReputation = safe(state.progress.guildReputation) + reputationAwarded
    if (firstCompletion) guild.completedChainIds.push(chain.id)
    state.progress.guildPointsEarned = safe(state.progress.guildPointsEarned) + pointsAwarded
    guild.activeCommissionChain = null
    pushNotification(state, `${chain.name} completed · +${reputationAwarded} Guild Reputation${pointsAwarded ? ` · +${pointsAwarded} first-clear Advancement Point` : ' · repeat reward'}.`, 'success')
    reconcileChronicleProgress(state)
  }
  return changed
}

export const debugCompleteGuildCommissionChain = (state: GameState, chainId: string) => { const chain = GUILD_COMMISSION_CHAINS.find((entry) => entry.id === chainId); if (!chain || !rankRequired(state, chain.minimumRank)) return false; if (!state.progress.arcaneGuild.activeCommissionChain && !startGuildCommissionChain(state, chainId)) return false; while (state.progress.arcaneGuild.activeCommissionChain?.id === chainId) { const active = state.progress.arcaneGuild.activeCommissionChain; const stage = chain.stages[active.stageIndex]; if (stage.category === 'delivery') { const remaining = stage.target - active.stageProgress; grantItem(state, stage.itemId, remaining); contributeGuildCommissionChainDelivery(state, remaining) } else recordGuildCommissionChainProgress(state, stage.category, stage.target - active.stageProgress, 'itemId' in stage ? stage.itemId : undefined) } return state.progress.arcaneGuild.activeCommissionChain === null }
