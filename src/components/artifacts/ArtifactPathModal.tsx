import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, GameTooltip } from '../ui'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { getArtifactAvailablePoints, getArtifactLevel, getArtifactSpentPoints, getArtifactTotalPoints, canAllocateArtifactNode, getArtifactProgress, getArtifactLevelCap } from '../../game/systems/artifacts/artifactProgression'
import { ITEMS } from '../../game/content/items/items'
import type { ArtifactId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

export function ArtifactPathModal({ artifactId, onClose }: { artifactId: ArtifactId; onClose: () => void }) {
  const state = useGameStore(); const definition = ARTIFACTS[artifactId]; const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler) }, [onClose])
  if (!definition) return null
  const progress = getArtifactProgress(state, artifactId); const node = definition.nodes.find(item => item.id === selected)
  return createPortal(<div className="artifact-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="artifact-path-modal" role="dialog" aria-modal="true" aria-label={`${ITEMS[artifactId].name} Artifact Path`} onMouseDown={event => event.stopPropagation()}>
    <header><div><span className="eyebrow">TIER {definition.tier} ARTIFACT · LEVEL {getArtifactLevel(state, artifactId)} / {definition.maxLevel}</span><h2>{ITEMS[artifactId].name}</h2><p>Fire · Spell · DoT · Status</p></div><button type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></header>
    <div className="artifact-points"><strong>ARTIFACT POINTS</strong><span>{getArtifactAvailablePoints(state, artifactId)} AVAILABLE / {getArtifactTotalPoints(state, artifactId)} TOTAL</span></div>
    <div className="artifact-node-grid">{definition.nodes.map(item => { const allocated = progress.allocatedNodeIds.includes(item.id); const attuned = progress.attunedNodeIds.includes(item.id); const available = canAllocateArtifactNode(state, artifactId, item.id); return <GameTooltip key={item.id} content={`${item.type.toUpperCase()} · ${item.name}`}><button type="button" className={`artifact-node artifact-node-${item.type} ${allocated ? 'allocated' : available ? 'available' : attuned ? 'attuned' : 'locked'}`} onClick={() => setSelected(item.id)}><span>{item.type === 'minor' ? '●' : item.type === 'major' ? '◆' : '★'}</span><strong>{item.name}</strong><small>{allocated ? 'ALLOCATED' : attuned ? 'ATTUNED' : available ? 'AVAILABLE' : 'LOCKED'}</small></button></GameTooltip> })}</div>
    {node && <section className="artifact-node-inspector"><span className="eyebrow">{node.type.toUpperCase()} · {node.branch}</span><h3>{node.name}</h3><p>{formatNodeEffect(node)}</p><small>Requires Level {node.requiresLevel} · {node.pointCost} Artifact Point{node.pointCost === 1 ? '' : 's'}</small>{node.prerequisites?.length ? <small>Requires: {node.prerequisites.join(', ')}</small> : null}{node.requiresBossKill ? <small>Requires defeat: {node.requiresBossKill}</small> : null}{node.catalyst ? <small>Catalyst: {node.catalyst.itemId} ×{node.catalyst.quantity}</small> : null}<Button variant="primary" disabled={!canAllocateArtifactNode(state, artifactId, node.id)} onClick={() => { state.allocateArtifactNode(artifactId, node.id); setSelected(null) }}>ALLOCATE</Button></section>}
    <footer><Button variant="ghost" onClick={() => state.respecArtifact(artifactId)} disabled={progress.allocatedNodeIds.length === 0}>RESET PATH</Button><small>Level cap: {getArtifactLevelCap(state, artifactId)} · Spent: {getArtifactSpentPoints(state, artifactId)}</small></footer>
  </div></div>, document.body)
}
function formatNodeEffect(node: NonNullable<typeof ARTIFACTS[ArtifactId]>['nodes'][number]) { const modifier = node.combat?.modifiers?.[0]; if (modifier) return `+${Math.round(modifier.value * 100)}% ${modifier.key.replace(/-/g, ' ')}`; const stat = Object.entries(node.stats ?? {})[0]; return stat ? `+${stat[1]} ${stat[0]}` : 'Artifact combat effect' }
