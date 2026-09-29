import { beforeEach, describe, expect, it } from 'vitest'
import { createDefaultScenarioReadyPreset, createDefaultScenarioReadyPresetStore, readScenarioReadyPresetStore, resolveScenarioReadyPreset, SCENARIO_READY_PRESET_KEY, setScenarioReadyPreset, writeScenarioReadyPresetStore } from './scenarioReadyPresetStore'

describe('Developer Scenario Test Ready presets', () => {
  beforeEach(() => localStorage.clear())

  it('persists scenario overrides and keeps different scenarios independent', () => {
    const store = createDefaultScenarioReadyPresetStore()
    const forest = { ...createDefaultScenarioReadyPreset(), stats: { 'core.maxHealthFlat': 600 } }
    const nightglass = { ...createDefaultScenarioReadyPreset(), stats: { 'core.maxHealthFlat': 2500 } }
    const changed = setScenarioReadyPreset(setScenarioReadyPreset(store, { type: 'scenario', id: 'forest' }, forest), { type: 'scenario', id: 'nightglass' }, nightglass)
    expect(writeScenarioReadyPresetStore(changed)).toBe(true)
    const restored = readScenarioReadyPresetStore()
    expect(resolveScenarioReadyPreset(restored, 'Combat', 'forest').preset.stats['core.maxHealthFlat']).toBe(600)
    expect(resolveScenarioReadyPreset(restored, 'Hunter’s Order', 'nightglass').preset.stats['core.maxHealthFlat']).toBe(2500)
  })

  it('uses group defaults for inheriting scenarios while preserving direct overrides', () => {
    let store = createDefaultScenarioReadyPresetStore()
    store = setScenarioReadyPreset(store, { type: 'group', group: 'Hunter’s Order' }, { ...createDefaultScenarioReadyPreset(), stats: { 'core.spellPowerFlat': 420 } })
    store = setScenarioReadyPreset(store, { type: 'scenario', id: 'nightglass' }, { ...createDefaultScenarioReadyPreset(), stats: { 'core.spellPowerFlat': 900 } })
    expect(resolveScenarioReadyPreset(store, 'Hunter’s Order', 'veteran').preset.stats['core.spellPowerFlat']).toBe(420)
    expect(resolveScenarioReadyPreset(store, 'Hunter’s Order', 'nightglass').preset.stats['core.spellPowerFlat']).toBe(900)
    expect(resolveScenarioReadyPreset(store, 'Hunter’s Order', 'veteran').source).toBe('Hunter’s Order default')
  })

  it('allows a deliberately changed global default to flow to scenarios without group defaults', () => {
    const store = setScenarioReadyPreset(createDefaultScenarioReadyPresetStore(), { type: 'global' }, { ...createDefaultScenarioReadyPreset(), stats: { 'core.spellPowerFlat': 333 } })
    expect(resolveScenarioReadyPreset(store, 'Combat', 'forest', { ...createDefaultScenarioReadyPreset(), stats: { 'core.spellPowerFlat': 10 } }).preset.stats['core.spellPowerFlat']).toBe(333)
    expect(resolveScenarioReadyPreset(store, 'Combat', 'forest').source).toBe('Global default')
  })

  it('does not confuse Developer preferences with local game or Custom Scenario storage', () => {
    const store = createDefaultScenarioReadyPresetStore()
    writeScenarioReadyPresetStore(store)
    expect(Object.keys(localStorage)).toEqual([SCENARIO_READY_PRESET_KEY])
    expect(SCENARIO_READY_PRESET_KEY).not.toContain('save')
    expect(SCENARIO_READY_PRESET_KEY).not.toContain('scenarios')
  })
})
