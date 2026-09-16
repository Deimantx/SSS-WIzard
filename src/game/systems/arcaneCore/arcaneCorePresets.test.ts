import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialArcaneCoreState } from './arcaneCoreProgression'
import { applyArcaneCorePreset, getArcaneCorePresetSummary, validateArcaneCorePreset, MAX_RUNTIME_PRESETS } from './arcaneCorePresets'
import { getArcaneCorePreset, getArcaneCorePresetSnapshot, useArcaneCorePresetStore } from '../../../store/arcaneCorePresetStore'
import type { ArcaneCoreState } from '../../types'

const stateWithStarter = (totalXp = 100): ArcaneCoreState => ({ totalXp, nodes: { 'power-a1': { purchased: true } } })
const create = (name: string, state = createInitialArcaneCoreState()) => useArcaneCorePresetStore.getState().create(name, state)

describe('Arcane Core V2 runtime presets', () => {
  beforeEach(() => useArcaneCorePresetStore.getState().reset())

  it('starts empty and creates multiple named presets with stable IDs', () => {
    expect(useArcaneCorePresetStore.getState().presets).toEqual([])
    const first = create(' Power route ')
    const second = create('Defensive route')
    expect(first).toMatchObject({ ok: true })
    expect(second).toMatchObject({ ok: true })
    if (!first.ok || !second.ok) return
    expect(first.presetId).not.toBe(second.presetId)
    expect(useArcaneCorePresetStore.getState().presets.map((preset) => preset.id)).toEqual([first.presetId, second.presetId])
    expect(getArcaneCorePreset(first.presetId)?.name).toBe('Power route')
  })

  it('rejects invalid names and enforces the maximum length', () => {
    expect(create('   ')).toEqual({ ok: false, reason: 'invalid-name' })
    const longName = create('x'.repeat(40))
    expect(longName).toMatchObject({ ok: true })
    if (longName.ok) expect(getArcaneCorePreset(longName.presetId)?.name).toHaveLength(32)
    for (let index = useArcaneCorePresetStore.getState().presets.length; index < MAX_RUNTIME_PRESETS; index += 1) expect(create(`Preset ${index}`)).toMatchObject({ ok: true })
    expect(create('One too many')).toEqual({ ok: false, reason: 'limit-reached' })
  })

  it('renames only the selected preset and updates its V2 snapshot', () => {
    const first = create('Power route')
    const second = create('Vitality route')
    expect(first).toMatchObject({ ok: true })
    expect(second).toMatchObject({ ok: true })
    if (!first.ok || !second.ok) return
    expect(useArcaneCorePresetStore.getState().rename(first.presetId, 'Power bossing')).toEqual({ ok: true })
    expect(useArcaneCorePresetStore.getState().rename(first.presetId, '   ')).toEqual({ ok: false, reason: 'invalid-name' })
    expect(useArcaneCorePresetStore.getState().rename('missing-id', 'Missing')).toEqual({ ok: false, reason: 'not-found' })
    expect(useArcaneCorePresetStore.getState().update(second.presetId, stateWithStarter())).toEqual({ ok: true })
    expect(useArcaneCorePresetStore.getState().update('missing-id', stateWithStarter())).toEqual({ ok: false, reason: 'not-found' })
    const presets = useArcaneCorePresetStore.getState().presets
    expect(presets[0]?.name).toBe('Power bossing')
    expect(presets[1]?.state.nodes['power-a1']).toEqual({ purchased: true })
  })

  it('loads a named preset with normal resource accounting', () => {
    const result = create('Power route', stateWithStarter())
    expect(result).toMatchObject({ ok: true })
    if (!result.ok) return
    const snapshot = getArcaneCorePresetSnapshot(result.presetId)
    expect(snapshot).not.toBeNull()
    const loaded = applyArcaneCorePreset({ totalXp: 100, nodes: {} }, snapshot ?? createInitialArcaneCoreState())
    expect(loaded).toEqual({ ok: true, state: stateWithStarter() })
    expect(applyArcaneCorePreset(createInitialArcaneCoreState(), { nodes: { 'invalid-node': { purchased: true } } })).toEqual({ ok: false, reason: 'invalid-preset' })
    expect(validateArcaneCorePreset({ nodes: {} })).toBe(true)
  })

  it('summarizes nodes and points, then removes or resets runtime presets', () => {
    const first = create('Power route', stateWithStarter())
    const second = create('Empty route')
    expect(first).toMatchObject({ ok: true })
    expect(second).toMatchObject({ ok: true })
    expect(getArcaneCorePresetSummary(stateWithStarter())).toEqual({ nodes: 1, points: 1 })
    if (!first.ok || !second.ok) return
    expect(useArcaneCorePresetStore.getState().deletePreset(first.presetId)).toEqual({ ok: true })
    expect(useArcaneCorePresetStore.getState().deletePreset('missing-id')).toEqual({ ok: false, reason: 'not-found' })
    expect(useArcaneCorePresetStore.getState().presets.map((preset) => preset.id)).toEqual([second.presetId])
    useArcaneCorePresetStore.getState().reset()
    expect(useArcaneCorePresetStore.getState().presets).toEqual([])
    expect(create('Fresh route')).toMatchObject({ ok: true, presetId: 'arcane-core-preset-1' })
  })
})
