import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { Crosshair, LockKeyhole, RotateCcw, Sparkles, X } from 'lucide-react'
import { Button, Card, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { ArcaneCorePresetPanel } from '../../components/arcane-core/ArcaneCorePresetPanel'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_POINTS_PER_CORE, ARCANE_CORE_TOTAL_POINTS } from '../../game/content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_MAJOR_GATES, ARCANE_CORE_RING_GATES, ARCANE_CORE_RING_INDICES, getArcaneCoreRingName } from '../../game/content/arcaneCore/arcaneCoreRings'
import { formatArcaneCoreModifierValue, getArcaneCoreModifierLabel, getArcaneCoreNodeEffectTexts, getArcaneCoreNodePosition, getArcaneCoreRingRadius } from '../../game/presentation/arcaneCore/arcaneCorePresentation'
import { getArcaneCoreBranchResetPreview, getArcaneCoreHighestUnlockedRing, getArcaneCoreLevelInfo, getArcaneCoreNodeRank, getArcaneCorePointsSpent, getArcaneCoreRefundPreview, getArcaneCoreRingPointsSpent, getArcaneCoreStaticStats, isArcaneCoreMajorUnlocked, isArcaneCoreNodeReachable } from '../../game/systems/arcaneCore'
import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId, ArcaneCoreModifierKey, ArcaneCoreNodeDefinition, ArcaneCoreRingIndex } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

function CoreProgress({ core }: { core: ReturnType<typeof useGameStore.getState>['arcaneCore'] }) {
  const info = getArcaneCoreLevelInfo(core)
  const progress = info.xpToNextLevel > 0 ? Math.min(100, info.xpIntoLevel / (info.xpIntoLevel + info.xpToNextLevel) * 100) : 100
  return <div className="arcane-core-wallet" aria-label="Arcane Core progression"><div><span>ARCANE CORE LEVEL</span><strong>Level {info.level}</strong><small>{info.totalXp.toLocaleString()} total XP</small><i><em style={{ width: `${progress}%` }} /></i></div><div><span>XP</span><strong>{info.xpToNextLevel > 0 ? `${info.xpIntoLevel.toLocaleString()} / ${(info.xpIntoLevel + info.xpToNextLevel).toLocaleString()}` : 'MAX'}</strong><small>{info.xpToNextLevel > 0 ? `${info.xpToNextLevel.toLocaleString()} XP to next level` : 'Maximum level reached'}</small><i><em style={{ width: `${progress}%` }} /></i></div><div><span>CORE POINTS</span><strong>{info.pointsAvailable} Available</strong><small>{info.pointsEarned} Earned · {info.pointsSpent} Spent globally</small></div></div>
}

function BranchCard({ branch, onOpen, state }: { branch: ArcaneCoreBranchDefinition; onOpen: () => void; state: ReturnType<typeof useGameStore.getState>['arcaneCore'] }) {
  const spent = getArcaneCorePointsSpent({ nodes: Object.fromEntries(branch.nodes.map((node) => [node.id, state.nodes[node.id]]).filter(([, value]) => value)) })
  const highest = getArcaneCoreHighestUnlockedRing(state, branch.id)
  return <button type="button" className="arcane-core-branch-card" style={{ '--branch-accent': branch.accent } as CSSProperties} onClick={onOpen}><span className="arcane-core-branch-mark"><Sparkles size={17} /></span><span className="arcane-core-branch-copy"><span className="eyebrow">{branch.name.toUpperCase()} CORE</span><strong>{branch.name} Core</strong><small>{branch.description}</small></span><span className="arcane-core-branch-progress"><b>{spent} / {ARCANE_CORE_POINTS_PER_CORE}</b><small>Core Points invested</small><i><em style={{ width: `${spent / ARCANE_CORE_POINTS_PER_CORE * 100}%` }} /></i><small className="arcane-core-branch-active">Ring {highest} / 8 unlocked</small></span><span className="arcane-core-branch-open">OPEN CORE ›</span></button>
}

type PendingConfirmation = { label: string; points: number; ranks: number; majors: number; rings: number; confirm: () => void }
type CoreCameraMode = 'progression' | 'all' | 'manual'
type CoreViewportSize = { width: number; height: number }
type CoreDragState = { x: number; y: number; offsetX: number; offsetY: number; moved: boolean }

const nodeEffect = (node: ArcaneCoreNodeDefinition, rank: number) => getArcaneCoreNodeEffectTexts(node, rank).join(' · ')
const ARCANE_CORE_MIN_ZOOM = .14
const ARCANE_CORE_MAX_ZOOM = 1.2
const ARCANE_CORE_DRAG_THRESHOLD = 6
const ARCANE_CORE_NODE_MARGIN = 150
const clampCameraOffset = (offset: { x: number; y: number }, zoom: number, viewport: CoreViewportSize) => {
  const viewportWidth = viewport.width || 720
  const viewportHeight = viewport.height || 520
  const extent = (getArcaneCoreRingRadius(8) + ARCANE_CORE_NODE_MARGIN) * zoom
  const maxX = Math.max(0, extent - viewportWidth / 2 + 24)
  const maxY = Math.max(0, extent - viewportHeight / 2 + 24)
  return { x: Math.max(-maxX, Math.min(maxX, offset.x)), y: Math.max(-maxY, Math.min(maxY, offset.y)) }
}

const getArcaneCoreFitZoom = (viewport: CoreViewportSize, targetRing: ArcaneCoreRingIndex) => {
  const viewportWidth = viewport.width || 720
  const viewportHeight = viewport.height || 520
  const usableSize = Math.max(260, Math.min(viewportWidth, viewportHeight) - 56)
  return Math.max(ARCANE_CORE_MIN_ZOOM, Math.min(.78, usableSize / ((getArcaneCoreRingRadius(targetRing) + ARCANE_CORE_NODE_MARGIN) * 2)))
}

function CoreModal({ branch, onClose }: { branch: ArcaneCoreBranchDefinition; onClose: () => void }) {
  const core = useGameStore((state) => state.arcaneCore)
  const purchase = useGameStore((state) => state.purchaseArcaneCoreNode)
  const refund = useGameStore((state) => state.refundArcaneCoreNode)
  const resetBranch = useGameStore((state) => state.resetArcaneCoreBranch)
  const [selectedId, setSelectedId] = useState(branch.nodes[0]?.id ?? '')
  const [zoom, setZoom] = useState(.2)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [viewportSize, setViewportSize] = useState<CoreViewportSize>({ width: 0, height: 0 })
  const [cameraMode, setCameraMode] = useState<CoreCameraMode>('progression')
  const [feedback, setFeedback] = useState<{ nodeId: string; kind: 'purchase' | 'max' | 'major' } | null>(null)
  const [ringPulse, setRingPulse] = useState<ArcaneCoreRingIndex | null>(null)
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const drag = useRef<CoreDragState | null>(null)
  const feedbackTimer = useRef<number | null>(null)
  const selected = branch.nodes.find((node) => node.id === selectedId) ?? branch.nodes[0]
  const selectedRank = selected ? getArcaneCoreNodeRank(core, selected.id) : 0
  const selectedAvailable = selected ? isArcaneCoreNodeReachable(core, selected.id) && (selected.nodeType !== 'major' || isArcaneCoreMajorUnlocked(core, selected)) : false
  const highestRing = getArcaneCoreHighestUnlockedRing(core, branch.id)
  const spent = getArcaneCorePointsSpent({ nodes: Object.fromEntries(branch.nodes.map((node) => [node.id, core.nodes[node.id]]).filter(([, value]) => value)) })
  const fitProgressionRing = Math.min(8, highestRing + 1) as ArcaneCoreRingIndex
  const zoomClass = zoom < .3 ? 'is-zoom-far' : zoom < .65 ? 'is-zoom-medium' : 'is-zoom-close'

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as Element | null)?.closest('button, [data-no-pan]')) return
    event.preventDefault()
    drag.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y, moved: false }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    const nextX = event.clientX - drag.current.x
    const nextY = event.clientY - drag.current.y
    if (!drag.current.moved && Math.hypot(nextX, nextY) < ARCANE_CORE_DRAG_THRESHOLD) return
    drag.current.moved = true
    setCameraMode('manual')
    setOffset(clampCameraOffset({ x: drag.current.offsetX + nextX, y: drag.current.offsetY + nextY }, zoom, viewportSize))
  }
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture?.(event.pointerId)
  }
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault()
    const rect = viewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const nextZoom = Math.max(ARCANE_CORE_MIN_ZOOM, Math.min(ARCANE_CORE_MAX_ZOOM, zoom * (event.deltaY > 0 ? .9 : 1.1)))
    const pointerX = event.clientX - rect.left - rect.width / 2
    const pointerY = event.clientY - rect.top - rect.height / 2
    const worldX = (pointerX - offset.x) / zoom
    const worldY = (pointerY - offset.y) / zoom
    setOffset(clampCameraOffset({ x: pointerX - worldX * nextZoom, y: pointerY - worldY * nextZoom }, nextZoom, viewportSize))
    setZoom(nextZoom)
    setCameraMode('manual')
  }
  const applyFit = (mode: Exclude<CoreCameraMode, 'manual'>) => {
    const target = mode === 'all' ? 8 as ArcaneCoreRingIndex : fitProgressionRing
    setCameraMode(mode)
    setZoom(getArcaneCoreFitZoom(viewportSize, target))
    setOffset({ x: 0, y: 0 })
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const updateSize = () => setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight })
    updateSize()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updateSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (cameraMode === 'manual' || !viewportSize.width || !viewportSize.height) return
    const target = cameraMode === 'all' ? 8 as ArcaneCoreRingIndex : fitProgressionRing
    setZoom(getArcaneCoreFitZoom(viewportSize, target))
    setOffset({ x: 0, y: 0 })
  }, [cameraMode, fitProgressionRing, viewportSize.width, viewportSize.height])
  useEffect(() => () => { if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current) }, [])

  const flashFeedback = (nodeId: string, kind: 'purchase' | 'max' | 'major', unlockedRing?: ArcaneCoreRingIndex) => {
    if (feedbackTimer.current !== null) window.clearTimeout(feedbackTimer.current)
    setFeedback({ nodeId, kind })
    setRingPulse(unlockedRing ?? null)
    feedbackTimer.current = window.setTimeout(() => { setFeedback(null); setRingPulse(null); feedbackTimer.current = null }, 760)
  }
  const handlePurchase = () => {
    if (!selected || selectedRank >= selected.maxRank || !selectedAvailable) return
    const previousHighest = highestRing
    if (!purchase(selected.id)) return
    const nextCore = useGameStore.getState().arcaneCore
    const nextHighest = getArcaneCoreHighestUnlockedRing(nextCore, branch.id)
    flashFeedback(selected.id, selected.nodeType === 'major' ? 'major' : selectedRank + 1 >= selected.maxRank ? 'max' : 'purchase', nextHighest > previousHighest ? nextHighest : undefined)
  }
  const requestRefund = () => {
    if (!selected || selectedRank <= 0) return
    const preview = getArcaneCoreRefundPreview(core, selected.id)
    if (preview.ok) setConfirmation({ label: `Refund ${selected.name} rank?`, points: preview.corePointsReturned, ranks: preview.ranksAffected, majors: preview.majorsAffected, rings: preview.ringsRelocked.length, confirm: () => { refund(selected.id); setConfirmation(null) } })
  }
  const requestReset = () => {
    const preview = getArcaneCoreBranchResetPreview(core, branch.id)
    if (preview.ok && preview.corePointsReturned > 0) setConfirmation({ label: `Reset ${branch.name} Core?`, points: preview.corePointsReturned, ranks: preview.ranksAffected, majors: preview.majorsAffected, rings: preview.ringsRelocked.length, confirm: () => { resetBranch(branch.id); setConfirmation(null) } })
  }
  const selectedCurrent = selected ? nodeEffect(selected, selectedRank) : ''
  const selectedNext = selected && selectedRank < selected.maxRank ? nodeEffect(selected, selectedRank + 1) : 'Maximum rank reached.'
  const selectedMax = selected ? nodeEffect(selected, selected.maxRank) : ''
  const previousRing = Math.max(1, (selected?.ring ?? 1) - 1) as ArcaneCoreRingIndex
  const statusText = selected && selectedRank >= selected.maxRank ? 'MAX RANK' : selectedAvailable ? 'AVAILABLE' : selected?.nodeType === 'major' ? `MAJOR LOCKED · ${getArcaneCoreRingPointsSpent(core, branch.id, selected.ring)} / ${ARCANE_CORE_MAJOR_GATES[selected.ring]} POINTS` : selected?.ring === 1 ? 'AVAILABLE' : `RING LOCKED · ${getArcaneCoreRingPointsSpent(core, branch.id, previousRing)} / ${ARCANE_CORE_RING_GATES[selected?.ring ?? 1]} PREVIOUS-RING POINTS`

  return <ModalPortal open onClose={onClose} onEscape={() => confirmation ? setConfirmation(null) : onClose()} surfaceStyle={{ '--branch-accent': branch.accent } as CSSProperties} backdropClassName="arcane-core-modal-backdrop" surfaceClassName="arcane-core-modal" ariaLabel={`${branch.name} Core`}>
    <div className="arcane-core-modal-head"><div><span className="eyebrow" style={{ color: branch.accent }}>{branch.name.toUpperCase()} CORE · CONCENTRIC PATH</span><h2>{branch.name} Core</h2><p>Invest Core Points from the center outward. Each Ring unlocks by investment; every rank is permanent until refunded.</p></div><div className="arcane-core-modal-actions"><Status tone="active">{spent} / {ARCANE_CORE_POINTS_PER_CORE} invested</Status><Button variant="ghost" onClick={onClose} ariaLabel="Close Arcane Core"><X size={17} /></Button></div></div>
    <div className="arcane-core-modal-toolbar"><span><Crosshair size={14} /> Drag to pan · wheel to zoom</span><span>UNLOCKED {highestRing} / 8 · {spent} / {ARCANE_CORE_POINTS_PER_CORE} POINTS · {Math.round(zoom * 100)}%</span><Button variant="ghost" onClick={() => applyFit('progression')}><Crosshair size={13} /> Fit Progression</Button><Button variant="ghost" onClick={() => applyFit('all')}><Crosshair size={13} /> Fit All</Button><Button variant="ghost" onClick={() => applyFit('progression')}><RotateCcw size={13} /> Reset View</Button><Button variant="danger" onClick={requestReset} disabled={spent === 0}>Reset Core</Button></div>
    <div className="arcane-core-modal-body">
      <div ref={viewportRef} className="arcane-core-ring-viewport" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={handleWheel} onDragStart={(event) => event.preventDefault()}>
        <div className={`arcane-core-depth-hud ${zoomClass}`} aria-label="Arcane Core ring progression"><span>CORE DEPTH</span><strong>RING {highestRing} / 8 REACHED</strong><div>{ARCANE_CORE_RING_INDICES.map((ring) => <i key={ring} className={`${ring <= highestRing ? 'is-unlocked' : ring === highestRing + 1 ? 'is-next' : 'is-locked'}`}><b>{ring}</b>{ring > highestRing && <LockKeyhole size={9} aria-hidden="true" />}</i>)}</div></div>
        <div className={`arcane-core-ring-canvas ${zoomClass}`} style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }} onDragStart={(event) => event.preventDefault()}>
          <div className="arcane-core-hub"><Sparkles size={28} /><span className="arcane-core-hub-kicker">{branch.name.toUpperCase()} CORE</span><strong>{spent} / {ARCANE_CORE_POINTS_PER_CORE}</strong><small>POINTS INVESTED</small><em>RING {highestRing} REACHED</em></div>
          <div className="arcane-core-ring-layer">{ARCANE_CORE_RING_INDICES.map((ring) => <div key={ring} className={`arcane-core-ring ring-${ring} ${ring <= highestRing ? 'is-unlocked' : ring === highestRing + 1 ? 'is-next-locked' : 'is-deep-locked'} ${ringPulse === ring ? 'is-unlock-pulse' : ''} ${selected?.ring === ring ? 'is-selected-ring' : ''}`} />)}</div>
          <div className="arcane-core-node-layer">{branch.nodes.map((node) => { const position = getArcaneCoreNodePosition(node); const rank = getArcaneCoreNodeRank(core, node.id); const reachable = isArcaneCoreNodeReachable(core, node.id); const majorAvailable = isArcaneCoreMajorUnlocked(core, node); const ringLocked = node.ring > highestRing; const nodeAvailable = reachable && majorAvailable; const nodeFeedback = feedback?.nodeId === node.id ? feedback.kind : undefined; return <GameTooltip key={`${node.id}-${nodeFeedback ?? 'idle'}`} content={`${node.name} · Rank ${rank}/${node.maxRank} · ${nodeEffect(node, rank)}`}><button type="button" data-no-pan className={`arcane-core-ring-node node-${node.nodeType} ${rank > 0 ? 'is-active' : ''} ${nodeAvailable ? 'is-available' : 'is-locked'} ${ringLocked ? 'is-ring-locked' : ''} ${ringLocked && node.ring === highestRing + 1 ? 'is-next-locked' : ''} ${ringLocked && node.ring > highestRing + 1 ? 'is-deep-locked' : ''} ${selected?.ring === node.ring ? 'is-selected-ring-node' : ''} ${selected?.id === node.id ? 'is-selected' : ''} ${nodeFeedback ? `is-${nodeFeedback}-pulse` : ''}`} style={{ left: position.left, top: position.top }} onClick={() => setSelectedId(node.id)} aria-label={`${node.name}, rank ${rank} of ${node.maxRank}`}><span className="arcane-core-node-dot" aria-hidden="true">{node.nodeType === 'major' ? '✦' : '◆'}</span><strong>{node.name}</strong><small>{node.nodeType === 'major' ? 'MAJOR' : `RANK ${rank}/${node.maxRank}`}</small>{node.nodeType !== 'major' && <i className="arcane-core-rank-pips" aria-hidden="true">{[1, 2, 3, 4, 5].map((pip) => <b key={pip} className={pip <= rank ? 'is-paid' : undefined} />)}</i>}</button></GameTooltip> })}</div>
        </div>
      </div>
      <aside className="arcane-core-node-inspector">{selected && <><div className="arcane-core-inspector-identity"><div className="arcane-core-inspector-title"><span className="arcane-core-inspector-glyph" style={{ background: branch.accent }}><Sparkles size={17} /></span><div><span className="eyebrow">RING {selected.ring} · {selected.nodeType.toUpperCase()}</span><h3>{selected.name}</h3></div></div><p className="muted">{selected.description}</p></div><section className="arcane-core-inspector-section"><span className="arcane-core-inspector-section-label">EFFECT SUMMARY</span><div className="arcane-core-inspector-effect"><span>CURRENT EFFECT · RANK {selectedRank}/{selected.maxRank}</span><strong>{selectedCurrent}</strong><small>NEXT · {selectedNext}</small><small>MAX · {selectedMax}</small></div></section><section className="arcane-core-inspector-section"><span className="arcane-core-inspector-section-label">NODE STATUS</span><div className="arcane-core-inspector-meta"><span>RING<strong>{getArcaneCoreRingName(branch.id, selected.ring)}</strong></span><span>STATUS<strong>{statusText}</strong></span><span>COST<strong>{selected.rankCost} CORE POINT{selected.rankCost > 1 ? 'S' : ''}</strong></span><span>RANK<strong>{selectedRank} / {selected.maxRank}</strong></span></div></section><div className="arcane-core-inspector-actions"><Button variant="primary" onClick={handlePurchase} disabled={selectedRank >= selected.maxRank || !selectedAvailable}>Purchase Rank · {selected.rankCost} Point{selected.rankCost > 1 ? 's' : ''}</Button><Button variant="ghost" onClick={requestRefund} disabled={selectedRank === 0}>Refund One Rank</Button></div></>}</aside>
    </div>
    {confirmation && <div className="arcane-core-confirm-layer" onMouseDown={(event) => event.stopPropagation()}><section className="arcane-core-confirmation" role="alertdialog" aria-modal="true"><span className="eyebrow">CONFIRM REFUND CASCADE</span><h3>{confirmation.label}</h3><p className="muted">Outer allocations become invalid if this refund closes a Ring gate.</p><div className="arcane-core-confirm-summary"><span><small>RANKS RETURNED</small><strong>{confirmation.ranks}</strong></span><span><small>POINTS RETURNED</small><strong>{confirmation.points}</strong></span><span><small>MAJORS AFFECTED</small><strong>{confirmation.majors}</strong></span><span><small>RINGS RELOCKED</small><strong>{confirmation.rings}</strong></span></div><div className="button-row"><Button variant="ghost" onClick={() => setConfirmation(null)}>Cancel</Button><Button variant="danger" onClick={confirmation.confirm}>Confirm Refund</Button></div></section></div>}
  </ModalPortal>
}

export function ArcaneCoreScreen() {
  const core = useGameStore((state) => state.arcaneCore)
  const [branchId, setBranchId] = useState<ArcaneCoreBranchId | null>(null)
  const activeBranch = branchId ? ARCANE_CORE_BRANCHES.find((branch) => branch.id === branchId) : null
  const stats = getArcaneCoreStaticStats(core)
  const pointsSpent = getArcaneCorePointsSpent(core)
  return <div className="screen-content arcane-core-screen"><div className="screen-header"><div><div className="eyebrow">HERO · PERMANENT PROGRESSION</div><h1>Arcane Core</h1><p>Shape the permanent engine beneath the wizard. Earn XP in combat, gain Core Points, and grow four independent concentric Cores.</p></div><Status tone="active">{pointsSpent} / {ARCANE_CORE_TOTAL_POINTS} points invested</Status></div><ScreenGrid screen="arcane-core" panels={[{ id: 'arcane-core-overview', content: <div className="arcane-core-overview-stack"><Card title="Core progression"><CoreProgress core={core} /></Card><div className="arcane-core-branch-grid">{ARCANE_CORE_BRANCHES.map((branch) => <BranchCard key={branch.id} branch={branch} state={core} onOpen={() => setBranchId(branch.id)} />)}</div><Card title="Active resonance" action={<Status tone="success">Permanent Core modifiers</Status>}><div className="arcane-core-resonance">{Object.entries(stats).filter(([, value]) => typeof value === 'number' && value !== 0).map(([key, value]) => <span key={key}><small>{getArcaneCoreModifierLabel(key as ArcaneCoreModifierKey)}</small><strong>{formatArcaneCoreModifierValue(key as ArcaneCoreModifierKey, Number(value))}</strong></span>)}{!Object.values(stats).some((value) => typeof value === 'number' && value !== 0) && <p className="muted">Purchase ranks to bring permanent modifiers online.</p>}</div></Card><ArcaneCorePresetPanel /></div> }]} />{activeBranch && <CoreModal branch={activeBranch} onClose={() => setBranchId(null)} />}</div>
}
