import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { ChevronRight, Crosshair, RotateCcw, Sparkles, X } from 'lucide-react'
import { Button, Card, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { ArcaneCorePresetPanel } from '../../components/arcane-core/ArcaneCorePresetPanel'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_NODE_UNLOCK_COST, ARCANE_CORE_RANK_COSTS } from '../../game/content/arcaneCore/arcaneCoreBalance'
import { formatArcaneCoreModifierValue, formatArcaneCoreNodeEffect, getArcaneCoreGraphGeometry, getArcaneCoreModifierLabel, getArcaneCoreConnectorSegments } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import { getArcaneCoreBranchResetPreview, getArcaneCoreModifierTotals, getArcaneCoreNodeProgress, getArcaneCoreRefundPreview, isArcaneCoreNodeReachable } from '../../game/systems/arcaneCore'
import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId, ArcaneCoreModifierKey } from '../../game/types'
import { useGameStore } from '../../store/gameStore'


function Wallet({ points, essence }: { points: number; essence: number }) {
  return <div className="arcane-core-wallet" aria-label="Arcane Core wallet">
    <div><span>CORE POINTS</span><strong>{points.toLocaleString()}</strong><small>Used to unlock Arcane Core nodes.</small></div>
    <div><span>ARCANE ESSENCE</span><strong>{essence.toLocaleString()}</strong><small>Used to rank unlocked Arcane Core nodes.</small></div>
  </div>
}

function BranchCard({ branch, onOpen, state }: { branch: ArcaneCoreBranchDefinition; onOpen: () => void; state: ReturnType<typeof useGameStore.getState>['arcaneCore'] }) {
  const unlocked = branch.nodes.filter((node) => getArcaneCoreNodeProgress(state, node.id).unlocked).length
  const rank = branch.nodes.reduce((sum, node) => sum + getArcaneCoreNodeProgress(state, node.id).rank, 0)
  const active = branch.nodes.find((node) => getArcaneCoreNodeProgress(state, node.id).rank > 0)
  return <button type="button" className="arcane-core-branch-card" style={{ '--branch-accent': branch.accent } as CSSProperties} onClick={onOpen}>
    <span className="arcane-core-branch-mark"><Sparkles size={17} /></span>
    <span className="arcane-core-branch-copy"><span className="eyebrow">{branch.name.toUpperCase()} BRANCH</span><strong>{branch.name}</strong><small>{branch.description}</small></span>
    <span className="arcane-core-branch-progress"><b>{unlocked} / {branch.nodes.length}</b><small>{rank} / {branch.nodes.length * 5} ranks</small><i><em style={{ width: `${(unlocked / branch.nodes.length) * 100}%` }} /></i>{active && <small className="arcane-core-branch-active">{formatArcaneCoreNodeEffect(active, getArcaneCoreNodeProgress(state, active.id).rank)} active</small>}</span>
    <ChevronRight size={17} />
  </button>
}

type PendingArcaneCoreConfirmation =
  | { kind: 'refund'; nodeName: string; preview: import('../../game/systems/arcaneCore').ArcaneCoreRefundPreview }
  | { kind: 'reset'; branchName: string; preview: import('../../game/systems/arcaneCore').ArcaneCoreBranchResetPreview }

function BranchModal({ branch, onClose }: { branch: ArcaneCoreBranchDefinition; onClose: () => void }) {
  const core = useGameStore((state) => state.arcaneCore)
  const unlock = useGameStore((state) => state.unlockArcaneCoreNode)
  const rankUp = useGameStore((state) => state.rankUpArcaneCoreNode)
  const refund = useGameStore((state) => state.refundArcaneCoreNode)
  const resetBranch = useGameStore((state) => state.resetArcaneCoreBranch)
  const [selectedId, setSelectedId] = useState(branch.nodes[0]?.id ?? '')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [confirmation, setConfirmation] = useState<PendingArcaneCoreConfirmation | null>(null)
  const drag = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const geometry = useMemo(() => getArcaneCoreGraphGeometry(branch), [branch])
  const connectors = useMemo(() => getArcaneCoreConnectorSegments(branch, geometry), [branch, geometry])
  const selected = branch.nodes.find((node) => node.id === selectedId) ?? branch.nodes[0]
  const selectedProgress = selected ? getArcaneCoreNodeProgress(core, selected.id) : undefined
  const selectedReachable = selected ? isArcaneCoreNodeReachable(core, selected.id) : false
  const hasAllocatedNodes = branch.nodes.some((node) => Boolean(core.nodes[node.id]))
  const totalRanks = branch.nodes.reduce((sum, node) => sum + getArcaneCoreNodeProgress(core, node.id).rank, 0)

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as Element | null
    if (target?.closest('button, input, select, textarea, a, [data-no-pan]')) return
    drag.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setOffset({ x: drag.current.offsetX + event.clientX - drag.current.x, y: drag.current.offsetY + event.clientY - drag.current.y })
  }
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId)
  }
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => { event.preventDefault(); setZoom((current) => Math.max(.5, Math.min(2, current * (event.deltaY > 0 ? .9 : 1.1)))) }
  const requestRefund = () => {
    if (!selected || !selectedProgress?.unlocked) return
    const preview = getArcaneCoreRefundPreview(core, selected.id)
    if (preview.ok) setConfirmation({ kind: 'refund', nodeName: selected.name, preview })
  }
  const requestReset = () => {
    const preview = getArcaneCoreBranchResetPreview(core, branch.id)
    if (preview.ok && preview.nodesAffected > 0) setConfirmation({ kind: 'reset', branchName: branch.name, preview })
  }
  const confirmDestructiveAction = () => {
    if (!confirmation) return
    if (confirmation.kind === 'refund') {
      if (refund(selectedId)) setConfirmation(null)
      return
    }
    resetBranch(branch.id)
    setConfirmation(null)
  }
  const handleEscape = () => {
    if (confirmation) setConfirmation(null)
    else onClose()
  }

  return <ModalPortal open onClose={onClose} onEscape={handleEscape} surfaceStyle={{ '--branch-accent': branch.accent } as CSSProperties} backdropClassName="arcane-core-modal-backdrop" surfaceClassName="arcane-core-modal" ariaLabel={`${branch.name} Arcane Core branch`}>
    <div className="arcane-core-modal-head"><div><span className="eyebrow" style={{ color: branch.accent }}>{branch.name.toUpperCase()} BRANCH</span><h2>{branch.name} path</h2><p>{branch.description}</p></div><div className="arcane-core-modal-actions"><Status tone="active">{totalRanks} / {branch.nodes.length * 5} ranks</Status><Button variant="ghost" onClick={onClose} ariaLabel="Close Arcane Core branch"><X size={17} /></Button></div></div>
    <div className="arcane-core-modal-toolbar"><span><Crosshair size={14} /> Drag to pan · wheel to zoom</span><span>Zoom {Math.round(zoom * 100)}%</span><Button variant="ghost" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}><RotateCcw size={13} /> Recenter</Button><Button variant="danger" onClick={requestReset} disabled={!hasAllocatedNodes}>Reset branch</Button></div>
    <div className="arcane-core-modal-body">
      <div className="arcane-core-graph-viewport" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={handleWheel}>
        <div className="arcane-core-graph" style={{ width: geometry.width, height: geometry.height, marginLeft: -geometry.width / 2, marginTop: -geometry.height / 2, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
          <div className="arcane-core-hub" style={{ left: geometry.hub.left, top: geometry.hub.top, width: geometry.hub.width }}><Sparkles size={15} /><span>CORE HUB</span><small>Four routes · one engine</small></div>
          <svg className="arcane-core-connectors" width={geometry.width} height={geometry.height} aria-hidden="true">{connectors.map((connector) => <line key={`${connector.sourceId}-${connector.targetId}`} data-source-id={connector.sourceId} data-target-id={connector.targetId} className={connector.virtual ? 'is-virtual' : undefined} x1={connector.x1} y1={connector.y1} x2={connector.x2} y2={connector.y2} />)}</svg>
          {branch.nodes.map((node) => {
            const progress = getArcaneCoreNodeProgress(core, node.id)
            const reachable = isArcaneCoreNodeReachable(core, node.id)
            return <GameTooltip key={node.id} block content={`${node.name} · ${progress.unlocked ? `${progress.rank}/${node.maxRank} ranks` : reachable ? 'Ready to unlock' : 'Requires a completed route'} · ${formatArcaneCoreNodeEffect(node, Math.max(1, progress.rank))}`}><button type="button" data-node-id={node.id} className={`arcane-core-node ${progress.unlocked ? 'is-unlocked' : ''} ${progress.rank > 0 ? 'is-active' : ''} ${reachable ? 'is-reachable' : ''} ${selectedId === node.id ? 'is-selected' : ''}`} style={{ left: geometry.nodeLeft(node), top: geometry.nodeTop(node) }} onClick={() => setSelectedId(node.id)}><span>{node.x + 1}.{node.y + 1}</span><strong>{formatArcaneCoreNodeEffect(node, Math.max(1, progress.rank))}</strong><small>{progress.unlocked ? `${progress.rank}/${node.maxRank}` : 'LOCKED'}</small></button></GameTooltip>
          })}
        </div>
      </div>
      {selected && selectedProgress && <aside className="arcane-core-node-inspector"><div className="arcane-core-inspector-title"><span className="arcane-core-inspector-glyph" style={{ background: branch.accent }}><Sparkles size={17} /></span><div><span className="eyebrow">NODE {selected.x + 1}.{selected.y + 1}</span><h3>{selected.name}</h3></div></div><p className="muted">{selected.description}</p><div className="arcane-core-inspector-effect"><span>EFFECT AT RANK</span><strong>{formatArcaneCoreNodeEffect(selected, Math.max(1, selectedProgress.rank))}</strong><small>{getArcaneCoreModifierLabel(selected.effect.key)} · {formatArcaneCoreModifierValue(selected.effect.key, selected.effect.perRank)} per rank</small></div><div className="arcane-core-inspector-meta"><span>STATUS<strong>{selectedProgress.unlocked ? 'UNLOCKED' : selectedReachable ? 'READY' : 'ROUTE LOCKED'}</strong></span><span>RANK<strong>{selectedProgress.rank} / {selected.maxRank}</strong></span><span>PREREQUISITES<strong>{selected.prerequisites.length ? `${selected.prerequisiteMode.toUpperCase()} · ${selected.prerequisites.length}` : 'STARTER'}</strong></span></div><div className="arcane-core-rank-costs"><span>RANK ESSENCE COSTS</span><b>{ARCANE_CORE_RANK_COSTS.map((cost, index) => <i className={index < selectedProgress.rank ? 'is-paid' : ''} key={cost}>{cost}</i>)}</b></div><div className="arcane-core-inspector-actions"><Button variant="primary" onClick={() => unlock(selected.id)} disabled={selectedProgress.unlocked || !selectedReachable}>Unlock · {ARCANE_CORE_NODE_UNLOCK_COST} Core</Button><Button variant="secondary" onClick={() => rankUp(selected.id)} disabled={!selectedProgress.unlocked || selectedProgress.rank >= selected.maxRank}>+1 Rank · {selectedProgress.rank < selected.maxRank ? ARCANE_CORE_RANK_COSTS[selectedProgress.rank] : 0} Essence</Button><Button variant="ghost" onClick={requestRefund} disabled={!selectedProgress.unlocked}>Refund Path</Button></div></aside>}
    </div>
    {confirmation && <div className="arcane-core-confirm-layer" onMouseDown={(event) => event.stopPropagation()}><section className="arcane-core-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="arcane-core-confirm-title"><span className="eyebrow">CONFIRM DESTRUCTIVE ACTION</span><h3 id="arcane-core-confirm-title">{confirmation.kind === 'refund' ? `Refund ${confirmation.nodeName}?` : `Reset ${confirmation.branchName} branch?`}</h3><p className="muted">{confirmation.kind === 'refund' ? 'This removes the selected node and only the allocated descendants that no longer have a valid route.' : 'This removes every allocated node in this branch and returns its paid resources.'}</p><div className="arcane-core-confirm-summary"><span><small>NODES AFFECTED</small><strong>{confirmation.preview.nodesAffected}</strong></span><span><small>RANKS AFFECTED</small><strong>{confirmation.preview.ranksAffected}</strong></span><span><small>CORE POINTS REFUNDED</small><strong>{confirmation.preview.corePointsRefunded}</strong></span><span><small>ESSENCE REFUNDED</small><strong>{confirmation.preview.essenceRefunded}</strong></span></div><div className="button-row"><Button variant="ghost" onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="danger" onClick={confirmDestructiveAction}>{confirmation.kind === 'refund' ? 'Confirm Refund' : 'Confirm Reset'}</Button></div></section></div>}
  </ModalPortal>
}

export function ArcaneCoreScreen() {
  const core = useGameStore((state) => state.arcaneCore)
  const [branchId, setBranchId] = useState<ArcaneCoreBranchId | null>(null)
  const activeBranch = branchId ? ARCANE_CORE_BRANCHES.find((branch) => branch.id === branchId) : null
  const modifiers = getArcaneCoreModifierTotals(core)
  const totalNodes = Object.values(core.nodes).filter((node) => Boolean(node?.unlocked)).length
  const totalRanks = Object.values(core.nodes).reduce((sum, node) => sum + (node?.rank ?? 0), 0)
  return <div className="screen-content arcane-core-screen">
    <div className="screen-header"><div><div className="eyebrow">HERO · PERMANENT PROGRESSION</div><h1>Arcane Core</h1><p>Shape the permanent engine beneath the wizard. Unlock routes and invest in long-term specialization.</p></div><Status tone="active">{totalNodes} nodes online</Status></div>
    <ScreenGrid screen="arcane-core" panels={[{ id: 'arcane-core-overview', content: <div className="arcane-core-overview-stack"><Card title="Core reserves" action={<span className="arcane-core-total-rank">{totalRanks} ranks active</span>}><Wallet points={core.corePoints} essence={core.arcaneEssence} /></Card><div className="arcane-core-branch-grid">{ARCANE_CORE_BRANCHES.map((branch) => <BranchCard key={branch.id} branch={branch} state={core} onOpen={() => setBranchId(branch.id)} />)}</div><Card title="Active resonance" action={<Status tone="success">Permanent Core modifiers</Status>}><div className="arcane-core-resonance">{Object.entries(modifiers).length ? Object.entries(modifiers).map(([key, value]) => <span key={key}><small>{getArcaneCoreModifierLabel(key as ArcaneCoreModifierKey)}</small><strong>{formatArcaneCoreModifierValue(key as ArcaneCoreModifierKey, Number(value))}</strong></span>) : <p className="muted">Unlock and rank nodes to bring permanent modifiers online.</p>}</div></Card><ArcaneCorePresetPanel /></div> }]} />
    {activeBranch && <BranchModal branch={activeBranch} onClose={() => setBranchId(null)} />}
  </div>
}
