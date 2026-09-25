import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { isDungeonCompleted } from '../../content/dungeons/dungeons'
import { isSummoningUnlocked } from '../summoning/summoningSelectors'
import { finishEnemy, spawnEnemy } from './combatRuntime'
import { createCombatTestState } from './testCombatState'

describe('Corrupted Elemental Gatekeeper completion', () => {
  it('uses the normal boss death pipeline once for T2 completion and Summoning unlock', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.dungeonId = 'fractured-approach'
    spawnEnemy(state, 'corrupted-elemental-gatekeeper')
    state.combat.enemyHp = 0
    let lootResolutions = 0

    finishEnemy(state, undefined, undefined, undefined, (_state, enemyId, drops) => {
      expect(enemyId).toBe('corrupted-elemental-gatekeeper')
      expect(drops.length).toBeGreaterThan(0)
      lootResolutions += 1
    })

    expect(state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper']).toBe(1)
    expect(isDungeonCompleted('fractured-approach', state.progress)).toBe(true)
    expect(isSummoningUnlocked(state)).toBe(true)
    expect(state.notifications.map((notification) => notification.text)).toEqual(expect.arrayContaining([
      'Wizard Tower: Summoning unlocked.',
      'FRACTURED APPROACH COMPLETE / Branch routes unlocked.',
    ]))
    expect(lootResolutions).toBe(1)

    finishEnemy(state)
    expect(state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper']).toBe(1)
    expect(lootResolutions).toBe(1)
  })
})
