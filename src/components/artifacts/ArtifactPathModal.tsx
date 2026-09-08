import { X } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { ItemIcon } from '../ui/item'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { EQUIPMENT_BUILD_TAG_LABELS } from '../../game/content/items/equipmentBalance'
import { ITEMS } from '../../game/content/items/items'
import { getArtifactPathTree } from '../../game/presentation/artifacts/artifactPathReadModel'
import { getArtifactAvailablePoints, getArtifactLevel, getArtifactLevelCap, getArtifactProgress, getArtifactSpentPoints, getArtifactTotalPoints } from '../../game/systems/artifacts/artifactProgression'
import type { ArtifactId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { ArtifactNodeInspector, ArtifactInspectorEmpty } from './ArtifactNodeInspector'
import { ArtifactPathDevMiniPanel } from './ArtifactPathDevMiniPanel'
import { ArtifactTreeGraph } from './ArtifactTreeGraph'
import { ArtifactLevelUpModule } from './ArtifactLevelUpModule'

export function ArtifactPathModal({ artifactId, onClose }: { artifactId: ArtifactId; onClose: () => void }) {
  const state = useGameStore()
  const definition = ARTIFACTS[artifactId]
  const item = ITEMS[artifactId]
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  if (!definition || !item) return null

  const progress = getArtifactProgress(state, artifactId)
  const level = getArtifactLevel(state, artifactId)
  const cap = getArtifactLevelCap(state, artifactId)
  const tree = getArtifactPathTree(definition)
  const selectedNode = definition.nodes.find((node) => node.id === selectedNodeId) ?? null
  const tags = (item.buildTags ?? []).map((tag) => EQUIPMENT_BUILD_TAG_LABELS[tag])
  const modalStyle = { '--artifact-accent': item.color, '--artifact-branch-count': Math.max(1, tree.branches.length) } as CSSProperties
  const milestones = [...new Set([1, 4, 7, definition.maxLevel].filter((milestone) => milestone <= definition.maxLevel))]

  return createPortal(
    <div className="artifact-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="artifact-path-modal" style={modalStyle} role="dialog" aria-modal="true" aria-label={`${item.name} Artifact Path`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="artifact-path-header">
          <div className="artifact-path-header-main">
            <div className="artifact-path-identity">
              <span className="artifact-path-icon"><ItemIcon itemId={artifactId} size="large" /></span>
              <div><span className="eyebrow">T{definition.tier} ARTIFACT</span><h2>{item.name}</h2><p>{tags.join(' · ') || 'Artifact equipment'} · {definition.branches.length} build branches</p><div className="artifact-summary-tags"><span>{progress.attunedNodeIds.length} ATTUNED</span><span>{progress.allocatedNodeIds.filter((id) => definition.nodes.find((node) => node.id === id)?.type === 'capstone').length} CAPSTONES</span><span>{tree.branches.length} PATHS</span></div></div>
            </div>
            <div className="artifact-path-meta">
              <div className="artifact-level-block">
                <div className="artifact-level-label"><span>LEVEL {level} / {definition.maxLevel}</span><span>CURRENT CAP · {cap}</span></div>
                <div className="artifact-level-track" role="progressbar" aria-label="Artifact level progress" aria-valuemin={1} aria-valuemax={definition.maxLevel} aria-valuenow={level}><div className="artifact-level-fill" style={{ width: `${Math.min(100, level / definition.maxLevel * 100)}%` }} /></div>
                <div className="artifact-level-milestones">{milestones.map((milestone) => <span key={milestone}>Lv{milestone}</span>)}</div>
              </div>
              <div className="artifact-points-block"><span className="eyebrow">PATH POINTS</span><div className="artifact-points"><PointCard label="AVAILABLE" value={getArtifactAvailablePoints(state, artifactId)} description="Unspent points ready to allocate." /><PointCard label="SPENT" value={getArtifactSpentPoints(state, artifactId)} description="Points committed to this path." /><PointCard label="TOTAL" value={getArtifactTotalPoints(state, artifactId)} description="Points earned from levels and session tools." /></div></div>
            </div>
            <ArtifactLevelUpModule state={state} artifactId={artifactId} />
          </div>
          <button type="button" className="artifact-path-header-close" aria-label="Close Artifact Path" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="artifact-path-body">
          <section className="artifact-tree-panel" aria-label="Artifact path graph">
            <div className="artifact-tree-panel-heading"><div><span className="eyebrow">PATH MAP</span><strong>Choose a node to inspect</strong></div><span>{progress.allocatedNodeIds.length} allocated · {definition.nodes.length} nodes</span></div>
            <ArtifactTreeGraph state={state} artifactId={artifactId} selectedNodeId={selectedNodeId} onSelect={setSelectedNodeId} />
          </section>
          <aside className="artifact-path-side-column">
            <div className="artifact-inspector-scroll">
              {selectedNode ? <ArtifactNodeInspector state={state} artifactId={artifactId} node={selectedNode} onAllocated={() => setSelectedNodeId(selectedNode.id)} /> : <ArtifactInspectorEmpty level={level} availablePoints={getArtifactAvailablePoints(state, artifactId)} />}
            </div>
            <ArtifactPathDevMiniPanel state={state} artifactId={artifactId} selectedNodeId={selectedNodeId} />
          </aside>
        </div>

        <footer className="artifact-path-footer"><Button variant="ghost" disabled={progress.allocatedNodeIds.length === 0} tooltip="Refunds allocated Artifact Points. Catalyst attunements remain permanently unlocked." onClick={() => state.respecArtifact(artifactId)}>RESET PATH</Button><small>{level >= cap && level < definition.maxLevel ? `LEVEL CAP REACHED · Continue progression to unlock Level ${cap + 1}` : level >= definition.maxLevel ? 'MAX ARTIFACT LEVEL' : `CURRENT CAP · ${cap} · ${getArtifactAvailablePoints(state, artifactId)} POINTS AVAILABLE`}</small></footer>
      </div>
    </div>,
    document.body,
  )
}

function PointCard({ label, value, description }: { label: string; value: number; description: string }) {
  return <GameTooltip content={<TooltipContent title={`Artifact ${label.toLowerCase()} points`} description={description} />}><span className="artifact-point-card"><strong>{value}</strong><span>{label}</span></span></GameTooltip>
}
