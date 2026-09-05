import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { advanceWithOfflineBank } from './offlineBankSimulation'

const activeCombatState = () => {
  const state = createInitialState()
  state.offlineBankMs = 1_000
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.enemyId = 'forest-wisp'
  state.combat.enemyHp = state.combat.enemyMaxHp = 100
  state.debug.freezePlayerActions = true
  state.debug.freezeEnemyActions = true
  return state
}

describe('Offline Bank analytics wiring', () => {
  it('passes analytics observers and an event sink into banked simulation', async () => {
    const state = activeCombatState()
    const uiEvents = { push: vi.fn() }
    const telemetry = { advance: vi.fn() }
    const statistics = { advance: vi.fn() }

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { uiEvents, telemetry: telemetry as never, statistics: statistics as never })

    expect(result.ok).toBe(true)
    expect(telemetry.advance).toHaveBeenCalledTimes(10)
    expect(telemetry.advance).toHaveBeenCalledWith(100, state)
    expect(statistics.advance).toHaveBeenCalledTimes(10)
    expect(statistics.advance).toHaveBeenCalledWith(100, state)
    expect(state.offlineBankMs).toBe(0)
  })

  it('restores analytics when banked simulation fails after observer delivery', async () => {
    const state = activeCombatState()
    const snapshot = { run: { engagedMs: 10 }, session: { elapsedMs: 20 } }
    const restore = vi.fn()
    const telemetry = { advance: vi.fn(() => { throw new Error('forced bank failure') }) }
    const statistics = { advance: vi.fn() }

    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => recipe(state), vi.fn(), undefined, { telemetry: telemetry as never, statistics: statistics as never, snapshot: () => snapshot, restore })

    expect(result).toMatchObject({ ok: false, error: 'forced bank failure' })
    expect(state.offlineBankMs).toBe(1_000)
    expect(statistics.advance).not.toHaveBeenCalled()
    expect(restore).toHaveBeenCalledWith(snapshot)
  })
})
