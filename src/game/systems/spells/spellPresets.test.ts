import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { applySpellPresetAction } from '../../../store/actions/spellPresetActions'
import { doesCurrentAutoCastMatchPreset, getSpellEquipmentBonusPreview, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, normalizeSpellPresetState } from './index'

describe('spell preset foundation', () => {
  it('projects available and unavailable spells against non-Auto-Cast Focus', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, fireball: 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCast.ignite = false
    const projection = getSpellPresetFocusProjection(state, { spellIds: ['fireball', 'ignite'] })
    expect(projection.validSpellIds).toEqual(['fireball'])
    expect(projection.unavailableSpellIds).toEqual(['ignite'])
    expect(projection.presetAutoCastFocus).toBe(30)
    expect(projection.nonAutoCastFocus).toBe(0)
    expect(projection.totalAfterApply).toBe(30)
    expect(projection.canApply).toBe(true)
  })

  it('applies atomically and replaces the live Auto-Cast selection', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, fireball: 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Burst', spellIds: ['fireball'] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: true })
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
    expect(state.activities.autoCast.fireball).toBe(true)
    expect(state.spellPresets.lastAppliedPresetId).toBe('spell-preset-1')
  })

  it('rejects Focus overflow without changing Auto-Cast state', () => {
    const state = createInitialState()
    state.player.maxFocus = 20
    state.progress.spellRanks = { 'fire-bolt': 1, fireball: 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Too much', spellIds: ['fireball'] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: false, reason: 'focus', requiredExtraFocus: 10 })
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
    expect(state.activities.autoCast.fireball).toBe(false)
    expect(state.spellPresets.lastAppliedPresetId).toBeNull()
  })

  it('returns an empty result without disabling live Auto-Cast', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Empty', spellIds: [] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: false, reason: 'empty' })
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
  })

  it('keeps partial preset loads CUSTOM and reports unavailable spells', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Partial', spellIds: ['fire-bolt', 'fireball'] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: true, unavailableSpellIds: ['fireball'] })
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
    expect(state.spellPresets.lastAppliedPresetId).toBeNull()
  })

  it('breaks Focus into Auto-Cast, other systems, total, and free values', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.channeling.echoesAssigned = 2
    expect(getSpellPresetFocusBreakdown(state)).toEqual({ autoCastFocus: 10, otherFocus: 20, totalFocus: 30, maxFocus: state.player.maxFocus, freeFocus: state.player.maxFocus - 30 })
    expect(doesCurrentAutoCastMatchPreset(state, { spellIds: ['fire-bolt'] })).toBe(true)
    expect(doesCurrentAutoCastMatchPreset(state, { spellIds: [] })).toBe(false)
  })

  it('normalizes names, duplicate IDs, duplicate spell IDs, invalid IDs, and stale applied markers', () => {
    const state = createInitialState()
    state.activities.autoCast['fire-bolt'] = true
    const normalized = normalizeSpellPresetState({ lastAppliedPresetId: 'one', presets: [
      { id: 'one', name: '  Burst  ', spellIds: ['fire-bolt', 'fire-bolt', 'not-a-spell'] },
      { id: 'one', name: '', spellIds: ['ignite'] },
    ] }, state.activities.autoCast)
    expect(normalized.presets).toEqual([
      { id: 'one', name: 'Burst', spellIds: ['fire-bolt'] },
      { id: 'spell-preset-1', name: 'New Preset', spellIds: ['ignite'] },
    ])
    expect(normalized.lastAppliedPresetId).toBe('one')
  })

  it('reads only effect-relevant current equipment modifiers from authored item stats', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.equipment.offhand = 'tide-focus'
    state.equipment.amulet = 'windthread-charm'
    expect(getSpellEquipmentBonusPreview(state, 'fireball').current).toMatchObject([{ itemId: 'ember-staff', value: 0.2 }])
    expect(getSpellEquipmentBonusPreview(state, 'water-ward').current).toMatchObject([{ itemId: 'tide-focus', value: 0.2 }])
    expect(getSpellEquipmentBonusPreview(state, 'frostbite').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'flow-mend').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'air-lance').current).toMatchObject([{ itemId: 'windthread-charm', value: 0.1 }])
    expect(getSpellEquipmentBonusPreview(state, 'quickening').current).toEqual([])
  })
})
