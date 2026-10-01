import { COMBAT_LOCATIONS, getCombatEncounterMode, getCombatLocation, isCombatTargetForLocation, type CombatLocationId, type CombatTargetDifficulty } from '../../content/world-navigation'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { ITEMS } from '../../content/items/items'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { GUARDIANS } from '../../content/guardians/guardians'
import { RESONANCE_TYPES, type ResonanceState } from '../../content/resonance/resonance'
import { COMBAT_RNG_DEFAULT_SEED } from '../../core/balance/combatRng'
import { createInitialState } from '../../../store/initialState'
import type { CombatEvent, CombatEventSink } from '../../systems/combat/combatTypes'
import { spawnEnemy } from '../../systems/combat/combatRuntime'
import { advanceCombatState } from '../../systems/simulation/advanceGameState'
import type { CombatTelemetryObserver } from '../../telemetry/combat/combatTelemetryTypes'
import type { DungeonId, EquipmentPosition, GameState, MonsterId, SchoolId, WorldTierId } from '../../types'
import { getSelectedSpellPreset } from '../../systems/spells'
import { createEmptyResonanceState } from '../../systems/resonance/resonanceRuntime'
import { getCrystalCacheDropChance } from '../../systems/crystals/crystalRuntime'
import { getPlayerCombatStats } from '../../systems/combat/combatStats'
import { SPELLS } from '../../content/spells/spells'
import { ARTIFACTS } from '../../content/artifacts/artifacts'
import { SIGIL_SETS } from '../../content/sigils/sigilSets'
import { getCrystalVariantName } from '../../content/crystals/crystals'

export const COMBAT_BALANCE_BENCHMARK_VERSION = 1
export const COMBAT_BALANCE_BENCHMARK_SEED = COMBAT_RNG_DEFAULT_SEED ^ 0x4B41424C
export const COMBAT_BALANCE_BENCHMARK_STEP_MS = 1_000
export const COMBAT_BALANCE_BENCHMARK_MAX_DURATION_MS = 60 * 60 * 1_000

export const COMBAT_BALANCE_BENCHMARK_DURATION_PRESETS = [
  { id: '1m', label: '1 MINUTE', durationMs: 60 * 1_000 },
  { id: '5m', label: '5 MINUTES', durationMs: 5 * 60 * 1_000 },
  { id: '15m', label: '15 MINUTES', durationMs: 15 * 60 * 1_000 },
  { id: '30m', label: '30 MINUTES', durationMs: 30 * 60 * 1_000 },
] as const

export interface CombatFarmingBenchmarkInput {
  sourceState: GameState
  locationId: CombatLocationId
  targetEnemyId: MonsterId
  worldTier: WorldTierId
  durationMs: number
  seed?: number
}

export interface CombatFarmingBenchmarkBuildEquipment {
  slot: EquipmentPosition
  itemId: GameState['equipment'][EquipmentPosition]
  name: string
}

export interface CombatFarmingBenchmarkBuildSummary {
  equipment: CombatFarmingBenchmarkBuildEquipment[]
  selectedSpellPresetId: string | null
  selectedSpellPresetName: string | null
  guardianId: GameState['guardians']['selectedGuardianId']
  guardianName: string | null
  spellPower: number
  defense: number
  critChance: number
  cooldownRecovery: number
  worldTier: WorldTierId
  equippedSpells: string[]
  artifacts: string[]
  sigils: string[]
  crystals: string[]
  maxHealth: number
  maxMana: number
  schoolLevels: Record<SchoolId, number>
  arcaneCorePoints: number
}

export interface CombatFarmingBenchmarkResult {
  seed: number
  locationId: CombatLocationId
  targetEnemyId: MonsterId
  worldTier: WorldTierId
  difficulty: CombatTargetDifficulty | null
  requestedDurationMs: number
  simulatedDurationMs: number
  valid: boolean
  invalidReason?: string
  survived: boolean
  timeToDeathMs: number | null
  kills: number
  averageKillTimeMs: number | null
  killsPerHour: number
  lifeEssencePerHour: number
  artifactEssencePerHour: number
  sigilDropsPerHour: number
  crystalCachesPerHour: number
  expectedCrystalCachesPerHour: number
  arcanePointsPerHour: number
  resonanceTotal: ResonanceState
  resonancePerHour: ResonanceState
  totalResonancePerHour: number
  startingHealth: number
  endingHealth: number
  minimumHealth: number
  startingMana: number
  endingMana: number
  minimumMana: number
  damageDealt: number
  damageTaken: number
  damageTakenPerSecond: number
  healingReceived: number
  barrierAbsorbed: number
}

export interface CombatFarmingBenchmarkMatrixInput {
  sourceState: GameState
  locationId: CombatLocationId
  targetEnemyIds: readonly MonsterId[]
  worldTiers: readonly WorldTierId[]
  durationMs: number
  seed?: number
}

export interface CombatFarmingBenchmarkMatrixProgress {
  completed: number
  total: number
}

export interface CombatFarmingBenchmarkMatrixResult {
  benchmarkVersion: number
  locationId: CombatLocationId
  requestedDurationMs: number
  targetEnemyIds: MonsterId[]
  worldTiers: WorldTierId[]
  results: CombatFarmingBenchmarkResult[]
  cancelled: boolean
}

export interface CombatFarmingBenchmarkMatrixOptions {
  isCancelled?: () => boolean
  onProgress?: (progress: CombatFarmingBenchmarkMatrixProgress) => void
  onResult?: (result: CombatFarmingBenchmarkResult) => void
  yieldBetweenJobs?: boolean
}

const SCHOOL_IDS = RESONANCE_TYPES satisfies readonly SchoolId[]
const EQUIPMENT_SLOTS: readonly EquipmentPosition[] = ['weapon', 'armor', 'head']

const cloneState = (sourceState: GameState): GameState => JSON.parse(JSON.stringify(sourceState)) as GameState

const hashSeed = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const getCombatFarmingBenchmarkSeed = (targetEnemyId: MonsterId, worldTier: WorldTierId, baseSeed = COMBAT_BALANCE_BENCHMARK_SEED) => hashSeed(`${baseSeed}:${targetEnemyId}:${worldTier}`)

export const normalizeCombatFarmingBenchmarkDuration = (durationMs: number) => Math.min(COMBAT_BALANCE_BENCHMARK_MAX_DURATION_MS, Math.max(COMBAT_BALANCE_BENCHMARK_STEP_MS, Math.round(Number.isFinite(durationMs) ? durationMs : 5 * 60 * 1_000)))

export const getCombatFarmingBenchmarkTargets = (locationId: CombatLocationId, includeBoss = false): MonsterId[] => {
  const location = getCombatLocation(locationId)
  if (!location) return []
  const dungeon = location.dungeonId ? DUNGEONS[location.dungeonId] : undefined
  const mode = getCombatEncounterMode(location)
  const orderedIds = mode === 'targeted'
    ? Object.entries(location.targetMetadata ?? {}).filter(([, metadata]) => metadata !== undefined).sort(([, left], [, right]) => (left?.order ?? Number.MAX_SAFE_INTEGER) - (right?.order ?? Number.MAX_SAFE_INTEGER)).map(([monsterId]) => monsterId as MonsterId)
    : mode === 'sequence' ? [...(dungeon?.encounterSequence ?? dungeon?.monsterPool ?? [])] : []
  const normalTargets = orderedIds.filter((monsterId) => !isBossMonster(MONSTERS[monsterId]) && (mode === 'sequence' ? Boolean(dungeon?.encounterSequence?.includes(monsterId)) : isCombatTargetForLocation(location, location.dungeonId ?? null, monsterId)))
  const bossId = includeBoss && location.dungeonId ? DUNGEONS[location.dungeonId]?.boss : undefined
  return bossId ? [...normalTargets, bossId] : normalTargets
}

export const getCombatFarmingBenchmarkDifficulty = (locationId: CombatLocationId, targetEnemyId: MonsterId): CombatTargetDifficulty | null => getCombatLocation(locationId)?.targetMetadata?.[targetEnemyId]?.difficulty ?? null

export const buildCombatFarmingBenchmarkBuildSummary = (state: GameState): CombatFarmingBenchmarkBuildSummary => {
  const selectedPreset = getSelectedSpellPreset(state)
  const guardianId = state.guardians.selectedGuardianId
  const combatStats = getPlayerCombatStats(state)
  return {
    equipment: EQUIPMENT_SLOTS.map((slot) => {
      const itemId = state.equipment[slot]
      return { slot, itemId, name: itemId ? ITEMS[itemId]?.name ?? itemId : 'Empty' }
    }),
    selectedSpellPresetId: selectedPreset?.id ?? null,
    selectedSpellPresetName: selectedPreset?.name ?? null,
    guardianId,
    guardianName: guardianId ? GUARDIANS[guardianId]?.name ?? guardianId : null,
    spellPower: combatStats.spellPower,
    defense: combatStats.defense,
    critChance: combatStats.critChance,
    cooldownRecovery: combatStats.cooldownRecovery,
    worldTier: state.worldTier.current,
    equippedSpells: (selectedPreset?.slots ?? []).flatMap((slot) => slot.spellId ? [`${SPELLS[slot.spellId]?.name ?? slot.spellId} R${state.progress.spellRanks[slot.spellId] ?? 0}${slot.autoCast ? ' (Auto)' : ''}`] : []),
    artifacts: Object.entries(state.artifactProgress).flatMap(([artifactId, progress]) => {
      const ranks = Object.values(progress.minorRanks).reduce<number>((sum, rank) => sum + (rank ?? 0), 0)
      const definition = ARTIFACTS[artifactId as keyof typeof ARTIFACTS]
      return ranks > 0 ? [`${definition ? ITEMS[definition.itemId]?.name ?? artifactId : artifactId} R${ranks}`] : []
    }),
    sigils: Object.entries(state.sigils.equipped).flatMap(([slot, instanceId]) => {
      const sigil = instanceId ? state.sigils.storage[instanceId] : undefined
      return sigil ? [`${slot}: ${SIGIL_SETS[sigil.setId]?.name ?? sigil.setId} T${sigil.tier} ${sigil.quality}`] : []
    }),
    crystals: state.crystals.equippedSlots.flatMap((variantId) => variantId ? [getCrystalVariantName(variantId)] : []),
    maxHealth: state.player.maxHealth,
    maxMana: state.player.maxMana,
    schoolLevels: Object.fromEntries(SCHOOL_IDS.map((schoolId) => [schoolId, state.schools[schoolId].level])) as Record<SchoolId, number>,
    arcaneCorePoints: state.arcaneCore.totalPointsEarned ?? 0,
  }
}

const emptyRates = (): ResonanceState => createEmptyResonanceState()

const emptyResult = (input: CombatFarmingBenchmarkInput, difficulty: CombatTargetDifficulty | null, requestedDurationMs: number, invalidReason?: string): CombatFarmingBenchmarkResult => ({
  seed: getCombatFarmingBenchmarkSeed(input.targetEnemyId, input.worldTier, input.seed),
  locationId: input.locationId,
  targetEnemyId: input.targetEnemyId,
  worldTier: input.worldTier,
  difficulty,
  requestedDurationMs,
  simulatedDurationMs: 0,
  valid: !invalidReason,
  invalidReason,
  survived: false,
  timeToDeathMs: null,
  kills: 0,
  averageKillTimeMs: null,
  killsPerHour: 0,
  lifeEssencePerHour: 0,
  artifactEssencePerHour: 0,
  sigilDropsPerHour: 0,
  crystalCachesPerHour: 0,
  expectedCrystalCachesPerHour: 0,
  arcanePointsPerHour: 0,
  resonanceTotal: emptyRates(),
  resonancePerHour: emptyRates(),
  totalResonancePerHour: 0,
  startingHealth: 0,
  endingHealth: 0,
  minimumHealth: 0,
  startingMana: 0,
  endingMana: 0,
  minimumMana: 0,
  damageDealt: 0,
  damageTaken: 0,
  damageTakenPerSecond: 0,
  healingReceived: 0,
  barrierAbsorbed: 0,
})

class BenchmarkCollector implements CombatEventSink, CombatTelemetryObserver {
  simulatedTimeMs = 0
  kills = 0
  killDurationsMs: number[] = []
  resonance = emptyRates()
  damageDealt = 0
  damageTaken = 0
  healingReceived = 0
  barrierAbsorbed = 0
  sigilDrops = 0
  loot = new Map<string, number>()
  timeToDeathMs: number | null = null
  invalidReason: string | undefined
  private encounterStartedAtMs: number | null = null
  targetIsBoss = false

  beginRun = (_dungeonId: DungeonId) => undefined
  endRun = (_reason: 'leave' | 'defeat' | 'reset' | 'complete') => undefined
  beginEncounter = (_monsterId: MonsterId) => undefined
  endEncounter = (_reason: 'death' | 'despawn' | 'leave') => undefined
  resetMeasurement = () => undefined
  clear = () => undefined

  advance = (deltaMs: number) => { this.simulatedTimeMs += Math.max(0, deltaMs) }

  push = (event: CombatEvent) => this.consume(event)

  consume = (event: CombatEvent) => {
    if (event.sourceId === 'encounter-start') {
      if (!event.targetMonsterId) return
      const monster = MONSTERS[event.targetMonsterId]
      if (!monster || isBossMonster(monster) !== this.targetIsBoss) {
        this.invalidReason = 'Encounter role does not match the selected target role.'
        return
      }
      if (event.targetMonsterId !== this.targetEnemyId) {
        this.invalidReason = `Unexpected target encounter: ${event.targetMonsterId}.`
        return
      }
      this.encounterStartedAtMs = this.simulatedTimeMs
      return
    }

    if (event.sourceId === 'enemy-defeated') {
      const monster = event.targetMonsterId ? MONSTERS[event.targetMonsterId] : undefined
      if (!monster || isBossMonster(monster) !== this.targetIsBoss) {
        this.invalidReason = 'Defeated target role does not match the selected target role.'
        return
      }
      if (event.targetMonsterId !== this.targetEnemyId) {
        this.invalidReason = `Unexpected target defeat: ${event.targetMonsterId}.`
        return
      }
      this.kills += 1
      if (this.encounterStartedAtMs !== null) this.killDurationsMs.push(Math.max(0, this.simulatedTimeMs - this.encounterStartedAtMs))
      this.encounterStartedAtMs = null
      return
    }

    if (event.category === 'loot' && event.itemId) this.loot.set(event.itemId, (this.loot.get(event.itemId) ?? 0) + Math.max(0, event.amount ?? 0))
    if (event.category === 'sigil-loot') this.sigilDrops += 1

    if (event.sourceId === 'player-defeated') {
      this.timeToDeathMs = this.simulatedTimeMs
      return
    }

    if (event.sourceId === 'resonance-reward' && event.resonanceReward) {
      RESONANCE_TYPES.forEach((type) => { this.resonance[type] += Math.max(0, event.resonanceReward?.grantedYield[type] ?? 0) })
    }

    if (event.category === 'damage' || event.healthDamage !== undefined || event.barrierAbsorbed !== undefined) {
      const amount = Math.max(0, event.amount ?? event.healthDamage ?? 0)
      if (event.target === 'enemy' && event.source.kind === 'player') this.damageDealt += amount
      if (event.target === 'player' && event.source.kind === 'enemy') this.damageTaken += amount
      if (event.target === 'player') this.barrierAbsorbed += Math.max(0, event.barrierAbsorbed ?? 0)
    }
    if (event.category === 'heal' && event.target === 'player') this.healingReceived += Math.max(0, event.effectiveAmount ?? event.amount ?? 0)
  }

  targetEnemyId: MonsterId = 'forest-wisp'
}

const normalizeBenchmarkClone = (sourceState: GameState, input: CombatFarmingBenchmarkInput) => {
  const state = cloneState(sourceState)
  const freshState = createInitialState()
  state.combat = freshState.combat
  state.combat.active = true
  state.combat.dungeonId = getCombatLocation(input.locationId)?.dungeonId ?? null
  state.combat.targetEnemyId = input.targetEnemyId
  state.combat.pendingBossId = null
  state.combat.threatCleared = 0
  state.combat.inBossFight = false
  state.worldTier.current = input.worldTier
  state.player.health = state.player.maxHealth
  state.player.mana = state.player.maxMana
  state.player.healthRegenTimerMs = freshState.player.healthRegenTimerMs
  state.resonance = createEmptyResonanceState()
  state.offlineBankMs = 0
  state.progress.autoHuntBossByDungeon[state.combat.dungeonId ?? 'whispering-woods'] = false
  state.debug.playerImmortal = false
  state.debug.enemyImmortal = false
  state.debug.infiniteMana = false
  state.debug.ignoreSpellCooldowns = false
  state.debug.disableAutoCast = false
  state.debug.freezePlayerActions = false
  state.debug.freezeEnemyActions = false
  state.debug.combatPaused = false
  state.debug.combatTimeScale = 1
  state.debug.arcaneCoreFreeCosts = false
  state.debug.arcaneCoreIgnorePrerequisites = false
  state.combat.combatRngState = getCombatFarmingBenchmarkSeed(input.targetEnemyId, input.worldTier, input.seed)
  return state
}

export const runCombatFarmingBenchmark = (input: CombatFarmingBenchmarkInput): CombatFarmingBenchmarkResult => {
  const durationMs = normalizeCombatFarmingBenchmarkDuration(input.durationMs)
  const location = getCombatLocation(input.locationId)
  const difficulty = getCombatFarmingBenchmarkDifficulty(input.locationId, input.targetEnemyId)
  const dungeon = location?.dungeonId ? DUNGEONS[location.dungeonId] : undefined
  if (!location || !dungeon) return emptyResult(input, difficulty, durationMs, 'Location is not backed by a combat dungeon.')
  const targetIsBoss = isBossMonster(MONSTERS[input.targetEnemyId])
  if (targetIsBoss && dungeon.boss !== input.targetEnemyId) return emptyResult(input, difficulty, durationMs, 'Boss target is not authored for this location.')
  const sequenceTarget = getCombatEncounterMode(location) === 'sequence' && Boolean(dungeon.encounterSequence?.includes(input.targetEnemyId))
  if (!targetIsBoss && !isCombatTargetForLocation(location, dungeon.id, input.targetEnemyId) && !sequenceTarget) return emptyResult(input, difficulty, durationMs, 'Target is not a valid combat target for this location.')

  const seed = getCombatFarmingBenchmarkSeed(input.targetEnemyId, input.worldTier, input.seed)
  const state = normalizeBenchmarkClone(input.sourceState, input)
  const collector = new BenchmarkCollector()
  collector.targetEnemyId = input.targetEnemyId
  collector.targetIsBoss = targetIsBoss
  if (!spawnEnemy(state, input.targetEnemyId, collector)) return emptyResult(input, difficulty, durationMs, 'The selected Spell Preset could not activate for the benchmark.')

  const startingHealth = state.player.health
  const startingMana = state.player.mana
  const startingArcanePoints = state.arcaneCore.totalPointsEarned ?? 0
  let minimumHealth = startingHealth
  let minimumMana = startingMana
  while (collector.simulatedTimeMs < durationMs && state.combat.active && !collector.invalidReason && collector.timeToDeathMs === null) {
    const step = Math.min(COMBAT_BALANCE_BENCHMARK_STEP_MS, durationMs - collector.simulatedTimeMs)
    advanceCombatState(state, step, { mode: 'banked', uiEvents: collector, telemetry: collector })
    minimumHealth = Math.min(minimumHealth, state.player.health)
    minimumMana = Math.min(minimumMana, state.player.mana)
  }

  const simulatedDurationMs = collector.simulatedTimeMs
  const hours = simulatedDurationMs > 0 ? simulatedDurationMs / (60 * 60 * 1_000) : 0
  const resonancePerHour = emptyRates()
  RESONANCE_TYPES.forEach((type) => { resonancePerHour[type] = hours > 0 ? collector.resonance[type] / hours : 0 })
  const totalResonancePerHour = RESONANCE_TYPES.reduce((total, type) => total + resonancePerHour[type], 0)
  const invalidReason = collector.invalidReason
  return {
    seed,
    locationId: input.locationId,
    targetEnemyId: input.targetEnemyId,
    worldTier: input.worldTier,
    difficulty,
    requestedDurationMs: durationMs,
    simulatedDurationMs,
    valid: !invalidReason,
    ...(invalidReason ? { invalidReason } : {}),
    survived: !invalidReason && collector.timeToDeathMs === null && simulatedDurationMs >= durationMs,
    timeToDeathMs: collector.timeToDeathMs,
    kills: collector.kills,
    averageKillTimeMs: collector.killDurationsMs.length ? collector.killDurationsMs.reduce((total, value) => total + value, 0) / collector.killDurationsMs.length : null,
    killsPerHour: hours > 0 ? collector.kills / hours : 0,
    lifeEssencePerHour: hours > 0 ? (collector.loot.get('life-essence') ?? 0) / hours : 0,
    artifactEssencePerHour: hours > 0 ? (collector.loot.get('artifact-essence') ?? 0) / hours : 0,
    sigilDropsPerHour: hours > 0 ? collector.sigilDrops / hours : 0,
    crystalCachesPerHour: hours > 0 ? (collector.loot.get('tier-1-crystal-cache') ?? 0) / hours : 0,
    expectedCrystalCachesPerHour: hours > 0 ? (collector.kills / hours) * getCrystalCacheDropChance(state, input.targetEnemyId, input.worldTier) : 0,
    arcanePointsPerHour: hours > 0 ? Math.max(0, (state.arcaneCore.totalPointsEarned ?? 0) - startingArcanePoints) / hours : 0,
    resonanceTotal: collector.resonance,
    resonancePerHour,
    totalResonancePerHour,
    startingHealth,
    endingHealth: state.player.health,
    minimumHealth,
    startingMana,
    endingMana: state.player.mana,
    minimumMana,
    damageDealt: collector.damageDealt,
    damageTaken: collector.damageTaken,
    damageTakenPerSecond: simulatedDurationMs > 0 ? collector.damageTaken / (simulatedDurationMs / 1_000) : 0,
    healingReceived: collector.healingReceived,
    barrierAbsorbed: collector.barrierAbsorbed,
  }
}

export const runCombatFarmingBenchmarkMatrix = async (input: CombatFarmingBenchmarkMatrixInput, options: CombatFarmingBenchmarkMatrixOptions = {}): Promise<CombatFarmingBenchmarkMatrixResult> => {
  const targetEnemyIds = [...input.targetEnemyIds]
  const worldTiers = [...input.worldTiers]
  const jobs = targetEnemyIds.flatMap((targetEnemyId) => worldTiers.map((worldTier) => ({ targetEnemyId, worldTier })))
  const results: CombatFarmingBenchmarkResult[] = []
  options.onProgress?.({ completed: 0, total: jobs.length })
  for (let index = 0; index < jobs.length; index += 1) {
    if (options.isCancelled?.()) break
    const job = jobs[index]
    const result = runCombatFarmingBenchmark({ ...input, ...job })
    results.push(result)
    options.onResult?.(result)
    options.onProgress?.({ completed: index + 1, total: jobs.length })
    if (options.yieldBetweenJobs !== false && index + 1 < jobs.length) await new Promise<void>((resolve) => setTimeout(resolve, 0))
  }
  return { benchmarkVersion: COMBAT_BALANCE_BENCHMARK_VERSION, locationId: input.locationId, requestedDurationMs: normalizeCombatFarmingBenchmarkDuration(input.durationMs), targetEnemyIds, worldTiers, results, cancelled: results.length < jobs.length }
}

export const WHISPERING_WOODS_BENCHMARK_TARGETS = getCombatFarmingBenchmarkTargets('whispering-woods')
export const WHISPERING_WOODS_BENCHMARK_LOCATION = COMBAT_LOCATIONS['whispering-woods']
