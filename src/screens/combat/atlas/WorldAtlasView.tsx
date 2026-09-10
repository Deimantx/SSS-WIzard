import { Globe } from 'lucide-react'
import { GameTooltip } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ArcaneAtlasViewport } from './ArcaneAtlasViewport'
import { WORLD_ATLAS_STAGE, WORLD_REGION_PLATE_BOUNDS, WORLD_REGION_SLOT_LAYOUT } from './atlasLayout'
import type { WorldRegionMap, WorldRegionMapNode } from '../combatNavigationTypes'

const getStatusLabel = (status: WorldRegionMapNode['status']) => status === 'current' ? 'CURRENT REGION' : status === 'available' ? 'AVAILABLE' : 'DORMANT REGION'

const getRoutePath = (from: WorldRegionMapNode, to: WorldRegionMapNode) => {
  const start = WORLD_REGION_SLOT_LAYOUT[from.slot]
  const end = WORLD_REGION_SLOT_LAYOUT[to.slot]
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

const WORLD_CONTENT_BOUNDS = {
  left: WORLD_REGION_SLOT_LAYOUT.west.x - WORLD_REGION_PLATE_BOUNDS.width / 2,
  right: WORLD_REGION_SLOT_LAYOUT.east.x + WORLD_REGION_PLATE_BOUNDS.width / 2,
  top: WORLD_REGION_SLOT_LAYOUT.north.y - WORLD_REGION_PLATE_BOUNDS.height / 2,
  bottom: WORLD_REGION_SLOT_LAYOUT.south.y + WORLD_REGION_PLATE_BOUNDS.height / 2,
}

export function WorldAtlasView({ map, selectedId, onSelect }: { map: WorldRegionMap; selectedId: string; onSelect: (id: string) => void }) {
  const nodeById = new Map<string, WorldRegionMapNode>(map.nodes.map((node) => [node.id, node]))
  return <div className="atlas-map-view atlas-world-view"><ArcaneAtlasViewport stage={WORLD_ATLAS_STAGE} contentBounds={WORLD_CONTENT_BOUNDS} panMode="bounded" className="is-world-atlas" ariaLabel="Arcane world region atlas"><svg className="atlas-graph-connections atlas-world-connections" viewBox={`0 0 ${WORLD_ATLAS_STAGE.width} ${WORLD_ATLAS_STAGE.height}`} aria-hidden="true" focusable="false">{map.connections.map((connection) => { const from = nodeById.get(connection.from); const to = nodeById.get(connection.to); if (!from || !to) return null; const start = WORLD_REGION_SLOT_LAYOUT[from.slot]; return <g key={`${connection.from}-${connection.to}`}><path className="atlas-world-route" d={getRoutePath(from, to)} /><circle className="atlas-world-junction" cx={start.x} cy={start.y} r="6" /></g> })}</svg>{map.nodes.map((node) => <WorldRegionPlate key={node.id} node={node} selected={node.id === selectedId} onSelect={onSelect} />)}</ArcaneAtlasViewport></div>
}

function WorldRegionPlate({ node, selected, onSelect }: { node: WorldRegionMapNode; selected: boolean; onSelect: (id: string) => void }) {
  const statusLabel = getStatusLabel(node.status)
  const tooltipDescription = [statusLabel, node.unlockText ? `Unlock: ${node.unlockText}` : null, node.description].filter(Boolean).join(' · ')
  const position = WORLD_REGION_SLOT_LAYOUT[node.slot]
  return <GameTooltip block accent={node.status === 'locked' ? 'neutral' : 'mana'} content={<TooltipContent title={node.name} description={tooltipDescription} />}><button type="button" data-atlas-interactive="true" data-ui-sound="click" className={`atlas-world-plate is-${node.status}${selected ? ' is-selected' : ''}`} style={{ left: `${position.x}px`, top: `${position.y}px` }} onClick={() => onSelect(node.id)} aria-pressed={selected} aria-label={`${node.name}, ${statusLabel}`}><span className="atlas-world-plate-rune" aria-hidden="true"><Globe size={25} /></span><span className="atlas-world-plate-copy"><strong>{node.name}</strong><small>{node.subtitle}</small><em>{statusLabel}</em></span><span className="atlas-world-plate-corner atlas-world-plate-corner-one" aria-hidden="true" /><span className="atlas-world-plate-corner atlas-world-plate-corner-two" aria-hidden="true" /></button></GameTooltip>
}
