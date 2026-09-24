import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { getArtifactMajorPresentation, getArtifactMinorPresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactRankGraph, type ArtifactRankGraphNode } from '../../game/presentation/artifacts/artifactPathReadModel'
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
  return <div className="artifact-tree-viewport" aria-label="Artifact rank progression track" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan}><div className="artifact-tree-board" style={{ width: graph.width, height: graph.height, transform: `translate(${pan.x}px, ${pan.y}px)` }}>{[...graph.minorNodes, ...graph.majorNodes].map((entry) => <RankGraphNode key={entry.id} entry={entry} state={state} artifactId={artifactId} selected={selectedNodeId === entry.id} onSelect={onSelect} />)}</div><span className="artifact-tree-pan-hint">DRAG EMPTY SPACE TO PAN</span></div>
}

function RankGraphNode({ entry, state, artifactId, selected, onSelect }: { entry: ArtifactRankGraphNode; state: GameState; artifactId: ArtifactId; selected: boolean; onSelect: (nodeId: string) => void }) {
  const currentRanks = getArtifactTotalInvestedRanks(state, artifactId)
  const isMinor = entry.kind === 'minor'
  const rank = isMinor ? getArtifactMinorRank(state, artifactId, entry.id) : 0
  const milestone = entry.major?.unlockAtTotalRanks ?? Infinity
  const active = isMinor ? rank > 0 : currentRanks >= milestone
  const presentation = isMinor && entry.minor ? getArtifactMinorPresentation(entry.minor, rank) : entry.major ? getArtifactMajorPresentation(entry.major) : { summary: '', details: [] }
  const style = { left: entry.x - (isMinor ? 78 : 88), top: entry.y - (isMinor ? 42 : 34) } as CSSProperties
  const name = entry.minor?.name ?? entry.major?.name ?? entry.id
  return <GameTooltip wide content={<TooltipContent title={name} description={isMinor ? `${rank} / 10 ranks · ${presentation.summary}` : `${active ? 'ACTIVE' : `UNLOCKS AT ${milestone} RANKS`} · ${presentation.summary}`} />}><button type="button" className={`artifact-tree-node artifact-node-${entry.kind}${active ? ' active' : ''}${selected ? ' selected' : ''}`} style={style} onClick={() => onSelect(entry.id)} aria-label={`${name}. ${isMinor ? `${rank} of 10 ranks` : `milestone at ${milestone} total ranks`}. ${presentation.summary}`}><span className="artifact-node-shape" aria-hidden="true" /><strong>{name}</strong><span className="artifact-node-state">{isMinor ? `${rank} / 10` : active ? 'ACTIVE' : `${milestone} TOTAL`}</span><span className="artifact-node-effect">{presentation.summary}</span></button></GameTooltip>
}
