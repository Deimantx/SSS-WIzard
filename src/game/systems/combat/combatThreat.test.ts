import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/combat-locations/dungeons/dungeons'
import { usesPowerBasedThreat, getCombatLocationById } from '../../content/combat-locations'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { createInitialState } from '../../../store/initialState'
import { finishEnemy, spawnEnemy } from './combatRuntime'
import { resolveBossThreatRequirement, resolveThreatGainForKill } from './combatThreat'

const prepareCombat = (locationId: string = 'whispering-woods') => {
  const state = createInitialState()
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'threat-test', name: 'Threat Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'threat-test'
  state.combat.active = true
  state.combat.locationId = locationId
  return state
}

describe('Power-based Boss Threat', () => {
  it('resolves prototype requirements for every World Tier and leaves legacy dungeons static', () => {
    expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement('whispering-woods', tier as 1 | 2 | 3 | 4 | 5))).toEqual([5000, 10000, 15000, 20000, 25000])
    expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement('howling-den', tier as 1 | 2 | 3 | 4 | 5))).toEqual([10000, 20000, 30000, 40000, 50000])
    expect(resolveBossThreatRequirement('fractured-approach', 5)).toBe(DUNGEONS['fractured-approach'].threatRequired)
    for (const locationId of ['flooded-reliquary', 'ashen-watch', 'rootscar-hollow'] as const) {
      expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement(locationId, tier as 1 | 2 | 3 | 4 | 5))).toEqual([20000, 40000, 60000, 80000, 100000])
    }
    for (const locationId of ['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory'] as const) {
      expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement(locationId, tier as 1 | 2 | 3 | 4 | 5))).toEqual([30000, 60000, 90000, 120000, 150000])
    }
    for (const locationId of ['hall-of-unbound-names', 'vault-of-the-black-sigil'] as const) {
      expect([1, 2, 3, 4, 5].map((tier) => resolveBossThreatRequirement(locationId, tier as 1 | 2 | 3 | 4 | 5))).toEqual([40000, 80000, 120000, 160000, 200000])
    }
  })

  it('uses enemy Power at the captured encounter tier for targeted kills', () => {
    const state = prepareCombat()
    expect(usesPowerBasedThreat(getCombatLocationById('whispering-woods'))).toBe(true)
    expect(usesPowerBasedThreat(getCombatLocationById('hunters-ground'))).toBe(false)
    expect(resolveThreatGainForKill(state, 'forest-wisp', 1)).toBe(resolveEnemyPowerRating('forest-wisp', 1))
    expect(resolveThreatGainForKill(state, 'tempest-stag', 1)).toBeGreaterThan(resolveThreatGainForKill(state, 'forest-wisp', 1))
    expect(resolveThreatGainForKill(state, 'forest-wisp', 2)).toBe(resolveEnemyPowerRating('forest-wisp', 2))
  })

  it.each([
    ['graveglass-hollow', 'epitaph-weaver'],
    ['stormvault-gallery', 'thundercoil-serpent'],
    ['starfallen-observatory', 'comet-wraith'],
  ] as const)('uses Power Threat for the targeted Shattered Meridian zone %s', (locationId, enemyId) => {
    const state = prepareCombat(locationId)
    expect(usesPowerBasedThreat(getCombatLocationById(locationId))).toBe(true)
    expect(resolveThreatGainForKill(state, enemyId, 5)).toBe(resolveEnemyPowerRating(enemyId, 5))
  })

  it.each([
    ['hall-of-unbound-names', 'nameless-cantor'],
    ['vault-of-the-black-sigil', 'blackscript-colossus'],
  ] as const)('uses captured World Tier Power Threat for %s', (locationId, enemyId) => {
    const state = prepareCombat(locationId)
    expect(resolveThreatGainForKill(state, enemyId, 4)).toBe(resolveEnemyPowerRating(enemyId, 4))
  })

  it('keeps sequence dungeons at zero', () => {
    const sequence = prepareCombat('abandoned-catacombs')
    expect(resolveThreatGainForKill(sequence, 'restless-skeleton', 1)).toBe(0)
    expect(resolveThreatGainForKill(prepareCombat('fractured-approach'), 'warded-husk', 1)).toBe(0)
  })

  it('keeps the bossless Hunting Ground at zero Threat', () => {
    const ground = prepareCombat('hunters-ground')
    expect(resolveBossThreatRequirement('hunters-ground', 5)).toBe(0)
    expect(resolveThreatGainForKill(ground, 'nightglass-alpha', 5)).toBe(0)
    ground.combat.enemyId = 'nightglass-alpha'
    ground.combat.enemyHp = 0
    finishEnemy(ground)
    expect(ground.combat.log.some((entry) => /Threat/.test(entry))).toBe(false)
  })

  it('announces the Guild and Hunter Order on their first unlock kills only', () => {
    const forest = createInitialState()
    forest.combat.active = true
    forest.combat.locationId = 'whispering-woods'
    forest.combat.enemyId = 'forest-heart'
    forest.combat.enemyHp = 0
    finishEnemy(forest)
    expect(forest.notifications.map((notification) => notification.text)).toContain('ARCANE GUILD UNLOCKED')

    const greatbear = createInitialState()
    greatbear.combat.active = true
    greatbear.combat.locationId = 'howling-den'
    greatbear.combat.enemyId = 'corrupted-greatbear'
    greatbear.combat.enemyHp = 0
    finishEnemy(greatbear)
    expect(greatbear.notifications.map((notification) => notification.text)).toContain('HUNTER’S ORDER UNLOCKED')
    greatbear.notifications.length = 0
    greatbear.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    greatbear.combat.enemyId = 'corrupted-greatbear'
    greatbear.combat.enemyHp = 0
    finishEnemy(greatbear)
    expect(greatbear.notifications.map((notification) => notification.text)).not.toContain('HUNTER’S ORDER UNLOCKED')
  })

  it('caps overshoot and emits readiness once while Auto Hunt queues immediately', () => {
    const state = prepareCombat()
    state.combat.targetEnemyId = 'tempest-stag'
    state.combat.threatCleared = 4500
    state.progress.autoHuntBossUnlocked = true
    state.progress.autoHuntBossByLocation['whispering-woods'] = true
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
