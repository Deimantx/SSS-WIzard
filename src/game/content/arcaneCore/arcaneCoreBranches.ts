import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId, ArcaneCoreNodeDefinition } from '../../types'
import { powerNodes } from './powerNodes'
import { vitalityNodes } from './vitalityNodes'
import { focusNodes } from './focusNodes'
import { controlNodes } from './controlNodes'
import { getArcaneCoreV6CatalogEntry } from './arcaneCoreV6Catalog'
import { resolveArcaneCoreV6Effects } from './arcaneCoreV6Runtime'

const createBranch = (id: ArcaneCoreBranchId, name: string, description: string, accent: string, nodes: ArcaneCoreNodeDefinition[][]): ArcaneCoreBranchDefinition => {
  const ringSlots: Record<number, number> = {}
  const v6Nodes = nodes.flat().map((node) => {
    const slot = node.nodeType === 'major' ? 9 : (ringSlots[node.ring] = (ringSlots[node.ring] ?? 0) + 1)
    const entry = getArcaneCoreV6CatalogEntry(id, node.ring, slot)
    return entry ? { ...node, name: entry.name, description: entry.description, resolveEffects: (rank: number) => resolveArcaneCoreV6Effects(entry, rank) } : node
  })
  return { id, name, description, accent, nodes: v6Nodes }
}

export const ARCANE_CORE_BRANCHES: ArcaneCoreBranchDefinition[] = [
  createBranch('power', 'Power', 'Sharpen spellcraft, critical force, and direct offense.', 'var(--arcane-core-power)', powerNodes),
  createBranch('vitality', 'Vitality', 'Build a stronger frame, ward, and recovery cycle.', 'var(--arcane-core-vitality)', vitalityNodes),
  createBranch('focus', 'Focus', 'Expand the reserves that let the tower sustain its work.', 'var(--arcane-core-focus)', focusNodes),
  createBranch('control', 'Control', 'Tighten timing, recovery, and spell control.', 'var(--arcane-core-control)', controlNodes),
]

export const ARCANE_CORE_BRANCH_BY_ID = Object.fromEntries(ARCANE_CORE_BRANCHES.map((branch) => [branch.id, branch])) as Record<ArcaneCoreBranchDefinition['id'], ArcaneCoreBranchDefinition>
export const ARCANE_CORE_NODES = ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes)
export const ARCANE_CORE_NODE_BY_ID = Object.fromEntries(ARCANE_CORE_NODES.map((node) => [node.id, node]))

export const getArcaneCoreBranch = (branchId: ArcaneCoreBranchDefinition['id']) => ARCANE_CORE_BRANCH_BY_ID[branchId]
export const getArcaneCoreNode = (nodeIdValue: string) => ARCANE_CORE_NODE_BY_ID[nodeIdValue]
