import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { getArtifactMajorPresentation, getArtifactMinorPresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactRankGraph, type ArtifactRankGraph, type ArtifactRankGraphNode } from '../../game/presentation/artifacts/artifactPathReadModel'
import { getArtifactMinorRank, getArtifactTotalInvestedRanks } from '../../game/systems/artifacts/artifactProgression'
import type { ArtifactId, GameState } from '../../game/types'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'

export function ArtifactTreeGraph({ state, artifactId, selectedNodeId, onSelect }: { state: GameState; artifactId: ArtifactId; selectedNodeId: string | null; onSelect: (nodeId: string) => void }) {
  const definition = ARTIFACTS[artifactId]
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null)
  if (!definition) return null
  const graph = getArtifactRankGraph(definition)
  const startPan = (event: ReactPointerEvent<HTMLDivElement>) => { if ((event.target as HTMLElement).closest('button')) return; drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y }; event.currentTarget.setPointerCapture?.(event.pointerId); event.preventDefault() }
  const movePan = (event: ReactPointerEvent<HTMLDivElement>) => { const active = drag.current; if (active?.pointerId === event.pointerId) setPan({ x: active.panX + event.clientX - active.x, y: active.panY + event.clientY - active.y }) }
  const endPan = (event: ReactPointerEvent<HTMLDivElement>) => { if (drag.current?.pointerId !== event.pointerId) return; drag.current = null; if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }
  return <div className="artifact-tree-viewport" aria-label="Artifact rank progression track" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}><div className="artifact-tree-board" style={{ width: graph.width, height: graph.height, transform: `translate(${pan.x}px, ${pan.y}px)` }}><svg className="artifact-tree-connectors" width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true">{graph.connections.map((connection) => <Connector key={`${connection.from}-${connection.to}`} graph={graph} connection={connection} state={state} artifactId={artifactId} />)}</svg><div className="artifact-tree-root-label">MINOR RANK TRACK</div><div className="artifact-tree-branch-label" style={{ left: 18, top: 250 }}><strong>MAJOR MILESTONES</strong><span>Automatic unlocks at total invested ranks</span></div>{[...graph.minorNodes, ...graph.majorNodes].map((entry) => <RankGraphNode key={entry.id} entry={entry} state={state} artifactId={artifactId} selected={selectedNodeId === entry.id} onSelect={onSelect} />)}</div><span className="artifact-tree-pan-hint">DRAG EMPTY SPACE TO PAN</span></div>
}

function Connector({ graph, connection, state, artifactId }: { graph: ArtifactRankGraph; connection: ArtifactRankGraph['connections'][number]; state: GameState; artifactId: ArtifactId }) {
  const from = [...graph.minorNodes, ...graph.majorNodes].find((entry) => entry.id === connection.from)
  const to = [...graph.minorNodes, ...graph.majorNodes].find((entry) => entry.id === connection.to)
  if (!from || !to) return null
  const energized = from.kind === 'minor' ? getArtifactMinorRank(state, artifactId, from.id) > 0 : getArtifactTotalInvestedRanks(state, artifactId) >= (from.major?.unlockAtTotalRanks ?? Infinity)
  return <path className={`artifact-tree-connector${energized ? ' energized' : ''}`} d={connection.path} />
}

function RankGraphNode({ entry, state, artifactId, selected, onSelect }: { entry: ArtifactRankGraphNode; state: GameState; artifactId: ArtifactId; selected: boolean; onSelect: (nodeId: string) => void }) {
  const currentRanks = getArtifactTotalInvestedRanks(state, artifactId)
  const isMinor = entry.kind === 'minor'
  const rank = isMinor ? getArtifactMinorRank(state, artifactId, entry.id) : 0
  const milestone = entry.major?.unlockAtTotalRanks ?? Infinity
  const active = isMinor ? rank > 0 : currentRanks >= milestone
  const presentation = isMinor && entry.minor ? getArtifactMinorPresentation(entry.minor, rank) : entry.major ? getArtifactMajorPresentation(entry.major) : { summary: '', details: [] }
  const style = { left: entry.x - (isMinor ? 54 : 70), top: entry.y } as CSSProperties
  return <GameTooltip wide content={<TooltipContent title={`${isMinor ? 'MINOR' : 'MAJOR'} · ${entry.minor?.name ?? entry.major?.name ?? entry.id}`} description={isMinor ? `${rank} / 10 ranks · ${presentation.summary}` : `${active ? 'ACTIVE' : `UNLOCKS AT ${milestone} RANKS`} · ${presentation.summary}`} />}><button type="button" className={`artifact-tree-node artifact-node-${entry.kind}${active ? ' active' : ''}${selected ? ' selected' : ''}`} style={style} onClick={() => onSelect(entry.id)} aria-label={`${entry.minor?.name ?? entry.major?.name}. ${isMinor ? `${rank} of 10 ranks` : `milestone at ${milestone} total ranks`}. ${presentation.summary}`}><span className="artifact-node-glyph" aria-hidden="true">{isMinor ? '●' : '◆'}</span><strong>{entry.minor?.name ?? entry.major?.name}</strong><span className="artifact-node-state">{isMinor ? `${rank} / 10` : active ? 'ACTIVE' : `${milestone} TOTAL`}</span><span className="artifact-node-effect">{presentation.summary}</span></button></GameTooltip>
}
