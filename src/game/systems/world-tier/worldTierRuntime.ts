import { MONSTERS } from '../../content/monsters'
import { DEFAULT_ENEMY_DEFENSE } from '../../core/balance/combatStats'
import type { GameState, MonsterId } from '../../types'
import { normalizeResonanceState, multiplyResonanceBundle } from '../../content/resonance/resonance'
import { DEFAULT_WORLD_TIER_STATE, WORLD_TIER_IDS, WORLD_TIERS, WORLD_TIER_UNLOCK_BOSS_BY_TIER, type WorldTierDefinition, type WorldTierId, type WorldTierState } from '../../content/world-tier/worldTiers'

const finitePositive = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback
const finiteNonNegative = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback

export const isWorldTierId = (value: unknown): value is WorldTierId => WORLD_TIER_IDS.includes(value as WorldTierId)

export const sanitizeWorldTierState = (value: unknown): WorldTierState => {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const rawHighest = isWorldTierId(source.highestUnlocked) ? source.highestUnlocked : DEFAULT_WORLD_TIER_STATE.highestUnlocked
  const highestUnlocked = Math.max(1, rawHighest) as WorldTierId
  const rawCurrent = isWorldTierId(source.current) ? source.current : DEFAULT_WORLD_TIER_STATE.current
  return { current: rawCurrent <= highestUnlocked ? rawCurrent : highestUnlocked, highestUnlocked }
}

export const createInitialWorldTierState = (): WorldTierState => ({ ...DEFAULT_WORLD_TIER_STATE })
export const getWorldTierDefinition = (tier: unknown): WorldTierDefinition => WORLD_TIERS[isWorldTierId(tier) ? tier : 1]
export const isWorldTierUnlocked = (state: Pick<GameState, 'worldTier'>, tier: unknown): tier is WorldTierId => isWorldTierId(tier) && tier <= state.worldTier.highestUnlocked
export const getCurrentWorldTierDefinition = (state: Pick<GameState, 'worldTier'>) => getWorldTierDefinition(state.worldTier.current)

/** Resolves a successful authored material drop quantity for an encounter tier. */
export const resolveWorldTierLootQuantity = (baseQuantity: number, tier: WorldTierId): number => {
  const base = Number.isFinite(baseQuantity) ? Math.max(0, Math.floor(baseQuantity)) : 0
  return Math.max(0, Math.round(base * getWorldTierDefinition(tier).itemLootQuantityMultiplier))
}

export const unlockWorldTier = (state: Pick<GameState, 'worldTier'>, tier: WorldTierId): boolean => {
  if (!isWorldTierId(tier) || tier <= state.worldTier.highestUnlocked) return false
  state.worldTier.highestUnlocked = tier
  return true
}

export const resolveWorldTierUnlockFromBossKill = (bossId: MonsterId): WorldTierId | null => {
  const entry = (Object.entries(WORLD_TIER_UNLOCK_BOSS_BY_TIER) as Array<[string, MonsterId]>).find(([, mappedBossId]) => mappedBossId === bossId)
  return entry ? Number(entry[0]) as WorldTierId : null
}

export const unlockWorldTierFromBossKill = (state: Pick<GameState, 'worldTier'>, bossId: MonsterId): WorldTierId | null => {
  const tier = resolveWorldTierUnlockFromBossKill(bossId)
  return tier !== null && unlockWorldTier(state, tier) ? tier : null
}

/** Reconciles legal World Tier access from durable boss-kill evidence without emitting presentation events. */
export const reconcileWorldTierProgression = (state: Pick<GameState, 'worldTier' | 'progress'>): WorldTierState => {
  const highestFromEvidence = (Object.entries(WORLD_TIER_UNLOCK_BOSS_BY_TIER) as Array<[string, MonsterId]>)
    .filter(([, bossId]) => (state.progress.bossKillsByBoss[bossId] ?? 0) >= 1)
    .reduce<number>((highest, [tier]) => Math.max(highest, Number(tier)), 1) as WorldTierId
  state.worldTier.highestUnlocked = Math.max(state.worldTier.highestUnlocked, highestFromEvidence) as WorldTierId
  state.worldTier.current = Math.min(state.worldTier.current, state.worldTier.highestUnlocked) as WorldTierId
  return state.worldTier
}

export const setCurrentWorldTier = (state: Pick<GameState, 'worldTier'>, tier: WorldTierId): boolean => {
  if (!isWorldTierUnlocked(state, tier)) return false
  state.worldTier.current = tier
  return true
}

export interface ResolvedWorldTierEnemyProfile {
  enemyId: MonsterId
  worldTier: WorldTierId
  baseMaxHealth: number
  maxHealth: number
  baseBasicAttackDamage: number
  basicAttackDamage: number
  baseDefense: number
  defense: number
  damageMultiplier: number
  baseResonanceYield: ReturnType<typeof normalizeResonanceState>
  resonanceRewardMultiplier: number
  resonanceYield: ReturnType<typeof normalizeResonanceState>
}

export const resolveWorldTierEnemyProfile = (enemyId: MonsterId, tier: unknown = 1): ResolvedWorldTierEnemyProfile => {
  const monster = MONSTERS[enemyId]
  const definition = getWorldTierDefinition(tier)
  const baseMaxHealth = finiteNonNegative(monster?.maxHealth, 1)
  const baseBasicAttackDamage = finiteNonNegative(monster?.basicAttackDamage, 0)
  const baseDefense = finiteNonNegative(monster?.defense, DEFAULT_ENEMY_DEFENSE)
  const healthMultiplier = finitePositive(definition.enemyHealthMultiplier, 1)
  const damageMultiplier = finitePositive(definition.enemyDamageMultiplier, 1)
  const defenseMultiplier = finitePositive(definition.enemyDefenseMultiplier, 1)
  const resonanceRewardMultiplier = finitePositive(definition.resonanceRewardMultiplier, 1)
  const baseResonanceYield = normalizeResonanceState(monster?.resonanceYield)
  return {
    enemyId,
    worldTier: definition.id,
    baseMaxHealth,
    maxHealth: Math.max(1, Math.round(baseMaxHealth * healthMultiplier)),
    baseBasicAttackDamage,
    basicAttackDamage: Math.max(0, baseBasicAttackDamage * damageMultiplier),
    baseDefense,
    defense: Math.max(0, baseDefense * defenseMultiplier),
    damageMultiplier,
    baseResonanceYield,
    resonanceRewardMultiplier,
    resonanceYield: normalizeResonanceState(multiplyResonanceBundle(baseResonanceYield, resonanceRewardMultiplier)),
  }
}

export const getActiveEncounterWorldTier = (state: Pick<GameState, 'combat' | 'worldTier'>): WorldTierId => isWorldTierId(state.combat.enemyWorldTier) ? state.combat.enemyWorldTier : sanitizeWorldTierState(state.worldTier).current
export const getActiveEncounterWorldTierDefinition = (state: Pick<GameState, 'combat' | 'worldTier'>) => getWorldTierDefinition(getActiveEncounterWorldTier(state))
