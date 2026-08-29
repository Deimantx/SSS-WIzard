import { useEffect, useState } from 'react'
import { Pause, Swords } from 'lucide-react'
import { Button, Card, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import type { DungeonId, MonsterId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { selectAutoHuntUnlocked } from '../../store/selectors'
import { formatNumber, formatTime } from '../../game/utils'

export function DungeonPanel() {
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
  const enter = useGameStore((state) => state.enterDungeon)
  const leave = useGameStore((state) => state.leaveDungeon)
  const engage = useGameStore((state) => state.engageBoss)
  const toggle = useGameStore((state) => state.toggleAutoHunt)
  const autoHuntUnlocked = useGameStore(selectAutoHuntUnlocked)
  const [selectedDungeonId, setSelectedDungeonId] = useState<DungeonId>(combat.dungeonId ?? 'whispering-woods')

  useEffect(() => {
    if (combat.dungeonId) setSelectedDungeonId(combat.dungeonId)
  }, [combat.dungeonId])

  const selectedDungeon = DUNGEONS[selectedDungeonId]
  const selectedIsCurrent = combat.active && combat.dungeonId === selectedDungeonId
  const selectedUnlocked = isDungeonUnlocked(selectedDungeon, progress)
  const enemy = combat.enemyId ? MONSTERS[combat.enemyId] : null
  const boss = MONSTERS[selectedDungeon.boss]
  const bossReady = selectedIsCurrent && !combat.inBossFight && combat.threatCleared >= selectedDungeon.threatRequired

  return <Card title="DUNGEON ATLAS" action={<Status tone={combat.active ? 'active' : 'neutral'}>{combat.active ? `${DUNGEONS[combat.dungeonId ?? selectedDungeonId].name} active` : 'At the Tower'}</Status>}>
    <div className="dungeon-card-grid">{DUNGEON_ORDER.map((dungeonId) => {
      const dungeon = DUNGEONS[dungeonId]
      const unlocked = isDungeonUnlocked(dungeon, progress)
      const isCurrent = combat.active && combat.dungeonId === dungeonId
      const autoHunt = Boolean(progress.autoHuntBossByDungeon[dungeonId])
      const requirement = getDungeonUnlockRequirement(dungeon)
      return <div className={`dungeon-card ${selectedDungeonId === dungeonId ? 'selected' : ''} ${!unlocked ? 'locked' : ''}`} key={dungeonId}>
        <button type="button" className="dungeon-card-select" aria-pressed={selectedDungeonId === dungeonId} onClick={() => setSelectedDungeonId(dungeonId)}>
          <span className="eyebrow">{isCurrent ? 'CURRENT DUNGEON' : unlocked ? 'AVAILABLE' : 'LOCKED'}</span>
          <strong>{dungeon.name}</strong>
          <small>Threat {dungeon.threatRequired} · Boss: {bossName(dungeon.boss)}</small>
          {!unlocked && <span className="dungeon-lock-note">{requirement}</span>}
        </button>
        <div className="dungeon-card-actions">
          <Button variant={isCurrent ? 'success' : 'secondary'} disabled={!unlocked || combat.active} onClick={() => enter(dungeonId)} tooltip={!unlocked ? <TooltipContent title="Dungeon locked" description={requirement ?? 'This dungeon is unavailable.'} /> : undefined}>{isCurrent ? 'IN DUNGEON' : 'ENTER'}</Button>
          <Button variant={autoHunt ? 'success' : 'ghost'} disabled={!unlocked || !autoHuntUnlocked} onClick={() => toggle(dungeonId)} ariaLabel={`${autoHunt ? 'Disable' : 'Enable'} Auto Hunt Boss for ${dungeon.name}`} tooltip={<TooltipContent title="Auto Hunt Boss" description={`When enabled, ${bossName(dungeon.boss)} is queued after ${dungeon.threatRequired} normal defeats in this dungeon.`} />}>{autoHunt ? 'AUTO ON' : 'AUTO OFF'}</Button>
        </div>
      </div>
    })}</div>

    <div className="dungeon-stat-row"><div className="metric"><span>Threat Cleared</span><strong>{selectedIsCurrent ? combat.threatCleared : 0} / {selectedDungeon.threatRequired}</strong></div><div className="metric"><span>Lifetime kills</span><strong>{formatNumber(progress.lifetimeKills)}</strong></div><div className="metric"><span>Encounter</span><strong>{selectedIsCurrent && enemy ? 'Engaged' : selectedIsCurrent ? formatTime(combat.encounterTimerMs) : '-'}</strong></div></div>

    {bossReady && <div className="boss-ready"><div><Status tone="success">BOSS READY</Status><strong>{boss.name} can be challenged.</strong><span>Threat may continue above the requirement while Auto Hunt is OFF.</span></div><Button variant="danger" onClick={() => engage(selectedDungeon.boss)}><Swords size={14} /> Engage {boss.name}</Button></div>}
    <div className="dungeon-footer-actions">{combat.active ? <Button variant="danger" onClick={leave}><Pause size={15} /> Leave Dungeon</Button> : <Button disabled={!selectedUnlocked} onClick={() => enter(selectedDungeonId)} tooltip={!selectedUnlocked ? <TooltipContent title="Dungeon locked" description={getDungeonUnlockRequirement(selectedDungeon) ?? 'This dungeon is unavailable.'} /> : undefined}><Swords size={15} /> Enter {selectedDungeon.name}</Button>}</div>
  </Card>
}

function bossName(bossId: MonsterId) {
  return MONSTERS[bossId]?.name ?? bossId
}
