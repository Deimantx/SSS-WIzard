import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { MANA_PILLAR_IDS } from '../game/data/manaPillars'
import { DUNGEONS } from '../game/content/dungeons/dungeons'
import { GUILD_REQUESTS } from '../game/content/guild/guildRequests'
import { ITEMS } from '../game/content/items/items'
import { isBossMonster, MONSTERS } from '../game/content/monsters/whisperingWoods'
import { RECIPES } from '../game/content/recipes/recipes'
import { RECIPE_ORDER } from '../game/content/recipes/recipes'
import { BALANCE } from '../game/core/balance/balance'
import { SPELLS } from '../game/content/spells/spells'
import { SCHOOLS } from '../game/content/schools/schools'
import { EQUIPMENT_POSITIONS, normalizeEquipmentState } from '../game/core/equipment'
import type { EquipmentPosition, GameState, ItemId, RecipeId, ResearchActivity, ResearchJobState, SchoolId, TransmutationJobState } from '../game/types'
import { RESEARCH_SLOT_ORDER } from '../game/systems/research/researchReservations'
import { isRecord, SaveMigrationError } from './saveSchema'
import { recalculateDerivedStats } from '../game/engine'
import { STATUS_DEFINITIONS } from '../game/content/statuses'
import type { ActiveStatus, CombatSource, StatusId } from '../game/types'

const normalizeScreen = (value: unknown, fallback: GameState['ui']['screen']): GameState['ui']['screen'] => {
  if (value === 'tower') return 'tower-channeling'
  const valid = ['home', 'combat', 'schools', 'inventory', 'equipment', 'collection', 'bestiary', 'tower-channeling', 'tower-focus', 'tower-research', 'tower-transmutation', 'guild', 'settings']
  if (value === 'tower-condensation') return 'tower-transmutation'
  return typeof value === 'string' && valid.includes(value) ? value as GameState['ui']['screen'] : fallback
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
const bossIds = Object.values(MONSTERS).filter(isBossMonster).map((monster) => monster.id)
const dungeonIds = Object.keys(DUNGEONS)
const requestIds = Object.keys(GUILD_REQUESTS)
const spellIds = Object.keys(SPELLS)
const recipeIds = Object.keys(RECIPES)
const enemySpecialIds = ['ancient-growth', 'living-core']
const permanentFocusIds = ['forest-heart', 'guild-apprentice']

const nonNegativeInteger = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : undefined
const nonNegativeGold = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : undefined
const nonNegativeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined
const booleanValue = (value: unknown) => typeof value === 'boolean' ? value : undefined
const validContentId = (value: unknown, validIds: readonly string[]) => typeof value === 'string' && validIds.includes(value)

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
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawCombat = isRecord(raw.combat) ? raw.combat : {}

  migrated.inventory = normalizeDynamicRecord(fresh.inventory, raw.inventory, itemIds, nonNegativeInteger)
  migrated.protectedItems = normalizeDynamicRecord(fresh.protectedItems, raw.protectedItems, itemIds, booleanValue)
  migrated.activities.autoCast = normalizeDynamicRecord(fresh.activities.autoCast, rawActivities.autoCast, spellIds, booleanValue) as GameState['activities']['autoCast']
  migrated.combat.spellCooldowns = normalizeDynamicRecord(fresh.combat.spellCooldowns, rawCombat.spellCooldowns, spellIds, nonNegativeNumber) as GameState['combat']['spellCooldowns']
  migrated.combat.enemySpecialUsed = normalizeDynamicRecord(fresh.combat.enemySpecialUsed, rawCombat.enemySpecialUsed, enemySpecialIds, booleanValue)
  migrated.progress.requestProgress = normalizeDynamicRecord(fresh.progress.requestProgress, rawProgress.requestProgress, requestIds, nonNegativeInteger)
  migrated.progress.requestClaims = normalizeDynamicRecord(fresh.progress.requestClaims, rawProgress.requestClaims, requestIds, booleanValue)
  migrated.progress.permanentFocusBonuses = normalizeDynamicRecord(fresh.progress.permanentFocusBonuses, rawProgress.permanentFocusBonuses, permanentFocusIds, nonNegativeNumber)
  const rawFocusImprovement = isRecord(rawProgress.focusImprovement) ? rawProgress.focusImprovement : {}
  migrated.progress.focusImprovement = { rank: 1, level: safeLevel(rawFocusImprovement.level) }
  migrated.progress.lifetimeKillsByMonster = normalizeDynamicRecord(fresh.progress.lifetimeKillsByMonster, rawProgress.lifetimeKillsByMonster, monsterIds, nonNegativeInteger)
  migrated.progress.bossKillsByBoss = normalizeDynamicRecord(fresh.progress.bossKillsByBoss, rawProgress.bossKillsByBoss, bossIds, nonNegativeInteger)
  migrated.progress.autoHuntBossByDungeon = normalizeDynamicRecord(fresh.progress.autoHuntBossByDungeon, rawProgress.autoHuntBossByDungeon, dungeonIds, booleanValue) as GameState['progress']['autoHuntBossByDungeon']
  const rawCurrencies = isRecord(raw.currencies) ? raw.currencies : {}
  migrated.currencies = { gold: nonNegativeGold(rawCurrencies.gold) ?? fresh.currencies.gold }

  const rawUnlockedSpells = Array.isArray(rawProgress.unlockedSpells) ? rawProgress.unlockedSpells : []
  migrated.progress.unlockedSpells = rawUnlockedSpells.filter((id): id is GameState['progress']['unlockedSpells'][number] => typeof id === 'string' && spellIds.includes(id))
  const rawDiscoveredMonsters = Array.isArray(rawProgress.discoveredMonsters) ? rawProgress.discoveredMonsters : []
  migrated.progress.discoveredMonsters = [...new Set(rawDiscoveredMonsters.filter((id): id is GameState['progress']['discoveredMonsters'][number] => typeof id === 'string' && monsterIds.includes(id)))]
  const rawDiscoveredItems = Array.isArray(rawProgress.discoveredItems) ? rawProgress.discoveredItems : []
  migrated.progress.discoveredItems = [...new Set(rawDiscoveredItems.filter((id): id is ItemId => typeof id === 'string' && itemIds.includes(id)))]
}

const normalizeCombatState = (migrated: GameState, raw: Record<string, any>) => {
  const fresh = createInitialState()
  const rawCombat = isRecord(raw.combat) ? raw.combat : {}
  const normalizeSource = (value: unknown, fallbackActor: 'player' | 'enemy'): CombatSource => {
    if (!isRecord(value)) return { actor: fallbackActor, kind: 'system', sourceId: 'save-migration' }
    const actor = value.actor === 'player' || value.actor === 'enemy' ? value.actor : fallbackActor
    const kind = ['basic-attack', 'spell', 'weapon', 'status', 'trait', 'special-attack', 'equipment', 'system'].includes(String(value.kind)) ? value.kind as CombatSource['kind'] : 'system'
    const school = ['fire', 'water', 'earth', 'air'].includes(String(value.school)) ? value.school as CombatSource['school'] : undefined
    return { actor, kind, sourceId: typeof value.sourceId === 'string' ? value.sourceId : 'save-migration', originSourceId: typeof value.originSourceId === 'string' ? value.originSourceId : undefined, school, tags: Array.isArray(value.tags) ? value.tags.filter((tag): tag is NonNullable<CombatSource['tags']>[number] => typeof tag === 'string') : undefined }
  }
  const normalizeStatuses = (value: unknown, fallbackActor: 'player' | 'enemy'): ActiveStatus[] => {
    if (!Array.isArray(value)) return []
    return value.flatMap((entry): ActiveStatus[] => {
      if (!isRecord(entry)) return []
      const rawId = entry.statusId ?? entry.id
      if (rawId === 'barrier' || rawId === 'attack-delay' || typeof rawId !== 'string' || !Object.prototype.hasOwnProperty.call(STATUS_DEFINITIONS, rawId)) return []
      const statusId = rawId as StatusId
      const definition = STATUS_DEFINITIONS[statusId]
      const remainingRaw = entry.remainingMs
      const remainingMs = remainingRaw === null ? null : nonNegativeNumber(remainingRaw) ?? definition.defaultDurationMs
      const nextTickMs = nonNegativeNumber(entry.nextTickMs)
      return [{ statusId, holder: fallbackActor, source: normalizeSource(entry.source, fallbackActor === 'player' ? 'enemy' : 'player'), remainingMs, stacks: Math.max(1, Math.floor(nonNegativeNumber(entry.stacks) ?? 1)), potency: nonNegativeNumber(entry.potency ?? entry.value), nextTickMs: nextTickMs ?? (definition.periodic?.intervalMs), appliedAt: nonNegativeNumber(entry.appliedAt) }]
    })
  }
  const rawPlayerStatuses = Array.isArray(rawCombat.playerStatuses) ? rawCombat.playerStatuses : []
  const oldBarrier = rawPlayerStatuses.filter((entry) => isRecord(entry) && entry.id === 'barrier').reduce((sum, entry) => sum + (nonNegativeNumber(entry.value) ?? 0), 0)
  const oldDelay = rawPlayerStatuses.filter((entry) => isRecord(entry) && entry.id === 'attack-delay').reduce((sum, entry) => sum + (nonNegativeNumber(entry.value) ?? 0), 0)
  migrated.combat.playerBarrier = Math.max(0, nonNegativeNumber(rawCombat.playerBarrier) ?? 0, oldBarrier)
  migrated.combat.enemyBarrier = Math.max(0, nonNegativeNumber(rawCombat.enemyBarrier) ?? fresh.combat.enemyBarrier)
  migrated.combat.playerStatuses = normalizeStatuses(rawPlayerStatuses, 'player')
  migrated.combat.enemyStatuses = normalizeStatuses(rawCombat.enemyStatuses, 'enemy')
  migrated.combat.playerAttackTimerMs = Math.max(0, migrated.combat.playerAttackTimerMs + oldDelay)
  const rawTriggered = Array.isArray(rawCombat.triggeredRuleIds) ? rawCombat.triggeredRuleIds.filter((id): id is string => typeof id === 'string') : []
  const legacyTriggered = Object.entries(migrated.combat.enemySpecialUsed).flatMap(([id, used]) => used ? id === 'ancient-growth' ? ['grove-sentinel-ancient-growth-threshold'] : id === 'living-core' ? ['forest-heart-living-core-threshold'] : [] : [])
  migrated.combat.triggeredRuleIds = [...new Set([...rawTriggered, ...legacyTriggered])]
}

/** Seeds the historical item archive only for saves that predate V11. */
const seedLegacyItemDiscoveries = (migrated: GameState, raw: Record<string, any>, sourceVersion: number) => {
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const hasArchive = Array.isArray(rawProgress.discoveredItems)
  if (sourceVersion >= SAVE_VERSION && hasArchive) return

  const discovered = new Set<ItemId>(migrated.progress.discoveredItems)
  const rawEquipment = isRecord(raw.equipment) ? raw.equipment : {}
  Object.values(rawEquipment).forEach((itemId) => { if (typeof itemId === 'string' && ITEMS[itemId as ItemId]) discovered.add(itemId as ItemId) })
  Object.entries(migrated.inventory).forEach(([itemId, quantity]) => {
    if (itemIds.includes(itemId) && typeof quantity === 'number' && quantity > 0) discovered.add(itemId as ItemId)
  })
  Object.values(migrated.equipment).forEach((itemId) => { if (itemId && ITEMS[itemId]) discovered.add(itemId as ItemId) })

  Object.values(MONSTERS).forEach((monster) => {
    const defeats = isBossMonster(monster) ? migrated.progress.bossKillsByBoss[monster.id] ?? 0 : migrated.progress.lifetimeKillsByMonster[monster.id] ?? 0
    if (defeats < 1) return
    monster.loot.filter((drop) => drop.chance === 1).forEach((drop) => discovered.add(drop.itemId))
  })
  migrated.progress.discoveredItems = itemIds.filter((itemId) => discovered.has(itemId as ItemId)) as ItemId[]
}

const normalizeDirectContentReferences = (migrated: GameState, raw: Record<string, any>) => {
  const fresh = createInitialState()
  const rawEquipment = isRecord(raw.equipment) ? raw.equipment : {}
  const legacyToNew: Partial<Record<EquipmentPosition, keyof typeof rawEquipment>> = { offhand: 'focus', armor: 'robe', amulet: 'charm' }
  const candidate: Partial<Record<EquipmentPosition, ItemId | null>> = {}
  EQUIPMENT_POSITIONS.forEach((position) => {
    const hasNewValue = Object.prototype.hasOwnProperty.call(rawEquipment, position)
    const legacyPosition = legacyToNew[position]
    const hasLegacyValue = legacyPosition ? Object.prototype.hasOwnProperty.call(rawEquipment, legacyPosition) : false
    candidate[position] = hasNewValue ? rawEquipment[position] as ItemId | null : legacyPosition && hasLegacyValue ? rawEquipment[legacyPosition] as ItemId | null : migrated.equipment[position]
  })
  migrated.equipment = normalizeEquipmentState(candidate, migrated.inventory)

  const rawCombat = isRecord(raw.combat) ? raw.combat : {}
  const dungeonId = Object.prototype.hasOwnProperty.call(rawCombat, 'dungeonId') ? rawCombat.dungeonId : migrated.combat.dungeonId
  migrated.combat.dungeonId = dungeonId === null ? null : validContentId(dungeonId, dungeonIds) ? dungeonId as GameState['combat']['dungeonId'] : fresh.combat.dungeonId
  const enemyId = Object.prototype.hasOwnProperty.call(rawCombat, 'enemyId') ? rawCombat.enemyId : migrated.combat.enemyId
  migrated.combat.enemyId = enemyId === null ? null : validContentId(enemyId, monsterIds) ? enemyId as GameState['combat']['enemyId'] : fresh.combat.enemyId
  const pendingBossId = Object.prototype.hasOwnProperty.call(rawCombat, 'pendingBossId') ? rawCombat.pendingBossId : migrated.combat.pendingBossId
  migrated.combat.pendingBossId = pendingBossId === null ? null : pendingBossId === 'grove-sentinel' && validContentId(pendingBossId, bossIds) ? pendingBossId : fresh.combat.pendingBossId
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

const LEGACY_CONDENSATION_DURATION_MS = 6000
const normalizedProgress = (value: unknown, oldDuration: number, newDuration: number) => {
  const progress = nonNegativeNumber(value) ?? 0
  return Math.min(newDuration, progress / Math.max(1, oldDuration) * newDuration)
}

/** Converts V7's two single-queue activities into independent V8 jobs. */
const normalizeTransmutationJobs = (migrated: GameState, raw: Record<string, any>) => {
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawTransmutation = isRecord(rawActivities.transmutation) ? rawActivities.transmutation : {}
  const jobs: Partial<Record<RecipeId, TransmutationJobState>> = {}
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
    const recipeId = rawTransmutation.recipeId as RecipeId
    const recipe = RECIPES[recipeId]
    const progress = normalizedProgress(rawTransmutation.progressMs, typeof rawTransmutation.durationMs === 'number' ? rawTransmutation.durationMs : recipe.baseDurationMs, recipe.baseDurationMs)
    jobs[recipeId] = { echoesAssigned: Math.max(1, jobs[recipeId]?.echoesAssigned ?? 0), progressMs: progress >= recipe.baseDurationMs ? 0 : progress }
  }

  const rawCondense = isRecord(rawActivities.condense) ? rawActivities.condense : {}
  if (rawCondense.running === true && validContentId(rawCondense.element, ['fire', 'water', 'earth', 'air'])) {
    const recipeId = `${rawCondense.element}-fragment` as RecipeId
    const progress = normalizedProgress(rawCondense.progressMs, LEGACY_CONDENSATION_DURATION_MS, RECIPES[recipeId].baseDurationMs)
    jobs[recipeId] = { echoesAssigned: Math.max(1, jobs[recipeId]?.echoesAssigned ?? 0), progressMs: progress >= RECIPES[recipeId].baseDurationMs ? 0 : progress }
  }

  // Preserve work while ensuring the migration cannot create Focus overflow.
  const researchEchoFocus = RESEARCH_SLOT_ORDER.reduce((sum, slotId) => sum + Math.max(0, Math.floor(migrated.activities.research.slots[slotId]?.echoesAssigned ?? 0)) * BALANCE.research.echoFocusCost, 0)
  const nonTransmutationFocus = Math.max(0, Math.floor(migrated.activities.channeling.echoesAssigned)) * BALANCE.channeling.echoFocusCost
    + researchEchoFocus
    + Object.entries(migrated.activities.autoCast).filter(([spellId, active]) => active && migrated.progress.unlockedSpells.includes(spellId as any)).reduce((sum, [spellId]) => sum + (SPELLS[spellId as keyof typeof SPELLS]?.autoCastFocus ?? 0), 0)
  let remaining = Math.max(0, Math.min(BALANCE.transmutation.maxEchoes, Math.floor((migrated.player.maxFocus - nonTransmutationFocus) / BALANCE.transmutation.echoFocusCost)))
  const normalized: Partial<Record<RecipeId, TransmutationJobState>> = {}
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
    + Object.entries(migrated.activities.autoCast).filter(([spellId, active]) => active && migrated.progress.unlockedSpells.includes(spellId as any)).reduce((sum, [spellId]) => sum + (SPELLS[spellId as keyof typeof SPELLS]?.autoCastFocus ?? 0), 0)
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
  // Versions through V7 retain the historical migration marker for callers
  // that still chain those migrations; V8-V10 are normalized into the current
  // V11 document.
  migrated.saveVersion = sourceVersion >= SAVE_VERSION ? SAVE_VERSION : sourceVersion >= 8 ? 11 : 8
  migrated.progress.channeling = migrateChanneling(raw.progress, createInitialState().progress)
  migrated.ui.screen = normalizeScreen(isRecord(raw.ui) ? raw.ui.screen : undefined, migrated.ui.screen)
  normalizeDynamicRecords(migrated, raw)
  normalizeCombatState(migrated, raw)
  normalizeDirectContentReferences(migrated, raw)
  seedLegacyItemDiscoveries(migrated, raw, sourceVersion)
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
    equipment: { ...fresh.equipment, weapon: oldWeapon ?? fresh.equipment.weapon, offhand: oldFocus ?? null },
    activities: { ...fresh.activities, channeling: { echoesAssigned: oldActivities.autoChannel === true ? 1 : 0 }, research, autoCast: { ...fresh.activities.autoCast, ...(isRecord(oldActivities.autoCast) ? oldActivities.autoCast : {}) } },
    progress: { ...fresh.progress, ...(oldProgress as Partial<GameState['progress']>) },
    combat: { ...fresh.combat, ...(isRecord(raw.combat) ? raw.combat : {}) },
    ui: { screen: fresh.ui.screen },
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
  if (version === SAVE_VERSION) {
    return finalize(merge(createInitialState(), rawSave), rawSave, version)
  }
  throw new SaveMigrationError(`Unsupported save version: ${String(version ?? 'missing')}.`)
}
