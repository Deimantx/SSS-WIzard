import { isRecord } from '../saveSchema'
import { migrateSchema2LocationFields } from '../legacy/schema2LocationMigration'
import { PERSISTED_COMBAT_FIELDS_V3, PERSISTED_UI_FIELDS, type PersistedGameStateV3 } from './persistedGameState'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS } from '../../game/content/monsters'
import { isCombatLocationId } from '../../game/content/combat-locations/combatLocationIds'
import { HUNTER_RANKS } from '../../game/content/hunters-order/hunterRanks'
import { HUNTER_UPGRADES } from '../../game/content/hunters-order/hunterUpgrades'
import { GUILD_SKILL_NODES } from '../../game/content/guild/guildSkills'
import { TRANSMUTATION_RECIPES } from '../../game/content/recipes/transmutationRecipes'
import { ARTIFICING_RECIPES } from '../../game/content/recipes/artificingRecipes'
import { RESEARCH_SLOT_ORDER } from '../../game/systems/research/researchReservations'
import { WORLD_TIER_IDS } from '../../game/content/world-tier/worldTiers'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { RESONANCE_TYPES } from '../../game/content/resonance/resonance'
import { SCHOOLS } from '../../game/content/schools/schools'
import { ELEMENT_IDS } from '../../game/content/elements/elements'

const gameplayFields = [
  'player', 'schools', 'currencies', 'resonance', 'tower', 'worldTier', 'inventory', 'crystals',
  'protectedItems', 'equipment', 'arcaneCore', 'artifactProgress', 'sigils', 'guardians', 'activities',
  'combat', 'progress', 'storyProgress', 'darkPortal', 'spellPresets',
] as const
const documentFields = new Set(['schemaVersion', 'contentVersion', 'savedAt', 'offlineBankMs', 'ui', ...gameplayFields])
const playerFields = ['health', 'mana', 'baseMaxHealth', 'baseMaxMana', 'healthRegenTimerMs'] as const
const combatFields = new Set<string>(PERSISTED_COMBAT_FIELDS_V3)
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
  if (value.type === 'ground') return isCombatLocationId(value.groundId)
  if (value.type === 'family' || value.type === 'alignment') {
    const field = `${value.type}Id`
    const target = value[field]
    return typeof target === 'string' && Object.values(MONSTERS).some((monster) => monster.hunter?.[value.type as 'family' | 'alignment'] === target)
  }
  return false
}
const isHunterContract = (value: unknown) => isRecord(value)
  && typeof value.id === 'string' && value.id.length > 0
  && (value.huntingGroundId === undefined || isCombatLocationId(value.huntingGroundId))
  && isHunterTarget(value.targetSpec)
  && isNonNegativeNumber(value.target) && value.target > 0
  && isNonNegativeNumber(value.progress) && value.progress <= value.target
  && ['routine', 'special', 'prestigious'].includes(String(value.tier))
  && isNonNegativeNumber(value.reputationReward) && isNonNegativeNumber(value.marksReward)
const isGuildCommission = (value: unknown) => {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || typeof value.templateId !== 'string' || !value.templateId) return false
  if (!['supply', 'channeling', 'production', 'research', 'transmutation', 'mixed'].includes(String(value.category))) return false
  if (!['routine', 'special', 'prestigious'].includes(String(value.quality))) return false
  if (!isNonNegativeNumber(value.reputationReward) || !isNonNegativeNumber(value.advancementPointReward)) return false
  if (!Array.isArray(value.objectives) || value.objectives.length < 1 || value.objectives.some((objective) => {
    if (!isRecord(objective) || !isNonNegativeNumber(objective.target) || objective.target <= 0 || !isNonNegativeNumber(objective.progress) || objective.progress > objective.target) return true
    if (objective.kind === 'item-supply' || objective.kind === 'production') return typeof objective.itemId !== 'string' || !Object.prototype.hasOwnProperty.call(ITEMS, objective.itemId)
    if (objective.kind === 'resonance-supply') return !RESONANCE_TYPES.includes(objective.resonanceType as typeof RESONANCE_TYPES[number])
    if (objective.kind === 'channeling') return objective.metric !== 'arcane-flux'
    if (objective.kind === 'research') return objective.schoolId !== undefined && (typeof objective.schoolId !== 'string' || !Object.prototype.hasOwnProperty.call(SCHOOLS, objective.schoolId))
    if (objective.kind === 'transmutation') return objective.recipeId !== undefined && (typeof objective.recipeId !== 'string' || !Object.prototype.hasOwnProperty.call(TRANSMUTATION_RECIPES, objective.recipeId))
    return true
  })) return false
  return true
}

export const validatePersistedGameStateV3 = (value: unknown): value is PersistedGameStateV3 => {
  if (!isRecord(value) || value.schemaVersion !== 3) return false
  if (Object.keys(value).some((key) => !documentFields.has(key))) return false
  if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt) || value.savedAt < 0) return false
  if (typeof value.offlineBankMs !== 'number' || !Number.isFinite(value.offlineBankMs) || value.offlineBankMs < 0) return false
  if (!gameplayFields.every((field) => isRecord(value[field]))) return false
  const player = value.player as Record<string, unknown>
  if (Object.keys(player).some((key) => !playerFields.includes(key as typeof playerFields[number]))) return false
  if (!playerFields.every((key) => typeof player[key] === 'number' && Number.isFinite(player[key]))) return false
  const combat = value.combat as Record<string, unknown>
  if (Object.keys(combat).some((key) => !combatFields.has(key)) || PERSISTED_COMBAT_FIELDS_V3.some((key) => key !== 'elementalDamageReductions' && !Object.prototype.hasOwnProperty.call(combat, key))) return false
  if (combat.elementalDamageReductions !== undefined && (!Array.isArray(combat.elementalDamageReductions)
    || combat.elementalDamageReductions.length > 32
    || combat.elementalDamageReductions.some((ward) => !isRecord(ward)
      || !ELEMENT_IDS.includes(ward.element as typeof ELEMENT_IDS[number])
      || typeof ward.sourceId !== 'string' || ward.sourceId.trim().length === 0
      || typeof ward.reduction !== 'number' || !Number.isFinite(ward.reduction) || ward.reduction <= 0 || ward.reduction >= 1
      || (ward.expiresAt !== undefined && (typeof ward.expiresAt !== 'number' || !Number.isFinite(ward.expiresAt) || ward.expiresAt < 0))
      || (ward.durationMs !== undefined && (typeof ward.durationMs !== 'number' || !Number.isFinite(ward.durationMs) || ward.durationMs < 0))))) return false
  if (value.contentVersion !== undefined && (!Number.isInteger(value.contentVersion) || (value.contentVersion as number) < 0)) return false
  if (value.ui !== undefined && (!isRecord(value.ui)
    || Object.keys(value.ui).some((key) => !PERSISTED_UI_FIELDS.includes(key as typeof PERSISTED_UI_FIELDS[number]))
    || (value.ui.lastEnteredCombatLocationId !== undefined && !isCombatLocationId(value.ui.lastEnteredCombatLocationId)))) return false
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
  if (hunters.pinnedContractIds !== undefined && (!Array.isArray(hunters.pinnedContractIds) || hunters.pinnedContractIds.some((id) => typeof id !== 'string'))) return false
  if (hunters.preferredContractType !== undefined && hunters.preferredContractType !== null && !['monster', 'family', 'alignment', 'ground'].includes(String(hunters.preferredContractType))) return false
  if (hunters.preferredHuntingGroundId !== undefined && hunters.preferredHuntingGroundId !== null && !isCombatLocationId(hunters.preferredHuntingGroundId)) return false
  if (hunters.lastSelectedQuarryByGround !== undefined && (!isRecord(hunters.lastSelectedQuarryByGround) || Object.entries(hunters.lastSelectedQuarryByGround).some(([ground, monster]) => !isCombatLocationId(ground) || typeof monster !== 'string' || !Object.prototype.hasOwnProperty.call(MONSTERS, monster as string)))) return false
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

  const combatDungeon = (combat as Record<string, unknown>).locationId
  const combatEnemy = (combat as Record<string, unknown>).enemyId
  const combatTarget = (combat as Record<string, unknown>).targetEnemyId
  const combatTier = (combat as Record<string, unknown>).enemyWorldTier
  if (combatDungeon !== null && !isCombatLocationId(combatDungeon)) return false
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

export const parsePersistedGameStateV3 = (encoded: string): PersistedGameStateV3 => {
  const parsed: unknown = JSON.parse(encoded)
  const value = isRecord(parsed) ? migrateSchema2LocationFields(parsed) : parsed
  if (!validatePersistedGameStateV3(value)) throw new Error('Save does not match the V3 schema.')
  return value
}
