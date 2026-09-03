import { Button, Card, Status } from '../../components/ui'
import { SCHOOLS } from '../../game/content/schools/schools'
import { formatDuration, formatNumber } from '../../game/content/presentation/balanceFormatters'
import { getSchoolLevelStartXp } from '../../game/systems/schools'
import { formatSpellRank, getAllSpellsInOrder, getSpellAutoCastFocusCost, getAutoCastFocusCostForRank, getSpellRank } from '../../game/systems/spells'
import type { SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

export function DeveloperSchools() {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const setSchoolDebug = useGameStore((state) => state.setSchoolDebug)
  const setLevelCap = useGameStore((state) => state.setLevelCap)
  const unlockAll = useGameStore((state) => state.unlockAllSpells)
  const debugUnlock = useGameStore((state) => state.debugUnlockSpellRankOne)
  const debugLock = useGameStore((state) => state.debugLockSpell)
  const resetCooldowns = useGameStore((state) => state.resetSpellCooldowns)
  const schoolIds = Object.keys(SCHOOLS) as SchoolId[]
  const setAllLevels = (level: number) => { if (level > progress.magicLevelCap) setLevelCap(level); schoolIds.forEach((id) => setSchoolDebug(id, getSchoolLevelStartXp(level), level)) }

  return <div className="developer-tab-grid">
    <Card title="Magic schools">
      <div className="developer-school-list">{schoolIds.map((id) => <div className="developer-school-row" key={id}><span className="school-glyph" style={{ color: SCHOOLS[id].color }}>{SCHOOLS[id].glyph}</span><div><strong>{SCHOOLS[id].name}</strong><small>Level {schools[id].level} · {formatNumber(schools[id].xp)} XP · {getAllSpellsInOrder().filter((spell) => spell.school === id && getSpellRank({ progress }, spell.id) !== null).length} spells known</small></div><NumberField label="XP" value={schools[id].xp} onChange={(value) => setSchoolDebug(id, value, schools[id].level)} /><NumberField label="Level" value={schools[id].level} onChange={(value) => setSchoolDebug(id, schools[id].xp, value)} /></div>)}</div>
    </Card>
    <Card title="School controls">
      <div className="developer-button-grid"><Button variant="secondary" onClick={() => setAllLevels(2)}>Set all to Level 2</Button><Button variant="secondary" onClick={() => setAllLevels(8)}>Set all to Level 8</Button><Button variant="secondary" onClick={() => setAllLevels(16)}>Set all to Level 16</Button><Button variant="secondary" onClick={() => setAllLevels(20)}>Set all to Level 20</Button><Button variant="success" onClick={unlockAll}>Unlock all Rank-I spells</Button><Button variant="ghost" onClick={resetCooldowns}>Reset spell cooldowns</Button></div>
      <div className="developer-button-grid"><Button variant="secondary" onClick={() => setLevelCap(20)}>Set cap to 20</Button><Button variant="secondary" onClick={() => setLevelCap(40)}>Set cap to 40</Button></div><NumberField label="Magic School level cap" value={progress.magicLevelCap} onChange={setLevelCap} />
    </Card>
    <Card title="Spell access">
      <div className="developer-spell-list">{getAllSpellsInOrder().map((spell) => { const rank = getSpellRank({ progress }, spell.id); const focusCost = getSpellAutoCastFocusCost({ progress }, spell.id); return <div className="developer-spell-row" key={spell.id}><div><strong>{spell.name}</strong><small>{SCHOOLS[spell.school].name} · unlocks at Level {spell.unlockLevel} · {rank ? formatSpellRank(rank) : 'Locked'} · {spell.manaCost} Mana · {formatDuration(spell.cooldownMs)} cooldown · Auto-Cast: {focusCost === null ? 'unavailable' : `${focusCost} Focus`}</small></div><Status tone={rank ? 'success' : 'locked'}>{rank ? 'UNLOCKED' : 'LOCKED'}</Status><Button variant="ghost" onClick={() => debugUnlock(spell.id)}>Unlock Rank I</Button><Button variant="danger" onClick={() => debugLock(spell.id)} disabled={!rank}>Lock spell</Button></div> })}</div>
    </Card>
    <Card title="Auto-Cast Focus costs"><div className="developer-rank-table">{([1, 2, 3, 4, 5, 6, 7, 8] as const).map((rank) => <span key={rank}><strong>{formatSpellRank(rank)}</strong><small>{getAutoCastFocusCostForRank(rank)} Focus</small></span>)}</div><p className="muted">Higher-rank mechanics and player-facing advancement are deferred to a future Tower system.</p></Card>
  </div>
}
