import { CircleDot, Clock3, Droplet, Flame, HeartPulse, Shield, Sparkles, Snowflake, Zap } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatSpellRank, getSpellAutoCastFocusCost, type SpellRank } from '../../game/systems/spells'
import { getSpellEquipmentBonusPreview } from '../../game/systems/spells/spellEquipmentPreview'
import type { CombatEffect, Magnitude } from '../../game/systems/combat/combatTypes'
import type { GameState, SpellId } from '../../game/types'
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
  const rankDrawerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!rankPathOpen) return
    const onPointerDown = (event: PointerEvent) => { if (!rankDrawerRef.current?.contains(event.target as Node)) onToggleRankPath() }
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onToggleRankPath() } }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => { document.removeEventListener('pointerdown', onPointerDown); document.removeEventListener('keydown', onKeyDown) }
  }, [rankPathOpen, onToggleRankPath])

  if (!entry) return <Card className="schools-inspector-panel"><div className="spell-inspector-empty"><InspectorEyebrow>SELECT A SPELL</InspectorEyebrow><h2>SELECT A SPELL</h2><p>Known Spells will appear here when learned. Choose a known Spell from the Spellbook to inspect its mechanics.</p></div></Card>
  const school = SCHOOLS[entry.school]
  if (entry.kind === 'placeholder') return <Card className="schools-inspector-panel" style={{ '--spell-school-color': school.color, borderTopColor: school.color } as React.CSSProperties}><InspectorEyebrow>UNKNOWN SPELL</InspectorEyebrow><div className="spell-inspector-unknown"><SpellIcon school={entry.school} locked size="large" /><h2>?</h2><Status tone="locked">UNDISCOVERED</Status><p>{school.name.toUpperCase()} SCHOOL · Requires Level {entry.unlockLevel}</p><p className="muted">This future catalog slot has no authored mechanics yet.</p></div></Card>
  if (!entry.unlocked) return <Card className="schools-inspector-panel" style={{ '--spell-school-color': school.color, borderTopColor: school.color } as React.CSSProperties}><InspectorEyebrow>UNKNOWN SPELL</InspectorEyebrow><div className="spell-inspector-unknown"><SpellIcon school={entry.school} locked size="large" /><h2>?</h2><Status tone="locked">LOCKED</Status><p>{school.name.toUpperCase()} SCHOOL · Requires Level {entry.unlockLevel}</p><p className="muted">Research this school to reveal the spell.</p></div></Card>

  const spell = SPELLS[entry.spellId]
  const rank = entry.rank as SpellRank
  const focusCost = getSpellAutoCastFocusCost(state, spell.id) ?? rank * 10
  const preview = getSpellEquipmentBonusPreview(state, spell.id)
  const autoCast = Boolean(state.activities.autoCast[spell.id])
  return <Card className="schools-inspector-panel" style={{ '--spell-school-color': school.color, borderTopColor: school.color } as React.CSSProperties}>
    <div className="spell-inspector-layout">
      <div className="spell-inspector-main">
        <div className="spell-inspector-title"><span className="spell-inspector-icon-frame"><SpellIcon school={spell.school} size="large" /></span><div><div className="spell-inspector-meta"><span>{school.name.toUpperCase()} SCHOOL</span><span>{formatSpellRank(rank)}</span></div><h2>{spell.name}</h2><p>Learned at School Level {spell.unlockLevel}</p></div><Status tone="success">UNLOCKED</Status></div>
        <p className="spell-inspector-description">{spell.description}</p>
        <div className="spell-inspector-section"><div className="section-label">CORE CASTING</div><div className="spell-core-grid"><Metric icon={<Droplet size={14} />} label="Mana" value={`${spell.manaCost}`} description="Mana spent when this Spell is cast." /><Metric icon={<Clock3 size={14} />} label="Cooldown" value={formatTime(spell.cooldownMs)} description="Time before this Spell can be cast again." /><Metric icon={<CircleDot size={14} />} label="Auto-Cast Focus" value={`${focusCost}`} description="Focus reserved while this Spell is enabled for Auto-Cast." /><Metric icon={<Sparkles size={14} />} label="Rank" value={formatSpellRank(rank)} description="Current authored progression rank." /></div></div>
        <div className="spell-inspector-section"><div className="section-label">EFFECTS</div><div className="spell-effects">{spell.effects.map((effect, index) => <EffectRow effect={effect} key={`${effect.type}-${index}`} />)}</div></div>
        <div className={`spell-autocast-card${autoCast ? ' is-active' : ''}`}><div><div className="spell-autocast-heading"><span className="section-label">AUTO-CAST</span><Status tone={autoCast ? 'success' : 'neutral'}>{autoCast ? 'ACTIVE' : 'OFF'}</Status></div><strong>{conditionLabel(spell.autoCondition)}</strong><small>{autoCast ? `${focusCost} Focus reserved` : `${focusCost} Focus when enabled`}</small></div><GameTooltip content={<TooltipContent title="Auto-Cast" description="Toggle this unlocked Spell's live Auto-Cast reservation. Applying a preset can change this state atomically." />}><Button variant={autoCast ? 'success' : 'secondary'} onClick={() => onToggleAutoCast(spell.id)}>{autoCast ? 'DISABLE' : 'ENABLE'}</Button></GameTooltip></div>
        <details className="spell-equipment-details"><summary><span>EQUIPMENT MODIFIERS</span>{preview.current.length ? <Status tone="success">{preview.current.length} ACTIVE</Status> : <Status>NONE</Status>}</summary><SpellEquipmentBonuses preview={preview} /></details>
        <div className="spell-rank-path-action"><span><small>RANK PROGRESSION</small><strong>{formatSpellRank(rank)} · Authored Rank</strong></span><GameTooltip content={<TooltipContent title="View Rank Path" description="Review the authored Rank I path and future Focus costs." />}><Button variant="ghost" onClick={onToggleRankPath}>VIEW RANK PATH <span aria-hidden="true">→</span></Button></GameTooltip></div>
      </div>
      {rankPathOpen && <SpellRankPath drawerRef={rankDrawerRef} currentRank={rank} onClose={onToggleRankPath} />}
    </div>
  </Card>
}

function InspectorEyebrow({ children }: { children: React.ReactNode }) { return <div className="panel-kicker">{children}</div> }
function Metric({ icon, label, value, description }: { icon: React.ReactNode; label: string; value: string; description: string }) { return <GameTooltip block content={<TooltipContent title={label} description={description} />}><div className="spell-core-metric"><span className="spell-core-metric-icon" aria-hidden="true">{icon}</span><small>{label}</small><strong>{value}</strong></div></GameTooltip> }
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
function EffectRow({ effect }: { effect: CombatEffect }) {
  const category = effectCategory(effect)
  return <div className={`spell-effect-row effect-${category.toLocaleLowerCase()}`}><span className="spell-effect-icon" aria-hidden="true"><EffectIcon effect={effect} /></span><div><strong>{category}</strong><b>{effectLabel(effect)}</b><span>{effectDescription(effect)}</span></div></div>
}
function EffectIcon({ effect }: { effect: CombatEffect }) {
  if (effect.type === 'deal-damage') return <Flame size={16} />
  if (effect.type === 'heal') return <HeartPulse size={16} />
  if (effect.type === 'gain-barrier') return <Shield size={16} />
  if (effect.type === 'apply-status' && effect.statusId === 'chilled') return <Snowflake size={16} />
  if (effect.type === 'apply-status' && effect.tags?.includes('debuff')) return <Zap size={16} />
  return <Sparkles size={16} />
}
function effectCategory(effect: CombatEffect) {
  if (effect.type === 'deal-damage') return 'DAMAGE'
  if (effect.type === 'heal') return 'HEAL'
  if (effect.type === 'gain-barrier') return 'BARRIER'
  if (effect.type === 'apply-status') return effect.tags?.includes('debuff') ? 'DEBUFF' : effect.tags?.includes('buff') ? 'BUFF' : 'STATUS'
  if (effect.type === 'restore-resource') return 'RESTORE'
  if (effect.type === 'drain-resource') return 'DRAIN'
  return 'EFFECT'
}
function effectLabel(effect: CombatEffect) {
  if (effect.type === 'deal-damage') return `${magnitudeLabel(effect.magnitude)} ${effect.damageType} damage`
  if (effect.type === 'heal') return magnitudeLabel(effect.magnitude)
  if (effect.type === 'gain-barrier') return magnitudeLabel(effect.magnitude)
  if (effect.type === 'apply-status') return STATUS_DEFINITIONS[effect.statusId]?.name ?? effect.statusId
  return effect.type.replace(/-/g, ' ')
}
function effectDescription(effect: CombatEffect) {
  if (effect.type === 'deal-damage') return `${effect.damageType[0].toUpperCase()}${effect.damageType.slice(1)} School · ${effect.target === 'self' ? 'Self' : 'Opponent'}`
  if (effect.type === 'heal') return `Restores health · ${effect.target === 'self' ? 'Self' : 'Opponent'}`
  if (effect.type === 'gain-barrier') return `${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} current Barrier${effect.durationMs ? ` · ${formatTime(effect.durationMs)} duration` : ''}`
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    return `${status?.description ?? 'Applies a status.'}${effect.stacks && effect.stacks > 1 ? ` · ${effect.stacks} stacks` : ''}${effect.durationMs ? ` · ${formatTime(effect.durationMs)} duration` : ''}`
  }
  return `Target: ${effect.target === 'self' ? 'Self' : 'Opponent'}`
}
