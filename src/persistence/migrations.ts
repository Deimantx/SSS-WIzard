import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { MANA_PILLAR_IDS } from '../game/data/manaPillars'
import { DUNGEONS } from '../game/content/dungeons/dungeons'
import { GUILD_REQUESTS } from '../game/content/guild/guildRequests'
import { ITEMS } from '../game/content/items/items'
import { isBossMonster, MONSTERS } from '../game/content/monsters'
import { RECIPES } from '../game/content/recipes/recipes'
import { RECIPE_ORDER } from '../game/content/recipes/recipes'
import { BALANCE } from '../game/core/balance/balance'
import { SPELLS } from '../game/content/spells/spells'
import { SCHOOLS } from '../game/content/schools/schools'
import { EQUIPMENT_POSITIONS, normalizeEquipmentState } from '../game/core/equipment'
import type { EquipmentPosition, GameState, ItemId, MonsterId, RecipeId, ResearchActivity, ResearchJobState, SchoolId, SpellId, TransmutationJobState } from '../game/types'
import { RESEARCH_SLOT_ORDER } from '../game/systems/research/researchReservations'
import { isRecord, SaveMigrationError } from './saveSchema'
import { recalculateDerivedStats } from '../game/engine'
import { STATUS_DEFINITIONS } from '../game/content/statuses'
import type { ActiveStatus, CombatSource, StatusId } from '../game/types'
import { getSpellAutoCastFocusCost, MAX_SPELL_RANK, MIN_SPELL_RANK, normalizeSpellPresetState, syncAllSpellUnlocks, type SpellRank } from '../game/systems/spells'
import { getStatusApplicationSourceKey } from '../game/systems/combat/statusRuntime'
import { normalizePersistedPeriodicEffects, hasValidStatusModifierOverrides } from '../game/systems/combat/combatEffectValidation'
import { MAX_ACTION_WORK_MS, MIN_ACTION_TIME_MS } from '../game/core/balance/combatTiming'

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
const dungeonIds = Object.keys(DUNGEONS)
const requestIds = Object.keys(GUILD_REQUESTS)
const spellIds = Object.keys(SPELLS)
const recipeIds = Object.keys(RECIPES)
const permanentFocusIds = ['forest-heart', 'guild-apprentice']

const nonNegativeInteger = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : undefined
const nonNegativeGold = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value))) : undefined
const nonNegativeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : undefined
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
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const rawActivities = isRecord(raw.activities) ? raw.activities : {}
  const rawCombat = isRecord(raw.combat) ? raw.combat : {}

  migrated.inventory = normalizeDynamicRecord(fresh.inventory, raw.inventory, itemIds, nonNegativeInteger)
  migrated.protectedItems = normalizeDynamicRecord(fresh.protectedItems, raw.protectedItems, itemIds, booleanValue)
  migrated.activities.autoCast = normalizeDynamicRecord(fresh.activities.autoCast, rawActivities.autoCast, spellIds, booleanValue) as GameState['activities']['autoCast']
  migrated.combat.spellCooldowns = normalizeDynamicRecord(fresh.combat.spellCooldowns, rawCombat.spellCooldowns, spellIds, nonNegativeNumber) as GameState['combat']['spellCooldowns']
  migrated.progress.requestProgress = normalizeDynamicRecord(fresh.progress.requestProgress, rawProgress.requestProgress, requestIds, nonNegativeInteger)
  migrated.progress.requestClaims = normalizeDynamicRecord(fresh.progress.requestClaims, rawProgress.requestClaims, requestIds, booleanValue)
  migrated.progress.permanentFocusBonuses = normalizeDynamicRecord(fresh.progress.permanentFocusBonuses, rawProgress.permanentFocusBonuses, permanentFocusIds, nonNegativeNumber)
  const rawFocusImprovement = isRecord(rawProgress.focusImprovement) ? rawProgress.focusImprovement : {}
  migrated.progress.focusImprovement = { rank: 1, level: safeLevel(rawFocusImprovement.level) }
  migrated.progress.lifetimeKillsByMonster = normalizeDynamicRecord(fresh.progress.lifetimeKillsByMonster, rawProgress.lifetimeKillsByMonster, monsterIds, nonNegativeInteger)
  // Keep historical boss counters for monsters that were later demoted to a
  // normal encounter (notably Grove Sentinel). They remain useful migration
  // evidence even when current combat treats the monster as non-boss.
  migrated.progress.bossKillsByBoss = normalizeDynamicRecord(fresh.progress.bossKillsByBoss, rawProgress.bossKillsByBoss, monsterIds, nonNegativeInteger)
  migrated.progress.autoHuntBossByDungeon = normalizeDynamicRecord(fresh.progress.autoHuntBossByDungeon, rawProgress.autoHuntBossByDungeon, dungeonIds, booleanValue) as GameState['progress']['autoHuntBossByDungeon']
  const rawCurrencies = isRecord(raw.currencies) ? raw.currencies : {}
  migrated.currencies = { gold: nonNegativeGold(rawCurrencies.gold) ?? fresh.currencies.gold }

  const rawDiscoveredMonsters = Array.isArray(rawProgress.discoveredMonsters) ? rawProgress.discoveredMonsters : []
  migrated.progress.discoveredMonsters = [...new Set(rawDiscoveredMonsters.filter((id): id is GameState['progress']['discoveredMonsters'][number] => typeof id === 'string' && monsterIds.includes(id)))]
  const rawDiscoveredItems = Array.isArray(rawProgress.discoveredItems) ? rawProgress.discoveredItems : []
  migrated.progress.discoveredItems = [...new Set(rawDiscoveredItems.filter((id): id is ItemId => typeof id === 'string' && itemIds.includes(id)))]
}

const isSpellRankValue = (value: unknown): value is SpellRank => typeof value === 'number' && Number.isInteger(value) && value >= MIN_SPELL_RANK && value <= MAX_SPELL_RANK

/** Converts legacy unlock arrays and current rank evidence into one canonical map. */
const normalizeSpellProgression = (migrated: GameState, raw: Record<string, any>) => {
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const ranks: Partial<Record<SpellId, SpellRank>> = {}
  const rawRanks = isRecord(rawProgress.spellRanks) ? rawProgress.spellRanks : {}
  spellIds.forEach((id) => {
    const rank = rawRanks[id]
    if (isSpellRankValue(rank)) ranks[id as SpellId] = rank
  })
  const rawUnlockedSpells = Array.isArray(rawProgress.unlockedSpells) ? rawProgress.unlockedSpells : []
  rawUnlockedSpells.forEach((id) => {
    if (typeof id === 'string' && spellIds.includes(id)) ranks[id as SpellId] = Math.max(ranks[id as SpellId] ?? MIN_SPELL_RANK, MIN_SPELL_RANK) as SpellRank
  })
  migrated.progress.spellRanks = ranks
  syncAllSpellUnlocks(migrated)
  Object.keys(migrated.activities.autoCast).forEach((id) => {
    if (!isSpellRankValue(ranks[id as SpellId])) migrated.activities.autoCast[id as SpellId] = false
  })
}

const normalizeSpellPresets = (migrated: GameState, raw: Record<string, any>) => {
  migrated.spellPresets = normalizeSpellPresetState(raw.spellPresets, migrated.activities.autoCast)
}

const normalizeSchoolCap = (migrated: GameState, raw: Record<string, any>) => {
  const rawProgress = isRecord(raw.progress) ? raw.progress : {}
  const savedCap = nonNegativeNumber(rawProgress.magicLevelCap) ?? BALANCE.schoolProgression.startingCap
  const edrinDefeated = (migrated.progress.bossKillsByBoss['archmage-edrin-shade'] ?? 0) >= 1
  migrated.progress.magicLevelCap = Math.max(
    savedCap,
    BALANCE.schoolProgression.startingCap,
    ...(edrinDefeated ? [BALANCE.schoolProgression.tutorialCompleteCap] : []),
  )
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
  const legacyActiveEnemyId = typeof rawCombat.enemyId === 'string' && MONSTERS[rawCombat.enemyId as MonsterId] ? rawCombat.enemyId as MonsterId : null
  const legacyEnemyInstanceKey = sourceVersion === 21 && legacyActiveEnemyId ? 'enemy:1' : null
  const normalizeSource = (value: unknown, fallbackActor: 'player' | 'enemy'): CombatSource => {
    if (!isRecord(value)) return { actor: fallbackActor, kind: 'system', sourceId: 'save-migration' }
    const actor = value.actor === 'player' || value.actor === 'enemy' ? value.actor : fallbackActor
    const rawKind = String(value.kind)
    const kind = rawKind === 'special-attack' ? 'action' : ['basic-attack', 'spell', 'weapon', 'status', 'trait', 'action', 'equipment', 'system'].includes(rawKind) ? rawKind as CombatSource['kind'] : 'system'
    const school = ['fire', 'water', 'earth', 'air'].includes(String(value.school)) ? value.school as CombatSource['school'] : undefined
    const rawOriginKind = String(value.originSourceKind)
    const originSourceKind = ['basic-attack', 'spell', 'weapon', 'status', 'trait', 'action', 'equipment', 'system'].includes(rawOriginKind) ? rawOriginKind as CombatSource['kind'] : undefined
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
      const periodicEffects = normalizePersistedPeriodicEffects(entry.periodicEffects, statusId)
      const modifierOverrides = isRecord(entry.modifierOverrides) && hasValidStatusModifierOverrides(statusId, entry.modifierOverrides)
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
  const oldDelay = rawPlayerStatuses.filter((entry) => isRecord(entry) && (entry.id === 'attack-delay' || entry.statusId === 'attack-delay')).reduce((sum, entry) => sum + (nonNegativeNumber(entry.value) ?? 0), 0)
  migrated.combat.playerBarrier = Math.max(0, nonNegativeNumber(rawCombat.playerBarrier) ?? 0, oldBarrier)
  migrated.combat.enemyBarrier = Math.max(0, nonNegativeNumber(rawCombat.enemyBarrier) ?? fresh.combat.enemyBarrier)
  const rawPlayerBarrierRemaining = nonNegativeNumber(rawCombat.playerBarrierRemainingMs)
  migrated.combat.playerBarrierRemainingMs = migrated.combat.playerBarrier > 0 ? rawPlayerBarrierRemaining ?? oldBarrierRemaining ?? 9000 : null
  migrated.combat.enemyBarrierRemainingMs = migrated.combat.enemyBarrier > 0 ? nonNegativeNumber(rawCombat.enemyBarrierRemainingMs) ?? null : null
  migrated.combat.playerStatuses = normalizeStatuses(rawPlayerStatuses, 'player')
  migrated.combat.enemyStatuses = normalizeStatuses(rawCombat.enemyStatuses, 'enemy')
  migrated.combat.autoCastManaStarvedSpells = Array.isArray(rawCombat.autoCastManaStarvedSpells)
    ? rawCombat.autoCastManaStarvedSpells.filter((spellId): spellId is SpellId => typeof spellId === 'string' && Object.prototype.hasOwnProperty.call(SPELLS, spellId))
    : []
  const rawPlayerTimer = nonNegativeNumber(rawCombat.playerAttackTimerMs)

  const activeEnemyId = typeof migrated.combat.enemyId === 'string' && MONSTERS[migrated.combat.enemyId] ? migrated.combat.enemyId : null
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
    const rawCurrentActionId = typeof rawCombat.enemyCurrentActionId === 'string' ? rawCombat.enemyCurrentActionId : null
    const currentAction = rawCurrentActionId ? monster.actions[rawCurrentActionId] : undefined
    const rawCurrentStepId = typeof rawCombat.enemyCurrentStepId === 'string' ? rawCombat.enemyCurrentStepId : undefined
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

  if (monster) {
    const authoredPlayerDuration = boundedAuthoredActionTime(BALANCE.player.basicAttackIntervalMs)
    const savedPlayerDuration = nonNegativeNumber(rawCombat.playerAttackDurationMs)
    const savedPlayerTimer = rawPlayerTimer
    const playerRemainingRatio = savedPlayerDuration && savedPlayerDuration > 0 && savedPlayerTimer !== undefined
      ? Math.max(0, savedPlayerTimer / savedPlayerDuration)
      : 1
    migrated.combat.playerAttackDurationMs = authoredPlayerDuration
    migrated.combat.playerAttackTimerMs = sourceVersion >= 20
      ? boundedActionWork((savedPlayerTimer ?? authoredPlayerDuration) + oldDelay, authoredPlayerDuration)
      : boundedActionWork(authoredPlayerDuration * playerRemainingRatio + oldDelay, authoredPlayerDuration)
  } else {
    migrated.combat.playerAttackDurationMs = 0
    migrated.combat.playerAttackTimerMs = boundedActionWork((rawPlayerTimer ?? 0) + oldDelay, 0)
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
  migrated.combat.pendingBossId = pendingBossId === null ? null : validContentId(pendingBossId, monsterIds) ? pendingBossId as GameState['combat']['pendingBossId'] : fresh.combat.pendingBossId
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
    + Object.entries(migrated.activities.autoCast).filter(([, active]) => active).reduce((sum, [spellId]) => sum + (getSpellAutoCastFocusCost(migrated, spellId as SpellId) ?? 0), 0)
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
    + Object.entries(migrated.activities.autoCast).filter(([, active]) => active).reduce((sum, [spellId]) => sum + (getSpellAutoCastFocusCost(migrated, spellId as SpellId) ?? 0), 0)
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
  // Debug overrides are runtime-only. Legacy godMode is retained on the type
  // solely for old object compatibility, but must never survive hydration.
  migrated.debug = createInitialState().debug
  migrated.player.godMode = false
  migrated.progress.channeling = migrateChanneling(raw.progress, createInitialState().progress)
  migrated.ui.screen = normalizeScreen(isRecord(raw.ui) ? raw.ui.screen : undefined, migrated.ui.screen)
  normalizeDynamicRecords(migrated, raw)
  normalizeLegacyProgressEvidence(migrated.progress)
  normalizeSchoolCap(migrated, raw)
  normalizeSpellProgression(migrated, raw)
  normalizeSpellPresets(migrated, raw)
  normalizeCombatState(migrated, raw, sourceVersion)
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
  if (version === 12) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 13) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 14) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 15) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 16) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 17) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 18) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 19) return finalize(merge(createInitialState(), rawSave), rawSave, version)
  if (version === 20 || version === 21 || version === SAVE_VERSION) {
    return finalize(merge(createInitialState(), rawSave), rawSave, version)
  }
  throw new SaveMigrationError(`Unsupported save version: ${String(version ?? 'missing')}.`)
}
