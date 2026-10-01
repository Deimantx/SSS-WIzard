import type { CombatLocationId, MonsterId, SigilQuality, SigilSetId, SigilSlot, SigilStatId, SigilTier, WorldTierId } from '../../types'
import { createInitialState } from '../../../store/initialState'
import { generateSigil } from './sigilGeneration'
import { getSigilSalvageValue } from './sigilRuntime'

export interface SigilDropSimulationInput {
  locationId: CombatLocationId
  enemyId: MonsterId
  worldTier: WorldTierId
  attunedSetId: SigilSetId | null
  iterations: number
  seed?: number
}

export interface SigilDropSimulationResult {
  iterations: number
  sigilsFound: number
  byTier: Record<string, number>
  byQuality: Record<string, number>
  bySet: Record<string, number>
  bySlot: Record<string, number>
  byMainStat: Record<string, number>
  autoSalvageDustEstimate: number
}

const nextRandom = (seed: { value: number }) => {
  seed.value = (seed.value + 0x6D2B79F5) | 0
  let value = Math.imul(seed.value ^ seed.value >>> 15, 1 | seed.value)
  value ^= value + Math.imul(value ^ value >>> 7, 61 | value)
  return ((value ^ value >>> 14) >>> 0) / 4294967296
}

const bump = (record: Record<string, number>, key: string | number) => { record[String(key)] = (record[String(key)] ?? 0) + 1 }

/**
 * Runs the same authored generation rolls against an isolated fixture. Generated
 * instances are not retained; analysis cannot mutate discovery, chronicles,
 * dust, drop counters, or grow the fixture's storage during large simulations.
 */
export const simulateSigilDrops = (input: SigilDropSimulationInput): SigilDropSimulationResult => {
  const iterations = Math.max(0, Math.min(100_000, Math.floor(input.iterations)))
  const fixture = createInitialState()
  fixture.sigils.attunedSetId = input.attunedSetId
  const seed = { value: Math.floor(input.seed ?? 0x5EED) | 0 }
  const result: SigilDropSimulationResult = { iterations, sigilsFound: 0, byTier: {}, byQuality: {}, bySet: {}, bySlot: {}, byMainStat: {}, autoSalvageDustEstimate: 0 }
  const tier = (Math.min(2, Math.max(1, input.worldTier)) as SigilTier)
  for (let index = 0; index < iterations; index += 1) {
    const sigil = generateSigil({ state: fixture, locationId: input.locationId, enemyId: input.enemyId, enemyPower: 0, forcedTier: tier, source: 'debug', persistGeneratedInstance: false, rng: () => nextRandom(seed) })
    result.sigilsFound += 1
    bump(result.byTier, sigil.tier)
    bump(result.byQuality, sigil.quality)
    bump(result.bySet, sigil.setId)
    bump(result.bySlot, sigil.slot as SigilSlot)
    bump(result.byMainStat, sigil.mainStatId as SigilStatId)
    if (sigil.quality === 'common' || sigil.quality === 'refined') result.autoSalvageDustEstimate += getSigilSalvageValue(sigil)
  }
  return result
}
