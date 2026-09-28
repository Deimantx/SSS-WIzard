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

  it('makes Nightglass Alpha a marked, phased Apex whose Power sits between Greatbear and Edrin', () => {
    const alpha = MONSTERS['nightglass-alpha']
    const traits = getTraitDefinitions(alpha.traitIds)

    expect(alpha.actionPatterns.frenzy).toBeDefined()
    expect(alpha.actions['shadow-mark']).toBeDefined()
    expect(alpha.actions['alpha-pounce']).toBeDefined()
    expect(traits.some((trait) => trait.id === 'nightglass-alpha-hide' && trait.modifiers?.some((modifier) => modifier.key === 'damage-taken-percent'))).toBe(true)
    expect(traits.some((trait) => trait.id === 'nightglass-alpha-frenzy' && trait.rules?.some((rule) => rule.effects.some((effect) => effect.type === 'set-action-pattern' && effect.patternId === 'frenzy')))).toBe(true)

    const greatbearPower = resolveEnemyPowerRating('corrupted-greatbear', 1)
    const alphaPower = resolveEnemyPowerRating('nightglass-alpha', 1)
    const edrinPower = resolveEnemyPowerRating('archmage-edrin-shade', 1)
    expect(alphaPower).toBeGreaterThan(greatbearPower)
    expect(alphaPower).toBeLessThan(edrinPower)
  })
})
