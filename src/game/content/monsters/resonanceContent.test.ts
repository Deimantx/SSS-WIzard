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

describe('Elemental Scar Resonance authoring', () => {
  it.each([
    ['flooded-reliquary', 'water'],
    ['ashen-watch', 'fire'],
    ['rootscar-hollow', 'earth'],
  ] as const)('authors only the %s profile for every target and its boss', (dungeonId, resonanceType) => {
    const dungeon = DUNGEONS[dungeonId]
    ;[...dungeon.monsterPool, dungeon.boss].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield
      expect(profile, `${monsterId} should have an Elemental Scar profile`).toBeTruthy()
      expect(profile && Object.keys(profile)).toEqual([resonanceType])
      expect(profile?.[resonanceType]).toBeGreaterThan(0)
    })
  })

  it('does not add Resonance to the two sequence dungeons', () => {
    for (const dungeonId of ['fractured-approach', 'crossroads-of-ruin'] as const) {
      const dungeon = DUNGEONS[dungeonId]
      ;[...dungeon.monsterPool, dungeon.boss].forEach((monsterId) => expect(MONSTERS[monsterId].resonanceYield).toBeUndefined())
    }
  })
})
