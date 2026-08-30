import { CircleDot, Clock3, Droplet, Flame, HeartPulse, Shield, Sparkles, Snowflake, Zap } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { SCHOOLS } from '../../game/content/schools/schools'
import { SPELLS } from '../../game/content/spells/spells'
import { STATUS_DEFINITIONS } from '../../game/content/statuses'
import { formatSpellRank, getSpellAutoCastFocusCost, getSpellPresetFocusBreakdown, type SpellRank } from '../../game/systems/spells'
import { getSpellEquipmentBonusPreview } from '../../game/systems/spells/spellEquipmentPreview'
import type { CombatEffect } from '../../game/systems/combat/combatTypes'
import type { GameState, SpellId } from '../../game/types'
import { formatTime } from '../../game/utils'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SpellIcon } from './SpellIcon'
import type { SpellBrowserEntry } from './spellBrowserSelectors'
import { SpellEquipmentBonuses } from './SpellEquipmentBonuses'
import { SpellRankPath } from './SpellRankPath'
import { SpellEffectTooltip } from './SpellEffectTooltip'
import { buildSpellEffectTooltipModel, formatSpellMagnitude, getSpellEffectCategory } from './spellEffectTooltipModel'

export function SpellInspector({ entry, state, rankPathOpen, onToggleRankPath, onToggleAutoCast }: {
  entry: SpellBrowserEntry | null
  state: Pick<GameState, 'schools' | 'progress' | 'equipment' | 'activities'> & { player: Pick<GameState['player'], 'maxFocus'>; debug: Pick<GameState['debug'], 'allowFocusOverCap'> }
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
  const focusCost = getSpellAutoCastFocusCost(state, spell.id) ?? 0
  const preview = getSpellEquipmentBonusPreview(state, spell.id)
  const autoCast = Boolean(state.activities.autoCast[spell.id])
  const focus = getSpellPresetFocusBreakdown(state)
  const canEnable = autoCast || state.debug.allowFocusOverCap || focus.freeFocus >= focusCost
  const autoCastTooltip = autoCast
    ? `${focusCost} Focus is currently reserved by this Spell's Auto-Cast state.`
    : canEnable
      ? `Enable this Spell's live Auto-Cast reservation. ${focusCost} Focus will be reserved.`
      : `Insufficient free Focus. Need ${focusCost} Focus.`
  return <Card className="schools-inspector-panel" style={{ '--spell-school-color': school.color, borderTopColor: school.color } as React.CSSProperties}>
    <div className="spell-inspector-layout">
      <div className="spell-inspector-main">
        <div className="spell-inspector-title"><span className="spell-inspector-icon-frame"><SpellIcon school={spell.school} size="large" /></span><div><div className="spell-inspector-meta">{school.name.toUpperCase()} · {formatSpellRank(rank).toUpperCase()}</div><h2>{spell.name}</h2><p>Learned at Lv{spell.unlockLevel}</p></div></div>
        <p className="spell-inspector-description">{spell.description}</p>
        <div className="spell-inspector-section"><div className="section-label">CORE CASTING</div><div className="spell-core-grid"><Metric semantic="mana" icon={<Droplet size={14} />} label="Mana" value={`${spell.manaCost}`} description="Mana spent when this Spell is cast." /><Metric semantic="time" icon={<Clock3 size={14} />} label="Cooldown" value={formatTime(spell.cooldownMs)} description="Time before this Spell can be cast again." /><Metric semantic="focus" icon={<CircleDot size={14} />} label="Auto-Cast Focus" value={`${focusCost}`} description="Focus reserved while this Spell is enabled for Auto-Cast." /></div></div>
        <div className="spell-inspector-section"><div className="section-label">EFFECTS</div><div className="spell-effects">{spell.effects.map((effect, index) => <EffectRow state={state} spellId={spell.id} effect={effect} effectIndex={index} key={`${effect.type}-${index}`} />)}</div></div>
        <div className={`spell-autocast-card${autoCast ? ' is-active' : ''}${!canEnable ? ' is-blocked' : ''}`}><GameTooltip block accent={autoCast ? 'success' : !canEnable ? 'warning' : 'focus'} content={<TooltipContent title="Auto-Cast" description={autoCastTooltip} />}><button type="button" className="spell-autocast-control" aria-label={`Auto-Cast ${autoCast ? 'ON' : 'OFF'}`} aria-pressed={autoCast} disabled={!autoCast && !canEnable} onClick={() => onToggleAutoCast(spell.id)}><span className="spell-autocast-control-label"><span className="section-label">AUTO-CAST</span><strong>{autoCast ? 'ON' : 'OFF'}</strong></span><span className="spell-autocast-control-status">{autoCast ? 'ACTIVE' : <CircleDot size={16} aria-hidden="true" />}</span></button></GameTooltip><div className="spell-autocast-details"><strong>{conditionLabel(spell.autoCondition)}</strong><small>{autoCast ? `${focusCost} Focus reserved` : !canEnable ? `Need ${focusCost} Focus` : `${focusCost} Focus when enabled`}</small></div></div>
        <details className="spell-equipment-details"><summary><span>EQUIPMENT MODIFIERS</span>{preview.current.length ? <Status tone="success">{preview.current.length} ACTIVE</Status> : <Status>NONE</Status>}</summary><SpellEquipmentBonuses preview={preview} /></details>
        <div className="spell-rank-path-action"><span><small>RANK PROGRESSION</small><strong>{formatSpellRank(rank)} path</strong></span><GameTooltip content={<TooltipContent title="View Rank Path" description="Review the Rank I path and future Focus costs." />}><Button variant="ghost" onClick={onToggleRankPath}>VIEW RANK PATH <span aria-hidden="true">→</span></Button></GameTooltip></div>
      </div>
      {rankPathOpen && <SpellRankPath drawerRef={rankDrawerRef} currentRank={rank} onClose={onToggleRankPath} />}
    </div>
  </Card>
}

function InspectorEyebrow({ children }: { children: React.ReactNode }) { return <div className="panel-kicker">{children}</div> }
function Metric({ icon, label, value, description, semantic }: { icon: React.ReactNode; label: string; value: string; description: string; semantic: 'mana' | 'time' | 'focus' }) { return <GameTooltip block accent={semantic === 'mana' ? 'mana' : semantic === 'focus' ? 'focus' : 'neutral'} content={<TooltipContent title={label} description={description} />}><div className="spell-core-metric"><span className={`spell-core-metric-icon ui-${semantic}`} aria-hidden="true">{icon}</span><small>{label}</small><strong className={`ui-${semantic}`}>{value}</strong></div></GameTooltip> }
function conditionLabel(condition: typeof SPELLS[SpellId]['autoCondition']) {
  if (!condition || condition.type === 'always') return 'Always'
  if (condition.type === 'health-below') return `Health below ${condition.percent}%`
  return `Barrier below ${condition.value}`
}
function EffectRow({ state, spellId, effect, effectIndex }: { state: Pick<GameState, 'schools' | 'progress' | 'equipment' | 'activities'> & { player: Pick<GameState['player'], 'maxFocus'>; debug: Pick<GameState['debug'], 'allowFocusOverCap'> }; spellId: SpellId; effect: CombatEffect; effectIndex: number }) {
  const model = buildSpellEffectTooltipModel(state, spellId, effectIndex)
  return <GameTooltip block delay={120} placement="right" accent={model.categoryKey === 'heal' ? 'success' : model.categoryKey === 'barrier' ? 'mana' : model.categoryKey === 'debuff' ? 'warning' : 'elemental'} content={<SpellEffectTooltip model={model} />}>
    <div tabIndex={0} aria-label={`${model.category}: ${model.title}`} className={`spell-effect-row effect-${model.categoryKey}`}><span className="spell-effect-icon" aria-hidden="true"><EffectIcon categoryKey={model.categoryKey} effect={effect} /></span><div><strong>{model.category}</strong><b>{effectLabel(effect)}</b><span>{effectDescription(effect)}</span></div></div>
  </GameTooltip>
}
function EffectIcon({ effect, categoryKey }: { effect: CombatEffect; categoryKey: ReturnType<typeof getSpellEffectCategory>['categoryKey'] }) {
  if (effect.type === 'deal-damage') return <Flame size={16} />
  if (effect.type === 'heal') return <HeartPulse size={16} />
  if (effect.type === 'gain-barrier') return <Shield size={16} />
  if (categoryKey === 'control') return <Snowflake size={16} />
  if (categoryKey === 'dot') return <Flame size={16} />
  if (categoryKey === 'debuff') return <Zap size={16} />
  return <Sparkles size={16} />
}
function effectLabel(effect: CombatEffect) {
  if (effect.type === 'deal-damage') return formatSpellMagnitude(effect.magnitude)
  if (effect.type === 'heal') return formatSpellMagnitude(effect.magnitude)
  if (effect.type === 'gain-barrier') return formatSpellMagnitude(effect.magnitude)
  if (effect.type === 'apply-status') return effect.statusId[0].toUpperCase() + effect.statusId.slice(1)
  if (effect.type === 'restore-resource') return 'Resource restored'
  if (effect.type === 'drain-resource') return 'Resource drained'
  return 'Additional effect'
}
function effectDescription(effect: CombatEffect) {
  if (effect.type === 'deal-damage') return `${capitalize(effect.damageType)} Damage · ${effect.target === 'self' ? 'Self' : 'Opponent'}`
  if (effect.type === 'heal') return `Healing · ${effect.target === 'self' ? 'Self' : 'Opponent'}`
  if (effect.type === 'gain-barrier') return `Barrier · ${effect.target === 'self' ? 'Self' : 'Opponent'} · ${effect.mode === 'replace' ? 'Replaces' : 'Adds to'} current Barrier${effect.durationMs ? ` · ${formatTime(effect.durationMs)} duration` : ''}`
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    return `${status?.description ?? 'Applies a status.'} · ${effect.target === 'self' ? 'Self' : 'Opponent'}${effect.stacks && effect.stacks > 1 ? ` · ${effect.stacks} stacks` : ''}${effect.durationMs ? ` · ${formatTime(effect.durationMs)} duration` : ''}`
  }
  return `Target: ${effect.target === 'self' ? 'Self' : 'Opponent'}`
}
function capitalize(value: string) { return `${value[0]?.toUpperCase() ?? ''}${value.slice(1)}` }
