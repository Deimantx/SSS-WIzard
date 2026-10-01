import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatFarmingBenchmarkBuildSummary, runCombatFarmingBenchmark, getCombatFarmingBenchmarkTargets, runCombatFarmingBenchmarkMatrix } from './combatFarmingBenchmark'
import type { GameState } from '../../types'

const makeFixture = () => {
  const state = createInitialState()
  state.schools.fire.level = 2
  state.progress.spellRanks['fire-bolt'] = 1
  state.player.mana = state.player.maxMana
  state.spellPresets.presets = [{ id: 'benchmark-fixture', name: 'Benchmark Fixture', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
  state.spellPresets.selectedPresetId = 'benchmark-fixture'
  return state
}

const snapshotGameplay = (state: GameState) => JSON.parse(JSON.stringify({ combat: state.combat, player: state.player, inventory: state.inventory, resonance: state.resonance, progress: state.progress, worldTier: state.worldTier, offlineBankMs: state.offlineBankMs, notifications: state.notifications }))

describe('combat farming benchmark', () => {
  beforeEach(() => {
    // Keep each fixture's clock and PRNG independent of any test-local mutation.
  })

  it('preserves the source state and build identity while normalizing debug overrides', () => {
    const state = makeFixture()
    state.debug.playerImmortal = true
    state.debug.infiniteMana = true
    state.debug.ignoreSpellCooldowns = true
    state.combat.threatCleared = 17
    state.worldTier.current = 1
    state.worldTier.highestUnlocked = 1
    state.equipment.weapon = 'ember-staff'
    const before = snapshotGameplay(state)

    const result = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'forest-wisp', worldTier: 2, durationMs: 5_000 })

    expect(result.valid, result.invalidReason).toBe(true)
    expect(result.startingHealth).toBe(state.player.maxHealth)
    expect(buildCombatFarmingBenchmarkBuildSummary(state)).toMatchObject({
      worldTier: 1,
      guardianId: null,
      equipment: expect.arrayContaining([expect.objectContaining({ slot: 'weapon', itemId: 'ember-staff' })]),
      equippedSpells: expect.arrayContaining([expect.stringContaining('Fire Bolt')]),
      spellPower: expect.any(Number),
      defense: expect.any(Number),
      critChance: expect.any(Number),
      cooldownRecovery: expect.any(Number),
      artifacts: [],
      sigils: [],
      crystals: [],
    })
    expect(state.worldTier).toEqual({ current: 1, highestUnlocked: 1 })
    expect(snapshotGameplay(state)).toEqual(before)
  })

  it('is deterministic and keeps the selected target instead of using the random pool', () => {
    const state = makeFixture()
    const input = { sourceState: state, locationId: 'whispering-woods' as const, targetEnemyId: 'cinder-moth' as const, worldTier: 1 as const, durationMs: 10_000 }
    const first = runCombatFarmingBenchmark(input)
    const second = runCombatFarmingBenchmark(input)

    expect(second).toEqual(first)
    expect(first.targetEnemyId).toBe('cinder-moth')
    expect(getCombatFarmingBenchmarkTargets('whispering-woods')).toEqual(['forest-wisp', 'thornling', 'dewbound-sprite', 'cinder-moth', 'stone-root', 'grove-sentinel', 'tempest-stag'])
  })

  it('includes the authored boss as a separate TTK target and rejects bosses from other locations', () => {
    const state = makeFixture()
    expect(getCombatFarmingBenchmarkTargets('whispering-woods')).not.toContain('forest-heart')
    const targetsWithBoss = getCombatFarmingBenchmarkTargets('whispering-woods', true)
    expect(targetsWithBoss[targetsWithBoss.length - 1]).toBe('forest-heart')
    const bossResult = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'forest-heart', worldTier: 1, durationMs: 5_000 })
    expect(bossResult.valid).toBe(true)
    expect(bossResult.difficulty).toBeNull()
    const wrongBoss = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'black-gatekeeper', worldTier: 1, durationMs: 5_000 })
    expect(wrongBoss.valid).toBe(false)
    expect(wrongBoss.invalidReason).toContain('Boss')
  })

  it('benchmarks fixed-Dungeon targets in authored sequence order', () => {
    const state = makeFixture()
    const targets = getCombatFarmingBenchmarkTargets('abandoned-catacombs', true)
    expect(targets.slice(0, 3)).toEqual(['restless-skeleton', 'grave-wraith', 'fallen-acolyte'])
    expect(targets[targets.length - 1]).toBe('archmage-edrin-shade')
    const result = runCombatFarmingBenchmark({ sourceState: state, locationId: 'abandoned-catacombs', targetEnemyId: 'restless-skeleton', worldTier: 1, durationMs: 5_000 })
    expect(result.valid, result.invalidReason).toBe(true)
  })

  it('uses the canonical WT2 reward multiplier per completed kill', () => {
    const state = makeFixture()
    state.player.maxMana = 10_000
    state.player.mana = 10_000
    state.player.baseMaxMana = 10_000
    state.player.maxHealth = 10_000
    state.player.health = 10_000
    state.player.baseMaxHealth = 10_000
    const wt1 = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'forest-wisp', worldTier: 1, durationMs: 120_000 })
    const wt2 = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'forest-wisp', worldTier: 2, durationMs: 120_000 })
    expect(wt1.kills).toBeGreaterThan(0)
    expect(wt2.kills).toBeGreaterThan(0)
    expect(wt1.resonanceTotal.air / wt1.kills).toBe(2)
    expect(wt2.resonanceTotal.air / wt2.kills).toBe(5)
    expect(wt1.lifeEssencePerHour).toBeGreaterThan(0)
    expect(wt1.artifactEssencePerHour).toBeGreaterThan(0)
    expect(wt1.sigilDropsPerHour).toBeGreaterThanOrEqual(0)
    expect(wt1.crystalCachesPerHour).toBeGreaterThanOrEqual(0)
    expect(wt1.arcanePointsPerHour).toBeGreaterThan(0)
    expect(wt2.arcanePointsPerHour).toBeGreaterThan(wt1.arcanePointsPerHour)
    expect(wt2.lifeEssencePerHour).toBeGreaterThan(wt1.lifeEssencePerHour)
    expect(wt2.artifactEssencePerHour).toBeGreaterThan(wt1.artifactEssencePerHour)
  })

  it('stops early when the cloned player dies', () => {
    const state = makeFixture()
    state.player.maxHealth = 1
    state.player.health = 1
    state.player.baseMaxHealth = 1
    const result = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'tempest-stag', worldTier: 2, durationMs: 60_000 })
    expect(result.survived).toBe(false)
    expect(result.timeToDeathMs, result.invalidReason).not.toBeNull()
    expect(result.simulatedDurationMs).toBeLessThan(result.requestedDurationMs)
  })

  it('runs a cancellable matrix without requiring a live game mutation', async () => {
    const state = makeFixture()
    const before = snapshotGameplay(state)
    const completed: ReturnType<typeof runCombatFarmingBenchmark>[] = []
    const matrix = await runCombatFarmingBenchmarkMatrix({ sourceState: state, locationId: 'whispering-woods', targetEnemyIds: ['forest-wisp', 'thornling', 'cinder-moth'], worldTiers: [1, 2], durationMs: 1_000 }, {
      onResult: (result) => completed.push(result),
      isCancelled: () => completed.length >= 2,
    })
    expect(matrix.cancelled).toBe(true)
    expect(completed).toHaveLength(2)
    expect(snapshotGameplay(state)).toEqual(before)
  })
})
