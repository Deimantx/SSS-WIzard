import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { getSchoolProgressInfo } from '../../game/systems/schools'
import { formatSpellRank, getSpellAutoCastFocusCost, type SpellRank } from '../../game/systems/spells'
import { getSpellEquipmentBonusPreview } from '../../game/systems/spells/spellEquipmentPreview'
import type { CombatEffect, Magnitude } from '../../game/systems/combat/combatTypes'
import type { GameState, SchoolId, SpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from './SpellIcon'
import type { SpellBrowserEntry } from './spellBrowserSelectors'
import { SpellEquipmentBonuses } from './SpellEquipmentBonuses'
import { SpellRankPath } from './SpellRankPath'

export function SpellInspector({ entry, state, rankPathOpen, onToggleRankPath, onToggleAutoCast }: {
  entry: SpellBrowserEntry | null
  state: Pick<GameState, 'schools' | 'progress' | 'equipment' | 'activities'>
  rankPathOpen: boolean
  onToggleRankPath: () => void
  onToggleAutoCast: (spellId: SpellId) => void
}) {
  if (!entry) return <Card title="Spell Inspector" className="schools-inspector-panel"><div className="schools-empty-state">Select a catalog entry to inspect it.</div></Card>
  const school = SCHOOLS[entry.school]
  if (entry.kind === 'placeholder') return <Card className="schools-inspector-panel" style={{ borderTopColor: school.color } as React.CSSProperties}><InspectorEyebrow>UNDISCOVERED SPELL</InspectorEyebrow><div className="spell-inspector-unknown"><SpellIcon school={entry.school} locked size="large" /><h2>???</h2><Status tone="locked">FUTURE PLACEHOLDER</Status><p>{school.name} School · Requires School Lv {entry.unlockLevel}</p><p className="muted">This catalog slot is reserved for future spell content. No mechanics have been authored yet.</p></div></Card>
  if (!entry.unlocked) return <Card className="schools-inspector-panel" style={{ borderTopColor: school.color } as React.CSSProperties}><InspectorEyebrow>UNKNOWN SPELL</InspectorEyebrow><div className="spell-inspector-unknown"><SpellIcon school={entry.school} locked size="large" /><h2>???</h2><Status tone="locked">LOCKED</Status><p>{school.name} School · Requires School Lv {entry.unlockLevel}</p><p className="muted">Continue researching this school to reveal the spell.</p></div></Card>

  const spell = SPELLS[entry.spellId]
  const rank = entry.rank as SpellRank
  const schoolInfo = getSchoolProgressInfo(state, entry.school)
  const focusCost = getSpellAutoCastFocusCost(state, spell.id) ?? rank * 10
  const preview = getSpellEquipmentBonusPreview(state, spell.id)
  return <Card className="schools-inspector-panel" style={{ borderTopColor: school.color }}>
    <div className="spell-inspector-layout">
      <div className="spell-inspector-main">
        <InspectorEyebrow>UNLOCKED AT SCHOOL LEVEL {spell.unlockLevel}</InspectorEyebrow>
        <div className="spell-inspector-title"><SpellIcon school={spell.school} size="large" /><div><h2>{spell.name}</h2><p>{school.name} · {formatSpellRank(rank)}</p></div><Status tone="success">UNLOCKED</Status></div>
        <p className="spell-inspector-description">{spell.description}</p>
        <div className="spell-inspector-section"><div className="section-label">CORE CASTING</div><div className="spell-core-grid"><Metric label="Mana" value={`${spell.manaCost}`} /><Metric label="Cooldown" value={formatTime(spell.cooldownMs)} /><Metric label="Auto-Cast Focus" value={`${focusCost}`} /><Metric label="Current Rank" value={formatSpellRank(rank)} /></div></div>
        <div className="spell-inspector-section"><div className="section-label">EFFECTS</div><div className="spell-effects">{spell.effects.map((effect, index) => <div className="spell-effect-row" key={`${effect.type}-${index}`}><strong>{effectLabel(effect)}</strong><span>{effectDescription(effect)}</span></div>)}</div></div>
        <div className="spell-autocast-card"><div><div className="section-label">AUTO-CAST</div><strong>{state.activities.autoCast[spell.id] ? 'ON' : 'OFF'}</strong><span>{conditionLabel(spell.autoCondition)}</span><small>{state.activities.autoCast[spell.id] ? `${focusCost} Focus reserved` : `Requires ${focusCost} Focus when enabled`}</small></div><GameTooltip content={<TooltipContent title="Auto-Cast" description="Toggle this unlocked spell's live Auto-Cast reservation. Applying a preset can change this state atomically." />}><Button variant={state.activities.autoCast[spell.id] ? 'success' : 'secondary'} onClick={() => onToggleAutoCast(spell.id)}>{state.activities.autoCast[spell.id] ? 'TURN OFF' : 'TURN ON'}</Button></GameTooltip></div>
        <details className="spell-equipment-details"><summary>EQUIPMENT BONUSES</summary><SpellEquipmentBonuses preview={preview} /></details>
        <div className="spell-rank-path-action"><span><small>Rank Path</small><strong>{formatSpellRank(rank)} current</strong></span><GameTooltip content={<TooltipContent title="View Rank Path" description="Review the authored Rank I path and future Focus costs." />}><Button variant="ghost" onClick={onToggleRankPath}>VIEW RANK PATH</Button></GameTooltip></div>
        <small className="spell-inspector-school-state">{school.name} School Level {schoolInfo.level} · {schoolInfo.xp} XP</small>
      </div>
      {rankPathOpen && <SpellRankPath currentRank={rank} onClose={onToggleRankPath} />}
    </div>
  </Card>
}

function InspectorEyebrow({ children }: { children: React.ReactNode }) { return <div className="panel-kicker">{children}</div> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="spell-core-metric"><small>{label}</small><strong>{value}</strong></div> }
function conditionLabel(condition: typeof SPELLS[SpellId]['autoCondition']) {
  if (!condition || condition.type === 'always') return 'Always'
  if (condition.type === 'health-below') return `Health below ${condition.percent}%`
  return `Barrier below ${condition.value}`
}
function magnitudeLabel(magnitude: Magnitude) {
  if (magnitude.type === 'flat') return `${magnitude.value}`
  if (magnitude.type === 'school-level') return `${magnitude.base} + ${magnitude.perLevel} per ${SCHOOLS[magnitude.school].name} School Level`
  if (magnitude.type === 'source-max-health-percent') return `${magnitude.value * 100}% of Max Health`
  if (magnitude.type === 'target-max-health-percent') return `${magnitude.value * 100}% of target Max Health`
  if (magnitude.type === 'source-basic-damage-percent') return `${magnitude.value * 100}% of Basic Damage`
  return `${magnitude.value * 100}% of missing Health`
}
function effectLabel(effect: CombatEffect) {
  if (effect.type === 'deal-damage') return `${magnitudeLabel(effect.magnitude)} ${effect.damageType} Damage`
  if (effect.type === 'heal') return `${magnitudeLabel(effect.magnitude)} Healing`
  if (effect.type === 'gain-barrier') return `${magnitudeLabel(effect.magnitude)} Barrier`
  if (effect.type === 'apply-status') return STATUS_DEFINITIONS[effect.statusId]?.name ?? effect.statusId
  return effect.type.replace(/-/g, ' ')
}
function effectDescription(effect: CombatEffect) {
  if (effect.type === 'gain-barrier') return `${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} current Barrier${effect.durationMs ? ` · ${formatTime(effect.durationMs)} duration` : ''}`
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    return `${status?.description ?? 'Applies a status.'}${effect.stacks && effect.stacks > 1 ? ` · ${effect.stacks} stacks` : ''}${effect.durationMs ? ` · ${formatTime(effect.durationMs)} duration` : ''}`
  }
  return `Target: ${effect.target === 'self' ? 'Self' : 'Opponent'}`
}
