import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { resolveWorldTierEnemyProfile } from '../../systems/world-tier/worldTierRuntime'
import { getDefenseReductionFromRating } from '../../systems/combat/combatStats'
import { resolveEnemyPowerBreakdown, resolveEnemyPowerRating, roundToNearest5 } from './enemyPowerRating'

describe('enemy Power rating', () => {
  it('uses resolved health, damage, canonical defense reduction, and basic attack time', () => {
    const monsterId = 'forest-wisp' as const
    const monster = MONSTERS[monsterId]
    const profile = resolveWorldTierEnemyProfile(monsterId, 1)
    const defenseReduction = getDefenseReductionFromRating(profile.defense)
    const effectiveHealth = profile.maxHealth / Math.max(0.01, 1 - defenseReduction)
    const basicDps = profile.basicAttackDamage / Math.max(0.1, monster.basicAttackTimeMs / 1000)
    const expected = Math.max(1, roundToNearest5(Math.sqrt(effectiveHealth * basicDps) * 10))
    const breakdown = resolveEnemyPowerBreakdown(monsterId, 1)

    expect(breakdown).toMatchObject({ defenseReduction, effectiveHealth, basicDps, power: expected })
  })

  it('increases naturally across every authored World Tier', () => {
    const ratings = [1, 2, 3, 4, 5].map((tier) => resolveEnemyPowerRating('forest-wisp', tier as 1 | 2 | 3 | 4 | 5))
    expect(ratings.every(Number.isFinite)).toBe(true)
    expect(ratings).toEqual([...ratings].sort((left, right) => left - right))
    expect(ratings[4]).toBeGreaterThan(ratings[0])
  })

  it('keeps attack speed in the offensive component and defense in effective health', () => {
    const breakdown = resolveEnemyPowerBreakdown('cinder-moth', 1)
    const profile = resolveWorldTierEnemyProfile('cinder-moth', 1)
    const monster = MONSTERS['cinder-moth']
    expect(breakdown.basicDps).toBe(profile.basicAttackDamage / (monster.basicAttackTimeMs / 1000))
    expect(breakdown.effectiveHealth).toBeGreaterThan(profile.maxHealth)
  })

  it('stays finite and positive for every authored monster at every World Tier', () => {
    Object.keys(MONSTERS).forEach((monsterId) => {
      const ratings = [1, 2, 3, 4, 5].map((tier) => resolveEnemyPowerRating(monsterId as keyof typeof MONSTERS, tier as 1 | 2 | 3 | 4 | 5))
      expect(ratings.every((rating) => Number.isFinite(rating) && rating > 0), monsterId).toBe(true)
    })
  })
})
