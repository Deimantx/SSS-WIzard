import { create } from 'zustand'
import {
  cloneArcaneCoreState,
  MAX_RUNTIME_PRESETS,
  normalizeArcaneCorePresetName,
  type ArcaneCorePreset,
  type ArcaneCorePresetMutationResult,
  type CreateArcaneCorePresetResult,
  type RenameArcaneCorePresetResult,
} from '../game/systems/arcaneCore'
import type { ArcaneCoreState } from '../game/types'

export interface ArcaneCorePresetRuntimeState {
  presets: ArcaneCorePreset[]
  nextSequence: number
  create: (name: string, state: ArcaneCoreState) => CreateArcaneCorePresetResult
  update: (presetId: string, state: ArcaneCoreState) => ArcaneCorePresetMutationResult
  rename: (presetId: string, name: string) => RenameArcaneCorePresetResult
  deletePreset: (presetId: string) => ArcaneCorePresetMutationResult
  reset: () => void
}

const clonePreset = (preset: ArcaneCorePreset): ArcaneCorePreset => ({ ...preset, state: cloneArcaneCoreState(preset.state) })

export const useArcaneCorePresetStore = create<ArcaneCorePresetRuntimeState>((set) => ({
  presets: [],
  nextSequence: 1,
  create: (name, state) => {
    const normalizedName = normalizeArcaneCorePresetName(name)
    if (!normalizedName) return { ok: false, reason: 'invalid-name' }
    let result: CreateArcaneCorePresetResult = { ok: false, reason: 'limit-reached' }
    set((runtime) => {
      if (runtime.presets.length >= MAX_RUNTIME_PRESETS) return runtime
      const now = Date.now()
      const presetId = `arcane-core-preset-${runtime.nextSequence}`
      const preset = { id: presetId, name: normalizedName, state: cloneArcaneCoreState(state), createdAt: now, updatedAt: now }
      result = { ok: true, presetId }
      return { ...runtime, nextSequence: runtime.nextSequence + 1, presets: [...runtime.presets, preset] }
    })
    return result
  },
  update: (presetId, state) => {
    let result: ArcaneCorePresetMutationResult = { ok: false, reason: 'not-found' }
    set((runtime) => {
      if (!runtime.presets.some((candidate) => candidate.id === presetId)) return runtime
      const presets = runtime.presets.map((preset) => preset.id === presetId ? { ...preset, state: cloneArcaneCoreState(state), updatedAt: Date.now() } : preset)
      result = { ok: true }
      return { ...runtime, presets }
    })
    return result
  },
  rename: (presetId, name) => {
    const normalizedName = normalizeArcaneCorePresetName(name)
    if (!normalizedName) return { ok: false, reason: 'invalid-name' }
    let result: RenameArcaneCorePresetResult = { ok: false, reason: 'not-found' }
    set((runtime) => {
      if (!runtime.presets.some((candidate) => candidate.id === presetId)) return runtime
      const presets = runtime.presets.map((preset) => preset.id === presetId ? { ...preset, name: normalizedName, updatedAt: Date.now() } : preset)
      result = { ok: true }
      return { ...runtime, presets }
    })
    return result
  },
  deletePreset: (presetId) => {
    let result: ArcaneCorePresetMutationResult = { ok: false, reason: 'not-found' }
    set((runtime) => {
      const index = runtime.presets.findIndex((candidate) => candidate.id === presetId)
      if (index < 0) return runtime
      result = { ok: true }
      return { ...runtime, presets: runtime.presets.filter((_, candidateIndex) => candidateIndex !== index) }
    })
    return result
  },
  reset: () => set((runtime) => ({ ...runtime, presets: [], nextSequence: 1 })),
}))

export const getArcaneCorePresetSnapshot = (presetId: string): ArcaneCoreState | null => {
  const preset = useArcaneCorePresetStore.getState().presets.find((candidate) => candidate.id === presetId)
  return preset ? cloneArcaneCoreState(preset.state) : null
}

export const getArcaneCorePreset = (presetId: string): ArcaneCorePreset | null => {
  const preset = useArcaneCorePresetStore.getState().presets.find((candidate) => candidate.id === presetId)
  return preset ? clonePreset(preset) : null
}
