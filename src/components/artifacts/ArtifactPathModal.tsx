import { X } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { ItemIcon } from '../ui/item'
import { ARTIFACTS, type ArtifactNodeDefinition } from '../../game/content/artifacts/artifacts'
import { EQUIPMENT_BUILD_TAG_LABELS } from '../../game/content/items/equipmentBalance'
import { ITEMS } from '../../game/content/items/items'
import { MONSTERS } from '../../game/content/monsters'
import { getArtifactNodePresentation } from '../../game/presentation/artifacts/artifactPresentation'
import { getArtifactPathTree, type ArtifactPathNode } from '../../game/presentation/artifacts/artifactPathReadModel'
import { getArtifactAvailablePoints, getArtifactLevel, getArtifactLevelCap, getArtifactNodeEligibility, getArtifactProgress, getArtifactSpentPoints, getArtifactTotalPoints } from '../../game/systems/artifacts/artifactProgression'
import type { ArtifactId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

const glyphFor = (type: ArtifactNodeDefinition['type']) => type === 'minor' ? '●' : type === 'major' ? '◆' : '★'
const typeLabel = (type: ArtifactNodeDefinition['type']) => type === 'capstone' ? 'CAPSTONE' : type.toUpperCase()

export function ArtifactPathModal({ artifactId, onClose }: { artifactId: ArtifactId; onClose: () => void }) {
  const state = useGameStore()
  const definition = ARTIFACTS[artifactId]
  const item = ITEMS[artifactId]
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  if (!definition || !item) return null

  const progress = getArtifactProgress(state, artifactId)
  const tree = getArtifactPathTree(definition)
  const level = getArtifactLevel(state, artifactId)
  const cap = getArtifactLevelCap(state, artifactId)
  const selectedNode = definition.nodes.find((node) => node.id === selected) ?? null
  const branchCount = Math.max(1, tree.branches.length)
  const tags = (item.buildTags ?? []).map((tag) => EQUIPMENT_BUILD_TAG_LABELS[tag])
  const modalStyle = { '--artifact-accent': item.color, '--artifact-branch-count': branchCount } as CSSProperties
  const milestones = [...new Set([1, 4, 7, definition.maxLevel].filter((milestone) => milestone <= definition.maxLevel))]

  return createPortal(
    <div className="artifact-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="artifact-path-modal" style={modalStyle} role="dialog" aria-modal="true" aria-label={`${item.name} Artifact Path`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="artifact-path-header">
          <div>
            <div className="artifact-path-identity">
              <span className="artifact-path-icon"><ItemIcon itemId={artifactId} size="large" /></span>
              <div><span className="eyebrow">TIER {definition.tier} ARTIFACT</span><h2>{item.name}</h2><p>{tags.join(' · ') || 'Artifact equipment'}</p></div>
            </div>
            <div className="artifact-path-meta">
              <div className="artifact-level-block"><div className="artifact-level-label"><span>LEVEL {level} / {definition.maxLevel}</span><span>CURRENT CAP · {cap}</span></div><div className="artifact-level-track"><div className="artifact-level-fill" style={{ width: `${Math.min(100, level / definition.maxLevel * 100)}%` }} /></div><div className="artifact-level-milestones">{milestones.map((milestone) => <span key={milestone}>Lv{milestone}</span>)}</div></div>
              <div className="artifact-points-block"><span className="eyebrow">ARTIFACT POINTS</span><div className="artifact-points"><PointCard label="AVAILABLE" value={getArtifactAvailablePoints(state, artifactId)} /><PointCard label="SPENT" value={getArtifactSpentPoints(state, artifactId)} /><PointCard label="TOTAL" value={getArtifactTotalPoints(state, artifactId)} /></div></div>
            </div>
          </div>
          <button type="button" className="artifact-path-header-close" aria-label="Close Artifact Path" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="artifact-path-body">
          <div className="artifact-tree-scroll">
            <div className="artifact-tree">
              {tree.sharedNodes.length > 0 && <div className="artifact-root" aria-label="Artifact root">{tree.sharedNodes.map((entry) => <TreeNode key={entry.node.id} entry={entry} selected={selected === entry.node.id} state={state} artifactId={artifactId} onSelect={setSelected} />)}</div>}
              {tree.sharedNodes.length > 0 && tree.branches.length > 0 && <div className="artifact-tree-split" aria-hidden="true" />}
              {tree.branches.length > 0 && <div className="artifact-branches">{tree.branches.map(({ branch, nodes }) => <section className="artifact-branch" key={branch.id}><header className="artifact-branch-header"><strong>{branch.name}</strong>{branch.description && <span>{branch.description}</span>}</header>{nodes.map((entry) => <div className={`artifact-branch-node artifact-branch-node-${getArtifactNodeEligibility(state, artifactId, entry.node.id).status}`} key={entry.node.id}><TreeNode entry={entry} selected={selected === entry.node.id} state={state} artifactId={artifactId} onSelect={setSelected} /></div>)}</section>)}</div>}
            </div>
          </div>
          <div className="artifact-inspector-scroll">
            {selectedNode ? <NodeInspector state={state} artifactId={artifactId} node={selectedNode} onAllocated={() => setSelected(selectedNode.id)} /> : <div className="artifact-node-inspector-empty"><strong>SELECT A NODE</strong><p>Choose a Node in the tree to inspect its bonuses and requirements.</p><span className="artifact-inspector-status">Level {level} · {getArtifactAvailablePoints(state, artifactId)} points available</span></div>}
          </div>
        </div>

        <footer className="artifact-path-footer"><Button variant="ghost" disabled={progress.allocatedNodeIds.length === 0} tooltip="Refunds Artifact Points. Catalyst attunements remain permanently unlocked." onClick={() => state.respecArtifact(artifactId)}>RESET PATH</Button><small>{level >= cap && level < definition.maxLevel ? `LEVEL CAP REACHED · Continue progression to unlock Level ${cap + 1}` : level >= definition.maxLevel ? 'MAX ARTIFACT LEVEL' : `CURRENT CAP · ${cap} · SPENT ${getArtifactSpentPoints(state, artifactId)}`}</small></footer>
      </div>
    </div>,
    document.body,
  )
}

function PointCard({ label, value }: { label: string; value: number }) { return <span className="artifact-point-card"><strong>{value}</strong><span>{label}</span></span> }

function TreeNode({ entry, selected, state, artifactId, onSelect }: { entry: ArtifactPathNode; selected: boolean; state: ReturnType<typeof useGameStore.getState>; artifactId: ArtifactId; onSelect: (nodeId: string) => void }) {
  const node = entry.node
  const eligibility = getArtifactNodeEligibility(state, artifactId, node.id)
  const reason = getEligibilityLabel(state, artifactId, node, eligibility)
  const presentation = getArtifactNodePresentation(node)
  return <GameTooltip wide content={<TooltipContent title={`${typeLabel(node.type)} · ${node.name}`} description={`${presentation.summary} · ${reason}`} />}><button type="button" className={`artifact-tree-node artifact-node-${node.type} ${eligibility.status === 'allocated' ? 'allocated' : eligibility.status === 'available' ? 'available' : eligibility.status === 'attuned' ? 'attuned' : 'locked'} ${selected ? 'selected' : ''}`} aria-label={`${node.name}, ${reason}`} onClick={() => onSelect(node.id)}><span className="artifact-node-glyph" aria-hidden="true">{glyphFor(node.type)}</span><strong>{node.name}</strong><small>{presentation.summary}</small><small className="artifact-node-reason">{reason}</small></button></GameTooltip>
}

function NodeInspector({ state, artifactId, node, onAllocated }: { state: ReturnType<typeof useGameStore.getState>; artifactId: ArtifactId; node: ArtifactNodeDefinition; onAllocated: () => void }) {
  const definition = ARTIFACTS[artifactId]
  const progress = getArtifactProgress(state, artifactId)
  const eligibility = getArtifactNodeEligibility(state, artifactId, node.id)
  const presentation = getArtifactNodePresentation(node)
  const branch = node.branch === 'shared' ? 'Root' : definition?.branches.find((entry) => entry.id === node.branch)?.name ?? node.branch
  const requirements = [
    `Requires Artifact Level ${node.requiresLevel}`,
    `Costs ${node.pointCost} Artifact Point${node.pointCost === 1 ? '' : 's'}`,
    ...(node.prerequisites ?? []).map((id) => `Requires ${definition?.nodes.find((entry) => entry.id === id)?.name ?? 'another Node'}`),
    ...(node.requiresBossKill ? [`Requires ${MONSTERS[node.requiresBossKill]?.name ?? 'Boss'} defeated`] : []),
    ...(node.catalyst ? [`Catalyst: ${ITEMS[node.catalyst.itemId]?.name ?? 'Catalyst'} ×${node.catalyst.quantity}${progress.attunedNodeIds.includes(node.id) ? ' · Attuned' : ''}`] : []),
  ]
  const allocated = eligibility.status === 'allocated'
  const attuned = progress.attunedNodeIds.includes(node.id)
  const actionLabel = allocated ? 'ALLOCATED' : node.catalyst && !attuned ? 'ATTUNE & ALLOCATE' : 'ALLOCATE NODE'
  return <section className="artifact-node-inspector"><span className="eyebrow">{typeLabel(node.type)} · {branch.toUpperCase()}</span><h3 className="artifact-inspector-title">{node.name}</h3><p className="artifact-inspector-summary">{presentation.summary}</p>{presentation.details.length > 1 && <ul className="artifact-inspector-details">{presentation.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}<ul className="artifact-inspector-requirements">{requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul><span className="artifact-inspector-status">{getEligibilityLabel(state, artifactId, node, eligibility)}</span><Button variant={allocated ? 'secondary' : 'primary'} disabled={!eligibility.canAllocate || allocated} tooltip={eligibility.canAllocate ? undefined : getEligibilityLabel(state, artifactId, node, eligibility)} onClick={() => { if (state.allocateArtifactNode(artifactId, node.id)) onAllocated() }}>{actionLabel}</Button></section>
}

function getEligibilityLabel(state: ReturnType<typeof useGameStore.getState>, artifactId: ArtifactId, node: ArtifactNodeDefinition, eligibility: ReturnType<typeof getArtifactNodeEligibility>) {
  switch (eligibility.status) {
    case 'allocated': return 'ALLOCATED'
    case 'attuned': return 'ATTUNED · AVAILABLE'
    case 'available': return 'AVAILABLE'
    case 'unowned': return `OWN ${ITEMS[artifactId]?.name ?? 'ARTIFACT'} FIRST`
    case 'missingLevel': return `REQUIRES LEVEL ${node.requiresLevel}`
    case 'missingPoints': return `NEED ${node.pointCost} POINT${node.pointCost === 1 ? '' : 'S'}`
    case 'missingPrerequisites': return `REQUIRES ${eligibility.missingPrerequisiteIds.map((id) => ARTIFACTS[artifactId]?.nodes.find((entry) => entry.id === id)?.name ?? 'PRIOR NODE').join(', ')}`
    case 'missingBoss': return `${MONSTERS[eligibility.missingBossId ?? 'forest-heart']?.name ?? 'BOSS'} REQUIRED`
    case 'missingCatalyst': return `NEED ${eligibility.catalystRequired ? `${ITEMS[eligibility.catalystRequired.itemId]?.name ?? 'CATALYST'} ×${eligibility.catalystRequired.quantity}` : 'CATALYST'}`
  }
}
