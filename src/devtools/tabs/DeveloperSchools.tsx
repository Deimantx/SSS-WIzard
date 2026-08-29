import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/data/schools'
import { SCHOOL_LEVEL_XP } from '../../game/core/balance/balance'
import { formatSpellRank, getAllSpellsInOrder, getSpellAutoCastFocusCost, getSpellRank } from '../../game/systems/spells'
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
  const setAllLevels = (level: number) => { if (level > progress.magicLevelCap) setLevelCap(level); (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, SCHOOL_LEVEL_XP(level), level)) }
  return <div className="developer-tab-grid">
    <Card title="Magic schools"><div className="developer-school-list">{(Object.keys(SCHOOLS) as SchoolId[]).map((id) => <div className="developer-school-row" key={id}><span className="school-glyph" style={{ color: SCHOOLS[id].color }}>{SCHOOLS[id].glyph}</span><div><strong>{SCHOOLS[id].name}</strong><small>Level {schools[id].level} · {schools[id].xp} XP · {getAllSpellsInOrder().filter((spell) => spell.school === id && getSpellRank({ progress }, spell.id) !== null).length} Rank-I spells known</small></div><NumberField label="XP" value={schools[id].xp} onChange={(value) => setSchoolDebug(id, value, schools[id].level)} /><NumberField label="Level" value={schools[id].level} onChange={(value) => setSchoolDebug(id, schools[id].xp, value)} /></div>)}</div></Card>
    <Card title="School controls"><div className="developer-button-grid"><Button variant="secondary" onClick={() => setAllLevels(2)}>Set all Lv2</Button><Button variant="secondary" onClick={() => setAllLevels(8)}>Set all Lv8</Button><Button variant="secondary" onClick={() => setAllLevels(16)}>Set all Lv16</Button><Button variant="secondary" onClick={() => setAllLevels(20)}>Set all Lv20</Button><Button variant="secondary" onClick={() => setAllLevels(40)}>Set all Lv40</Button><Button variant="success" onClick={unlockAll}>Unlock all Rank I spells</Button><Button variant="ghost" onClick={resetCooldowns} tooltip={<TooltipContent title="Reset spell cooldowns" description="Clear every combat spell cooldown for testing." />}>Reset spell cooldowns</Button></div><div className="developer-button-grid"><Button variant="secondary" onClick={() => setLevelCap(20)}>Cap 20</Button><Button variant="secondary" onClick={() => setLevelCap(40)}>Cap 40</Button></div><NumberField label="Magic School cap" value={progress.magicLevelCap} onChange={setLevelCap} /></Card>
    <Card title="Spell inspector"><div className="developer-spell-list">{getAllSpellsInOrder().map((spell) => { const rank = getSpellRank({ progress }, spell.id); const cost = getSpellAutoCastFocusCost({ progress }, spell.id); return <GameTooltip key={spell.id} block accent={rank ? 'elemental' : 'warning'} content={<TooltipContent title={`${spell.name} · ${rank ? formatSpellRank(rank) : 'Locked'}`} description={spell.description}><div className="tooltip-section"><small>CASTING</small><p>{spell.manaCost} Mana · {spell.cooldownMs}ms cooldown · {cost === null ? 'Locked' : `${cost} Focus Auto-Cast`}</p></div></TooltipContent>}><div className="developer-spell-row"><div><strong>{spell.name}</strong><small>{SCHOOLS[spell.school].name} · Unlock Lv{spell.unlockLevel} · {rank ? formatSpellRank(rank) : 'LOCKED'} · {spell.manaCost} Mana · {cost ?? '—'} Focus</small></div><Status tone={rank ? 'success' : 'locked'}>{rank ? formatSpellRank(rank) : 'LOCKED'}</Status><Button variant="ghost" onClick={() => debugUnlock(spell.id)}>Unlock Rank I</Button><Button variant="danger" onClick={() => debugLock(spell.id)} disabled={!rank}>Lock Spell</Button></div></GameTooltip> })}</div></Card>
    <Card title="Rank Focus reference"><div className="developer-rank-table">{([1, 2, 3, 4, 5, 6, 7, 8] as const).map((rank) => <span key={rank}><strong>{formatSpellRank(rank)}</strong><small>{rank * 10} Focus</small></span>)}</div><p className="muted">Higher-rank mechanics and player-facing advancement are deferred to a future Tower system.</p></Card>
  </div>
}
