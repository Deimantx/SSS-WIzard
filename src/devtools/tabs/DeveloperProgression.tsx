import { Button, Card } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER, isDungeonCompleted, isDungeonUnlocked, isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

export function DeveloperProgression() {
  const progress = useGameStore((state) => state.progress)
  const preset = useGameStore((state) => state.preset)
  const promote = useGameStore((state) => state.promoteGuild)
  const setRep = useGameStore((state) => state.setGuildReputation)
  return <div className="developer-tab-grid"><Card title="Progression flags"><div className="developer-summary-grid">{DUNGEON_ORDER.map((id) => <Summary key={id} label={DUNGEONS[id].name} value={isDungeonUnlocked(DUNGEONS[id], progress) ? isDungeonCompleted(id, progress) ? 'Complete' : `${progress.bossKillsByBoss[DUNGEONS[id].boss] ?? 0} boss kills` : 'Locked'} />)}<Summary label="Tutorial" value={isTutorialCompleted(progress) ? 'Complete' : 'Incomplete'} /><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Normal kills" value={progress.lifetimeKills} /><Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} /><Summary label="Permanent Focus" value={Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)} /></div></Card><Card title="Progression controls"><div className="button-row"><Button variant="secondary" onClick={() => preset('guild')}>Unlock Guild</Button><Button variant="secondary" onClick={promote}>Promote if legal</Button><Button variant="danger" onClick={() => preset('chapter-complete')}>FORCE Chapter Complete</Button></div><NumberField label="Guild reputation" value={progress.guildReputation} onChange={setRep} /></Card></div>
}
