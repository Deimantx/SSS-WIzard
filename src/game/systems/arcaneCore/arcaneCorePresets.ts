import { getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { isArcaneCoreNodeReachable } from './arcaneCoreProgression'
import type { ArcaneCoreNodeProgress, ArcaneCoreState } from '../../types'

export interface ArcaneCorePreset {
  id: string
  name: string
  state: ArcaneCoreState
  createdAt: number
  updatedAt: number
}

export interface ArcaneCorePresetSummary {
  unlockedNodes: number
  totalRanks: number
  coreSpent: number
  essenceSpent: number
}

export type ArcaneCorePresetResult =
  | { ok: true; state: ArcaneCoreState }
  | { ok: false; reason: 'invalid-preset' | 'not-enough-core-points' | 'not-enough-essence' }

const MAX_RUNTIME_PRESETS = 20
let presets: ArcaneCorePreset[] = []
let nextPresetSequence = 1

const cloneState = (state: ArcaneCoreState): ArcaneCoreState => ({
  corePoints: state.corePoints,
  arcaneEssence: state.arcaneEssence,
  nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, progress]) => [id, { ...progress }])),
})

const clonePreset = (preset: ArcaneCorePreset): ArcaneCorePreset => ({ ...preset, state: cloneState(preset.state) })
const normalizeName = (name: string) => name.trim().slice(0, 32)
const findPreset = (presetId: string) => presets.find((preset) => preset.id === presetId)

export const getArcaneCorePresets = () => presets.map(clonePreset)

export const resetArcaneCorePresets = () => {
  presets = []
  nextPresetSequence = 1
}

export const createArcaneCorePreset = (name: string, state: ArcaneCoreState): string | false => {
  const trimmedName = normalizeName(name)
  if (!trimmedName || presets.length >= MAX_RUNTIME_PRESETS) return false
  const now = Date.now()
  const id = `arcane-core-preset-${nextPresetSequence++}`
  presets.push({ id, name: trimmedName, state: cloneState(state), createdAt: now, updatedAt: now })
  return id
}

export const updateArcaneCorePreset = (presetId: string, state: ArcaneCoreState) => {
  const preset = findPreset(presetId)
  if (!preset) return false
  preset.state = cloneState(state)
  preset.updatedAt = Date.now()
  return true
}

export const renameArcaneCorePreset = (presetId: string, name: string) => {
  const preset = findPreset(presetId)
  const trimmedName = normalizeName(name)
  if (!preset || !trimmedName) return false
  preset.name = trimmedName
  preset.updatedAt = Date.now()
  return true
}

export const deleteArcaneCorePreset = (presetId: string) => {
  const index = presets.findIndex((preset) => preset.id === presetId)
  if (index < 0) return false
  presets.splice(index, 1)
  return true
}

export const getArcaneCorePresetSummary = (state: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetSummary => Object.values(state.nodes).reduce<ArcaneCorePresetSummary>((summary, progress) => {
  if (progress.unlocked) summary.unlockedNodes += 1
  summary.totalRanks += Math.max(0, progress.rank)
  summary.coreSpent += Math.max(0, progress.coreSpent)
  summary.essenceSpent += Math.max(0, progress.essenceSpent)
  return summary
}, { unlockedNodes: 0, totalRanks: 0, coreSpent: 0, essenceSpent: 0 })

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

export const applyArcaneCorePreset = (current: ArcaneCoreState, presetId: string): ArcaneCorePresetResult => {
  const preset = findPreset(presetId)
  if (!preset) return { ok: false, reason: 'invalid-preset' }
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
