import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
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

export function CombatMapCanvas({ nodes, connections, selectedId, onSelect, mapLabel }: { nodes: CombatMapCanvasNode[]; connections: CombatMapConnection[]; selectedId: string; onSelect: (id: string) => void; mapLabel: string }) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  useEffect(() => {
    setPan({ x: 0, y: 0 })
  }, [mapLabel])

  const clampPan = (value: number) => Math.max(-130, Math.min(130, value))
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if ((event.target as HTMLElement).closest('.combat-map-node')) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y }
    setDragging(true)
  }
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setPan({ x: clampPan(drag.originX + event.clientX - drag.startX), y: clampPan(drag.originY + event.clientY - drag.startY) })
  }
  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setDragging(false)
  }

  return <div className={`combat-map-viewport${dragging ? ' is-dragging' : ''}`} aria-label={mapLabel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
    <div className="combat-map-grid-lines" aria-hidden="true" />
    <div className="combat-map-orbit combat-map-orbit-one" aria-hidden="true" />
    <div className="combat-map-orbit combat-map-orbit-two" aria-hidden="true" />
    <div className="combat-map-stage" style={{ '--map-pan-x': `${pan.x}px`, '--map-pan-y': `${pan.y}px` } as CSSProperties}>
      <svg className="combat-map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
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
