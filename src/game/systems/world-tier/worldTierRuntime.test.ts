import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { DEFAULT_WORLD_TIER_STATE, WORLD_TIERS } from '../../content/world-tier/worldTiers'
import { createInitialState } from '../../../store/initialState'
import { getActiveEncounterWorldTier, resolveWorldTierEnemyProfile, sanitizeWorldTierState, setCurrentWorldTier, unlockWorldTier } from './worldTierRuntime'

describe('World Tier runtime', () => {
  it('exposes the fixed authored WT1 and WT2 multipliers', () => {
    expect(WORLD_TIERS[1]).toMatchObject({ enemyHealthMultiplier: 1, enemyDamageMultiplier: 1, enemyDefenseMultiplier: 1, resonanceRewardMultiplier: 1 })
    expect(WORLD_TIERS[2]).toMatchObject({ enemyHealthMultiplier: 2, enemyDamageMultiplier: 1.4, enemyDefenseMultiplier: 1.25, resonanceRewardMultiplier: 2 })
  })

  it('sanitizes current tier against the highest unlocked tier', () => {
    expect(sanitizeWorldTierState(undefined)).toEqual(DEFAULT_WORLD_TIER_STATE)
    expect(sanitizeWorldTierState({ current: 2, highestUnlocked: 1 })).toEqual(DEFAULT_WORLD_TIER_STATE)
    expect(sanitizeWorldTierState({ current: 2, highestUnlocked: 2 })).toEqual({ current: 2, highestUnlocked: 2 })
    expect(sanitizeWorldTierState({ current: 99, highestUnlocked: 99 })).toEqual(DEFAULT_WORLD_TIER_STATE)
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

  it('uses the encounter snapshot over a changed global tier', () => {
    const state = createInitialState()
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.enemyWorldTier = 1
    expect(getActiveEncounterWorldTier(state)).toBe(1)
    state.combat.enemyWorldTier = null
    expect(getActiveEncounterWorldTier(state)).toBe(2)
  })
})
