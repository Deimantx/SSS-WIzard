import { ARCANE_CORE_NODES, getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { getArcaneCoreNodeRank, getArcaneCorePointsSpent, getArcaneCoreTotalPointsEarned, isArcaneCoreMajorUnlocked, isArcaneCoreRingUnlocked } from './arcaneCoreProgression'
import type { ArcaneCoreState } from '../../types'

export interface ArcaneCorePreset { id: string; name: string; state: ArcaneCoreState; createdAt: number; updatedAt: number }
export interface ArcaneCorePresetSummary { nodes: number; ranks: number; points: number; majors: number }
export type CreateArcaneCorePresetResult = { ok: true; presetId: string } | { ok: false; reason: 'invalid-name' | 'limit-reached' }
export type RenameArcaneCorePresetResult = { ok: true } | { ok: false; reason: 'not-found' | 'invalid-name' }
export type ArcaneCorePresetMutationResult = { ok: true } | { ok: false; reason: 'not-found' }
export type ArcaneCorePresetResult = { ok: true; state: ArcaneCoreState } | { ok: false; reason: 'invalid-preset' | 'not-enough-core-points' }
export const MAX_RUNTIME_PRESETS = 20
export const normalizeArcaneCorePresetName = (name: string) => name.trim().slice(0, 32)
export const cloneArcaneCoreState = (state: ArcaneCoreState): ArcaneCoreState => ({ totalPointsEarned: Math.max(0, Number.isFinite(state.totalPointsEarned ?? 0) ? state.totalPointsEarned ?? 0 : 0), nodes: Object.fromEntries(Object.entries(state.nodes ?? {}).flatMap(([id, progress]) => { const node = getArcaneCoreNode(id); const rank = node && typeof progress?.rank === 'number' ? Math.max(0, Math.min(node.maxRank, Math.floor(progress.rank))) : 0; return node && rank > 0 ? [[id, { rank }]] : [] })) as ArcaneCoreState['nodes'] })

export const getArcaneCorePresetSummary = (state: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetSummary => {
  const nodes = Object.keys(state.nodes ?? {}).filter((id) => getArcaneCoreNodeRank(state, id) > 0)
  const points = getArcaneCorePointsSpent(state)
  return { nodes: nodes.length, ranks: nodes.reduce((sum, id) => sum + getArcaneCoreNodeRank(state, id), 0), points, majors: nodes.filter((id) => getArcaneCoreNode(id)?.nodeType === 'major').length }
}

const normalizePresetNodes = (state: Pick<ArcaneCoreState, 'nodes'>) => {
  const nodes: ArcaneCoreState['nodes'] = {}
  for (const [nodeId, progress] of Object.entries(state.nodes ?? {})) {
    const node = getArcaneCoreNode(nodeId)
    if (!node || typeof progress?.rank !== 'number' || !Number.isFinite(progress.rank) || !Number.isInteger(progress.rank) || progress.rank < 1 || progress.rank > node.maxRank) return null
    nodes[nodeId] = { rank: progress.rank }
  }
  const candidate = { nodes }
  for (const node of ARCANE_CORE_NODES) if (nodes[node.id] && (!isArcaneCoreRingUnlocked(candidate, node.branchId, node.ring) || !isArcaneCoreMajorUnlocked(candidate, node))) return null
  return nodes
}

export const validateArcaneCorePreset = (state: Pick<ArcaneCoreState, 'nodes'>) => normalizePresetNodes(state) !== null
export const applyArcaneCorePreset = (current: ArcaneCoreState, presetState: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetResult => {
  const nodes = normalizePresetNodes(presetState)
  if (!nodes) return { ok: false, reason: 'invalid-preset' }
  if (getArcaneCoreTotalPointsEarned(current) < getArcaneCorePointsSpent({ nodes })) return { ok: false, reason: 'not-enough-core-points' }
  return { ok: true, state: { totalPointsEarned: current.totalPointsEarned, nodes } }
}
export const getArcaneCorePresetRequiredPoints = (state: Pick<ArcaneCoreState, 'nodes'>) => getArcaneCorePointsSpent(state)
