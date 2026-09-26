import { describe, expect, it } from 'vitest'
import { SPELLS } from './spells'

const targets = { fire: 10, earth: 9, air: 8, water: 7 } as const

describe('authored spell Mana budgets', () => {
  it('preserves starter costs and keeps each school near its target demand', () => {
    const starterCosts = { fire: 15, water: 10, earth: 12, air: 10 } as const
    const demand = (spell: (typeof SPELLS)[keyof typeof SPELLS]) => spell.manaCost / (spell.cooldownMs / 1000)

    for (const school of Object.keys(targets) as Array<keyof typeof targets>) {
      const spells = Object.values(SPELLS).filter((spell) => spell.school === school)
      const starter = spells.find((spell) => spell.unlockLevel === 0)
      expect(starter?.manaCost).toBe(starterCosts[school])
      expect(spells.filter((spell) => spell.unlockLevel > 0).every((spell) => spell.manaCost <= 100)).toBe(true)
      expect(spells.filter((spell) => spell.unlockLevel > 0).every((spell) => spell.manaCost >= 5 && spell.manaCost % 5 === 0)).toBe(true)
      const totalDemand = spells.reduce((total, spell) => total + demand(spell), 0)
      expect(Math.abs(totalDemand - targets[school])).toBeLessThanOrEqual(0.25)
    }
  })
})
