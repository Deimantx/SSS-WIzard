import type { ArtifactDefinition, ArtifactMajorMilestoneDefinition, ArtifactMinorNodeDefinition } from '../../content/artifacts/artifacts'

export interface ArtifactRankGraphNode { id: string; kind: 'minor' | 'major'; minor?: ArtifactMinorNodeDefinition; major?: ArtifactMajorMilestoneDefinition; x: number; y: number }
export interface ArtifactPathConnection { from: string; to: string; path: string }
export interface ArtifactRankGraph { minorNodes: ArtifactRankGraphNode[]; majorNodes: ArtifactRankGraphNode[]; connections: ArtifactPathConnection[]; width: number; height: number }
const ACT0_MINOR_POSITIONS = [[0.50, 0.10], [0.27, 0.32], [0.73, 0.32], [0.33, 0.60], [0.67, 0.60]] as const
const ACT1_MINOR_POSITIONS = [[0.50, 0.08], [0.20, 0.25], [0.50, 0.25], [0.80, 0.25], [0.30, 0.48], [0.70, 0.48]] as const
export const MAJOR_ROW_Y_OFFSET_PX = 100
const position = (width: number, height: number, normalized: readonly [number, number]) => ({ x: normalized[0] * width, y: normalized[1] * height })

/** Symmetric V6 board layout: circles are authored nodes and milestones form a clean bottom rail. */
export const getArtifactRankGraph = (definition: ArtifactDefinition): ArtifactRankGraph => {
  const width = 860; const height = 500; const minorPositions = definition.minorNodes.length === 5 ? ACT0_MINOR_POSITIONS : ACT1_MINOR_POSITIONS
  const minorNodes = definition.minorNodes.map((minor, index) => ({ id: minor.id, kind: 'minor' as const, minor, ...position(width, height, minorPositions[index] ?? [0.5, 0.1]) }))
  const majorNodes = definition.majorMilestones.map((major, index) => {
    const point = position(width, height, [0.1 + (index / Math.max(1, definition.majorMilestones.length - 1)) * 0.8, 0.84])
    return { id: major.id, kind: 'major' as const, major, x: point.x, y: point.y + MAJOR_ROW_Y_OFFSET_PX }
  })
  return { minorNodes, majorNodes, connections: [], width, height }
}
