import { describe, expect, it, vi } from 'vitest'
import { makeInitialState } from '../../../store/gameStore'
import { resolveEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { despawnEnemyForDebug, fastResolveNormalEnemiesForDebug, forceKillEnemyForDebug } from './debugCombatRuntime'
import { finishEnemy, resolveCombatDeaths, spawnEnemy } from './combatRuntime'

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
    expect(resolveCombatDeaths(state)).toBe(true)
    expect(state.resonance).toEqual({ fire: 0, water: 0, earth: 0, air: 10 })
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
    expect(resolveCombatDeaths(state)).toBe(false)
    expect(state.resonance.air).toBe(10)
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
})
