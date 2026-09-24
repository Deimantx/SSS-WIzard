import type { ArtifactDefinition, ArtifactMajorMilestoneDefinition, ArtifactMinorNodeDefinition } from '../../content/artifacts/artifacts'

export interface ArtifactRankGraphNode {
  id: string
  kind: 'minor' | 'major'
  minor?: ArtifactMinorNodeDefinition
  major?: ArtifactMajorMilestoneDefinition
  x: number
  y: number
}
export interface ArtifactPathConnection { from: string; to: string; path: string }
export interface ArtifactRankGraph { minorNodes: ArtifactRankGraphNode[]; majorNodes: ArtifactRankGraphNode[]; connections: ArtifactPathConnection[]; width: number; height: number }

/** Deterministic layout for the authored V6 rank track. Minor nodes are the active circles; majors form the milestone rail. */
export const getArtifactRankGraph = (definition: ArtifactDefinition): ArtifactRankGraph => {
  const width = Math.max(760, definition.minorNodes.length * 138 + 80)
  const minorNodes = definition.minorNodes.map((minor, index) => ({ id: minor.id, kind: 'minor' as const, minor, x: 70 + index * ((width - 140) / Math.max(1, definition.minorNodes.length - 1)), y: 120 }))
  const majorNodes = definition.majorMilestones.map((major, index) => ({ id: major.id, kind: 'major' as const, major, x: 110 + index * ((width - 220) / Math.max(1, definition.majorMilestones.length - 1)), y: 310 }))
  const connections: ArtifactPathConnection[] = []
  minorNodes.slice(1).forEach((node, index) => { const previous = minorNodes[index]; connections.push({ from: previous.id, to: node.id, path: `M ${previous.x} 145 L ${node.x} 145` }) })
  minorNodes.forEach((node, index) => { const major = majorNodes[Math.min(majorNodes.length - 1, Math.floor(index * majorNodes.length / Math.max(1, minorNodes.length)))]; if (major) connections.push({ from: node.id, to: major.id, path: `M ${node.x} 150 C ${node.x} 220, ${major.x} 235, ${major.x} 280` }) })
  majorNodes.slice(1).forEach((node, index) => { const previous = majorNodes[index]; connections.push({ from: previous.id, to: node.id, path: `M ${previous.x} 335 L ${node.x} 335` }) })
  return { minorNodes, majorNodes, connections, width, height: 410 }
}
