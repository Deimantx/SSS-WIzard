import { Map, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonCompleted, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { selectAutoHuntUnlocked } from '../../store/selectors'
import { formatNumber } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { Button, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { DungeonId } from '../../game/types'
import { MonsterPortrait } from './MonsterPortrait'

export function DungeonAtlasDialog({ selectedDungeonId, onSelect, onClose }: { selectedDungeonId: DungeonId; onSelect: (id: DungeonId) => void; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const autoHuntUnlocked = useGameStore(selectAutoHuntUnlocked)
  const selectedDungeon = DUNGEONS[selectedDungeonId]
  const selectedUnlocked = isDungeonUnlocked(selectedDungeon, progress)
  const selectedBoss = MONSTERS[selectedDungeon.boss]
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus(), 0)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { window.clearTimeout(focusTimer); document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [onClose])
  return <div className="combat-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div ref={dialogRef} className="dungeon-atlas-dialog" role="dialog" aria-modal="true" aria-labelledby="dungeon-atlas-title"><header className="combat-modal-head"><div><span className="combat-subsection-label">ROUTES &amp; HUNTING GROUNDS</span><h2 id="dungeon-atlas-title">DUNGEON ATLAS</h2><p>Choose a hunting ground and review what waits beyond the gate.</p></div><Button icon variant="ghost" ariaLabel="Close Dungeon Atlas" onClick={onClose}><X size={17} aria-hidden="true" /></Button></header><div className="dungeon-atlas-body"><aside className="dungeon-atlas-list"><div className="combat-subsection-label">DUNGEONS</div>{DUNGEON_ORDER.map((dungeonId) => { const dungeon = DUNGEONS[dungeonId]; const unlocked = isDungeonUnlocked(dungeon, progress); const active = combat.active && combat.dungeonId === dungeonId; const completed = isDungeonCompleted(dungeonId, progress); const selected = selectedDungeonId === dungeonId; return <button type="button" className={`dungeon-atlas-list-item${selected ? ' is-selected' : ''}${!unlocked ? ' is-locked' : ''}`} key={dungeonId} onClick={() => onSelect(dungeonId)} aria-pressed={selected}><span>{active ? 'ACTIVE' : !unlocked ? 'LOCKED' : completed ? 'CLEARED' : 'AVAILABLE'}</span><strong>{dungeon.name}</strong><small>{dungeon.threatRequired} Threat · {MONSTERS[dungeon.boss].name}</small></button> })}</aside><section className="dungeon-atlas-inspector"><div className="dungeon-atlas-title-row"><div><span className="combat-subsection-label">{selectedUnlocked ? 'AVAILABLE ROUTE' : 'LOCKED ROUTE'}</span><h3>{selectedDungeon.name}</h3></div><Status tone={selectedUnlocked ? 'active' : 'locked'}>{combat.active && combat.dungeonId === selectedDungeonId ? 'Active' : selectedUnlocked ? 'Available' : 'Locked'}</Status></div><p className="dungeon-atlas-description">{selectedDungeon.ui?.description}</p><div className="dungeon-atlas-stat-grid"><div><span>THREAT REQUIRED</span><strong>{selectedDungeon.threatRequired}</strong></div><div><span>BOSS CLEARS</span><strong>{progress.bossKillsByBoss[selectedDungeon.boss] ?? 0}</strong></div></div><div className="dungeon-atlas-section"><div className="combat-subsection-label">NORMAL ENEMIES</div><div className="dungeon-roster-grid">{selectedDungeon.monsterPool.map((monsterId) => <GameTooltip key={monsterId} block content={<TooltipContent title={MONSTERS[monsterId].name} description={MONSTERS[monsterId].subtitle} />}><div className="dungeon-roster-card"><MonsterPortrait monster={MONSTERS[monsterId]} /><strong>{MONSTERS[monsterId].name}</strong><small>{MONSTERS[monsterId].subtitle}</small></div></GameTooltip>)}</div></div><div className="dungeon-atlas-section dungeon-atlas-boss"><div className="combat-subsection-label">DUNGEON BOSS</div><div className="dungeon-boss-preview"><MonsterPortrait monster={selectedBoss} boss /><div><Status tone="warning">BOSS</Status><h4>{selectedBoss.name}</h4><p>{selectedBoss.subtitle}</p><small>{formatNumber(progress.bossKillsByBoss[selectedDungeon.boss] ?? 0)} clears · {selectedDungeon.threatRequired} Threat</small></div></div></div>{!selectedUnlocked && <div className="dungeon-atlas-lock-note"><Status tone="locked">LOCKED</Status><span>{getDungeonUnlockRequirement(selectedDungeon)}</span></div>}{selectedUnlocked && <div className="dungeon-atlas-actions"><GameTooltip content={<TooltipContent title="Auto Hunt" description={autoHuntUnlocked ? `Queue ${selectedBoss.name} after the Threat requirement is reached.` : 'Auto Hunt unlocks after the first dungeon boss kill.'} />}><button type="button" className={`combat-toggle${progress.autoHuntBossByDungeon[selectedDungeonId] ? ' is-on' : ''}`} disabled={!autoHuntUnlocked} onClick={() => toggleAutoHunt(selectedDungeonId)}><span>AUTO HUNT</span><strong>{autoHuntUnlocked ? progress.autoHuntBossByDungeon[selectedDungeonId] ? 'ON' : 'OFF' : 'LOCKED'}</strong></button></GameTooltip><Button variant="success" disabled={combat.active} onClick={() => { enter(selectedDungeonId); onClose() }}>{combat.active ? 'LEAVE CURRENT DUNGEON FIRST' : `ENTER ${selectedDungeon.name.toUpperCase()}`}</Button></div>}{combat.active && <p className="dungeon-atlas-active-note">The current Dungeon must be left before entering another. Browsing remains available.</p>}</section></div><footer className="combat-modal-foot"><span><Map size={14} aria-hidden="true" /> {combat.active ? `${DUNGEONS[combat.dungeonId ?? selectedDungeonId].name} is active.` : 'Select a route to begin.'}</span><Button variant="ghost" onClick={onClose}>{combat.active ? 'RETURN TO COMBAT' : 'CLOSE ATLAS'}</Button></footer></div></div>
}

export const getFirstUnlockedDungeon = (progress: Parameters<typeof isDungeonUnlocked>[1]): DungeonId => DUNGEON_ORDER.find((id) => isDungeonUnlocked(DUNGEONS[id], progress)) ?? DUNGEON_ORDER[0]
export const dungeonHasMeaningfulProgress = (combat: ReturnType<typeof useGameStore.getState>['combat']) => Boolean(combat.threatCleared > 0 || combat.inBossFight || combat.pendingBossId || combat.enemyId)
