import type { CombatLocationId, GameState, SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilStatId, SigilTier } from '../../types'
import { SIGIL_ATTUNEMENT_WEIGHT, SIGIL_CRAFT_QUALITY_WEIGHTS, SIGIL_QUALITY_WEIGHTS } from '../../content/sigils/sigilDropConfig'
import { getSigilRegionSetPool } from '../../content/sigils/sigilDropPools'
import { getSigilQualityDefinition } from '../../content/sigils/sigilQualities'
import { SIGIL_MAIN_STAT_POOLS, SIGIL_SECONDARY_STAT_IDS } from '../../content/sigils/sigilStats'
import { SIGIL_SET_IDS } from '../../content/sigils/sigilSets'
import { getSigilTierDefinition, resolveSigilTierFromEnemyPower } from '../../content/sigils/sigilTiers'
import { clampSigilRollQuality } from './sigilRuntime'
import { registerSigilInstanceDiscovery } from './sigilStateNormalization'
import { recordChronicleEvent } from '../chronicles/chronicleRuntime'

export interface SigilGenerationOptions {
  state: GameState
  locationId: CombatLocationId
  enemyId?: string
  enemyPower: number
  isBoss?: boolean
  rng: () => number
  forcedTier?: SigilTier
  forcedSetId?: SigilSetId
  forcedSlot?: SigilSlot
  qualityWeights?: Record<SigilQuality, number>
  forcedQuality?: SigilQuality
  forcedMainStatId?: SigilStatId
  source?: 'drop' | 'craft' | 'debug'
  persistGeneratedInstance?: boolean
}

const random01 = (rng: () => number) => clampSigilRollQuality(rng())
const pick = <T>(values: readonly T[], rng: () => number): T => values[Math.min(values.length - 1, Math.floor(random01(rng) * values.length))]
const weightedPick = <T>(values: readonly T[], weights: readonly number[], rng: () => number): T => {
  const safeWeights = weights.map((weight) => Number.isFinite(weight) && weight > 0 ? weight : 0)
  const total = safeWeights.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return pick(values, rng)
  let cursor = random01(rng) * total
  for (let index = 0; index < values.length; index += 1) { cursor -= safeWeights[index]; if (cursor < 0) return values[index] }
  return values[values.length - 1] as T
}

const rollQuality = (tier: SigilTier, isBoss: boolean, rng: () => number, override?: Record<SigilQuality, number>): SigilQuality => {
  const weights = override ?? SIGIL_QUALITY_WEIGHTS[`${tier}-${isBoss ? 'boss' : 'normal'}`] ?? SIGIL_QUALITY_WEIGHTS['1-normal']
  return weightedPick(Object.keys(weights) as SigilQuality[], Object.values(weights), rng)
}

export const generateSigil = ({ state, locationId, enemyPower, isBoss = false, rng, forcedTier, forcedSetId, forcedSlot, qualityWeights, forcedQuality, forcedMainStatId, source = 'drop', persistGeneratedInstance = true }: SigilGenerationOptions): SigilInstance => {
  const tier = forcedTier ?? resolveSigilTierFromEnemyPower(enemyPower)
  const pool = getSigilRegionSetPool(locationId)
  const weights = pool.map((setId) => setId === state.sigils.attunedSetId ? SIGIL_ATTUNEMENT_WEIGHT : 1)
  const setId = forcedSetId && (pool.includes(forcedSetId) || SIGIL_SET_IDS.includes(forcedSetId)) ? forcedSetId : weightedPick(pool, weights, rng)
  const slot = forcedSlot ?? (pick([1, 2, 3, 4, 5, 6] as const, rng) as SigilSlot)
  const quality = forcedQuality ?? rollQuality(tier, isBoss, rng, qualityWeights)
  const mainStatId = forcedMainStatId && SIGIL_MAIN_STAT_POOLS[slot].includes(forcedMainStatId) ? forcedMainStatId : pick(SIGIL_MAIN_STAT_POOLS[slot], rng)
  const count = getSigilQualityDefinition(quality).startingSecondaries
  const candidates = SIGIL_SECONDARY_STAT_IDS.filter((statId) => statId !== mainStatId)
  const secondaries = Array.from({ length: count }, () => {
    const index = Math.min(candidates.length - 1, Math.floor(random01(rng) * candidates.length))
    const [statId] = candidates.splice(index, 1)
    return { statId, rolls: [{ quality01: random01(rng), rank: 0 }] }
  })
  const instanceId = `sigil:${state.sigils.nextInstanceSequence}`
  state.sigils.nextInstanceSequence += 1
  const sigil: SigilInstance = { instanceId, tier, quality, setId, slot, rank: 0, mainStatId, secondaries, traitIds: [], rollHistory: [], locked: false }
  if (persistGeneratedInstance) state.sigils.storage[instanceId] = sigil
  if (source === 'drop') {
    state.sigils.lifetimeDrops += 1
    state.sigils.firstDropPityKills = 0
    state.sigils.highestSourcePowerDefeated = Math.max(state.sigils.highestSourcePowerDefeated, Number.isFinite(enemyPower) ? enemyPower : 0)
  }
  if (persistGeneratedInstance) registerSigilInstanceDiscovery(state.sigils, sigil)
  if (source === 'drop') recordChronicleEvent(state, 'first-sigil-earned')
  return sigil
}

export const generateCraftedSigil = (options: Omit<SigilGenerationOptions, 'enemyPower' | 'isBoss' | 'source'> & { tier: SigilTier; setId: SigilSetId; slot?: SigilSlot; rng: () => number; source?: 'craft' | 'debug' }): SigilInstance => generateSigil({ ...options, source: options.source ?? 'craft', enemyPower: getSigilTierDefinition(options.tier).minEnemyPower, forcedTier: options.tier, forcedSetId: options.setId, forcedSlot: options.slot, qualityWeights: SIGIL_CRAFT_QUALITY_WEIGHTS[options.tier] })
