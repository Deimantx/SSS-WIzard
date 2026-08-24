import { Button, Card } from '../../components/ui'
import { SCHOOLS } from '../../game/data/schools'
import { SPELLS } from '../../game/data/spells'
import type { SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { NumberField } from './DeveloperTabPrimitives'

export function DeveloperSchools() {
  const schools = useGameStore((state) => state.schools)
  const cap = useGameStore((state) => state.progress.magicLevelCap)
  const setSchoolDebug = useGameStore((state) => state.setSchoolDebug)
  const setLevelCap = useGameStore((state) => state.setLevelCap)
  const unlockAll = useGameStore((state) => state.unlockAllSpells)
  return <div className="developer-tab-grid"><Card title="Magic schools"><div className="developer-school-list">{(Object.keys(SCHOOLS) as SchoolId[]).map((id) => <div className="developer-school-row" key={id}><span className="school-glyph" style={{ color: SCHOOLS[id].color }}>{SCHOOLS[id].glyph}</span><div><strong>{SCHOOLS[id].name}</strong><small>Level {schools[id].level}  -  {schools[id].xp} XP  -  {Object.values(SPELLS).filter((spell) => spell.school === id && schools[id].level >= spell.unlockLevel).length} spells available</small></div><NumberField label="XP" value={schools[id].xp} onChange={(value) => setSchoolDebug(id, value, schools[id].level)} /><NumberField label="Level" value={schools[id].level} onChange={(value) => setSchoolDebug(id, schools[id].xp, value)} /></div>)}</div></Card><Card title="School controls"><div className="developer-button-grid"><Button variant="secondary" onClick={() => (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, 20, 2))}>Set all Lv2</Button><Button variant="secondary" onClick={() => (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, 80, 4))}>Set all Lv4</Button><Button variant="secondary" onClick={() => (Object.keys(SCHOOLS) as SchoolId[]).forEach((id) => setSchoolDebug(id, 180, 10))}>Set all Lv10</Button><Button variant="success" onClick={unlockAll}>Unlock all spells</Button></div><NumberField label="Magic School cap" value={cap} onChange={setLevelCap} /></Card></div>
}
