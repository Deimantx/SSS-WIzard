import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { Crosshair, LockKeyhole, RotateCcw, Sparkles, X } from 'lucide-react'
import { Button, Card, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ArcaneCorePresetPanel } from '../../components/arcane-core/ArcaneCorePresetPanel'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_TOTAL_COST_PER_CORE, ARCANE_CORE_TOTAL_TREE_COST } from '../../game/content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES, ARCANE_CORE_RING_INDICES, getArcaneCoreRingName } from '../../game/content/arcaneCore/arcaneCoreRings'
import { ARCANE_CORE_CANVAS_SIZE, getArcaneCoreNodeEffectTexts, getArcaneCoreNodePosition, getArcaneCoreResonanceSummary, getArcaneCoreRingRadius } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import { getArcaneCoreBranchResetPreview, getArcaneCoreHighestUnlockedRing, getArcaneCoreNodeRank, getArcaneCorePointsSpent, getArcaneCoreRefundPreview, getArcaneCoreRingStandardRanksInvested, getArcaneCoreWalletInfo, isArcaneCoreMajorUnlocked, isArcaneCoreNodeReachable } from '../../game/systems/arcaneCore'
import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId, ArcaneCoreNodeDefinition, ArcaneCoreRingIndex } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { ARCANE_CORE_DRAG_THRESHOLD, ARCANE_CORE_MAX_ZOOM, ARCANE_CORE_MIN_ZOOM, clampCameraOffset, useArcaneCoreCamera } from './useArcaneCoreCamera'

function CoreProgress({ core }: { core: ReturnType<typeof useGameStore.getState>['arcaneCore'] }) {
  const wallet = getArcaneCoreWalletInfo(core)
  const completion = wallet.treeCost ? wallet.pointsSpent / wallet.treeCost * 100 : 0
  return <div className="arcane-core-wallet" aria-label="Arcane Points wallet">
    <div><span>ARCANE POINTS</span><strong>{wallet.pointsAvailable.toLocaleString()} AVAILABLE</strong><small>Spendable across all four permanent Cores</small><i><em style={{ width: `${wallet.totalPointsEarned ? wallet.pointsSpent / wallet.totalPointsEarned * 100 : 0}%` }} /></i></div>
    <div><span>EARNED</span><strong>{wallet.totalPointsEarned.toLocaleString()}</strong><small>Lifetime Arcane Points</small></div>
    <div><span>SPENT</span><strong>{wallet.pointsSpent.toLocaleString()}</strong><small>{completion.toFixed(1)}% of the tree cost invested</small></div>
    <div><span>TREE COMPLETION</span><strong>{wallet.pointsSpent.toLocaleString()} / {wallet.treeCost.toLocaleString()}</strong><small>Arcane Points invested</small></div>
  </div>
}

function BranchCard({ branch, onOpen, state }: { branch: ArcaneCoreBranchDefinition; onOpen: () => void; state: ReturnType<typeof useGameStore.getState>['arcaneCore'] }) {
  const spent = getArcaneCorePointsSpent({ nodes: Object.fromEntries(branch.nodes.map((node) => [node.id, state.nodes[node.id]]).filter(([, value]) => value)) })
  const highest = getArcaneCoreHighestUnlockedRing(state, branch.id)
  return <button type="button" className="arcane-core-branch-card" style={{ '--branch-accent': branch.accent } as CSSProperties} onClick={onOpen}>
    <span className="arcane-core-branch-mark"><Sparkles size={17} /></span><span className="arcane-core-branch-copy"><span className="eyebrow">{branch.name.toUpperCase()} CORE</span><strong>{branch.name} Core</strong><small>{branch.description}</small></span>
    <span className="arcane-core-branch-progress"><b>{spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE}</b><small>Arcane Points invested</small><i><em style={{ width: `${spent / ARCANE_CORE_TOTAL_COST_PER_CORE * 100}%` }} /></i><small className="arcane-core-branch-active">Ring {highest} / 8 unlocked</small></span><span className="arcane-core-branch-open">OPEN CORE &gt;</span>
  </button>
}

function ResonanceEntry({ entry }: { entry: ReturnType<typeof getArcaneCoreResonanceSummary>['alwaysOn'][number] }) {
  const sourceText = entry.sources?.map((source) => `${source.nodeName} ${source.formattedValue ?? source.value}`).join(' · ')
  return <GameTooltip wide content={<TooltipContent title={entry.label} description={sourceText ? `Sources: ${sourceText}` : undefined} />}><span className="arcane-core-resonance-entry"><small>{entry.label}</small><strong>{entry.formattedValue}</strong></span></GameTooltip>
}

function ConditionalResonanceEntry({ entry }: { entry: ReturnType<typeof getArcaneCoreResonanceSummary>['conditional'][number] }) {
  return <GameTooltip wide content={<TooltipContent title={entry.label} description={entry.conditionText} />}><span className="arcane-core-resonance-entry is-conditional"><small>{entry.label}</small><strong>{entry.formattedValue}</strong><em>{entry.conditionText}</em></span></GameTooltip>
}

function MechanicsOnline({ entries }: { entries: ReturnType<typeof getArcaneCoreResonanceSummary>['mechanics'] }) {
  const visible = entries.slice(0, 8)
  return <section className="arcane-core-resonance-group arcane-core-resonance-mechanics"><div className="arcane-core-resonance-group-head"><span>MECHANICS ONLINE</span><small>{entries.length} purchased</small></div><div className="arcane-core-mechanics-list">{visible.map((entry) => <GameTooltip key={entry.id} wide content={<TooltipContent title={entry.label} description={entry.formattedValue} />}><span><strong>{entry.label}</strong><small>{entry.formattedValue}</small></span></GameTooltip>)}</div>{entries.length > visible.length && <small className="arcane-core-resonance-more">+ {entries.length - visible.length} more mechanics online</small>}</section>
}

type PendingConfirmation = { label: string; points: number; ranks: number; majors: number; rings: number; confirm: () => void }
type CoreDragState = { x: number; y: number; offsetX: number; offsetY: number; moved: boolean }

const nodeEffect = (node: ArcaneCoreNodeDefinition, rank: number) => getArcaneCoreNodeEffectTexts(node, rank).join(' · ')

interface ArcaneCoreOrbitNodeProps { node: ArcaneCoreNodeDefinition; position: { left: number; top: number }; rank: number; nodeAvailable: boolean; ringLocked: boolean; highestRing: ArcaneCoreRingIndex; selected: boolean; selectedRing: boolean; feedback?: 'purchase' | 'max'; onSelect: (nodeId: string) => void }

const ArcaneCoreOrbitNode = memo(function ArcaneCoreOrbitNode({ node, position, rank, nodeAvailable, ringLocked, highestRing, selected, selectedRing, feedback, onSelect }: ArcaneCoreOrbitNodeProps) {
  return <GameTooltip content={`${node.name} · Rank ${rank}/${node.maxRank} · ${nodeEffect(node, rank)}`}><button type="button" data-no-pan data-ring={node.ring} data-angle={node.angleDeg} className={`arcane-core-ring-node node-${node.nodeType} ${rank > 0 ? 'is-active' : ''} ${nodeAvailable ? 'is-available' : 'is-locked'} ${ringLocked ? 'is-ring-locked' : ''} ${ringLocked && node.ring === highestRing + 1 ? 'is-next-locked' : ''} ${ringLocked && node.ring > highestRing + 1 ? 'is-deep-locked' : ''} ${selectedRing ? 'is-selected-ring-node' : ''} ${selected ? 'is-selected' : ''} ${feedback ? `is-${feedback}-pulse` : ''}`} style={{ left: position.left, top: position.top }} onClick={() => onSelect(node.id)} aria-label={`${node.name}, rank ${rank} of ${node.maxRank}`}><span className="arcane-core-node-dot" aria-hidden="true">{node.nodeType === 'major' ? '✦' : '◆'}</span><strong>{node.name}</strong><small>{node.nodeType === 'major' ? 'MAJOR' : `RANK ${rank}/${node.maxRank}`}</small>{node.nodeType !== 'major' && <i className="arcane-core-rank-pips" aria-hidden="true">{[1, 2, 3, 4, 5].map((pip) => <b key={pip} className={pip <= rank ? 'is-paid' : undefined} />)}</i>}</button></GameTooltip>
})

interface ArcaneCoreNodeLayerProps { branch: ArcaneCoreBranchDefinition; core: ReturnType<typeof useGameStore.getState>['arcaneCore']; highestRing: ArcaneCoreRingIndex; selectedId: string; feedback: { nodeId: string; kind: 'purchase' | 'max' } | null; onSelect: (nodeId: string) => void }

const ArcaneCoreNodeLayer = memo(function ArcaneCoreNodeLayer({ branch, core, highestRing, selectedId, feedback, onSelect }: ArcaneCoreNodeLayerProps) {
  const positions = useMemo(() => new Map(branch.nodes.map((node) => [node.id, getArcaneCoreNodePosition(node)])), [branch.nodes])
  const selectedNode = branch.nodes.find((item) => item.id === selectedId)
  return <div className="arcane-core-node-layer">{branch.nodes.map((node) => {
    const rank = getArcaneCoreNodeRank(core, node.id)
    const nodeAvailable = isArcaneCoreNodeReachable(core, node.id)
    return <ArcaneCoreOrbitNode key={node.id} node={node} position={positions.get(node.id)!} rank={rank} nodeAvailable={nodeAvailable} ringLocked={node.ring > highestRing} highestRing={highestRing} selected={selectedId === node.id} selectedRing={node.ring === (selectedNode?.ring ?? 0)} feedback={feedback?.nodeId === node.id ? feedback.kind : undefined} onSelect={onSelect} />
  })}</div>
})

const ArcaneCoreOrbitLayer = memo(function ArcaneCoreOrbitLayer({ highestRing, selectedRing, ringPulse }: { highestRing: ArcaneCoreRingIndex; selectedRing?: ArcaneCoreRingIndex; ringPulse: ArcaneCoreRingIndex | null }) {
  return <svg className="arcane-core-orbit-layer" viewBox={`0 0 ${ARCANE_CORE_CANVAS_SIZE} ${ARCANE_CORE_CANVAS_SIZE}`} aria-hidden="true">{ARCANE_CORE_RING_INDICES.map((ring) => <g key={ring}><circle data-ring={ring} className={`arcane-core-orbit ${ring <= highestRing ? 'is-unlocked' : ring === highestRing + 1 ? 'is-next-locked' : 'is-deep-locked'} ${ringPulse === ring ? 'is-unlock-pulse' : ''}`} cx={ARCANE_CORE_CANVAS_SIZE / 2} cy={ARCANE_CORE_CANVAS_SIZE / 2} r={getArcaneCoreRingRadius(ring)} vectorEffect="non-scaling-stroke" />{selectedRing === ring && <circle data-ring={ring} className="arcane-core-orbit is-selected" cx={ARCANE_CORE_CANVAS_SIZE / 2} cy={ARCANE_CORE_CANVAS_SIZE / 2} r={getArcaneCoreRingRadius(ring)} vectorEffect="non-scaling-stroke" />}</g>)}</svg>
})

function CoreModal({ branch, onClose }: { branch: ArcaneCoreBranchDefinition; onClose: () => void }) {
  const core = useGameStore((state) => state.arcaneCore)
  const purchase = useGameStore((state) => state.purchaseArcaneCoreNode)
  const refund = useGameStore((state) => state.refundArcaneCoreNode)
  const resetBranch = useGameStore((state) => state.resetArcaneCoreBranch)
  const [selectedId, setSelectedId] = useState(branch.nodes[0]?.id ?? '')
  const [feedback, setFeedback] = useState<{ nodeId: string; kind: 'purchase' | 'max' } | null>(null)
  const [ringPulse, setRingPulse] = useState<ArcaneCoreRingIndex | null>(null)
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const drag = useRef<CoreDragState | null>(null)
  const feedbackTimer = useRef<number | null>(null)
  const { cameraRef, viewportSizeRef, viewportSize, zoomForHud, cameraMode, setCameraMode, scheduleCameraApply, fitCamera, zoomAtPointer } = useArcaneCoreCamera({ viewportRef, worldRef })
  const selected = branch.nodes.find((node) => node.id === selectedId) ?? branch.nodes[0]
  const selectedRank = selected ? getArcaneCoreNodeRank(core, selected.id) : 0
  const selectedAvailable = selected ? isArcaneCoreNodeReachable(core, selected.id) : false
  const highestRing = getArcaneCoreHighestUnlockedRing(core, branch.id)
  const spent = getArcaneCorePointsSpent({ nodes: Object.fromEntries(branch.nodes.map((node) => [node.id, core.nodes[node.id]]).filter(([, value]) => value)) })
  const fitProgressionRing = Math.min(8, highestRing + 1) as ArcaneCoreRingIndex
  const zoomClass = zoomForHud < .3 ? 'is-zoom-far' : zoomForHud < .65 ? 'is-zoom-medium' : 'is-zoom-close'

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => { if (event.button !== 0 || (event.target as Element | null)?.closest('button, [data-no-pan]')) return; event.preventDefault(); drag.current = { x: event.clientX, y: event.clientY, offsetX: cameraRef.current.x, offsetY: cameraRef.current.y, moved: false }; event.currentTarget.setPointerCapture?.(event.pointerId) }
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => { if (!drag.current) return; const nextX = event.clientX - drag.current.x; const nextY = event.clientY - drag.current.y; if (!drag.current.moved && Math.hypot(nextX, nextY) < ARCANE_CORE_DRAG_THRESHOLD) return; if (!drag.current.moved) { drag.current.moved = true; setCameraMode('manual'); event.currentTarget.classList.add('is-panning') }; const nextOffset = clampCameraOffset({ x: drag.current.offsetX + nextX, y: drag.current.offsetY + nextY }, cameraRef.current.zoom, viewportSizeRef.current); cameraRef.current.x = nextOffset.x; cameraRef.current.y = nextOffset.y; scheduleCameraApply() }
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => { drag.current = null; event.currentTarget.classList.remove('is-panning'); if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId) }
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => { event.preventDefault(); const rect = viewportRef.current?.getBoundingClientRect(); if (!rect) return; const nextZoom = Math.max(ARCANE_CORE_MIN_ZOOM, Math.min(ARCANE_CORE_MAX_ZOOM, cameraRef.current.zoom * (event.deltaY > 0 ? .9 : 1.1))); zoomAtPointer(nextZoom, { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 }) }
  const applyFit = (mode: 'progression' | 'all') => fitCamera(mode, (mode === 'all' ? 8 : fitProgressionRing) as ArcaneCoreRingIndex)

  useEffect(() => { if (cameraMode === 'manual' || !viewportSize.width || !viewportSize.height) return; fitCamera(cameraMode, (cameraMode === 'all' ? 8 : fitProgressionRing) as ArcaneCoreRingIndex) }, [cameraMode, fitCamera, fitProgressionRing, viewportSize.width, viewportSize.height])
  useEffect(() => () => { if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current) }, [])

  const flashFeedback = (nodeId: string, kind: 'purchase' | 'max', unlockedRing?: ArcaneCoreRingIndex) => { if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current); setFeedback({ nodeId, kind }); setRingPulse(unlockedRing ?? null); feedbackTimer.current = window.setTimeout(() => { setFeedback(null); setRingPulse(null); feedbackTimer.current = null }, 760) }
  const handlePurchase = () => { if (!selected || selectedRank >= selected.maxRank || !selectedAvailable) return; const previousHighest = highestRing; if (!purchase(selected.id)) return; const nextCore = useGameStore.getState().arcaneCore; const nextHighest = getArcaneCoreHighestUnlockedRing(nextCore, branch.id); flashFeedback(selected.id, selectedRank + 1 >= selected.maxRank ? 'max' : 'purchase', nextHighest > previousHighest ? nextHighest : undefined) }
  const requestRefund = () => { if (!selected || selectedRank <= 0) return; const preview = getArcaneCoreRefundPreview(core, selected.id); if (preview.ok) setConfirmation({ label: `Refund ${selected.name} rank?`, points: preview.corePointsReturned, ranks: preview.ranksAffected, majors: preview.majorsAffected, rings: preview.ringsRelocked.length, confirm: () => { refund(selected.id); setConfirmation(null) } }) }
  const requestReset = () => { const preview = getArcaneCoreBranchResetPreview(core, branch.id); if (preview.ok && preview.corePointsReturned > 0) setConfirmation({ label: `Reset ${branch.name} Core?`, points: preview.corePointsReturned, ranks: preview.ranksAffected, majors: preview.majorsAffected, rings: preview.ringsRelocked.length, confirm: () => { resetBranch(branch.id); setConfirmation(null) } }) }
  const selectedCurrent = selected ? nodeEffect(selected, selectedRank) : ''
  const selectedNext = selected && selectedRank < selected.maxRank ? nodeEffect(selected, selectedRank + 1) : 'Maximum rank reached.'
  const selectedMax = selected ? nodeEffect(selected, selected.maxRank) : ''
  const previousRing = Math.max(1, (selected?.ring ?? 1) - 1) as ArcaneCoreRingIndex
  const standardRanks = selected ? getArcaneCoreRingStandardRanksInvested(core, branch.id, selected.ring) : 0
  const previousRingRanks = selected ? getArcaneCoreRingStandardRanksInvested(core, branch.id, previousRing) : 0
  const statusText = selected && selectedRank >= selected.maxRank ? 'MAX RANK' : selectedAvailable ? 'AVAILABLE' : selected?.nodeType === 'major' ? `MAJOR LOCKED · ${standardRanks} / ${ARCANE_CORE_MAJOR_GATES[selected.ring]} STANDARD RANKS` : selected?.ring === 1 ? 'AVAILABLE' : `RING LOCKED · ${previousRingRanks} / ${ARCANE_CORE_RING_GATES[selected?.ring ?? 1]} PREVIOUS-RING RANKS`

  return <ModalPortal open onClose={onClose} onEscape={() => confirmation ? setConfirmation(null) : onClose()} surfaceStyle={{ '--branch-accent': branch.accent } as CSSProperties} backdropClassName="arcane-core-modal-backdrop" surfaceClassName="arcane-core-modal" ariaLabel={`${branch.name} Core`}>
    <div className="arcane-core-modal-head"><div><span className="eyebrow" style={{ color: branch.accent }}>{branch.name.toUpperCase()} CORE · CONCENTRIC PATH</span><h2>{branch.name} Core</h2><p>Invest Arcane Points from the center outward. Each Ring unlocks by standard-rank investment; every rank is permanent until refunded.</p></div><div className="arcane-core-modal-actions"><Status tone="active">{spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE} invested</Status><Button variant="ghost" onClick={onClose} ariaLabel="Close Arcane Core"><X size={17} /></Button></div></div>
    <div className="arcane-core-modal-toolbar"><span><Crosshair size={14} /> Drag to pan · wheel to zoom</span><span>UNLOCKED {highestRing} / 8 · {spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE} ARCANE POINTS · {Math.round(zoomForHud * 100)}%</span><Button variant="ghost" onClick={() => applyFit('progression')}><Crosshair size={13} /> Fit Progression</Button><Button variant="ghost" onClick={() => applyFit('all')}><Crosshair size={13} /> Fit All</Button><Button variant="ghost" onClick={() => applyFit('progression')}><RotateCcw size={13} /> Reset View</Button><Button variant="danger" onClick={requestReset} disabled={spent === 0}>Reset Core</Button></div>
    <div className="arcane-core-modal-body"><div ref={viewportRef} className="arcane-core-ring-viewport" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={handleWheel} onDragStart={(event) => event.preventDefault()}>
      <div className={`arcane-core-depth-hud ${zoomClass}`} aria-label="Arcane Core Ring progression"><span>CORE DEPTH</span><strong>RING {highestRing} / 8 REACHED</strong><div>{ARCANE_CORE_RING_INDICES.map((ring) => <i key={ring} className={`${ring <= highestRing ? 'is-unlocked' : ring === highestRing + 1 ? 'is-next' : 'is-locked'}`}><b>{ring}</b>{ring > highestRing && <LockKeyhole size={9} aria-hidden="true" />}</i>)}</div></div>
      <div ref={worldRef} className="arcane-core-world" onDragStart={(event) => event.preventDefault()}><div className="arcane-core-hub"><Sparkles size={28} /><span className="arcane-core-hub-kicker">{branch.name.toUpperCase()} CORE</span><strong>{spent} / {ARCANE_CORE_TOTAL_COST_PER_CORE}</strong><small>ARCANE POINTS INVESTED</small><em>RING {highestRing} REACHED</em></div><ArcaneCoreOrbitLayer highestRing={highestRing} selectedRing={selected?.ring} ringPulse={ringPulse} /><ArcaneCoreNodeLayer branch={branch} core={core} highestRing={highestRing} selectedId={selectedId} feedback={feedback} onSelect={setSelectedId} /></div>
    </div><aside className="arcane-core-node-inspector">{selected && <><div className="arcane-core-inspector-identity"><div className="arcane-core-inspector-title"><span className="arcane-core-inspector-glyph" style={{ background: branch.accent }}><Sparkles size={17} /></span><div><span className="eyebrow">RING {selected.ring} · {selected.nodeType.toUpperCase()}</span><h3>{selected.name}</h3></div></div><p className="muted">{selected.description}</p></div><section className="arcane-core-inspector-section"><span className="arcane-core-inspector-section-label">EFFECT SUMMARY</span><div className="arcane-core-inspector-effect"><span>CURRENT EFFECT · RANK {selectedRank}/{selected.maxRank}</span><strong>{selectedCurrent}</strong><small>NEXT · {selectedNext}</small><small>MAX · {selectedMax}</small></div></section><section className="arcane-core-inspector-section"><span className="arcane-core-inspector-section-label">NODE STATUS</span><div className="arcane-core-inspector-meta"><span>RING<strong>{getArcaneCoreRingName(branch.id, selected.ring)}</strong></span><span>STATUS<strong>{statusText}</strong></span><span>COST<strong>{selected.rankCost} ARCANE POINT{selected.rankCost > 1 ? 'S' : ''}</strong></span><span>RANK<strong>{selectedRank} / {selected.maxRank}</strong></span></div></section><div className="arcane-core-inspector-actions"><Button variant="primary" onClick={handlePurchase} disabled={selectedRank >= selected.maxRank || !selectedAvailable}>PURCHASE {selected.nodeType === 'major' ? 'MAJOR' : 'RANK'} · {selected.rankCost} ARCANE POINT{selected.rankCost > 1 ? 'S' : ''}</Button><Button variant="ghost" onClick={requestRefund} disabled={selectedRank === 0}>Refund One Rank</Button></div></>}</aside></div>
    {confirmation && <div className="arcane-core-confirm-layer" onMouseDown={(event) => event.stopPropagation()}><section className="arcane-core-confirmation" role="alertdialog" aria-modal="true"><span className="eyebrow">CONFIRM REFUND CASCADE</span><h3>{confirmation.label}</h3><p className="muted">Outer allocations become invalid if this refund closes a Ring gate.</p><div className="arcane-core-confirm-summary"><span><small>RANKS RETURNED</small><strong>{confirmation.ranks}</strong></span><span><small>ARCANE POINTS RETURNED</small><strong>{confirmation.points}</strong></span><span><small>MAJORS AFFECTED</small><strong>{confirmation.majors}</strong></span><span><small>RINGS RELOCKED</small><strong>{confirmation.rings}</strong></span></div><div className="button-row"><Button variant="ghost" onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="danger" onClick={confirmation.confirm}>Confirm Refund</Button></div></section></div>}
  </ModalPortal>
}

export function ArcaneCoreScreen() {
  const core = useGameStore((state) => state.arcaneCore)
  const [branchId, setBranchId] = useState<ArcaneCoreBranchId | null>(null)
  const activeBranch = branchId ? ARCANE_CORE_BRANCHES.find((branch) => branch.id === branchId) : undefined
  const resonance = getArcaneCoreResonanceSummary(core)
  const pointsSpent = getArcaneCorePointsSpent(core)
  const hasResonance = resonance.alwaysOn.length > 0 || resonance.conditional.length > 0 || resonance.mechanics.length > 0
  return <div className="screen-content arcane-core-screen"><div className="screen-header"><div><div className="eyebrow">HERO · PERMANENT PROGRESSION</div><h1>Arcane Core</h1><p>Defeat monsters and bosses to earn Arcane Points. Spend them across four permanent Cores; deeper Rings cost more.</p></div><Status tone="active">{pointsSpent} / {ARCANE_CORE_TOTAL_TREE_COST} Arcane Points invested</Status></div><ScreenGrid screen="arcane-core" panels={[{ id: 'arcane-core-overview', content: <div className="arcane-core-overview-stack"><Card title="Arcane Points"><CoreProgress core={core} /></Card><div className="arcane-core-branch-grid">{ARCANE_CORE_BRANCHES.map((branch) => <BranchCard key={branch.id} branch={branch} state={core} onOpen={() => setBranchId(branch.id)} />)}</div><Card title="Active resonance" action={<Status tone="success">{resonance.alwaysOn.length} always-on</Status>}><div className="arcane-core-resonance"><section className="arcane-core-resonance-group"><div className="arcane-core-resonance-group-head"><span>ALWAYS-ON TOTALS</span><small>Permanent bonuses</small></div><div className="arcane-core-resonance-grid">{resonance.alwaysOn.map((entry) => <ResonanceEntry key={entry.id} entry={entry} />)}</div></section>{resonance.conditional.length > 0 && <section className="arcane-core-resonance-group"><div className="arcane-core-resonance-group-head"><span>CONDITIONAL RESONANCE</span><small>{resonance.conditional.length} effects</small></div><div className="arcane-core-resonance-grid">{resonance.conditional.map((entry) => <ConditionalResonanceEntry key={entry.id} entry={entry} />)}</div></section>}{resonance.mechanics.length > 0 && <MechanicsOnline entries={resonance.mechanics} />}{!hasResonance && <p className="muted">Purchase ranks to bring permanent modifiers online.</p>}</div></Card><ArcaneCorePresetPanel /></div> }]} />{activeBranch && <CoreModal branch={activeBranch} onClose={() => setBranchId(null)} />}</div>
}
