import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { usesPowerBasedThreat, getCombatLocationByDungeonId } from '../../content/world-navigation'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { createInitialState } from '../../../store/initialState'
import { finishEnemy, spawnEnemy } from './combatRuntime'
import { resolveBossThreatRequirement, resolveThreatGainForKill } from './combatThreat'

const prepareCombat = (dungeonId: keyof typeof DUNGEONS = 'whispering-woods') => {
  const state = createInitialState()
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'threat-test', name: 'Threat Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'threat-test'
  state.combat.active = true
  state.combat.dungeonId = dungeonId
  return state
}

describe('Power-based Boss Threat', () => {
  it('resolves prototype requirements for every World Tier and leaves legacy dungeons static', () => {
    expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement('whispering-woods', tier as 1 | 2 | 3 | 4 | 5))).toEqual([5000, 10000, 15000, 20000, 25000])
    expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement('howling-den', tier as 1 | 2 | 3 | 4 | 5))).toEqual([10000, 20000, 30000, 40000, 50000])
    expect(resolveBossThreatRequirement('fractured-approach', 5)).toBe(DUNGEONS['fractured-approach'].threatRequired)
    for (const dungeonId of ['flooded-reliquary', 'ashen-watch', 'rootscar-hollow'] as const) {
      expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement(dungeonId, tier as 1 | 2 | 3 | 4 | 5))).toEqual([20000, 40000, 60000, 80000, 100000])
    }
    for (const dungeonId of ['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory'] as const) {
      expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement(dungeonId, tier as 1 | 2 | 3 | 4 | 5))).toEqual([30000, 60000, 90000, 120000, 150000])
    }
  })

  it('uses enemy Power at the captured encounter tier for targeted kills', () => {
    const state = prepareCombat()
    expect(usesPowerBasedThreat(getCombatLocationByDungeonId('whispering-woods'))).toBe(true)
    expect(resolveThreatGainForKill(state, 'forest-wisp', 1)).toBe(resolveEnemyPowerRating('forest-wisp', 1))
    expect(resolveThreatGainForKill(state, 'tempest-stag', 1)).toBeGreaterThan(resolveThreatGainForKill(state, 'forest-wisp', 1))
    expect(resolveThreatGainForKill(state, 'forest-wisp', 2)).toBe(resolveEnemyPowerRating('forest-wisp', 2))
  })

  it.each([
    ['graveglass-hollow', 'epitaph-weaver'],
    ['stormvault-gallery', 'thundercoil-serpent'],
    ['starfallen-observatory', 'comet-wraith'],
  ] as const)('uses Power Threat for the targeted Shattered Meridian zone %s', (dungeonId, enemyId) => {
    const state = prepareCombat(dungeonId)
    expect(usesPowerBasedThreat(getCombatLocationByDungeonId(dungeonId))).toBe(true)
    expect(resolveThreatGainForKill(state, enemyId, 5)).toBe(resolveEnemyPowerRating(enemyId, 5))
  })

  it('keeps sequence dungeons at zero', () => {
    const sequence = prepareCombat('abandoned-catacombs')
    expect(resolveThreatGainForKill(sequence, 'restless-skeleton', 1)).toBe(0)
    expect(resolveThreatGainForKill(prepareCombat('fractured-approach'), 'warded-husk', 1)).toBe(0)
  })

  it('caps overshoot and emits readiness once while Auto Hunt queues immediately', () => {
    const state = prepareCombat()
    state.combat.targetEnemyId = 'tempest-stag'
    state.combat.threatCleared = 4500
    state.progress.autoHuntBossUnlocked = true
    state.progress.autoHuntBossByDungeon['whispering-woods'] = true
    expect(spawnEnemy(state, 'tempest-stag')).toBe(true)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(5000)
    expect(state.combat.pendingBossId).toBe('forest-heart')
    expect(state.notifications.filter((note) => note.text.includes('Forest Heart is ready'))).toHaveLength(1)
    expect(spawnEnemy(state, 'tempest-stag')).toBe(true)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(5000)
    expect(state.notifications.filter((note) => note.text.includes('Forest Heart is ready'))).toHaveLength(1)
  })

  it('uses the enemy snapshot tier even if the global tier changes before death', () => {
    const state = prepareCombat()
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    expect(state.combat.enemyWorldTier).toBe(1)
    state.worldTier.current = 2
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(resolveEnemyPowerRating('forest-wisp', 1))
  })

  it('uses neutral encounter copy for spawned enemies', () => {
    const state = prepareCombat()
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    expect(state.combat.log).toContain('Forest Wisp enters the encounter.')
    expect(state.combat.log).not.toContain('Forest Wisp enters the dungeon.')
  })
})
