import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialArcaneCoreState } from './arcaneCoreProgression'
import { applyArcaneCorePreset, getArcaneCorePresetSummary, validateArcaneCorePreset } from './arcaneCorePresets'
import { getArcaneCorePreset, getArcaneCorePresetSnapshot, useArcaneCorePresetStore } from '../../../store/arcaneCorePresetStore'
import { MAX_RUNTIME_PRESETS } from './arcaneCorePresets'
import type { ArcaneCoreState } from '../../types'

const rankedStarter = (rank = 1) => ({ 'power-01': { unlocked: true, rank, coreSpent: 1, essenceSpent: 25 } })
const stateWithStarter = (rank = 1): ArcaneCoreState => ({ corePoints: 0, arcaneEssence: 0, nodes: rankedStarter(rank) })
const create = (name: string, state = createInitialArcaneCoreState()) => useArcaneCorePresetStore.getState().create(name, state)

describe('Arcane Core runtime presets', () => {
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

  it('rejects invalid names, trims names, and enforces the maximum length', () => {
    expect(create('   ')).toEqual({ ok: false, reason: 'invalid-name' })
    const longName = create(`${'x'.repeat(40)}`)
    expect(longName).toMatchObject({ ok: true })
    if (longName.ok) expect(getArcaneCorePreset(longName.presetId)?.name).toHaveLength(32)
    for (let index = useArcaneCorePresetStore.getState().presets.length; index < MAX_RUNTIME_PRESETS; index += 1) expect(create(`Preset ${index}`)).toMatchObject({ ok: true })
    expect(create('One too many')).toEqual({ ok: false, reason: 'limit-reached' })
  })

  it('renames only the selected preset and updates its snapshot', () => {
    const first = create('Power route')
    const second = create('Vitality route')
    expect(first).toMatchObject({ ok: true })
    expect(second).toMatchObject({ ok: true })
    if (!first.ok || !second.ok) return
    expect(useArcaneCorePresetStore.getState().rename(first.presetId, 'Power bossing')).toEqual({ ok: true })
    expect(useArcaneCorePresetStore.getState().rename(first.presetId, '   ')).toEqual({ ok: false, reason: 'invalid-name' })
    expect(useArcaneCorePresetStore.getState().rename('missing-id', 'Missing')).toEqual({ ok: false, reason: 'not-found' })
    expect(useArcaneCorePresetStore.getState().update(second.presetId, stateWithStarter(3))).toEqual({ ok: true })
    expect(useArcaneCorePresetStore.getState().update('missing-id', stateWithStarter())).toEqual({ ok: false, reason: 'not-found' })
    const presets = useArcaneCorePresetStore.getState().presets
    expect(presets[0]?.name).toBe('Power bossing')
    expect(presets[1]?.name).toBe('Vitality route')
    expect(presets[1]?.state.nodes['power-01']?.rank).toBe(3)
  })

  it('loads a named preset with normal resource accounting', () => {
    const result = create('Power route', stateWithStarter())
    expect(result).toMatchObject({ ok: true })
    if (!result.ok) return
    const snapshot = getArcaneCorePresetSnapshot(result.presetId)
    expect(snapshot).not.toBeNull()
    const loaded = applyArcaneCorePreset({ corePoints: 2, arcaneEssence: 30, nodes: {} }, snapshot ?? createInitialArcaneCoreState())
    expect(loaded).toEqual({ ok: true, state: { corePoints: 1, arcaneEssence: 5, nodes: rankedStarter() } })
    expect(applyArcaneCorePreset(createInitialArcaneCoreState(), { nodes: { 'invalid-node': { unlocked: true, rank: 1, coreSpent: 1, essenceSpent: 0 } } })).toEqual({ ok: false, reason: 'invalid-preset' })
    expect(validateArcaneCorePreset({ nodes: {} })).toBe(true)
  })

  it('summarizes allocations and removes or resets runtime presets', () => {
    const first = create('Power route', stateWithStarter(3))
    const second = create('Empty route')
    expect(first).toMatchObject({ ok: true })
    expect(second).toMatchObject({ ok: true })
    expect(getArcaneCorePresetSummary(stateWithStarter(3))).toEqual({ unlockedNodes: 1, totalRanks: 3, coreSpent: 1, essenceSpent: 25 })
    if (!first.ok || !second.ok) return
    expect(useArcaneCorePresetStore.getState().deletePreset(first.presetId)).toEqual({ ok: true })
    expect(useArcaneCorePresetStore.getState().deletePreset('missing-id')).toEqual({ ok: false, reason: 'not-found' })
    expect(useArcaneCorePresetStore.getState().presets.map((preset) => preset.id)).toEqual([second.presetId])
    useArcaneCorePresetStore.getState().reset()
    expect(useArcaneCorePresetStore.getState().presets).toEqual([])
    expect(create('Fresh route')).toMatchObject({ ok: true, presetId: 'arcane-core-preset-1' })
  })
})
