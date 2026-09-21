import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { getCombatLocationByDungeonId, isCombatTargetForLocation } from '../../content/world-navigation'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { finishEnemy, spawnNextEnemy, spawnEnemy } from './combatRuntime'
import { fastResolveNormalEnemiesForDebug } from './debugCombatRuntime'

const prepare = () => {
  const state = createInitialState()
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'targeted-test', name: 'Targeted Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'targeted-test'
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  return state
}

describe('Whispering Woods targeted farming', () => {
  it('validates only authored normal targets and rejects the Zone Boss', () => {
    const location = getCombatLocationByDungeonId('whispering-woods')
    expect(isCombatTargetForLocation(location, 'whispering-woods', 'cinder-moth')).toBe(true)
    expect(isCombatTargetForLocation(location, 'whispering-woods', 'forest-heart')).toBe(false)
    expect(isCombatTargetForLocation(location, 'whispering-woods', 'corrupted-greatbear')).toBe(false)
    expect(isCombatTargetForLocation(getCombatLocationByDungeonId('howling-den'), 'howling-den', 'cinder-moth')).toBe(false)
  })

  it('repeats the selected target regardless of encounter RNG', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'cinder-moth'
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('cinder-moth')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('cinder-moth')
    expect(state.combat.threatCleared).toBe(1)
  })

  it('switches the next normal spawn without interrupting the current enemy', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'stone-root'
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('stone-root')
    state.combat.targetEnemyId = 'forest-wisp'
    expect(state.combat.enemyId).toBe('stone-root')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('forest-wisp')
  })

  it.each([
    ['forest-wisp', 'air', 10],
    ['cinder-moth', 'fire', 20],
    ['tempest-stag', 'air', 50],
  ] as const)('adds one Threat Cleared for %s', (enemyId, type, amount) => {
    const state = prepare()
    state.combat.targetEnemyId = enemyId
    spawnNextEnemy(state)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(1)
    expect(state.resonance[type]).toBe(amount)
  })

  it('keeps the target through the Zone Boss and resumes the same target', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'tempest-stag'
    spawnEnemy(state, 'forest-heart')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(0)
    expect(state.combat.targetEnemyId).toBe('tempest-stag')
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('tempest-stag')
  })

  it('uses the canonical World Tier resolver for target rewards', () => {
    expect(resolveEnemyResonanceReward('dewbound-sprite', 1).finalYield).toMatchObject({ water: 18 })
    expect(resolveEnemyResonanceReward('cinder-moth', 1).finalYield).toMatchObject({ fire: 20 })
    expect(resolveEnemyResonanceReward('tempest-stag', 1).finalYield).toMatchObject({ air: 50, earth: 15 })
    expect(resolveEnemyResonanceReward('dewbound-sprite', 2).finalYield).toMatchObject({ water: 36 })
    expect(resolveEnemyResonanceReward('cinder-moth', 2).finalYield).toMatchObject({ fire: 40 })
    expect(resolveEnemyResonanceReward('tempest-stag', 2).finalYield).toMatchObject({ air: 100, earth: 30 })
  })

  it('keeps random-pool dungeons random and honors target selection in Fast Resolve', () => {
    const randomState = prepare()
    randomState.combat.dungeonId = 'howling-den'
    randomState.combat.targetEnemyId = 'cinder-moth'
    const randomResult = fastResolveNormalEnemiesForDebug(randomState, 1, 'howling-den', false)
    expect(randomResult.resolved).toBe(1)
    expect(DUNGEONS['howling-den'].monsterPool).toContain(randomState.progress.discoveredMonsters.find((id) => DUNGEONS['howling-den'].monsterPool.includes(id)) ?? 'cavefang-wolf')

    const targetedState = prepare()
    targetedState.combat.targetEnemyId = 'forest-wisp'
    const result = fastResolveNormalEnemiesForDebug(targetedState, 2, 'whispering-woods', false)
    expect(result.resolved).toBe(2)
    expect(targetedState.progress.lifetimeKillsByMonster['forest-wisp']).toBe(2)
    expect(targetedState.resonance.air).toBe(20)
  })

  it('uses the target during the next offline simulation spawn', async () => {
    const state = prepare()
    state.combat.targetEnemyId = 'cinder-moth'
    state.offlineBankMs = 5_000
    expect(spawnNextEnemy(state)).toBe(true)
    state.combat.enemyHp = 0
    const { advanceWithOfflineBank } = await import('../offline-bank/offlineBankSimulation')
    const result = await advanceWithOfflineBank(5_000, () => state, (recipe) => recipe(state), () => {}, undefined, {})
    expect(result.ok).toBe(true)
    expect(state.progress.lifetimeKillsByMonster['cinder-moth']).toBeGreaterThanOrEqual(1)
  })
})
