import { BookOpen, Crown, LogOut, Map, Repeat2, Swords } from 'lucide-react'
import { DUNGEONS, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS, isBossMonster } from '../../game/content/monsters'
import { selectAutoHuntUnlocked } from '../../store/selectors'
import { useGameStore } from '../../store/gameStore'
import { Button, GameTooltip, Progress, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { DungeonId } from '../../game/types'

export function CombatRunBar({ selectedDungeonId, onOpenAtlas, onRequestLeave }: { selectedDungeonId: DungeonId; onOpenAtlas: () => void; onRequestLeave: () => void }) {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const engageBoss = useGameStore((state) => state.engageBoss)
  const enter = useGameStore((state) => state.enterDungeon)
  const autoHuntUnlocked = useGameStore(selectAutoHuntUnlocked)
  const dungeonId = combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId
  const dungeon = DUNGEONS[dungeonId]
  const selectedUnlocked = isDungeonUnlocked(dungeon, progress)
  const boss = MONSTERS[dungeon.boss]
  const currentBossFight = combat.active && Boolean(combat.enemyId && isBossMonster(MONSTERS[combat.enemyId]))
  const ready = combat.active && !combat.enemyId && !combat.inBossFight && combat.threatCleared >= dungeon.threatRequired
  const queued = combat.pendingBossId === dungeon.boss
  const bossKills = progress.bossKillsByBoss[dungeon.boss] ?? 0
  const bossState = currentBossFight || combat.inBossFight ? 'BOSS FIGHT' : queued ? 'AUTO HUNT QUEUED' : ready ? 'READY' : bossKills > 0 && !combat.active ? `${bossKills} ${bossKills === 1 ? 'CLEAR' : 'CLEARS'}` : 'NOT READY'
  const threatLabel = combat.active ? `${combat.threatCleared} / ${dungeon.threatRequired}` : '—'
  return <section className={`combat-run-bar${combat.active ? ' is-active' : ''}`}><div className="combat-run-context"><span className="combat-subsection-label">{combat.active ? 'CURRENT DUNGEON' : 'AT THE TOWER'}</span><strong>{dungeon.name}</strong><small>{combat.active ? 'NORMAL HUNT' : 'Selected route'}</small></div><div className="combat-run-threat"><div className="combat-run-metric-head"><span>THREAT</span><strong>{threatLabel}</strong></div><Progress value={combat.active ? combat.threatCleared / Math.max(1, dungeon.threatRequired) * 100 : 0} tone="warning" /><small>{combat.active ? combat.threatCleared >= dungeon.threatRequired ? `${dungeon.threatRequired} / ${dungeon.threatRequired} +${combat.threatCleared - dungeon.threatRequired}` : 'Boss progress' : 'Enter a Dungeon to begin clearing Threat'}</small></div><div className="combat-run-boss"><span className="combat-subsection-label"><Crown size={12} aria-hidden="true" /> BOSS</span><strong>{boss.name}</strong><small>{combat.active && combat.enemyId && combat.enemyId === dungeon.boss ? 'BOSS FIGHT' : `${bossState}${bossKills > 0 && !combat.active ? ` · ${bossKills} clears` : ''}`}</small></div><GameTooltip content={<TooltipContent title="Auto Hunt" description={autoHuntUnlocked ? `When enabled, ${boss.name} is queued after ${dungeon.threatRequired} Threat Cleared.` : 'Auto Hunt unlocks after the first dungeon boss kill.'} />}><button type="button" className={`combat-toggle combat-run-toggle${progress.autoHuntBossByDungeon[dungeonId] ? ' is-on' : ''}`} disabled={!autoHuntUnlocked} onClick={() => toggleAutoHunt(dungeonId)}><span>AUTO HUNT</span><strong>{autoHuntUnlocked ? progress.autoHuntBossByDungeon[dungeonId] ? 'ON' : 'OFF' : 'LOCKED'}</strong></button></GameTooltip><div className="combat-run-actions"><Button variant="secondary" onClick={onOpenAtlas}><Map size={14} /> ATLAS</Button>{ready && <Button variant="danger" onClick={() => engageBoss(dungeon.boss)}><Swords size={14} /> ENGAGE {boss.name.toUpperCase()}</Button>}{!combat.active ? <Button variant="primary" disabled={!selectedUnlocked} tooltip={!selectedUnlocked ? <TooltipContent title="Dungeon Locked" description="Defeat the required boss to unlock this route." /> : undefined} onClick={() => enter(selectedDungeonId)}><Swords size={14} /> ENTER</Button> : <Button variant="ghost" onClick={onRequestLeave}><LogOut size={14} /> LEAVE</Button>}</div></section>
}
