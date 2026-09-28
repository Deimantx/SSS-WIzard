import { GUILD_COMMISSION_TEMPLATES, type GuildCommissionTemplate } from '../../content/guild/guildRequests'
import { ITEMS } from '../../content/items/items'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import { getGuildProgressionBonuses } from './guildSelectors'
import { recordGuildCommissionChainProgress } from './guildCommissionChains'
import type { GameState, GuildCommissionCategory, GuildCommissionQuality, GuildCommissionState } from '../../types'

const safeInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
const stageOrder = ['choose-school', 'combat', 'first-kill', 'tower-work', 'channeling', 'transmutation', 'research', 'complete'] as const
const templateIsAccessible = (state: GameState, template: GuildCommissionTemplate) => {
  if (!state.progress.guildUnlocked) return false
  if (template.minimumProgressStage === 'guild') return true
  if (template.minimumProgressStage === 'research') return stageOrder.indexOf(state.progress.tutorialStage) >= stageOrder.indexOf('research')
  if (template.minimumProgressStage === 'transmutation') return stageOrder.indexOf(state.progress.tutorialStage) >= stageOrder.indexOf('transmutation')
  if (!template.itemId) return false
  return state.progress.discoveredItems.includes(template.itemId) || getConsumableQuantity(state, template.itemId) > 0
}

export const generateGuildCommissionChoices = (state: GameState): GuildCommissionState[] => {
  if (!state.progress.guildUnlocked) return []
  const eligible = GUILD_COMMISSION_TEMPLATES.filter((template) => templateIsAccessible(state, template))
  if (!eligible.length) return []
  const start = state.progress.arcaneGuild.generationCount % eligible.length
  const choiceCount = Math.min(eligible.length, 3 + getGuildProgressionBonuses(state).commissionChoiceBonus)
  return Array.from({ length: choiceCount }, (_, index) => {
    const template = eligible[(start + index) % eligible.length]
    const rankOrder = ['outsider', 'initiate', 'apprentice', 'adept', 'magister', 'circle-master']
    const guildOrder = Math.max(0, rankOrder.indexOf(state.progress.guildRank))
    const bonuses = getGuildProgressionBonuses(state)
    const quality: GuildCommissionQuality = (guildOrder >= 4 || bonuses.specialCommissionAccess) && index === choiceCount - 1 && index > 0 ? 'prestigious' : (guildOrder >= 2 || bonuses.specialCommissionAccess) && index >= 1 ? 'special' : 'routine'
    const multiplier = quality === 'prestigious' ? 2.5 : quality === 'special' ? 1.6 : 1
    const scaledTarget = Math.ceil(template.target * multiplier)
    const target = template.category === 'delivery' ? Math.max(1, Math.floor(scaledTarget * bonuses.deliveryQuantityMultiplier)) : scaledTarget
    return { id: `guild-${state.progress.arcaneGuild.generationCount}-${index}-${template.id}`, templateId: template.id, category: template.category, quality, itemId: template.itemId, target, progress: 0, reputationReward: Math.round(template.baseReputation * multiplier), advancementPointReward: template.baseAdvancementPoints }
  })
}

export const ensureGuildCommissionChoices = (state: GameState) => {
  if (!state.progress.guildUnlocked || state.progress.arcaneGuild.availableCommissions.length) return
  state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
}

const finishCommission = (state: GameState, commission: GuildCommissionState) => {
  const guild = state.progress.arcaneGuild
  state.progress.guildReputation = safeInt(state.progress.guildReputation) + Math.round(commission.reputationReward * getGuildProgressionBonuses(state).guildReputationMultiplier)
  state.progress.guildPointsEarned = safeInt(state.progress.guildPointsEarned) + commission.advancementPointReward
  guild.completedCommissions = safeInt(guild.completedCommissions) + 1
  guild.freeRefreshes = safeInt(guild.freeRefreshes) + 1
  guild.activeCommission = null
  guild.generationCount += 1
  guild.availableCommissions = generateGuildCommissionChoices(state)
  pushNotification(state, `Guild Commission complete · +${commission.reputationReward} Reputation.`, 'success')
  reconcileChronicleProgress(state)
}

export const acceptGuildCommission = (state: GameState, commissionId: string) => {
  const guild = state.progress.arcaneGuild
  if (!state.progress.guildUnlocked || guild.activeCommission) return false
  const commission = guild.availableCommissions.find((entry) => entry.id === commissionId)
  if (!commission || !GUILD_COMMISSION_TEMPLATES.some((template) => template.id === commission.templateId && templateIsAccessible(state, template))) return false
  guild.activeCommission = { ...commission }
  guild.availableCommissions = guild.availableCommissions.filter((entry) => entry.id !== commissionId)
  return true
}

export const deliverGuildCommissionItems = (state: GameState, amount: number | 'max') => {
  const guild = state.progress.arcaneGuild
  const commission = guild.activeCommission
  if (!commission || commission.category !== 'delivery' || !commission.itemId) return false
  const remaining = Math.max(0, commission.target - commission.progress)
  const wanted = amount === 'max' ? remaining : Math.min(remaining, safeInt(amount))
  const quantity = Math.min(wanted, getConsumableQuantity(state, commission.itemId))
  if (quantity < 1 || state.protectedItems[commission.itemId]) return false
  state.inventory[commission.itemId] = Math.max(0, (state.inventory[commission.itemId] ?? 0) - quantity)
  commission.progress += quantity
  recordGuildCommissionChainProgress(state, 'delivery', quantity, commission.itemId)
  if (commission.progress >= commission.target) finishCommission(state, commission)
  return true
}

export const recordGuildCommissionProgress = (state: GameState, category: GuildCommissionCategory, amount = 1) => {
  if (amount <= 0) return false
  const chainAdvanced = recordGuildCommissionChainProgress(state, category, amount)
  const commission = state.progress.arcaneGuild.activeCommission
  if (!commission || commission.category !== category) return chainAdvanced
  commission.progress = Math.min(commission.target, commission.progress + safeInt(amount))
  if (commission.progress >= commission.target) finishCommission(state, commission)
  return true
}

export const refreshGuildCommissionChoices = (state: GameState) => {
  const guild = state.progress.arcaneGuild
  if (!state.progress.guildUnlocked || guild.freeRefreshes < 1) return false
  guild.freeRefreshes -= 1
  guild.generationCount += 1
  guild.availableCommissions = generateGuildCommissionChoices(state)
  return true
}
