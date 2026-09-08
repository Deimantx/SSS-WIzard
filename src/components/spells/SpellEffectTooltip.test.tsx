import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SpellCardTooltip } from './SpellCardTooltip'
import { SpellEffectTooltip } from './SpellEffectTooltip'
import { buildSpellDetailPresentation } from '../../game/presentation/spells/spellDetailPresentation'
import { buildSpellEffectTooltipModel, getCompactSpellEffectRows } from '../../game/presentation/spells/spellEffectTooltipModel'
import { createInitialState } from '../../store/initialState'
import { TooltipProvider } from '../ui/tooltip/Tooltip'

function igniteModel() {
  const state = createInitialState()
  state.equipment.weapon = 'ember-staff'
  state.artifactProgress['ember-staff'] = { level: 4, allocatedNodeIds: ['cinder-memory', 'lingering-flame', 'heartfed-embers'], attunedNodeIds: [] }
  return buildSpellEffectTooltipModel(state, 'ignite', 1)
}

describe('progressive Spell effect tooltip details', () => {
  it('keeps Ignite gameplay rows compact and reveals technical rows while Alt is held', () => {
    const model = igniteModel()
    const compactLabels = getCompactSpellEffectRows(model).map((row) => row.label)
    expect(compactLabels).toEqual(expect.arrayContaining(['Damage Per Tick', 'Total Damage', 'Duration', 'Tick Interval']))
    expect(compactLabels).not.toEqual(expect.arrayContaining(['Scaling', 'Base Damage Per Tick', 'Total Base Damage', 'Base Duration', 'Target', 'Source']))
    expect(model.rows.find((row) => row.label === 'Damage Per Tick')?.detailLevel).not.toBe('advanced')
    expect(model.rows.find((row) => row.label === 'Base Damage Per Tick')?.detailLevel).toBe('advanced')
    expect(model.rows.find((row) => row.label === 'Base Duration')?.detailLevel).toBe('advanced')
    expect(model.rows.filter((row) => row.label.startsWith('Conditional:')).every((row) => row.detailLevel === 'advanced')).toBe(true)

    render(<TooltipProvider><SpellEffectTooltip model={model} /></TooltipProvider>)
    expect(screen.getByText('Damage Per Tick')).toBeTruthy()
    expect(screen.getByText('Hold Alt for more details')).toBeTruthy()
    expect(screen.queryByText('Scaling')).toBeNull()
    expect(screen.queryByText('Base Damage Per Tick')).toBeNull()
    expect(screen.queryByText('Total Base Damage')).toBeNull()
    expect(screen.queryByText('Base Duration')).toBeNull()
    expect(screen.queryByText('Conditional: Fire Spell Damage')).toBeNull()

    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getAllByText('Scaling').length).toBeGreaterThan(0)
    expect(screen.getByText('Base Damage Per Tick')).toBeTruthy()
    expect(screen.getByText('Total Base Damage')).toBeTruthy()
    expect(screen.getByText('Base Duration')).toBeTruthy()
    expect(screen.getByText('Conditional: Fire Spell Damage')).toBeTruthy()
    expect(screen.queryByText('Hold Alt for more details')).toBeNull()

    fireEvent.keyUp(window, { key: 'Alt' })
    expect(screen.queryByText('Scaling')).toBeNull()
    expect(screen.getByText('Hold Alt for more details')).toBeTruthy()
  })

  it('keeps card casting essentials visible and uses one shared detail hint', () => {
    const state = createInitialState()
    const presentation = buildSpellDetailPresentation(state, 'ignite', 1)
    render(<TooltipProvider><SpellCardTooltip presentation={presentation} /></TooltipProvider>)

    expect(screen.getByText('MANA')).toBeTruthy()
    expect(screen.getByText('COOLDOWN')).toBeTruthy()
    expect(screen.getByText('AUTO-CAST FOCUS')).toBeTruthy()
    expect(screen.getByText('Damage Per Tick')).toBeTruthy()
    expect(screen.getAllByText('Hold Alt for more details')).toHaveLength(1)
    expect(screen.queryByText('Scaling')).toBeNull()

    fireEvent.keyDown(window, { key: 'Alt' })
    expect(screen.getAllByText('Scaling').length).toBeGreaterThan(0)
    expect(screen.queryByText('Hold Alt for more details')).toBeNull()
  })
})
