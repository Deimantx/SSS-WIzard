import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialArcaneCoreState } from './arcaneCoreProgression'
import { applyArcaneCorePreset, getArcaneCorePresetSummary, validateArcaneCorePreset, MAX_RUNTIME_PRESETS } from './arcaneCorePresets'
import { getArcaneCorePreset, getArcaneCorePresetSnapshot, useArcaneCorePresetStore } from '../../../store/arcaneCorePresetStore'
import type { ArcaneCoreState } from '../../types'

const stateWithStarter = (totalXp = 100): ArcaneCoreState => ({ totalXp, nodes: { 'power-r1-arcane-force': { rank: 1 } } })
const create = (name: string, state = createInitialArcaneCoreState()) => useArcaneCorePresetStore.getState().create(name, state)

describe('Arcane Core V3 runtime presets', () => {
  beforeEach(() => useArcaneCorePresetStore.getState().reset())
  it('creates named presets with stable IDs and a rank map', () => { const first = create(' Power route '); const second = create('Defensive route'); expect(first).toMatchObject({ ok: true }); expect(second).toMatchObject({ ok: true }); if (first.ok) expect(getArcaneCorePreset(first.presetId)?.name).toBe('Power route') })
  it('rejects invalid names and enforces the maximum length', () => { expect(create('   ')).toEqual({ ok: false, reason: 'invalid-name' }); const longName = create('x'.repeat(40)); expect(longName).toMatchObject({ ok: true }); for (let index = useArcaneCorePresetStore.getState().presets.length; index < MAX_RUNTIME_PRESETS; index += 1) expect(create(`Preset ${index}`)).toMatchObject({ ok: true }); expect(create('One too many')).toEqual({ ok: false, reason: 'limit-reached' }) })
  it('validates rank, Ring gates, and weighted point cost', () => { expect(validateArcaneCorePreset({ nodes: { 'power-r1-arcane-force': { rank: 5 } } })).toBe(true); expect(validateArcaneCorePreset({ nodes: { 'power-r2-opening-blast': { rank: 1 } } })).toBe(false); expect(getArcaneCorePresetSummary(stateWithStarter())).toMatchObject({ nodes: 1, ranks: 1, points: 1, majors: 0 }) })
  it('loads a valid preset and rejects obsolete IDs', () => { const result = create('Power route', stateWithStarter()); expect(result).toMatchObject({ ok: true }); if (!result.ok) return; const snapshot = getArcaneCorePresetSnapshot(result.presetId); expect(applyArcaneCorePreset({ totalXp: 100, nodes: {} }, snapshot ?? createInitialArcaneCoreState())).toEqual({ ok: true, state: stateWithStarter() }); expect(applyArcaneCorePreset(createInitialArcaneCoreState(), { nodes: { 'power-a1': { rank: 1 } } })).toEqual({ ok: false, reason: 'invalid-preset' }) })
})
