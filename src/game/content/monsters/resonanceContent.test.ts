import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../dungeons/dungeons'
import { RESONANCE_TYPES } from '../resonance/resonance'
import { MONSTERS } from './index'

describe('Whispering Woods Phase 1 Resonance authoring', () => {
  it('authors a valid non-empty profile for every normal-pool enemy and its boss', () => {
    const dungeon = DUNGEONS['whispering-woods']
    ;[...dungeon.monsterPool, dungeon.boss].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield
      expect(profile, `${monsterId} should have a Phase 1 profile`).toBeTruthy()
      expect(Object.keys(profile ?? {}).length).toBeGreaterThan(0)
      Object.entries(profile ?? {}).forEach(([type, amount]) => {
        expect(RESONANCE_TYPES).toContain(type)
        expect(Number.isSafeInteger(amount)).toBe(true)
        expect(amount).toBeGreaterThan(0)
      })
    })
  })
})
