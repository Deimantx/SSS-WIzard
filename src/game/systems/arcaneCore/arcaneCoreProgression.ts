import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES, getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_NODE_MAX_RANK, ARCANE_CORE_NODE_UNLOCK_COST, ARCANE_CORE_RANK_COSTS } from '../../content/arcaneCore/arcaneCoreBalance'
import type { ArcaneCoreNodeProgress, ArcaneCoreState } from '../../types'

export type ArcaneCoreFailureReason = 'unknown-node' | 'already-unlocked' | 'not-reachable' | 'not-enough-core-points' | 'not-enough-essence' | 'max-rank' | 'not-unlocked'
export type ArcaneCoreActionResult = { ok: true; state: ArcaneCoreState } | { ok: false; reason: ArcaneCoreFailureReason }
export interface ArcaneCoreActionOptions { freeCosts?: boolean; ignorePrerequisites?: boolean }

export const EMPTY_ARCANE_CORE_NODE_PROGRESS: ArcaneCoreNodeProgress = { unlocked: false, rank: 0, coreSpent: 0, essenceSpent: 0 }
export const createInitialArcaneCoreState = (): ArcaneCoreState => ({ corePoints: 0, arcaneEssence: 0, nodes: {} })
export const getArcaneCoreNodeProgress = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string): ArcaneCoreNodeProgress => state.nodes[nodeId] ?? EMPTY_ARCANE_CORE_NODE_PROGRESS

const copyState = (state: ArcaneCoreState): ArcaneCoreState => ({ corePoints: Math.max(0, Number.isFinite(state.corePoints) ? state.corePoints : 0), arcaneEssence: Math.max(0, Number.isFinite(state.arcaneEssence) ? state.arcaneEssence : 0), nodes: Object.fromEntries(Object.entries(state.nodes).map(([id, progress]) => [id, { ...progress }])) })
const isComplete = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string) => { const node = getArcaneCoreNode(nodeId); const progress = getArcaneCoreNodeProgress(state, nodeId); return Boolean(node && progress.unlocked && progress.rank >= node.maxRank) }

export const isArcaneCoreNodeReachable = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string, ignorePrerequisites = false) => {
  const node = getArcaneCoreNode(nodeId)
  if (!node) return false
  if (ignorePrerequisites || node.prerequisites.length === 0) return true
  const checks = node.prerequisites.map((prerequisite) => isComplete(state, prerequisite))
  return node.prerequisiteMode === 'all' ? checks.every(Boolean) : checks.some(Boolean)
}

export const unlockArcaneCoreNode = (state: ArcaneCoreState, nodeId: string, options: ArcaneCoreActionOptions = {}): ArcaneCoreActionResult => {
  const node = getArcaneCoreNode(nodeId)
  if (!node) return { ok: false, reason: 'unknown-node' }
  const current = getArcaneCoreNodeProgress(state, nodeId)
  if (current.unlocked) return { ok: false, reason: 'already-unlocked' }
  if (!isArcaneCoreNodeReachable(state, nodeId, options.ignorePrerequisites)) return { ok: false, reason: 'not-reachable' }
  const cost = options.freeCosts ? 0 : ARCANE_CORE_NODE_UNLOCK_COST
  if (state.corePoints < cost) return { ok: false, reason: 'not-enough-core-points' }
  const next = copyState(state)
  next.corePoints -= cost
  next.nodes[nodeId] = { unlocked: true, rank: 0, coreSpent: cost, essenceSpent: 0 }
  return { ok: true, state: next }
}

export const rankUpArcaneCoreNode = (state: ArcaneCoreState, nodeId: string, options: ArcaneCoreActionOptions = {}): ArcaneCoreActionResult => {
  const node = getArcaneCoreNode(nodeId)
  if (!node) return { ok: false, reason: 'unknown-node' }
  const current = getArcaneCoreNodeProgress(state, nodeId)
  if (!current.unlocked) return { ok: false, reason: 'not-unlocked' }
  if (current.rank >= node.maxRank) return { ok: false, reason: 'max-rank' }
  const cost = options.freeCosts ? 0 : ARCANE_CORE_RANK_COSTS[current.rank]
  if (state.arcaneEssence < cost) return { ok: false, reason: 'not-enough-essence' }
  const next = copyState(state)
  next.arcaneEssence -= cost
  const progress = next.nodes[nodeId]
  progress.rank += 1
  progress.essenceSpent += cost
  return { ok: true, state: next }
}

export interface ArcaneCoreRefundPreview {
  ok: true
  state: ArcaneCoreState
  nodeIds: string[]
  nodesAffected: number
  ranksAffected: number
  corePointsRefunded: number
  essenceRefunded: number
}

export type ArcaneCoreRefundPreviewResult = ArcaneCoreRefundPreview | { ok: false; reason: ArcaneCoreFailureReason }

const summarizeRefund = (state: ArcaneCoreState, nodeIds: Iterable<string>, next: ArcaneCoreState): ArcaneCoreRefundPreview => {
  const ids = [...nodeIds]
  const totals = ids.reduce((summary, id) => {
    const progress = state.nodes[id]
    if (!progress) return summary
    summary.ranksAffected += Math.max(0, progress.rank)
    summary.corePointsRefunded += Math.max(0, progress.coreSpent)
    summary.essenceRefunded += Math.max(0, progress.essenceSpent)
    return summary
  }, { ranksAffected: 0, corePointsRefunded: 0, essenceRefunded: 0 })
  return { ok: true, state: next, nodeIds: ids, nodesAffected: ids.length, ...totals }
}

/**
 * Calculates the smallest valid refund cascade after removing one allocated node.
 * A node with `any` prerequisites survives when another completed route remains.
 */
export const getArcaneCoreRefundPreview = (state: ArcaneCoreState, nodeId: string): ArcaneCoreRefundPreviewResult => {
  if (!getArcaneCoreNode(nodeId)) return { ok: false, reason: 'unknown-node' }
  if (!getArcaneCoreNodeProgress(state, nodeId).unlocked) return { ok: false, reason: 'not-unlocked' }

  const next = copyState(state)
  const removed = new Set<string>([nodeId])
  delete next.nodes[nodeId]

  let changed = true
  while (changed) {
    changed = false
    for (const candidateId of Object.keys(next.nodes)) {
      if (isArcaneCoreNodeReachable(next, candidateId)) continue
      removed.add(candidateId)
      delete next.nodes[candidateId]
      changed = true
    }
  }

  next.corePoints += [...removed].reduce((sum, id) => sum + Math.max(0, state.nodes[id]?.coreSpent ?? 0), 0)
  next.arcaneEssence += [...removed].reduce((sum, id) => sum + Math.max(0, state.nodes[id]?.essenceSpent ?? 0), 0)
  return summarizeRefund(state, removed, next)
}

export const refundArcaneCoreNode = (state: ArcaneCoreState, nodeId: string): ArcaneCoreActionResult => {
  const preview = getArcaneCoreRefundPreview(state, nodeId)
  return preview.ok ? { ok: true, state: preview.state } : preview
}

export interface ArcaneCoreBranchResetPreview extends ArcaneCoreRefundPreview {
  branchId: typeof ARCANE_CORE_BRANCHES[number]['id']
}

export type ArcaneCoreBranchResetPreviewResult = ArcaneCoreBranchResetPreview | { ok: false; reason: ArcaneCoreFailureReason }

export const getArcaneCoreBranchResetPreview = (state: ArcaneCoreState, branchId: typeof ARCANE_CORE_BRANCHES[number]['id']): ArcaneCoreBranchResetPreviewResult => {
  const branch = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === branchId)
  if (!branch) return { ok: false, reason: 'unknown-node' }
  const nodeIds = branch.nodes.filter((node) => state.nodes[node.id]).map((node) => node.id)
  const next = copyState(state)
  nodeIds.forEach((id) => delete next.nodes[id])
  next.corePoints += nodeIds.reduce((sum, id) => sum + Math.max(0, state.nodes[id]?.coreSpent ?? 0), 0)
  next.arcaneEssence += nodeIds.reduce((sum, id) => sum + Math.max(0, state.nodes[id]?.essenceSpent ?? 0), 0)
  return { ...summarizeRefund(state, nodeIds, next), branchId }
}

export const resetArcaneCoreBranch = (state: ArcaneCoreState, branchId: typeof ARCANE_CORE_BRANCHES[number]['id']): ArcaneCoreActionResult => {
  const preview = getArcaneCoreBranchResetPreview(state, branchId)
  return preview.ok ? { ok: true, state: preview.state } : preview
}

export const resetArcaneCore = (state: ArcaneCoreState): ArcaneCoreActionResult => {
  const next = copyState(state)
  Object.values(next.nodes).forEach((progress) => { next.corePoints += Math.max(0, progress.coreSpent); next.arcaneEssence += Math.max(0, progress.essenceSpent) })
  next.nodes = {}
  return { ok: true, state: next }
}

export const maxArcaneCoreNode = (state: ArcaneCoreState, nodeId: string, options: ArcaneCoreActionOptions = {}): ArcaneCoreActionResult => {
  let current = state
  let result = unlockArcaneCoreNode(current, nodeId, options)
  if (!result.ok && result.reason !== 'already-unlocked') return result
  if (result.ok) current = result.state
  while (getArcaneCoreNodeProgress(current, nodeId).rank < ARCANE_CORE_NODE_MAX_RANK) {
    result = rankUpArcaneCoreNode(current, nodeId, options)
    if (!result.ok) return result
    current = result.state
  }
  return { ok: true, state: current }
}

export const maxArcaneCoreBranch = (state: ArcaneCoreState, branchId: typeof ARCANE_CORE_BRANCHES[number]['id'], options: ArcaneCoreActionOptions = {}): ArcaneCoreActionResult => {
  const branch = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === branchId)
  if (!branch) return { ok: false, reason: 'unknown-node' }
  let current = state
  let changed = true
  while (changed) {
    changed = false
    for (const node of branch.nodes) {
      const before = getArcaneCoreNodeProgress(current, node.id)
      const result = maxArcaneCoreNode(current, node.id, options)
      if (!result.ok) continue
      const after = getArcaneCoreNodeProgress(result.state, node.id)
      if (!before.unlocked || after.rank !== before.rank) changed = true
      current = result.state
    }
  }
  return { ok: true, state: current }
}

export const grantArcaneCoreRewards = (state: ArcaneCoreState, corePoints: number, arcaneEssence: number) => ({ ...copyState(state), corePoints: state.corePoints + Math.max(0, Number.isFinite(corePoints) ? corePoints : 0), arcaneEssence: state.arcaneEssence + Math.max(0, Number.isFinite(arcaneEssence) ? arcaneEssence : 0) })

export const getArcaneCoreModifierTotals = (state: Pick<ArcaneCoreState, 'nodes'>) => ARCANE_CORE_NODES.reduce<Partial<Record<import('../../types').ArcaneCoreModifierKey, number>>>((totals, node) => {
  const progress = getArcaneCoreNodeProgress(state, node.id)
  if (!progress.unlocked || progress.rank < 1) return totals
  totals[node.effect.key] = (totals[node.effect.key] ?? 0) + progress.rank * node.effect.perRank
  return totals
}, {})
