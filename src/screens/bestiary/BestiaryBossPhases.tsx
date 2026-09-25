import { useMemo } from 'react'
import type { MonsterDefinition } from '../../game/content/monsters'
import { buildBestiaryBossPhases } from '../../game/presentation/bestiary/bestiaryPresentation'
import { EnemyPatternPreview } from '../../components/combat/EnemyPatternPreview'
import { BestiaryMechanicEffect } from './BestiaryMechanicEffect'

export function BestiaryBossPhases({ monster }: { monster: MonsterDefinition }) {
  const presentation = useMemo(() => buildBestiaryBossPhases(monster), [monster])
  return <section className="bestiary-section bestiary-boss-phases"><span className="bestiary-section-label">PHASES / ROTATIONS</span>{presentation.phases.length === 0 ? <p className="bestiary-muted">No phase sequence recorded.</p> : <div className="bestiary-phase-flow">{presentation.phases.map((phase, index) => <div className="bestiary-phase-flow-item" key={phase.id}><article className={`bestiary-phase-card${phase.opening ? ' is-opening' : ''}`}><div className="bestiary-phase-card-heading"><div><span>PHASE {index + 1}{phase.opening ? ' OPENING' : ''}</span><strong>{phase.label}</strong></div><small>{phase.thresholdLabel}</small></div><EnemyPatternPreview monster={monster} pattern={monster.actionPatterns[phase.patternId]} /></article>{presentation.transitions[phase.patternId] && <div className="bestiary-phase-transition"><span className="bestiary-phase-transition-arrow" aria-hidden="true">↓</span><div><span className="bestiary-phase-transition-label">{presentation.transitions[phase.patternId].triggerLabel} · {presentation.transitions[phase.patternId].label}{presentation.transitions[phase.patternId].oncePerEncounter ? ' · Once per encounter' : ''}</span><div className="bestiary-phase-transition-effects">{presentation.transitions[phase.patternId].effects.map((effect) => <BestiaryMechanicEffect key={effect.id} effect={effect} />)}</div></div></div>}</div>)}</div>}</section>
}
