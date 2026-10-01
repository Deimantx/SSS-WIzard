import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { spawnEnemy } from '../combat/combatRuntime'
import { createCombatTestState } from '../combat/testCombatState'
import { advanceWithOfflineBank } from './offlineBankSimulation'

const frontierCases = [
  { locationId: 'stonewake-hollow', enemyId: 'heartstone-colossus', label: 'elemental tutorial' },
  { locationId: 'whispering-woods', enemyId: 'forest-wisp', label: 'Whispering Woods' },
  { locationId: 'howling-den', enemyId: 'cavefang-wolf', label: 'Howling Den' },
  { locationId: 'hunters-ground', enemyId: 'ashen-tracker', label: 'Gloamridge contract' },
  { locationId: 'abandoned-catacombs', enemyId: 'restless-skeleton', label: 'Catacombs' },
] as const

describe('frontier Offline Bank smoke coverage', () => {
  it.each(frontierCases)('advances $label combat and retains its progression context', async ({ locationId, enemyId, label }) => {
    const state = createCombatTestState()
    state.offlineBankMs = 5_000
    state.combat.active = true
    state.combat.locationId = locationId
    state.combat.targetEnemyId = enemyId
    state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
    if (label === 'Gloamridge contract') {
      state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
      state.progress.huntersOrder.reputation = 0
      state.progress.huntersOrder.rankId = 'tracker'
      state.progress.huntersOrder.activeContract = {
        id: 'offline-gloamridge-smoke', targetSpec: { type: 'region', locationId: 'hunters-ground' },
        target: 1, progress: 0, tier: 'routine', reputationReward: 1, marksReward: 1,
      }
    }
    expect(spawnEnemy(state, enemyId)).toBe(true)

    const result = await advanceWithOfflineBank(1_000, () => state, (install) => install(state), () => ({ ok: true, error: null }))

    expect(result.ok, result.error).toBe(true)
    expect(state.offlineBankMs).toBe(4_000)
    expect(state.combat.locationId).toBe(locationId)
    expect(state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated']).toBe(true)
    if (label === 'Gloamridge contract') expect(state.progress.huntersOrder.activeContract?.id).toBe('offline-gloamridge-smoke')
  })
})
