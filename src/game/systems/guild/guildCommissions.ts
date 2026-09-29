import { GUILD_COMMISSION_TEMPLATES, type GuildCommissionTemplate } from '../../content/guild/guildRequests'
import { GUILD_RANKS } from '../../content/guild/guildRanks'
import { DUNGEONS, DUNGEON_ORDER, isDungeonUnlocked } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { ITEMS } from '../../content/items/items'
import { TRANSMUTATION_RECIPES } from '../../content/recipes/transmutationRecipes'
import { isRecipeUnlocked } from '../../content/recipes/recipeUnlocks'
import { RESONANCE_TYPES } from '../../content/resonance/resonance'
import { grantItem } from '../inventory/itemAcquisition'
import { BALANCE } from '../../core/balance/balance'
import { getConsumableQuantity } from '../../core/inventory/inventoryConsumption'
import { spendResonanceBundle } from '../resonance/resonanceRuntime'
import { pushNotification } from '../../engine'
import { reconcileChronicleProgress } from '../chronicles/chronicleRuntime'
import { getGuildProgressionBonuses } from './guildSelectors'
import { recordGuildCommissionChainProgress } from './guildCommissionChains'
import type { GameState, GuildCommissionCategory, GuildCommissionObjective, GuildCommissionQuality, GuildCommissionState, ItemId, ResonanceType, SchoolId, TransmutationRecipeId } from '../../types'

const safeInt = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0))
const safeAmount = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0)
const stageOrder = ['choose-school', 'combat', 'first-kill', 'tower-work', 'channeling', 'transmutation', 'research', 'complete'] as const
const rankOrder = (rank: GameState['progress']['guildRank']) => GUILD_RANKS.findIndex((entry) => entry.id === rank)
const accessibleStage = (state: GameState, stage: GuildCommissionTemplate['minimumProgressStage']) => stage === 'guild' || stageOrder.indexOf(state.progress.tutorialStage) >= stageOrder.indexOf(stage)
const recipeAccessible = (state: GameState, recipeId: TransmutationRecipeId) => Boolean(TRANSMUTATION_RECIPES[recipeId] && isRecipeUnlocked(state, TRANSMUTATION_RECIPES[recipeId]))
const unlockedMonsters = (state: GameState) => DUNGEON_ORDER.filter((id) => isDungeonUnlocked(DUNGEONS[id], state.progress)).flatMap((id) => [...DUNGEONS[id].monsterPool, ...(DUNGEONS[id].encounterSequence ?? []), DUNGEONS[id].boss])
const resonanceObtainable = (state: GameState, type: ResonanceType) => unlockedMonsters(state).some((monsterId) => (MONSTERS[monsterId].resonanceYield?.[type] ?? 0) > 0)
const itemObtainable = (state: GameState, itemId: ItemId) => itemId === 'life-essence' || state.progress.discoveredItems.includes(itemId) || getConsumableQuantity(state, itemId) > 0 || unlockedMonsters(state).some((id) => MONSTERS[id].loot.some((drop) => drop.itemId === itemId)) || Object.values(TRANSMUTATION_RECIPES).some((recipe) => recipe.output.itemId === itemId && recipeAccessible(state, recipe.id))
const objectiveAccessible = (state: GameState, objective: import('../../types').GuildCommissionObjectiveDefinition) => {
  switch (objective.kind) {
    case 'item-supply': return itemObtainable(state, objective.itemId)
    case 'resonance-supply': return resonanceObtainable(state, objective.resonanceType)
    case 'channeling': return true
    case 'production': return Object.values(TRANSMUTATION_RECIPES).some((recipe) => recipe.output.itemId === objective.itemId && recipeAccessible(state, recipe.id))
    case 'research': return state.progress.tutorialStage === 'research' || state.progress.tutorialStage === 'complete'
      ? objective.schoolId ? state.schools[objective.schoolId].level < state.progress.magicLevelCap : Object.values(state.schools).some((school) => school.level < state.progress.magicLevelCap)
      : false
    case 'transmutation': return objective.recipeId ? recipeAccessible(state, objective.recipeId) : Object.values(TRANSMUTATION_RECIPES).some((recipe) => recipeAccessible(state, recipe.id))
  }
}
const templateIsAccessible = (state: GameState, template: GuildCommissionTemplate) => state.progress.guildUnlocked && accessibleStage(state, template.minimumProgressStage) && template.objectives.every((objective) => objectiveAccessible(state, objective))

const nextGuildRandom = (state: GameState) => {
  const guild = state.progress.arcaneGuild
  let value = safeInt(guild.rngState) || 2246822519
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5
  guild.rngState = value >>> 0
  return guild.rngState / 0x100000000
}
const objectiveSignature = (objective: GuildCommissionObjective) => {
  switch (objective.kind) {
    case 'item-supply': return { kind: objective.kind, itemId: objective.itemId }
    case 'resonance-supply': return { kind: objective.kind, resonanceType: objective.resonanceType }
    case 'channeling': return { kind: objective.kind, metric: objective.metric }
    case 'production': return { kind: objective.kind, itemId: objective.itemId }
    case 'research': return { kind: objective.kind, schoolId: objective.schoolId ?? null }
    case 'transmutation': return { kind: objective.kind, recipeId: objective.recipeId ?? null }
  }
}
const commissionSignature = (commission: GuildCommissionState) => JSON.stringify({ category: commission.category, objectives: commission.objectives.map(objectiveSignature) })
const qualityOrder: GuildCommissionQuality[] = ['routine', 'special', 'prestigious']
const chooseQuality = (state: GameState, available: ReadonlySet<GuildCommissionQuality>, forcedQuality?: GuildCommissionQuality): GuildCommissionQuality | null => {
  const qualityRanks = BALANCE.arcaneGuild.rankMinimumQuality
  const qualityOffset = getGuildProgressionBonuses(state).specialCommissionAccess ? 1 : 0
  const eligible = qualityOrder.filter((quality) => available.has(quality) && BALANCE.arcaneGuild.qualityWeights[quality] > 0 && rankOrder(state.progress.guildRank) + qualityOffset >= GUILD_RANKS.findIndex((rank) => rank.id === qualityRanks[quality]))
  if (forcedQuality) return eligible.includes(forcedQuality) ? forcedQuality : null
  const total = eligible.reduce((sum, quality) => sum + BALANCE.arcaneGuild.qualityWeights[quality], 0)
  if (total <= 0) return null
  let roll = nextGuildRandom(state) * total
  for (const quality of eligible) { roll -= BALANCE.arcaneGuild.qualityWeights[quality]; if (roll < 0) return quality }
  return eligible[0] ?? null
}
const scaled = (target: number, quality: GuildCommissionQuality) => Math.max(1, Math.ceil(target * BALANCE.arcaneGuild.qualityTargetMultipliers[quality]))
const qualityOf = (template: GuildCommissionTemplate): GuildCommissionQuality => template.complexity ?? 'routine'
const categoryFor = (template: GuildCommissionTemplate) => template.category === 'mixed' ? [...new Set(template.objectives.map((objective) => objective.kind))].sort().join('+') : template.category

export interface GuildCommissionGenerationOptions { quality?: GuildCommissionQuality; templateId?: string }
export const getGuildCommissionChoiceCount = (state: Pick<GameState, 'progress'>) => BALANCE.arcaneGuild.baseCommissionChoices + getGuildProgressionBonuses(state).commissionChoiceBonus

const makeOffer = (state: GameState, template: GuildCommissionTemplate, quality: GuildCommissionQuality, index: number): GuildCommissionState => {
  const multiplier = BALANCE.arcaneGuild.qualityTargetMultipliers[quality]
  const bonuses = getGuildProgressionBonuses(state)
  const objectives = template.objectives.map((definition) => {
    const amount = scaled(definition.target, quality)
    const target = definition.kind === 'item-supply' ? Math.max(1, Math.floor(amount * bonuses.deliveryQuantityMultiplier)) : amount
    return { ...definition, target, progress: 0 } as GuildCommissionObjective
  })
  return {
    id: `guild-${state.progress.arcaneGuild.generationCount}-${index}-${template.id}`,
    templateId: template.id,
    category: template.category,
    quality,
    objectives,
    reputationReward: Math.round(template.baseReputation * multiplier),
    advancementPointReward: template.baseAdvancementPoints,
  }
}

export const generateGuildCommissionChoices = (state: GameState, options: GuildCommissionGenerationOptions = {}): GuildCommissionState[] => {
  if (!state.progress.guildUnlocked) return []
  const eligible = GUILD_COMMISSION_TEMPLATES.filter((template) => templateIsAccessible(state, template) && (!options.templateId || template.id === options.templateId))
  if (!eligible.length) return []
  const choiceCount = Math.min(eligible.length, options.templateId ? 1 : getGuildCommissionChoiceCount(state))
  if (options.templateId) {
    const template = eligible[0]
    const quality = chooseQuality(state, new Set([qualityOf(template)]), options.quality ?? qualityOf(template))
    return quality ? [makeOffer(state, template, quality, 0)] : []
  }
  const selected: GuildCommissionState[] = []
  const signatures = new Set<string>()
  const remaining = [...eligible]
  const chosenCategories = new Set<string>()
  let hasPureSupply = false
  for (let index = 0; index < choiceCount && remaining.length; index += 1) {
    const quality = chooseQuality(state, new Set(remaining.map(qualityOf)), options.quality)
    if (!quality) break
    const tierPool = remaining.filter((template) => qualityOf(template) === quality && !(hasPureSupply && template.category === 'supply'))
    if (!tierPool.length) break
    const diversityPool = tierPool.filter((template) => !chosenCategories.has(categoryFor(template)))
    let candidatePool = diversityPool.length ? diversityPool : tierPool
    const lifeEssenceSupply = candidatePool.find((template) => template.id === 'supply-life-essence')
    if (!hasPureSupply && lifeEssenceSupply) candidatePool = [lifeEssenceSupply]
    const totalWeight = candidatePool.reduce((sum, template) => sum + Math.max(0, template.weight ?? 1), 0)
    let roll = nextGuildRandom(state) * totalWeight
    let chosenIndex = 0
    for (; chosenIndex < candidatePool.length - 1; chosenIndex += 1) { roll -= Math.max(0, candidatePool[chosenIndex].weight ?? 1); if (roll < 0) break }
    const template = candidatePool[chosenIndex]
    const offer = makeOffer(state, template, quality, index)
    const signature = commissionSignature(offer)
    remaining.splice(remaining.findIndex((entry) => entry.id === template.id), 1)
    if (signatures.has(signature)) continue
    selected.push(offer)
    signatures.add(signature)
    chosenCategories.add(categoryFor(template))
    hasPureSupply ||= template.category === 'supply'
  }
  return selected
}

export const ensureGuildCommissionChoices = (state: GameState) => {
  if (!state.progress.guildUnlocked || state.progress.arcaneGuild.activeCommission || state.progress.arcaneGuild.availableCommissions.length) return
  state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state)
}

const isComplete = (commission: GuildCommissionState) => commission.objectives.length > 0 && commission.objectives.every((objective) => objective.progress >= objective.target)
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
  const template = commission && GUILD_COMMISSION_TEMPLATES.find((entry) => entry.id === commission.templateId)
  if (!commission || !template || !templateIsAccessible(state, template)) return false
  guild.activeCommission = { ...commission, objectives: commission.objectives.map((objective) => ({ ...objective })) }
  guild.availableCommissions = guild.availableCommissions.filter((entry) => entry.id !== commissionId)
  return true
}

export type GuildCommissionProgressEvent =
  | { category: 'production'; itemId: ItemId; amount: number }
  | { category: 'research'; schoolId?: SchoolId; amount?: number }
  | { category: 'transmutation'; recipeId: TransmutationRecipeId; amount?: number }
  | { category: 'channeling'; metric: 'arcane-flux'; amount: number }

const updateCommissionProgress = (commission: GuildCommissionState, event: GuildCommissionProgressEvent) => {
  let changed = false
  for (const objective of commission.objectives) {
    const amount = event.category === 'channeling' ? safeAmount(event.amount) : safeInt(event.amount ?? 1)
    const matches = (event.category === 'production' && objective.kind === 'production' && objective.itemId === event.itemId)
      || (event.category === 'research' && objective.kind === 'research' && (!objective.schoolId || objective.schoolId === event.schoolId))
      || (event.category === 'transmutation' && objective.kind === 'transmutation' && (!objective.recipeId || objective.recipeId === event.recipeId))
      || (event.category === 'channeling' && objective.kind === 'channeling' && objective.metric === event.metric)
    if (!matches || amount <= 0 || objective.progress >= objective.target) continue
    const before = objective.progress
    objective.progress = Math.min(objective.target, objective.progress + amount)
    changed ||= objective.progress > before
  }
  return changed
}

export const recordGuildCommissionProgressBatch = (state: GameState, events: readonly GuildCommissionProgressEvent[]) => {
  const commission = state.progress.arcaneGuild.activeCommission
  let changed = false
  for (const event of events) {
    const amount = event.category === 'channeling' ? safeAmount(event.amount) : safeInt(event.amount ?? 1)
    if (amount <= 0) continue
    if (event.category !== 'channeling') recordGuildCommissionChainProgress(state, event.category, amount, event.category === 'production' ? event.itemId : undefined)
    if (commission) changed = updateCommissionProgress(commission, event) || changed
  }
  if (commission && isComplete(commission)) finishCommission(state, commission)
  return changed
}

export const contributeGuildCommissionSupply = (state: GameState, objectiveIndex: number, amount: number | 'max') => {
  const commission = state.progress.arcaneGuild.activeCommission
  const objective = commission?.objectives[objectiveIndex]
  if (!commission || !objective || (objective.kind !== 'item-supply' && objective.kind !== 'resonance-supply') || objective.progress >= objective.target) return false
  const remaining = Math.ceil(objective.target - objective.progress)
  const requested = amount === 'max' ? remaining : Math.min(remaining, safeInt(amount))
  if (requested < 1) return false
  let quantity = 0
  if (objective.kind === 'item-supply') {
    if (state.protectedItems[objective.itemId]) return false
    quantity = Math.min(requested, getConsumableQuantity(state, objective.itemId))
    if (quantity > 0) state.inventory[objective.itemId] = Math.max(0, (state.inventory[objective.itemId] ?? 0) - quantity)
  } else {
    quantity = Math.min(requested, safeInt(state.resonance[objective.resonanceType]))
    if (quantity > 0) spendResonanceBundle(state.resonance, { [objective.resonanceType]: quantity })
  }
  if (quantity < 1) return false
  objective.progress = Math.min(objective.target, objective.progress + quantity)
  if (isComplete(commission)) finishCommission(state, commission)
  return true
}

/** Compatibility action name retained for Developer Tools and existing callers. */
export const deliverGuildCommissionItems = (state: GameState, amount: number | 'max') => {
  const commission = state.progress.arcaneGuild.activeCommission
  const index = commission?.objectives.findIndex((objective) => objective.kind === 'item-supply' && objective.progress < objective.target) ?? -1
  return index >= 0 ? contributeGuildCommissionSupply(state, index, amount) : false
}

export const recordGuildCommissionProgress = (state: GameState, category: 'production' | 'research' | 'transmutation' | 'channeling', amount = 1, itemId?: ItemId, schoolId?: SchoolId) => {
  if (category === 'production') return itemId ? recordGuildCommissionProgressBatch(state, [{ category, amount, itemId }]) : false
  if (category === 'research') return recordGuildCommissionProgressBatch(state, [{ category, amount, schoolId }])
  if (category === 'transmutation') return recordGuildCommissionProgressBatch(state, [{ category, amount, recipeId: 'fire-fragment' }])
  return recordGuildCommissionProgressBatch(state, [{ category, amount, metric: 'arcane-flux' }])
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
  const requestedQuality = options.quality ?? (requestedTemplate ? qualityOf(requestedTemplate) : 'routine')
  const minimumRankId = BALANCE.arcaneGuild.rankMinimumQuality[requestedQuality]
  const minimumRank = GUILD_RANKS.find((rank) => rank.id === minimumRankId) ?? GUILD_RANKS[0]
  if (rankOrder(state.progress.guildRank) < minimumRank.order) state.progress.guildRank = minimumRank.id
  const templatesToPrepare = requestedTemplate ? [requestedTemplate] : options.quality ? GUILD_COMMISSION_TEMPLATES.filter((template) => qualityOf(template) === options.quality) : []
  for (const template of templatesToPrepare) for (const objective of template.objectives) {
    if (objective.kind === 'item-supply' || objective.kind === 'production') {
      if (!state.progress.discoveredItems.includes(objective.itemId)) grantItem(state, objective.itemId, 1)
    }
  }
  state.progress.arcaneGuild.generationCount += 1
  state.progress.arcaneGuild.availableCommissions = generateGuildCommissionChoices(state, options)
  return state.progress.arcaneGuild.availableCommissions
}
