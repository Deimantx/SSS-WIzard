import { Flame, Mountain, Sparkles, Waves } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import { getStartingSchoolPreview } from '../../game/presentation/onboarding/startingSchoolPreview'
import { formatEquipmentStat, getEquipmentStatLabel, isMeaningfulEquipmentStatValue } from '../../game/presentation/equipment/equipmentStatPresentation'
import type { SchoolId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { ItemIcon } from '../../components/ui/item'

const SCHOOL_ICONS: Record<SchoolId, typeof Flame> = { fire: Flame, water: Waves, earth: Mountain, air: Sparkles }
const SCHOOL_ORDER: SchoolId[] = ['fire', 'water', 'earth', 'air']

export function StartingSchoolScreen() {
  const state = useGameStore()
  const chooseStartingSchool = state.chooseStartingSchool
  return <main className="starting-school-screen screen-content"><div className="starting-school-backdrop" /><section className="starting-school-content"><span className="eyebrow">THE FIRST ATTUNEMENT</span><h1>Choose your school</h1><p className="starting-school-lede">The Tower will shape itself around one discipline. Your choice sets that school to Level 10, equips its Rank-0 artifact, and prepares three auto-cast spells. Other schools begin at Level 1 with their first spell available.</p><div className="starting-school-grid">{SCHOOL_ORDER.map((schoolId) => <StartingSchoolCard key={schoolId} schoolId={schoolId} onChoose={() => chooseStartingSchool(schoolId)} state={state} />)}</div><div className="starting-school-note"><strong>YOUR FIRST LOOP</strong><span>Fight independently → assign Acolytes → build Arcane Flux → fund Research and Transmutation.</span></div></section></main>
}

function StartingSchoolCard({ schoolId, onChoose, state }: { schoolId: SchoolId; onChoose: () => void; state: ReturnType<typeof useGameStore.getState> }) {
  const school = SCHOOLS[schoolId]
  const Icon = SCHOOL_ICONS[schoolId]
  const preview = getStartingSchoolPreview(state, schoolId)
  const stats = Object.entries(preview.artifactStats).filter(([, value]) => isMeaningfulEquipmentStatValue(value)).map(([key, value]) => `${getEquipmentStatLabel(key)} ${formatEquipmentStat(key, value)}`)
  return <Card className="starting-school-card"><div className="starting-school-card-heading"><div className="starting-school-card-icon" style={{ color: school.color }}><Icon size={26} /></div><div><span className="eyebrow">{school.name.toUpperCase()} SCHOOL</span><h2>{school.tagline}</h2></div></div><section className="starting-school-artifact"><span className="starting-school-section-label">STARTER ARTIFACT · RANK 0</span><div className="starting-school-artifact-row"><span className="starting-school-artifact-icon" style={{ color: school.color }}><ItemIcon itemId={preview.artifactId} size="tile" /></span><div><strong>{preview.artifactName}</strong><div className="starting-school-stat-list">{stats.map((stat) => <span key={stat}>{stat}</span>)}</div></div></div></section><section className="starting-school-spells"><span className="starting-school-section-label">STARTING SPELLS · 3 AUTO-CAST</span><div className="starting-school-spell-list">{preview.spells.map((spell) => <div className="starting-school-spell" key={spell.id}><div className="starting-school-spell-heading"><strong>{spell.name}</strong><span>{spell.detail.manaCost} MANA</span></div><div className="starting-school-effect-rows">{spell.effectRows.filter((row) => row.label !== 'Target' && row.label !== 'Source' && row.label !== 'Damage Type').map((row, index) => <span key={`${row.label}-${index}`}><b>{row.label}</b> {row.value}</span>)}</div><small>{spell.detail.castTimeLabel} CAST · {spell.detail.cooldownLabel} COOLDOWN · {spell.description}</small></div>)}</div></section><GameTooltip content={<TooltipContent title={`Attune to ${school.name}`} description="This choice is permanent for the profile. You can still study every other school through Research." />}><Button variant="secondary" onClick={onChoose}>CHOOSE {school.name.toUpperCase()}</Button></GameTooltip></Card>
}
