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

export type CreateArcaneCorePresetResult =
  | { ok: true; presetId: string }
  | { ok: false; reason: 'invalid-name' | 'limit-reached' }

export type RenameArcaneCorePresetResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' | 'invalid-name' }

export type ArcaneCorePresetMutationResult =
  | { ok: true }
  | { ok: false; reason: 'not-found' }

export type ArcaneCorePresetResult =
  | { ok: true; state: ArcaneCoreState }
  | { ok: false; reason: 'invalid-preset' | 'not-enough-core-points' | 'not-enough-essence' }

export const MAX_RUNTIME_PRESETS = 20

export const normalizeArcaneCorePresetName = (name: string) => name.trim().slice(0, 32)

export const cloneArcaneCoreState = (state: ArcaneCoreState): ArcaneCoreState => ({
  corePoints: state.corePoints,
  arcaneEssence: state.arcaneEssence,
  nodes: Object.fromEntries(Object.entries(state.nodes).flatMap(([id, progress]) => progress ? [[id, { ...progress }]] : [])) as ArcaneCoreState['nodes'],
})

export const getArcaneCorePresetSummary = (state: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetSummary => {
  const summary: ArcaneCorePresetSummary = { unlockedNodes: 0, totalRanks: 0, coreSpent: 0, essenceSpent: 0 }
  for (const progress of Object.values(state.nodes)) {
    if (!progress) continue
    if (progress.unlocked) summary.unlockedNodes += 1
    summary.totalRanks += Math.max(0, progress.rank)
    summary.coreSpent += Math.max(0, progress.coreSpent)
    summary.essenceSpent += Math.max(0, progress.essenceSpent)
  }
  return summary
}

const normalizePresetNodes = (state: Pick<ArcaneCoreState, 'nodes'>): ArcaneCoreState['nodes'] | null => {
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

export const validateArcaneCorePreset = (state: Pick<ArcaneCoreState, 'nodes'>) => normalizePresetNodes(state) !== null

export const applyArcaneCorePreset = (current: ArcaneCoreState, presetState: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetResult => {
  const nodes = normalizePresetNodes(presetState)
  if (!nodes) return { ok: false, reason: 'invalid-preset' }
  const currentRefundedCore = current.corePoints + Object.values(current.nodes).reduce((sum, progress) => sum + (progress ? Math.max(0, progress.coreSpent) : 0), 0)
  const currentRefundedEssence = current.arcaneEssence + Object.values(current.nodes).reduce((sum, progress) => sum + (progress ? Math.max(0, progress.essenceSpent) : 0), 0)
  const requiredCore = Object.values(nodes).reduce((sum, progress) => sum + (progress ? progress.coreSpent : 0), 0)
  const requiredEssence = Object.values(nodes).reduce((sum, progress) => sum + (progress ? progress.essenceSpent : 0), 0)
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
