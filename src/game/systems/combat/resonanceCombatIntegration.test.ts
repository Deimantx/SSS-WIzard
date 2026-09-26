import { describe, expect, it, vi } from 'vitest'
import { makeInitialState } from '../../../store/gameStore'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { despawnEnemyForDebug, fastResolveNormalEnemiesForDebug, forceKillEnemyForDebug } from './debugCombatRuntime'
import { finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'
import { createOfflineBankReportCollector } from '../offline-bank/offlineBankReport'
import { resolvePowerScaledCurrencyRewardRange } from '../loot/powerScaledCurrencyRewards'

const prepareCombat = (state: ReturnType<typeof makeInitialState>) => {
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'resonance-test', name: 'Resonance Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'resonance-test'
}

describe('canonical Combat Resonance rewards', () => {
  it('grants a normal defeat exactly once and keeps item loot separate', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0
    const events: import('./combatTypes').CombatEvent[] = []
    expect(resolveCombatDeaths(state, undefined, undefined, { push: (event) => events.push(event) })).toBe(true)
    expect(state.resonance).toEqual({ fire: 0, water: 0, earth: 0, air: 2 })
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(resolveCombatDeaths(state)).toBe(false)
    expect(state.resonance.air).toBe(2)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')).toMatchObject({ sourceId: 'resonance-reward', worldTier: 1, resonanceReward: { enemyId: 'forest-wisp', worldTier: 1, rewardMultiplier: 0.2, baseYield: { air: 10 }, finalYield: { air: 2 }, grantedYield: { air: 2 } } })
    random.mockRestore()
  })

  it('does not reward despawned or immortal enemies, while forced developer kill uses the canonical path', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    expect(despawnEnemyForDebug(state)).toBe(true)
    expect(state.resonance.air).toBe(0)

    spawnEnemy(state, 'forest-wisp')
    state.debug.enemyImmortal = true
    state.combat.enemyHp = 0
    expect(resolveCombatDeaths(state)).toBe(false)
    expect(state.resonance.air).toBe(0)
    expect(forceKillEnemyForDebug(state)).toBe(true)
    expect(state.resonance.air).toBe(resolveEnemyResonanceReward('forest-wisp').finalYield.air)
  })

  it('grants the boss profile and preserves normal progression', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-heart')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.resonance.earth).toBe(16)
    expect(state.progress.bossKillsByBoss['forest-heart']).toBe(1)
    expect(state.arcaneCore.totalPointsEarned).toBeGreaterThan(0)
  })

  it('uses the same canonical path for Fast Resolve', () => {
    const state = makeInitialState()
    prepareCombat(state)
    const result = fastResolveNormalEnemiesForDebug(state, 1, 'whispering-woods', false)
    expect(result.resolved).toBe(1)
    const total = Object.values(state.resonance).reduce((sum, value) => sum + value, 0)
    expect(total).toBeGreaterThan(0)
  })

  it('uses the persisted World Tier for Offline Bank Resonance rewards', async () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.offlineBankMs = 1_000
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0
    const events: import('./combatTypes').CombatEvent[] = []

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { uiEvents: { push: (event) => events.push(event) } })

    expect(result.ok).toBe(true)
    expect(state.resonance.air).toBe(5)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')?.resonanceReward?.grantedYield).toMatchObject({ air: 5 })
  })

  it('snapshots World Tier at spawn and uses that tier for health, loot, and Resonance', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.worldTier = { current: 4, highestUnlocked: 4 }
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    const events: import('./combatTypes').CombatEvent[] = []
    expect(spawnEnemy(state, 'forest-wisp', { push: (event) => events.push(event) })).toBe(true)
    expect(state.combat.enemyWorldTier).toBe(4)
    expect(state.combat.enemyMaxHp).toBe(4 * MONSTERS['forest-wisp'].maxHealth)
    state.worldTier.current = 1
    state.combat.enemyHp = 0
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    finishEnemy(state, undefined, undefined, { push: (event) => events.push(event) })
    const wt4LifeEssence = state.inventory['life-essence'] ?? 0
    const wt4Range = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 4)
    expect(wt4LifeEssence).toBeGreaterThanOrEqual(wt4Range.finalMin)
    expect(wt4LifeEssence).toBeLessThanOrEqual(wt4Range.finalMax)
    expect(state.resonance.air).toBe(13)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')).toMatchObject({ worldTier: 4, resonanceReward: { rewardMultiplier: 1.3, finalYield: { air: 13 }, grantedYield: { air: 13 } } })
    random.mockRestore()
  })

  it('keeps inventory, callback, offline report, loot reveal, and telemetry at final quantity', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = makeInitialState()
    prepareCombat(state)
    state.worldTier = { current: 5, highestUnlocked: 5 }
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0
    const collector = createOfflineBankReportCollector(state, 1_000, 0)
    const acquired: Array<[string, number]> = []
    const revealed: number[] = []
    const events: import('./combatTypes').CombatEvent[] = []
    finishEnemy(state, collector, (itemId, quantity) => acquired.push([itemId, quantity]), { push: (event) => events.push(event) }, (_state, _enemyId, drops) => revealed.push(drops.find((drop) => drop.itemId === 'life-essence')?.quantity ?? 0))
    const report = collector.finalize(state)
    const expectedLifeEssence = state.inventory['life-essence'] ?? 0
    const wt5Range = resolvePowerScaledCurrencyRewardRange('forest-wisp', 'life-essence', 5)
    expect(expectedLifeEssence).toBeGreaterThanOrEqual(wt5Range.finalMin)
    expect(expectedLifeEssence).toBeLessThanOrEqual(wt5Range.finalMax)
    expect(state.inventory['life-essence']).toBe(expectedLifeEssence)
    expect(acquired).toContainEqual(['life-essence', expectedLifeEssence])
    expect(revealed).toEqual([expectedLifeEssence])
    expect(report.combat.loot['life-essence']).toBe(expectedLifeEssence)
    expect(report.combat.loot['artifact-essence']).toBe(state.inventory['artifact-essence'])
    expect(events.find((event) => event.category === 'loot' && event.itemId === 'life-essence')).toMatchObject({ amount: expectedLifeEssence })
    expect(events.find((event) => event.category === 'loot' && event.itemId === 'artifact-essence')).toMatchObject({ amount: state.inventory['artifact-essence'] })
    random.mockRestore()
  })

  it('unlocks WT2 on the first Archmage Edrin Shade defeat without auto-selecting it', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.dungeonId = 'abandoned-catacombs'
    expect(spawnEnemy(state, 'archmage-edrin-shade')).toBe(true)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.worldTier).toEqual({ current: 1, highestUnlocked: 2 })
    expect(state.notifications.some((notification) => notification.text === 'WORLD TIER 2 UNLOCKED')).toBe(true)
  })
})
