import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { BALANCE } from '../../game/core/balance/balance'
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
    const originalLabels = damage.rows.map((entry) => entry.label)
    const cardRows = getSpellbookTooltipRows(damage)
    const inlineRows = getInspectorInlineEffectRows(damage)

    expect(detail).toMatchObject({ spellId: 'fire-bolt', spellName: 'Fire Bolt', school: 'fire', rankLabel: 'Rank I', description: expect.any(String), manaCost: 12, cooldownLabel: '3.5s', autoCastFocus: 10, autoCastActive: false })
    expect(detail.spellPower).toBe(BALANCE.player.baseSpellPower + 20)
    expect(detail.effects).toHaveLength(1)
    expect(row(cardRows, 'Scaling')?.value).toBe('60% Spell Power')
    expect(row(cardRows, 'Base Damage')?.value).toBe('42')
    expect(row(cardRows, 'Current Base Preview')).toBeUndefined()
    expect(row(cardRows, 'Ember Staff')?.value).toBe('+20%')
    expect(cardRows.some((entry) => entry.label === 'Source')).toBe(false)
    expect(inlineRows.some((entry) => entry.label === 'Source')).toBe(false)
    expect(inlineRows.length).toBeLessThanOrEqual(6)
    expect(damage.rows.map((entry) => entry.label)).toEqual(originalLabels)
  })

  it('keeps high-value rows visible for each effect family', () => {
    const state = createInitialState()
    const labels = (spellId: Parameters<typeof buildSpellDetailPresentation>[1], effectIndex: number) => getInspectorInlineEffectRows(buildSpellDetailPresentation(state, spellId, 1).effects[effectIndex]).map((entry) => entry.label)

    expect(labels('fire-bolt', 0)).toEqual(expect.arrayContaining(['Scaling', 'Base Damage', 'Damage Type', 'Target']))
    expect(labels('water-ward', 0)).toEqual(expect.arrayContaining(['Amount', 'Duration', 'Mode', 'Target']))
    expect(labels('fortify', 0)).toEqual(expect.arrayContaining(['Damage Taken', 'Duration', 'Target']))
    expect(labels('frostbite', 1)).toEqual(expect.arrayContaining(['Basic Attack Speed', 'Action Speed', 'Duration', 'Target']))
    expect(labels('ignite', 1)).toEqual(expect.arrayContaining(['Damage Per Tick', 'Tick Interval', 'Duration', 'Target']))
    expect(labels('shock-spark', 1)).toEqual(expect.arrayContaining(['Air Damage Taken', 'Duration', 'Target', 'Max Stacks', 'Applied Stacks']))
  })

  it('preserves every authored effect in the spell-level aggregate', () => {
    const state = createInitialState()

    expect(buildSpellDetailPresentation(state, 'frostbite', 1).effects.map((effect) => effect.category)).toEqual(['DAMAGE', 'CONTROL'])
    expect(buildSpellDetailPresentation(state, 'ignite', 1).effects.map((effect) => effect.category)).toEqual(['DAMAGE', 'DOT'])
    expect(buildSpellDetailPresentation(state, 'water-ward', 1).effects.map((effect) => effect.category)).toEqual(['BARRIER'])
    expect(buildSpellDetailPresentation(state, 'quickening', 1).effects.map((effect) => effect.category)).toEqual(['BUFF'])
  })
})
