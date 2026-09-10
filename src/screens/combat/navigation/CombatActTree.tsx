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

const getNodeAccent = (node: CombatActNodeViewModel) => node.state === 'locked' ? 'var(--ui-text-disabled)' : node.state === 'completed' ? 'color-mix(in srgb, var(--ui-success) 68%, var(--ui-accent))' : node.state === 'boss-ready' || node.kind === 'final' ? 'var(--ui-gold)' : node.state === 'prototype' ? 'var(--ui-secondary)' : node.state === 'active' ? 'var(--ui-secondary)' : 'var(--ui-accent)'
const getNodeIcon = (node: CombatActNodeViewModel) => node.state === 'prototype' ? Sparkles : node.kind === 'final' ? Crown : node.dungeonId === 'whispering-woods' ? Leaf : node.dungeonId === 'howling-den' ? PawPrint : Skull

type NodeAnchorSide = 'left' | 'right' | 'top' | 'bottom'

const getNodeAnchor = (node: CombatActNodeViewModel, side: NodeAnchorSide) => {
  const half = getNodeSquareSize(node) / 2
  if (side === 'left') return { x: node.x - half, y: node.y }
  if (side === 'right') return { x: node.x + half, y: node.y }
  if (side === 'top') return { x: node.x, y: node.y - half }
  return { x: node.x, y: node.y + half }
}

const getConnectionPath = (from: CombatActNodeViewModel, to: CombatActNodeViewModel) => {
  const deltaX = to.x - from.x
  const deltaY = to.y - from.y
  const vertical = Math.abs(deltaY) > Math.abs(deltaX) * .8
  const fromSide: NodeAnchorSide = vertical ? (deltaY >= 0 ? 'bottom' : 'top') : (deltaX >= 0 ? 'right' : 'left')
  const toSide: NodeAnchorSide = vertical ? (deltaY >= 0 ? 'top' : 'bottom') : (deltaX >= 0 ? 'left' : 'right')
  const start = getNodeAnchor(from, fromSide)
  const end = getNodeAnchor(to, toSide)

  if (vertical) {
    const direction = end.y >= start.y ? 1 : -1
    const bend = Math.max(34, Math.abs(end.y - start.y) * .34)
    return `M ${start.x} ${start.y} C ${start.x} ${start.y + direction * bend}, ${end.x} ${end.y - direction * bend}, ${end.x} ${end.y}`
  }

  const direction = end.x >= start.x ? 1 : -1
  const bend = Math.max(34, Math.abs(end.x - start.x) * .42)
  return `M ${start.x} ${start.y} C ${start.x + direction * bend} ${start.y}, ${end.x - direction * bend} ${end.y}, ${end.x} ${end.y}`
}

interface ConnectionGeometry {
  id: string
  fromId: string
  toId: string
  kind: 'main' | 'branch'
  path: string
  fromAnchor: { x: number; y: number }
  locked: boolean
  completed: boolean
  finalApproach: boolean
}

export function CombatActTree({ act, selectedNodeId, onSelect, onEnter }: { act: CombatActViewModel; selectedNodeId: string; onSelect: (id: string) => void; onEnter: (id: string) => boolean }) {
  const nodeById = useMemo(() => new Map(act.nodes.map((node) => [node.id, node])), [act.nodes])
  const connectionGeometry = useMemo<ConnectionGeometry[]>(() => act.connections.flatMap((connection) => {
    const from = nodeById.get(connection.from)
    const to = nodeById.get(connection.to)
    if (!from || !to) return []
    const kind = connection.kind ?? 'main'
    const vertical = Math.abs(to.y - from.y) > Math.abs(to.x - from.x) * .8
    const fromSide: NodeAnchorSide = vertical ? (to.y >= from.y ? 'bottom' : 'top') : (to.x >= from.x ? 'right' : 'left')
    return [{
      id: `${connection.from}-${connection.to}`,
      fromId: connection.from,
      toId: connection.to,
      kind,
      path: getConnectionPath(from, to),
      fromAnchor: getNodeAnchor(from, fromSide),
      locked: from.state === 'locked' || to.state === 'locked',
      completed: from.state === 'completed' && to.state === 'completed',
      finalApproach: to.kind === 'final',
    }]
  }), [act.connections, nodeById])
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
    </svg>
    {connectionGeometry.filter((connection) => connection.kind === 'branch').map((connection) => <span key={`${connection.id}-junction`} className="combat-progression-junction" style={{ left: `${connection.fromAnchor.x}px`, top: `${connection.fromAnchor.y}px` }} aria-hidden="true" />)}
    {act.chapters.map((chapter) => <div key={chapter.id} className="combat-progression-chapter" style={{ left: `${chapter.startX}px`, width: `${chapter.endX - chapter.startX}px` }}><span>{chapter.label}</span><i aria-hidden="true" /></div>)}
    {act.nodes.map((node) => <CombatActNode key={node.id} node={node} selected={node.id === selectedNodeId} onSelect={onSelect} onEnter={onEnter} onHover={setHoveredNodeId} />)}
  </CombatProgressionViewport>
}

const CombatActNode = memo(function CombatActNode({ node, selected, onSelect, onEnter, onHover }: { node: CombatActNodeViewModel; selected: boolean; onSelect: (id: string) => void; onEnter: (id: string) => boolean; onHover: (id: string | null) => void }) {
  const Icon = getNodeIcon(node)
  const bossLabel = node.boss?.known ? node.boss.name : node.boss ? 'UNKNOWN BOSS' : 'NO BOSS DATA'
  const nodeStateLabel = node.kind === 'final' ? 'ACT BOSS' : node.state === 'prototype' ? 'PROTOTYPE' : node.statusLabel
  const tooltipDescription = node.state === 'prototype' ? `${node.tierLabel}. ${node.description} Click to inspect.` : `${node.statusLabel}. ${node.tierLabel}. Boss: ${bossLabel}.${node.unlockText ? ` Unlock: ${node.unlockText}.` : ''} Click to inspect. Double-click to enter.`
  const handleDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>) => { event.preventDefault(); const entered = onEnter(node.id); if (entered) emitGameFeelEvent({ type: 'success', x: event.clientX, y: event.clientY, color: getNodeAccent(node), intensity: 1.05 }) }

  return <GameTooltip block accent={node.state === 'locked' ? 'neutral' : node.state === 'prototype' ? 'mana' : 'success'} content={<TooltipContent title={node.name} description={tooltipDescription} />}>
    <button type="button" data-combat-progression-interactive="true" data-ui-sound="click" draggable={false} className={`combat-progression-node is-${node.state} is-${node.kind}${selected ? ' is-selected' : ''}`} style={{ left: `${node.x}px`, top: `${node.y}px`, '--node-accent': getNodeAccent(node) } as CSSProperties} aria-pressed={selected} aria-label={`${node.name}, ${nodeStateLabel}`} onClick={() => onSelect(node.id)} onMouseEnter={() => onHover(node.id)} onMouseLeave={() => onHover(null)} onDoubleClick={handleDoubleClick} onDragStart={(event) => event.preventDefault()}>
      <span className="combat-progression-node-core"><Icon size={node.kind === 'final' ? 21 : 18} strokeWidth={1.25} aria-hidden="true" /></span>
      <span className="combat-progression-node-copy"><strong>{node.name}</strong><em>{nodeStateLabel}</em></span>
    </button>
  </GameTooltip>
})
