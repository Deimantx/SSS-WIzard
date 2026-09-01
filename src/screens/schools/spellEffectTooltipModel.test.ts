import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { buildSpellEffectTooltipModel } from './spellEffectTooltipModel'

const row = (model: ReturnType<typeof buildSpellEffectTooltipModel>, label: string) => model.rows.find((entry) => entry.label === label)

describe('spell effect tooltip models', () => {
  it('uses authored Spell Power scaling and equipment preview for damage', () => {
    const state = createInitialState()
    state.schools.fire.level = 3
    state.equipment.weapon = 'ember-staff'
    const model = buildSpellEffectTooltipModel(state, 'fire-bolt', 0)

    expect(model).toMatchObject({ category: 'DAMAGE', title: 'Fire Damage', description: 'Deals Fire damage when this Spell resolves.' })
    expect(row(model, 'Scaling')?.value).toBe('60% Spell Power')
    expect(row(model, 'Base Damage')?.value).toBe('72')
    expect(row(model, 'School Scaling')).toBeUndefined()
    expect(row(model, 'Current School Level')).toBeUndefined()
    expect(row(model, 'Current Base Preview')).toBeUndefined()
    expect(row(model, 'Ember Staff')).toMatchObject({ value: '+20%', semantic: 'positive' })
    expect(row(model, 'Target')?.value).toBe('Enemy')
    expect(row(model, 'Source')?.value).toBe('Fire Bolt')
  })

  it('exposes canonical status mechanics for buffs, control, damage over time, and stacks', () => {
    const state = createInitialState()
    const fortified = buildSpellEffectTooltipModel(state, 'fortify', 0)
    const chilled = buildSpellEffectTooltipModel(state, 'frostbite', 1)
    const burning = buildSpellEffectTooltipModel(state, 'ignite', 1)
    const shock = buildSpellEffectTooltipModel(state, 'shock-spark', 1)

    expect(fortified).toMatchObject({ category: 'BUFF', title: 'Fortified' })
    expect(row(fortified, 'Damage Taken')?.value).toBe('-15%')
    expect(row(fortified, 'Duration')?.value).toBe('8.0s')
    expect(chilled).toMatchObject({ category: 'CONTROL', title: 'Chilled' })
    expect(row(chilled, 'Basic Attack Speed')?.value).toBe('-20%')
    expect(row(chilled, 'Action Speed')?.value).toBe('-20%')
    expect(row(chilled, 'Duration')?.value).toBe('5.0s')
    expect(burning).toMatchObject({ category: 'DOT', title: 'Burning' })
    expect(row(burning, 'Damage Per Tick')?.value).toBe('16.7')
    expect(row(burning, 'Tick Interval')?.value).toBe('1.0s')
    expect(row(shock, 'Air Damage Taken')?.value).toBe('+4% per stack')
    expect(row(shock, 'Max Stacks')?.value).toBe('5')
  })

  it('shows barrier duration, mode, target, source, and safe barrier equipment contribution', () => {
    const state = createInitialState()
    state.equipment.offhand = 'tide-focus'
    const model = buildSpellEffectTooltipModel(state, 'water-ward', 0)

    expect(model).toMatchObject({ category: 'BARRIER', title: 'Barrier' })
    expect(row(model, 'Scaling')?.value).toBe('70% Spell Power')
    expect(row(model, 'Amount')?.value).toBe('80.5')
    expect(row(model, 'Duration')?.value).toBe('9.0s')
    expect(row(model, 'Mode')?.value).toBe('Replace')
    expect(row(model, 'Tide Focus')).toMatchObject({ value: '+20%', semantic: 'positive' })
    expect(row(model, 'Target')?.value).toBe('Self')
    expect(row(model, 'Source')?.value).toBe('Water Ward')
  })
})
