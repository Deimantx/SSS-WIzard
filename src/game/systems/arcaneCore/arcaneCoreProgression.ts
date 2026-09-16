import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES, getArcaneCoreNode } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_MAX_TOTAL_XP, getArcaneCoreLevelForXp, getArcaneCoreTotalXpForLevel, getArcaneCoreXpForLevel } from '../../content/arcaneCore/arcaneCoreBalance'
import type { ArcaneCoreNodeDefinition, ArcaneCoreNodeProgress, ArcaneCoreSpecialEffect, ArcaneCoreState, EquipmentStats } from '../../types'
import type { CombatModifier, CombatTriggerRule } from '../combat/combatTypes'

export type ArcaneCoreFailureReason = 'unknown-node' | 'already-purchased' | 'not-reachable' | 'not-enough-core-points' | 'not-purchased' | 'invalid-preset'
export type ArcaneCoreActionResult = { ok: true; state: ArcaneCoreState } | { ok: false; reason: ArcaneCoreFailureReason }
export interface ArcaneCoreActionOptions { freeCosts?: boolean; ignorePrerequisites?: boolean }

export interface ArcaneCoreLevelInfo {
  level: number
  totalXp: number
  xpIntoLevel: number
  xpToNextLevel: number
  pointsEarned: number
  pointsSpent: number
  pointsAvailable: number
}

export const createInitialArcaneCoreState = (): ArcaneCoreState => ({ totalXp: 0, nodes: {} })
const safeXp = (value: number) => Math.max(0, Math.min(ARCANE_CORE_MAX_TOTAL_XP, Math.floor(Number.isFinite(value) ? value : 0)))
const copyState = (state: ArcaneCoreState): ArcaneCoreState => ({
  totalXp: safeXp(state.totalXp),
  nodes: Object.fromEntries(Object.entries(state.nodes ?? {}).flatMap(([id, progress]) => progress?.purchased ? [[id, { purchased: true as const }]] : [])) as ArcaneCoreState['nodes'],
})

export const getArcaneCoreNodeProgress = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string): { purchased: boolean } => ({ purchased: Boolean(state.nodes?.[nodeId]?.purchased) })
export const isArcaneCoreNodePurchased = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string) => Boolean(state.nodes?.[nodeId]?.purchased)
export const getArcaneCoreLevel = (state: Pick<ArcaneCoreState, 'totalXp'>) => getArcaneCoreLevelForXp(safeXp(state.totalXp))
export const getArcaneCoreTotalPointsEarned = (state: Pick<ArcaneCoreState, 'totalXp'>) => getArcaneCoreLevel(state) - 1
export const getArcaneCorePointsSpent = (state: Pick<ArcaneCoreState, 'nodes'>) => Object.values(state.nodes ?? {}).reduce((sum, progress) => sum + (progress?.purchased ? 1 : 0), 0)
export const getArcaneCoreAvailablePoints = (state: ArcaneCoreState) => Math.max(0, getArcaneCoreTotalPointsEarned(state) - getArcaneCorePointsSpent(state))
export const getArcaneCoreXpIntoCurrentLevel = (state: Pick<ArcaneCoreState, 'totalXp'>) => safeXp(state.totalXp) - getArcaneCoreTotalXpForLevel(getArcaneCoreLevel(state))
export const getArcaneCoreXpToNextLevel = (state: Pick<ArcaneCoreState, 'totalXp'>) => getArcaneCoreLevel(state) >= ARCANE_CORE_MAX_LEVEL ? 0 : Math.max(0, getArcaneCoreTotalXpForLevel(getArcaneCoreLevel(state) + 1) - safeXp(state.totalXp))
export const getArcaneCoreLevelInfo = (state: ArcaneCoreState): ArcaneCoreLevelInfo => ({ level: getArcaneCoreLevel(state), totalXp: safeXp(state.totalXp), xpIntoLevel: getArcaneCoreXpIntoCurrentLevel(state), xpToNextLevel: getArcaneCoreXpToNextLevel(state), pointsEarned: getArcaneCoreTotalPointsEarned(state), pointsSpent: getArcaneCorePointsSpent(state), pointsAvailable: getArcaneCoreAvailablePoints(state) })

const isReachable = (state: Pick<ArcaneCoreState, 'nodes'>, node: ArcaneCoreNodeDefinition, ignorePrerequisites = false) => ignorePrerequisites || node.prerequisites.length === 0 || (node.prerequisiteMode === 'all' ? node.prerequisites.every((id) => isArcaneCoreNodePurchased(state, id)) : node.prerequisites.some((id) => isArcaneCoreNodePurchased(state, id)))
export const isArcaneCoreNodeReachable = (state: Pick<ArcaneCoreState, 'nodes'>, nodeId: string, ignorePrerequisites = false) => {
  const node = getArcaneCoreNode(nodeId)
  return Boolean(node && isReachable(state, node, ignorePrerequisites))
}

export const grantArcaneCoreXp = (state: ArcaneCoreState, amount: number) => {
  const beforeLevel = getArcaneCoreLevel(state)
  const beforeXp = safeXp(state.totalXp)
  const granted = Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0))
  const next = copyState(state)
  next.totalXp = Math.min(ARCANE_CORE_MAX_TOTAL_XP, beforeXp + granted)
  const afterLevel = getArcaneCoreLevel(next)
  return { state: next, requested: granted, granted: next.totalXp - beforeXp, levelBefore: beforeLevel, levelAfter: afterLevel, levelsGained: afterLevel - beforeLevel }
}

export const setArcaneCoreXp = (state: ArcaneCoreState, amount: number) => ({ ...copyState(state), totalXp: safeXp(amount) })
export const setArcaneCoreLevel = (state: ArcaneCoreState, level: number) => ({ ...copyState(state), totalXp: getArcaneCoreTotalXpForLevel(Math.max(1, Math.min(ARCANE_CORE_MAX_LEVEL, Math.floor(Number.isFinite(level) ? level : 1)))) })

export const purchaseArcaneCoreNode = (state: ArcaneCoreState, nodeId: string, options: ArcaneCoreActionOptions = {}): ArcaneCoreActionResult => {
  const node = getArcaneCoreNode(nodeId)
  if (!node) return { ok: false, reason: 'unknown-node' }
  if (isArcaneCoreNodePurchased(state, nodeId)) return { ok: false, reason: 'already-purchased' }
  if (!isReachable(state, node, options.ignorePrerequisites)) return { ok: false, reason: 'not-reachable' }
  if (!options.freeCosts && getArcaneCoreAvailablePoints(state) < node.cost) return { ok: false, reason: 'not-enough-core-points' }
  const next = copyState(state)
  next.nodes[nodeId] = { purchased: true }
  return { ok: true, state: next }
}

const cascadeAfterRemoval = (state: ArcaneCoreState, removedId: string) => {
  const next = copyState(state)
  const removed = new Set([removedId])
  delete next.nodes[removedId]
  let changed = true
  while (changed) {
    changed = false
    Object.keys(next.nodes).forEach((id) => {
      const node = getArcaneCoreNode(id)
      if (node && isReachable(next, node)) return
      removed.add(id)
      delete next.nodes[id]
      changed = true
    })
  }
  return { next, removed: [...removed] }
}

export interface ArcaneCoreRefundPreview { ok: true; state: ArcaneCoreState; nodeIds: string[]; nodesAffected: number; corePointsReturned: number } 
export type ArcaneCoreRefundPreviewResult = ArcaneCoreRefundPreview | { ok: false; reason: ArcaneCoreFailureReason }
export const getArcaneCoreRefundPreview = (state: ArcaneCoreState, nodeId: string): ArcaneCoreRefundPreviewResult => {
  if (!getArcaneCoreNode(nodeId)) return { ok: false, reason: 'unknown-node' }
  if (!isArcaneCoreNodePurchased(state, nodeId)) return { ok: false, reason: 'not-purchased' as ArcaneCoreFailureReason }
  const { next, removed } = cascadeAfterRemoval(state, nodeId)
  return { ok: true, state: next, nodeIds: removed, nodesAffected: removed.length, corePointsReturned: removed.length }
}
export const refundArcaneCoreNode = (state: ArcaneCoreState, nodeId: string): ArcaneCoreActionResult => {
  const preview = getArcaneCoreRefundPreview(state, nodeId)
  return preview.ok ? { ok: true, state: preview.state } : preview
}

export interface ArcaneCoreBranchResetPreview extends ArcaneCoreRefundPreview { branchId: ArcaneCoreNodeDefinition['branchId'] }
export const getArcaneCoreBranchResetPreview = (state: ArcaneCoreState, branchId: ArcaneCoreNodeDefinition['branchId']): ArcaneCoreBranchResetPreview | { ok: false; reason: ArcaneCoreFailureReason } => {
  const branch = ARCANE_CORE_BRANCHES.find((candidate) => candidate.id === branchId)
  if (!branch) return { ok: false, reason: 'unknown-node' }
  const nodeIds = branch.nodes.filter((node) => isArcaneCoreNodePurchased(state, node.id)).map((node) => node.id)
  const next = copyState(state)
  nodeIds.forEach((id) => delete next.nodes[id])
  return { ok: true, state: next, branchId, nodeIds, nodesAffected: nodeIds.length, corePointsReturned: nodeIds.length }
}
export const resetArcaneCoreBranch = (state: ArcaneCoreState, branchId: ArcaneCoreNodeDefinition['branchId']): ArcaneCoreActionResult => {
  const preview = getArcaneCoreBranchResetPreview(state, branchId)
  return preview.ok ? { ok: true, state: preview.state } : preview
}
export const resetArcaneCore = (state: ArcaneCoreState): ArcaneCoreActionResult => ({ ok: true, state: { totalXp: safeXp(state.totalXp), nodes: {} } })

export const purchaseAllArcaneCoreNodes = (state: ArcaneCoreState, branchId?: ArcaneCoreNodeDefinition['branchId'], options: ArcaneCoreActionOptions = {}) => {
  let current = copyState(state)
  const nodes = ARCANE_CORE_NODES.filter((node) => !branchId || node.branchId === branchId)
  nodes.forEach((node) => {
    const result = purchaseArcaneCoreNode(current, node.id, options)
    if (result.ok) current = result.state
  })
  return current
}

export const getArcaneCoreStaticStats = (state: Pick<ArcaneCoreState, 'nodes'>): EquipmentStats => ARCANE_CORE_NODES.reduce<EquipmentStats>((total, node) => {
  if (!isArcaneCoreNodePurchased(state, node.id) || !node.stats) return total
  Object.entries(node.stats).forEach(([key, value]) => { const numeric = typeof value === 'number' ? value : 0; if (key === 'resistances' && value) total.resistances = { ...(total.resistances ?? {}), ...Object.fromEntries(Object.entries(value).map(([damageType, resistance]) => [damageType, (total.resistances?.[damageType as keyof NonNullable<EquipmentStats['resistances']>] ?? 0) + (typeof resistance === 'number' ? resistance : 0)])) } as never; else total[key as keyof EquipmentStats] = ((total[key as keyof EquipmentStats] ?? 0) as number + numeric) as never })
  return total
}, {})
export const getArcaneCoreCombatModifiers = (state: Pick<ArcaneCoreState, 'nodes'>) => ARCANE_CORE_NODES.flatMap((node) => isArcaneCoreNodePurchased(state, node.id) ? node.modifiers ?? [] : [])
export const getArcaneCoreCombatRules = (state: Pick<ArcaneCoreState, 'nodes'>): Array<{ node: ArcaneCoreNodeDefinition; rule: CombatTriggerRule }> => ARCANE_CORE_NODES.flatMap((node) => isArcaneCoreNodePurchased(state, node.id) ? (node.rules ?? []).map((rule) => ({ node, rule })) : [])
export const getArcaneCoreSpecialEffects = (state: Pick<ArcaneCoreState, 'nodes'>): ArcaneCoreSpecialEffect[] => ARCANE_CORE_NODES.flatMap((node) => isArcaneCoreNodePurchased(state, node.id) ? node.special ?? [] : [])

/** Compatibility alias for consumers still reading the old stat aggregation name. */
export const getArcaneCoreModifierTotals = getArcaneCoreStaticStats
