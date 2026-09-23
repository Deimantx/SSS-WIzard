import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { addSpellToSelectedPresetAction, applyPresetSlotAutomationAction, moveSelectedPresetSlotAction, removeSpellFromSelectedPresetAction, setPresetSlotAutoCastAction, setPresetSlotAutomationAction } from './spellPresetActions'

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

  it('persists per-slot automation separately from loadout order and mode', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    expect(addSpellToSelectedPresetAction(state, 'fire-bolt')).toEqual({ ok: true })
    const preset = state.spellPresets.presets[0]
    expect(setPresetSlotAutomationAction(state, preset.id, 'fire-bolt', { conditions: [{ type: 'mana', operator: 'below', percent: 25 }], targetRule: 'current-enemy' })).toBe(true)
    expect(setPresetSlotAutoCastAction(state, preset.id, 'fire-bolt', true)).toBe(true)
    expect(preset.slots[0]).toMatchObject({ autoCast: true, automation: { conditions: [{ type: 'mana', operator: 'below', percent: 25 }], targetRule: 'current-enemy' } })
    expect(state.activities.autoCastPriority).toEqual(['fire-bolt'])
  })

  it('keeps authored automation when a newly added slot starts in Manual mode', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'earthen-barrier': 1 }

    expect(addSpellToSelectedPresetAction(state, 'earthen-barrier')).toEqual({ ok: true })
    expect(state.spellPresets.presets[0].slots[0].automation).toMatchObject({ conditions: [{ type: 'player-barrier-below', value: 10 }] })
  })

  it('applies AUTO and automation atomically when Focus rejects the change', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.player.maxFocus = 0
    expect(addSpellToSelectedPresetAction(state, 'fire-bolt')).toEqual({ ok: true })
    const preset = state.spellPresets.presets[0]

    const result = applyPresetSlotAutomationAction(state, preset.id, 'fire-bolt', { conditions: [{ type: 'always' }], targetRule: 'current-enemy' }, true)
    expect(result).toMatchObject({ ok: false, reason: 'focus' })
    expect(preset.slots[0]).toMatchObject({ autoCast: false })
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
  })
})
