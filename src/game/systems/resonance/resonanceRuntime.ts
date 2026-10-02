import { MONSTERS } from '../../content/monsters'
import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS } from '../../content/loot/universalLootTiers'
import { multiplyResonanceBundle, normalizeResonanceState, RESONANCE_TYPES, sanitizeResonanceAmount, type ResonanceState, type ResonanceType, type ResonanceYield } from '../../content/resonance/resonance'
import type { MonsterId, WorldTierId } from '../../types'
import { resolveCombatLootContext, roundLootQuantity, type CombatLootContext } from '../loot/universalLootRuntime'

export interface ResonanceRewardResolution {
  enemyId: MonsterId
  worldTier: WorldTierId
  effectivePower: number
  lootTier: number
  lootQuantityMultiplier: number
  bossQuantityMultiplier: number
  externalRewardMultiplier: number
  rewardMultiplier: number
  baseYield: ResonanceYield
  finalYield: ResonanceYield
}

export interface ResonanceRewardEventPayload extends ResonanceRewardResolution {
  grantedYield: ResonanceYield
}

export const createEmptyResonanceState = (): ResonanceState => Object.fromEntries(RESONANCE_TYPES.map((type) => [type, 0])) as ResonanceState

export const isResonanceType = (value: unknown): value is ResonanceType => typeof value === 'string' && (RESONANCE_TYPES as readonly string[]).includes(value)

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

export const canSpendResonanceBundle = (state: ResonanceState, bundle: ResonanceYield): boolean =>
  RESONANCE_TYPES.every((type) => sanitizeResonanceAmount(state[type]) >= sanitizeResonanceAmount(bundle[type]))

export const spendResonanceBundle = (state: ResonanceState, bundle: ResonanceYield): boolean => {
  if (!canSpendResonanceBundle(state, bundle)) return false
  RESONANCE_TYPES.forEach((type) => { state[type] = sanitizeResonanceAmount(state[type]) - sanitizeResonanceAmount(bundle[type]) })
  return true
}

export const grantResonanceBundleWithDelta = (state: ResonanceState, bundle: ResonanceYield): ResonanceState => {
  const granted = createEmptyResonanceState()
  RESONANCE_TYPES.forEach((type) => { granted[type] = grantResonance(state, type, bundle[type]) })
  return granted
}

export const aggregateResonanceBundle = (bundle: ResonanceYield, count: unknown): ResonanceYield => {
  const safeCount = sanitizeResonanceAmount(count)
  return multiplyResonanceBundle(bundle, safeCount)
}

export const resolveEnemyResonanceReward = (enemyId: MonsterId, worldTier: WorldTierId = 1, guildRewardMultiplier = 1, lootContext?: CombatLootContext): ResonanceRewardResolution => {
  const context = lootContext ?? resolveCombatLootContext(enemyId, worldTier)
  const baseYield = normalizeResonanceState(MONSTERS[enemyId]?.resonanceYield) as ResonanceYield
  const lootQuantityMultiplier = context.lootTier.quantityMultiplier
  const bossQuantityMultiplier = context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1
  const externalRewardMultiplier = Math.max(0, Number.isFinite(guildRewardMultiplier) ? guildRewardMultiplier : 1)
  const rewardMultiplier = lootQuantityMultiplier * bossQuantityMultiplier * externalRewardMultiplier
  const finalYield = Object.fromEntries(RESONANCE_TYPES.flatMap((type) => {
    const authored = sanitizeResonanceAmount(baseYield[type])
    return authored > 0 ? [[type, roundLootQuantity(authored * rewardMultiplier)]] : []
  })) as ResonanceYield
  return { enemyId, worldTier, effectivePower: context.effectivePower, lootTier: context.lootTier.tier, lootQuantityMultiplier, bossQuantityMultiplier, externalRewardMultiplier, rewardMultiplier, baseYield, finalYield }
}

export const grantEnemyResonanceReward = (state: ResonanceState, enemyId: MonsterId, worldTier: WorldTierId = 1, guildRewardMultiplier = 1, lootContext?: CombatLootContext): ResonanceRewardEventPayload => {
  const resolution = resolveEnemyResonanceReward(enemyId, worldTier, guildRewardMultiplier, lootContext)
  return { ...resolution, grantedYield: grantResonanceBundleWithDelta(state, resolution.finalYield) }
}

export { multiplyResonanceBundle, normalizeResonanceState, sanitizeResonanceAmount }
