import { COMBAT_LOCATIONS, getCombatEncounterMode, getCombatLocation, isCombatTargetForLocation, type CombatLocationId, type CombatTargetDifficulty } from '../../content/combat-locations'
import { DUNGEONS } from '../../content/combat-locations/dungeons/dungeons'
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
import type { EquipmentPosition, GameState, MonsterId, SchoolId, WorldTierId } from '../../types'
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
export const COMBAT_BENCHMARK_WORLD_TIERS = [1, 2, 3, 4, 5] as const satisfies readonly WorldTierId[]
export type CombatBenchmarkTierScope = 'all' | WorldTierId
export type CombatBenchmarkMode = 'target-farm' | 'dungeon-run' | 'isolated-boss-ttk'

export const getCombatBenchmarkWorldTiers = (scope: CombatBenchmarkTierScope): WorldTierId[] => scope === 'all' ? [...COMBAT_BENCHMARK_WORLD_TIERS] : [scope]
export const getCombatBenchmarkMode = (locationId: CombatLocationId, targetEnemyId?: MonsterId): CombatBenchmarkMode => {
  const location = getCombatLocation(locationId)
  if (location && getCombatEncounterMode(location) === 'sequence') return 'dungeon-run'
  if (targetEnemyId && isBossMonster(MONSTERS[targetEnemyId])) return 'isolated-boss-ttk'
  return 'target-farm'
}

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
  mode: 'target-farm' | 'isolated-boss-ttk'
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
  spellDamage: number
  guardianDamage: number
  dotDamage: number
  otherPlayerDamage: number
  guardianManaPerSecond: number
  guardianDamagePerMinute: number
  guardianDamageShare: number
  guardianSuppressedTimeMs: number
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

export interface CombatDungeonRunBenchmarkInput {
  sourceState: GameState
  locationId: CombatLocationId
  worldTier: WorldTierId
  maxDurationMs: number
  seed?: number
}

export interface CombatDungeonRunBenchmarkResult {
  mode: 'dungeon-run'
  locationId: CombatLocationId
  worldTier: WorldTierId
  seed: number
  sequence: MonsterId[]
  completed: boolean
  survived: boolean
  simulatedDurationMs: number
  runsPerHour: number
  failureReason: string | null
  kills: number
  deaths: number
  failures: number
  resonanceTotal: ResonanceState
  resonancePerHour: ResonanceState
  lifeEssence: number
  lifeEssencePerHour: number
  artifactEssence: number
  artifactEssencePerHour: number
  sigilDrops: number
  sigilsPerHour: number
  crystalCaches: number
  crystalCachesPerHour: number
  arcanePoints: number
  arcanePointsPerHour: number
  startingHealth: number
  endingHealth: number
  startingMana: number
  endingMana: number
  guardianDamage: number
  guardianActiveTimeMs: number
  guardianManaPerSecond: number
  guardianSuppressedTimeMs: number
  wardCountAtEnd: number
}

export interface CombatBossCycleBenchmarkInput extends Omit<CombatFarmingBenchmarkInput, 'durationMs'> { cycles: number }
export interface CombatBossCycleBenchmarkResult {
  mode: 'boss-cycle'
  locationId: CombatLocationId
  targetEnemyId: MonsterId
  bossId: MonsterId
  worldTier: WorldTierId
  cyclesRequested: number
  cyclesCompleted: number
  normalKillsBeforeBoss: number
  averageNormalKillsBeforeBoss: number
  cycleTimeMs: number
  averageBossCycleTimeMs: number
  bossesPerHour: number
  bossTtkMs: number | null
  resonancePerHour: ResonanceState
  lifeEssencePerHour: number
  artifactEssencePerHour: number
  sigilDropsPerHour: number
  expectedCrystalCachesPerHour: number
  arcanePointsPerHour: number
  damageTaken: number
  survived: boolean
  endingHealth: number
  endingMana: number
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
  const dungeon = location.id ? DUNGEONS[location.id] : undefined
  const mode = getCombatEncounterMode(location)
  if (mode === 'sequence') return []
  const orderedIds = mode === 'targeted'
    ? Object.entries(location.targetMetadata ?? {}).filter(([, metadata]) => metadata !== undefined).sort(([, left], [, right]) => (left?.order ?? Number.MAX_SAFE_INTEGER) - (right?.order ?? Number.MAX_SAFE_INTEGER)).map(([monsterId]) => monsterId as MonsterId)
    : []
  const normalTargets = orderedIds.filter((monsterId) => !isBossMonster(MONSTERS[monsterId]) && isCombatTargetForLocation(location, location.id ?? null, monsterId))
  const bossId = includeBoss && location.id ? DUNGEONS[location.id]?.boss : undefined
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
  mode: isBossMonster(MONSTERS[input.targetEnemyId]) ? 'isolated-boss-ttk' : 'target-farm',
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
  spellDamage: 0,
  guardianDamage: 0,
  dotDamage: 0,
  otherPlayerDamage: 0,
  guardianManaPerSecond: 0,
  guardianDamagePerMinute: 0,
  guardianDamageShare: 0,
  guardianSuppressedTimeMs: 0,
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
  spellDamage = 0
  guardianDamage = 0
  dotDamage = 0
  otherPlayerDamage = 0
  guardianSuppressedTimeMs = 0
  guardianActiveMs = 0
  sigilDrops = 0
  loot = new Map<string, number>()
  killsByMonster = new Map<MonsterId, number>()
  timeToDeathMs: number | null = null
  invalidReason: string | undefined
  private encounterStartedAtMs: number | null = null
  targetIsBoss = false
  sequenceMode = false
  bossCycleMode = false
  bossCycleNormalId: MonsterId | null = null
  bossCycleBossId: MonsterId | null = null
  bossCyclesCompleted = 0
  bossCycleNormalKills = 0
  bossCycleBossDurationsMs: number[] = []
  expectedSequence: MonsterId[] = []
  sequencePosition = 0

  beginRun = (_locationId: CombatLocationId) => undefined
  endRun = (_reason: 'leave' | 'defeat' | 'reset' | 'complete') => undefined
  beginEncounter = (_monsterId: MonsterId) => undefined
  endEncounter = (_reason: 'death' | 'despawn' | 'leave') => undefined
  resetMeasurement = () => undefined
  clear = () => undefined

  advance = (deltaMs: number, state: GameState) => {
    const elapsed = Math.max(0, deltaMs)
    this.simulatedTimeMs += elapsed
    if (state.combat.guardian.activeGuardianId) this.guardianActiveMs += elapsed
    else if (state.combat.guardian.suppressedForEncounter) this.guardianSuppressedTimeMs += elapsed
  }

  push = (event: CombatEvent) => this.consume(event)

  consume = (event: CombatEvent) => {
    if (event.sourceId === 'encounter-start') {
      if (!event.targetMonsterId) return
      if (this.bossCycleMode) {
        if (event.targetMonsterId !== this.bossCycleNormalId && event.targetMonsterId !== this.bossCycleBossId) this.invalidReason = `Boss cycle spawned unexpected target ${event.targetMonsterId}.`
        this.encounterStartedAtMs = this.simulatedTimeMs
        return
      }
      if (this.sequenceMode) {
        if (event.targetMonsterId !== this.expectedSequence[this.sequencePosition]) this.invalidReason = `Dungeon sequence expected ${this.expectedSequence[this.sequencePosition] ?? 'completion'}, received ${event.targetMonsterId}.`
        this.encounterStartedAtMs = this.simulatedTimeMs
        return
      }
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
      if (this.bossCycleMode) {
        if (event.targetMonsterId) this.killsByMonster.set(event.targetMonsterId, (this.killsByMonster.get(event.targetMonsterId) ?? 0) + 1)
        if (event.targetMonsterId === this.bossCycleBossId) {
          this.bossCyclesCompleted += 1
          if (this.encounterStartedAtMs !== null) this.bossCycleBossDurationsMs.push(Math.max(0, this.simulatedTimeMs - this.encounterStartedAtMs))
        } else if (event.targetMonsterId === this.bossCycleNormalId) this.bossCycleNormalKills += 1
        else this.invalidReason = `Boss cycle defeated unexpected target ${event.targetMonsterId ?? 'unknown'}.`
      this.kills += 1
        this.encounterStartedAtMs = null
        return
      }
      if (this.sequenceMode) {
        if (event.targetMonsterId !== this.expectedSequence[this.sequencePosition]) this.invalidReason = `Dungeon sequence defeated unexpected target ${event.targetMonsterId ?? 'unknown'}.`
        else {
          if (event.targetMonsterId) this.killsByMonster.set(event.targetMonsterId, (this.killsByMonster.get(event.targetMonsterId) ?? 0) + 1)
          this.kills += 1
          this.sequencePosition += 1
          if (this.encounterStartedAtMs !== null) this.killDurationsMs.push(Math.max(0, this.simulatedTimeMs - this.encounterStartedAtMs))
          this.encounterStartedAtMs = null
        }
        return
      }
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
      if (event.targetMonsterId) this.killsByMonster.set(event.targetMonsterId, (this.killsByMonster.get(event.targetMonsterId) ?? 0) + 1)
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
      const amount = Math.max(0, event.healthDamage ?? event.amount ?? 0)
      if (event.target === 'enemy' && event.source.kind === 'player') {
        this.damageDealt += amount
        if (event.sourceKind === 'guardian') this.guardianDamage += amount
        else if (event.sourceKind === 'status') this.dotDamage += amount
        else if (event.sourceKind === 'spell') this.spellDamage += amount
        else this.otherPlayerDamage += amount
      }
      if (event.target === 'player' && event.source.kind === 'enemy') this.damageTaken += amount
      if (event.target === 'player') this.barrierAbsorbed += Math.max(0, event.barrierAbsorbed ?? 0)
    }
    if (event.category === 'heal' && event.target === 'player') this.healingReceived += Math.max(0, event.effectiveAmount ?? event.amount ?? 0)
  }

  targetEnemyId: MonsterId = 'forest-wisp'
}

export const runCombatBossCycleBenchmark = (input: CombatBossCycleBenchmarkInput): CombatBossCycleBenchmarkResult | null => {
  const location = getCombatLocation(input.locationId)
  const dungeon = location?.id ? DUNGEONS[location.id] : undefined
  const cyclesRequested = Math.max(1, Math.min(20, Math.floor(input.cycles)))
  const bossId = dungeon?.boss
  if (!location || !dungeon || getCombatEncounterMode(location) !== 'targeted' || !bossId || isBossMonster(MONSTERS[input.targetEnemyId]) || !isCombatTargetForLocation(location, dungeon.id, input.targetEnemyId)) return null
  const maxDurationMs = COMBAT_BALANCE_BENCHMARK_MAX_DURATION_MS
  const state = normalizeBenchmarkClone(input.sourceState, { ...input, durationMs: maxDurationMs })
  state.progress.autoHuntBossUnlocked = true
  state.progress.autoHuntBossByLocation[dungeon.id] = true
  state.combat.targetEnemyId = input.targetEnemyId
  const collector = new BenchmarkCollector()
  collector.bossCycleMode = true
  collector.bossCycleNormalId = input.targetEnemyId
  collector.bossCycleBossId = bossId
  if (!spawnEnemy(state, input.targetEnemyId, collector)) return null
  const startingArcanePoints = state.arcaneCore.totalPointsEarned ?? 0
  while (collector.simulatedTimeMs < maxDurationMs && collector.bossCyclesCompleted < cyclesRequested && state.combat.active && !collector.invalidReason && collector.timeToDeathMs === null) {
    const step = COMBAT_BALANCE_BENCHMARK_STEP_MS
    advanceCombatState(state, step, { mode: 'banked', uiEvents: collector, telemetry: collector })
  }
  const elapsedMs = collector.simulatedTimeMs
  const hours = elapsedMs > 0 ? elapsedMs / 3_600_000 : 0
  const resonancePerHour = emptyRates()
  RESONANCE_TYPES.forEach((type) => { resonancePerHour[type] = hours > 0 ? collector.resonance[type] / hours : 0 })
  const bossDurations = collector.bossCycleBossDurationsMs
  const normalKills = collector.bossCycleNormalKills
  const completedCycles = collector.bossCyclesCompleted
  return {
    mode: 'boss-cycle', locationId: input.locationId, targetEnemyId: input.targetEnemyId, bossId, worldTier: input.worldTier,
    cyclesRequested, cyclesCompleted: completedCycles, normalKillsBeforeBoss: normalKills,
    averageNormalKillsBeforeBoss: completedCycles > 0 ? normalKills / completedCycles : 0,
    cycleTimeMs: elapsedMs, averageBossCycleTimeMs: completedCycles > 0 ? elapsedMs / completedCycles : 0,
    bossesPerHour: hours > 0 ? completedCycles / hours : 0,
    bossTtkMs: bossDurations.length ? bossDurations.reduce((sum, duration) => sum + duration, 0) / bossDurations.length : null,
    resonancePerHour,
    lifeEssencePerHour: hours > 0 ? (collector.loot.get('life-essence') ?? 0) / hours : 0,
    artifactEssencePerHour: hours > 0 ? (collector.loot.get('artifact-essence') ?? 0) / hours : 0,
    sigilDropsPerHour: hours > 0 ? collector.sigilDrops / hours : 0,
    expectedCrystalCachesPerHour: hours > 0 ? [...collector.killsByMonster].reduce((sum, [monsterId, kills]) => sum + kills * getCrystalCacheDropChance(state, monsterId, input.worldTier), 0) / hours : 0,
    arcanePointsPerHour: hours > 0 ? Math.max(0, (state.arcaneCore.totalPointsEarned ?? 0) - startingArcanePoints) / hours : 0,
    damageTaken: collector.damageTaken, survived: collector.timeToDeathMs === null, endingHealth: state.player.health, endingMana: state.player.mana,
  }
}

export const runCombatDungeonRunBenchmark = (input: CombatDungeonRunBenchmarkInput): CombatDungeonRunBenchmarkResult | null => {
  const location = getCombatLocation(input.locationId)
  const dungeon = location?.id ? DUNGEONS[location.id] : undefined
  if (!location || !dungeon || getCombatEncounterMode(location) !== 'sequence' || !dungeon.encounterSequence?.length) return null
  const sequence = [...dungeon.encounterSequence, ...(dungeon.boss ? [dungeon.boss] : [])]
  const durationMs = normalizeCombatFarmingBenchmarkDuration(input.maxDurationMs)
  const seed = getCombatFarmingBenchmarkSeed(sequence[0], input.worldTier, input.seed)
  const state = normalizeBenchmarkClone(input.sourceState, { ...input, targetEnemyId: sequence[0], durationMs })
  state.combat.sequenceIndex = 0
  const collector = new BenchmarkCollector()
  collector.sequenceMode = true
  collector.expectedSequence = sequence
  if (!spawnEnemy(state, sequence[0], collector)) return null
  const startingHealth = state.player.health
  const startingMana = state.player.mana
  const startingArcanePoints = state.arcaneCore.totalPointsEarned ?? 0
  let deaths = 0
  while (collector.simulatedTimeMs < durationMs && state.combat.active && !collector.invalidReason && collector.timeToDeathMs === null) {
    const step = Math.min(COMBAT_BALANCE_BENCHMARK_STEP_MS, durationMs - collector.simulatedTimeMs)
    advanceCombatState(state, step, { mode: 'banked', uiEvents: collector, telemetry: collector })
    if (collector.timeToDeathMs !== null) deaths += 1
  }
  const cacheCount = collector.loot.get('tier-1-crystal-cache') ?? 0
  const completed = !collector.invalidReason && !state.combat.active && collector.kills === sequence.length
  const hours = collector.simulatedTimeMs > 0 ? collector.simulatedTimeMs / 3_600_000 : 0
  const runsPerHour = completed && hours > 0 ? 1 / hours : 0
  const resonancePerHour = emptyRates()
  RESONANCE_TYPES.forEach((type) => { resonancePerHour[type] = collector.resonance[type] * runsPerHour })
  const lifeEssence = collector.loot.get('life-essence') ?? 0
  const artifactEssence = collector.loot.get('artifact-essence') ?? 0
  const arcanePoints = Math.max(0, (state.arcaneCore.totalPointsEarned ?? 0) - startingArcanePoints)
  return {
    mode: 'dungeon-run', locationId: input.locationId, worldTier: input.worldTier, seed, sequence,
    completed,
    survived: collector.timeToDeathMs === null,
    simulatedDurationMs: collector.simulatedTimeMs,
    runsPerHour,
    failureReason: collector.invalidReason ?? (collector.timeToDeathMs !== null ? 'Player defeated before the Dungeon ended.' : state.combat.active ? 'Run exceeded the selected time limit.' : null),
    kills: collector.kills, deaths, failures: completed ? 0 : 1, resonanceTotal: collector.resonance, resonancePerHour,
    lifeEssence, lifeEssencePerHour: lifeEssence * runsPerHour,
    artifactEssence, artifactEssencePerHour: artifactEssence * runsPerHour,
    sigilDrops: collector.sigilDrops, sigilsPerHour: collector.sigilDrops * runsPerHour,
    crystalCaches: cacheCount, crystalCachesPerHour: cacheCount * runsPerHour,
    arcanePoints, arcanePointsPerHour: arcanePoints * runsPerHour,
    startingHealth, endingHealth: state.player.health, startingMana, endingMana: state.player.mana,
    guardianDamage: collector.guardianDamage, guardianActiveTimeMs: collector.guardianActiveMs,
    guardianManaPerSecond: state.guardians.selectedGuardianId ? GUARDIANS[state.guardians.selectedGuardianId]?.manaPerSecond ?? 0 : 0,
    guardianSuppressedTimeMs: collector.guardianSuppressedTimeMs,
    wardCountAtEnd: state.combat.elementalDamageReductions.filter((ward) => ward.expiresAt === undefined || ward.expiresAt > state.combat.arcaneCoreRuntime.elapsedMs).length,
  }
}

const normalizeBenchmarkClone = (sourceState: GameState, input: CombatFarmingBenchmarkInput) => {
  const state = cloneState(sourceState)
  const freshState = createInitialState()
  state.combat = freshState.combat
  state.combat.active = true
  state.combat.locationId = getCombatLocation(input.locationId)?.id ?? null
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
  state.progress.autoHuntBossByLocation[state.combat.locationId ?? 'whispering-woods'] = false
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
  const dungeon = location?.id ? DUNGEONS[location.id] : undefined
  if (!location || !dungeon) return emptyResult(input, difficulty, durationMs, 'Location is not backed by a combat dungeon.')
  const targetIsBoss = isBossMonster(MONSTERS[input.targetEnemyId])
  const mode = getCombatBenchmarkMode(input.locationId, input.targetEnemyId)
  if (mode === 'dungeon-run') return emptyResult(input, difficulty, durationMs, 'Fixed-sequence locations require a full Dungeon Run benchmark.')
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
    mode,
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
    spellDamage: collector.spellDamage,
    guardianDamage: collector.guardianDamage,
    dotDamage: collector.dotDamage,
    otherPlayerDamage: collector.otherPlayerDamage,
    guardianManaPerSecond: collector.guardianActiveMs > 0 && state.guardians.selectedGuardianId ? (GUARDIANS[state.guardians.selectedGuardianId]?.manaPerSecond ?? 0) : 0,
    guardianDamagePerMinute: simulatedDurationMs > 0 ? collector.guardianDamage / (simulatedDurationMs / 60_000) : 0,
    guardianDamageShare: collector.damageDealt > 0 ? collector.guardianDamage / collector.damageDealt : 0,
    guardianSuppressedTimeMs: collector.guardianSuppressedTimeMs,
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
