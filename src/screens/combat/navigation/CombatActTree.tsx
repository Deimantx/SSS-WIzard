import { Crown, Leaf, PawPrint, Skull, Sparkles } from 'lucide-react'
import { memo, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'
import { CombatProgressionViewport, type ProgressionBounds } from './CombatProgressionViewport'
import type { CombatActNodeViewModel, CombatActRouteSegment, CombatActViewModel } from './combatActNavigationTypes'

const nodeBounds = { width: 190, height: 170 }

const getNodeDimensions = (node: CombatActNodeViewModel) => node.kind === 'final' ? { width: 240, height: 198 } : node.kind === 'branch' ? { width: 190, height: 158 } : nodeBounds

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

const getNodeCardAnchor = (node: CombatActNodeViewModel, side: NodeAnchorSide) => {
  const { width, height } = getNodeDimensions(node)
  if (side === 'left') return { x: node.x - width / 2, y: node.y }
  if (side === 'right') return { x: node.x + width / 2, y: node.y }
  if (side === 'top') return { x: node.x, y: node.y - height / 2 }
  return { x: node.x, y: node.y + height / 2 }
}

const getConnectionEndpoints = (from: CombatActNodeViewModel, to: CombatActNodeViewModel) => {
  const fromSide: NodeAnchorSide = Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) ? (to.x >= from.x ? 'right' : 'left') : (to.y >= from.y ? 'bottom' : 'top')
  const toSide: NodeAnchorSide = fromSide === 'right' ? 'left' : fromSide === 'left' ? 'right' : fromSide === 'bottom' ? 'top' : 'bottom'
  return { start: getNodeCardAnchor(from, fromSide), end: getNodeCardAnchor(to, toSide) }
}

const getConnectionPath = (from: CombatActNodeViewModel, to: CombatActNodeViewModel) => {
  const { start, end } = getConnectionEndpoints(from, to)
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

const getRouteSegmentPath = (segment: CombatActRouteSegment) => `M ${segment.x1} ${segment.y1} L ${segment.x2} ${segment.y2}`

interface RouteGeometry {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  nodeIds: string[]
  kind: 'main' | 'branch'
  path: string
  locked: boolean
  completed: boolean
  finalApproach: boolean
}

const getRouteJunctions = (routes: RouteGeometry[]) => {
  const junctions = new Map<string, { x: number; y: number }>()
  const addJunction = (x: number, y: number) => junctions.set(`${x}:${y}`, { x, y })
  const mainHorizontalY = routes.find((route) => route.kind === 'main' && route.y1 === route.y2 && route.x1 !== route.x2)?.y1

  routes.forEach((route) => {
    if (route.kind !== 'branch') return
    if (route.x1 === route.x2) {
      addJunction(route.x1, route.y1)
      addJunction(route.x2, route.y2)
      if (mainHorizontalY !== undefined && Math.min(route.y1, route.y2) <= mainHorizontalY && mainHorizontalY <= Math.max(route.y1, route.y2)) addJunction(route.x1, mainHorizontalY)
    } else if (route.y1 === route.y2) {
      addJunction(route.x1, route.y1)
    }
  })

  return [...junctions.values()]
}

export function CombatActTree({ act, selectedNodeId, onSelect, onEnter }: { act: CombatActViewModel; selectedNodeId: string; onSelect: (id: string) => void; onEnter: (id: string) => boolean }) {
  const nodeById = useMemo(() => new Map(act.nodes.map((node) => [node.id, node])), [act.nodes])
  const routeGeometry = useMemo<RouteGeometry[]>(() => {
    const getState = (nodeIds: string[]) => {
      const relatedNodes = nodeIds.map((nodeId) => nodeById.get(nodeId)).filter((node): node is CombatActNodeViewModel => Boolean(node))
      return {
        locked: relatedNodes.length > 0 && relatedNodes.every((node) => node.state === 'locked'),
        completed: relatedNodes.length > 0 && relatedNodes.every((node) => node.state === 'completed'),
      }
    }

    if (act.definition.routeSegments?.length) return act.definition.routeSegments.map((segment) => {
      const nodeIds = [...(segment.nodeIds ?? [])]
      const state = getState(nodeIds)
      return { id: segment.id, x1: segment.x1, y1: segment.y1, x2: segment.x2, y2: segment.y2, nodeIds, kind: segment.kind, path: getRouteSegmentPath(segment), ...state, finalApproach: false }
    })

    return act.connections.flatMap((connection) => {
      const from = nodeById.get(connection.from)
      const to = nodeById.get(connection.to)
      if (!from || !to) return []
      const nodeIds = [connection.from, connection.to]
      const state = getState(nodeIds)
      const { start, end } = getConnectionEndpoints(from, to)
      return [{ id: `${connection.from}-${connection.to}`, x1: start.x, y1: start.y, x2: end.x, y2: end.y, nodeIds, kind: connection.kind ?? 'main', path: getConnectionPath(from, to), ...state, finalApproach: to.kind === 'final' }]
    })
  }, [act.connections, act.definition.routeSegments, nodeById])
  const routeJunctions = useMemo(() => getRouteJunctions(routeGeometry), [routeGeometry])
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  return <CombatProgressionViewport stage={act.definition.stage} contentBounds={getContentBounds(act)} resetKey={act.id} ariaLabel={`${act.label} ${act.title} progression tree`}>
    <svg className="combat-progression-connections" viewBox={`0 0 ${act.definition.stage.width} ${act.definition.stage.height}`} aria-hidden="true" focusable="false">
      {routeGeometry.map((route) => {
        const selectedPath = route.nodeIds.includes(selectedNodeId)
        const hoveredPath = hoveredNodeId !== null && route.nodeIds.includes(hoveredNodeId)
        const stateClass = `${selectedPath ? ' is-selected' : ''}${hoveredPath ? ' is-hovered' : ''}`
        return <g key={route.id}>
          <path className={`combat-progression-connection-underlay is-${route.kind}${route.locked ? ' is-locked' : ''}${route.completed ? ' is-completed' : ''}${route.finalApproach ? ' is-final-approach' : ''}${stateClass}`} d={route.path} />
          <path className={`combat-progression-connection is-${route.kind}${route.locked ? ' is-locked' : ''}${route.completed ? ' is-completed' : ''}${route.finalApproach ? ' is-final-approach' : ''}${stateClass}`} d={route.path} />
          {selectedPath && <path key={`${route.id}-${selectedNodeId}`} className={`combat-progression-connection-sweep is-${route.kind}`} pathLength={1} d={route.path} />}
        </g>
      })}
    </svg>
    {routeJunctions.map((junction) => <span key={`${junction.x}:${junction.y}`} className="combat-progression-junction" style={{ left: `${junction.x}px`, top: `${junction.y}px` }} aria-hidden="true" />)}
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
