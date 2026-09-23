import { getSchoolProgressInfo } from '../../game/systems/schools/schoolProgression'
import { getSpellRank } from '../../game/systems/spells'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { GameState, SchoolId } from '../../game/types'
import { Progress } from '../../components/ui'

export function SchoolProgressOverview({ state, schoolId }: { state: Pick<GameState, 'schools' | 'progress'>; schoolId: SchoolId }) {
  const school = SCHOOLS[schoolId]
  const info = getSchoolProgressInfo(state, schoolId)
  const nextSpell = Object.values(SPELLS).filter((spell) => spell.school === schoolId && getSpellRank(state, spell.id) === null && spell.unlockLevel > info.level).sort((left, right) => left.unlockLevel - right.unlockLevel)[0]
  const xpLabel = new Intl.NumberFormat('en-US').format(info.xp)
  const nextXpLabel = info.nextLevelXp === null ? 'MASTERED' : `${new Intl.NumberFormat('en-US').format(info.nextLevelXp)} XP`
  return <section className="school-progress-overview" style={{ '--school-accent': school.color } as React.CSSProperties}>
    <div className="school-progress-identity"><span className="school-progress-glyph" aria-hidden="true">{school.glyph}</span><div><div className="panel-kicker">SELECTED SCHOOL</div><h2>{school.name} School</h2><p>{school.tagline}</p></div></div>
    <div className="school-progress-level"><small>LEVEL</small><strong>{info.level}</strong><span>CAP {info.cap}</span></div>
    <div className="school-progress-track"><Progress value={info.progress * 100} tone="schools" label="SCHOOL XP" right={`${xpLabel} / ${nextXpLabel}`} /><span>{info.atCap ? 'School mastery ceiling reached.' : `${new Intl.NumberFormat('en-US').format(Math.max(0, info.nextLevelXp! - info.xp))} XP to next level`}</span></div>
    <div className="school-progress-unlock"><small>NEXT UNLOCK</small><strong>{nextSpell ? nextSpell.name : info.atCap ? 'All school levels mastered' : 'No authored spell at the next threshold'}</strong>{nextSpell && <span>School Level {nextSpell.unlockLevel}</span>}</div>
  </section>
}
