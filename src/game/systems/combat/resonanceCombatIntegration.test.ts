import { describe, expect, it, vi } from 'vitest'
import { makeInitialState } from '../../../store/gameStore'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { despawnEnemyForDebug, fastResolveNormalEnemiesForDebug, forceKillEnemyForDebug } from './debugCombatRuntime'
import { finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'

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
    expect(state.resonance).toEqual({ fire: 0, water: 0, earth: 0, air: 10 })
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(resolveCombatDeaths(state)).toBe(false)
    expect(state.resonance.air).toBe(10)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')).toMatchObject({ sourceId: 'resonance-reward', worldTier: 1, resonanceReward: { enemyId: 'forest-wisp', worldTier: 1, rewardMultiplier: 1, baseYield: { air: 10 }, finalYield: { air: 10 }, grantedYield: { air: 10 } } })
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
    expect(state.resonance.earth).toBe(80)
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
    expect(state.resonance.air).toBe(20)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')?.resonanceReward?.grantedYield).toMatchObject({ air: 20 })
  })

  it('snapshots World Tier at spawn and doubles WT2 health and Resonance without changing authored data', () => {
    const state = makeInitialState()
    prepareCombat(state)
    state.worldTier = { current: 2, highestUnlocked: 2 }
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    const events: import('./combatTypes').CombatEvent[] = []
    expect(spawnEnemy(state, 'forest-wisp', { push: (event) => events.push(event) })).toBe(true)
    expect(state.combat.enemyWorldTier).toBe(2)
    expect(state.combat.enemyMaxHp).toBe(2 * MONSTERS['forest-wisp'].maxHealth)
    state.combat.enemyHp = 0
    finishEnemy(state, undefined, undefined, { push: (event) => events.push(event) })
    expect(state.resonance.air).toBe(20)
    expect(events.filter((event) => event.category === 'resonance')).toHaveLength(1)
    expect(events.find((event) => event.category === 'resonance')).toMatchObject({ worldTier: 2, resonanceReward: { rewardMultiplier: 2, finalYield: { air: 20 }, grantedYield: { air: 20 } } })
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
