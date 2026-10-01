import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId, ArcaneCoreNodeDefinition } from '../../types'
import { powerNodes } from './powerNodes'
import { vitalityNodes } from './vitalityNodes'
import { manaNodes } from './manaNodes'
import { controlNodes } from './controlNodes'

const createBranch = (id: ArcaneCoreBranchId, name: string, description: string, accent: string, nodes: ArcaneCoreNodeDefinition[][]): ArcaneCoreBranchDefinition => {
  return { id, name, description, accent, nodes: nodes.flat() }
}

export const ARCANE_CORE_BRANCHES: ArcaneCoreBranchDefinition[] = [
  createBranch('power', 'Power', 'Sharpen spellcraft, critical force, and direct offense.', 'var(--arcane-core-power)', powerNodes),
  createBranch('vitality', 'Vitality', 'Build a stronger frame, ward, and recovery cycle.', 'var(--arcane-core-vitality)', vitalityNodes),
  createBranch('mana', 'Mana', 'Expand combat Mana reserves, recovery, efficiency, and resource-driven casting.', 'var(--arcane-core-mana)', manaNodes),
  createBranch('control', 'Control', 'Tighten timing, recovery, and spell control.', 'var(--arcane-core-control)', controlNodes),
]

export const ARCANE_CORE_BRANCH_BY_ID = Object.fromEntries(ARCANE_CORE_BRANCHES.map((branch) => [branch.id, branch])) as Record<ArcaneCoreBranchDefinition['id'], ArcaneCoreBranchDefinition>
export const ARCANE_CORE_NODES = ARCANE_CORE_BRANCHES.flatMap((branch) => branch.nodes)
export const ARCANE_CORE_NODE_BY_ID = Object.fromEntries(ARCANE_CORE_NODES.map((node) => [node.id, node]))

export const getArcaneCoreBranch = (branchId: ArcaneCoreBranchDefinition['id']) => ARCANE_CORE_BRANCH_BY_ID[branchId]
export const getArcaneCoreNode = (nodeIdValue: string) => ARCANE_CORE_NODE_BY_ID[nodeIdValue]
