import { describe, expect, it } from 'vitest'
import { applyStatus } from './statusRuntime'
import { spawnEnemy } from './combatRuntime'
import { getCurrentEnemyActionTiming, getFallbackTimedActionState, getTimedActionState } from './actionTiming'
import { createCombatTestState } from './testCombatState'

describe('canonical combat action timing selectors', () => {
  it('reports enemy work progress and real-time ETA from one interpretation', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    expect(getCurrentEnemyActionTiming(state)).toMatchObject({ baseWorkMs: 2_800, remainingWorkMs: 2_800, progress: 0, rate: 1, etaMs: 2_800, blocked: false })
  })

  it('uses a null ETA and PAUSED state while Stunned', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    applyStatus(state, 'enemy', 'stunned', { actor: 'player', kind: 'spell', sourceId: 'timing-stun' })
    expect(getCurrentEnemyActionTiming(state)).toMatchObject({ remainingWorkMs: 2_800, progress: 0, rate: 0, etaMs: null, blocked: true, blockReason: 'status-control' })
  })

  it('reports debug freeze and fallback timing without labeling it Stunned', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    state.debug.freezeEnemyActions = true
    expect(getCurrentEnemyActionTiming(state)).toMatchObject({ blocked: true, blockReason: 'debug-freeze' })
    expect(getTimedActionState(2_200, 1_400, 0, 'debug-freeze')).toMatchObject({ blocked: true, blockReason: 'debug-freeze', etaMs: null })
    expect(getFallbackTimedActionState(2_200, 1_400, false)).toMatchObject({ blocked: false, etaMs: 1_400 })
  })
})
