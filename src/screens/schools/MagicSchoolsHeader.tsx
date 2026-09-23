import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS, FRAGMENT_ORDER } from '../../game/content/schools/schools'
import type { GameState, SchoolId } from '../../game/types'

export function MagicSchoolsHeader({ schools, selectedSchool, onSelect }: { schools: GameState['schools']; selectedSchool: SchoolId; onSelect: (schoolId: SchoolId) => void }) {
  return <section className="schools-hero" style={{ '--school-accent': SCHOOLS[selectedSchool].color } as React.CSSProperties}>
    <div className="schools-hero-copy">
      <div className="eyebrow">ARCANE DISCIPLINES · ELEMENTAL MASTERY</div>
      <h1>Magic Schools</h1>
      <p>Master elemental schools, unlock spells and prepare your combat loadout.</p>
    </div>
    <div className="school-selector" role="tablist" aria-label="Magic school selector">
      {FRAGMENT_ORDER.map((schoolId) => {
        const school = SCHOOLS[schoolId]
        const selected = schoolId === selectedSchool
        return <GameTooltip key={schoolId} block content={<TooltipContent title={`${school.name} School`} description={school.tagline} />}>
          <button type="button" role="tab" aria-selected={selected} className={`school-selector-item${selected ? ' is-selected' : ''}`} style={{ '--school-accent': school.color } as React.CSSProperties} onClick={() => onSelect(schoolId)}>
            <span className="school-selector-glyph" aria-hidden="true">{school.glyph}</span>
            <span className="school-selector-copy"><strong>{school.name.toUpperCase()}</strong><small>LV. {schools[schoolId]?.level ?? 1}</small></span>
          </button>
        </GameTooltip>
      })}
    </div>
  </section>
}
