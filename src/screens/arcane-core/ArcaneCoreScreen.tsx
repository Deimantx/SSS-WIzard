import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react'
import { ChevronRight, Crosshair, RotateCcw, Save, Sparkles, X } from 'lucide-react'
import { Button, Card, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { ARCANE_CORE_BRANCHES } from '../../game/content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_NODE_UNLOCK_COST, ARCANE_CORE_RANK_COSTS } from '../../game/content/arcaneCore/arcaneCoreBalance'
import { getArcaneCoreModifierTotals, getArcaneCoreNodeProgress, isArcaneCoreNodeReachable } from '../../game/systems/arcaneCore'
import type { ArcaneCoreBranchDefinition, ArcaneCoreBranchId, ArcaneCoreNodeDefinition } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

const GRAPH_WIDTH = 860
const GRAPH_HEIGHT = 640
const NODE_WIDTH = 86
const NODE_HEIGHT = 54
const nodeLeft = (node: ArcaneCoreNodeDefinition) => 22 + node.x * 112
const nodeTop = (node: ArcaneCoreNodeDefinition) => 28 + node.y * 76
const nodeCenterX = (node: ArcaneCoreNodeDefinition) => nodeLeft(node) + NODE_WIDTH / 2
const nodeCenterY = (node: ArcaneCoreNodeDefinition) => nodeTop(node) + NODE_HEIGHT / 2
const formatEffect = (node: ArcaneCoreNodeDefinition, rank: number) => `${node.effect.label} +${node.effect.perRank * rank}`

function Wallet({ points, essence }: { points: number; essence: number }) {
  return <div className="arcane-core-wallet" aria-label="Arcane Core wallet">
    <div><span>CORE POINTS</span><strong>{points.toLocaleString()}</strong><small>Boss defeats grant points.</small></div>
    <div><span>ARCANE ESSENCE</span><strong>{essence.toLocaleString()}</strong><small>Monsters and bosses feed the Core.</small></div>
  </div>
}

function BranchCard({ branch, onOpen, state }: { branch: ArcaneCoreBranchDefinition; onOpen: () => void; state: ReturnType<typeof useGameStore.getState>['arcaneCore'] }) {
  const unlocked = branch.nodes.filter((node) => getArcaneCoreNodeProgress(state, node.id).unlocked).length
  const rank = branch.nodes.reduce((sum, node) => sum + getArcaneCoreNodeProgress(state, node.id).rank, 0)
  const active = branch.nodes.find((node) => getArcaneCoreNodeProgress(state, node.id).rank > 0)
  return <button type="button" className="arcane-core-branch-card" style={{ '--branch-accent': branch.accent } as CSSProperties} onClick={onOpen}>
    <span className="arcane-core-branch-mark"><Sparkles size={17} /></span>
    <span className="arcane-core-branch-copy"><span className="eyebrow">{branch.name.toUpperCase()} BRANCH</span><strong>{branch.name}</strong><small>{branch.description}</small></span>
    <span className="arcane-core-branch-progress"><b>{unlocked} / {branch.nodes.length}</b><small>{rank} / {branch.nodes.length * 5} ranks</small><i><em style={{ width: `${(unlocked / branch.nodes.length) * 100}%` }} /></i>{active && <small className="arcane-core-branch-active">{active.effect.label} active</small>}</span>
    <ChevronRight size={17} />
  </button>
}

function PresetPanel({ version, onChange }: { version: number; onChange: () => void }) {
  const presets = useGameStore((state) => state.getArcaneCorePresets())
  const save = useGameStore((state) => state.saveArcaneCorePreset)
  const load = useGameStore((state) => state.loadArcaneCorePreset)
  const rename = useGameStore((state) => state.renameArcaneCorePreset)
  const clear = useGameStore((state) => state.clearArcaneCorePreset)
  const [names, setNames] = useState(['Power route', 'Vitality route', 'Control route'])
  void version
  return <Card title="Session presets" action={<Status tone="neutral">3 slots · runtime only</Status>}>
    <p className="muted">Save experimental Core layouts for this session. Presets never enter the gameplay save.</p>
    <div className="arcane-core-presets">{presets.map((preset, slot) => <div className="arcane-core-preset" key={slot}>
      <div><span>PRESET {slot + 1}</span><input aria-label={`Arcane Core preset ${slot + 1} name`} value={preset?.name ?? names[slot]} onChange={(event) => setNames((current) => current.map((name, index) => index === slot ? event.target.value : name))} onBlur={() => { if (preset) rename(slot, names[slot] || preset.name); onChange() }} /></div>
      <div className="button-row"><Button variant="secondary" onClick={() => { save(slot, names[slot]); onChange() }}><Save size={13} />{preset ? 'Overwrite' : 'Save'}</Button>{preset && <Button variant="ghost" onClick={() => { load(slot); onChange() }}>Load</Button>}{preset && <Button variant="ghost" onClick={() => { clear(slot); onChange() }} ariaLabel={`Clear preset ${slot + 1}`}><X size={13} /></Button>}</div>
    </div>)}</div>
  </Card>
}

function BranchModal({ branch, onClose }: { branch: ArcaneCoreBranchDefinition; onClose: () => void }) {
  const core = useGameStore((state) => state.arcaneCore)
  const unlock = useGameStore((state) => state.unlockArcaneCoreNode)
  const rankUp = useGameStore((state) => state.rankUpArcaneCoreNode)
  const refund = useGameStore((state) => state.refundArcaneCoreNode)
  const resetBranch = useGameStore((state) => state.resetArcaneCoreBranch)
  const maxBranch = useGameStore((state) => state.maxArcaneCoreBranch)
  const [selectedId, setSelectedId] = useState(branch.nodes[0]?.id ?? '')
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const selected = branch.nodes.find((node) => node.id === selectedId) ?? branch.nodes[0]
  const selectedProgress = selected ? getArcaneCoreNodeProgress(core, selected.id) : undefined
  const selectedReachable = selected ? isArcaneCoreNodeReachable(core, selected.id) : false
  const lines = useMemo(() => branch.nodes.flatMap((node) => node.prerequisites.map((parentId) => {
    const parent = branch.nodes.find((candidate) => candidate.id === parentId)
    return parent ? <line key={`${parent.id}-${node.id}`} x1={nodeCenterX(parent)} y1={nodeCenterY(parent)} x2={nodeCenterX(node)} y2={nodeCenterY(node)} /> : null
  })), [branch])
  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    drag.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    setOffset({ x: drag.current.offsetX + event.clientX - drag.current.x, y: drag.current.offsetY + event.clientY - drag.current.y })
  }
  const endDrag = () => { drag.current = null }
  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => { event.preventDefault(); setZoom((current) => Math.max(.5, Math.min(2, current * (event.deltaY > 0 ? .9 : 1.1)))) }
  const totalRanks = branch.nodes.reduce((sum, node) => sum + getArcaneCoreNodeProgress(core, node.id).rank, 0)
  return <ModalPortal open onClose={onClose} backdropClassName="arcane-core-modal-backdrop" surfaceClassName="arcane-core-modal" ariaLabel={`${branch.name} Arcane Core branch`}>
    <div className="arcane-core-modal-head"><div><span className="eyebrow" style={{ color: branch.accent }}>{branch.name.toUpperCase()} BRANCH</span><h2>{branch.name} path</h2><p>{branch.description}</p></div><div className="arcane-core-modal-actions"><Status tone="active">{totalRanks} / {branch.nodes.length * 5} ranks</Status><Button variant="ghost" onClick={onClose} ariaLabel="Close Arcane Core branch"><X size={17} /></Button></div></div>
    <div className="arcane-core-modal-toolbar"><span><Crosshair size={14} /> Drag to pan · wheel to zoom</span><span>Zoom {Math.round(zoom * 100)}%</span><Button variant="ghost" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }) }}><RotateCcw size={13} /> Recenter</Button><Button variant="danger" onClick={() => resetBranch(branch.id)}>Reset branch</Button><Button variant="secondary" onClick={() => maxBranch(branch.id)}>Max reachable</Button></div>
    <div className="arcane-core-modal-body">
      <div className="arcane-core-graph-viewport" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onWheel={handleWheel}>
        <div className="arcane-core-graph" style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT, transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, '--branch-accent': branch.accent } as CSSProperties}>
          <div className="arcane-core-hub"><Sparkles size={15} /><span>CORE HUB</span><small>Four routes · one engine</small></div>
          <svg className="arcane-core-connectors" width={GRAPH_WIDTH} height={GRAPH_HEIGHT} aria-hidden="true">{lines}</svg>
          {branch.nodes.map((node) => {
            const progress = getArcaneCoreNodeProgress(core, node.id)
            const reachable = isArcaneCoreNodeReachable(core, node.id)
            return <GameTooltip key={node.id} block content={`${node.name} · ${progress.unlocked ? `${progress.rank}/${node.maxRank} ranks` : reachable ? 'Ready to unlock' : 'Requires a completed route'} · ${node.effect.label}`}><button type="button" data-node-id={node.id} className={`arcane-core-node ${progress.unlocked ? 'is-unlocked' : ''} ${progress.rank > 0 ? 'is-active' : ''} ${reachable ? 'is-reachable' : ''} ${selectedId === node.id ? 'is-selected' : ''}`} style={{ left: nodeLeft(node), top: nodeTop(node) }} onClick={() => setSelectedId(node.id)}><span>{node.x + 1}.{node.y + 1}</span><strong>{node.effect.label}</strong><small>{progress.unlocked ? `${progress.rank}/${node.maxRank}` : 'LOCKED'}</small></button></GameTooltip>
          })}
        </div>
      </div>
      {selected && selectedProgress && <aside className="arcane-core-node-inspector"><div className="arcane-core-inspector-title"><span className="arcane-core-inspector-glyph" style={{ background: branch.accent }}><Sparkles size={17} /></span><div><span className="eyebrow">NODE {selected.x + 1}.{selected.y + 1}</span><h3>{selected.name}</h3></div></div><p className="muted">{selected.description}</p><div className="arcane-core-inspector-effect"><span>EFFECT AT RANK</span><strong>{formatEffect(selected, Math.max(1, selectedProgress.rank))}</strong><small>{selected.effect.label} · +{selected.effect.perRank} per rank</small></div><div className="arcane-core-inspector-meta"><span>STATUS<strong>{selectedProgress.unlocked ? 'UNLOCKED' : selectedReachable ? 'READY' : 'ROUTE LOCKED'}</strong></span><span>RANK<strong>{selectedProgress.rank} / {selected.maxRank}</strong></span><span>PREREQUISITES<strong>{selected.prerequisites.length ? `${selected.prerequisiteMode.toUpperCase()} · ${selected.prerequisites.length}` : 'STARTER'}</strong></span></div><div className="arcane-core-rank-costs"><span>RANK ESSENCE COSTS</span><b>{ARCANE_CORE_RANK_COSTS.map((cost, index) => <i className={index < selectedProgress.rank ? 'is-paid' : ''} key={cost}>{cost}</i>)}</b></div><div className="arcane-core-inspector-actions"><Button variant="primary" onClick={() => unlock(selected.id)} disabled={selectedProgress.unlocked || !selectedReachable}>Unlock · {ARCANE_CORE_NODE_UNLOCK_COST} Core</Button><Button variant="secondary" onClick={() => rankUp(selected.id)} disabled={!selectedProgress.unlocked || selectedProgress.rank >= selected.maxRank}>+1 Rank · {selectedProgress.rank < selected.maxRank ? ARCANE_CORE_RANK_COSTS[selectedProgress.rank] : 0} Essence</Button><Button variant="ghost" onClick={() => refund(selected.id)} disabled={!selectedProgress.unlocked}>Refund node + descendants</Button></div></aside>}
    </div>
  </ModalPortal>
}

export function ArcaneCoreScreen() {
  const core = useGameStore((state) => state.arcaneCore)
  const [branchId, setBranchId] = useState<ArcaneCoreBranchId | null>(null)
  const [presetVersion, setPresetVersion] = useState(0)
  const activeBranch = branchId ? ARCANE_CORE_BRANCHES.find((branch) => branch.id === branchId) : null
  const modifiers = getArcaneCoreModifierTotals(core)
  const totalNodes = Object.values(core.nodes).filter((node) => node.unlocked).length
  const totalRanks = Object.values(core.nodes).reduce((sum, node) => sum + node.rank, 0)
  return <div className="screen-content arcane-core-screen">
    <div className="screen-header"><div><div className="eyebrow">HERO · PERMANENT PROGRESSION</div><h1>Arcane Core</h1><p>Shape the permanent engine beneath the wizard. Every boss defeat opens another route through the Core.</p></div><Status tone="active">{totalNodes} nodes online</Status></div>
    <ScreenGrid screen="arcane-core" panels={[{ id: 'arcane-core-overview', content: <div className="arcane-core-overview-stack"><Card title="Core reserves" action={<span className="arcane-core-total-rank">{totalRanks} ranks active</span>}><Wallet points={core.corePoints} essence={core.arcaneEssence} /></Card><div className="arcane-core-branch-grid">{ARCANE_CORE_BRANCHES.map((branch) => <BranchCard key={branch.id} branch={branch} state={core} onOpen={() => setBranchId(branch.id)} />)}</div><Card title="Active resonance" action={<Status tone="success">Derived from equipped stats</Status>}><div className="arcane-core-resonance">{Object.entries(modifiers).length ? Object.entries(modifiers).map(([key, value]) => <span key={key}><small>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).toUpperCase()}</small><strong>+{Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 })}</strong></span>) : <p className="muted">Unlock and rank nodes to bring permanent modifiers online.</p>}</div></Card><PresetPanel version={presetVersion} onChange={() => setPresetVersion((version) => version + 1)} /></div> }]} />
    {activeBranch && <BranchModal branch={activeBranch} onClose={() => setBranchId(null)} />}
  </div>
}
