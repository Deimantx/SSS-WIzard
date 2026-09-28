import { useMemo, useRef, type ReactNode } from 'react'
import { useSmartScrollState } from '../../ui/game-feel/useSmartScrollState'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { SIGIL_QUALITIES } from '../../game/content/sigils/sigilQualities'
import { SIGIL_SETS } from '../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../game/content/sigils/sigilStats'
import { SIGIL_TRAITS } from '../../game/content/sigils/sigilTraits'
import { getSigilEnhancementCost, resolveSigilStatsForInstance } from '../../game/systems/sigils/sigilRuntime'
import { getNextSigilEnhancementMilestone } from '../../game/systems/sigils/sigilEnhancement'
import { formatSigilStatValue, getSigilSlotRoman } from '../../game/presentation/sigils/sigilEquipmentReadModel'
import type { SigilInstance } from '../../game/types'

export function SigilInspector({ sigil, emptyTitle = 'SELECT A SIGIL', emptyDescription = 'Choose a stored Sigil to inspect its stats, Traits, and refinement path.', cap, setCount = 0, footer, className = '' }: {
  sigil?: SigilInstance
  emptyTitle?: string
  emptyDescription?: string
  cap?: number
  setCount?: number
  footer?: ReactNode
  className?: string
}) {
  const quality = sigil ? SIGIL_QUALITIES.find(({ id }) => id === sigil.quality)! : null
  const stats = useMemo(() => sigil ? resolveSigilStatsForInstance(sigil) : null, [sigil])
  const scrollRef = useRef<HTMLElement | null>(null)
  useSmartScrollState(scrollRef, { resetKey: sigil?.instanceId, dependencies: [sigil] })
  const milestone = sigil ? getNextSigilEnhancementMilestone(sigil) : null
  const accent = sigil ? 'var(--sigil-quality-' + sigil.quality + ')' : undefined
  const classes = ['sigil-inspector-transition', className].filter(Boolean).join(' ')
  return <InspectorTransition identity={sigil?.instanceId ?? 'empty'} accent={accent} fill className={classes}>
    <aside ref={scrollRef} className={'sigil-shared-inspector' + (sigil ? ' quality-' + sigil.quality : '')}>
      {!sigil || !quality || !stats ? <div className="sigil-inspector-empty"><span aria-hidden="true">◈</span><strong>{emptyTitle}</strong><p>{emptyDescription}</p></div> : <>
        <div className="sigil-inspector-identity"><span className="eyebrow">T{sigil.tier} · {quality.label.toUpperCase()}</span><h2>{SIGIL_SETS[sigil.setId].name} Sigil {getSigilSlotRoman(sigil.slot)}</h2><p>{SIGIL_SETS[sigil.setId].description}</p><strong>+{sigil.rank}<small> / +{quality.maxRank}</small></strong></div>
        {cap !== undefined && <div className="sigil-refinement-preview"><span>GLOBAL CAP +{cap}</span><span>QUALITY CAP +{quality.maxRank}</span><span>NEXT +{Math.min(sigil.rank + 1, quality.maxRank)}</span><b>{sigil.rank >= quality.maxRank || sigil.rank >= cap ? 'AT CAP' : getSigilEnhancementCost(sigil, sigil.rank + 1) + ' DUST'}</b></div>}
        <InspectorSection title="MAIN STAT"><StatRow id={sigil.mainStatId} value={stats[sigil.mainStatId] ?? 0} /></InspectorSection>
        <InspectorSection title="SECONDARIES">{sigil.secondaries.length ? sigil.secondaries.map(({ statId }) => <StatRow key={statId} id={statId} value={stats[statId] ?? 0} />) : <small>Secondary rolls unlock at enhancement milestones.</small>}</InspectorSection>
        <InspectorSection title="SET BONUS"><div className="sigil-set-effect"><strong>{SIGIL_SETS[sigil.setId].name} · {setCount}/{SIGIL_SETS[sigil.setId].piecesRequired}</strong><p>{SIGIL_SETS[sigil.setId].description}</p></div></InspectorSection>
        {milestone && <div className="sigil-milestone"><div role="progressbar" aria-label="Progress to next Sigil roll" aria-valuemin={0} aria-valuemax={milestone.rank} aria-valuenow={sigil.rank}><i style={{ width: Math.min(100, sigil.rank / milestone.rank * 100) + '%' }} /></div><span>+{sigil.rank} <b>NEXT +{milestone.rank} · {milestone.kind === 'trait' ? 'TRAIT AWAKENING' : milestone.kind === 'secondary-and-trait' ? 'SECONDARY + TRAIT' : 'SECONDARY ROLL'}</b></span></div>}
        <InspectorSection title="TRAITS">{sigil.traitIds.length ? sigil.traitIds.map((id) => <article className="sigil-trait-detail" key={id}><strong>{SIGIL_TRAITS[id].name}{SIGIL_TRAITS[id].unique && <small>UNIQUE</small>}</strong><p>{SIGIL_TRAITS[id].description}</p></article>) : <small>No Traits unlocked on this Sigil.</small>}</InspectorSection>
        <InspectorSection title="ROLL HISTORY">{sigil.secondaries.flatMap((secondary) => secondary.rolls.filter((roll) => roll.rank === 0).map((roll, index) => <span className="sigil-roll-entry" key={sigil.instanceId + '-' + secondary.statId + '-start-' + index}><b>+0</b> · Starting Secondary · {SIGIL_STAT_DEFINITIONS[secondary.statId].label} {formatSigilStatValue(secondary.statId, resolveSigilStatsForInstance({ ...sigil, secondaries: [{ ...secondary, rolls: [roll] }] })[secondary.statId] ?? 0, true)}</span>))}{sigil.rollHistory.length ? sigil.rollHistory.map((entry, index) => <span className="sigil-roll-entry" key={sigil.instanceId + '-' + entry.rank + '-' + index}><b>+{entry.rank}</b> · {entry.kind === 'trait' ? 'Trait ' + (entry.traitId ? SIGIL_TRAITS[entry.traitId]?.name ?? entry.traitId : '') : entry.kind === 'new-secondary' ? 'New ' + (entry.statId ? SIGIL_STAT_DEFINITIONS[entry.statId]?.label ?? entry.statId : 'Secondary') : 'Improved ' + (entry.statId ? SIGIL_STAT_DEFINITIONS[entry.statId]?.label ?? entry.statId : 'Secondary')}</span>) : <small>No enhancement milestones reached.</small>}</InspectorSection>
        {footer && <div className="sigil-inspector-footer">{footer}</div>}
      </>}
    </aside>
  </InspectorTransition>
}

function InspectorSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="sigil-inspector-section"><span className="eyebrow">{title}</span>{children}</section>
}

function StatRow({ id, value }: { id: keyof typeof SIGIL_STAT_DEFINITIONS; value: number }) {
  return <div className="sigil-inspector-stat"><span>{SIGIL_STAT_DEFINITIONS[id].label}</span><b>{formatSigilStatValue(id, value, true)}</b></div>
}
