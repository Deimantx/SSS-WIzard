import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialArcaneCoreState } from './arcaneCoreProgression'
import { applyArcaneCorePreset, createArcaneCorePreset, deleteArcaneCorePreset, getArcaneCorePresetSummary, getArcaneCorePresets, renameArcaneCorePreset, resetArcaneCorePresets, updateArcaneCorePreset } from './arcaneCorePresets'
import type { ArcaneCoreState } from '../../types'

const rankedStarter = (rank = 1) => ({ 'power-01': { unlocked: true, rank, coreSpent: 1, essenceSpent: 25 } })
const stateWithStarter = (rank = 1): ArcaneCoreState => ({ corePoints: 0, arcaneEssence: 0, nodes: rankedStarter(rank) })

describe('Arcane Core runtime presets', () => {
  beforeEach(() => resetArcaneCorePresets())

  it('starts empty and creates multiple named presets with stable IDs', () => {
    expect(getArcaneCorePresets()).toEqual([])
    const firstId = createArcaneCorePreset('Power route', stateWithStarter())
    const secondId = createArcaneCorePreset('Defensive route', createInitialArcaneCoreState())
    expect(firstId).toMatch(/^arcane-core-preset-/)
    expect(secondId).toMatch(/^arcane-core-preset-/)
    expect(secondId).not.toBe(firstId)
    expect(getArcaneCorePresets().map((preset) => preset.id)).toEqual([firstId, secondId])
    expect(getArcaneCorePresets()[0].id).toBe(firstId)
  })

  it('renames only the selected preset and updates its snapshot', () => {
    const firstId = createArcaneCorePreset('Power route', createInitialArcaneCoreState())
    const secondId = createArcaneCorePreset('Vitality route', createInitialArcaneCoreState())
    expect(firstId && secondId).toBeTruthy()
    expect(renameArcaneCorePreset(firstId as string, 'Power bossing')).toBe(true)
    expect(updateArcaneCorePreset(secondId as string, stateWithStarter(3))).toBe(true)
    const presets = getArcaneCorePresets()
    expect(presets[0].name).toBe('Power bossing')
    expect(presets[1].name).toBe('Vitality route')
    expect(presets[1].state.nodes['power-01'].rank).toBe(3)
  })

  it('loads a named preset with normal resource accounting', () => {
    const presetId = createArcaneCorePreset('Power route', stateWithStarter())
    expect(presetId).toBeTruthy()
    const loaded = applyArcaneCorePreset({ corePoints: 2, arcaneEssence: 30, nodes: {} }, presetId as string)
    expect(loaded).toEqual({ ok: true, state: { corePoints: 1, arcaneEssence: 5, nodes: rankedStarter() } })
    expect(applyArcaneCorePreset(createInitialArcaneCoreState(), 'missing-id')).toEqual({ ok: false, reason: 'invalid-preset' })
  })

  it('summarizes allocations and removes or resets runtime presets', () => {
    const firstId = createArcaneCorePreset('Power route', stateWithStarter(3))
    const secondId = createArcaneCorePreset('Empty route', createInitialArcaneCoreState())
    expect(getArcaneCorePresetSummary(stateWithStarter(3))).toEqual({ unlockedNodes: 1, totalRanks: 3, coreSpent: 1, essenceSpent: 25 })
    expect(deleteArcaneCorePreset(firstId as string)).toBe(true)
    expect(deleteArcaneCorePreset('missing-id')).toBe(false)
    expect(getArcaneCorePresets().map((preset) => preset.id)).toEqual([secondId])
    resetArcaneCorePresets()
    expect(getArcaneCorePresets()).toEqual([])
    expect(createArcaneCorePreset('Fresh route', createInitialArcaneCoreState())).toBe('arcane-core-preset-1')
  })
})
