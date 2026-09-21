import { MONSTERS } from '../../content/monsters'
import { RESONANCE_TYPES, type ResonanceState, type ResonanceType, type ResonanceYield } from '../../content/resonance/resonance'
import type { MonsterId } from '../../types'

export const PHASE_ONE_WORLD_TIER = 1
export const PHASE_ONE_RESONANCE_MULTIPLIER = 1

export interface ResonanceRewardResolution {
  enemyId: MonsterId
  worldTier: number
  rewardMultiplier: number
  baseYield: ResonanceYield
  finalYield: ResonanceYield
}

export const sanitizeResonanceAmount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)))
}

export const createEmptyResonanceState = (): ResonanceState => Object.fromEntries(RESONANCE_TYPES.map((type) => [type, 0])) as ResonanceState

export const isResonanceType = (value: unknown): value is ResonanceType => typeof value === 'string' && (RESONANCE_TYPES as readonly string[]).includes(value)

export const normalizeResonanceState = (value: unknown): ResonanceState => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  return Object.fromEntries(RESONANCE_TYPES.map((type) => [type, sanitizeResonanceAmount(source[type])])) as ResonanceState
}

const saturatingAdd = (current: unknown, amount: unknown) => {
  const left = sanitizeResonanceAmount(current)
  const right = sanitizeResonanceAmount(amount)
  return left >= Number.MAX_SAFE_INTEGER - right ? Number.MAX_SAFE_INTEGER : left + right
}

export const grantResonance = (state: ResonanceState, type: ResonanceType, amount: unknown): number => {
  const previous = sanitizeResonanceAmount(state[type])
  const next = saturatingAdd(state[type], amount)
  state[type] = next
  return next - previous
}

export const setResonance = (state: ResonanceState, type: ResonanceType, amount: unknown) => {
  state[type] = sanitizeResonanceAmount(amount)
  return state[type]
}

export const clearResonance = (state: ResonanceState, type: ResonanceType) => setResonance(state, type, 0)

export const clearAllResonance = (state: ResonanceState) => {
  RESONANCE_TYPES.forEach((type) => { state[type] = 0 })
  return state
}

export const grantResonanceBundle = (state: ResonanceState, bundle: ResonanceYield): ResonanceState => {
  RESONANCE_TYPES.forEach((type) => {
    const amount = sanitizeResonanceAmount(bundle[type])
    if (amount > 0) grantResonance(state, type, amount)
  })
  return state
}

export const grantResonanceBundleWithDelta = (state: ResonanceState, bundle: ResonanceYield): ResonanceState => {
  const granted = createEmptyResonanceState()
  RESONANCE_TYPES.forEach((type) => { granted[type] = grantResonance(state, type, bundle[type]) })
  return granted
}

export const multiplyResonanceBundle = (bundle: ResonanceYield, multiplier: unknown): ResonanceYield => {
  const safeMultiplier = typeof multiplier === 'number' && Number.isFinite(multiplier) ? Math.max(0, multiplier) : 0
  return Object.fromEntries(RESONANCE_TYPES.flatMap((type) => {
    const amount = sanitizeResonanceAmount(bundle[type])
    if (amount <= 0 || safeMultiplier <= 0) return []
    const product = amount > Number.MAX_SAFE_INTEGER / safeMultiplier ? Number.MAX_SAFE_INTEGER : amount * safeMultiplier
    return [[type, sanitizeResonanceAmount(product)]]
  })) as ResonanceYield
}

export const aggregateResonanceBundle = (bundle: ResonanceYield, count: unknown): ResonanceYield => {
  const safeCount = sanitizeResonanceAmount(count)
  return multiplyResonanceBundle(bundle, safeCount)
}

export const resolveEnemyResonanceReward = (enemyId: MonsterId): ResonanceRewardResolution => {
  const baseYield = normalizeResonanceState(MONSTERS[enemyId]?.resonanceYield) as ResonanceYield
  const finalYield = multiplyResonanceBundle(baseYield, PHASE_ONE_RESONANCE_MULTIPLIER)
  return { enemyId, worldTier: PHASE_ONE_WORLD_TIER, rewardMultiplier: PHASE_ONE_RESONANCE_MULTIPLIER, baseYield, finalYield }
}

export const grantEnemyResonanceReward = (state: ResonanceState, enemyId: MonsterId) => {
  const resolution = resolveEnemyResonanceReward(enemyId)
  return grantResonanceBundleWithDelta(state, resolution.finalYield)
}
