import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { applySpellPresetAction, createSpellPresetAction, saveSpellPresetAction } from '../../../store/actions/spellPresetActions'
import { spawnEnemy } from '../combat/combatRuntime'
import { doesCurrentAutoCastMatchPreset, getSpellEquipmentBonusPreview, getSpellPresetFocusBreakdown, getSpellPresetFocusProjection, normalizeSpellPresetState } from './index'

describe('spell preset foundation', () => {
  it('auto-selects the first saved usable preset and does not switch an existing selection', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'wind-blade': 1 }
    const firstId = createSpellPresetAction(state, 'First')
    expect(saveSpellPresetAction(state, { id: firstId, name: 'First', slots: [{ spellId: 'fire-bolt', autoCast: true }] })).toBe(true)
    expect(state.spellPresets.selectedPresetId).toBe(firstId)
    expect(state.activities.autoCastPriority).toEqual(['fire-bolt'])

    const secondId = createSpellPresetAction(state, 'Second')
    expect(saveSpellPresetAction(state, { id: secondId, name: 'Second', slots: [{ spellId: 'wind-blade', autoCast: true }] })).toBe(true)
    expect(state.spellPresets.selectedPresetId).toBe(firstId)
    expect(state.activities.autoCastPriority).toEqual(['fire-bolt'])
  })

  it('projects available and unavailable slots and reserves Focus only for AUTO slots', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.activities.autoCast['fire-bolt'] = true
    const projection = getSpellPresetFocusProjection(state, { slots: [{ spellId: 'flame-burst', autoCast: true }, { spellId: 'searing-touch', autoCast: false }] })
    expect(projection.validSpellIds).toEqual(['flame-burst'])
    expect(projection.unavailableSpellIds).toEqual(['searing-touch'])
    expect(projection.presetAutoCastFocus).toBe(30)
    expect(projection.nonAutoCastFocus).toBe(0)
    expect(projection.totalAfterApply).toBe(30)
    expect(projection.canApply).toBe(true)
  })

  it('selects a preset and replaces the compatibility Auto-Cast runtime outside battle', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Burst', slots: [{ spellId: 'flame-burst', autoCast: true }] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: true })
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
    expect(state.activities.autoCast['flame-burst']).toBe(true)
    expect(state.spellPresets.selectedPresetId).toBe('spell-preset-1')
  })

  it('rejects Focus overflow without changing selection or Auto-Cast state', () => {
    const state = createInitialState()
    state.player.maxFocus = 20
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCastPriority = ['fire-bolt']
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Too much', slots: [{ spellId: 'flame-burst', autoCast: true }] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: false, reason: 'focus', requiredExtraFocus: 10 })
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
    expect(state.activities.autoCast['flame-burst']).toBe(false)
    expect(state.spellPresets.selectedPresetId).toBeNull()
  })

  it('returns an empty result without disabling live Auto-Cast', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Empty', slots: [] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: false, reason: 'empty' })
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
  })

  it('selects available slots, keeps manual slots out of Auto-Cast, and reports unavailable slots', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.spellPresets.presets = [{ id: 'spell-preset-1', name: 'Partial', slots: [{ spellId: 'fire-bolt', autoCast: false }, { spellId: 'flame-burst', autoCast: true }] }]
    expect(applySpellPresetAction(state, 'spell-preset-1')).toMatchObject({ ok: true, unavailableSpellIds: ['flame-burst'] })
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
    expect(state.activities.autoCastPriority).toEqual([])
    expect(state.spellPresets.selectedPresetId).toBe('spell-preset-1')
  })

  it('breaks Focus into Auto-Cast, other systems, total, and free values', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCastPriority = ['fire-bolt']
    state.activities.channeling.echoesAssigned = 2
    expect(getSpellPresetFocusBreakdown(state)).toEqual({ autoCastFocus: 10, otherFocus: 20, totalFocus: 30, maxFocus: state.player.maxFocus, freeFocus: state.player.maxFocus - 30 })
    expect(doesCurrentAutoCastMatchPreset(state, { slots: [{ spellId: 'fire-bolt', autoCast: true }] })).toBe(true)
    expect(doesCurrentAutoCastMatchPreset(state, { slots: [] })).toBe(false)
  })

  it('normalizes names, duplicate IDs, legacy spellIds, canonical IDs, and selected markers', () => {
    const normalized = normalizeSpellPresetState({ lastAppliedPresetId: 'one', presets: [
      { id: 'one', name: '  Burst  ', spellIds: ['fire-bolt', 'fire-bolt', 'not-a-spell'] },
      { id: 'one', name: '', slots: [{ spellId: 'searing-touch', autoCast: false }] },
    ] })
    expect(normalized.presets).toEqual([
      { id: 'one', name: 'Burst', slots: [{ spellId: 'fire-bolt', autoCast: true }] },
      { id: 'spell-preset-1', name: 'New Preset', slots: [{ spellId: 'searing-touch', autoCast: false }] },
    ])
    expect(normalized.selectedPresetId).toBe('one')
  })

  it('does not infer selection from reordered or edited live runtime state', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'searing-touch': 1 }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCast['searing-touch'] = true
    state.activities.autoCastPriority = ['fire-bolt', 'searing-touch']
    expect(doesCurrentAutoCastMatchPreset(state, { slots: [{ spellId: 'fire-bolt', autoCast: true }, { spellId: 'searing-touch', autoCast: true }] })).toBe(true)
    expect(doesCurrentAutoCastMatchPreset(state, { slots: [{ spellId: 'searing-touch', autoCast: true }, { spellId: 'fire-bolt', autoCast: true }] })).toBe(false)
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

  it('falls back to the frozen current snapshot, keeps the pending selection, and retries later', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.player.maxFocus = 40
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3 }
    state.spellPresets.presets = [
      { id: 'spell-preset-a', name: 'A', slots: [{ spellId: 'fire-bolt', autoCast: true }] },
      { id: 'spell-preset-b', name: 'B', slots: [{ spellId: 'flame-burst', autoCast: true }] },
    ]
    state.spellPresets.selectedPresetId = 'spell-preset-a'
    expect(spawnEnemy(state, 'forest-wisp')).toBe(true)
    expect(applySpellPresetAction(state, 'spell-preset-b')).toMatchObject({ ok: true })
    state.player.maxFocus = 20
    state.combat.enemyId = null
    state.combat.queuedPlayerSpellId = 'fire-bolt'

    expect(spawnEnemy(state, 'thornling')).toBe(true)
    expect(state.combat.activeSpellLoadout?.presetId).toBe('spell-preset-a')
    expect(state.combat.activeSpellLoadout?.signature).toBe('fire-bolt:1')
    expect(state.activities.autoCastPriority).toEqual(['fire-bolt'])
    expect(state.combat.queuedPlayerSpellId).toBe('fire-bolt')
    expect(state.spellPresets.selectedPresetId).toBe('spell-preset-b')
    expect(state.notifications[state.notifications.length - 1]?.text).toBe('B could not activate — requires 10 more Focus. Continuing with A.')

    state.player.maxFocus = 40
    state.combat.enemyId = null
    expect(spawnEnemy(state, 'thornling')).toBe(true)
    expect(state.combat.activeSpellLoadout?.presetId).toBe('spell-preset-b')
    expect(state.combat.activeSpellLoadout?.signature).toBe('flame-burst:1')
    expect(state.activities.autoCastPriority).toEqual(['flame-burst'])
    expect(state.combat.queuedPlayerSpellId).toBeNull()
  })

  it('does not start the first encounter when the selected preset is over Focus', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.player.maxFocus = 20
    state.progress.spellRanks = { 'flame-burst': 3 }
    state.spellPresets.presets = [{ id: 'spell-preset-b', name: 'B', slots: [{ spellId: 'flame-burst', autoCast: true }] }]
    state.spellPresets.selectedPresetId = 'spell-preset-b'

    expect(spawnEnemy(state, 'forest-wisp')).toBe(false)
    expect(state.combat.activeSpellLoadout).toBeNull()
    expect(state.combat.enemyId).toBeNull()
  })

  it('synchronizes a valid selected preset save and preserves the live runtime for an over-Focus edit', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'wind-blade': 1, 'flame-burst': 3 }
    state.spellPresets.presets = [{ id: 'spell-preset-a', name: 'A', slots: [{ spellId: 'fire-bolt', autoCast: true }] }]
    state.spellPresets.selectedPresetId = 'spell-preset-a'
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCastPriority = ['fire-bolt']

    expect(saveSpellPresetAction(state, { id: 'spell-preset-a', name: 'A', slots: [{ spellId: 'fire-bolt', autoCast: false }, { spellId: 'wind-blade', autoCast: true }] })).toBe(true)
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
    expect(state.activities.autoCast['wind-blade']).toBe(true)
    expect(state.activities.autoCastPriority).toEqual(['wind-blade'])

    state.player.maxFocus = 20
    expect(saveSpellPresetAction(state, { id: 'spell-preset-a', name: 'A', slots: [{ spellId: 'flame-burst', autoCast: true }] })).toBe(true)
    expect(state.spellPresets.presets[0].slots).toEqual([{ spellId: 'flame-burst', autoCast: true }])
    expect(state.activities.autoCast['wind-blade']).toBe(true)
    expect(state.activities.autoCastPriority).toEqual(['wind-blade'])
  })
})
