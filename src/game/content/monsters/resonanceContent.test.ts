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

describe('Shattered Meridian Resonance authoring', () => {
  it.each([
    ['graveglass-hollow', { water: 24, earth: 12 }],
    ['stormvault-gallery', { air: 30 }],
    ['starfallen-observatory', { air: 24, fire: 16 }],
  ] as const)('authors the requested resonance progression for %s', (dungeonId, firstProfile) => {
    const dungeon = DUNGEONS[dungeonId]
    expect(MONSTERS[dungeon.monsterPool[0]].resonanceYield).toEqual(firstProfile)
    ;[...dungeon.monsterPool, dungeon.boss].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield
      expect(profile, `${monsterId} should have a Shattered Meridian profile`).toBeTruthy()
      Object.entries(profile ?? {}).forEach(([type, amount]) => {
        expect(RESONANCE_TYPES).toContain(type)
        expect(Number.isSafeInteger(amount)).toBe(true)
        expect(amount).toBeGreaterThan(0)
      })
    })
  })

  it('keeps Broken Meridian sequence encounters Resonance-free', () => {
    const dungeon = DUNGEONS['broken-meridian']
    expect(dungeon.encounterSequence).toEqual(['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade'])
    ;[...dungeon.monsterPool, ...(dungeon.encounterSequence ?? []), dungeon.boss].forEach((monsterId) => expect(MONSTERS[monsterId].resonanceYield).toBeUndefined())
  })
})

describe('Black Sigil Reach Resonance authoring', () => {
  it.each([
    ['hall-of-unbound-names', { air: 36, water: 24 }, { air: 100, water: 100 }],
    ['vault-of-the-black-sigil', { earth: 24, fire: 46 }, { earth: 110, fire: 110 }],
  ] as const)('authors the requested mixed profile progression for %s', (dungeonId, firstProfile, bossProfile) => {
    const dungeon = DUNGEONS[dungeonId]
    expect(MONSTERS[dungeon.monsterPool[0]].resonanceYield).toEqual(firstProfile)
    expect(MONSTERS[dungeon.boss].resonanceYield).toEqual(bossProfile)
    ;[...dungeon.monsterPool, dungeon.boss].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield ?? {}
      expect(Object.keys(profile).every((type) => type === (dungeonId === 'hall-of-unbound-names' ? 'air' : 'earth') || type === (dungeonId === 'hall-of-unbound-names' ? 'water' : 'fire'))).toBe(true)
      expect(profile).not.toHaveProperty('arcane')
      expect(profile).not.toHaveProperty('life')
    })
  })
})
