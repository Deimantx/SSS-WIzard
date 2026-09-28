import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEquipmentStatSnapshot } from '../../presentation/equipment/equipmentReadModel'
import { getPlayerStatBreakdown } from './statContributionLedger'
import { generateSigil } from '../../systems/sigils/sigilGeneration'

describe('player stat contribution ledger', () => {
  it('uses readable ASCII operators in stat formulas shown at the end of breakdowns', () => {
    const state = createInitialState()
    const formulas = (['maxHealth', 'maxMana', 'spellPower', 'manaRegen'] as const).map((key) => getPlayerStatBreakdown(state, key).formulaLabel ?? '')

    expect(formulas.every((formula) => formula.includes('*'))).toBe(true)
    expect(formulas.join('')).not.toMatch(/[\u00c3\u00c2\u00e2]/)
  })
  it('attributes equipped Sigils and their activated set bonus while matching the sheet total', () => {
    const state = createInitialState()
    const first = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 1, forcedQuality: 'refined', rng: () => .5 })
    const second = generateSigil({ state, dungeonId: 'whispering-woods', enemyPower: 0, forcedTier: 1, forcedSetId: 'arcane', forcedSlot: 2, forcedQuality: 'refined', rng: () => .5 })
    state.sigils.equipped[1] = first.instanceId
    state.sigils.equipped[2] = second.instanceId

    second.secondaries = [{ statId: 'spellPower', rolls: [{ quality01: .5, rank: 0 }] }]
    const breakdown = getPlayerStatBreakdown(state, 'spellPower')
    const snapshot = getEquipmentStatSnapshot(state, state.equipment)

    expect(breakdown.finalValue).toBe(snapshot.spellPower)
    expect(breakdown.permanent.filter((source) => source.sourceType === 'sigil')).toHaveLength(2)
    expect(breakdown.permanent.some((source) => source.sourceType === 'sigil-set' && source.value === .08)).toBe(true)
    expect(breakdown.permanent.find((source) => source.sourceType === 'sigil-set')?.sourceLabel).toMatch(/ - \d+\/\d+/)
  })
})
