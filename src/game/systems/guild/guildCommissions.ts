import { GUILD_COMMISSION_TEMPLATES, type GuildCommissionTemplate } from '../../content/guild/guildRequests'
import { GUILD_RANKS } from '../../content/guild/guildRanks'
import { grantItem } from '../inventory/itemAcquisition'
import { BALANCE } from '../../core/balance/balance'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { pushNotification } from '../../engine'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import { getGuildProgressionBonuses } from './guildSelectors'
import { recordGuildCommissionChainProgress } from './guildCommissionChains'
import type { GameState, GuildCommissionCategory, GuildCommissionQuality, GuildCommissionState } from '../../types'

const safeInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
const stageOrder = ['choose-school', 'combat', 'first-kill', 'tower-work', 'channeling', 'transmutation', 'research', 'complete'] as const
const rankOrder = (rank: GameState['progress']['guildRank']) => GUILD_RANKS.findIndex((entry) => entry.id === rank)
const accessibleStage = (state: GameState, stage: GuildCommissionTemplate['minimumProgressStage']) => stage === 'guild' || stageOrder.indexOf(state.progress.tutorialStage) >= stageOrder.indexOf(stage)

const templateIsAccessible = (state: GameState, template: GuildCommissionTemplate) => {
  if (!state.progress.guildUnlocked || !accessibleStage(state, template.minimumProgressStage)) return false
  const items = [template.itemId, ...(template.components ?? []).map((component) => component.itemId)].filter((id): id is NonNullable<typeof id> => Boolean(id))
  return items.every((itemId) => state.progress.discoveredItems.includes(itemId) || getConsumableQuantity(state, itemId) > 0)
}

const nextGuildRandom = (state: GameState) => {
  const guild = state.progress.arcaneGuild
  let value = safeInt(guild.rngState) || 2246822519
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5
  guild.rngState = value >>> 0
  return guild.rngState / 0x100000000
}
const commissionSignature = (commission: GuildCommissionState) => JSON.stringify({
  category: commission.category,
  itemId: commission.itemId ?? null,
  quality: commission.quality,
  target: commission.target,
  components: commission.components?.map(({ category, itemId, target }) => ({ category, itemId: itemId ?? null, target })) ?? null,
})
const qualityOrder: GuildCommissionQuality[] = ['routine', 'special', 'prestigious']
const chooseQuality = (state: GameState, available: ReadonlySet<GuildCommissionQuality>, forcedQuality?: GuildCommissionQuality): GuildCommissionQuality | null => {
  const qualityRanks: Record<GuildCommissionQuality, string> = BALANCE.arcaneGuild.rankMinimumQuality
  const qualityOffset = getGuildProgressionBonuses(state).specialCommissionAccess ? 1 : 0
  const eligible = qualityOrder.filter((quality) => available.has(quality) && BALANCE.arcaneGuild.qualityWeights[quality] > 0 && rankOrder(state.progress.guildRank) + qualityOffset >= GUILD_RANKS.findIndex((rank) => rank.id === qualityRanks[quality]))
  if (forcedQuality) return eligible.includes(forcedQuality) ? forcedQuality : null
  const total = eligible.reduce((sum, quality) => sum + BALANCE.arcaneGuild.qualityWeights[quality], 0)
  if (total <= 0) return null
  let roll = nextGuildRandom(state) * total
  for (const quality of eligible) { roll -= BALANCE.arcaneGuild.qualityWeights[quality]; if (roll < 0) return quality }
  return 'routine'
}
const scaled = (target: number, quality: GuildCommissionQuality) => Math.max(1, Math.ceil(target * BALANCE.arcaneGuild.qualityTargetMultipliers[quality]))

export interface GuildCommissionGenerationOptions { quality?: GuildCommissionQuality; templateId?: string }
export const getGuildCommissionChoiceCount = (state: Pick<GameState, 'progress'>) => BALANCE.arcaneGuild.baseCommissionChoices + getGuildProgressionBonuses(state).commissionChoiceBonus

export const generateGuildCommissionChoices = (state: GameState, options: GuildCommissionGenerationOptions = {}): GuildCommissionState[] => {
  if (!state.progress.guildUnlocked) return []
  const eligible = GUILD_COMMISSION_TEMPLATES.filter((template) => templateIsAccessible(state, template) && (!options.templateId || template.id === options.templateId))
  if (!eligible.length) return []
  const choiceCount = Math.min(eligible.length, options.templateId ? 1 : getGuildCommissionChoiceCount(state))
  const selected: GuildCommissionState[] = []
  const signatures = new Set<string>()
  const remaining = [...eligible]
  for (let index = 0; index < choiceCount && remaining.length; index += 1) {
    const availableQualities = new Set(remaining.map((template) => template.complexity ?? 'routine'))
    const quality = chooseQuality(state, availableQualities, options.quality)
    if (!quality) break
    const tierPool = remaining.filter((template) => (template.complexity ?? 'routine') === quality)
    if (!tierPool.length) break
    const totalWeight = tierPool.reduce((sum, template) => sum + Math.max(0, template.weight ?? 1), 0)
    let roll = nextGuildRandom(state) * totalWeight
    let chosenIndex = 0
    for (; chosenIndex < tierPool.length - 1; chosenIndex += 1) { roll -= Math.max(0, tierPool[chosenIndex].weight ?? 1); if (roll < 0) break }
    const template = tierPool[chosenIndex]
    remaining.splice(remaining.findIndex((entry) => entry.id === template.id), 1)
    const multiplier = BALANCE.arcaneGuild.qualityTargetMultipliers[quality]
    const bonuses = getGuildProgressionBonuses(state)
    const components = template.components?.map((component) => {
      const target = scaled(component.target, quality)
      const adjustedTarget = component.category === 'delivery' ? Math.max(1, Math.floor(target * bonuses.deliveryQuantityMultiplier)) : target
      return { category: component.category, itemId: component.itemId, target: adjustedTarget, progress: 0 }
    })
    const target = components ? components.reduce((sum, component) => sum + component.target, 0) : scaled(template.target, quality)
    const adjustedTarget = template.category === 'delivery' ? Math.max(1, Math.floor(target * bonuses.deliveryQuantityMultiplier)) : target
    const offer = { id: `guild-${state.progress.arcaneGuild.generationCount}-${index}-${template.id}`, templateId: template.id, category: template.category, quality, itemId: template.itemId, target: adjustedTarget, progress: 0, reputationReward: Math.round(template.baseReputation * multiplier), advancementPointReward: template.baseAdvancementPoints, ...(components ? { components } : {}) }
    const signature = commissionSignature(offer)
    if (!signatures.has(signature)) {
      selected.push(offer)
      signatures.add(signature)
    }
  }
  return selected
}

export const ensureGuildCommissionChoices = (state: GameState) => {
  if (!state.progress.guildUnlocked || state.progress.arcaneGuild.activeCommission || state.progress.arcaneGuild.availableCommissions.length) return
  state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
}

const finishCommission = (state: GameState, commission: GuildCommissionState) => {
  const guild = state.progress.arcaneGuild
  const reputationAwarded = Math.round(commission.reputationReward * getGuildProgressionBonuses(state).guildReputationMultiplier)
  state.progress.guildReputation = safeInt(state.progress.guildReputation) + reputationAwarded
  state.progress.guildPointsEarned = safeInt(state.progress.guildPointsEarned) + commission.advancementPointReward
  guild.completedCommissions = safeInt(guild.completedCommissions) + 1
  guild.freeRefreshes = Math.min(BALANCE.arcaneGuild.maxFreeRefreshes, safeInt(guild.freeRefreshes) + 1)
  guild.activeCommission = null
  guild.generationCount += 1
  guild.availableCommissions = generateGuildCommissionChoices(state)
  pushNotification(state, `Guild Commission complete - +${reputationAwarded} Reputation.`, 'success')
  reconcileChronicleProgress(state)
}

export const acceptGuildCommission = (state: GameState, commissionId: string) => {
  const guild = state.progress.arcaneGuild
  if (!state.progress.guildUnlocked || guild.activeCommission) return false
  const commission = guild.availableCommissions.find((entry) => entry.id === commissionId)
  if (!commission || !GUILD_COMMISSION_TEMPLATES.some((template) => template.id === commission.templateId && templateIsAccessible(state, template))) return false
  guild.activeCommission = { ...commission, ...(commission.components ? { components: commission.components.map((component) => ({ ...component })) } : {}) }
  guild.availableCommissions = guild.availableCommissions.filter((entry) => entry.id !== commissionId)
  return true
}

export interface GuildCommissionProgressEvent { category: GuildCommissionCategory; amount?: number; itemId?: GameState['progress']['discoveredItems'][number] }

const updateCommissionProgress = (commission: GuildCommissionState, category: GuildCommissionCategory, amount: number, itemId?: GameState['progress']['discoveredItems'][number]) => {
  if (commission.components) {
    for (const component of commission.components) {
      if (component.category !== category || (component.itemId && component.itemId !== itemId)) continue
      component.progress = Math.min(component.target, component.progress + amount)
    }
    commission.progress = commission.components.reduce((sum, component) => sum + component.progress, 0)
    return commission.components.some((component) => component.category === category && (!component.itemId || component.itemId === itemId))
  }
  const matches = commission.category === category
  if (!matches || (commission.category === 'production' && commission.itemId && commission.itemId !== itemId)) return false
  commission.progress = Math.min(commission.target, commission.progress + amount)
  return true
}

export const recordGuildCommissionProgressBatch = (state: GameState, events: readonly GuildCommissionProgressEvent[]) => {
  const commission = state.progress.arcaneGuild.activeCommission
  let changed = false
  for (const event of events) {
    const amount = safeInt(event.amount ?? 1)
    if (amount <= 0) continue
    changed = recordGuildCommissionChainProgress(state, event.category, amount, event.itemId) || changed
    if (commission) changed = updateCommissionProgress(commission, event.category, amount, event.itemId) || changed
  }
  if (commission && (commission.components
    ? commission.components.every((component) => component.progress >= component.target)
    : commission.progress >= commission.target)) finishCommission(state, commission)
  return changed
}

export const deliverGuildCommissionItems = (state: GameState, amount: number | 'max') => {
  const guild = state.progress.arcaneGuild
  const commission = guild.activeCommission
  const deliveryComponent = commission?.category === 'mixed' ? commission.components?.find((component) => component.category === 'delivery' && component.itemId && component.progress < component.target) : undefined
  const itemId = commission?.category === 'delivery' ? commission.itemId : deliveryComponent?.itemId
  if (!commission || !itemId || (commission.category !== 'delivery' && !deliveryComponent)) return false
  const remaining = Math.max(0, (deliveryComponent?.target ?? commission.target) - (deliveryComponent?.progress ?? commission.progress))
  const wanted = amount === 'max' ? remaining : Math.min(remaining, safeInt(amount))
  const quantity = Math.min(wanted, getConsumableQuantity(state, itemId))
  if (quantity < 1 || state.protectedItems[itemId]) return false
  state.inventory[itemId] = Math.max(0, (state.inventory[itemId] ?? 0) - quantity)
  if (commission.category === 'mixed') recordGuildCommissionProgressBatch(state, [{ category: 'delivery', amount: quantity, itemId }])
  else {
    commission.progress += quantity
    recordGuildCommissionChainProgress(state, 'delivery', quantity, itemId)
    if (commission.progress >= commission.target) finishCommission(state, commission)
  }
  return true
}

export const recordGuildCommissionProgress = (state: GameState, category: GuildCommissionCategory, amount = 1, itemId?: GameState['progress']['discoveredItems'][number]) => {
  return recordGuildCommissionProgressBatch(state, [{ category, amount, itemId }])
}

export const refreshGuildCommissionChoices = (state: GameState) => {
  const guild = state.progress.arcaneGuild
  if (!state.progress.guildUnlocked || guild.freeRefreshes < 1) return false
  guild.freeRefreshes -= 1
  guild.generationCount += 1
  guild.availableCommissions = generateGuildCommissionChoices(state)
  return true
}

export const debugSetGuildCommissionRngSeed = (state: GameState, seed: number) => { state.progress.arcaneGuild.rngState = safeInt(seed) || 1 }
export const debugRegenerateGuildCommissionBoard = (state: GameState, options: GuildCommissionGenerationOptions = {}) => {
  state.progress.guildUnlocked = true
  if (state.progress.guildRank === 'outsider') state.progress.guildRank = 'initiate'
  if (options.templateId || options.quality) state.progress.tutorialStage = 'complete'
  const requestedTemplate = options.templateId ? GUILD_COMMISSION_TEMPLATES.find((template) => template.id === options.templateId) : undefined
  const requestedQuality = options.quality ?? requestedTemplate?.complexity ?? 'routine'
  const minimumRankId = BALANCE.arcaneGuild.rankMinimumQuality[requestedQuality]
  const minimumRank = GUILD_RANKS.find((rank) => rank.id === minimumRankId) ?? GUILD_RANKS[0]
  const currentRankOrder = rankOrder(state.progress.guildRank)
  if (currentRankOrder < minimumRank.order) state.progress.guildRank = minimumRank.id
  const templatesToPrepare = requestedTemplate ? [requestedTemplate] : options.quality ? GUILD_COMMISSION_TEMPLATES.filter((template) => (template.complexity ?? 'routine') === options.quality) : []
  if (templatesToPrepare.length) {
    const itemIds = templatesToPrepare.flatMap((template) => [template.itemId, ...(template.components ?? []).map((component) => component.itemId)]).filter((id): id is NonNullable<typeof id> => Boolean(id))
    itemIds.forEach((itemId) => { if (!state.progress.discoveredItems.includes(itemId)) grantItem(state, itemId, 1) })
  }
  state.progress.arcaneGuild.generationCount += 1
  state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state, options)
  return state.progress.arcaneGuild.availableCommissions
}
