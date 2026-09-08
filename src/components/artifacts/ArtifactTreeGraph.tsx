import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { getArtifactNodePresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactPathGraph, type ArtifactPathGraph, type ArtifactPathGraphNode } from '../../game/presentation/artifacts/artifactPathReadModel'
import { getArtifactNodeEligibility } from '../../game/systems/artifacts/artifactProgression'
import type { ArtifactId, GameState } from '../../game/types'
import { ARTIFACTS, type ArtifactNodeDefinition } from '../../game/content/artifacts/artifacts'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS } from '../../game/content/monsters'

const glyphFor = (type: ArtifactNodeDefinition['type']) => type === 'minor' ? '●' : type === 'major' ? '◆' : '★'
const typeLabel = (type: ArtifactNodeDefinition['type']) => type === 'capstone' ? 'CAPSTONE' : type.toUpperCase()

export function ArtifactTreeGraph({ state, artifactId, selectedNodeId, onSelect }: { state: GameState; artifactId: ArtifactId; selectedNodeId: string | null; onSelect: (nodeId: string) => void }) {
  const definition = ARTIFACTS[artifactId]
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null)
  if (!definition) return null
  const graph = getArtifactPathGraph(definition)
  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('button, .artifact-tree-branch-label')) return
    if (event.button !== 0 && event.button !== 1) return
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }
  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current
    if (!active || active.pointerId !== event.pointerId) return
    setPan({ x: active.panX + event.clientX - active.x, y: active.panY + event.clientY - active.y })
  }
  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return <div className="artifact-tree-viewport" aria-label="Artifact progression tree" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}>
    <div className="artifact-tree-board" style={{ width: graph.width, height: graph.height, transform: `translate(${pan.x}px, ${pan.y}px)` }} data-pan-x={pan.x} data-pan-y={pan.y}>
      <svg className="artifact-tree-connectors" width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true">
        {graph.connections.map((connection) => <Connector key={`${connection.from}-${connection.to}`} graph={graph} connection={connection} state={state} artifactId={artifactId} />)}
      </svg>
      <div className="artifact-tree-root-label">CORE PATH</div>
      {graph.branches.map((branch, index) => {
        const x = graph.width * (index + 1) / (graph.branches.length + 1)
        return <div className="artifact-tree-branch-label" key={branch.branch.id} style={{ left: x - 118, top: 180 }}><strong>{branch.branch.name}</strong>{branch.branch.description && <span>{branch.branch.description}</span>}</div>
      })}
      {graph.nodes.map((entry) => <TreeGraphNode key={entry.node.id} entry={entry} state={state} artifactId={artifactId} selected={selectedNodeId === entry.node.id} onSelect={onSelect} />)}
    </div>
    <span className="artifact-tree-pan-hint">DRAG EMPTY SPACE TO PAN</span>
  </div>
}

function Connector({ graph, connection, state, artifactId }: { graph: ArtifactPathGraph; connection: ArtifactPathGraph['connections'][number]; state: GameState; artifactId: ArtifactId }) {
  const from = graph.nodes.find((entry) => entry.node.id === connection.from)
  const to = graph.nodes.find((entry) => entry.node.id === connection.to)
  if (!from || !to) return null
  const fromEligibility = getArtifactNodeEligibility(state, artifactId, from.node.id)
  const toEligibility = getArtifactNodeEligibility(state, artifactId, to.node.id)
  const energized = ['allocated', 'attuned'].includes(fromEligibility.status) || ['allocated', 'attuned'].includes(toEligibility.status)
  return <path className={`artifact-tree-connector${energized ? ' energized' : ''}`} d={connection.path} />
}

function TreeGraphNode({ entry, state, artifactId, selected, onSelect }: { entry: ArtifactPathGraphNode; state: GameState; artifactId: ArtifactId; selected: boolean; onSelect: (nodeId: string) => void }) {
  const node = entry.node
  const eligibility = getArtifactNodeEligibility(state, artifactId, node.id)
  const presentation = getArtifactNodePresentation(node)
  const stateClass = eligibility.status === 'allocated' ? 'allocated' : eligibility.status === 'attuned' ? 'attuned' : eligibility.status === 'available' ? 'available' : 'locked'
  const blocked = !['allocated', 'attuned', 'available'].includes(eligibility.status)
  const reason = getEligibilityLabel(artifactId, node, eligibility.status, eligibility.missingPrerequisiteIds)
  const meaningfulReason = shouldShowReason(eligibility.status) ? reason : null
  const showPointCost = node.pointCost > 1
  const nodeStyle = { left: entry.x - 98, top: entry.y } as CSSProperties
  return <GameTooltip wide content={<TooltipContent title={`${typeLabel(node.type)} · ${node.name}`} description={`${presentation.summary} · ${reason}`} />}>
    <button type="button" className={`artifact-tree-node artifact-node-${node.type} artifact-node-state-${stateClass}${blocked ? ' blocked' : ''}${selected ? ' selected' : ''}`} style={nodeStyle} aria-label={`${node.name}. ${typeLabel(node.type)} node. Cost ${node.pointCost} Artifact Point${node.pointCost === 1 ? '' : 's'}. Effect: ${presentation.summary}. State: ${reason}.`} onClick={() => onSelect(node.id)}>
      <span className="artifact-node-glyph" aria-hidden="true">{glyphFor(node.type)}</span>
      <span className="artifact-node-copy"><strong>{node.name}</strong></span>
      <span className="artifact-node-state">{stateClass === 'locked' ? 'BLOCKED' : stateClass.toUpperCase()}{showPointCost && <small className="artifact-node-cost" aria-label={`${node.pointCost} Artifact Points`}>{node.pointCost} PT</small>}</span>
      <span className="artifact-node-effect">{presentation.summary}</span>
      {meaningfulReason && <small className="artifact-node-reason">{meaningfulReason}</small>}
    </button>
  </GameTooltip>
}

function shouldShowReason(status: ReturnType<typeof getArtifactNodeEligibility>['status']) {
  return !['allocated', 'attuned', 'available'].includes(status)
}

function getEligibilityLabel(artifactId: ArtifactId, node: ArtifactNodeDefinition, status: ReturnType<typeof getArtifactNodeEligibility>['status'], missingPrerequisiteIds: string[]) {
  switch (status) {
    case 'allocated': return 'ALLOCATED'
    case 'attuned': return 'ATTUNED · AVAILABLE'
    case 'available': return 'AVAILABLE'
    case 'unowned': return `OWN ${ITEMS[artifactId]?.name ?? 'ARTIFACT'} FIRST`
    case 'missingLevel': return `REQUIRES LEVEL ${node.requiresLevel}`
    case 'missingPoints': return `NEED ${node.pointCost} POINT${node.pointCost === 1 ? '' : 'S'}`
    case 'missingPrerequisites': return `REQUIRES ${missingPrerequisiteIds.map((id) => ARTIFACTS[artifactId]?.nodes.find((entry) => entry.id === id)?.name ?? 'PRIOR NODE').join(', ')}`
    case 'missingBoss': return `${MONSTERS[node.requiresBossKill ?? 'forest-heart']?.name ?? 'BOSS'} REQUIRED`
    case 'missingCatalyst': return `NEED ${node.catalyst ? `${ITEMS[node.catalyst.itemId]?.name ?? 'CATALYST'} ×${node.catalyst.quantity}` : 'CATALYST'}`
  }
}
