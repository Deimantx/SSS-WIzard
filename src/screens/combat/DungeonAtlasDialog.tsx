import { Crown, Globe, Map, Swords, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { isBossCurrentlyActive } from '../../game/systems/combat/combatBossSelectors'
import { formatNumber } from '../../game/utils'
import type { DungeonId, GameState } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { CombatMapCanvas } from './CombatMapCanvas'
import { buildCombatRegionMap, buildWorldRegionMap, isWorldMapUnlocked } from './combatNavigationReadModel'
import type { CombatNavigationMode, CombatRegionMapNode, WorldRegionId, WorldRegionMapNode } from './combatNavigationTypes'

export function DungeonAtlasDialog({ selectedDungeonId, onSelect, onClose, initialMode = 'region' }: { selectedDungeonId: DungeonId; onSelect: (id: DungeonId) => void; onClose: () => void; initialMode?: CombatNavigationMode }) {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const worldUnlocked = isWorldMapUnlocked(progress)
  const [mode, setMode] = useState<CombatNavigationMode>(initialMode === 'world' && worldUnlocked ? 'world' : 'region')
  const [selectedRegionId, setSelectedRegionId] = useState<WorldRegionId>('deep-woods')
  const regionMap = buildCombatRegionMap(progress, combat)
  const worldMap = buildWorldRegionMap(progress)
  const selectedNode = regionMap.nodes.find((node) => node.id === selectedDungeonId) ?? regionMap.nodes[0]
  const selectedRegion = worldMap.nodes.find((node) => node.id === selectedRegionId) ?? worldMap.nodes[0]

  useEffect(() => {
    if (!worldUnlocked && mode === 'world') setMode('region')
  }, [mode, worldUnlocked])

  const handleEnterRegion = () => {
    if (!selectedRegion.linkedRegionMapId) return
    const nextDungeon = isDungeonUnlocked(DUNGEONS[selectedDungeonId], progress) ? selectedDungeonId : getFirstUnlockedDungeon(progress)
    onSelect(nextDungeon)
    setMode('region')
  }

  return <ModalPortal open onClose={onClose} backdropClassName="combat-modal-backdrop" surfaceClassName="dungeon-atlas-dialog combat-navigation-dialog" ariaLabelledBy="combat-navigation-title">
    <header className="combat-modal-head combat-navigation-head"><div><span className="combat-subsection-label">{mode === 'world' ? 'WORLD NAVIGATION' : 'REGION NAVIGATION'}</span><h2 id="combat-navigation-title">{mode === 'world' ? 'THE WORLD MAP' : `${regionMap.name.toUpperCase()} ROUTES`}</h2><p>{mode === 'world' ? worldMap.description : regionMap.description}</p></div><div className="combat-navigation-head-actions"><div className="combat-navigation-mode-switch" role="tablist" aria-label="Combat map mode"><button type="button" role="tab" aria-selected={mode === 'region'} data-ui-sound="click" className={mode === 'region' ? 'is-selected' : ''} onClick={() => setMode('region')}><Map size={13} aria-hidden="true" /> REGION</button>{worldUnlocked && <button type="button" role="tab" aria-selected={mode === 'world'} data-ui-sound="click" className={mode === 'world' ? 'is-selected' : ''} onClick={() => setMode('world')}><Globe size={13} aria-hidden="true" /> WORLD</button>}</div><Button icon variant="ghost" ariaLabel="Close combat navigation" onClick={onClose}><X size={17} aria-hidden="true" /></Button></div></header>
    {mode === 'region' ? <div className="combat-navigation-body"><section className="combat-navigation-map-panel"><div className="combat-navigation-panel-head"><div><span className="combat-subsection-label">{regionMap.subtitle}</span><strong>Choose a combat destination</strong></div><small>{regionMap.nodes.length} ROUTES · DRAG TO EXPLORE</small></div><CombatMapCanvas nodes={regionMap.nodes} connections={regionMap.connections} selectedId={selectedNode.id} onSelect={(id) => onSelect(id as DungeonId)} mapLabel="Deep Woods combat route map" /></section><RegionInspector node={selectedNode} combat={combat} progress={progress} onEnter={() => { enter(selectedNode.targetAreaId); onClose() }} /></div> : <div className="combat-navigation-body"><section className="combat-navigation-map-panel"><div className="combat-navigation-panel-head"><div><span className="combat-subsection-label">{worldMap.subtitle}</span><strong>Choose a region</strong></div><small>{worldMap.nodes.length} REGIONS · DRAG TO EXPLORE</small></div><CombatMapCanvas nodes={worldMap.nodes} connections={worldMap.connections} selectedId={selectedRegion.id} onSelect={(id) => setSelectedRegionId(id as WorldRegionId)} mapLabel="World region map" /></section><WorldInspector node={selectedRegion} onEnter={handleEnterRegion} /></div>}
    <footer className="combat-modal-foot combat-navigation-foot"><span>{mode === 'world' ? <><Globe size={14} aria-hidden="true" /> {worldUnlocked ? 'World map unlocked after Archmage Edrin.' : 'World map remains dormant.'}</> : <><Map size={14} aria-hidden="true" /> {combat.active ? `${DUNGEONS[combat.dungeonId ?? selectedDungeonId].name} is active.` : 'Select a route to begin.'}</>}</span><Button variant="ghost" onClick={onClose}>{combat.active ? 'RETURN TO COMBAT' : 'CLOSE MAP'}</Button></footer>
  </ModalPortal>
}

function RegionInspector({ node, combat, progress, onEnter }: { node: CombatRegionMapNode; combat: GameState['combat']; progress: GameState['progress']; onEnter: () => void }) {
  const unlocked = node.status !== 'locked'
  const active = combat.active && combat.dungeonId === node.id
  const bossActive = active && isBossCurrentlyActive({ combat })
  const statusTone = node.status === 'locked' ? 'locked' : node.status === 'completed' ? 'success' : node.status === 'boss-ready' ? 'warning' : 'active'
  const statusLabel = node.status === 'locked' ? 'LOCKED' : node.status === 'completed' ? 'CLEARED' : node.status === 'boss-ready' ? 'BOSS READY' : node.status === 'active' ? 'ACTIVE ROUTE' : 'AVAILABLE'
  const enterLabel = !unlocked ? 'ROUTE LOCKED' : combat.active ? active ? 'ACTIVE ROUTE' : 'LEAVE CURRENT RUN FIRST' : `ENTER ${node.name.toUpperCase()}`
  const enterTooltip = !unlocked ? <TooltipContent title="Route locked" description={node.unlockText ?? 'This route is not available yet.'} /> : combat.active && !active ? <TooltipContent title="Current run active" description="Leave the current dungeon before entering another route." /> : undefined
  return <aside className="combat-navigation-inspector"><div className="combat-navigation-inspector-top"><div className={`combat-navigation-inspector-glyph is-${node.status}`}><span aria-hidden="true">{node.status === 'locked' ? '×' : node.status === 'boss-ready' ? '♛' : node.status === 'completed' ? '✓' : '✦'}</span></div><div><span className="combat-subsection-label">{unlocked ? 'COMBAT DESTINATION' : 'DORMANT ROUTE'}</span><h3>{node.name}</h3><p>{node.subtitle}</p></div><Status tone={statusTone}>{statusLabel}</Status></div><p className="combat-navigation-description">{node.description}</p>{!unlocked && <div className="combat-navigation-lock-note"><Status tone="locked">LOCKED</Status><span>{node.unlockText}</span></div>}<div className="combat-navigation-stat-grid"><div><span>DIFFICULTY</span><strong>T1 · {node.threatRequired} THREAT</strong></div><div><span>BOSS</span><strong>{node.bossName}</strong></div><div><span>NORMAL KILLS</span><strong>{formatNumber(node.normalKills)}</strong></div><div><span>BOSS CLEARS</span><strong>{formatNumber(node.bossClears)}</strong></div></div>{active && <div className={`combat-navigation-threat${bossActive ? ' is-boss' : ''}`}><div><span>THREAT PROGRESS</span><strong>{node.threatCleared} / {node.threatRequired}</strong></div><div className="combat-navigation-threat-bar"><i style={{ width: `${Math.min(100, node.threatCleared / Math.max(1, node.threatRequired) * 100)}%` }} /></div><small>{bossActive ? 'Boss encounter in progress.' : node.status === 'boss-ready' ? 'The boss gate is open.' : 'Clear normal encounters to advance.'}</small></div>}<div className="combat-navigation-section"><span className="combat-subsection-label">NORMAL ENCOUNTERS</span><div className="combat-navigation-tags">{node.normalMonsterNames.map((name) => <GameTooltip key={name} content={<TooltipContent title={name} description="Normal encounter in this combat route." />}><span>{name}</span></GameTooltip>)}</div></div><div className="combat-navigation-section"><span className="combat-subsection-label">BOSS PREVIEW</span><div className="combat-navigation-boss"><Crown size={15} aria-hidden="true" /><div><strong>{node.bossName}</strong><small>{node.threatRequired} Threat · {node.bossClears} {node.bossClears === 1 ? 'clear' : 'clears'}</small></div></div></div><div className="combat-navigation-actions"><Button variant="success" disabled={!unlocked || combat.active} tooltip={enterTooltip} onClick={onEnter}><Swords size={14} aria-hidden="true" /> {enterLabel}</Button></div>{combat.active && active && <p className="combat-navigation-active-note">The current route is active. Browsing remains available while combat runs.</p>}</aside>
}

function WorldInspector({ node, onEnter }: { node: WorldRegionMapNode; onEnter: () => void }) {
  const unlocked = node.status !== 'locked'
  const statusTone = node.status === 'locked' ? 'locked' : node.status === 'current' ? 'active' : 'success'
  const statusLabel = node.status === 'locked' ? 'DORMANT' : node.status === 'current' ? 'AVAILABLE' : 'UNLOCKED'
  return <aside className="combat-navigation-inspector world-region-inspector"><div className="combat-navigation-inspector-top"><div className={`combat-navigation-inspector-glyph is-${node.accent}`}><Globe size={23} aria-hidden="true" /></div><div><span className="combat-subsection-label">{unlocked ? 'REGION DESTINATION' : 'DORMANT REGION'}</span><h3>{node.name}</h3><p>{node.subtitle}</p></div><Status tone={statusTone}>{statusLabel}</Status></div><p className="combat-navigation-description">{node.description}</p>{!unlocked && <div className="combat-navigation-lock-note"><Status tone="locked">LOCKED</Status><span>{node.unlockText}</span></div>}<div className="combat-navigation-stat-grid"><div><span>ACCESS</span><strong>{unlocked ? 'OPEN' : 'NOT RESTORED'}</strong></div><div><span>LOCAL DESTINATIONS</span><strong>{node.linkedRegionMapId ? '3 ROUTES' : '—'}</strong></div></div><div className="combat-navigation-world-lore"><span className="combat-subsection-label">WORLD SIGNAL</span><p>{unlocked ? 'A stable path connects this region to the Wizard Tower.' : 'The path is visible, but the tower cannot reach it yet.'}</p></div><div className="combat-navigation-actions"><Button variant="success" disabled={!unlocked} tooltip={!unlocked ? <TooltipContent title="Region locked" description={node.unlockText ?? 'This region is not available yet.'} /> : undefined} onClick={onEnter}><Map size={14} aria-hidden="true" /> ENTER REGION</Button></div></aside>
}

export const getFirstUnlockedDungeon = (progress: Parameters<typeof isDungeonUnlocked>[1]): DungeonId => DUNGEON_ORDER.find((id) => isDungeonUnlocked(DUNGEONS[id], progress)) ?? DUNGEON_ORDER[0]
export const dungeonHasMeaningfulProgress = (combat: ReturnType<typeof useGameStore.getState>['combat']) => Boolean(combat.threatCleared > 0 || combat.inBossFight || combat.pendingBossId || combat.enemyId)
