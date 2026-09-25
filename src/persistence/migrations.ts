import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { COMBAT_RNG_DEFAULT_SEED } from '../game/core/balance/combatRng'
import { MANA_PILLAR_IDS } from '../game/data/manaPillars'
import { DUNGEONS, DUNGEON_ORDER } from '../game/content/dungeons/dungeons'
import { getCombatEncounterMode, getCombatLocationByDungeonId, isCombatTargetForLocation } from '../game/content/world-navigation'
import { GUILD_REQUESTS } from '../game/content/guild/guildRequests'
import { ITEMS } from '../game/content/items/items'
import { isBossMonster, MONSTERS } from '../game/content/monsters'
import { TRANSMUTATION_RECIPES as RECIPES } from '../game/content/recipes/recipes'
import { TRANSMUTATION_RECIPE_ORDER as RECIPE_ORDER } from '../game/content/recipes/recipes'
import { ARTIFICING_RECIPES } from '../game/content/recipes/artificingRecipes'
import { TRANSMUTATION_ARRAY_IDS } from '../game/content/transmutation/transmutationArrays'
import { BALANCE } from '../game/core/balance/balance'
import { SCHOOL_MAX_LEVEL, getSchoolTotalXpForLevel } from '../game/core/balance/schoolXpCurve'
import { LEGACY_SPELL_ID_MAP, SPELLS } from '../game/content/spells/spells'
import { SCHOOLS } from '../game/content/schools/schools'
import { EQUIPMENT_POSITIONS, normalizeEquipmentState } from '../game/core/equipment'
import type { ArtifactId, CanonicalSpellId, DungeonId, EquipmentPosition, GameState, ItemId, MonsterId, TransmutationRecipeId, ResearchActivity, ResearchJobState, SchoolId, SpellId, TransmutationJobState } from '../game/types'
import { RESEARCH_SLOT_ORDER } from '../game/systems/research/researchReservations'
import { isRecord, SaveMigrationError } from './saveSchema'
import { recalculateDerivedStats } from '../game/engine'
import { STATUS_DEFINITIONS } from '../game/content/statuses'
import type { ActiveStatus, CombatSource, StatusId } from '../game/types'
import { buildActiveCombatSpellLoadout, DEFAULT_COMBAT_LOADOUT_NAME, getSpellAutoCastFocusCost, MAX_COMBAT_SPELLS, MAX_SPELL_RANK, MIN_SPELL_RANK, normalizeSpellPresetName, normalizeSpellPresetSlots, normalizeSpellPresetState, getSpellPresetSignature, syncAllSpellUnlocks, syncAutoCastRuntimeForLoadout, type SpellRank } from '../game/systems/spells'
import { getStatusApplicationSourceKey } from '../game/systems/combat/statusRuntime'
import { createCombatValidationContext, normalizePersistedPeriodicEffects, hasValidStatusModifierOverrides } from '../game/systems/combat/combatEffectValidation'
import { MAX_ACTION_WORK_MS, MIN_ACTION_TIME_MS } from '../game/core/balance/combatTiming'
import { normalizeCombatRngState } from '../game/systems/combat/combatRng'
import { clampOfflineBankMs } from '../game/systems/offline-bank/offlineBankDuration'
import { ARTIFACTS } from '../game/content/artifacts/artifacts'
import { GUARDIAN_IDS, GUARDIANS, SUMMONING_UNLOCK_BOSS_ID } from '../game/content/guardians/guardians'
import { isSummoningUnlocked } from '../game/systems/summoning/summoningSelectors'
import { normalizeDarkPortalProgress } from '../game/systems/dark-portal/portalShardProgression'
import { isScreenUnlocked, reconcileStoryProgression } from '../game/systems/story/storyProgression'
import { getTransmutationArrayBonuses } from '../game/systems/transmutation/transmutationArrays'
import { ARCANE_CORE_SCHEMA_VERSION } from '../game/content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_COST_BY_RING, ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_MAX_TOTAL_XP, ARCANE_CORE_STANDARD_RANK_COST_BY_RING, ARCANE_CORE_TOTAL_TREE_COST, getArcaneCoreLevelForXp } from '../game/content/arcaneCore/arcaneCoreBalance'
import { getArcaneCoreNode } from '../game/content/arcaneCore/arcaneCoreBranches'
import { normalizeResonanceState } from '../game/systems/resonance/resonanceRuntime'
import { isWorldTierId, reconcileWorldTierProgression, sanitizeWorldTierState } from '../game/systems/world-tier/worldTierRuntime'
import { LEGACY_POWER_THREAT_REQUIREMENTS, resolveBossThreatRequirement } from '../game/systems/combat/combatThreat'
import { isCrystalSystemUnlocked, normalizeCrystalState } from '../game/systems/crystals/crystalRuntime'

const statusValidationContext = createCombatValidationContext(STATUS_DEFINITIONS)

/** Historical kill-count thresholds used by the pre-v44 Elemental Scar pool runs. */
const LEGACY_ELEMENTAL_SCAR_THREAT_REQUIREMENTS: Partial<Record<DungeonId, number>> = {
  'flooded-reliquary': 40,
  'ashen-watch': 40,
  'rootscar-hollow': 40,
}

/** Historical kill-count thresholds for Hall and Vault before v46 Power Threat. */
const LEGACY_BLACK_SIGIL_REACH_THREAT_REQUIREMENTS: Partial<Record<DungeonId, number>> = {
  'hall-of-unbound-names': 60,
  'vault-of-the-black-sigil': 60,
}

/** The save version at which each dungeon became a fixed sequence. */
const SEQUENCE_CONVERSION_VERSION_BY_DUNGEON: Partial<Record<DungeonId, number>> = {
  'fractured-approach': 44,
  'crossroads-of-ruin': 44,
  'broken-meridian': 45,
  'black-gate': 46,
}

/** Historical boss-kill thresholds for Shattered locations before v45. */
const LEGACY_SHATTERED_MERIDIAN_THREAT_REQUIREMENTS: Partial<Record<DungeonId, number>> = {
  'graveglass-hollow': 50,
  'stormvault-gallery': 50,
  'starfallen-observatory': 50,
}

const normalizeScreen = (value: unknown, fallback: GameState['ui']['screen']): GameState['ui']['screen'] => {
  if (value === 'tower') return 'tower-channeling'
  const valid = ['home', 'combat', 'schools', 'inventory', 'equipment', 'arcane-core', 'crystals', 'collection', 'bestiary', 'tower-channeling', 'tower-focus', 'tower-research', 'tower-transmutation', 'tower-artificing', 'tower-summoning', 'tower-dark-portal', 'guild', 'settings']
  if (value === 'tower-condensation') return 'tower-transmutation'
  return typeof value === 'string' && valid.includes(value) ? value as GameState['ui']['screen'] : fallback
}

const normalizeLastEnteredCombatDungeonId = (value: unknown): DungeonId | undefined => {
  return typeof value === 'string' && DUNGEON_ORDER.includes(value as DungeonId) ? value as DungeonId : undefined
}

const merge = <T extends Record<string, any>>(base: T, value: unknown): T => {
  if (!isRecord(value)) return base
  const result = { ...base } as T
  Object.keys(base).forEach((key) => {
    const incoming = value[key]
    const current = base[key]
    if (isRecord(current) && isRecord(incoming)) result[key as keyof T] = merge(current, incoming) as T[keyof T]
    else if (incoming !== undefined) result[key as keyof T] = incoming as T[keyof T]
  })
  return result
}

const safeLevel = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(10, Math.round(value))) : 0

const itemIds = Object.keys(ITEMS)
const monsterIds = Object.keys(MONSTERS)
const bossIds = [...monsterIds, SUMMONING_UNLOCK_BOSS_ID]
const dungeonIds = Object.keys(DUNGEONS)
const requestIds = Object.keys(GUILD_REQUESTS)
const spellIds = Object.keys(SPELLS) as CanonicalSpellId[]
const normalizeSpellId = (value: unknown): CanonicalSpellId | undefined => {
  if (typeof value !== 'string') return undefined
  const mapped = LEGACY_SPELL_ID_MAP[value]
  if (mapped) return mapped
  return spellIds.includes(value as CanonicalSpellId) ? value as CanonicalSpellId : undefined
}
const recipeIds = Object.keys(RECIPES)
const permanentFocusIds = ['forest-heart', 'guild-apprentice']
/** V34 is the first save topology that stores Arcane Core ranked nodes. */
const ARCANE_CORE_RANKED_NODE_SAVE_VERSION = 34
/** V38 is the first save topology that contains the Phase 1 Resonance runtime. */
const PRE_RESONANCE_SAVE_VERSION = 38
const ARCANE_CORE_V37_REPRICE_SAVE_VERSION = 37
const ARCANE_CORE_V37_STANDARD_RANK_COST_BY_RING = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 8, 8: 10 } as const
const ARCANE_CORE_V37_MAJOR_COST_BY_RING = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 } as const
const ARCANE_CORE_V37_TOTAL_TREE_COST = 6864

const LEGACY_ARCANE_CORE_MAX_SPEND = 1376
const normalizeArcaneCore = (migrated: GameState, raw: Record<string, any>) => {
  const source = isRecord(raw.arcaneCore) ? raw.arcaneCore : {}
  const sourceVersion = typeof raw.saveVersion === 'number' ? raw.saveVersion : 0
  const normalizeNodes = () => {
    const nodes: GameState['arcaneCore']['nodes'] = {}
    if (isRecord(source.nodes)) Object.entries(source.nodes).forEach(([nodeId, value]) => {
      const node = getArcaneCoreNode(nodeId)
      const rank = node && isRecord(value) && typeof value.rank === 'number' && Number.isFinite(value.rank) ? Math.max(0, Math.min(node.maxRank, Math.floor(value.rank))) : 0
      if (node && rank > 0) nodes[nodeId] = { rank }
    })
    return nodes
  }
  if (sourceVersion >= PRE_RESONANCE_SAVE_VERSION && typeof source.totalPointsEarned === 'number' && Number.isFinite(source.totalPointsEarned)) {
    migrated.arcaneCore = { arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: Math.max(0, Math.min(ARCANE_CORE_TOTAL_TREE_COST, Math.floor(source.totalPointsEarned))), nodes: normalizeNodes() }
    return
  }
  if (sourceVersion === ARCANE_CORE_V37_REPRICE_SAVE_VERSION && typeof source.totalPointsEarned === 'number' && Number.isFinite(source.totalPointsEarned)) {
    const nodes = normalizeNodes()
    const oldSpent = Object.entries(nodes).reduce((total, [nodeId, progress]) => {
      const node = getArcaneCoreNode(nodeId)
      if (!node) return total
      const cost = node.nodeType === 'major' ? ARCANE_CORE_V37_MAJOR_COST_BY_RING[node.ring] : ARCANE_CORE_V37_STANDARD_RANK_COST_BY_RING[node.ring]
      return total + (progress?.rank ?? 0) * cost
    }, 0)
    const oldTotal = Math.max(0, Math.min(ARCANE_CORE_V37_TOTAL_TREE_COST, Math.floor(source.totalPointsEarned)))
    const oldAvailable = Math.max(0, oldTotal - oldSpent)
    const newSpent = Object.entries(nodes).reduce((total, [nodeId, progress]) => {
      const node = getArcaneCoreNode(nodeId)
      if (!node) return total
      const cost = node.nodeType === 'major' ? ARCANE_CORE_MAJOR_COST_BY_RING[node.ring] : ARCANE_CORE_STANDARD_RANK_COST_BY_RING[node.ring]
      return total + (progress?.rank ?? 0) * cost
    }, 0)
    migrated.arcaneCore = { arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: Math.min(ARCANE_CORE_TOTAL_TREE_COST, newSpent + oldAvailable), nodes }
    return
  }
  const oldTotalXp = typeof source.totalXp === 'number' && Number.isFinite(source.totalXp) ? Math.max(0, Math.min(ARCANE_CORE_MAX_TOTAL_XP, source.totalXp)) : 0
  const rawNodes = isRecord(source.nodes) ? source.nodes : {}
  const oldEarnedPoints = source.totalXp !== undefined ? Math.max(0, Math.min(LEGACY_ARCANE_CORE_MAX_SPEND, getArcaneCoreLevelForXp(oldTotalXp) - 1)) : 0
  const rankedSpentPoints = sourceVersion >= ARCANE_CORE_RANKED_NODE_SAVE_VERSION
    ? Object.entries(rawNodes).reduce<number>((total, [nodeId, value]) => {
      const node = getArcaneCoreNode(nodeId)
      const rank = node && isRecord(value) && typeof value.rank === 'number' && Number.isFinite(value.rank) ? Math.max(0, Math.min(node.maxRank, Math.floor(value.rank))) : 0
      return total + rank * (node?.nodeType === 'major' ? 3 : 1)
    }, 0)
    : 0
  const legacyNodeSpentPoints = Object.values(rawNodes).reduce<number>((total, value) => total + (isRecord(value) && typeof value.coreSpent === 'number' && Number.isFinite(value.coreSpent) ? Math.max(0, Math.floor(value.coreSpent)) : 0), 0)
  const unspentPoints = typeof source.corePoints === 'number' && Number.isFinite(source.corePoints) ? Math.max(0, Math.floor(source.corePoints)) : 0
  const oldSpentPoints = Math.max(rankedSpentPoints, legacyNodeSpentPoints + unspentPoints)
  const legacyProgressPoints = Math.min(LEGACY_ARCANE_CORE_MAX_SPEND, Math.max(oldEarnedPoints, oldSpentPoints))
  const convertedPoints = Math.max(0, Math.min(ARCANE_CORE_TOTAL_TREE_COST, Math.round(legacyProgressPoints / LEGACY_ARCANE_CORE_MAX_SPEND * ARCANE_CORE_TOTAL_TREE_COST)))
  migrated.arcaneCore = { arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: convertedPoints, nodes: {} }
}
const REMOVED_PRISMATIC_FOCUS_ID = 'prismatic-focus'

const nonNegativeInteger = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : undefined
const nonNegativeGold = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : undefined
const nonNegativeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined
const normalizeHealthRegenTimer = (value: unknown) => {
  const interval = BALANCE.player.healthRegenIntervalMs
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(interval, Math.max(0, value)) : interval
}
const booleanValue = (value: unknown) => typeof value === 'boolean' ? value : undefined
const validContentId = (value: unknown, validIds: readonly string[]) => typeof value === 'string' && validIds.includes(value)
const boundedActionWork = (value: number, fallback: number) => Math.min(MAX_ACTION_WORK_MS, Math.max(0, Number.isFinite(value) ? value : fallback))
const boundedAuthoredActionTime = (value: number) => Math.min(MAX_ACTION_WORK_MS, Math.max(MIN_ACTION_TIME_MS, Number.isFinite(value) ? value : MIN_ACTION_TIME_MS))

/**
 * Merge records whose keys are content IDs without ever copying arbitrary save
 * keys. The initial-state record supplies defaults, while the raw record can
 * add any currently valid content key (including keys absent from the default).
 */
const normalizeDynamicRecord = <T>(base: Record<string, T>, incoming: unknown, validKeys: readonly string[], normalize: (value: unknown) => T | undefined) => {
  const source = isRecord(incoming) ? incoming : {}
  const result: Record<string, T> = {}
  for (const key of validKeys) {
    const defaultValue = normalize(base[key])
    if (defaultValue !== undefined) result[key] = defaultValue
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const incomingValue = normalize(source[key])
      if (incomingValue !== undefined) result[key] = incomingValue
    }
  }
  return result
}

const normalizeDynamicRecords = (migrated: GameState, raw: Record<string, any>) => {
  const fresh = createInitialState()
  const sourceVersion = typeof raw.saveVersion === 'number' ? raw.saveVersion : 0
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawCombat = isRecord(raw.combat) ? raw.combat : {}

  migrated.inventory = normalizeDynamicRecord(fresh.inventory, raw.inventory, itemIds, nonNegativeInteger)
  migrated.crystals = normalizeCrystalState(raw.crystals)
  const rawArtifacts = isRecord(raw.artifactProgress) ? raw.artifactProgress : {}
  migrated.artifactProgress = Object.fromEntries(Object.entries(ARTIFACTS).flatMap(([artifactId, definition]) => {
    const rawProgress = isRecord(rawArtifacts[artifactId]) ? rawArtifacts[artifactId] : null
    if (!rawProgress) return []
    const nodeIds = new Set(definition!.minorNodes.map(node => node.id))
    const requested = sourceVersion >= 48 && isRecord(rawProgress.minorRanks) ? Object.entries(rawProgress.minorRanks).flatMap(([id, value]) => {
      if (!nodeIds.has(id) || typeof value !== 'number' || !Number.isFinite(value)) return []
      return [[id, Math.max(0, Math.min(10, Math.floor(value)))]] as const
    }) : []
    return [[artifactId, { minorRanks: Object.fromEntries(requested.filter(([, rank]) => rank > 0)) }]]
  })) as GameState['artifactProgress']
  migrated.protectedItems = normalizeDynamicRecord(fresh.protectedItems, raw.protectedItems, itemIds, booleanValue)
  const rawArtificing = isRecord(rawActivities.artificing) ? rawActivities.artificing : {}
  const activeRecipeId = typeof rawArtificing.activeRecipeId === 'string' && Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, rawArtificing.activeRecipeId) ? rawArtificing.activeRecipeId as GameState['activities']['artificing']['activeRecipeId'] : null
  const rawActiveJob = isRecord(rawArtificing.activeJob) ? rawArtificing.activeJob : null
  const rawJob = rawActiveJob?.kind === 'recipe' && typeof rawActiveJob.recipeId === 'string' && Object.prototype.hasOwnProperty.call(ARTIFICING_RECIPES, rawActiveJob.recipeId)
    ? { kind: 'recipe' as const, recipeId: rawActiveJob.recipeId as GameState['activities']['artificing']['activeRecipeId'] }
    : rawActiveJob?.kind === 'artifact-forge' && typeof rawActiveJob.artifactId === 'string' && Boolean(ARTIFACTS[rawActiveJob.artifactId as ArtifactId])
      ? { kind: 'artifact-forge' as const, artifactId: rawActiveJob.artifactId as ArtifactId }
      : null
  const normalizedJob = rawJob as GameState['activities']['artificing']['activeJob'] ?? (activeRecipeId ? { kind: 'recipe', recipeId: activeRecipeId } : null)
  const normalizedRecipeId = normalizedJob?.kind === 'recipe' ? normalizedJob.recipeId : null
  migrated.activities.artificing = { activeJob: normalizedJob, activeRecipeId: normalizedRecipeId, progressMs: normalizedJob ? Math.max(0, nonNegativeNumber(rawArtificing.progressMs) ?? 0) : 0 }
  const rawAutoCast = isRecord(rawActivities.autoCast) ? rawActivities.autoCast : {}
  const normalizedAutoCast = normalizeDynamicRecord(fresh.activities.autoCast, rawAutoCast, spellIds, booleanValue) as GameState['activities']['autoCast']
  Object.entries(LEGACY_SPELL_ID_MAP).forEach(([legacyId, canonicalId]) => {
    if (!canonicalId) return
    if (rawAutoCast[legacyId] === true) normalizedAutoCast[canonicalId] = true
  })
  migrated.activities.autoCast = normalizedAutoCast
  const rawPriority = Array.isArray(rawActivities.autoCastPriority) ? rawActivities.autoCastPriority : []
  const migratedPriority = rawPriority.map(normalizeSpellId).filter((id): id is CanonicalSpellId => Boolean(id))
  migrated.activities.autoCastPriority = migratedPriority.length
    ? [...new Set(migratedPriority)]
    : spellIds.filter((id) => normalizedAutoCast[id] === true) as CanonicalSpellId[]
  const rawSpellCooldowns = isRecord(rawCombat.spellCooldowns) ? rawCombat.spellCooldowns : {}
  migrated.combat.spellCooldowns = normalizeDynamicRecord(fresh.combat.spellCooldowns, rawSpellCooldowns, spellIds, nonNegativeNumber) as GameState['combat']['spellCooldowns']
  Object.entries(LEGACY_SPELL_ID_MAP).forEach(([legacyId, canonicalId]) => {
    if (!canonicalId) return
    const value = nonNegativeNumber(rawSpellCooldowns[legacyId])
    if (value !== undefined) migrated.combat.spellCooldowns[canonicalId] = value
  })
  migrated.progress.requestProgress = normalizeDynamicRecord(fresh.progress.requestProgress, rawProgress.requestProgress, requestIds, nonNegativeInteger)
  migrated.progress.requestClaims = normalizeDynamicRecord(fresh.progress.requestClaims, rawProgress.requestClaims, requestIds, booleanValue)
  migrated.progress.permanentFocusBonuses = normalizeDynamicRecord(fresh.progress.permanentFocusBonuses, rawProgress.permanentFocusBonuses, permanentFocusIds, nonNegativeNumber)
  const rawFocusImprovement = isRecord(rawProgress.focusImprovement) ? rawProgress.focusImprovement : {}
  migrated.progress.focusImprovement = { rank: 1, level: safeLevel(rawFocusImprovement.level) }
  migrated.progress.lifetimeKillsByMonster = normalizeDynamicRecord(fresh.progress.lifetimeKillsByMonster, rawProgress.lifetimeKillsByMonster, monsterIds, nonNegativeInteger)
  // Keep historical boss counters for monsters that were later demoted to a
  // normal encounter (notably Grove Sentinel). They remain useful migration
  // evidence even when current combat treats the monster as non-boss.
  migrated.progress.bossKillsByBoss = normalizeDynamicRecord(fresh.progress.bossKillsByBoss, rawProgress.bossKillsByBoss, bossIds, nonNegativeInteger)
  migrated.progress.autoHuntBossByDungeon = normalizeDynamicRecord(fresh.progress.autoHuntBossByDungeon, rawProgress.autoHuntBossByDungeon, dungeonIds, booleanValue) as GameState['progress']['autoHuntBossByDungeon']
  const rawCurrencies = isRecord(raw.currencies) ? raw.currencies : {}
  migrated.currencies = { gold: nonNegativeGold(rawCurrencies.gold) ?? fresh.currencies.gold }

  const rawDiscoveredMonsters = Array.isArray(rawProgress.discoveredMonsters) ? rawProgress.discoveredMonsters : []
  migrated.progress.discoveredMonsters = [...new Set(rawDiscoveredMonsters.filter((id): id is GameState['progress']['discoveredMonsters'][number] => typeof id === 'string' && monsterIds.includes(id)))]
  const rawDiscoveredItems = Array.isArray(rawProgress.discoveredItems) ? rawProgress.discoveredItems : []
  migrated.progress.discoveredItems = [...new Set(rawDiscoveredItems.filter((id): id is ItemId => typeof id === 'string' && itemIds.includes(id)))]

  const rawGuardians = isRecord(raw.guardians) ? raw.guardians : {}
  const rawGuardianProgress = isRecord(rawGuardians.progress) ? rawGuardians.progress : {}
  const selectedGuardianId = typeof rawGuardians.selectedGuardianId === 'string' && GUARDIAN_IDS.includes(rawGuardians.selectedGuardianId as typeof GUARDIAN_IDS[number]) ? rawGuardians.selectedGuardianId as typeof GUARDIAN_IDS[number] : null
  migrated.guardians = {
    selectedGuardianId,
    progress: Object.fromEntries(GUARDIAN_IDS.map((guardianId) => {
      const rawProgress = isRecord(rawGuardianProgress[guardianId]) ? rawGuardianProgress[guardianId] : {}
      return [guardianId, { level: Math.max(1, safeLevel(rawProgress.level) || 1), rank: Math.max(1, safeLevel(rawProgress.rank) || 1) }]
    })) as GameState['guardians']['progress'],
  }
}

const isSpellRankValue = (value: unknown): value is SpellRank => typeof value === 'number' && Number.isInteger(value) && value >= MIN_SPELL_RANK && value <= MAX_SPELL_RANK

/** Converts legacy unlock arrays and current rank evidence into one canonical map. */
const normalizeSpellProgression = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  const ranks: Partial<Record<SpellId, SpellRank>> = {}
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const rawRanks = isRecord(rawProgress.spellRanks) ? rawProgress.spellRanks : {}

  // Current saves already use the canonical 32-spell roster. Preserve those
  // ranks (and normalize any remaining legacy aliases) instead of rebuilding
  // progression from school levels on every save/load round-trip.
  if (sourceVersion >= PRE_RESONANCE_SAVE_VERSION) {
    Object.entries(rawRanks).forEach(([id, value]) => {
      const spellId = normalizeSpellId(id)
      if (spellId && isSpellRankValue(value)) ranks[spellId] = value
    })
  } else {
    // Older saves may only have the former unlocked-spell list. Carry valid
    // evidence forward, then fill in authored unlocks from preserved school
    // levels. Unknown/removed ids (including water-ward) are intentionally
    // dropped by normalizeSpellId.
    const unlocked = Array.isArray(rawProgress.unlockedSpells) ? rawProgress.unlockedSpells : []
    unlocked.forEach((id) => {
      const spellId = normalizeSpellId(id)
      if (spellId) ranks[spellId] = 1
    })
    Object.entries(rawRanks).forEach(([id, value]) => {
      const spellId = normalizeSpellId(id)
      if (spellId && isSpellRankValue(value)) ranks[spellId] = value
    })
  }

  migrated.progress.spellRanks = ranks
  if (sourceVersion < PRE_RESONANCE_SAVE_VERSION) syncAllSpellUnlocks(migrated)
  Object.keys(migrated.activities.autoCast).forEach((id) => {
    if (!isSpellRankValue(ranks[id as SpellId])) migrated.activities.autoCast[id as SpellId] = false
  })
  migrated.activities.autoCastPriority = migrated.activities.autoCastPriority.filter((id) => migrated.activities.autoCast[id])
}

const normalizeSpellPresets = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const normalized = normalizeSpellPresetState(raw.spellPresets)
  // Fresh/current profiles are allowed to have no presets yet. Only older
  // saves that predate the preset schema need a synthesized first loadout.
  if (normalized.presets.length === 0 && sourceVersion < PRE_RESONANCE_SAVE_VERSION) {
    const savedPriority = Array.isArray(rawActivities.autoCastPriority) ? rawActivities.autoCastPriority : migrated.activities.autoCastPriority
    const priority = savedPriority
      .map(normalizeSpellId)
      .filter((spellId): spellId is CanonicalSpellId => Boolean(spellId))
      .filter((spellId, index, ids) => ids.indexOf(spellId) === index)
    const unlocked = spellIds.filter((spellId) => isSpellRankValue(migrated.progress.spellRanks[spellId]))
    const ordered = [...priority, ...unlocked.filter((spellId) => !priority.includes(spellId))].slice(0, MAX_COMBAT_SPELLS)
    const autoIds = new Set(priority)
    normalized.presets = [{
      id: 'spell-preset-1',
      name: DEFAULT_COMBAT_LOADOUT_NAME,
      slots: ordered.map((spellId) => ({ spellId, autoCast: autoIds.has(spellId) })),
    }]
    normalized.selectedPresetId = 'spell-preset-1'
  }
  migrated.spellPresets = normalized
}

const normalizeSchoolCap = (migrated: GameState, raw: Record<string, any>) => {
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const savedCap = Math.min(SCHOOL_MAX_LEVEL, Math.floor(nonNegativeNumber(rawProgress.magicLevelCap) ?? BALANCE.schoolProgression.startingCap))
  const edrinDefeated = (migrated.progress.bossKillsByBoss['archmage-edrin-shade'] ?? 0) >= 1
  migrated.progress.magicLevelCap = Math.min(SCHOOL_MAX_LEVEL, Math.max(
    savedCap,
    BALANCE.schoolProgression.startingCap,
    ...(edrinDefeated ? [BALANCE.schoolProgression.tutorialCompleteCap] : []),
  ))
}

/** Resonance is first-class saved progression; normalize it explicitly rather than trusting merge(). */
const normalizeResonance = (migrated: GameState, raw: Record<string, any>) => {
  migrated.resonance = normalizeResonanceState(raw.resonance)
}

const normalizeWorldTier = (migrated: GameState, raw: Record<string, any>) => {
  const normalized = sanitizeWorldTierState(raw.worldTier)
  migrated.worldTier = { ...normalized }
}

/** V25 changes School XP meaning from the old curve to authored cumulative totals. */
const normalizeSchoolXpCurveV25 = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  if (sourceVersion > 24) return
  const rawSchools = isRecord(raw.schools) ? raw.schools : {}
  const cap = Math.min(SCHOOL_MAX_LEVEL, Math.max(1, Math.floor(migrated.progress.magicLevelCap)))
  Object.keys(migrated.schools).forEach((id) => {
    const schoolId = id as SchoolId
    const rawSchool = isRecord(rawSchools[schoolId]) ? rawSchools[schoolId] : {}
    const storedLevel = typeof rawSchool.level === 'number' && Number.isFinite(rawSchool.level)
      ? Math.floor(rawSchool.level)
      : 1
    const level = Math.min(cap, Math.max(1, storedLevel))
    migrated.schools[schoolId] = { level, xp: getSchoolTotalXpForLevel(level) }
  })
}

export const normalizeLegacyProgressEvidence = (progress: GameState['progress']) => {
  if (progress.firstMainBossKill === true) progress.bossKillsByBoss['forest-heart'] = Math.max(progress.bossKillsByBoss['forest-heart'] ?? 0, 1)
  progress.requestProgress['sentinel-breaker'] = Math.max(
    progress.requestProgress['sentinel-breaker'] ?? 0,
    progress.bossKillsByBoss['grove-sentinel'] ?? 0,
    progress.lifetimeKillsByMonster['grove-sentinel'] ?? 0,
  )
}

const normalizeCombatState = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  const fresh = createInitialState()
  const rawCombat = isRecord(raw.combat) ? raw.combat : {}
  migrated.combat.combatRngState = sourceVersion >= 23
    ? normalizeCombatRngState(rawCombat.combatRngState)
    : COMBAT_RNG_DEFAULT_SEED >>> 0
  const legacyActiveEnemyId = typeof rawCombat.enemyId === 'string' && MONSTERS[rawCombat.enemyId as MonsterId] ? rawCombat.enemyId as MonsterId : null
  const legacyEnemyInstanceKey = sourceVersion === 21 && legacyActiveEnemyId ? 'enemy:1' : null
  const normalizeSource = (value: unknown, fallbackActor: 'player' | 'enemy'): CombatSource => {
    if (!isRecord(value)) return { actor: fallbackActor, kind: 'system', sourceId: 'save-migration' }
    const actor = value.actor === 'player' || value.actor === 'enemy' ? value.actor : fallbackActor
    const rawKind = String(value.kind)
    const kind = rawKind === 'special-attack' ? 'action' : ['basic-attack', 'spell', 'weapon', 'status', 'trait', 'action', 'arcane-core', 'equipment', 'guardian', 'system'].includes(rawKind) ? rawKind as CombatSource['kind'] : 'system'
    const school = ['fire', 'water', 'earth', 'air'].includes(String(value.school)) ? value.school as CombatSource['school'] : undefined
    const rawOriginKind = String(value.originSourceKind)
    const originSourceKind = ['basic-attack', 'spell', 'weapon', 'status', 'trait', 'action', 'arcane-core', 'equipment', 'guardian', 'system'].includes(rawOriginKind) ? rawOriginKind as CombatSource['kind'] : undefined
    const originTags = Array.isArray(value.originTags) ? value.originTags.filter((tag): tag is NonNullable<CombatSource['originTags']>[number] => typeof tag === 'string') : undefined
    const originSchool = ['fire', 'water', 'earth', 'air'].includes(String(value.originSchool)) ? value.originSchool as CombatSource['originSchool'] : undefined
    const sourceMonsterId = typeof value.sourceMonsterId === 'string' && MONSTERS[value.sourceMonsterId as MonsterId] ? value.sourceMonsterId as MonsterId : sourceVersion === 21 && actor === 'enemy' ? legacyActiveEnemyId ?? undefined : undefined
    const sourceInstanceKey = sourceVersion >= 22 && typeof value.sourceInstanceKey === 'string' && /^enemy:[1-9]\d*$/.test(value.sourceInstanceKey) ? value.sourceInstanceKey : sourceVersion === 21 && actor === 'enemy' ? legacyEnemyInstanceKey ?? undefined : undefined
    const originMonsterId = typeof value.originMonsterId === 'string' && MONSTERS[value.originMonsterId as MonsterId] ? value.originMonsterId as MonsterId : sourceMonsterId
    const originInstanceKey = sourceVersion >= 22 && typeof value.originInstanceKey === 'string' && /^enemy:[1-9]\d*$/.test(value.originInstanceKey) ? value.originInstanceKey : sourceInstanceKey
    const statusId = typeof value.statusId === 'string' && Object.prototype.hasOwnProperty.call(STATUS_DEFINITIONS, value.statusId) ? value.statusId as StatusId : undefined
    const rawProvider = typeof value.providerInstanceKey === 'string' && value.providerInstanceKey.trim().length <= 64 ? value.providerInstanceKey.trim() : undefined
    const providerInstanceKey = sourceVersion >= 21 && rawProvider && (kind !== 'equipment' || EQUIPMENT_POSITIONS.includes(rawProvider as EquipmentPosition)) ? rawProvider : undefined
    return { actor, kind, sourceId: typeof value.sourceId === 'string' ? value.sourceId : 'save-migration', sourceMonsterId, sourceInstanceKey, originSourceId: typeof value.originSourceId === 'string' ? value.originSourceId : undefined, originMonsterId, originInstanceKey, originSourceKind, originTags, originSchool, providerInstanceKey, ruleId: typeof value.ruleId === 'string' ? value.ruleId : undefined, statusInstanceKey: typeof value.statusInstanceKey === 'string' ? value.statusInstanceKey : undefined, school, tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is NonNullable<CombatSource['tags']>[number] => typeof tag === 'string') : undefined }
  }
  const normalizeStatuses = (value: unknown, fallbackActor: 'player' | 'enemy'): ActiveStatus[] => {
    if (!Array.isArray(value)) return []
    const normalized = value.flatMap((entry): ActiveStatus[] => {
      if (!isRecord(entry)) return []
      const rawId = entry.statusId ?? entry.id
      if (rawId === 'barrier' || rawId === 'attack-delay' || typeof rawId !== 'string' || !Object.prototype.hasOwnProperty.call(STATUS_DEFINITIONS, rawId)) return []
      let statusId = rawId as StatusId
      const source = normalizeSource(entry.source, fallbackActor)
      // V11 briefly represented Living Core as Quickening with a potency
      // override. Convert that transient shape to the authored Haste status.
      if (statusId === 'quickening' && entry.potency === 0.15 && source.kind === 'trait') statusId = 'haste'
      const definition = STATUS_DEFINITIONS[statusId]
      const remainingRaw = entry.remainingMs
      const remainingMs = remainingRaw === null ? null : nonNegativeNumber(remainingRaw) ?? definition.defaultDurationMs
      const nextTickMs = nonNegativeNumber(entry.nextTickMs)
      const instanceKey = typeof entry.instanceKey === 'string' && entry.instanceKey.trim()
        ? entry.instanceKey
        : definition.applicationPolicy === 'per-source' ? getStatusApplicationSourceKey(source) : `single:${statusId}`
      const periodicEffects = normalizePersistedPeriodicEffects(entry.periodicEffects, statusId, statusValidationContext)
      const modifierOverrides = isRecord(entry.modifierOverrides) && hasValidStatusModifierOverrides(statusId, entry.modifierOverrides, statusValidationContext)
        ? Object.fromEntries(Object.entries(entry.modifierOverrides))
        : undefined
      const initialRaw = nonNegativeNumber(entry.initialDurationMs) ?? nonNegativeNumber(entry.durationMs)
      const initialDurationMs = remainingMs === null ? null : initialRaw && initialRaw > 0 ? initialRaw : definition.defaultDurationMs ?? remainingMs
      return [{ statusId, holder: fallbackActor, instanceKey, source, remainingMs, initialDurationMs, stacks: Math.max(1, Math.floor(nonNegativeNumber(entry.stacks) ?? 1)), nextTickMs: nextTickMs ?? (definition.periodic?.intervalMs), appliedAt: nonNegativeNumber(entry.appliedAt), ...(periodicEffects ? { periodicEffects } : {}), ...(modifierOverrides && Object.keys(modifierOverrides).length ? { modifierOverrides } : {}) }]
    })
    // Legacy data normally contains one entry per status. If malformed data
    // contains duplicates, retain the last deterministic valid record for the
    // same status slot instead of invalidating the whole save.
    const unique = new Map<string, ActiveStatus>()
    normalized.forEach((status) => unique.set(`${status.statusId}:${status.instanceKey}`, status))
    return [...unique.values()]
  }
  const rawPlayerStatuses = Array.isArray(rawCombat.playerStatuses) ? rawCombat.playerStatuses : []
  const oldBarrierEntries = rawPlayerStatuses.filter((entry) => isRecord(entry) && (entry.id === 'barrier' || entry.statusId === 'barrier'))
  const oldBarrier = oldBarrierEntries.reduce((sum, entry) => sum + (nonNegativeNumber(entry.value) ?? 0), 0)
  const oldBarrierRemaining = oldBarrierEntries.map((entry) => nonNegativeNumber(entry.remainingMs)).find((value) => value !== undefined)
  migrated.combat.playerBarrier = Math.max(0, nonNegativeNumber(rawCombat.playerBarrier) ?? 0, oldBarrier)
  migrated.combat.enemyBarrier = Math.max(0, nonNegativeNumber(rawCombat.enemyBarrier) ?? fresh.combat.enemyBarrier)
  const rawPlayerBarrierRemaining = nonNegativeNumber(rawCombat.playerBarrierRemainingMs)
  migrated.combat.playerBarrierRemainingMs = migrated.combat.playerBarrier > 0 ? rawPlayerBarrierRemaining ?? oldBarrierRemaining ?? 9000 : null
  migrated.combat.enemyBarrierRemainingMs = migrated.combat.enemyBarrier > 0 ? nonNegativeNumber(rawCombat.enemyBarrierRemainingMs) ?? null : null
  migrated.combat.playerStatuses = normalizeStatuses(rawPlayerStatuses, 'player')
  migrated.combat.enemyStatuses = normalizeStatuses(rawCombat.enemyStatuses, 'enemy')
  migrated.combat.pendingPlayerSpellCast = null
  migrated.combat.queuedPlayerSpellId = null
  const rawActiveLoadout = isRecord(rawCombat.activeSpellLoadout) ? rawCombat.activeSpellLoadout : null
  if (migrated.combat.active) {
    const slots = normalizeSpellPresetSlots(rawActiveLoadout?.slots)
    if (rawActiveLoadout && slots.length > 0) {
      const presetId = typeof rawActiveLoadout.presetId === 'string' ? rawActiveLoadout.presetId : null
      const presetName = normalizeSpellPresetName(rawActiveLoadout.presetName, DEFAULT_COMBAT_LOADOUT_NAME)
      migrated.combat.activeSpellLoadout = { presetId, presetName, slots, signature: getSpellPresetSignature(slots) }
    } else {
      migrated.combat.activeSpellLoadout = buildActiveCombatSpellLoadout(migrated)
    }
    syncAutoCastRuntimeForLoadout(migrated, migrated.combat.activeSpellLoadout.slots)
  } else {
    migrated.combat.activeSpellLoadout = null
    syncAutoCastRuntimeForLoadout(migrated, [])
  }
  // Read and normalize legacy player Basic timing at the migration boundary,
  // but do not copy it into current state: player combat is Spell-only.
  const legacyPlayerBasicTiming = {
    timerMs: nonNegativeNumber(rawCombat.playerAttackTimerMs) ?? 0,
    durationMs: boundedAuthoredActionTime(nonNegativeNumber(rawCombat.playerAttackDurationMs) ?? 0),
  }
  void legacyPlayerBasicTiming

  const activeEnemyId = typeof migrated.combat.enemyId === 'string' && MONSTERS[migrated.combat.enemyId] ? migrated.combat.enemyId : null
  const sequenceDungeonId = typeof migrated.combat.dungeonId === 'string' ? migrated.combat.dungeonId as DungeonId : null
  const sequenceDungeon = sequenceDungeonId ? DUNGEONS[sequenceDungeonId] : undefined
  const isSequenceDungeon = Boolean(sequenceDungeon && getCombatEncounterMode(getCombatLocationByDungeonId(sequenceDungeonId)) === 'sequence' && sequenceDungeon.encounterSequence?.length)
  if (migrated.combat.active && isSequenceDungeon && sequenceDungeon?.encounterSequence) {
    const sequence = sequenceDungeon.encounterSequence
    const legacyThreatIndex = Math.min(sequence.length, Math.max(0, nonNegativeInteger(rawCombat.threatCleared) ?? 0))
    const sequenceConversionVersion = sequenceDungeonId ? SEQUENCE_CONVERSION_VERSION_BY_DUNGEON[sequenceDungeonId] : undefined
    const convertedToSequence = sequenceConversionVersion !== undefined && sourceVersion < sequenceConversionVersion
    const inferredIndex = activeEnemyId
      ? activeEnemyId === sequenceDungeon.boss
        ? sequence.length
        : Math.max(0, sequence.indexOf(activeEnemyId))
      : convertedToSequence
        ? 0
        : legacyThreatIndex
    const rawIndex = nonNegativeInteger(rawCombat.dungeonSequenceIndex)
    const candidateIndex = sourceVersion >= 42 && !convertedToSequence && rawIndex !== undefined && rawIndex <= sequence.length ? rawIndex : inferredIndex
    const expectedEnemyId = candidateIndex === sequence.length ? sequenceDungeon.boss : sequence[candidateIndex]
    const repairedIndex = activeEnemyId && expectedEnemyId !== activeEnemyId ? inferredIndex : candidateIndex
    migrated.combat.dungeonSequenceIndex = Math.min(sequence.length, Math.max(0, repairedIndex))
    migrated.combat.threatCleared = 0
  } else migrated.combat.dungeonSequenceIndex = null
  const rawEnemyWorldTier = isWorldTierId(rawCombat.enemyWorldTier) ? rawCombat.enemyWorldTier : 1
  migrated.combat.enemyWorldTier = activeEnemyId ? sanitizeWorldTierState({ current: rawEnemyWorldTier, highestUnlocked: migrated.worldTier.highestUnlocked }).current : null
  const rawSerial = sourceVersion >= 22 ? nonNegativeInteger(rawCombat.enemyInstanceSerial) ?? 0 : sourceVersion === 21 && activeEnemyId ? 1 : 0
  const rawInstanceKey = sourceVersion >= 22 && typeof rawCombat.enemyInstanceKey === 'string' && /^enemy:[1-9]\d*$/.test(rawCombat.enemyInstanceKey) ? rawCombat.enemyInstanceKey : null
  const keySerial = rawInstanceKey ? nonNegativeInteger(rawInstanceKey.slice('enemy:'.length)) ?? 0 : 0
  migrated.combat.enemyInstanceSerial = Math.max(0, rawSerial, keySerial)
  migrated.combat.enemyInstanceKey = activeEnemyId
    ? sourceVersion === 21 ? 'enemy:1' : rawInstanceKey ?? `enemy:${Math.max(1, migrated.combat.enemyInstanceSerial)}`
    : null
  if (activeEnemyId && migrated.combat.enemyInstanceSerial < 1) migrated.combat.enemyInstanceSerial = 1
  const monster = activeEnemyId ? MONSTERS[activeEnemyId] : undefined
  migrated.combat.inBossFight = Boolean(monster && isBossMonster(monster))
  const rawPatternId = typeof rawCombat.enemyActionPatternId === 'string' ? rawCombat.enemyActionPatternId : undefined
  const pattern = monster && sourceVersion >= 14 && rawPatternId && monster.actionPatterns[rawPatternId]
    ? monster.actionPatterns[rawPatternId]
    : monster?.actionPatterns[monster.defaultActionPatternId]
  migrated.combat.enemyActionPatternId = pattern?.id ?? null
  const rawIndex = sourceVersion >= 18
    ? nonNegativeInteger(rawCombat.enemyNextActionIndex) ?? 0
    : nonNegativeInteger(rawCombat.enemyActionIndex) ?? 0
  migrated.combat.enemyNextActionIndex = pattern && pattern.steps.length > 0 ? rawIndex % pattern.steps.length : 0

  const findStep = (candidate: typeof pattern, stepId: string | undefined, actionId: string | null) => candidate?.steps.find((step) => step.id === stepId && (actionId === null ? step.type === 'basic' : step.type === 'action' && step.actionId === actionId))
  const findActionStep = (candidate: typeof pattern, actionId: string) => candidate?.steps.find((step) => step.type === 'action' && step.actionId === actionId)
  const clearCurrent = () => {
    migrated.combat.enemyCurrentStepId = null
    migrated.combat.enemyCurrentActionId = null
    migrated.combat.enemyCurrentActionPatternId = null
    migrated.combat.enemyActionTimerMs = 0
    migrated.combat.enemyActionDurationMs = 0
  }
  clearCurrent()

  if (monster && sourceVersion >= 18) {
    const normalizeLegacyActionId = (actionId: string | null) => activeEnemyId === 'corrupted-greatbear' && actionId === 'arcane-rampage' ? 'savage-rampage' : actionId
    const normalizeLegacyStepId = (stepId: string | undefined) => activeEnemyId === 'corrupted-greatbear' && stepId?.startsWith('arcane-rampage-step-') ? stepId.replace('arcane-rampage-step-', 'savage-rampage-step-') : stepId
    const rawCurrentActionId = normalizeLegacyActionId(typeof rawCombat.enemyCurrentActionId === 'string' ? rawCombat.enemyCurrentActionId : null)
    const currentAction = rawCurrentActionId ? monster.actions[rawCurrentActionId] : undefined
    const rawCurrentStepId = normalizeLegacyStepId(typeof rawCombat.enemyCurrentStepId === 'string' ? rawCombat.enemyCurrentStepId : undefined)
    const currentStep = findStep(pattern, rawCurrentStepId, rawCurrentActionId)
    const rawCurrentOriginId = typeof rawCombat.enemyCurrentActionPatternId === 'string' ? rawCombat.enemyCurrentActionPatternId : undefined
    const currentOrigin = rawCurrentOriginId && monster.actionPatterns[rawCurrentOriginId] ? monster.actionPatterns[rawCurrentOriginId] : pattern
    const originStep = findStep(currentOrigin, rawCurrentStepId, rawCurrentActionId)
    const validStep = currentStep ?? originStep
    if (validStep && (validStep.type === 'basic' || currentAction)) {
      const authoredDuration = validStep.type === 'basic' ? monster.basicAttackTimeMs : currentAction!.actionTimeMs
      const savedDuration = nonNegativeNumber(rawCombat.enemyActionDurationMs)
      const savedTimer = nonNegativeNumber(rawCombat.enemyActionTimerMs)
      const remainingRatio = savedDuration && savedDuration > 0 && savedTimer !== undefined
        ? Math.max(0, savedTimer / savedDuration)
        : 1
      migrated.combat.enemyCurrentStepId = validStep.id
      migrated.combat.enemyCurrentActionId = validStep.type === 'action' ? currentAction?.id ?? null : null
      migrated.combat.enemyCurrentActionPatternId = currentOrigin?.id ?? null
      migrated.combat.enemyActionDurationMs = boundedAuthoredActionTime(authoredDuration)
      migrated.combat.enemyActionTimerMs = sourceVersion >= 20
        ? boundedActionWork(savedTimer ?? migrated.combat.enemyActionDurationMs, migrated.combat.enemyActionDurationMs)
        : boundedActionWork(migrated.combat.enemyActionDurationMs * remainingRatio, migrated.combat.enemyActionDurationMs)
    }
  } else if (monster) {
    // V17 telegraphs are migrated as a newly started Action; old recovery is discarded.
    const rawActionId = typeof rawCombat.enemyTelegraphActionId === 'string' ? rawCombat.enemyTelegraphActionId : undefined
    const activeAction = rawActionId ? monster.actions[rawActionId] : undefined
    const rawStepId = typeof rawCombat.enemyTelegraphStepId === 'string' ? rawCombat.enemyTelegraphStepId : undefined
    const rawOriginPatternId = typeof rawCombat.enemyTelegraphPatternId === 'string' ? rawCombat.enemyTelegraphPatternId : undefined
    const savedOriginPattern = rawOriginPatternId ? monster.actionPatterns[rawOriginPatternId] : undefined
    const currentStep = findStep(pattern, rawStepId, activeAction?.id ?? null) ?? (activeAction ? findActionStep(pattern, activeAction.id) : undefined)
    const originStep = activeAction && savedOriginPattern ? findStep(savedOriginPattern, rawStepId, activeAction.id) ?? findActionStep(savedOriginPattern, activeAction.id) : undefined
    const validStep = originStep ?? currentStep
    const originPattern = originStep ? savedOriginPattern : currentStep ? pattern : undefined
    if (activeAction && validStep && originPattern) {
      migrated.combat.enemyCurrentStepId = validStep.id
      migrated.combat.enemyCurrentActionId = activeAction.id
      migrated.combat.enemyCurrentActionPatternId = originPattern.id
      migrated.combat.enemyActionDurationMs = boundedAuthoredActionTime(activeAction.actionTimeMs)
      migrated.combat.enemyActionTimerMs = migrated.combat.enemyActionDurationMs
    }
  }

  const rawTriggered = Array.isArray(rawCombat.triggeredRuleIds) ? rawCombat.triggeredRuleIds.filter((id): id is string => typeof id === 'string') : []
  const legacySpecials = isRecord(rawCombat.enemySpecialUsed) ? rawCombat.enemySpecialUsed : {}
  const legacyTriggered = Object.entries(legacySpecials).flatMap(([id, used]) => used ? id === 'ancient-growth' ? ['enemy:trait:grove-sentinel-ancient-growth:grove-sentinel-ancient-growth-threshold'] : id === 'living-core' ? ['enemy:trait:forest-heart-living-core:forest-heart-living-core-threshold'] : [] : [])
  const legacyTraitSource: Record<string, string> = { 'grove-sentinel-ancient-growth-threshold': 'grove-sentinel-ancient-growth', 'forest-heart-living-core-threshold': 'forest-heart-living-core', 'stone-rooted-shell-start': 'stone-rooted-shell' }
  const namespaced = rawTriggered.map((id) => id.includes(':') ? id : `enemy:trait:${legacyTraitSource[id] ?? id}:${id}`)
  migrated.combat.triggeredRuleIds = [...new Set([...namespaced, ...legacyTriggered])]
  const rawRuleCooldowns = isRecord(rawCombat.ruleCooldowns) ? rawCombat.ruleCooldowns : {}
  const ruleCooldowns: Record<string, number> = {}
  Object.entries(rawRuleCooldowns).forEach(([key, value]) => {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') return
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) ruleCooldowns[key] = Math.min(Number.MAX_SAFE_INTEGER, value)
  })
  migrated.combat.ruleCooldowns = ruleCooldowns
  const rawArcaneRuntime = isRecord(rawCombat.arcaneCoreRuntime) ? rawCombat.arcaneCoreRuntime : {}
  const runtimeNumber = (key: string, fallback = 0) => typeof rawArcaneRuntime[key] === 'number' && Number.isFinite(rawArcaneRuntime[key]) ? Math.max(0, rawArcaneRuntime[key]) : fallback
  const runtimeBoolean = (key: string, fallback = false) => typeof rawArcaneRuntime[key] === 'boolean' ? rawArcaneRuntime[key] : fallback
  migrated.combat.arcaneCoreRuntime = {
    elapsedMs: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeNumber('elapsedMs') >= 0 ? runtimeNumber('elapsedMs') : 0,
    encounterStartedAtMs: sourceVersion >= PRE_RESONANCE_SAVE_VERSION ? Math.min(runtimeNumber('elapsedMs'), runtimeNumber('encounterStartedAtMs', runtimeNumber('elapsedMs'))) : 0,
    damagingSpellCount: nonNegativeInteger(rawArcaneRuntime.damagingSpellCount) ?? 0,
    spellCastCount: nonNegativeInteger(rawArcaneRuntime.spellCastCount) ?? 0,
    cooldownPulseSpellCount: nonNegativeInteger(rawArcaneRuntime.cooldownPulseSpellCount) ?? 0,
    survivalInstinctUsed: rawArcaneRuntime.survivalInstinctUsed === true,
    chainReactionReady: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('chainReactionReady'),
    victoryMomentumReady: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('victoryMomentumReady'),
    ruinTransferReady: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('ruinTransferReady'),
    ruinTransferMultiplier: sourceVersion >= PRE_RESONANCE_SAVE_VERSION ? Math.max(1, runtimeNumber('ruinTransferMultiplier', 1)) : 1,
    refuseDeathUsed: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('refuseDeathUsed'),
    immortalGuardUsed: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('immortalGuardUsed'),
    singularityUsed: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('singularityUsed'),
    absoluteStasisUsed: sourceVersion >= PRE_RESONANCE_SAVE_VERSION && runtimeBoolean('absoluteStasisUsed'),
    nextEnemyDamageMultiplier: sourceVersion >= PRE_RESONANCE_SAVE_VERSION ? Math.max(1, runtimeNumber('nextEnemyDamageMultiplier', 1)) : 1,
  }
}

/** Seeds the historical item archive only for saves that predate the V12 archive shape. */
const seedLegacyItemDiscoveries = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const hasArchive = Array.isArray(rawProgress.discoveredItems)
  if (sourceVersion >= 12 && hasArchive) return

  const discovered = new Set<ItemId>(migrated.progress.discoveredItems)
  const rawEquipment = isRecord(raw.equipment) ? raw.equipment : {}
  Object.values(rawEquipment).forEach((itemId) => { if (typeof itemId === 'string' && ITEMS[itemId as ItemId]) discovered.add(itemId as ItemId) })
  Object.entries(migrated.inventory).forEach(([itemId, quantity]) => {
    if (itemIds.includes(itemId) && typeof quantity === 'number' && quantity > 0) discovered.add(itemId as ItemId)
  })
  Object.values(migrated.equipment).forEach((itemId) => { if (itemId && ITEMS[itemId]) discovered.add(itemId as ItemId) })

  Object.values(MONSTERS).forEach((monster) => {
    const defeats = Math.max(migrated.progress.lifetimeKillsByMonster[monster.id] ?? 0, migrated.progress.bossKillsByBoss[monster.id] ?? 0)
    if (defeats < 1) return
    monster.loot.filter((drop) => drop.chance === 1).forEach((drop) => discovered.add(drop.itemId))
  })
  migrated.progress.discoveredItems = itemIds.filter((itemId) => discovered.has(itemId as ItemId)) as ItemId[]
}

const normalizeDirectContentReferences = (migrated: GameState, raw: Record<string, any>) => {
  const fresh = createInitialState()
  const rawEquipment = isRecord(raw.equipment) ? raw.equipment : {}
  const candidate: Partial<Record<EquipmentPosition, ItemId | null>> = {}
  EQUIPMENT_POSITIONS.forEach((position) => {
    candidate[position] = Object.prototype.hasOwnProperty.call(rawEquipment, position)
      ? rawEquipment[position] as ItemId | null
      : migrated.equipment[position]
  })
  migrated.equipment = normalizeEquipmentState(candidate, migrated.inventory)

  const rawCombat = isRecord(raw.combat) ? raw.combat : {}
  const dungeonId = Object.prototype.hasOwnProperty.call(rawCombat, 'dungeonId') ? rawCombat.dungeonId : migrated.combat.dungeonId
  migrated.combat.dungeonId = dungeonId === null ? null : validContentId(dungeonId, dungeonIds) ? dungeonId as GameState['combat']['dungeonId'] : fresh.combat.dungeonId
  const enemyId = Object.prototype.hasOwnProperty.call(rawCombat, 'enemyId') ? rawCombat.enemyId : migrated.combat.enemyId
  migrated.combat.enemyId = enemyId === null ? null : validContentId(enemyId, monsterIds) ? enemyId as GameState['combat']['enemyId'] : fresh.combat.enemyId
  const pendingBossId = Object.prototype.hasOwnProperty.call(rawCombat, 'pendingBossId') ? rawCombat.pendingBossId : migrated.combat.pendingBossId
  migrated.combat.pendingBossId = pendingBossId === null ? null : validContentId(pendingBossId, monsterIds) ? pendingBossId as GameState['combat']['pendingBossId'] : fresh.combat.pendingBossId
  const activeTargetedLocation = migrated.combat.active && migrated.combat.dungeonId
    ? getCombatLocationByDungeonId(migrated.combat.dungeonId)
    : null
  if (activeTargetedLocation && migrated.combat.dungeonId) {
    const rawTarget = typeof rawCombat.targetEnemyId === 'string' ? rawCombat.targetEnemyId as MonsterId : null
    const rawEnemy = migrated.combat.enemyId
    const firstTarget = DUNGEONS[migrated.combat.dungeonId].monsterPool.find((monsterId) => isCombatTargetForLocation(activeTargetedLocation, migrated.combat.dungeonId, monsterId)) ?? null
    const activeEnemyIsBoss = Boolean(rawEnemy && MONSTERS[rawEnemy] && isBossMonster(MONSTERS[rawEnemy]))
    const candidate = !activeEnemyIsBoss && isCombatTargetForLocation(activeTargetedLocation, migrated.combat.dungeonId, rawTarget)
      ? rawTarget
      : !activeEnemyIsBoss && isCombatTargetForLocation(activeTargetedLocation, migrated.combat.dungeonId, rawEnemy)
        ? rawEnemy
        : firstTarget
    migrated.combat.targetEnemyId = candidate
  } else {
    migrated.combat.targetEnemyId = null
  }
  if (migrated.combat.active && migrated.combat.dungeonId && getCombatEncounterMode(getCombatLocationByDungeonId(migrated.combat.dungeonId)) === 'sequence') {
    migrated.combat.targetEnemyId = null
    migrated.combat.pendingBossId = null
    migrated.combat.threatCleared = 0
  }
}

const normalizeGuardianRuntime = (migrated: GameState, raw: Record<string, any>) => {
  const rawCombat = isRecord(raw.combat) ? raw.combat : {}
  const rawGuardian = isRecord(rawCombat.guardian) ? rawCombat.guardian : {}
  const rawActiveId = rawGuardian.activeGuardianId
  const activeGuardianId = migrated.combat.enemyId && isSummoningUnlocked(migrated) && typeof rawActiveId === 'string' && GUARDIAN_IDS.includes(rawActiveId as typeof GUARDIAN_IDS[number])
    ? rawActiveId as typeof GUARDIAN_IDS[number]
    : null
  const hasEncounter = Boolean(migrated.combat.enemyId)
  const suppressedForEncounter = hasEncounter && isSummoningUnlocked(migrated) && rawGuardian.suppressedForEncounter === true && !activeGuardianId
  const attackTimerMs = activeGuardianId
    ? Math.min(GUARDIANS[activeGuardianId].attack.intervalMs, Math.max(0, nonNegativeNumber(rawGuardian.attackTimerMs) ?? GUARDIANS[activeGuardianId].attack.intervalMs))
    : 0
  migrated.combat.guardian = { activeGuardianId, attackTimerMs, suppressedForEncounter }
}

/** Explicit V26→V27 cleanup for the removed Prismatic Focus content. */
const removeDeletedPrismaticFocus = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  if (sourceVersion >= 27) return

  delete (migrated.inventory as Record<string, unknown>)[REMOVED_PRISMATIC_FOCUS_ID]
  delete (migrated.protectedItems as Record<string, unknown>)[REMOVED_PRISMATIC_FOCUS_ID]
  delete (migrated.artifactProgress as Record<string, unknown>)[REMOVED_PRISMATIC_FOCUS_ID]
  migrated.progress.discoveredItems = migrated.progress.discoveredItems.filter((itemId) => (itemId as string) !== REMOVED_PRISMATIC_FOCUS_ID)

  EQUIPMENT_POSITIONS.forEach((position) => {
    if ((migrated.equipment[position] as string | null) === REMOVED_PRISMATIC_FOCUS_ID) migrated.equipment[position] = null
  })

  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawArtificing = isRecord(rawActivities.artificing) ? rawActivities.artificing : {}
  const rawActiveJob = isRecord(rawArtificing.activeJob) ? rawArtificing.activeJob : null
  const activeJob = migrated.activities.artificing.activeJob
  const activeJobWasRemoved = Boolean(
    (activeJob?.kind === 'recipe' && (activeJob as { recipeId?: unknown }).recipeId === REMOVED_PRISMATIC_FOCUS_ID)
    || (activeJob?.kind === 'artifact-forge' && (activeJob as { artifactId?: unknown }).artifactId === REMOVED_PRISMATIC_FOCUS_ID)
    || (rawActiveJob?.kind === 'recipe' && rawActiveJob.recipeId === REMOVED_PRISMATIC_FOCUS_ID)
    || (rawActiveJob?.kind === 'artifact-forge' && rawActiveJob.artifactId === REMOVED_PRISMATIC_FOCUS_ID),
  )
  const migratedActiveRecipeId = migrated.activities.artificing.activeRecipeId as string | null
  const activeRecipeWasRemoved = migratedActiveRecipeId === null
    ? rawArtificing.activeRecipeId === REMOVED_PRISMATIC_FOCUS_ID
    : migratedActiveRecipeId === REMOVED_PRISMATIC_FOCUS_ID
  if (activeJobWasRemoved || activeRecipeWasRemoved) migrated.activities.artificing = { activeJob: null, activeRecipeId: null, progressMs: 0 }
}

const validResearchStatus = (value: unknown): ResearchJobState['status'] => value === 'running' || value === 'mana-limited' || value === 'waiting-mana' || value === 'level-cap' || value === 'protected' || value === 'missing-item' || value === 'prepared' ? value : 'prepared'

/** Normalizes both the V8 single queue and the V9 slot document. */
const normalizeResearch = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  const fresh = createInitialState()
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawResearch = isRecord(rawActivities.research) ? rawActivities.research : {}
  const rawSlots = isRecord(rawResearch.slots) ? rawResearch.slots : null
  const slots = { ...fresh.activities.research.slots }
  const normalizeJob = (source: Record<string, any>, oldQueue = false): ResearchJobState | null => {
    const legacyActivity = migrated.activities.research
    const itemId = source.itemId ?? (oldQueue ? legacyActivity.itemId : undefined)
    const targetSchoolId = source.targetSchoolId ?? (oldQueue ? legacyActivity.targetSchoolId : undefined)
    if (!validContentId(itemId, itemIds) || !ITEMS[itemId as ItemId] || ITEMS[itemId as ItemId].kind !== 'material' || !ITEMS[itemId as ItemId].researchSchool) return null
    if (!validContentId(targetSchoolId, Object.keys(SCHOOLS))) return null
    const remaining = nonNegativeInteger(source.remainingQuantity) ?? (oldQueue ? nonNegativeInteger(legacyActivity.remainingQuantity) ?? 0 : 0)
    if (remaining < 1) return null
    const requested = Math.max(remaining, nonNegativeInteger(source.requestedQuantity) ?? remaining)
    const status = validResearchStatus(source.status)
    const blocked = status === 'level-cap' || status === 'missing-item' || status === 'protected'
    const rawProgress = nonNegativeNumber(source.progressMs) ?? 0
    const progressMs = status === 'waiting-mana' && rawProgress >= BALANCE.research.durationPerItemMs
      ? 0
      : Math.min(BALANCE.research.durationPerItemMs, rawProgress)
    return {
      itemId: itemId as ItemId,
      targetSchoolId: targetSchoolId as SchoolId,
      requestedQuantity: requested,
      remainingQuantity: remaining,
      progressMs,
      echoesAssigned: oldQueue ? source.running === true && !blocked ? 1 : 0 : Math.min(BALANCE.research.maxEchoes, Math.max(0, Math.floor(nonNegativeNumber(source.echoesAssigned) ?? 0))),
      status: oldQueue ? blocked ? status : source.running === true ? 'running' : 'prepared' : status,
    }
  }

  let foundRawSlot = false
  if (rawSlots) {
    RESEARCH_SLOT_ORDER.forEach((slotId) => {
      const source = isRecord(rawSlots[slotId]) ? rawSlots[slotId] as Record<string, any> : null
      if (source) { foundRawSlot = true; slots[slotId] = normalizeJob(source) }
    })
  }
  // V8 fixtures may have been created by spreading a newer initial state,
  // leaving an all-null slots record alongside the real legacy queue fields.
  if (!rawSlots || (!foundRawSlot && sourceVersion < 9)) {
    const oldJob = normalizeJob(rawResearch, true)
    if (oldJob) slots['research-1'] = oldJob
  }
  migrated.activities.research = { slots }
  if (sourceVersion < 9) defineLegacyResearchCompatibility(migrated.activities.research)
}

const defineLegacyResearchCompatibility = (research: ResearchActivity) => {
  if (Object.prototype.hasOwnProperty.call(research, 'itemId')) return
  const first = () => research.slots['research-1']
  Object.defineProperties(research, {
    itemId: { configurable: true, get: () => first()?.itemId ?? null },
    targetSchoolId: { configurable: true, get: () => first()?.targetSchoolId ?? null },
    running: { configurable: true, get: () => Boolean(first()?.echoesAssigned) },
    requestedQuantity: { configurable: true, get: () => first()?.requestedQuantity ?? 0 },
    remainingQuantity: { configurable: true, get: () => first()?.remainingQuantity ?? 0 },
    progressMs: { configurable: true, get: () => first()?.progressMs ?? 0 },
  })
}

const migrateChanneling = (rawProgress: unknown, fresh: GameState['progress']): GameState['progress']['channeling'] => {
  const source = isRecord(rawProgress) && isRecord(rawProgress.channeling) ? rawProgress.channeling : {}
  const oldPillars = isRecord(source.pillars) ? source.pillars : {}
  const oldLeyline = typeof source.leylineConduitRank === 'number' ? source.leylineConduitRank : undefined
  const oldReservoir = typeof source.manaReservoirRank === 'number' ? source.manaReservoirRank : undefined
  const pillars = { ...fresh.channeling.pillars }
  MANA_PILLAR_IDS.forEach((id) => {
    const oldPillar = isRecord(oldPillars[id]) ? oldPillars[id] : {}
    const legacyLevel = id === 'leyline-conduit' ? oldLeyline : id === 'arcane-reservoir' ? oldReservoir : undefined
    pillars[id] = { rank: 1, level: safeLevel(oldPillar.level ?? legacyLevel) }
  })
  const discoveries = { ...fresh.channeling.discoveries }
  ;(['stable-leyline', 'echo-resonance', 'deep-reservoir'] as const).forEach((id) => {
    if (isRecord(source.discoveries) && typeof source.discoveries[id] === 'boolean') discoveries[id] = source.discoveries[id] as boolean
  })
  return {
    pillars,
    totalManaGenerated: typeof source.totalManaGenerated === 'number' ? Math.max(0, source.totalManaGenerated) : fresh.channeling.totalManaGenerated,
    fiveEchoSustainMs: typeof source.fiveEchoSustainMs === 'number' ? Math.max(0, source.fiveEchoSustainMs) : fresh.channeling.fiveEchoSustainMs,
    discoveries,
  }
}

const migrateTransmutationArrays = (rawProgress: unknown, fresh: GameState['progress']): GameState['progress']['transmutation'] => {
  const source = isRecord(rawProgress) && isRecord(rawProgress.transmutation) ? rawProgress.transmutation : {}
  const sourceArrays = isRecord(source.arrays) ? source.arrays : {}
  const arrays = { ...fresh.transmutation.arrays }
  TRANSMUTATION_ARRAY_IDS.forEach((id) => {
    const rawArray = isRecord(sourceArrays[id]) ? sourceArrays[id] : {}
    arrays[id] = { rank: 1, level: safeLevel(rawArray.level) }
  })
  return { arrays } as GameState['progress']['transmutation']
}

const LEGACY_CONDENSATION_DURATION_MS = 6000
const normalizedProgress = (value: unknown, oldDuration: number, newDuration: number) => {
  const progress = nonNegativeNumber(value) ?? 0
  return Math.min(newDuration, progress / Math.max(1, oldDuration) * newDuration)
}

/** Converts V7's two single-queue activities into independent V8 jobs. */
const normalizeTransmutationJobs = (migrated: GameState, raw: Record<string, any>) => {
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawTransmutation = isRecord(rawActivities.transmutation) ? rawActivities.transmutation : {}
  const jobs: Partial<Record<TransmutationRecipeId, TransmutationJobState>> = {}
  const rawJobs = isRecord(rawTransmutation.jobs) ? rawTransmutation.jobs : {}
  RECIPE_ORDER.forEach((recipeId) => {
    const rawJob = isRecord(rawJobs[recipeId]) ? rawJobs[recipeId] : null
    if (!rawJob) return
    const recipe = RECIPES[recipeId]
    const progress = nonNegativeNumber(rawJob.progressMs) ?? 0
    // Legacy Transmutation pinned unfunded work at 100%; that work was never
    // paid for and must not become an instant free output after hydration.
    jobs[recipeId] = { echoesAssigned: Math.max(0, Math.floor(nonNegativeNumber(rawJob.echoesAssigned) ?? 0)), progressMs: progress >= recipe.baseDurationMs ? 0 : Math.min(recipe.baseDurationMs, progress) }
  })

  if (rawTransmutation.running === true && validContentId(rawTransmutation.recipeId, recipeIds)) {
    const recipeId = rawTransmutation.recipeId as TransmutationRecipeId
    const recipe = RECIPES[recipeId]
    const progress = normalizedProgress(rawTransmutation.progressMs, typeof rawTransmutation.durationMs === 'number' ? rawTransmutation.durationMs : recipe.baseDurationMs, recipe.baseDurationMs)
    jobs[recipeId] = { echoesAssigned: Math.max(1, jobs[recipeId]?.echoesAssigned ?? 0), progressMs: progress >= recipe.baseDurationMs ? 0 : progress }
  }

  const rawCondense = isRecord(rawActivities.condense) ? rawActivities.condense : {}
  if (rawCondense.running === true && validContentId(rawCondense.element, ['fire', 'water', 'earth', 'air'])) {
    const recipeId = `${rawCondense.element}-fragment` as TransmutationRecipeId
    const progress = normalizedProgress(rawCondense.progressMs, LEGACY_CONDENSATION_DURATION_MS, RECIPES[recipeId].baseDurationMs)
    jobs[recipeId] = { echoesAssigned: Math.max(1, jobs[recipeId]?.echoesAssigned ?? 0), progressMs: progress >= RECIPES[recipeId].baseDurationMs ? 0 : progress }
  }

  // Preserve work while ensuring the migration cannot create Focus overflow.
  const researchEchoFocus = RESEARCH_SLOT_ORDER.reduce((sum, slotId) => sum + Math.max(0, Math.floor(migrated.activities.research.slots[slotId]?.echoesAssigned ?? 0)) * BALANCE.research.echoFocusCost, 0)
  const nonTransmutationFocus = Math.max(0, Math.floor(migrated.activities.channeling.echoesAssigned)) * BALANCE.channeling.echoFocusCost
    + researchEchoFocus
  const effectiveTransmutationCapacity = BALANCE.transmutation.maxEchoes + getTransmutationArrayBonuses(migrated).echoCapacityBonus
  const focusCapacity = Math.floor((migrated.player.maxFocus - nonTransmutationFocus) / BALANCE.transmutation.echoFocusCost)
  let remaining = Math.max(0, Math.min(effectiveTransmutationCapacity, focusCapacity))
  const normalized: Partial<Record<TransmutationRecipeId, TransmutationJobState>> = {}
  RECIPE_ORDER.forEach((recipeId) => {
    const job = jobs[recipeId]
    if (!job) return
    const echoes = Math.min(job.echoesAssigned, remaining)
    normalized[recipeId] = { echoesAssigned: echoes, progressMs: job.progressMs }
    remaining -= echoes
  })
  migrated.activities.transmutation = { jobs: normalized }
}

const normalizeResearchFocus = (migrated: GameState) => {
  const nonResearchFocus = Math.max(0, Math.floor(migrated.activities.channeling.echoesAssigned)) * BALANCE.channeling.echoFocusCost
    + Object.entries(migrated.activities.transmutation.jobs).reduce((sum, [, job]) => sum + Math.max(0, Math.floor(job?.echoesAssigned ?? 0)) * BALANCE.transmutation.echoFocusCost, 0)
  let remaining = Math.max(0, Math.floor((migrated.player.maxFocus - nonResearchFocus) / BALANCE.research.echoFocusCost))
  RESEARCH_SLOT_ORDER.forEach((slotId) => {
    const job = migrated.activities.research.slots[slotId]
    if (!job) return
    const echoes = Math.min(Math.max(0, Math.floor(job.echoesAssigned)), remaining)
    job.echoesAssigned = echoes
    if (echoes === 0 && job.status === 'running') job.status = 'prepared'
    remaining -= echoes
  })
}

const finalize = (migrated: GameState, raw: Record<string, any>, sourceVersion = Number(raw.saveVersion ?? 0)) => {
  // V1-V7 retain their historical migration marker. V8+ are normalized into
  // the current save document.
  migrated.saveVersion = sourceVersion >= 8 ? SAVE_VERSION : 8
  migrated.offlineBankMs = clampOfflineBankMs(migrated.offlineBankMs)
  // Debug overrides are runtime-only. Legacy godMode is ignored at this
  // boundary and must never survive hydration.
  migrated.debug = createInitialState().debug
  delete (migrated.player as unknown as Record<string, unknown>).godMode
  const migratedCombat = migrated.combat as unknown as Record<string, unknown>
  delete migratedCombat.playerAttackTimerMs
  delete migratedCombat.playerAttackDurationMs
  normalizeArcaneCore(migrated, raw)
  normalizeResonance(migrated, raw)
  normalizeWorldTier(migrated, raw)
  migrated.player.healthRegenTimerMs = normalizeHealthRegenTimer(isRecord(raw.player) ? raw.player.healthRegenTimerMs : undefined)
  migrated.progress.channeling = migrateChanneling(raw.progress, createInitialState().progress)
  migrated.progress.transmutation = migrateTransmutationArrays(raw.progress, createInitialState().progress)
  const rawUi = isRecord(raw.ui) ? raw.ui : {}
  migrated.ui.screen = normalizeScreen(rawUi.screen, migrated.ui.screen)
  migrated.ui.lastEnteredCombatDungeonId = normalizeLastEnteredCombatDungeonId(rawUi.lastEnteredCombatDungeonId ?? migrated.ui.lastEnteredCombatDungeonId)
  normalizeDynamicRecords(migrated, raw)
  normalizeDarkPortalProgress(migrated)
  normalizeLegacyProgressEvidence(migrated.progress)
  reconcileWorldTierProgression(migrated)
  normalizeSchoolCap(migrated, raw)
  normalizeSchoolXpCurveV25(migrated, raw, sourceVersion)
  normalizeSpellProgression(migrated, raw, sourceVersion)
  normalizeSpellPresets(migrated, raw, sourceVersion)
  normalizeCombatState(migrated, raw, sourceVersion)
  normalizeDirectContentReferences(migrated, raw)
  if (sourceVersion < SAVE_VERSION && migrated.combat.active) {
    const dungeonId = migrated.combat.dungeonId
    const location = getCombatLocationByDungeonId(dungeonId)
    const legacyRequirement = dungeonId
      ? sourceVersion < 43
        ? LEGACY_POWER_THREAT_REQUIREMENTS[dungeonId] ?? LEGACY_ELEMENTAL_SCAR_THREAT_REQUIREMENTS[dungeonId] ?? LEGACY_SHATTERED_MERIDIAN_THREAT_REQUIREMENTS[dungeonId]
        : sourceVersion < 44
          ? LEGACY_ELEMENTAL_SCAR_THREAT_REQUIREMENTS[dungeonId] ?? LEGACY_SHATTERED_MERIDIAN_THREAT_REQUIREMENTS[dungeonId]
          : sourceVersion < 45
            ? LEGACY_SHATTERED_MERIDIAN_THREAT_REQUIREMENTS[dungeonId] ?? LEGACY_BLACK_SIGIL_REACH_THREAT_REQUIREMENTS[dungeonId]
            : sourceVersion < 46
              ? LEGACY_BLACK_SIGIL_REACH_THREAT_REQUIREMENTS[dungeonId]
            : undefined
      : undefined
    if (dungeonId && location?.encounterMode === 'targeted' && (location.type === 'combat-zone' || location.type === 'elite-zone') && legacyRequirement) {
      const progressRatio = Math.min(1, Math.max(0, migrated.combat.threatCleared / legacyRequirement))
      const requirement = resolveBossThreatRequirement(dungeonId, migrated.worldTier.current)
      migrated.combat.threatCleared = Math.min(requirement, Math.max(0, Math.round(requirement * progressRatio)))
    }
  }
  normalizeGuardianRuntime(migrated, raw)
  removeDeletedPrismaticFocus(migrated, raw, sourceVersion)
  seedLegacyItemDiscoveries(migrated, raw, sourceVersion)
  reconcileStoryProgression(migrated)
  const screenUnlocked = migrated.ui.screen === 'crystals'
    ? isCrystalSystemUnlocked(migrated)
    : migrated.ui.screen === 'tower-summoning'
    ? isSummoningUnlocked(migrated)
    : isScreenUnlocked(migrated, migrated.ui.screen)
  if (!screenUnlocked) migrated.ui.screen = 'home'
  normalizeResearch(migrated, raw, sourceVersion)
  recalculateDerivedStats(migrated)
  normalizeTransmutationJobs(migrated, raw)
  normalizeResearchFocus(migrated)
  recalculateDerivedStats(migrated)
  return migrated
}

const migrateV1 = (raw: Record<string, any>): GameState => {
  const fresh = createInitialState()
  const oldPlayer = isRecord(raw.player) ? raw.player : {}
  const oldActivities = isRecord(raw.activities) ? raw.activities : {}
  const oldResearch = isRecord(oldActivities.research) ? oldActivities.research : {}
  const oldEquipment = isRecord(raw.equipment) ? raw.equipment : {}
  const oldProgress = isRecord(raw.progress) ? raw.progress : {}
  const oldItem = typeof oldResearch.itemId === 'string' ? oldResearch.itemId as ItemId : null
  const oldWeapon = typeof oldEquipment.weapon === 'string' ? oldEquipment.weapon as ItemId : null
  const oldFocus = typeof oldEquipment.focus === 'string' ? oldEquipment.focus as ItemId : null
  const oldMaxHealth = typeof oldPlayer.maxHealth === 'number' ? oldPlayer.maxHealth : fresh.player.baseMaxHealth
  const oldMaxMana = typeof oldPlayer.maxMana === 'number' ? oldPlayer.maxMana : fresh.player.baseMaxMana
  const oldMaxFocus = typeof oldPlayer.maxFocus === 'number' ? oldPlayer.maxFocus : fresh.player.baseMaxFocus
  const target = oldItem?.split('-')[0] as SchoolId | undefined
  const research: ResearchActivity = { ...fresh.activities.research, running: Boolean(oldResearch.running), itemId: oldItem, targetSchoolId: target && Object.keys(SCHOOLS).includes(target) ? target : null, requestedQuantity: oldItem ? 1 : 0, remainingQuantity: oldItem ? 1 : 0, progressMs: typeof oldResearch.progressMs === 'number' ? oldResearch.progressMs : 0, status: oldResearch.running ? 'running' : 'idle' }
  const migrated: GameState = {
    ...fresh,
    player: { ...fresh.player, ...oldPlayer, baseMaxHealth: typeof oldPlayer.baseMaxHealth === 'number' ? oldPlayer.baseMaxHealth : oldMaxHealth, baseMaxMana: typeof oldPlayer.baseMaxMana === 'number' ? oldPlayer.baseMaxMana : oldMaxMana, baseMaxFocus: typeof oldPlayer.baseMaxFocus === 'number' ? oldPlayer.baseMaxFocus : oldMaxFocus },
    inventory: { ...fresh.inventory, ...(isRecord(raw.inventory) ? raw.inventory : {}) },
    protectedItems: { ...fresh.protectedItems, ...(oldWeapon ? { [oldWeapon]: true } : {}) },
    equipment: { ...fresh.equipment, weapon: oldWeapon ?? oldFocus ?? fresh.equipment.weapon },
    activities: { ...fresh.activities, channeling: { echoesAssigned: oldActivities.autoChannel === true ? 1 : 0 }, research, autoCast: { ...fresh.activities.autoCast, ...(isRecord(oldActivities.autoCast) ? oldActivities.autoCast : {}) } },
    progress: { ...fresh.progress, ...(oldProgress as Partial<GameState['progress']>) },
    combat: { ...fresh.combat, ...(isRecord(raw.combat) ? raw.combat : {}) },
    ui: {
      screen: fresh.ui.screen,
      lastEnteredCombatDungeonId: normalizeLastEnteredCombatDungeonId(isRecord(raw.ui) ? raw.ui.lastEnteredCombatDungeonId : undefined),
    },
    offlineBankMs: typeof raw.offlineBankMs === 'number' ? raw.offlineBankMs : 0,
  }
  return finalize(migrated, raw)
}

const migrateV2 = (raw: Record<string, any>): GameState => {
  const fresh = createInitialState()
  const migrated = merge(fresh, raw)
  const oldActivities = isRecord(raw.activities) ? raw.activities : {}
  migrated.activities = {
    ...fresh.activities,
    research: isRecord(oldActivities.research) ? { ...fresh.activities.research, ...oldActivities.research } as ResearchActivity : fresh.activities.research,
    channeling: { echoesAssigned: oldActivities.autoChannel === true ? 1 : 0 },
    autoCast: { ...fresh.activities.autoCast, ...(isRecord(oldActivities.autoCast) ? oldActivities.autoCast : {}) },
  }
  return finalize(migrated, raw)
}

const migrateV3 = (raw: Record<string, any>): GameState => finalize(merge(createInitialState(), raw), raw)
const migrateV4 = (raw: Record<string, any>): GameState => finalize(merge(createInitialState(), raw), raw)
const migrateV5 = (raw: Record<string, any>): GameState => finalize(merge(createInitialState(), raw), raw)
/** v6 used the former earrings position. It is intentionally ignored; no item is auto-converted into Cape. */
const migrateV6 = (raw: Record<string, any>): GameState => finalize(merge(createInitialState(), raw), raw)

export const migrateSave = (rawSave: unknown): GameState => {
  if (!isRecord(rawSave)) throw new SaveMigrationError('Save data is not a valid object.')
  const version = rawSave.saveVersion
  if (version === 1) return migrateV1(rawSave)
  if (version === 2) return migrateV2(rawSave)
  if (version === 3) return migrateV3(rawSave)
  if (version === 4) return migrateV4(rawSave)
  if (version === 5) return migrateV5(rawSave)
  if (version === 6) return migrateV6(rawSave)
  if (version === 7) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 8) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 9) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 10) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 11) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 12) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 13) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 14) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 15) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 16) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 17) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 18) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 19) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (typeof version === 'number' && version >= 20 && version <= SAVE_VERSION) {
    return finalize(merge(createInitialState(), rawSave), rawSave, version)
  }
  throw new SaveMigrationError(`Unsupported save version: ${String(version ?? 'missing')}.`)
}
