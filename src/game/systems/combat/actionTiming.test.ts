import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { applyStatus } from './statusRuntime'
import { spawnEnemy } from './combatRuntime'
import { getCurrentEnemyActionTiming, getPlayerBasicTiming } from './actionTiming'

describe('canonical combat action timing selectors', () => {
  it('reports work progress and real-time ETA from one interpretation', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    state.combat.playerAttackTimerMs = 1_400
    applyStatus(state, 'player', 'quickening', { actor: 'player', kind: 'spell', sourceId: 'timing-test' })

    expect(getPlayerBasicTiming(state)).toMatchObject({ baseWorkMs: 2_200, remainingWorkMs: 1_400, progress: (1 - 1_400 / 2_200) * 100, rate: 1.25, etaMs: 1_120, blocked: false })
    expect(getCurrentEnemyActionTiming(state)).toMatchObject({ baseWorkMs: 2_800, remainingWorkMs: 2_800, progress: 0, rate: 1, etaMs: 2_800, blocked: false })
  })

  it('uses a null ETA and PAUSED state while Stunned', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    applyStatus(state, 'enemy', 'stunned', { actor: 'player', kind: 'spell', sourceId: 'timing-stun' })

    expect(getCurrentEnemyActionTiming(state)).toMatchObject({ remainingWorkMs: 2_800, progress: 0, rate: 0, etaMs: null, blocked: true, blockReason: 'status-control' })
  })

  it('reports debug freeze and disabled Basic Attack without labeling either as Stunned', () => {
    const frozen = createInitialState()
    frozen.combat.active = true
    frozen.combat.dungeonId = 'whispering-woods'
    spawnEnemy(frozen, 'forest-wisp')
    frozen.debug.freezeEnemyActions = true
    frozen.debug.freezePlayerActions = true
    expect(getCurrentEnemyActionTiming(frozen)).toMatchObject({ blocked: true, blockReason: 'debug-freeze' })
    expect(getPlayerBasicTiming(frozen)).toMatchObject({ blocked: true, blockReason: 'debug-freeze' })

    frozen.debug.freezePlayerActions = false
    frozen.debug.disablePlayerBasicAttack = true
    expect(getPlayerBasicTiming(frozen)).toMatchObject({ blocked: true, blockReason: 'disabled' })
  })
})
