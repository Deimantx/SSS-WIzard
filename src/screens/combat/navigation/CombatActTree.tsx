import { Crown, Leaf, PawPrint, Skull, Sparkles } from 'lucide-react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'
import { CombatProgressionViewport, type ProgressionBounds } from './CombatProgressionViewport'
import type { CombatActNodeViewModel, CombatActViewModel } from './combatActNavigationTypes'

const nodeBounds = { width: 190, height: 104 }
const getContentBounds = (act: CombatActViewModel): ProgressionBounds => {
  const xs = act.nodes.map((node) => node.x)
  const ys = act.nodes.map((node) => node.y)
  return { left: Math.max(0, Math.min(...xs) - nodeBounds.width / 2 - 24), right: Math.min(act.definition.stage.width, Math.max(...xs) + nodeBounds.width / 2 + 24), top: Math.max(0, Math.min(...ys) - nodeBounds.height / 2 - 24), bottom: Math.min(act.definition.stage.height, Math.max(...ys) + nodeBounds.height / 2 + 24) }
}

const getNodeAccent = (node: CombatActNodeViewModel) => node.state === 'locked' ? 'var(--ui-text-disabled)' : node.state === 'completed' ? 'var(--ui-success)' : node.state === 'boss-ready' || node.kind === 'final' ? 'var(--ui-gold)' : node.state === 'prototype' ? 'var(--ui-secondary)' : 'var(--ui-accent)'
const getNodeIcon = (node: CombatActNodeViewModel) => node.state === 'prototype' ? Sparkles : node.kind === 'final' ? Crown : node.dungeonId === 'whispering-woods' ? Leaf : node.dungeonId === 'howling-den' ? PawPrint : Skull
const getConnectionPath = (from: CombatActNodeViewModel, to: CombatActNodeViewModel) => {
  const vertical = Math.abs(to.x - from.x) < 150
  if (vertical) {
    const direction = to.y >= from.y ? 1 : -1
    const startY = from.y + direction * (nodeBounds.height / 2 - 8)
    const endY = to.y - direction * (nodeBounds.height / 2 - 8)
    return `M ${from.x} ${startY} C ${from.x} ${startY + direction * 58}, ${to.x} ${endY - direction * 58}, ${to.x} ${endY}`
  }
  const direction = to.x >= from.x ? 1 : -1
  const startX = from.x + direction * (nodeBounds.width / 2 - 8)
  const endX = to.x - direction * (nodeBounds.width / 2 - 8)
  const bend = Math.max(34, Math.abs(endX - startX) * 0.42)
  return `M ${startX} ${from.y} C ${startX + direction * bend} ${from.y}, ${endX - direction * bend} ${to.y}, ${endX} ${to.y}`
}

export function CombatActTree({ act, selectedNodeId, onSelect, onEnter }: { act: CombatActViewModel; selectedNodeId: string; onSelect: (id: string) => void; onEnter: (id: string) => boolean }) {
  const nodeById = new Map(act.nodes.map((node) => [node.id, node]))
  return <CombatProgressionViewport stage={act.definition.stage} contentBounds={getContentBounds(act)} resetKey={act.id} ariaLabel={`${act.label} ${act.title} progression tree`}><svg className="combat-progression-connections" viewBox={`0 0 ${act.definition.stage.width} ${act.definition.stage.height}`} aria-hidden="true" focusable="false">{act.connections.map((connection) => { const from = nodeById.get(connection.from); const to = nodeById.get(connection.to); if (!from || !to) return null; const locked = from.state === 'locked' || to.state === 'locked'; const completed = from.state === 'completed' && to.state === 'completed'; return <path key={`${connection.from}-${connection.to}`} className={`combat-progression-connection is-${connection.kind ?? 'main'}${locked ? ' is-locked' : ''}${completed ? ' is-completed' : ''}`} d={getConnectionPath(from, to)} /> })}</svg>{act.chapters.map((chapter) => <div key={chapter.id} className="combat-progression-chapter" style={{ left: `${chapter.startX}px`, width: `${chapter.endX - chapter.startX}px` }}><span>{chapter.label}</span><i aria-hidden="true" /></div>)}{act.nodes.map((node) => <CombatActNode key={node.id} node={node} selected={node.id === selectedNodeId} onSelect={onSelect} onEnter={onEnter} />)}</CombatProgressionViewport>
}

function CombatActNode({ node, selected, onSelect, onEnter }: { node: CombatActNodeViewModel; selected: boolean; onSelect: (id: string) => void; onEnter: (id: string) => boolean }) {
  const Icon = getNodeIcon(node)
  const bossLabel = node.boss?.known ? node.boss.name : node.boss ? 'UNKNOWN BOSS' : 'NO BOSS DATA'
  const tooltipDescription = node.state === 'prototype' ? `${node.tierLabel}. ${node.description} Click to inspect.` : `${node.statusLabel}. ${node.tierLabel}. Boss: ${bossLabel}.${node.unlockText ? ` Unlock: ${node.unlockText}.` : ''} Click to inspect. Double-click to enter.`
  const handleDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>) => { event.preventDefault(); const entered = onEnter(node.id); if (entered) emitGameFeelEvent({ type: 'success', x: event.clientX, y: event.clientY, color: getNodeAccent(node), intensity: 1.05 }) }
  return <GameTooltip block accent={node.state === 'locked' ? 'neutral' : node.state === 'prototype' ? 'mana' : 'success'} content={<TooltipContent title={node.name} description={tooltipDescription} />}><button type="button" data-combat-progression-interactive="true" data-ui-sound="click" draggable={false} className={`combat-progression-node is-${node.state} is-${node.kind}${selected ? ' is-selected' : ''}`} style={{ left: `${node.x}px`, top: `${node.y}px`, '--node-accent': getNodeAccent(node) } as CSSProperties} aria-pressed={selected} aria-label={`${node.name}, ${node.statusLabel}`} onClick={() => onSelect(node.id)} onDoubleClick={handleDoubleClick} onDragStart={(event) => event.preventDefault()}><span className="combat-progression-node-halo" aria-hidden="true" /><span className="combat-progression-node-core"><Icon size={node.kind === 'final' ? 21 : 18} strokeWidth={1.25} aria-hidden="true" /></span><span className="combat-progression-node-copy"><strong>{node.name}</strong><small>{node.tierLabel}</small><em>{node.kind === 'final' ? 'FINAL' : node.statusLabel}</em></span></button></GameTooltip>
}
