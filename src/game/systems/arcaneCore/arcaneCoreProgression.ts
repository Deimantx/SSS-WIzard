import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES, getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_RING_INDICES, ARCANE_CORE_SCHEMA_VERSION, ARCANE_CORE_TOTAL_TREE_COST } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES } from '../../content/arcaneCore/arcaneCoreRings'
import type { ArcaneCoreBranchId, ArcaneCoreNodeDefinition, ArcaneCoreNodeProgress, ArcaneCoreResolvedEffects, ArcaneCoreRingIndex, ArcaneCoreSpecialEffect, ArcaneCoreState, EquipmentStats } from '../../types'
import type { CombatModifier, CombatTriggerRule } from '../combat/combatTypes'
import { addEquipmentStats } from '../../core/equipment/equipmentStatAggregation'

export type ArcaneCoreFailureReason = 'unknown-node' | 'already-max-rank' | 'ring-locked' | 'major-locked' | 'not-enough-core-points' | 'not-purchased' | 'invalid-preset'
export type ArcaneCoreActionResult = { ok: true; state: ArcaneCoreState } | { ok: false; reason: ArcaneCoreFailureReason }
export interface ArcaneCoreActionOptions { freeCosts?: boolean; ignorePrerequisites?: boolean }
export interface ArcaneCoreWalletInfo { totalPointsEarned: number; pointsSpent: number; pointsAvailable: number; treeCost: number }

export const createInitialArcaneCoreState = (): ArcaneCoreState => ({ arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: 0, nodes: {} })
const safePoints = (value: unknown) => Math.max(0, Math.min(ARCANE_CORE_TOTAL_TREE_COST, Math.floor(typeof value === 'number' && Number.isFinite(value) ? value : 0)))
const safeRank = (node: ArcaneCoreNodeDefinition, value: unknown) => Math.max(0, Math.min(node.maxRank, Math.floor(typeof value === 'number' && Number.isFinite(value) ? value : 0)))
const copyState = (state: ArcaneCoreState): ArcaneCoreState => {
  const nodes: ArcaneCoreState['nodes'] = {}
  Object.entries(state.nodes ?? {}).forEach(([id, progress]) => {
    const node = getArcaneCoreNode(id)
    const rank = node ? safeRank(node, progress?.rank) : 0
    if (node && rank > 0) nodes[id] = { rank }
  })
  return { arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: safePoints(state.totalPointsEarned), nodes }
}

export const getArcaneCoreNodeProgress = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string): ArcaneCoreNodeProgress => ({ rank: getArcaneCoreNodeRank(state, nodeId) })
export const getArcaneCoreNodeRank = (state: Pick<ArcaneCoreState, 'nodes'> | undefined, nodeId: string) => {
  const node = getArcaneCoreNode(nodeId)
  return node ? safeRank(node, state?.nodes?.[nodeId]?.rank) : 0
}
export const isArcaneCoreNodePurchased = (state: Pick<ArcaneCoreState, 'nodes'> | undefined, nodeId: string) => getArcaneCoreNodeRank(state, nodeId) > 0
export const getArcaneCoreTotalPointsEarned = (state: Pick<ArcaneCoreState, 'totalPointsEarned'>) => safePoints(state.totalPointsEarned)
export const getArcaneCorePointsSpent = (state: Pick<ArcaneCoreState, 'nodes'>) => Object.entries(state.nodes ?? {}).reduce((sum, [id]) => {
  const node = getArcaneCoreNode(id)
  return sum + (node ? getArcaneCoreNodeRank(state, id) * node.rankCost : 0)
}, 0)
export const getArcaneCoreAvailablePoints = (state: ArcaneCoreState) => Math.max(0, getArcaneCoreTotalPointsEarned(state) - getArcaneCorePointsSpent(state))
export const getArcaneCoreWalletInfo = (state: ArcaneCoreState): ArcaneCoreWalletInfo => ({ totalPointsEarned: getArcaneCoreTotalPointsEarned(state), pointsSpent: getArcaneCorePointsSpent(state), pointsAvailable: getArcaneCoreAvailablePoints(state), treeCost: ARCANE_CORE_TOTAL_TREE_COST })

export const getArcaneCoreRingPointsSpent = (state: Pick<ArcaneCoreState, 'nodes'>, branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex) => ARCANE_CORE_NODES.filter((node) => node.branchId === branchId && node.ring === ring).reduce((sum, node) => sum + getArcaneCoreNodeRank(state, node.id) * node.rankCost, 0)
export const getArcaneCoreRingStandardRanksInvested = (state: Pick<ArcaneCoreState, 'nodes'>, branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex) => ARCANE_CORE_NODES.filter((node) => node.branchId === branchId && node.ring === ring && node.nodeType !== 'major').reduce((sum, node) => sum + getArcaneCoreNodeRank(state, node.id), 0)
export const isArcaneCoreRingUnlocked = (state: Pick<ArcaneCoreState, 'nodes'>, branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex, ignorePrerequisites = false) => ring === 1 || ignorePrerequisites || getArcaneCoreRingStandardRanksInvested(state, branchId, (ring - 1) as ArcaneCoreRingIndex) >= ARCANE_CORE_RING_GATES[ring]
export const isArcaneCoreMajorUnlocked = (state: Pick<ArcaneCoreState, 'nodes'>, node: ArcaneCoreNodeDefinition, ignorePrerequisites = false) => node.nodeType !== 'major' || ignorePrerequisites || getArcaneCoreRingStandardRanksInvested(state, node.branchId, node.ring) >= ARCANE_CORE_MAJOR_GATES[node.ring]
export const getArcaneCoreHighestUnlockedRing = (state: Pick<ArcaneCoreState, 'nodes'>, branchId: ArcaneCoreBranchId) => [...ARCANE_CORE_RING_INDICES].reverse().find((ring) => isArcaneCoreRingUnlocked(state, branchId, ring)) ?? 1
export const isArcaneCoreNodeReachable = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string, ignorePrerequisites = false) => {
  const node = getArcaneCoreNode(nodeId)
  return Boolean(node && isArcaneCoreRingUnlocked(state, node.branchId, node.ring, ignorePrerequisites) && isArcaneCoreMajorUnlocked(state, node, ignorePrerequisites))
}

export interface ArcanePointsGrantResult { state: ArcaneCoreState; requested: number; granted: number; pointsBefore: number; pointsAfter: number; reachedCap: boolean }
export const grantArcanePoints = (state: ArcaneCoreState, amount: number): ArcanePointsGrantResult => {
  const requested = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const pointsBefore = getArcaneCoreTotalPointsEarned(state)
  const pointsAfter = Math.min(ARCANE_CORE_TOTAL_TREE_COST, pointsBefore + requested)
  const next = copyState(state)
  next.totalPointsEarned = pointsAfter
  return { state: next, requested, granted: pointsAfter - pointsBefore, pointsBefore, pointsAfter, reachedCap: pointsAfter >= ARCANE_CORE_TOTAL_TREE_COST }
}
export const setArcaneCoreTotalPointsEarned = (state: ArcaneCoreState, amount: number) => ({ ...copyState(state), totalPointsEarned: safePoints(amount) })
export const purchaseArcaneCoreNode = (state: ArcaneCoreState, nodeId: string, options: ArcaneCoreActionOptions = {}): ArcaneCoreActionResult => {
  const node = getArcaneCoreNode(nodeId)
  if (!node) return { ok: false, reason: 'unknown-node' }
  const currentRank = getArcaneCoreNodeRank(state, nodeId)
  if (currentRank >= node.maxRank) return { ok: false, reason: 'already-max-rank' }
  if (!isArcaneCoreRingUnlocked(state, node.branchId, node.ring, options.ignorePrerequisites)) return { ok: false, reason: 'ring-locked' }
  if (!isArcaneCoreMajorUnlocked(state, node, options.ignorePrerequisites)) return { ok: false, reason: 'major-locked' }
  if (!options.freeCosts && getArcaneCoreAvailablePoints(state) < node.rankCost) return { ok: false, reason: 'not-enough-core-points' }
  const next = copyState(state)
  next.nodes[nodeId] = { rank: currentRank + 1 }
  return { ok: true, state: next }
}

const cascadeAfterRemoval = (state: ArcaneCoreState, nodeId: string) => {
  const next = copyState(state)
  const node = getArcaneCoreNode(nodeId)
  if (!node) return { next, removed: [], ringsRelocked: [], corePointsReturned: 0, ranksAffected: 0, majorsAffected: 0 }
  const currentRank = getArcaneCoreNodeRank(next, nodeId)
  if (currentRank <= 1) delete next.nodes[nodeId]
  else next.nodes[nodeId] = { rank: currentRank - 1 }
  const removed = new Set<string>([nodeId]); const ringsRelocked = new Set<string>(); let changed = true
  while (changed) {
    changed = false
    ARCANE_CORE_NODES.forEach((candidate) => {
      if (!isArcaneCoreNodePurchased(next, candidate.id) || isArcaneCoreRingUnlocked(next, candidate.branchId, candidate.ring)) return
      removed.add(candidate.id); ringsRelocked.add(`${candidate.branchId}-${candidate.ring}`); delete next.nodes[candidate.id]; changed = true
    })
    ARCANE_CORE_NODES.forEach((candidate) => {
      if (!isArcaneCoreNodePurchased(next, candidate.id) || isArcaneCoreMajorUnlocked(next, candidate)) return
      removed.add(candidate.id); ringsRelocked.add(`${candidate.branchId}-${candidate.ring}`); delete next.nodes[candidate.id]; changed = true
    })
  }
  const removedIds = [...removed]
  const ranksAffected = removedIds.reduce((sum, id) => sum + (id === nodeId ? 1 : getArcaneCoreNodeRank(state, id)), 0)
  const corePointsReturned = removedIds.reduce((sum, id) => sum + (id === nodeId ? 1 : getArcaneCoreNodeRank(state, id)) * (getArcaneCoreNode(id)?.rankCost ?? 0), 0)
  return { next, removed: removedIds, ringsRelocked: [...ringsRelocked], corePointsReturned, ranksAffected, majorsAffected: removedIds.filter((id) => getArcaneCoreNode(id)?.nodeType === 'major').length }
}
export interface ArcaneCoreRefundPreview { ok: true; state: ArcaneCoreState; nodeIds: string[]; nodesAffected: number; corePointsReturned: number; ranksAffected: number; majorsAffected: number; ringsRelocked: string[] }
export type ArcaneCoreRefundPreviewResult = ArcaneCoreRefundPreview | { ok: false; reason: ArcaneCoreFailureReason }
export const getArcaneCoreRefundPreview = (state: ArcaneCoreState, nodeId: string): ArcaneCoreRefundPreviewResult => {
  if (!getArcaneCoreNode(nodeId)) return { ok: false, reason: 'unknown-node' }
  if (!isArcaneCoreNodePurchased(state, nodeId)) return { ok: false, reason: 'not-purchased' }
  const result = cascadeAfterRemoval(state, nodeId)
  return { ok: true, state: result.next, nodeIds: result.removed, nodesAffected: result.removed.length, corePointsReturned: result.corePointsReturned, ranksAffected: result.ranksAffected, majorsAffected: result.majorsAffected, ringsRelocked: result.ringsRelocked }
}
export const refundArcaneCoreNode = (state: ArcaneCoreState, nodeId: string): ArcaneCoreActionResult => { const preview = getArcaneCoreRefundPreview(state, nodeId); return preview.ok ? { ok: true, state: preview.state } : preview }

export interface ArcaneCoreBranchResetPreview extends ArcaneCoreRefundPreview { branchId: ArcaneCoreBranchId }
export const getArcaneCoreBranchResetPreview = (state: ArcaneCoreState, branchId: ArcaneCoreBranchId): ArcaneCoreBranchResetPreview | { ok: false; reason: ArcaneCoreFailureReason } => {
  const branch = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === branchId)
  if (!branch) return { ok: false, reason: 'unknown-node' }
  const nodeIds = branch.nodes.filter((node) => isArcaneCoreNodePurchased(state, node.id)).map((node) => node.id); const next = copyState(state); nodeIds.forEach((id) => delete next.nodes[id])
  return { ok: true, state: next, branchId, nodeIds, nodesAffected: nodeIds.length, corePointsReturned: nodeIds.reduce((sum, id) => sum + getArcaneCoreNodeRank(state, id) * (getArcaneCoreNode(id)?.rankCost ?? 0), 0), ranksAffected: nodeIds.reduce((sum, id) => sum + getArcaneCoreNodeRank(state, id), 0), majorsAffected: nodeIds.filter((id) => getArcaneCoreNode(id)?.nodeType === 'major').length, ringsRelocked: [...new Set(branch.nodes.filter((node) => nodeIds.includes(node.id)).map((node) => `${branchId}-${node.ring}`))] }
}
export const resetArcaneCoreBranch = (state: ArcaneCoreState, branchId: ArcaneCoreBranchId): ArcaneCoreActionResult => { const preview = getArcaneCoreBranchResetPreview(state, branchId); return preview.ok ? { ok: true, state: preview.state } : preview }
export const resetArcaneCore = (state: ArcaneCoreState): ArcaneCoreActionResult => ({ ok: true, state: { arcaneCoreVersion: ARCANE_CORE_SCHEMA_VERSION, totalPointsEarned: getArcaneCoreTotalPointsEarned(state), nodes: {} } })

export const setArcaneCoreNodeRank = (state: ArcaneCoreState, nodeId: string, rank: number): ArcaneCoreActionResult => {
  const node = getArcaneCoreNode(nodeId); if (!node) return { ok: false, reason: 'unknown-node' }; const next = copyState(state); const safe = safeRank(node, rank)
  if (safe > 0) next.nodes[nodeId] = { rank: safe }; else delete next.nodes[nodeId]
  return { ok: true, state: next }
}
export const maxArcaneCoreNode = (state: ArcaneCoreState, nodeId: string): ArcaneCoreActionResult => setArcaneCoreNodeRank(state, nodeId, getArcaneCoreNode(nodeId)?.maxRank ?? 0)
export const resetArcaneCoreNode = (state: ArcaneCoreState, nodeId: string): ArcaneCoreActionResult => setArcaneCoreNodeRank(state, nodeId, 0)
export const maxArcaneCoreRing = (state: ArcaneCoreState, branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex) => { let current = copyState(state); ARCANE_CORE_NODES.filter((node) => node.branchId === branchId && node.ring === ring).forEach((node) => { const result = setArcaneCoreNodeRank(current, node.id, node.maxRank); if (result.ok) current = result.state }); return current }
export const maxArcaneCoreBranch = (state: ArcaneCoreState, branchId: ArcaneCoreBranchId) => { let current = copyState(state); ARCANE_CORE_RING_INDICES.forEach((ring) => { current = maxArcaneCoreRing(current, branchId, ring) }); return current }
export const resetArcaneCoreRing = (state: ArcaneCoreState, branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex): ArcaneCoreActionResult => { const next = copyState(state); ARCANE_CORE_NODES.filter((node) => node.branchId === branchId && node.ring >= ring).forEach((node) => delete next.nodes[node.id]); return { ok: true, state: next } }
export const purchaseAllArcaneCoreNodes = (state: ArcaneCoreState, branchId?: ArcaneCoreBranchId, options: ArcaneCoreActionOptions = {}) => {
  let current = copyState(state); let changed = true
  while (changed) {
    changed = false; let availablePoints = options.freeCosts ? Number.POSITIVE_INFINITY : getArcaneCoreAvailablePoints(current)
    ARCANE_CORE_NODES.filter((node) => !branchId || node.branchId === branchId).forEach((node) => { const currentRank = getArcaneCoreNodeRank(current, node.id); if (currentRank >= node.maxRank || !isArcaneCoreRingUnlocked(current, node.branchId, node.ring, options.ignorePrerequisites) || !isArcaneCoreMajorUnlocked(current, node, options.ignorePrerequisites) || availablePoints < node.rankCost) return; current.nodes[node.id] = { rank: currentRank + 1 }; availablePoints -= node.rankCost; changed = true })
  }
  return current
}

export const getArcaneCoreResolvedEffects = (state: Pick<ArcaneCoreState, 'nodes'> | undefined, node: ArcaneCoreNodeDefinition): ArcaneCoreResolvedEffects => { const rank = getArcaneCoreNodeRank(state, node.id); return rank > 0 ? node.resolveEffects(rank) : {} }
export const getArcaneCoreStaticStats = (state: Pick<ArcaneCoreState, 'nodes'>): EquipmentStats => ARCANE_CORE_NODES.reduce<EquipmentStats>((total, node) => { addEquipmentStats(total, getArcaneCoreResolvedEffects(state, node).stats); return total }, {})
export const getArcaneCoreCombatModifiers = (state: Pick<ArcaneCoreState, 'nodes'> | undefined) => ARCANE_CORE_NODES.flatMap((node) => getArcaneCoreResolvedEffects(state, node).modifiers ?? [])
export const getArcaneCoreCombatModifierProviders = (state: Pick<ArcaneCoreState, 'nodes'> | undefined) => ARCANE_CORE_NODES.flatMap((node) => (getArcaneCoreResolvedEffects(state, node).modifiers ?? []).map((modifier) => ({ node, modifier })))
export const getArcaneCoreCombatRules = (state: Pick<ArcaneCoreState, 'nodes'> | undefined): Array<{ node: ArcaneCoreNodeDefinition; rule: CombatTriggerRule }> => ARCANE_CORE_NODES.flatMap((node) => (getArcaneCoreResolvedEffects(state, node).rules ?? []).map((rule) => ({ node, rule })))
export const getArcaneCoreSpecialEffects = (state: Pick<ArcaneCoreState, 'nodes'> | undefined): ArcaneCoreSpecialEffect[] => ARCANE_CORE_NODES.flatMap((node) => getArcaneCoreResolvedEffects(state, node).special ?? [])
export const getArcaneCoreModifierTotals = getArcaneCoreStaticStats
