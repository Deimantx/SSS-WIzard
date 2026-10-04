import { describe, expect, it, vi } from 'vitest'
import { makeInitialState } from '../../../store/gameStore'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { despawnEnemyForDebug, fastResolveNormalEnemiesForDebug, forceKillEnemyForDebug } from './debugCombatRuntime'
import { finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'
import { createOfflineBankReportCollector } from '../offline-bank/offlineBankReport'
import { resolveCombatCurrencyRewardRange } from '../loot/combatCurrencyRewards'

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
    state.combat.locationId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0
    const events: import('./combatTypes').CombatEvent[] = []
    expect(resolveCombatDeaths(state, undefined, undefined, { push: (event) => events.push(event) })).toBe(true)
    const expectedReward = resolveEnemyResonanceReward('forest-wisp')
    expect(state.resonance).toEqual({ fire: 0, water: 0, earth: 0, air: expectedReward.finalYield.air, arcane: 0 })
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(resolveCombatDeaths(state)).toBe(false)
    expect(state.resonance.air).toBe(expectedReward.finalYield.air)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')).toMatchObject({ sourceId: 'resonance-reward', resonanceReward: { enemyId: 'forest-wisp', lootTier: expectedReward.lootTier, rewardMultiplier: expectedReward.rewardMultiplier, baseYield: { air: 10 }, finalYield: expectedReward.finalYield, grantedYield: expectedReward.finalYield } })
    random.mockRestore()
  })

  it('does not reward despawned or immortal enemies, while forced developer kill uses the canonical path', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
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
    state.combat.locationId = 'whispering-woods'
    spawnEnemy(state, 'forest-heart')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.resonance.earth).toBe(resolveEnemyResonanceReward('forest-heart').finalYield.earth)
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

  it('uses canonical Resonance rewards in Offline Bank simulation', async () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.offlineBankMs = 1_000
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0
    const events: import('./combatTypes').CombatEvent[] = []

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { uiEvents: { push: (event) => events.push(event) } })

    expect(result.ok).toBe(true)
    expect(state.resonance.air).toBe(resolveEnemyResonanceReward('forest-wisp').finalYield.air)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')?.resonanceReward?.grantedYield).toMatchObject(resolveEnemyResonanceReward('forest-wisp').finalYield)
  })

  it('credits Arcane Resonance for Arcane enemies through Combat and Offline Bank', async () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.offlineBankMs = 1_000
    state.combat.active = true
    state.combat.locationId = 'brineveil-marsh'
    expect(spawnEnemy(state, 'runesunk-oracle')).toBe(true)
    state.combat.enemyHp = 0
    const events: import('./combatTypes').CombatEvent[] = []

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { uiEvents: { push: (event) => events.push(event) } })

    expect(result.ok).toBe(true)
    expect(state.resonance.arcane).toBe(resolveEnemyResonanceReward('runesunk-oracle').finalYield.arcane)
    expect(events.find((event) => event.category === 'resonance')?.resonanceReward?.grantedYield.arcane).toBeGreaterThan(0)
  })

  it('uses authored enemy stats and canonical rewards at spawn', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    const events: import('./combatTypes').CombatEvent[] = []
    expect(spawnEnemy(state, 'forest-wisp', { push: (event) => events.push(event) })).toBe(true)
    expect('enemyWorldTier' in state.combat).toBe(false)
    expect(state.combat.enemyMaxHp).toBe(MONSTERS['forest-wisp'].maxHealth)
    state.combat.enemyHp = 0
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    finishEnemy(state, undefined, undefined, { push: (event) => events.push(event) })
    const canonicalLifeEssence = state.inventory['life-essence'] ?? 0
    const canonicalRange = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence')
    expect(canonicalLifeEssence).toBeGreaterThanOrEqual(canonicalRange.finalMin)
    expect(canonicalLifeEssence).toBeLessThanOrEqual(canonicalRange.finalMax)
    const canonicalResonance = resolveEnemyResonanceReward('forest-wisp')
    expect(state.resonance.air).toBe(canonicalResonance.finalYield.air)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')).toMatchObject({ resonanceReward: { lootTier: canonicalResonance.lootTier, rewardMultiplier: canonicalResonance.rewardMultiplier, finalYield: canonicalResonance.finalYield, grantedYield: canonicalResonance.finalYield } })
    random.mockRestore()
  })

  it('keeps inventory, callback, offline report, loot reveal, and telemetry at final quantity', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    state.combat.enemyHp = 0
    const collector = createOfflineBankReportCollector(state, 1_000, 0)
    const acquired: Array<[string, number]> = []
    const revealed: number[] = []
    const events: import('./combatTypes').CombatEvent[] = []
    finishEnemy(state, collector, (itemId, quantity) => acquired.push([itemId, quantity]), { push: (event) => events.push(event) }, (_state, _enemyId, drops) => revealed.push(drops.find((drop) => drop.itemId === 'life-essence')?.quantity ?? 0))
    const report = collector.finalize(state)
    const expectedLifeEssence = state.inventory['life-essence'] ?? 0
    const canonicalRange = resolveCombatCurrencyRewardRange('forest-wisp', 'life-essence')
    expect(expectedLifeEssence).toBeGreaterThanOrEqual(canonicalRange.finalMin)
    expect(expectedLifeEssence).toBeLessThanOrEqual(canonicalRange.finalMax)
    expect(state.inventory['life-essence']).toBe(expectedLifeEssence)
    expect(acquired).toContainEqual(['life-essence', expectedLifeEssence])
    expect(revealed).toEqual([expectedLifeEssence])
    expect(report.combat.loot['life-essence']).toBe(expectedLifeEssence)
    expect(report.combat.loot['artifact-essence']).toBe(state.inventory['artifact-essence'])
    expect(events.find((event) => event.category === 'loot' && event.itemId === 'life-essence')).toMatchObject({ amount: expectedLifeEssence })
    expect(events.find((event) => event.category === 'loot' && event.itemId === 'artifact-essence')).toMatchObject({ amount: state.inventory['artifact-essence'] })
    random.mockRestore()
  })

  it('records Archmage Edrin Shade defeat without changing global difficulty', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.combat.active = true
    state.combat.locationId = 'abandoned-catacombs'
    expect(spawnEnemy(state, 'archmage-edrin-shade')).toBe(true)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect('worldTier' in state).toBe(false)
    expect(state.progress.bossKillsByBoss['archmage-edrin-shade']).toBe(1)
  })
})
