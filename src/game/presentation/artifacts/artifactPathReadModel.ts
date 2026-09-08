import type { ArtifactBranchDefinition, ArtifactDefinition, ArtifactNodeDefinition } from '../../content/artifacts/artifacts'

export interface ArtifactPathNode { node: ArtifactNodeDefinition; depth: number }
export interface ArtifactPathBranch { branch: ArtifactBranchDefinition; nodes: ArtifactPathNode[] }
export interface ArtifactPathTree { sharedNodes: ArtifactPathNode[]; branches: ArtifactPathBranch[] }
export interface ArtifactPathGraphNode extends ArtifactPathNode { x: number; y: number; column: 'shared' | string }
export interface ArtifactPathConnection { from: string; to: string; path: string }
export interface ArtifactPathGraph { nodes: ArtifactPathGraphNode[]; connections: ArtifactPathConnection[]; width: number; height: number; branches: ArtifactPathBranch[] }

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

/** Deterministic presentation layout for the path graph. Authored node data remains the source of truth. */
export const getArtifactPathGraph = (definition: ArtifactDefinition): ArtifactPathGraph => {
  const tree = getArtifactPathTree(definition)
  const width = Math.max(760, (tree.branches.length + 1) * 280)
  const nodes: ArtifactPathGraphNode[] = []
  const sharedX = width / 2
  tree.sharedNodes.forEach((entry, index) => nodes.push({ ...entry, x: sharedX, y: 34 + index * 118, column: 'shared' }))
  tree.branches.forEach(({ branch, nodes: branchNodes }, branchIndex) => {
    const x = width * (branchIndex + 1) / (tree.branches.length + 1)
    const sameDepth = new Map<number, number>()
    branchNodes.forEach((entry) => {
      const offset = sameDepth.get(entry.depth) ?? 0
      sameDepth.set(entry.depth, offset + 1)
      nodes.push({ ...entry, x, y: 120 + entry.depth * 128 + offset * 128, column: branch.id })
    })
  })
  const nodeById = new Map(nodes.map((entry) => [entry.node.id, entry]))
  const connections: ArtifactPathConnection[] = []
  nodes.forEach((entry) => (entry.node.prerequisites ?? []).forEach((prerequisite) => {
    const parent = nodeById.get(prerequisite)
    if (!parent) return
    const parentHeight = parent.node.type === 'capstone' ? 122 : parent.node.type === 'major' ? 114 : 106
    const startY = parent.y + parentHeight
    const endY = entry.y - 6
    const midY = startY + Math.max(20, (endY - startY) / 2)
    connections.push({ from: prerequisite, to: entry.node.id, path: `M ${parent.x} ${startY} C ${parent.x} ${midY}, ${entry.x} ${midY}, ${entry.x} ${endY}` })
  }))
  const maxY = Math.max(470, ...nodes.map((entry) => entry.y + (entry.node.type === 'capstone' ? 122 : entry.node.type === 'major' ? 114 : 106)))
  return { nodes, connections, width, height: maxY, branches: tree.branches }
}
