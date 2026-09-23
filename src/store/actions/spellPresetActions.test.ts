import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { addSpellToSelectedPresetAction, moveSelectedPresetSlotAction, removeSpellFromSelectedPresetAction } from './spellPresetActions'

describe('selected combat loadout actions', () => {
  it('creates the default loadout and preserves ordered slot mutations', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'water-bolt': 1 }

    expect(addSpellToSelectedPresetAction(state, 'fire-bolt')).toEqual({ ok: true })
    expect(addSpellToSelectedPresetAction(state, 'water-bolt')).toEqual({ ok: true })
    expect(state.spellPresets.presets[0]).toMatchObject({ name: 'Combat Loadout', slots: [{ spellId: 'fire-bolt' }, { spellId: 'water-bolt' }] })
    expect(addSpellToSelectedPresetAction(state, 'fire-bolt')).toEqual({ ok: false, reason: 'duplicate' })

    expect(moveSelectedPresetSlotAction(state, 1, 0)).toEqual({ ok: true })
    expect(state.spellPresets.presets[0].slots.map((slot) => slot.spellId)).toEqual(['water-bolt', 'fire-bolt'])
    expect(removeSpellFromSelectedPresetAction(state, 'water-bolt')).toEqual({ ok: true })
    expect(state.spellPresets.presets[0].slots.map((slot) => slot.spellId)).toEqual(['fire-bolt'])
  })

  it('rejects unavailable spells without creating a preset', () => {
    const state = createInitialState()
    expect(addSpellToSelectedPresetAction(state, 'fire-bolt')).toEqual({ ok: false, reason: 'unavailable' })
    expect(state.spellPresets.presets).toHaveLength(0)
    expect(moveSelectedPresetSlotAction(state, 0, 1)).toEqual({ ok: false, reason: 'missing-preset' })
    expect(removeSpellFromSelectedPresetAction(state, 'fire-bolt')).toEqual({ ok: false, reason: 'missing-preset' })
  })
})
