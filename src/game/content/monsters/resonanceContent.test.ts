import { describe, expect, it } from 'vitest'
import { COMBAT_LOCATIONS } from '../combat-locations/worldNavigation'
import { RESONANCE_TYPES } from '../resonance/resonance'
import { MONSTERS } from './index'

const expectedYield = (monsterId: keyof typeof MONSTERS, authored: Record<string, number> | undefined) => {
  const monster = MONSTERS[monsterId]
  if (monster.primaryAffinity !== 'arcane' || authored?.arcane) return authored
  const strongestSecondary = Math.max(0, ...Object.values(authored ?? {}))
  return { ...authored, arcane: Math.max(10, Math.ceil(strongestSecondary * 1.25)) }
}

describe('Whispering Woods Resonance authoring', () => {
  it('authors a valid non-empty profile for every normal-pool enemy and its boss', () => {
    const dungeon = COMBAT_LOCATIONS['whispering-woods']
    ;[...dungeon.monsterPool, dungeon.boss!].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield
      expect(profile, `${monsterId} should have a Resonance profile`).toBeTruthy()
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
    'flooded-reliquary',
    'ashen-watch',
    'rootscar-hollow',
  ] as const)('keeps valid authored profiles for the current %s roster and boss', (locationId) => {
    const dungeon = COMBAT_LOCATIONS[locationId]
    ;[...dungeon.monsterPool, dungeon.boss!].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield
      expect(profile, `${monsterId} should keep its authored Resonance profile`).toBeTruthy()
      Object.entries(profile ?? {}).forEach(([type, amount]) => {
        expect(RESONANCE_TYPES).toContain(type)
        expect(Number.isSafeInteger(amount)).toBe(true)
        expect(amount).toBeGreaterThan(0)
      })
    })
  })

  it('keeps current sequence monster Resonance profiles valid while rewarding dungeon bosses', () => {
    for (const locationId of ['fractured-approach', 'crossroads-of-ruin'] as const) {
      const dungeon = COMBAT_LOCATIONS[locationId]
      ;[...dungeon.monsterPool, ...(dungeon.encounterSequence ?? [])].forEach((monsterId) => {
        Object.entries(MONSTERS[monsterId].resonanceYield ?? {}).forEach(([type, amount]) => {
          expect(RESONANCE_TYPES).toContain(type)
          expect(Number.isSafeInteger(amount)).toBe(true)
          expect(amount).toBeGreaterThan(0)
        })
      })
    }
    expect(MONSTERS['corrupted-elemental-gatekeeper'].resonanceYield).toEqual(expectedYield('corrupted-elemental-gatekeeper', { fire: 50, water: 50, earth: 50, air: 50 }))
    expect(MONSTERS['crossroads-keeper'].resonanceYield).toEqual(expectedYield('crossroads-keeper', { fire: 75, water: 75, earth: 75, air: 75 }))
  })

  it('authors the progression boss multi-element Resonance yields', () => {
    expect(MONSTERS['archmage-edrin-shade'].resonanceYield).toEqual(expectedYield('archmage-edrin-shade', { fire: 40, water: 40, earth: 40, air: 40 }))
    expect(MONSTERS['meridian-splitter'].resonanceYield).toEqual(expectedYield('meridian-splitter', { fire: 100, water: 100, earth: 100, air: 100 }))
    expect(MONSTERS['black-gatekeeper'].resonanceYield).toEqual(expectedYield('black-gatekeeper', { fire: 150, water: 150, earth: 150, air: 150 }))
  })
})

describe('Howling Den Resonance authoring', () => {
  it('keeps every normal monster and the boss on the authored profiles', () => {
    expect(MONSTERS['cavefang-wolf'].resonanceYield).toEqual({ air: 28 })
    expect(MONSTERS['razorclaw-lynx'].resonanceYield).toEqual({ air: 32 })
    expect(MONSTERS['corrupted-dire-wolf'].resonanceYield).toEqual(expectedYield('corrupted-dire-wolf', { air: 25, earth: 20 }))
    expect(MONSTERS['bonehide-boar'].resonanceYield).toEqual({ earth: 36 })
    expect(MONSTERS['moonblind-jackal'].resonanceYield).toEqual(expectedYield('moonblind-jackal', { air: 38, fire: 12 }))
    expect(MONSTERS['den-stalker'].resonanceYield).toEqual({ air: 32, earth: 18 })
    expect(MONSTERS['corrupted-greatbear'].resonanceYield).toEqual({ earth: 110, air: 30 })
  })
})

describe('Shattered Meridian Resonance authoring', () => {
  it.each([
    ['graveglass-hollow', { earth: 34 }],
    ['stormvault-gallery', { air: 38 }],
    ['starfallen-observatory', { arcane: 35, air: 28, fire: 18 }],
  ] as const)('authors the requested resonance progression for %s', (locationId, firstProfile) => {
    const dungeon = COMBAT_LOCATIONS[locationId]
    expect(MONSTERS[dungeon.monsterPool[0]].resonanceYield).toEqual(expectedYield(dungeon.monsterPool[0], firstProfile))
    ;[...dungeon.monsterPool, dungeon.boss!].forEach((monsterId) => {
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
    const dungeon = COMBAT_LOCATIONS['broken-meridian']
    expect(dungeon.encounterSequence).toEqual(['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade', 'sepulcher-flamekeeper'])
    expect(dungeon.sequenceBossIds).toEqual(['sepulcher-flamekeeper'])
    ;[...dungeon.monsterPool, ...(dungeon.encounterSequence ?? []).filter((monsterId) => !dungeon.sequenceBossIds?.includes(monsterId))].forEach((monsterId) => {
      Object.entries(MONSTERS[monsterId].resonanceYield ?? {}).forEach(([type, amount]) => {
        expect(RESONANCE_TYPES).toContain(type)
        expect(Number.isSafeInteger(amount)).toBe(true)
        expect(amount).toBeGreaterThan(0)
      })
    })
    dungeon.sequenceBossIds?.forEach((monsterId) => expect(Object.keys(MONSTERS[monsterId].resonanceYield ?? {}).length).toBeGreaterThan(0))
    expect(MONSTERS[dungeon.boss!].resonanceYield).toEqual(expectedYield(dungeon.boss!, { fire: 100, water: 100, earth: 100, air: 100 }))
  })
})

describe('Black Sigil Reach Resonance authoring', () => {
  it.each([
    ['hall-of-unbound-names', { air: 36, water: 24 }, { water: 125, air: 100, arcane: 100 }],
    ['vault-of-the-black-sigil', { earth: 44, fire: 20 }, { earth: 110, fire: 110 }],
  ] as const)('authors the requested mixed profile progression for %s', (locationId, firstProfile, bossProfile) => {
    const dungeon = COMBAT_LOCATIONS[locationId]
    expect(MONSTERS[dungeon.monsterPool[0]].resonanceYield).toEqual(expectedYield(dungeon.monsterPool[0], firstProfile))
    expect(MONSTERS[dungeon.boss!].resonanceYield).toEqual(expectedYield(dungeon.boss!, bossProfile))
    ;[...dungeon.monsterPool, dungeon.boss!].forEach((monsterId) => {
      const profile = MONSTERS[monsterId].resonanceYield ?? {}
      expect(Object.keys(profile).every((type) => RESONANCE_TYPES.includes(type as typeof RESONANCE_TYPES[number]))).toBe(true)
      expect(profile).not.toHaveProperty('life')
    })
  })
})
