import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { DEFAULT_WORLD_TIER_STATE, WORLD_TIER_IDS, WORLD_TIERS, WORLD_TIER_UNLOCK_BOSS_BY_TIER } from '../../content/world-tier/worldTiers'
import { createInitialState } from '../../../store/initialState'
import { getActiveEncounterWorldTier, reconcileWorldTierProgression, resolveWorldTierEnemyProfile, resolveWorldTierUnlockFromBossKill, sanitizeWorldTierState, setCurrentWorldTier, unlockWorldTier, unlockWorldTierFromBossKill } from './worldTierRuntime'

describe('World Tier runtime', () => {
  it('authors WT1–WT5 only for encounter difficulty', () => {
    expect(WORLD_TIER_IDS).toEqual([1, 2, 3, 4, 5])
    expect(WORLD_TIERS[1]).toMatchObject({ enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, enemyDefenseMultiplier: 1, bossThreatRequirementMultiplier: 1 })
    expect(WORLD_TIERS[2]).toMatchObject({ enemyHealthMultiplier: 2, enemyDamageMultiplier: 1.4, enemyDefenseMultiplier: 1.25, bossThreatRequirementMultiplier: 2 })
    expect(WORLD_TIERS[3]).toMatchObject({ enemyHealthMultiplier: 3, enemyDamageMultiplier: 1.8, enemyDefenseMultiplier: 1.5, bossThreatRequirementMultiplier: 3 })
    expect(WORLD_TIERS[4]).toMatchObject({ enemyHealthMultiplier: 4, enemyDamageMultiplier: 2.2, enemyDefenseMultiplier: 1.75, bossThreatRequirementMultiplier: 4 })
    expect(WORLD_TIERS[5]).toMatchObject({ enemyHealthMultiplier: 5, enemyDamageMultiplier: 2.6, enemyDefenseMultiplier: 2, bossThreatRequirementMultiplier: 5 })
    for (const tier of WORLD_TIER_IDS) {
      expect(WORLD_TIERS[tier]).not.toHaveProperty(['resonance', 'RewardMultiplier'].join(''))
      expect(WORLD_TIERS[tier]).not.toHaveProperty(['itemLoot', 'QuantityMultiplier'].join(''))
      expect(WORLD_TIERS[tier]).not.toHaveProperty(['arcanePoint', 'RewardMultiplier'].join(''))
      expect(WORLD_TIERS[tier]).not.toHaveProperty(['crystalCacheDrop', 'ChanceMultiplier'].join(''))
    }
  })

  it('sanitizes current tier against the highest unlocked tier', () => {
    expect(sanitizeWorldTierState(undefined)).toEqual(DEFAULT_WORLD_TIER_STATE)
    expect(sanitizeWorldTierState({ current: 2, highestUnlocked: 1 })).toEqual(DEFAULT_WORLD_TIER_STATE)
    expect(sanitizeWorldTierState({ current: 5, highestUnlocked: 3 })).toEqual({ current: 3, highestUnlocked: 3 })
  })

  it('requires unlock before normal selection and does not mutate a profile', () => {
    const state = createInitialState()
    expect(setCurrentWorldTier(state, 2)).toBe(false)
    expect(unlockWorldTier(state, 2)).toBe(true)
    expect(setCurrentWorldTier(state, 2)).toBe(true)
    const monster = MONSTERS['forest-wisp']
    const before = JSON.stringify(monster)
    expect(resolveWorldTierEnemyProfile('forest-wisp', 2).maxHealth).toBe(monster.maxHealth * 2)
    expect(JSON.stringify(monster)).toBe(before)
  })

  it('maps boss evidence to World Tier unlocks', () => {
    const state = createInitialState()
    expect(WORLD_TIER_UNLOCK_BOSS_BY_TIER).toEqual({ 2: 'archmage-edrin-shade', 3: 'crossroads-keeper', 4: 'meridian-splitter', 5: 'black-gatekeeper' })
    expect(resolveWorldTierUnlockFromBossKill('crossroads-keeper')).toBe(3)
    expect(unlockWorldTierFromBossKill(state, 'crossroads-keeper')).toBe(3)
    expect(unlockWorldTierFromBossKill(state, 'crossroads-keeper')).toBeNull()
  })

  it('reconciles valid progression and preserves the active encounter tier snapshot', () => {
    const state = createInitialState()
    state.worldTier = { current: 3, highestUnlocked: 3 }
    state.progress.bossKillsByBoss['black-gatekeeper'] = 1
    expect(reconcileWorldTierProgression(state)).toEqual({ current: 3, highestUnlocked: 5 })
    state.combat.enemyWorldTier = 1
    expect(getActiveEncounterWorldTier(state)).toBe(1)
  })
})
