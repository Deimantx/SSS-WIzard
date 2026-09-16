import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId } from '../../types'
import { lane } from './arcaneCoreNodeFactory'
import { powerNodes } from './powerNodes'
import { vitalityNodes } from './vitalityNodes'
import { focusNodes } from './focusNodes'
import { controlNodes } from './controlNodes'

const createBranch = (id: ArcaneCoreBranchId, name: string, description: string, accent: string, nodes: ReturnType<typeof lane>[]): ArcaneCoreBranchDefinition => {
  const flatNodes = nodes.flat()
  return { id, name, description, accent, rootId: flatNodes[0]?.id ?? `${id}-a1`, nodes: flatNodes }
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
