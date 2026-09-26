import { Flame, Mountain, Sparkles, Waves } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { SpellIcon } from '../../components/spells/SpellIcon'
import { ItemIcon } from '../../components/ui/item'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getStartingSchoolPreview } from '../../game/presentation/onboarding/startingSchoolPreview'
import type { SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

const SCHOOL_ICONS: Record<SchoolId, typeof Flame> = { fire: Flame, water: Waves, earth: Mountain, air: Sparkles }
const SCHOOL_ORDER: SchoolId[] = ['fire', 'water', 'earth', 'air']

export function StartingSchoolScreen() {
  const chooseStartingSchool = useGameStore((state) => state.chooseStartingSchool)
  return <main className="starting-school-screen screen-content"><div className="starting-school-backdrop" /><section className="starting-school-content"><span className="eyebrow">THE FIRST ATTUNEMENT</span><h1>Choose your school</h1><p className="starting-school-lede">The Tower will shape itself around one discipline. Your choice sets that school to Level 10, equips its Rank-0 artifact, and prepares three auto-cast spells. Other schools begin at Level 1 with their first spell available.</p><div className="starting-school-grid">{SCHOOL_ORDER.map((schoolId) => <StartingSchoolCard key={schoolId} schoolId={schoolId} onChoose={() => chooseStartingSchool(schoolId)} />)}</div><div className="starting-school-note"><strong>YOUR FIRST LOOP</strong><span>Fight independently → assign Acolytes → build Arcane Flux → fund Research and Transmutation.</span></div><p className="starting-school-permanence">Your starting school is permanent for this profile. Other schools remain available through progression.</p></section></main>
}

function StartingSchoolCard({ schoolId, onChoose }: { schoolId: SchoolId; onChoose: () => void }) {
  const school = SCHOOLS[schoolId]
  const SchoolIcon = SCHOOL_ICONS[schoolId]
  const preview = getStartingSchoolPreview(schoolId)
  return <Card className={`starting-school-card school-${schoolId}`} style={{ '--starting-school-color': school.color } as React.CSSProperties}><div className="starting-school-card-heading"><div className="starting-school-card-icon" aria-hidden="true"><SchoolIcon size={26} /></div><div><span className="starting-school-card-eyebrow">{school.name.toUpperCase()} SCHOOL</span><h2>{school.tagline}</h2></div></div><section className="starting-school-artifact"><span className="starting-school-section-label">STARTER ARTIFACT</span><div className="starting-school-artifact-row"><span className="starting-school-artifact-icon"><ItemIcon itemId={preview.artifactId} size="tile" /></span><strong>{preview.artifactName}</strong></div></section><section className="starting-school-spells"><span className="starting-school-section-label">STARTING SPELLS</span><div className="starting-school-spell-list">{preview.spells.map((spell) => <div className="starting-school-spell" key={spell.id}><SpellIcon school={spell.school} spellId={spell.id} size="small" /><strong>{spell.name}</strong></div>)}</div></section><Button variant="secondary" className="starting-school-choice" onClick={onChoose}>CHOOSE {school.name.toUpperCase()}</Button></Card>
}
