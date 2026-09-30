import { describe, expect, it } from 'vitest'
import { MONSTERS } from './index'
import { getTraitDefinitions } from '../traits/traits'
import { resolveEnemyPowerRating } from '../../systems/combat/enemyPower'

describe('Gloamridge quarry combat identities', () => {
  it('gives each normal Hunter target a lightweight, distinct combat mechanic', () => {
    const ashen = MONSTERS['ashen-tracker']
    const gloamfang = MONSTERS['gloamfang-stalker']
    const runeHorn = MONSTERS['runehorn-brute']

    expect(ashen.traitIds).toContain('ashen-tracker-pursuit')
    expect(ashen.actions['trail-rake'].effects.some((effect) => effect.type === 'apply-status' && effect.statusId === 'bleeding')).toBe(true)
    expect(gloamfang.traitIds).toContain('gloamfang-shadowstep')
    expect(gloamfang.actions['shadow-pounce'].effects.some((effect) => effect.type === 'apply-status' && effect.statusId === 'vulnerable')).toBe(true)
    expect(runeHorn.traitIds).toContain('runehorn-leyplate')
    expect(runeHorn.actions['rune-charge'].effects.some((effect) => effect.type === 'apply-status' && effect.statusId === 'chilled')).toBe(true)
  })

  it('makes Nightglass Alpha a prestigious normal quarry with one ordinary action pattern', () => {
    const alpha = MONSTERS['nightglass-alpha']
    const traits = getTraitDefinitions(alpha.traitIds)

    expect(alpha).toMatchObject({ bestiaryCategory: 'monster', maxHealth: 1000, basicAttackDamage: expect.closeTo(40.13, 2), basicAttackTimeMs: 1950, defense: 28, hunter: { contractTier: 'prestigious', minimumRank: 'master-hunter' } })
    expect(alpha.actionPatterns.frenzy).toBeUndefined()
    expect(alpha.actions['shadow-mark']).toBeDefined()
    expect(alpha.actions['alpha-pounce']).toBeDefined()
    expect(traits.map((trait) => trait.id)).not.toEqual(expect.arrayContaining(['nightglass-alpha-hide', 'nightglass-alpha-frenzy']))

    const greatbearPower = resolveEnemyPowerRating('corrupted-greatbear', 1)
    const alphaPower = resolveEnemyPowerRating('nightglass-alpha', 1)
    const edrinPower = resolveEnemyPowerRating('archmage-edrin-shade', 1)
    expect(alphaPower).toBe(1500)
    expect(edrinPower).toBeGreaterThan(alphaPower)
  })
})
