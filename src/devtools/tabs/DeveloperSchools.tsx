import { Button, Card, Status } from '../../components/ui'
import { SCHOOLS } from '../../game/content/schools/schools'
import { formatDuration, formatNumber } from '../../game/content/presentation/balanceFormatters'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { formatSpellRank, getAllSpellsInOrder, getSpellAutoCastFocusCost, getAutoCastFocusCostForRank, getSpellRank } from '../../game/systems/spells'
import type { SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

export function DeveloperSchools() {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const setSchoolXpDebug = useGameStore((state) => state.setSchoolXpDebug)
  const setSchoolLevelDebug = useGameStore((state) => state.setSchoolLevelDebug)
  const setLevelCap = useGameStore((state) => state.setLevelCap)
  const unlockAll = useGameStore((state) => state.unlockAllSpells)
  const debugUnlock = useGameStore((state) => state.debugUnlockSpellRankOne)
  const debugLock = useGameStore((state) => state.debugLockSpell)
  const resetCooldowns = useGameStore((state) => state.resetSpellCooldowns)
  const schoolIds = Object.keys(SCHOOLS) as SchoolId[]
  const setAllLevels = (level: number) => { if (level > progress.magicLevelCap) setLevelCap(level); schoolIds.forEach((id) => setSchoolLevelDebug(id, level)) }

  return <div className="developer-tab-grid">
    <Card title="Magic schools">
      <div className="developer-school-list">{schoolIds.map((id) => { const info = getSchoolProgressInfo({ schools, progress }, id); const knownSpells = getAllSpellsInOrder().filter((spell) => spell.school === id && getSpellRank({ progress }, spell.id)).length; const totalSpells = getAllSpellsInOrder().filter((spell) => spell.school === id).length; const nextRemaining = info.nextLevelXp === null ? 'At cap' : `${formatNumber(info.nextLevelXp - info.xp)} XP remaining`; return <div className="developer-school-row" key={id}><span className="school-glyph" style={{ color: SCHOOLS[id].color }}>{SCHOOLS[id].glyph}</span><div><strong>{SCHOOLS[id].name}</strong><small>Level {info.level} / {info.cap} · Total XP {formatNumber(info.xp)} · {knownSpells} / {totalSpells} spells known</small><small>Current level: {formatNumber(info.xpIntoLevel)} / {formatNumber(info.xpRequiredForLevel ?? 0)} XP · Progress {Math.round(info.progress * 100)}% · {nextRemaining}</small><div className="button-row">{info.nextLevelXp === null ? <span className="muted">At level cap</span> : <Button variant="ghost" onClick={() => setSchoolLevelDebug(id, info.level + 1)}>Set next level</Button>}</div></div><NumberField label="XP" value={schools[id].xp} onChange={(value) => setSchoolXpDebug(id, value)} /><NumberField label="Level" value={schools[id].level} onChange={(value) => setSchoolLevelDebug(id, value)} /></div> })}</div>
    </Card>
    <Card title="School controls">
      <div className="developer-button-grid"><Button variant="secondary" onClick={() => setAllLevels(2)}>Set all to Level 2</Button><Button variant="secondary" onClick={() => setAllLevels(8)}>Set all to Level 8</Button><Button variant="secondary" onClick={() => setAllLevels(16)}>Set all to Level 16</Button><Button variant="secondary" onClick={() => setAllLevels(20)}>Set all to Level 20</Button><Button variant="secondary" onClick={() => setAllLevels(40)}>Set all to Level 40</Button><Button variant="success" onClick={unlockAll}>Unlock all Rank-I spells</Button><Button variant="ghost" onClick={resetCooldowns}>Reset spell cooldowns</Button></div>
      <div className="developer-button-grid"><Button variant="secondary" onClick={() => setLevelCap(20)}>Set cap to 20</Button><Button variant="secondary" onClick={() => setLevelCap(40)}>Set cap to 40</Button></div><NumberField label="Magic School level cap" value={progress.magicLevelCap} onChange={setLevelCap} />
    </Card>
    <Card title="Spell access">
      <div className="developer-spell-list">{getAllSpellsInOrder().map((spell) => { const rank = getSpellRank({ progress }, spell.id); const focusCost = getSpellAutoCastFocusCost({ progress }, spell.id); return <div className="developer-spell-row" key={spell.id}><div><strong>{spell.name}</strong><small>{SCHOOLS[spell.school].name} · unlocks at Level {spell.unlockLevel} · {rank ? formatSpellRank(rank) : 'Locked'} · {spell.manaCost} Mana · {formatDuration(spell.cooldownMs)} cooldown · Auto-Cast: {focusCost === null ? 'unavailable' : `${focusCost} Focus`}</small></div><Status tone={rank ? 'success' : 'locked'}>{rank ? 'UNLOCKED' : 'LOCKED'}</Status><Button variant="ghost" onClick={() => debugUnlock(spell.id)}>Unlock Rank I</Button><Button variant="danger" onClick={() => debugLock(spell.id)} disabled={!rank}>Lock spell</Button></div> })}</div>
    </Card>
    <Card title="Auto-Cast Focus costs"><div className="developer-rank-table">{([1, 2, 3, 4, 5, 6, 7, 8] as const).map((rank) => <span key={rank}><strong>{formatSpellRank(rank)}</strong><small>{getAutoCastFocusCostForRank(rank)} Focus</small></span>)}</div><p className="muted">Higher-rank mechanics and player-facing advancement are deferred to a future Tower system.</p></Card>
  </div>
}
