import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { emitGameFeelEvent } from '../../../ui/game-feel/gameFeelStore'
import { REGION_ATLAS_STAGE } from './atlasLayout'
import { ArcaneAtlasViewport } from './ArcaneAtlasViewport'
import type { CombatRegionMap, CombatRegionMapNode } from '../combatNavigationTypes'

const getStatusLabel = (status: CombatRegionMapNode['status']) => status === 'locked' ? 'LOCKED' : status === 'boss-ready' ? 'BOSS READY' : status === 'completed' ? 'CLEARED' : status === 'active' ? 'ACTIVE' : 'AVAILABLE'

const getWaypointGlyph = (status: CombatRegionMapNode['status']) => status === 'locked' ? '×' : status === 'completed' ? '✓' : status === 'boss-ready' ? '♛' : status === 'active' ? '✦' : '◇'

const getRoutePath = (from: CombatRegionMapNode, to: CombatRegionMapNode) => {
  const bend = Math.max(46, Math.abs(to.x - from.x) * 0.16)
  return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`
}

export function RegionConstellationView({ map, selectedId, onSelect, onEnter }: { map: CombatRegionMap; selectedId: string; onSelect: (id: string) => void; onEnter: (id: CombatRegionMapNode['id']) => boolean }) {
  const nodeById = new Map<string, CombatRegionMapNode>(map.nodes.map((node) => [node.id, node]))
  return <div className="atlas-map-view atlas-region-view"><ArcaneAtlasViewport stage={REGION_ATLAS_STAGE} panMode="none" className="is-region-atlas" ariaLabel="Deep Woods dungeon waypoint constellation"><svg className="atlas-graph-connections atlas-region-connections" viewBox={`0 0 ${REGION_ATLAS_STAGE.width} ${REGION_ATLAS_STAGE.height}`} aria-hidden="true" focusable="false">{map.connections.map((connection) => { const from = nodeById.get(connection.from); const to = nodeById.get(connection.to); if (!from || !to) return null; const active = from.status !== 'locked' && to.status !== 'locked'; return <path key={`${connection.from}-${connection.to}`} className={`atlas-region-route${active ? ' is-energized' : ' is-dormant'}`} d={getRoutePath(from, to)} /> })}</svg>{map.nodes.map((node) => <DungeonWaypoint key={node.id} node={node} selected={node.id === selectedId} onSelect={onSelect} onEnter={onEnter} />)}</ArcaneAtlasViewport></div>
}

function DungeonWaypoint({ node, selected, onSelect, onEnter }: { node: CombatRegionMapNode; selected: boolean; onSelect: (id: string) => void; onEnter: (id: CombatRegionMapNode['id']) => boolean }) {
  const statusLabel = getStatusLabel(node.status)
  const tooltipDescription = [statusLabel, node.unlockText ? `Unlock: ${node.unlockText}` : null, `Boss: ${node.bossName}`, node.description].filter(Boolean).join(' · ')
  return <GameTooltip block accent={node.status === 'locked' ? 'neutral' : 'mana'} content={<TooltipContent title={node.name} description={tooltipDescription} />}><button type="button" data-atlas-interactive="true" data-ui-sound="click" className={`atlas-waypoint is-${node.status}${selected ? ' is-selected' : ''}`} style={{ left: `${node.x}px`, top: `${node.y}px` }} onClick={() => onSelect(node.id)} onDoubleClick={(event) => { event.preventDefault(); if (node.status === 'locked' || !onEnter(node.id)) return; emitGameFeelEvent({ type: 'success', x: event.clientX, y: event.clientY, color: 'var(--ui-accent)', intensity: 1.05 }) }} aria-pressed={selected} aria-label={`${node.name}, ${statusLabel}`}><span className="atlas-waypoint-halo" aria-hidden="true" /><span className="atlas-waypoint-core" aria-hidden="true"><span>{getWaypointGlyph(node.status)}</span></span><span className="atlas-waypoint-label"><strong>{node.name}</strong><small>{statusLabel}</small></span></button></GameTooltip>
}
