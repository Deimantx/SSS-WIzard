import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { DEFAULT_WORLD_TIER_STATE, WORLD_TIER_IDS, WORLD_TIERS, WORLD_TIER_REWARD_MULTIPLIER, WORLD_TIER_UNLOCK_BOSS_BY_TIER } from '../../content/world-tier/worldTiers'
import { createInitialState } from '../../../store/initialState'
import { getActiveEncounterWorldTier, reconcileWorldTierProgression, resolveWorldTierArcanePointReward, resolveWorldTierEnemyProfile, resolveWorldTierLootQuantity, resolveWorldTierUnlockFromBossKill, sanitizeWorldTierState, setCurrentWorldTier, unlockWorldTier, unlockWorldTierFromBossKill } from './worldTierRuntime'

describe('World Tier runtime', () => {
  it('exposes the fixed authored WT1 through WT5 multipliers', () => {
    expect(WORLD_TIER_IDS).toEqual([1, 2, 3, 4, 5])
    expect(WORLD_TIER_REWARD_MULTIPLIER).toEqual({ 1: 1, 2: 2.5, 3: 4, 4: 6.5, 5: 9 })
    WORLD_TIER_IDS.forEach((tier) => expect(WORLD_TIERS[tier]).toMatchObject({ resonanceRewardMultiplier: WORLD_TIER_REWARD_MULTIPLIER[tier], itemLootQuantityMultiplier: WORLD_TIER_REWARD_MULTIPLIER[tier], arcanePointRewardMultiplier: WORLD_TIER_REWARD_MULTIPLIER[tier], crystalCacheDropChanceMultiplier: WORLD_TIER_REWARD_MULTIPLIER[tier] }))
    expect(WORLD_TIERS[1]).toMatchObject({ enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, enemyDefenseMultiplier: 1, bossThreatRequirementMultiplier: 1 })
    expect(WORLD_TIERS[2]).toMatchObject({ enemyHealthMultiplier: 2, enemyDamageMultiplier: 1.4, enemyDefenseMultiplier: 1.25, bossThreatRequirementMultiplier: 2 })
    expect(WORLD_TIERS[3]).toMatchObject({ enemyHealthMultiplier: 3, enemyDamageMultiplier: 1.8, enemyDefenseMultiplier: 1.5, bossThreatRequirementMultiplier: 3 })
    expect(WORLD_TIERS[4]).toMatchObject({ enemyHealthMultiplier: 4, enemyDamageMultiplier: 2.2, enemyDefenseMultiplier: 1.75, bossThreatRequirementMultiplier: 4 })
    expect(WORLD_TIERS[5]).toMatchObject({ enemyHealthMultiplier: 5, enemyDamageMultiplier: 2.6, enemyDefenseMultiplier: 2, bossThreatRequirementMultiplier: 5 })
  })

  it('sanitizes current tier against the highest unlocked tier', () => {
    expect(sanitizeWorldTierState(undefined)).toEqual(DEFAULT_WORLD_TIER_STATE)
    expect(sanitizeWorldTierState({ current: 2, highestUnlocked: 1 })).toEqual(DEFAULT_WORLD_TIER_STATE)
    expect(sanitizeWorldTierState({ current: 2, highestUnlocked: 2 })).toEqual({ current: 2, highestUnlocked: 2 })
    expect(sanitizeWorldTierState({ current: 4, highestUnlocked: 4 })).toEqual({ current: 4, highestUnlocked: 4 })
    expect(sanitizeWorldTierState({ current: 5, highestUnlocked: 3 })).toEqual({ current: 3, highestUnlocked: 3 })
    expect(sanitizeWorldTierState({ current: 5, highestUnlocked: 5 })).toEqual({ current: 5, highestUnlocked: 5 })
    expect(sanitizeWorldTierState({ current: 99, highestUnlocked: 99 })).toEqual(DEFAULT_WORLD_TIER_STATE)
  })

  it('resolves material loot quantity from the canonical tier multiplier', () => {
    expect(resolveWorldTierLootQuantity(2, 1)).toBe(2)
    expect(resolveWorldTierLootQuantity(2, 2)).toBe(5)
    expect(resolveWorldTierLootQuantity(2, 5)).toBe(18)
    expect(resolveWorldTierLootQuantity(Number.NaN, 5)).toBe(0)
  })

  it('resolves Arcane Points from the encounter tier with minimum positive rounding', () => {
    expect(resolveWorldTierArcanePointReward(1, 1)).toBe(1)
    expect(resolveWorldTierArcanePointReward(1, 2)).toBe(3)
    expect(resolveWorldTierArcanePointReward(8, 5)).toBe(72)
    expect(resolveWorldTierArcanePointReward(0, 5)).toBe(0)
  })

  it('requires unlock before normal selection and does not mutate a profile', () => {
    const state = createInitialState()
    expect(setCurrentWorldTier(state, 2)).toBe(false)
    expect(unlockWorldTier(state, 2)).toBe(true)
    expect(setCurrentWorldTier(state, 2)).toBe(true)
    const forestWisp = MONSTERS['forest-wisp']!
    const before = JSON.stringify(forestWisp)
    const profile = resolveWorldTierEnemyProfile('forest-wisp', 2)
    expect(profile.maxHealth).toBe(forestWisp.maxHealth * 2)
    expect(profile.basicAttackDamage).toBe(forestWisp.basicAttackDamage * 1.4)
    expect(profile.defense).toBe((forestWisp.defense ?? 0) * 1.25)
    expect(JSON.stringify(forestWisp)).toBe(before)
  })

  it('maps canonical boss evidence to World Tier unlocks and notifies only on a new unlock', () => {
    const state = createInitialState()
    expect(WORLD_TIER_UNLOCK_BOSS_BY_TIER).toEqual({ 2: 'archmage-edrin-shade', 3: 'crossroads-keeper', 4: 'meridian-splitter', 5: 'black-gatekeeper' })
    expect(resolveWorldTierUnlockFromBossKill('crossroads-keeper')).toBe(3)
    expect(unlockWorldTierFromBossKill(state, 'crossroads-keeper')).toBe(3)
    expect(state.worldTier.highestUnlocked).toBe(3)
    expect(unlockWorldTierFromBossKill(state, 'crossroads-keeper')).toBeNull()
    expect(resolveWorldTierUnlockFromBossKill('forest-heart')).toBeNull()
  })

  it('reconciles World Tier from durable boss kills without lowering valid access', () => {
    const state = createInitialState()
    state.worldTier = { current: 3, highestUnlocked: 3 }
    state.progress.bossKillsByBoss['meridian-splitter'] = 1
    state.progress.bossKillsByBoss['black-gatekeeper'] = 1
    expect(reconcileWorldTierProgression(state)).toEqual({ current: 3, highestUnlocked: 5 })
    expect(reconcileWorldTierProgression(state)).toEqual({ current: 3, highestUnlocked: 5 })
  })

  it('uses the encounter snapshot over a changed global tier', () => {
    const state = createInitialState()
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.enemyWorldTier = 1
    expect(getActiveEncounterWorldTier(state)).toBe(1)
    state.combat.enemyWorldTier = null
    expect(getActiveEncounterWorldTier(state)).toBe(2)
  })
})
