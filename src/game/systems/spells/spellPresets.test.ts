import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { applySpellPresetAction } from '../../../store/actions/spellPresetActions'
import { doesCurrentAutoCastMatchPreset, getSpellEquipmentBonusPreview, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, normalizeSpellPresetState } from './index'

describe('spell preset foundation', () => {
  it('projects available and unavailable spells against non-Auto-Cast Focus', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCast.ignite = false
    const projection = getSpellPresetFocusProjection(state, { spellIds: ['flame-burst', 'searing-touch'] })
    expect(projection.validSpellIds).toEqual(['flame-burst'])
    expect(projection.unavailableSpellIds).toEqual(['searing-touch'])
    expect(projection.presetAutoCastFocus).toBe(30)
    expect(projection.nonAutoCastFocus).toBe(0)
    expect(projection.totalAfterApply).toBe(30)
    expect(projection.canApply).toBe(true)
  })

  it('applies atomically and replaces the live Auto-Cast selection', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Burst', spellIds: ['flame-burst'] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: true })
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
    expect(state.activities.autoCast['flame-burst']).toBe(true)
    expect(state.spellPresets.lastAppliedPresetId).toBe('spell-preset-1')
  })

  it('rejects Focus overflow without changing Auto-Cast state', () => {
    const state = createInitialState()
    state.player.maxFocus = 20
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Too much', spellIds: ['flame-burst'] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: false, reason: 'focus', requiredExtraFocus: 10 })
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
    expect(state.activities.autoCast['flame-burst']).toBe(false)
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
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Partial', spellIds: ['fire-bolt', 'flame-burst'] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: true, unavailableSpellIds: ['flame-burst'] })
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
      { id: 'one', name: '', spellIds: ['searing-touch'] },
    ] }, state.activities.autoCast, ['fire-bolt'])
    expect(normalized.presets).toEqual([
      { id: 'one', name: 'Burst', spellIds: ['fire-bolt'] },
      { id: 'spell-preset-1', name: 'New Preset', spellIds: ['searing-touch'] },
    ])
    expect(normalized.lastAppliedPresetId).toBe('one')
  })

  it('clears the applied marker when the live Auto-Cast order differs from the preset order', () => {
    const state = createInitialState()
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCast['searing-touch'] = true
    const normalized = normalizeSpellPresetState({ lastAppliedPresetId: 'one', presets: [
      { id: 'one', name: 'Ordered', spellIds: ['fire-bolt', 'searing-touch'] },
    ] }, state.activities.autoCast, ['fire-bolt', 'searing-touch'])
    expect(normalized.lastAppliedPresetId).toBe('one')

    const reordered = normalizeSpellPresetState({ lastAppliedPresetId: 'one', presets: [
      { id: 'one', name: 'Ordered', spellIds: ['fire-bolt', 'searing-touch'] },
    ] }, state.activities.autoCast, ['searing-touch', 'fire-bolt'])
    expect(reordered.lastAppliedPresetId).toBeNull()
  })

  it('reads only effect-relevant current equipment modifiers from authored item stats', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    expect(getSpellEquipmentBonusPreview(state, 'flame-burst').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'water-bolt').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'frost-touch').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'mending-waters').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'wind-blade').current).toEqual([])
    expect(getSpellEquipmentBonusPreview(state, 'tailwind').current).toEqual([])
  })
})
