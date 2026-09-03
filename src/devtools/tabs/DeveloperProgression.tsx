import { Button, Card, Status } from '../../components/ui'
import { DUNGEONS, DUNGEON_ORDER, isDungeonCompleted, isDungeonUnlocked, isTutorialCompleted } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { MONSTER_IDS, isBossMonster, MONSTERS } from '../../game/content/monsters'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { getSpellRank } from '../../game/systems/spells'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import type { DeveloperFixtureId } from '../../store/gameStore'
import { useGameStore } from '../../store/gameStore'
import { NumberField, Summary } from './DeveloperTabPrimitives'

const schoolIds = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>
const fixtureIds: readonly { id: DeveloperFixtureId; label: string }[] = [{ id: 'fresh', label: 'Fresh Game' }, { id: 'whispering-woods-ready', label: 'Whispering Woods Ready' }, { id: 'howling-den-ready', label: 'Howling Ready' }, { id: 'catacombs-ready', label: 'Catacombs Ready' }, { id: 'edrin-ready', label: 'Edrin Ready' }]

export function DeveloperProgression() {
  const state = useGameStore()
  const { progress } = state
  const totalBosses = MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredBosses = progress.discoveredMonsters.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredEquipment = progress.discoveredItems.filter((id) => ITEMS[id]?.kind === 'equipment').length
  const flags = [{ label: 'First dungeon boss defeated', value: progress.firstBossKill }, { label: 'Final boss defeated', value: progress.firstMainBossKill }, { label: 'Guild unlocked', value: progress.guildUnlocked }, { label: 'Ember Staff recipe unlocked', value: progress.emberStaffUnlocked }, { label: 'Forest Heart unlocked', value: progress.forestHeartUnlocked }, { label: 'Auto Hunt unlocked', value: progress.autoHuntBossUnlocked }]

  return <div className="developer-tab-grid">
    <Card title="DUNGEONS · Progression dashboard"><div className="developer-summary-grid">{DUNGEON_ORDER.map((id) => <Summary key={id} label={DUNGEONS[id].name} value={isDungeonUnlocked(DUNGEONS[id], progress) ? isDungeonCompleted(id, progress) ? 'Complete' : 'Unlocked' : 'Locked'} />)}<Summary label="Tutorial" value={isTutorialCompleted(progress) ? 'Complete' : 'Incomplete'} /><Summary label="Normal kills" value={progress.lifetimeKills} /><Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} /><Summary label="Discovered monsters" value={`${progress.discoveredMonsters.length} / ${MONSTER_IDS.length}`} /><Summary label="Discovered bosses" value={`${discoveredBosses} / ${totalBosses}`} /><Summary label="Discovered equipment" value={`${discoveredEquipment} / ${Object.values(ITEMS).filter((item) => item.kind === 'equipment').length}`} /></div></Card>
    <Card title="MAGIC · School unlocks and levels"><div className="developer-research-school-list">{schoolIds.map((schoolId) => { const info = getSchoolProgressInfo(state, schoolId); const spellCount = Object.values(SPELLS).filter((spell) => spell.school === schoolId && getSpellRank(state, spell.id) !== null).length; return <div className="developer-research-school" key={schoolId}><div><strong>{SCHOOLS[schoolId].name}</strong><small>Level {info.level} / {info.cap} · {info.xp} XP · {spellCount} unlocked spells</small></div><Status tone={info.atCap ? 'warning' : info.level > 1 ? 'success' : 'neutral'}>{info.atCap ? 'AT CAP' : 'IN PROGRESS'}</Status></div> })}</div><p className="muted">Use Spells &amp; Schools for direct level, rank, and access controls.</p></Card>
    <Card title="GUILD · Status"><div className="developer-summary-grid"><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Permanent Focus" value={Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)} /></div><div className="developer-button-grid"><Button variant="secondary" onClick={state.promoteGuild}>Promote if legal</Button><NumberField label="Guild reputation" value={progress.guildReputation} onChange={state.setGuildReputation} /></div><div className="developer-owned-list">{flags.map((flag) => <span key={flag.label}>{flag.label}<strong>{flag.value ? 'ON' : 'OFF'}</strong></span>)}</div></Card>
    <Card title="FIXTURES · Coherent progression states" className="developer-debug-card"><p className="muted">Each fixture resets gameplay to a known test stage and derives dungeon readiness from the authored unlock chain.</p><div className="developer-button-grid">{fixtureIds.map((fixture) => <Button key={fixture.id} variant={fixture.id === 'fresh' ? 'danger' : 'secondary'} onClick={() => { if (fixture.id === 'fresh' && !window.confirm('Replace the current gameplay state with a Fresh Game fixture?')) return; state.applyDeveloperFixture(fixture.id) }}>{fixture.label}</Button>)}<Button variant="secondary" onClick={() => state.preset('research')}>Research activity</Button><Button variant="secondary" onClick={() => state.preset('combat')}>Combat activity</Button></div></Card>
  </div>
}
