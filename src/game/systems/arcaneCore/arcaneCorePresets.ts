import { getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { getArcaneCoreNodeProgress, isArcaneCoreNodeReachable } from './arcaneCoreProgression'
import type { ArcaneCoreNodeProgress, ArcaneCoreState } from '../../types'

export interface ArcaneCorePreset {
  name: string
  state: ArcaneCoreState
}

export type ArcaneCorePresetResult =
  | { ok: true; state: ArcaneCoreState }
  | { ok: false; reason: 'invalid-preset' | 'not-enough-core-points' | 'not-enough-essence' }

const PRESET_COUNT = 3
let presets: Array<ArcaneCorePreset | null> = Array.from({ length: PRESET_COUNT }, () => null)

const cloneState = (state: ArcaneCoreState): ArcaneCoreState => ({
  corePoints: state.corePoints,
  arcaneEssence: state.arcaneEssence,
  nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, progress]) => [id, { ...progress }])),
})

const validSlot = (slot: number) => Number.isInteger(slot) && slot >= 0 && slot < PRESET_COUNT

export const getArcaneCorePresetCount = () => PRESET_COUNT

export const getArcaneCorePresets = () => presets.map((preset) => preset ? { name: preset.name, state: cloneState(preset.state) } : null)

export const resetArcaneCorePresets = () => {
  presets = Array.from({ length: PRESET_COUNT }, () => null)
}

export const saveArcaneCorePreset = (slot: number, name: string, state: ArcaneCoreState) => {
  if (!validSlot(slot)) return false
  const trimmedName = name.trim().slice(0, 32)
  presets[slot] = { name: trimmedName || `Preset ${slot + 1}`, state: cloneState(state) }
  return true
}

export const renameArcaneCorePreset = (slot: number, name: string) => {
  if (!validSlot(slot) || !presets[slot]) return false
  const trimmedName = name.trim().slice(0, 32)
  if (!trimmedName) return false
  presets[slot]!.name = trimmedName
  return true
}

export const clearArcaneCorePreset = (slot: number) => {
  if (!validSlot(slot)) return false
  presets[slot] = null
  return true
}

const normalizePresetNodes = (state: ArcaneCoreState): Record<string, ArcaneCoreNodeProgress> | null => {
  const nodes: Record<string, ArcaneCoreNodeProgress> = {}
  for (const [nodeId, progress] of Object.entries(state.nodes)) {
    const node = getArcaneCoreNode(nodeId)
    if (!node || !progress || progress.unlocked !== true) return null
    const rank = Math.floor(progress.rank)
    const coreSpent = Math.floor(progress.coreSpent)
    const essenceSpent = Math.floor(progress.essenceSpent)
    if (!Number.isFinite(rank) || rank < 0 || rank > node.maxRank || !Number.isFinite(coreSpent) || coreSpent < 0 || !Number.isFinite(essenceSpent) || essenceSpent < 0) return null
    nodes[nodeId] = { unlocked: true, rank, coreSpent, essenceSpent }
  }
  for (const nodeId of Object.keys(nodes)) {
    if (!isArcaneCoreNodeReachable({ nodes }, nodeId)) return null
  }
  return nodes
}

export const applyArcaneCorePreset = (current: ArcaneCoreState, slot: number): ArcaneCorePresetResult => {
  if (!validSlot(slot) || !presets[slot]) return { ok: false, reason: 'invalid-preset' }
  const preset = presets[slot]!
  const nodes = normalizePresetNodes(preset.state)
  if (!nodes) return { ok: false, reason: 'invalid-preset' }
  const currentRefundedCore = current.corePoints + Object.values(current.nodes).reduce((sum, progress) => sum + Math.max(0, progress.coreSpent), 0)
  const currentRefundedEssence = current.arcaneEssence + Object.values(current.nodes).reduce((sum, progress) => sum + Math.max(0, progress.essenceSpent), 0)
  const requiredCore = Object.values(nodes).reduce((sum, progress) => sum + progress.coreSpent, 0)
  const requiredEssence = Object.values(nodes).reduce((sum, progress) => sum + progress.essenceSpent, 0)
  if (currentRefundedCore < requiredCore) return { ok: false, reason: 'not-enough-core-points' }
  if (currentRefundedEssence < requiredEssence) return { ok: false, reason: 'not-enough-essence' }
  return {
    ok: true,
    state: {
      corePoints: currentRefundedCore - requiredCore,
      arcaneEssence: currentRefundedEssence - requiredEssence,
      nodes,
    },
  }
}
