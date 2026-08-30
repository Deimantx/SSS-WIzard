import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { buildSpellDetailPresentation, getInspectorInlineEffectRows, getSpellbookTooltipRows } from './spellDetailPresentation'

const row = (rows: ReturnType<typeof getSpellbookTooltipRows>, label: string) => rows.find((entry) => entry.label === label)

describe('spell detail presentation', () => {
  it('aggregates authored spell metadata and canonical effect rows', () => {
    const state = createInitialState()
    state.schools.fire.level = 3
    state.equipment.weapon = 'ember-staff'
    state.progress.spellRanks['fire-bolt'] = 1

    const detail = buildSpellDetailPresentation(state, 'fire-bolt', 1)
    const damage = detail.effects[0]
    const cardRows = getSpellbookTooltipRows(damage)
    const inlineRows = getInspectorInlineEffectRows(damage)

    expect(detail).toMatchObject({ spellId: 'fire-bolt', spellName: 'Fire Bolt', school: 'fire', rankLabel: 'Rank I', description: expect.any(String), manaCost: 12, cooldownLabel: '3.5s', autoCastFocus: 10, autoCastActive: false })
    expect(detail.effects).toHaveLength(1)
    expect(row(cardRows, 'Base Damage')?.value).toBe('28')
    expect(row(cardRows, 'Current Base Preview')?.value).toBe('34')
    expect(row(cardRows, 'Ember Staff')?.value).toBe('+20%')
    expect(cardRows.some((entry) => entry.label === 'Source')).toBe(false)
    expect(inlineRows.some((entry) => entry.label === 'Source')).toBe(false)
    expect(inlineRows.length).toBeLessThanOrEqual(6)
  })

  it('preserves every authored effect in the spell-level aggregate', () => {
    const state = createInitialState()

    expect(buildSpellDetailPresentation(state, 'frostbite', 1).effects.map((effect) => effect.category)).toEqual(['DAMAGE', 'CONTROL'])
    expect(buildSpellDetailPresentation(state, 'ignite', 1).effects.map((effect) => effect.category)).toEqual(['DAMAGE', 'DOT'])
    expect(buildSpellDetailPresentation(state, 'water-ward', 1).effects.map((effect) => effect.category)).toEqual(['BARRIER'])
    expect(buildSpellDetailPresentation(state, 'quickening', 1).effects.map((effect) => effect.category)).toEqual(['BUFF'])
  })
})
