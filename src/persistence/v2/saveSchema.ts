import { isRecord } from '../saveSchema'
import { PERSISTED_COMBAT_FIELDS_V1, type PersistedGameStateV1 } from './persistedGameState'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS } from '../../game/content/monsters'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { HUNTER_RANKS } from '../../game/content/huntersOrder/hunterRanks'
import { HUNTER_UPGRADES } from '../../game/content/huntersOrder/hunterUpgrades'
import { GUILD_SKILL_NODES } from '../../game/content/guild/guildSkills'
import { TRANSMUTATION_RECIPES } from '../../game/content/recipes/transmutationRecipes'
import { ARTIFICING_RECIPES } from '../../game/content/recipes/artificingRecipes'
import { RESEARCH_SLOT_ORDER } from '../../game/systems/research/researchReservations'
import { WORLD_TIER_IDS } from '../../game/content/world-tier/worldTiers'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'

const gameplayFields = [
  'player', 'schools', 'currencies', 'resonance', 'tower', 'worldTier', 'inventory', 'crystals',
  'protectedItems', 'equipment', 'arcaneCore', 'artifactProgress', 'sigils', 'guardians', 'activities',
  'combat', 'progress', 'storyProgress', 'darkPortal', 'spellPresets',
] as const
const documentFields = new Set(['schemaVersion', 'savedAt', 'offlineBankMs', ...gameplayFields])
const playerFields = ['health', 'mana', 'baseMaxHealth', 'baseMaxMana', 'healthRegenTimerMs'] as const
const combatFields = new Set<string>(PERSISTED_COMBAT_FIELDS_V1)
const isFiniteTree = (value: unknown): boolean => {
  if (typeof value === 'number') return Number.isFinite(value)
  if (Array.isArray(value)) return value.every(isFiniteTree)
  if (isRecord(value)) return Object.values(value).every(isFiniteTree)
  return true
}
const isNonNegativeNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const isHunterTarget = (value: unknown) => {
  if (!isRecord(value) || typeof value.type !== 'string') return false
  if (value.type === 'monster' || value.type === 'boss') return typeof value.monsterId === 'string' && Object.prototype.hasOwnProperty.call(MONSTERS, value.monsterId)
  if (value.type === 'region') return typeof value.dungeonId === 'string' && Object.prototype.hasOwnProperty.call(DUNGEONS, value.dungeonId)
  if (value.type === 'family' || value.type === 'alignment') {
    const field = `${value.type}Id`
    const target = value[field]
    return typeof target === 'string' && Object.values(MONSTERS).some((monster) => monster.hunter?.[value.type as 'family' | 'alignment'] === target)
  }
  return false
}
const isHunterContract = (value: unknown) => isRecord(value)
  && typeof value.id === 'string' && value.id.length > 0
  && isHunterTarget(value.targetSpec)
  && isNonNegativeNumber(value.target) && value.target > 0
  && isNonNegativeNumber(value.progress) && value.progress <= value.target
  && ['routine', 'special', 'prestigious'].includes(String(value.tier))
  && isNonNegativeNumber(value.reputationReward) && isNonNegativeNumber(value.marksReward)
const isGuildCommission = (value: unknown) => {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || typeof value.templateId !== 'string' || !value.templateId) return false
  if (!['delivery', 'production', 'research', 'transmutation', 'mixed'].includes(String(value.category))) return false
  if (!['routine', 'special', 'prestigious'].includes(String(value.quality))) return false
  if (!isNonNegativeNumber(value.target) || value.target <= 0 || !isNonNegativeNumber(value.progress) || value.progress > value.target) return false
  if (!isNonNegativeNumber(value.reputationReward) || !isNonNegativeNumber(value.advancementPointReward)) return false
  if (value.itemId !== undefined && (typeof value.itemId !== 'string' || !Object.prototype.hasOwnProperty.call(ITEMS, value.itemId))) return false
  if (value.components !== undefined) {
    if (!Array.isArray(value.components)) return false
    if (value.components.some((component) => {
      if (!isRecord(component)) return true
      if (!['delivery', 'production', 'research', 'transmutation'].includes(String(component.category))) return true
      if (!isNonNegativeNumber(component.target) || component.target <= 0 || !isNonNegativeNumber(component.progress) || component.progress > component.target) return true
      return component.itemId !== undefined && (typeof component.itemId !== 'string' || !Object.prototype.hasOwnProperty.call(ITEMS, component.itemId))
    })) return false
  }
  return true
}

export const validatePersistedGameStateV1 = (value: unknown): value is PersistedGameStateV1 => {
  if (!isRecord(value) || value.schemaVersion !== 1) return false
  if (Object.keys(value).some((key) => !documentFields.has(key))) return false
  if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || value.savedAt < 0) return false
  if (typeof value.offlineBankMs !== 'number' || !Number.isFinite(value.offlineBankMs) || value.offlineBankMs < 0) return false
  if (!gameplayFields.every((field) => isRecord(value[field]))) return false
  const player = value.player as Record<string, unknown>
  if (Object.keys(player).some((key) => !playerFields.includes(key as typeof playerFields[number]))) return false
  if (!playerFields.every((key) => typeof player[key] === 'number' && Number.isFinite(player[key]))) return false
  const combat = value.combat as Record<string, unknown>
  if (Object.keys(combat).some((key) => !combatFields.has(key)) || PERSISTED_COMBAT_FIELDS_V1.some((key) => !Object.prototype.hasOwnProperty.call(combat, key))) return false
  const inventory = value.inventory as Record<string, unknown>
  if (Object.entries(inventory).some(([id, quantity]) => !Object.prototype.hasOwnProperty.call(ITEMS, id) || typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 0)) return false
  const protectedItems = value.protectedItems as Record<string, unknown>
  if (Object.keys(protectedItems).some((id) => !Object.prototype.hasOwnProperty.call(ITEMS, id))) return false
  const equipment = value.equipment as Record<string, unknown>
  if (Object.values(equipment).some((id) => id !== null && (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(ITEMS, id) || ITEMS[id as keyof typeof ITEMS].kind !== 'equipment'))) return false
  if (!isFiniteTree(value)) return false

  const progress = value.progress as Record<string, unknown>
  if (!GUILD_RANKS.some((rank) => rank.id === progress.guildRank)) return false
  const hunters = progress.huntersOrder
  if (!isRecord(hunters) || !HUNTER_RANKS.some((rank) => rank.id === hunters.rankId)) return false
  for (const key of ['reputation', 'hunterMarks', 'totalContractsAccepted', 'totalContractsCompleted', 'totalHunterKills', 'generationCount', 'rngState']) {
    if (!isNonNegativeNumber(hunters[key])) return false
  }
  if (hunters.activeContract !== null && !isHunterContract(hunters.activeContract)) return false
  if (!Array.isArray(hunters.availableContracts) || !hunters.availableContracts.every(isHunterContract)) return false
  if (!Array.isArray(hunters.blockedTargets) || hunters.blockedTargets.some((id) => typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(MONSTERS, id))) return false
  if (!isRecord(hunters.purchasedUpgrades) || Object.entries(hunters.purchasedUpgrades).some(([id, rank]) => !HUNTER_UPGRADES.some((entry) => entry.id === id) || !Number.isInteger(rank) || (rank as number) < 0)) return false
  if (!isRecord(hunters.monsterHunterStats) || Object.entries(hunters.monsterHunterStats).some(([id, stats]) => !Object.prototype.hasOwnProperty.call(MONSTERS, id) || !isRecord(stats) || !['contractKills', 'contractsCompleted', 'marksEarned'].every((key) => isNonNegativeNumber(stats[key])))) return false

  const guild = progress.arcaneGuild
  if (!isRecord(guild)) return false
  for (const key of ['generationCount', 'completedCommissions', 'freeRefreshes', 'rngState']) if (!isNonNegativeNumber(guild[key])) return false
  if (!Array.isArray(guild.availableCommissions) || !guild.availableCommissions.every(isGuildCommission)) return false
  if (guild.activeCommission !== null && !isGuildCommission(guild.activeCommission)) return false
  if (guild.activeCommissionChain !== null && (!isRecord(guild.activeCommissionChain) || typeof guild.activeCommissionChain.id !== 'string' || !isNonNegativeNumber(guild.activeCommissionChain.stageIndex) || !isNonNegativeNumber(guild.activeCommissionChain.stageProgress))) return false
  if (!Array.isArray(guild.completedProjectIds) || !guild.completedProjectIds.every((id) => typeof id === 'string')) return false
  if (!Array.isArray(guild.completedChainIds) || !guild.completedChainIds.every((id) => typeof id === 'string')) return false
  if (!isRecord(guild.projects) || Object.values(guild.projects).some((project) => !isRecord(project) || Object.entries(project).some(([id, amount]) => !Object.prototype.hasOwnProperty.call(ITEMS, id) || !isNonNegativeNumber(amount)))) return false
  if (!isRecord(progress.guildSkillNodeRanks) || Object.entries(progress.guildSkillNodeRanks).some(([id, rank]) => !Object.prototype.hasOwnProperty.call(GUILD_SKILL_NODES, id) || !Number.isInteger(rank) || (rank as number) < 0 || (rank as number) > GUILD_SKILL_NODES[id as keyof typeof GUILD_SKILL_NODES].maxRank)) return false

  const combatDungeon = (combat as Record<string, unknown>).dungeonId
  const combatEnemy = (combat as Record<string, unknown>).enemyId
  const combatTarget = (combat as Record<string, unknown>).targetEnemyId
  const combatTier = (combat as Record<string, unknown>).enemyWorldTier
  if (combatDungeon !== null && (typeof combatDungeon !== 'string' || !Object.prototype.hasOwnProperty.call(DUNGEONS, combatDungeon))) return false
  for (const id of [combatEnemy, combatTarget]) if (id !== null && (typeof id !== 'string' || !Object.prototype.hasOwnProperty.call(MONSTERS, id))) return false
  if (combatTier !== null && !WORLD_TIER_IDS.includes(combatTier as typeof WORLD_TIER_IDS[number])) return false
  if (typeof (combat as Record<string, unknown>).combatRngState !== 'number' || !Number.isFinite((combat as Record<string, unknown>).combatRngState)) return false
  const worldTier = value.worldTier as Record<string, unknown>
  if (!WORLD_TIER_IDS.includes(worldTier.current as typeof WORLD_TIER_IDS[number]) || !WORLD_TIER_IDS.includes(worldTier.highestUnlocked as typeof WORLD_TIER_IDS[number])) return false

  const activities = value.activities as Record<string, unknown>
  const channeling = activities.channeling
  if (!isRecord(channeling) || !isNonNegativeNumber(channeling.acolytesAssigned)) return false
  const research = activities.research
  if (!isRecord(research) || Object.keys(research).some((key) => key !== 'slots') || !isRecord(research.slots)) return false
  const researchSlots = research.slots as Record<string, unknown>
  if (RESEARCH_SLOT_ORDER.some((slot) => {
    const job = researchSlots[slot]
    return job !== null && job !== undefined && (!isRecord(job)
      || typeof job.itemId !== 'string' || !Object.prototype.hasOwnProperty.call(ITEMS, job.itemId)
      || typeof job.targetSchoolId !== 'string' || !['fire', 'water', 'earth', 'air'].includes(job.targetSchoolId)
      || !isNonNegativeNumber(job.requestedQuantity) || !isNonNegativeNumber(job.remainingQuantity) || job.remainingQuantity > job.requestedQuantity
      || !isNonNegativeNumber(job.progressMs) || (job.acolyteAssigned !== undefined && typeof job.acolyteAssigned !== 'boolean')
      || (job.echoesAssigned !== undefined && !isNonNegativeNumber(job.echoesAssigned))
      || !['prepared', 'running', 'flux-limited', 'waiting-flux', 'mana-limited', 'waiting-mana', 'level-cap', 'protected', 'missing-item'].includes(String(job.status))
      || Object.keys(job).some((key) => !['itemId', 'targetSchoolId', 'requestedQuantity', 'remainingQuantity', 'progressMs', 'acolyteAssigned', 'echoesAssigned', 'status'].includes(key)))
  })) return false
  const transmutation = activities.transmutation
  if (!isRecord(transmutation) || Object.keys(transmutation).some((key) => key !== 'jobs') || !isRecord(transmutation.jobs) || Object.entries(transmutation.jobs).some(([id, job]) => !Object.prototype.hasOwnProperty.call(TRANSMUTATION_RECIPES, id) || !isRecord(job) || !isNonNegativeNumber(job.progressMs) || (job.acolyteAssigned !== undefined && typeof job.acolyteAssigned !== 'boolean') || (job.echoesAssigned !== undefined && !isNonNegativeNumber(job.echoesAssigned)) || Object.keys(job).some((key) => !['acolyteAssigned', 'progressMs', 'echoesAssigned'].includes(key)))) return false
  const artificing = activities.artificing
  if (!isRecord(artificing) || !isNonNegativeNumber(artificing.progressMs)) return false
  if (artificing.activeRecipeId !== undefined && artificing.activeRecipeId !== null && (typeof artificing.activeRecipeId !== 'string' || !Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, artificing.activeRecipeId))) return false
  const job = artificing.activeJob
  if (job !== null && (!isRecord(job) || (job.kind === 'recipe' && (typeof job.recipeId !== 'string' || !Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, job.recipeId))) || (job.kind === 'artifact-forge' && (typeof job.artifactId !== 'string' || !Object.prototype.hasOwnProperty.call(ARTIFACTS, job.artifactId))) || (job.kind !== 'recipe' && job.kind !== 'artifact-forge'))) return false
  return true
}

export const parsePersistedGameStateV1 = (encoded: string): PersistedGameStateV1 => {
  const value: unknown = JSON.parse(encoded)
  if (!validatePersistedGameStateV1(value)) throw new Error('Save does not match the V2 schema.')
  return value
}
