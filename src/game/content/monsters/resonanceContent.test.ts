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

  it('keeps sequence normal monsters Resonance-free while rewarding their bosses', () => {
    for (const dungeonId of ['fractured-approach', 'crossroads-of-ruin'] as const) {
      const dungeon = DUNGEONS[dungeonId]
      ;[...dungeon.monsterPool, ...(dungeon.encounterSequence ?? [])].forEach((monsterId) => expect(MONSTERS[monsterId].resonanceYield).toBeUndefined())
    }
    expect(MONSTERS['corrupted-elemental-gatekeeper'].resonanceYield).toEqual({ fire: 50, water: 50, earth: 50, air: 50 })
    expect(MONSTERS['crossroads-keeper'].resonanceYield).toEqual({ fire: 75, water: 75, earth: 75, air: 75 })
  })

  it('authors the progression boss multi-element Resonance yields', () => {
    expect(MONSTERS['archmage-edrin-shade'].resonanceYield).toEqual({ fire: 40, water: 40, earth: 40, air: 40 })
    expect(MONSTERS['meridian-splitter'].resonanceYield).toEqual({ fire: 100, water: 100, earth: 100, air: 100 })
    expect(MONSTERS['black-gatekeeper'].resonanceYield).toEqual({ fire: 150, water: 150, earth: 150, air: 150 })
  })
})

describe('Howling Den Resonance authoring', () => {
  it('keeps every normal monster and the boss on the authored profiles', () => {
    expect(MONSTERS['cavefang-wolf'].resonanceYield).toEqual({ air: 28 })
    expect(MONSTERS['razorclaw-lynx'].resonanceYield).toEqual({ air: 32 })
    expect(MONSTERS['corrupted-dire-wolf'].resonanceYield).toEqual({ air: 25, earth: 20 })
    expect(MONSTERS['bonehide-boar'].resonanceYield).toEqual({ earth: 36 })
    expect(MONSTERS['moonblind-jackal'].resonanceYield).toEqual({ air: 38, fire: 12 })
    expect(MONSTERS['den-stalker'].resonanceYield).toEqual({ air: 32, earth: 18 })
    expect(MONSTERS['corrupted-greatbear'].resonanceYield).toEqual({ earth: 110, air: 30 })
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

  it('keeps Broken Meridian sequence encounters Resonance-free except for the boss', () => {
    const dungeon = DUNGEONS['broken-meridian']
    expect(dungeon.encounterSequence).toEqual(['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade'])
    ;[...dungeon.monsterPool, ...(dungeon.encounterSequence ?? [])].forEach((monsterId) => expect(MONSTERS[monsterId].resonanceYield).toBeUndefined())
    expect(MONSTERS[dungeon.boss].resonanceYield).toEqual({ fire: 100, water: 100, earth: 100, air: 100 })
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
