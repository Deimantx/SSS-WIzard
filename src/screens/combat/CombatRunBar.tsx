import { Crown, LogOut, Map, Swords } from 'lucide-react'
import { DUNGEONS, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS, isBossMonster } from '../../game/content/monsters'
import { selectAutoHuntUnlocked } from '../../store/selectors'
import { useGameStore } from '../../store/gameStore'
import { Button, GameTooltip, Progress } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { DungeonId } from '../../game/types'

type CombatRunMode = 'tower' | 'normal-hunt' | 'boss-ready' | 'boss-queued' | 'boss-fight' | 'encounter-delay'

export function CombatRunBar({ selectedDungeonId, onOpenAtlas, onRequestLeave }: { selectedDungeonId: DungeonId; onOpenAtlas: () => void; onRequestLeave: () => void }) {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const toggleAutoHunt = useGameStore((state) => state.toggleAutoHunt)
  const engageBoss = useGameStore((state) => state.engageBoss)
  const enter = useGameStore((state) => state.enterDungeon)
  const autoHuntUnlocked = useGameStore(selectAutoHuntUnlocked)
  const dungeonId = combat.active ? combat.dungeonId ?? selectedDungeonId : selectedDungeonId
  const dungeon = DUNGEONS[dungeonId]
  const boss = MONSTERS[dungeon.boss]
  const selectedUnlocked = isDungeonUnlocked(dungeon, progress)
  const currentBossFight = Boolean(combat.active && combat.enemyId && isBossMonster(MONSTERS[combat.enemyId]))
  const threatThreshold = combat.threatCleared >= dungeon.threatRequired
  const ready = Boolean(combat.active && !combat.enemyId && !combat.inBossFight && threatThreshold)
  const queued = Boolean(combat.active && combat.pendingBossId === dungeon.boss)
  const mode: CombatRunMode = !combat.active ? 'tower' : currentBossFight || combat.inBossFight ? 'boss-fight' : queued ? 'boss-queued' : ready ? 'boss-ready' : combat.enemyId ? 'normal-hunt' : 'encounter-delay'
  const bossKills = progress.bossKillsByBoss[dungeon.boss] ?? 0
  const threatState = mode === 'boss-fight' ? 'FIGHT' : mode === 'boss-queued' ? 'QUEUED' : mode === 'boss-ready' ? 'READY' : mode === 'tower' ? 'STANDBY' : threatThreshold ? 'THRESHOLD' : 'BUILDING'
  const modeLabel = mode === 'tower' ? 'AT THE TOWER' : mode === 'boss-fight' || mode === 'boss-ready' || mode === 'boss-queued' ? 'BOSS ENCOUNTER' : mode === 'encounter-delay' ? 'ENCOUNTER DELAY' : 'NORMAL HUNT'
  const bossStatus = mode === 'boss-fight' ? 'FIGHTING' : mode === 'boss-queued' ? 'QUEUED' : mode === 'boss-ready' ? 'READY' : mode === 'tower' ? bossKills ? `${bossKills} ${bossKills === 1 ? 'CLEAR' : 'CLEARS'}` : 'NOT CLEARED' : 'INCOMING'
  const autoHuntDisabled = !selectedUnlocked || !autoHuntUnlocked
  const autoHuntDescription = !selectedUnlocked ? 'This Dungeon is locked. Unlock the route before enabling Auto Hunt.' : !autoHuntUnlocked ? 'Auto Hunt unlocks after the first dungeon boss kill.' : `When enabled, ${boss.name} is queued after ${dungeon.threatRequired} Threat Cleared.`
  const threatLabel = combat.active ? `${combat.threatCleared} / ${dungeon.threatRequired}` : '—'

  return <section className={`combat-run-bar${combat.active ? ' is-active' : ''} is-mode-${mode}`}><div className="combat-run-context"><span className="combat-subsection-label">{combat.active ? 'CURRENT DUNGEON' : 'AT THE TOWER'}</span><strong>{dungeon.name}</strong><small>{modeLabel}</small></div><div className="combat-run-threat"><div className="combat-run-metric-head"><span>THREAT · {threatState}</span><strong>{threatLabel}</strong></div><Progress value={combat.active ? combat.threatCleared / Math.max(1, dungeon.threatRequired) * 100 : 0} tone="warning" /><small>{combat.active ? threatThreshold ? `${dungeon.threatRequired} / ${dungeon.threatRequired} threshold reached` : 'Building toward Boss encounter' : 'Enter a Dungeon to begin clearing Threat'}</small></div><div className="combat-run-boss"><span className="combat-subsection-label"><Crown size={12} aria-hidden="true" /> BOSS</span><strong>{boss.name}</strong><small>{bossStatus}</small></div><GameTooltip content={<TooltipContent title="Auto Hunt" description={autoHuntDescription} />}><button type="button" className={`combat-toggle combat-run-toggle${progress.autoHuntBossByDungeon[dungeonId] ? ' is-on' : ''}`} disabled={autoHuntDisabled} onClick={() => toggleAutoHunt(dungeonId)}><span>AUTO HUNT</span><strong>{autoHuntDisabled ? 'LOCKED' : progress.autoHuntBossByDungeon[dungeonId] ? 'ON' : 'OFF'}</strong></button></GameTooltip><div className="combat-run-actions"><Button variant="secondary" onClick={onOpenAtlas}><Map size={14} /> ATLAS</Button>{ready && <Button variant="danger" onClick={() => engageBoss(dungeon.boss)}><Swords size={14} /> ENGAGE {boss.name.toUpperCase()}</Button>}{!combat.active ? <Button variant="primary" disabled={!selectedUnlocked} tooltip={!selectedUnlocked ? <TooltipContent title="Dungeon Locked" description="Defeat the required boss to unlock this route." /> : undefined} onClick={() => enter(selectedDungeonId)}><Swords size={14} /> ENTER</Button> : <Button variant="ghost" onClick={onRequestLeave}><LogOut size={14} /> LEAVE</Button>}</div></section>
}
