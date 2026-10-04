import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getCombatFarmingBenchmarkTargets, runCombatFarmingBenchmark, runCombatFarmingBenchmarkMatrix } from './combatFarmingBenchmark'

describe('single-profile farming benchmark', () => {
  it('uses a deterministic seed and authored location target list without a difficulty axis', async () => {
    const state = createInitialState()
    const targets = getCombatFarmingBenchmarkTargets('whispering-woods')
    expect(targets.length).toBeGreaterThan(0)
    const first = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: targets[0], durationMs: 1_000 })
    const second = runCombatFarmingBenchmark({ sourceState: state, locationId: 'whispering-woods', targetEnemyId: targets[0], durationMs: 1_000 })
    expect(first.seed).toBe(second.seed)
    expect(first.targetEnemyId).toBe(targets[0])
    const matrix = await runCombatFarmingBenchmarkMatrix({ sourceState: state, locationId: 'whispering-woods', targetEnemyIds: targets.slice(0, 2), durationMs: 1_000 }, { yieldBetweenJobs: false })
    expect(matrix.results).toHaveLength(Math.min(2, targets.length))
    expect(matrix.targetEnemyIds).toEqual(targets.slice(0, 2))
  })
})
