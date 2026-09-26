import { Flame, Mountain, Sparkles, Waves } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'

const SCHOOL_ICONS: Record<SchoolId, typeof Flame> = { fire: Flame, water: Waves, earth: Mountain, air: Sparkles }
const SCHOOL_ORDER: SchoolId[] = ['fire', 'water', 'earth', 'air']

export function StartingSchoolScreen() {
  const chooseStartingSchool = useGameStore((state) => state.chooseStartingSchool)
  return <main className="starting-school-screen screen-content"><div className="starting-school-backdrop" /><section className="starting-school-content"><span className="eyebrow">THE FIRST ATTUNEMENT</span><h1>Choose your school</h1><p className="starting-school-lede">The Tower will shape itself around one discipline. Your choice sets your first school to Level 10, awakens its first two spells, and places its starter artifact in your hand.</p><div className="starting-school-grid">{SCHOOL_ORDER.map((schoolId) => { const school = SCHOOLS[schoolId]; const Icon = SCHOOL_ICONS[schoolId]; return <Card key={schoolId} className="starting-school-card"><div className="starting-school-card-icon" style={{ color: school.color }}><Icon size={26} /></div><span className="eyebrow">{school.name.toUpperCase()} SCHOOL</span><h2>{school.tagline}</h2><p>Begin with the {school.name.toLowerCase()} starter artifact and a focused combat loadout.</p><GameTooltip content={<TooltipContent title={`Attune to ${school.name}`} description="This choice is permanent for the profile. You can still study every other school through Research." />}><Button variant="secondary" onClick={() => chooseStartingSchool(schoolId)}>CHOOSE {school.name.toUpperCase()}</Button></GameTooltip></Card> })}</div><div className="starting-school-note"><strong>YOUR FIRST LOOP</strong><span>Fight independently → assign Acolytes → build Arcane Flux → fund Research and Transmutation.</span></div></section></main>
}

