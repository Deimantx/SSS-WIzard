import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatFarmingBenchmarkBuildSummary, runCombatFarmingBenchmark, getCombatFarmingBenchmarkTargets, runCombatFarmingBenchmarkMatrix, getCombatBenchmarkMode, getCombatBenchmarkWorldTiers, runCombatDungeonRunBenchmark, runCombatBossCycleBenchmark } from './combatFarmingBenchmark'
import type { GameState } from '../../types'
import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'
import { resolveEnemyResonanceReward } from '../../systems/resonance/resonanceRuntime'

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

  it('exposes ALL WT and each individual World Tier', () => {
    expect(getCombatBenchmarkWorldTiers('all')).toEqual([1, 2, 3, 4, 5])
    expect(getCombatBenchmarkWorldTiers(3)).toEqual([3])
    expect(getCombatBenchmarkWorldTiers(4)).toEqual([4])
    expect(getCombatBenchmarkWorldTiers(5)).toEqual([5])
  })

  it('selects target farm, full sequence, and isolated boss TTK semantics by content', () => {
    expect(getCombatBenchmarkMode('whispering-woods', 'forest-wisp')).toBe('target-farm')
    expect(getCombatBenchmarkMode('abandoned-catacombs')).toBe('dungeon-run')
    expect(getCombatBenchmarkMode('whispering-woods', 'forest-heart')).toBe('isolated-boss-ttk')
    expect(getCombatFarmingBenchmarkTargets('abandoned-catacombs', true)).toEqual([])
    expect(runCombatFarmingBenchmark({ sourceState: makeFixture(), locationId: 'abandoned-catacombs', targetEnemyId: 'restless-skeleton', worldTier: 1, durationMs: 5_000 }).invalidReason).toContain('full Dungeon Run')
  })

  it.each(['abandoned-catacombs', 'broken-meridian', 'black-gate'] as const)('simulates the full %s sequence through its boss and aggregates run rewards', (locationId) => {
    const state = makeFixture()
    state.schools.fire.level = 100
    state.progress.spellRanks['fire-bolt'] = 1
    state.debug.playerStats.spellPowerFlat = 1_000_000
    state.debug.playerStats.maxHealthFlat = 100_000
    state.debug.playerStats.maxManaFlat = 100_000
    state.debug.playerStats.manaRegenFlat = 10_000
    state.debug.playerStats.modifiers['damage-taken-percent'] = -0.95
    state.player.maxMana = state.player.baseMaxMana = 100_000
    state.player.mana = 100_000
    state.player.maxHealth = state.player.baseMaxHealth = 100_000
    state.player.health = 100_000
    expect(getCombatBenchmarkMode(locationId)).toBe('dungeon-run')
    const result = runCombatDungeonRunBenchmark({ sourceState: state, locationId, worldTier: 1, maxDurationMs: 60 * 1_000 })
    expect(COMBAT_LOCATIONS[locationId].encounterSequence?.length).toBeGreaterThan(0)
    expect(result).not.toBeNull()
    expect(result?.sequence[result.sequence.length - 1]).toBeDefined()
    expect(result?.completed).toBe(true)
    expect(result?.kills).toBe(result?.sequence.length)
    expect(result?.simulatedDurationMs).toBeGreaterThan(0)
    expect((result?.resonanceTotal.fire ?? 0) + (result?.resonanceTotal.water ?? 0) + (result?.resonanceTotal.earth ?? 0) + (result?.resonanceTotal.air ?? 0)).toBeGreaterThan(0)
    expect(result?.lifeEssence).toBeGreaterThanOrEqual(0)
  })

  it.each([
    ['whispering-woods', 'forest-wisp'],
    ['howling-den', 'cavefang-wolf'],
    ['hall-of-unbound-names', 'name-eater'],
  ] as const)('runs a targeted normal-to-boss cycle for %s', (locationId, targetEnemyId) => {
    const state = makeFixture()
    state.debug.playerStats.spellPowerFlat = 1_000_000
    state.debug.playerStats.maxHealthFlat = 100_000
    state.debug.playerStats.maxManaFlat = 100_000
    state.debug.playerStats.manaRegenFlat = 10_000
    state.debug.playerStats.modifiers['damage-taken-percent'] = -0.95
    state.player.maxMana = state.player.baseMaxMana = 100_000
    state.player.mana = 100_000
    state.player.maxHealth = state.player.baseMaxHealth = 100_000
    state.player.health = 100_000
    const result = runCombatBossCycleBenchmark({ sourceState: state, locationId, targetEnemyId, worldTier: 1, cycles: 1 })
    expect(result).not.toBeNull()
    expect(result?.mode).toBe('boss-cycle')
    expect(result?.cyclesRequested).toBe(1)
    expect(result?.cyclesCompleted, JSON.stringify(result)).toBe(1)
    expect(result?.bossTtkMs).toBeGreaterThan(0)
    expect(result?.bossesPerHour).toBeGreaterThan(0)
  })

  it('uses the canonical Power-derived tier reward per completed kill', () => {
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
    expect(wt1.resonanceTotal.air / wt1.kills).toBe(resolveEnemyResonanceReward('forest-wisp', 1).finalYield.air)
    expect(wt2.resonanceTotal.air / wt2.kills).toBe(resolveEnemyResonanceReward('forest-wisp', 2).finalYield.air)
    expect(wt1.lifeEssencePerHour).toBeGreaterThan(0)
    expect(wt1.artifactEssencePerHour).toBeGreaterThan(0)
    expect(wt1.sigilDropsPerHour).toBeGreaterThanOrEqual(0)
    expect(wt1.crystalCachesPerHour).toBeGreaterThanOrEqual(0)
    expect(wt1.arcanePointsPerHour).toBeGreaterThan(0)
    expect(wt2.arcanePointsPerHour).toBeGreaterThanOrEqual(0)
    expect(wt2.lifeEssencePerHour).toBeGreaterThanOrEqual(0)
    expect(wt2.artifactEssencePerHour).toBeGreaterThanOrEqual(0)
  })

  it('classifies each outgoing hit exactly once across Guardian, spell, DoT, and other sources', () => {
    const state = makeFixture()
    state.debug.playerStats.spellPowerFlat = 500
    const result = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: 'forest-wisp', worldTier: 1, durationMs: 20_000 })
    expect(result.damageDealt).toBeGreaterThan(0)
    expect(result.spellDamage + result.guardianDamage + result.dotDamage + result.otherPlayerDamage).toBe(result.damageDealt)
    expect(result.guardianDamageShare).toBeCloseTo(result.guardianDamage / result.damageDealt)
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
