import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { CombatMapConnection } from './combatNavigationTypes'

export interface CombatMapCanvasNode {
  id: string
  name: string
  subtitle: string
  description: string
  x: number
  y: number
  status: string
  unlockText: string | null
}

interface MapViewportSize {
  width: number
  height: number
}

interface MapPanBounds {
  x: { min: number; max: number }
  y: { min: number; max: number }
}

const getNodeWidth = (viewportWidth: number) => viewportWidth > 0 ? Math.min(158, Math.max(96, viewportWidth * 0.22)) : 158
const getNodeHeight = (viewportWidth: number) => viewportWidth > 0 && viewportWidth <= 480 ? 105 : 115

const getPanBounds = (nodes: CombatMapCanvasNode[], viewport: MapViewportSize): MapPanBounds => {
  if (!nodes.length || viewport.width <= 0 || viewport.height <= 0) return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }
  const halfNodeWidth = getNodeWidth(viewport.width) / 2
  const halfNodeHeight = getNodeHeight(viewport.width) / 2
  const bounds = nodes.reduce((current, node) => ({
    minX: Math.min(current.minX, viewport.width * node.x / 100 - halfNodeWidth),
    maxX: Math.max(current.maxX, viewport.width * node.x / 100 + halfNodeWidth),
    minY: Math.min(current.minY, viewport.height * node.y / 100 - halfNodeHeight),
    maxY: Math.max(current.maxY, viewport.height * node.y / 100 + halfNodeHeight),
  }), { minX: Number.POSITIVE_INFINITY, maxX: Number.NEGATIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxY: Number.NEGATIVE_INFINITY })
  const horizontalSlack = Math.max(0, viewport.width - (bounds.maxX - bounds.minX))
  const verticalSlack = Math.max(0, viewport.height - (bounds.maxY - bounds.minY))
  const horizontalAllowance = Math.min(horizontalSlack / 2, viewport.width * 0.08)
  const verticalAllowance = Math.min(verticalSlack / 2, viewport.height * 0.08)
  const clampAxis = (allowance: number, minVisible: number, maxVisible: number) => ({
    min: Math.max(-allowance, -minVisible),
    max: Math.min(allowance, viewport.width - maxVisible),
  })
  const x = clampAxis(horizontalAllowance, bounds.minX, bounds.maxX)
  const y = {
    min: Math.max(-verticalAllowance, -bounds.minY),
    max: Math.min(verticalAllowance, viewport.height - bounds.maxY),
  }
  return { x: x.min <= x.max ? x : { min: 0, max: 0 }, y: y.min <= y.max ? y : { min: 0, max: 0 } }
}

export function CombatMapCanvas({ nodes, connections, selectedId, onSelect, mapLabel }: { nodes: CombatMapCanvasNode[]; connections: CombatMapConnection[]; selectedId: string; onSelect: (id: string) => void; mapLabel: string }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [viewport, setViewport] = useState<MapViewportSize>({ width: 0, height: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const panBounds = useMemo(() => getPanBounds(nodes, viewport), [nodes, viewport])

  useEffect(() => {
    setPan({ x: 0, y: 0 })
  }, [mapLabel])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setViewport((current) => current.width === width && current.height === height ? current : { width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setPan((current) => {
      const next = { x: Math.max(panBounds.x.min, Math.min(panBounds.x.max, current.x)), y: Math.max(panBounds.y.min, Math.min(panBounds.y.max, current.y)) }
      return next.x === current.x && next.y === current.y ? current : next
    })
  }, [panBounds])

  const clampPan = (value: number, axis: 'x' | 'y') => Math.max(panBounds[axis].min, Math.min(panBounds[axis].max, value))
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if ((event.target as HTMLElement).closest('.combat-map-node')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y }
  }
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return
    setDragging(true)
    setPan({ x: clampPan(drag.originX + deltaX, 'x'), y: clampPan(drag.originY + deltaY, 'y') })
  }
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  return <div ref={viewportRef} className={`combat-map-viewport${dragging ? ' is-dragging' : ''}`} aria-label={mapLabel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp} onDragStart={(event) => event.preventDefault()} style={{ '--combat-map-node-width': `${getNodeWidth(viewport.width)}px` } as CSSProperties}>
    <div className="combat-map-grid-lines" aria-hidden="true" />
    <div className="combat-map-orbit combat-map-orbit-one" aria-hidden="true" />
    <div className="combat-map-orbit combat-map-orbit-two" aria-hidden="true" />
    <div className="combat-map-stage" style={{ '--map-pan-x': `${pan.x}px`, '--map-pan-y': `${pan.y}px` } as CSSProperties}>
      <svg className="combat-map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        {connections.map((connection) => {
          const from = nodeById.get(connection.from)
          const to = nodeById.get(connection.to)
          if (!from || !to) return null
          const active = from.status !== 'locked' && to.status !== 'locked'
          return <line key={`${connection.from}-${connection.to}`} className={active ? 'is-active' : ''} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
        })}
      </svg>
      {nodes.map((node) => {
        const selected = node.id === selectedId
        const tooltipDescription = node.status === 'locked' && node.unlockText ? `${node.unlockText}. ${node.description}` : `${node.subtitle}. ${node.description}`
        return <GameTooltip key={node.id} block content={<TooltipContent title={node.name} description={tooltipDescription} />} accent={node.status === 'locked' ? 'neutral' : 'mana'}><button type="button" data-ui-sound="click" className={`combat-map-node is-${node.status}${selected ? ' is-selected' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%` }} onClick={(event) => { event.stopPropagation(); onSelect(node.id) }} aria-pressed={selected} aria-label={`${node.name}, ${node.status}`}><span className="combat-map-node-halo" aria-hidden="true" /><span className="combat-map-node-core"><span className="combat-map-node-glyph" aria-hidden="true">{node.status === 'locked' ? '×' : node.status === 'completed' ? '✓' : node.status === 'boss-ready' ? '♛' : '✦'}</span></span><span className="combat-map-node-copy"><strong>{node.name}</strong><small>{node.status === 'locked' ? 'LOCKED' : node.status === 'boss-ready' ? 'BOSS READY' : node.status === 'completed' ? 'CLEARED' : node.status === 'active' ? 'ACTIVE ROUTE' : 'AVAILABLE'}</small></span></button></GameTooltip>
      })}
    </div>
    <div className="combat-map-pan-hint" aria-hidden="true">DRAG TO PAN <span>·</span> SELECT A NODE</div>
  </div>
}
