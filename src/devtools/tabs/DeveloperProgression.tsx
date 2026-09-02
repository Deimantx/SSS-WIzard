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

const schoolIds = Object.keys(SCHOOLS) as Array<keyof typeof SCHOOLS>

export function DeveloperProgression() {
  const state = useGameStore()
  const { progress } = state
  const runPreset = (name: Parameters<typeof state.preset>[0]) => {
    if (name === 'chapter-complete' && !window.confirm('Replace the current gameplay state with the Chapter Complete DEV FIXTURE?')) return
    state.preset(name)
  }
  const totalBosses = MONSTER_IDS.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredBosses = progress.discoveredMonsters.filter((id) => isBossMonster(MONSTERS[id])).length
  const discoveredEquipment = progress.discoveredItems.filter((id) => ITEMS[id]?.kind === 'equipment').length

  return <div className="developer-tab-grid">
    <Card title="Progression dashboard"><div className="developer-summary-grid">{DUNGEON_ORDER.map((id) => <Summary key={id} label={DUNGEONS[id].name} value={isDungeonUnlocked(DUNGEONS[id], progress) ? isDungeonCompleted(id, progress) ? 'Complete' : `${progress.bossKillsByBoss[DUNGEONS[id].boss] ?? 0} boss kills` : 'Locked'} />)}<Summary label="Tutorial" value={isTutorialCompleted(progress) ? 'Complete' : 'Incomplete'} /><Summary label="Guild" value={progress.guildUnlocked ? 'Unlocked' : 'Locked'} /><Summary label="Rank" value={progress.guildRank} /><Summary label="Reputation" value={progress.guildReputation} /><Summary label="Normal kills" value={progress.lifetimeKills} /><Summary label="Boss kills" value={Object.values(progress.bossKillsByBoss).reduce((sum, value) => sum + (value ?? 0), 0)} /><Summary label="Discovered monsters" value={`${progress.discoveredMonsters.length} / ${MONSTER_IDS.length}`} /><Summary label="Discovered bosses" value={`${discoveredBosses} / ${totalBosses}`} /><Summary label="Discovered equipment" value={`${discoveredEquipment} / ${Object.values(ITEMS).filter((item) => item.kind === 'equipment').length}`} /><Summary label="Permanent Focus" value={Object.values(progress.permanentFocusBonuses).reduce((sum, value) => sum + value, 0)} /></div></Card>

    <Card title="Magic School unlocks and levels"><div className="developer-research-school-list">{schoolIds.map((schoolId) => { const info = getSchoolProgressInfo(state, schoolId); const schoolSpells = Object.values(SPELLS).filter((spell) => spell.school === schoolId && getSpellRank(state, spell.id) !== null).length; return <div className="developer-research-school" key={schoolId}><div><strong>{SCHOOLS[schoolId].name}</strong><small>Level {info.level} / {info.cap} · {info.xp} XP · {schoolSpells} unlocked spells</small></div><Status tone={info.atCap ? 'warning' : info.level > 1 ? 'success' : 'neutral'}>{info.atCap ? 'AT CAP' : 'IN PROGRESS'}</Status></div> })}</div><p className="muted">Spell ranks remain in the authored progression state; use the Spells and Schools tabs for direct DEV controls.</p></Card>

    <Card title="Major unlock flags"><div className="developer-owned-list">{[['firstBossKill', progress.firstBossKill], ['firstMainBossKill', progress.firstMainBossKill], ['guildUnlocked', progress.guildUnlocked], ['emberStaffUnlocked', progress.emberStaffUnlocked], ['forestHeartUnlocked', progress.forestHeartUnlocked], ['autoHuntBossUnlocked', progress.autoHuntBossUnlocked]].map(([id, enabled]) => <span key={String(id)}><code>{id}</code><strong>{enabled ? 'ON' : 'OFF'}</strong></span>)}</div></Card>

    <Card title="DEV FIXTURE progression presets" className="developer-debug-card"><p className="muted">These existing store fixtures replace the current gameplay state for testing. They are not save defaults or migration data.</p><div className="developer-button-grid"><Button variant="secondary" onClick={() => runPreset('fresh')}>Fresh Game</Button><Button variant="secondary" onClick={() => runPreset('research')}>Research setup</Button><Button variant="secondary" onClick={() => runPreset('combat')}>Combat setup</Button><Button variant="secondary" onClick={() => runPreset('boss')}>Forest Heart ready</Button><Button variant="secondary" onClick={() => runPreset('guild')}>Guild unlocked</Button><Button variant="danger" onClick={() => runPreset('chapter-complete')}>Chapter complete</Button></div><div className="button-row"><NumberField label="Guild reputation" value={progress.guildReputation} onChange={state.setGuildReputation} /><Button variant="secondary" onClick={state.promoteGuild}>Promote if legal</Button></div></Card>
  </div>
}
