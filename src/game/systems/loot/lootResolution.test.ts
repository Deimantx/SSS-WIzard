import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { resolveMonsterLoot } from './lootResolution'

describe('monster loot resolution', () => {
  it('guarantees a boss signature on the first boss kill and keeps repeat kills probabilistic', () => {
    const firstClear = createInitialState()
    resolveMonsterLoot(firstClear, 'forest-heart', undefined, () => 0.99)
    expect(firstClear.inventory['heartseed-necklace']).toBe(1)

    const repeatClear = createInitialState()
    repeatClear.progress.bossKillsByBoss['forest-heart'] = 1
    resolveMonsterLoot(repeatClear, 'forest-heart', undefined, () => 0.99)
    expect(repeatClear.inventory['heartseed-necklace']).toBeUndefined()
  })
})
