import { ARCANE_CORE_NODES, getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { getArcaneCorePointsSpent, getArcaneCoreTotalPointsEarned, isArcaneCoreNodeReachable, isArcaneCoreNodePurchased } from './arcaneCoreProgression'
import type { ArcaneCoreState } from '../../types'

export interface ArcaneCorePreset { id: string; name: string; state: ArcaneCoreState; createdAt: number; updatedAt: number }
export interface ArcaneCorePresetSummary { nodes: number; points: number }
export type CreateArcaneCorePresetResult = { ok: true; presetId: string } | { ok: false; reason: 'invalid-name' | 'limit-reached' }
export type RenameArcaneCorePresetResult = { ok: true } | { ok: false; reason: 'not-found' | 'invalid-name' }
export type ArcaneCorePresetMutationResult = { ok: true } | { ok: false; reason: 'not-found' }
export type ArcaneCorePresetResult = { ok: true; state: ArcaneCoreState } | { ok: false; reason: 'invalid-preset' | 'not-enough-core-points' }
export const MAX_RUNTIME_PRESETS = 20
export const normalizeArcaneCorePresetName = (name: string) => name.trim().slice(0, 32)
export const cloneArcaneCoreState = (state: ArcaneCoreState): ArcaneCoreState => ({ totalXp: Math.max(0, Math.floor(Number.isFinite(state.totalXp) ? state.totalXp : 0)), nodes: Object.fromEntries(Object.entries(state.nodes ?? {}).flatMap(([id, progress]) => progress?.purchased ? [[id, { purchased: true as const }]] : [])) as ArcaneCoreState['nodes'] })

export const getArcaneCorePresetSummary = (state: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetSummary => {
  const nodes = Object.values(state.nodes ?? {}).filter((progress) => progress?.purchased).length
  return { nodes, points: nodes }
}

const normalizePresetNodes = (state: Pick<ArcaneCoreState, 'nodes'>) => {
  const nodes: ArcaneCoreState['nodes'] = {}
  for (const [nodeId, progress] of Object.entries(state.nodes ?? {})) {
    if (!getArcaneCoreNode(nodeId) || !progress?.purchased) return null
    nodes[nodeId] = { purchased: true }
  }
  for (const nodeId of Object.keys(nodes)) if (!isArcaneCoreNodeReachable({ nodes }, nodeId)) return null
  return nodes
}

export const validateArcaneCorePreset = (state: Pick<ArcaneCoreState, 'nodes'>) => normalizePresetNodes(state) !== null
export const applyArcaneCorePreset = (current: ArcaneCoreState, presetState: Pick<ArcaneCoreState, 'nodes'>): ArcaneCorePresetResult => {
  const nodes = normalizePresetNodes(presetState)
  if (!nodes) return { ok: false, reason: 'invalid-preset' }
  const required = Object.values(nodes).filter(Boolean).length
  if (getArcaneCoreAvailablePointsForPreset(current) < required) return { ok: false, reason: 'not-enough-core-points' }
  return { ok: true, state: { totalXp: current.totalXp, nodes } }
}

const getArcaneCoreAvailablePointsForPreset = (state: ArcaneCoreState) => Math.max(0, getArcaneCoreTotalPointsEarned(state) - getArcaneCorePointsSpent(state)) + getArcaneCorePointsSpent(state)

export const getArcaneCorePresetRequiredPoints = (state: Pick<ArcaneCoreState, 'nodes'>) => Object.values(state.nodes ?? {}).filter(Boolean).length
