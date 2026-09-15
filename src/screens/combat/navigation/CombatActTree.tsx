import { Crown, Leaf, PawPrint, Skull, Sparkles } from 'lucide-react'
import { memo, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'
import { CombatProgressionViewport, type ProgressionBounds } from './CombatProgressionViewport'
import type { CombatActNodeViewModel, CombatActViewModel } from './combatActNavigationTypes'

const nodeBounds = { width: 190, height: 170 }

const getNodeDimensions = (node: CombatActNodeViewModel) => node.kind === 'final' ? { width: 240, height: 198 } : node.kind === 'branch' ? { width: 190, height: 158 } : nodeBounds
const getNodeSquareSize = (node: CombatActNodeViewModel) => node.kind === 'final' ? 72 : node.kind === 'branch' ? 48 : 58

const getContentBounds = (act: CombatActViewModel): ProgressionBounds => {
  const left = Math.min(...act.nodes.map((node) => node.x - getNodeDimensions(node).width / 2 - 24))
  const right = Math.max(...act.nodes.map((node) => node.x + getNodeDimensions(node).width / 2 + 24))
  const top = Math.min(...act.nodes.map((node) => node.y - getNodeDimensions(node).height / 2 - 24))
  const bottom = Math.max(...act.nodes.map((node) => node.y + getNodeDimensions(node).height / 2 + 24))
  return { left: Math.max(0, left), right: Math.min(act.definition.stage.width, right), top: Math.max(0, top), bottom: Math.min(act.definition.stage.height, bottom) }
}

const getNodeAccent = (node: CombatActNodeViewModel) => node.state === 'locked' ? 'var(--ui-text-disabled)' : node.state === 'completed' ? 'color-mix(in srgb, var(--ui-success) 68%, var(--ui-accent))' : node.state === 'boss-ready' || node.kind === 'final' ? 'var(--ui-gold)' : node.prototype ? 'var(--ui-secondary)' : node.state === 'active' ? 'var(--ui-secondary)' : 'var(--ui-accent)'
const getNodeIcon = (node: CombatActNodeViewModel) => node.prototype ? Sparkles : node.kind === 'final' ? Crown : node.dungeonId === 'whispering-woods' ? Leaf : node.dungeonId === 'howling-den' ? PawPrint : Skull

type NodeAnchorSide = 'left' | 'right' | 'top' | 'bottom'

const getNodeAnchor = (node: CombatActNodeViewModel, side: NodeAnchorSide) => {
  const half = getNodeSquareSize(node) / 2
  if (side === 'left') return { x: node.x - half, y: node.y }
  if (side === 'right') return { x: node.x + half, y: node.y }
  if (side === 'top') return { x: node.x, y: node.y - half }
  return { x: node.x, y: node.y + half }
}

const getConnectionPath = (from: CombatActNodeViewModel, to: CombatActNodeViewModel) => {
  const fromSide: NodeAnchorSide = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) ? (to.x >= from.x ? 'right' : 'left') : (to.y >= from.y ? 'bottom' : 'top')
  const toSide: NodeAnchorSide = fromSide === 'right' ? 'left' : fromSide === 'left' ? 'right' : fromSide === 'bottom' ? 'top' : 'bottom'
  const start = getNodeAnchor(from, fromSide)
  const end = getNodeAnchor(to, toSide)
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

interface ConnectionGeometry {
  id: string
  fromId: string
  toId: string
  kind: 'main' | 'branch'
  path: string
  locked: boolean
  completed: boolean
  finalApproach: boolean
}

interface BranchRailGeometry {
  id: string
  path: string
  nodeIds: string[]
  junctions: Array<{ x: number; y: number }>
  locked: boolean
  completed: boolean
}

export function CombatActTree({ act, selectedNodeId, onSelect, onEnter }: { act: CombatActViewModel; selectedNodeId: string; onSelect: (id: string) => void; onEnter: (id: string) => boolean }) {
  const nodeById = useMemo(() => new Map(act.nodes.map((node) => [node.id, node])), [act.nodes])
  const connectionGeometry = useMemo<ConnectionGeometry[]>(() => act.connections.flatMap((connection) => {
    const from = nodeById.get(connection.from)
    const to = nodeById.get(connection.to)
    if (!from || !to) return []
    const kind = connection.kind ?? 'main'
    return [{
      id: `${connection.from}-${connection.to}`,
      fromId: connection.from,
      toId: connection.to,
      kind,
      path: getConnectionPath(from, to),
      locked: from.state === 'locked' || to.state === 'locked',
      completed: from.state === 'completed' && to.state === 'completed',
      finalApproach: to.kind === 'final',
    }]
  }), [act.connections, nodeById])
  const branchRailGeometry = useMemo<BranchRailGeometry[]>(() => (act.definition.branchRails ?? []).map((rail) => {
    const paths = [`M ${rail.x} ${rail.y1} L ${rail.x} ${rail.y2}`]
    const junctions: Array<{ x: number; y: number }> = []
    const nodeIds = [...(rail.anchor ? [rail.anchor.nodeId] : []), ...rail.stubs.map((stub) => stub.nodeId)]
    const branchNodes = rail.stubs.map((stub) => nodeById.get(stub.nodeId)).filter((node): node is CombatActNodeViewModel => Boolean(node))
    if (rail.anchor) {
      const anchorNode = nodeById.get(rail.anchor.nodeId)
      if (anchorNode) {
        const start = getNodeAnchor(anchorNode, 'right')
        paths.push(`M ${start.x} ${rail.anchor.y} L ${rail.x} ${rail.anchor.y}`)
        junctions.push({ x: rail.x, y: rail.anchor.y })
      }
    }
    rail.stubs.forEach((stub) => {
      const node = nodeById.get(stub.nodeId)
      if (!node) return
      const end = getNodeAnchor(node, 'left')
      paths.push(`M ${rail.x} ${stub.y} L ${end.x} ${stub.y}`)
      junctions.push({ x: rail.x, y: stub.y })
    })
    return { id: rail.id, path: paths.join(' '), nodeIds, junctions, locked: branchNodes.length > 0 && branchNodes.every((node) => node.state === 'locked'), completed: branchNodes.length > 0 && branchNodes.every((node) => node.state === 'completed') }
  }), [act.definition.branchRails, nodeById])
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  return <CombatProgressionViewport stage={act.definition.stage} contentBounds={getContentBounds(act)} resetKey={act.id} ariaLabel={`${act.label} ${act.title} progression tree`}>
    <svg className="combat-progression-connections" viewBox={`0 0 ${act.definition.stage.width} ${act.definition.stage.height}`} aria-hidden="true" focusable="false">
      {connectionGeometry.map((connection) => {
        const selectedPath = selectedNodeId === connection.fromId || selectedNodeId === connection.toId
        const hoveredPath = hoveredNodeId === connection.fromId || hoveredNodeId === connection.toId
        const stateClass = `${selectedPath ? ' is-selected' : ''}${hoveredPath ? ' is-hovered' : ''}`
        return <g key={connection.id}>
          <path className={`combat-progression-connection-underlay is-${connection.kind}${connection.locked ? ' is-locked' : ''}${connection.completed ? ' is-completed' : ''}${connection.finalApproach ? ' is-final-approach' : ''}${stateClass}`} d={connection.path} />
          <path className={`combat-progression-connection is-${connection.kind}${connection.locked ? ' is-locked' : ''}${connection.completed ? ' is-completed' : ''}${connection.finalApproach ? ' is-final-approach' : ''}${stateClass}`} d={connection.path} />
          {selectedPath && <path key={`${connection.id}-${selectedNodeId}`} className={`combat-progression-connection-sweep is-${connection.kind}`} pathLength={1} d={connection.path} />}
        </g>
      })}
      {branchRailGeometry.map((rail) => {
        const selectedRail = rail.nodeIds.includes(selectedNodeId)
        const hoveredRail = hoveredNodeId !== null && rail.nodeIds.includes(hoveredNodeId)
        const stateClass = `${selectedRail ? ' is-selected' : ''}${hoveredRail ? ' is-hovered' : ''}`
        return <g key={rail.id}>
          <path className={`combat-progression-connection-underlay is-branch${rail.locked ? ' is-locked' : ''}${rail.completed ? ' is-completed' : ''}${stateClass}`} d={rail.path} />
          <path className={`combat-progression-connection is-branch${rail.locked ? ' is-locked' : ''}${rail.completed ? ' is-completed' : ''}${stateClass}`} d={rail.path} />
          {selectedRail && <path className="combat-progression-connection-sweep is-branch" pathLength={1} d={rail.path} />}
        </g>
      })}
    </svg>
    {branchRailGeometry.flatMap((rail) => rail.junctions.map((junction, index) => <span key={`${rail.id}-junction-${index}`} className="combat-progression-junction" style={{ left: `${junction.x}px`, top: `${junction.y}px` }} aria-hidden="true" />))}
    {act.chapters.map((chapter) => <div key={chapter.id} className="combat-progression-chapter" style={{ left: `${chapter.startX}px`, width: `${chapter.endX - chapter.startX}px` }}><span>{chapter.label}</span><i aria-hidden="true" /></div>)}
    {act.nodes.map((node) => <CombatActNode key={node.id} node={node} selected={node.id === selectedNodeId} onSelect={onSelect} onEnter={onEnter} onHover={setHoveredNodeId} />)}
  </CombatProgressionViewport>
}

const CombatActNode = memo(function CombatActNode({ node, selected, onSelect, onEnter, onHover }: { node: CombatActNodeViewModel; selected: boolean; onSelect: (id: string) => void; onEnter: (id: string) => boolean; onHover: (id: string | null) => void }) {
  const Icon = getNodeIcon(node)
  const bossLabel = node.boss?.known ? node.boss.name : node.boss ? 'UNKNOWN BOSS' : 'NO BOSS DATA'
  const nodeStateLabel = node.kind === 'final' ? 'ACT BOSS' : node.prototype ? node.statusLabel : node.statusLabel
  const tooltipDescription = node.prototype ? `${node.statusLabel}. ${node.tierLabel}. ${node.description}${node.unlockText ? ` ${node.unlockText}` : ''} Click to inspect.` : `${node.statusLabel}. ${node.tierLabel}. Boss: ${bossLabel}.${node.unlockText ? ` Unlock: ${node.unlockText}.` : ''} Click to inspect. Double-click to enter.`
  const handleDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>) => { event.preventDefault(); const entered = onEnter(node.id); if (entered) emitGameFeelEvent({ type: 'success', x: event.clientX, y: event.clientY, color: getNodeAccent(node), intensity: 1.05 }) }

  return <GameTooltip block accent={node.state === 'locked' ? 'neutral' : node.prototype ? 'mana' : 'success'} content={<TooltipContent title={node.name} description={tooltipDescription} />}>
    <button type="button" data-combat-progression-interactive="true" data-ui-sound="click" draggable={false} className={`combat-progression-node is-${node.state} is-${node.kind}${selected ? ' is-selected' : ''}`} style={{ left: `${node.x}px`, top: `${node.y}px`, '--node-accent': getNodeAccent(node) } as CSSProperties} aria-pressed={selected} aria-label={`${node.name}, ${nodeStateLabel}`} onClick={() => onSelect(node.id)} onMouseEnter={() => onHover(node.id)} onMouseLeave={() => onHover(null)} onDoubleClick={handleDoubleClick} onDragStart={(event) => event.preventDefault()}>
      <span className="combat-progression-node-core"><Icon size={node.kind === 'final' ? 21 : 18} strokeWidth={1.25} aria-hidden="true" /></span>
      <span className="combat-progression-node-copy"><strong>{node.name}</strong><em>{nodeStateLabel}</em></span>
    </button>
  </GameTooltip>
})
