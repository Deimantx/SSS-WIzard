import type { ArtifactBranchDefinition, ArtifactDefinition, ArtifactNodeDefinition } from '../../content/artifacts/artifacts'

export interface ArtifactPathNode { node: ArtifactNodeDefinition; depth: number }
export interface ArtifactPathBranch { branch: ArtifactBranchDefinition; nodes: ArtifactPathNode[] }
export interface ArtifactPathTree { sharedNodes: ArtifactPathNode[]; branches: ArtifactPathBranch[] }

export const getArtifactPathTree = (definition: ArtifactDefinition): ArtifactPathTree => {
  const depthCache = new Map<string, number>()
  const depthOf = (node: ArtifactNodeDefinition, visiting = new Set<string>()): number => {
    const cached = depthCache.get(node.id)
    if (cached !== undefined) return cached
    if (visiting.has(node.id)) return 0
    visiting.add(node.id)
    const depth = (node.prerequisites ?? []).reduce((max, prerequisite) => {
      const parent = definition.nodes.find((candidate) => candidate.id === prerequisite)
      return Math.max(max, parent ? depthOf(parent, visiting) + 1 : 0)
    }, 0)
    visiting.delete(node.id)
    depthCache.set(node.id, depth)
    return depth
  }
  const withDepth = (nodes: ArtifactNodeDefinition[]) => nodes.map((node) => ({ node, depth: depthOf(node) })).sort((left, right) => left.depth - right.depth || left.node.requiresLevel - right.node.requiresLevel)
  return {
    sharedNodes: withDepth(definition.nodes.filter((node) => node.branch === 'shared')),
    branches: definition.branches.map((branch) => ({ branch, nodes: withDepth(definition.nodes.filter((node) => node.branch === branch.id)) })),
  }
}

