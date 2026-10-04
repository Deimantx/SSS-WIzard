import { describe, expect, it } from 'vitest'
import { MONSTERS, MONSTER_IDS } from '../../content/monsters'
import { getDefenseReductionFromRating } from '../../systems/combat/combatStats'
import { resolveEnemyPowerBreakdown, resolveEnemyPowerRating, roundToNearest5 } from './enemyPowerRating'

describe('canonical enemy Power rating', () => {
  it('uses authored health, damage, defense, and attack time', () => {
    const monster = MONSTERS['forest-wisp']
    const defenseReduction = getDefenseReductionFromRating(monster.defense ?? 0)
    const effectiveHealth = monster.maxHealth / Math.max(0.01, 1 - defenseReduction)
    const basicDps = monster.basicAttackDamage / (monster.basicAttackTimeMs / 1000)
    const expected = Math.max(1, roundToNearest5(Math.sqrt(effectiveHealth * basicDps) * 10))
    expect(resolveEnemyPowerBreakdown(monster.id)).toMatchObject({ defenseReduction, effectiveHealth, basicDps, power: expected })
  })
  it('returns one finite, positive profile per authored monster', () => {
    for (const monsterId of MONSTER_IDS) expect(resolveEnemyPowerRating(monsterId)).toBeGreaterThan(0)
  })
})
