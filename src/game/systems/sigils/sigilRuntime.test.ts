import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { SIGIL_TIERS, resolveSigilTierFromEnemyPower } from '../../content/sigils/sigilTiers'
import { getSigilQualityDefinition } from '../../content/sigils/sigilQualities'
import { getSigilSetBonusCount, getSigilSetBonuses } from '../../content/sigils/sigilSets'
import { generateSigil } from './sigilGeneration'
import { resolveSigilStatsForInstance } from './sigilRuntime'
import { enhanceSigil } from './sigilEnhancement'
import { salvageSigil } from './sigilSalvage'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { migrateSave } from '../../../persistence/migrations'

describe('Arcane Sigils', () => {
  it('resolves authored tiers from resolved enemy Power boundaries', () => {
    expect(resolveSigilTierFromEnemyPower(0)).toBe(1)
    expect(resolveSigilTierFromEnemyPower(4999)).toBe(1)
    expect(resolveSigilTierFromEnemyPower(5000)).toBe(2)
    expect(resolveSigilTierFromEnemyPower(999999)).toBe(2)
    expect(SIGIL_TIERS).toHaveLength(2)
  })

  it('derives stronger main and secondary values for T2', () => {
    const state = createInitialState()
    const t1 = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 1, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, rng: () => .5 })
    const t2 = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 5000, forcedTier: 2, forcedSetId: 'arcane', forcedSlot: 1, rng: () => .5 })
    expect(resolveSigilStatsForInstance(t2).spellPower).toBeGreaterThan(resolveSigilStatsForInstance(t1).spellPower ?? 0)
  })

  it('keeps quality caps and trait milestones authored', () => {
    expect(getSigilQualityDefinition('common')).toMatchObject({ maxRank: 10, startingSecondaries: 0, traitCount: 0 })
    expect(getSigilQualityDefinition('refined')).toMatchObject({ maxRank: 12, startingSecondaries: 1, traitCount: 0 })
    expect(getSigilQualityDefinition('perfect')).toMatchObject({ maxRank: 15, startingSecondaries: 2, traitCount: 1 })
    expect(getSigilQualityDefinition('legendary')).toMatchObject({ maxRank: 20, startingSecondaries: 3, traitCount: 2 })
  })

  it('counts repeated two-piece bonuses and only one four-piece bonus', () => {
    expect(getSigilSetBonusCount('precision', 2)).toBe(1)
    expect(getSigilSetBonusCount('precision', 4)).toBe(2)
    expect(getSigilSetBonusCount('precision', 6)).toBe(3)
    expect(getSigilSetBonusCount('tempest', 3)).toBe(0)
    expect(getSigilSetBonusCount('tempest', 6)).toBe(1)
    expect(getSigilSetBonuses({ precision: 4 }).critChance).toBeCloseTo(.15)
  })

  it('enhances with dust and records milestone rolls', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, qualityWeights: { common: 0, refined: 0, perfect: 0, legendary: 100 }, rng: () => .5 })
    state.sigils.dust = 100000
    const result = enhanceSigil(state, sigil.instanceId, { bypassGlobalCap: true, rng: () => .5 })
    expect(result.ok).toBe(true)
    expect(sigil.rank).toBe(1)
    for (let rank = 2; rank <= 15; rank += 1) enhanceSigil(state, sigil.instanceId, { bypassGlobalCap: true, rng: () => .5 })
    expect(sigil.traitIds).toHaveLength(1)
    expect(sigil.rollHistory.some((entry) => entry.kind === 'trait' && entry.rank === 15)).toBe(true)
  })

  it('protects locked and equipped sigils from salvage', () => {
    const state = createInitialState()
    const sigil = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, rng: () => .5 })
    sigil.locked = true
    expect(salvageSigil(state, sigil.instanceId)).toMatchObject({ ok: false })
    sigil.locked = false
    state.sigils.equipped[1] = sigil.instanceId
    expect(salvageSigil(state, sigil.instanceId)).toMatchObject({ ok: false })
  })

  it('forces the first drop on the fifth eligible kill and preserves discovery through auto-salvage', () => {
    const state = createInitialState()
    state.sigils.autoSalvage.refined = true
    for (let kill = 0; kill < 4; kill += 1) resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0.8)
    expect(state.sigils.lifetimeDrops).toBe(0)
    resolveMonsterLoot(state, 'forest-wisp', undefined, () => 0.8)
    expect(state.sigils.lifetimeDrops).toBe(1)
    expect(Object.keys(state.sigils.storage)).toHaveLength(0)
    expect(Object.keys(state.sigils.discovery.discoveredSets)).toHaveLength(1)
    expect(state.sigils.dust).toBeGreaterThan(0)
  })

  it('adds a safe default Sigil state to old saves and sanitizes malformed instances', () => {
    const state = migrateSave({ ...createInitialState(), saveVersion: 49, sigils: { storage: { bad: { instanceId: 'bad', setId: 'missing', slot: 9, tier: 99, quality: 'legendary', mainStatId: 'nope' } } } })
    expect(state.sigils.storage).toEqual({})
    expect(state.sigils.equipped).toEqual({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null })
    expect(state.saveVersion).toBe(50)
  })
})
