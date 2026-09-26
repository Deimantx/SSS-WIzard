import { Button, Card, Status } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER, isDungeonCompleted, isDungeonUnlocked, isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTER_IDS, isBossMonster, MONSTERS } from '../../game/content/monsters'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getSpellRank } from '../../game/systems/spells'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'
import { CHRONICLE_OBJECTIVES } from '../../game/content/chronicles/chronicles'
import { getChronicleMainObjective } from '../../game/systems/chronicles/chronicleRuntime'
import { getGuildPointsAvailable } from '../../game/systems/guild/guildSelectors'

const schoolIds = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>

export function DeveloperProgression() {
  const state = useGameStore()
  const { progress } = state
  const totalBosses = MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredBosses = progress.discoveredMonsters.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredEquipment = progress.discoveredItems.filter((id) => ITEMS[id]?.kind === 'equipment').length
  const chronicleObjective = getChronicleMainObjective(state)
  const chronicleComplete = progress.chronicle.completedObjectiveIds.length
  const flags = [
    { label: 'First Boss defeated', value: progress.firstBossKill },
    { label: 'Final boss defeated', value: progress.firstMainBossKill },
    { label: 'Guild unlocked', value: progress.guildUnlocked },
    { label: 'Ember Staff recipe unlocked', value: progress.emberStaffUnlocked },
    { label: 'Forest Heart unlocked', value: progress.forestHeartUnlocked },
    { label: 'Auto Hunt unlocked', value: progress.autoHuntBossUnlocked },
  ]

  return <div className="developer-tab-grid">
    <Card title="DUNGEONS · Progression dashboard">
      <div className="developer-summary-grid">
        {DUNGEON_ORDER.map((id) => <Summary key={id} label={DUNGEONS[id].name} value={isDungeonUnlocked(DUNGEONS[id], progress) ? isDungeonCompleted(id, progress) ? 'Complete' : 'Unlocked' : 'Locked'} />)}
        <Summary label="Tutorial" value={isTutorialCompleted(progress) ? 'Complete' : 'Incomplete'} />
        <Summary label="Normal kills" value={progress.lifetimeKills} />
        <Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} />
        <Summary label="Discovered monsters" value={`${progress.discoveredMonsters.length} / ${MONSTER_IDS.length}`} />
        <Summary label="Discovered bosses" value={`${discoveredBosses} / ${totalBosses}`} />
        <Summary label="Discovered equipment" value={`${discoveredEquipment} / ${Object.values(ITEMS).filter((item) => item.kind === 'equipment').length}`} />
        <Summary label="Crystals" value={progress.bossKillsByBoss['meridian-splitter'] ? 'Unlocked' : 'Locked'} />
      </div>
    </Card>
    <Card title="MAGIC · School unlocks and levels">
      <div className="developer-research-school-list">{schoolIds.map((schoolId) => { const info = getSchoolProgressInfo(state, schoolId); const spellCount = Object.values(SPELLS).filter((spell) => spell.school === schoolId && getSpellRank(state, spell.id) !== null).length; return <div className="developer-research-school" key={schoolId}><div><strong>{SCHOOLS[schoolId].name}</strong><small>Level {info.level} / {info.cap} · {info.xp} XP · {spellCount} unlocked spells</small></div><Status tone={info.atCap ? 'warning' : info.level > 1 ? 'success' : 'neutral'}>{info.atCap ? 'AT CAP' : 'IN PROGRESS'}</Status></div> })}</div>
      <p className="muted">Use Spells &amp; Schools for direct level, rank, and access controls.</p>
    </Card>
    <Card title="GUILD · Status">
      <div className="developer-summary-grid"><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Guild Points" value={`${getGuildPointsAvailable(state)} available / ${progress.guildPointsEarned} earned`} /></div>
      <div className="developer-button-grid"><Button variant="secondary" onClick={state.promoteGuild}>Promote if legal</Button><Button variant="ghost" onClick={() => state.debugGrantGuildPoint(1)}>Grant 1 GP</Button><NumberField label="Guild reputation" value={progress.guildReputation} onChange={state.setGuildReputation} /></div>
      <div className="developer-owned-list">{flags.map((flag) => <span key={flag.label}>{flag.label}<strong>{flag.value ? 'ON' : 'OFF'}</strong></span>)}</div>
    </Card>
    <Card title="CHRONICLES · Tester controls">
      <div className="developer-summary-grid"><Summary label="Completed" value={`${chronicleComplete} / ${CHRONICLE_OBJECTIVES.length}`} /><Summary label="Next main" value={chronicleObjective?.title ?? 'Complete'} /><Summary label="Events" value={Object.values(progress.chronicle.eventFlags).filter(Boolean).length} /></div>
      <div className="developer-button-grid"><Button variant="secondary" onClick={state.debugReconcileChronicles}>Reconcile evidence</Button><Button variant="ghost" onClick={() => state.debugSetChronicleEvent('first-fragment-transmuted', true)}>Mark Fragment event</Button><Button variant="ghost" onClick={() => state.debugSetChronicleEvent('first-research-batch-completed', true)}>Mark Research event</Button></div>
    </Card>
  </div>
}
