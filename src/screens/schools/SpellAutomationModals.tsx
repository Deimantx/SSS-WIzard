import { Minus, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Button, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { LiveSpellCardTooltip } from '../../components/spells/LiveSpellCardTooltip'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import {
  evaluateSpellAutomation,
  formatSpellAutomationSummary,
  getAutomationEffectOptions,
  getDefaultSpellAutomationConfig,
  getSpellAutomationConfig,
  getSpellAutomationTargetOptions,
  getSpellAutomationPriorityPreview,
  MAX_AUTOMATION_CONDITIONS,
  normalizeSpellAutomationConfig,
  type SpellAutomationEvaluation,
} from '../../game/systems/spells'
import type { GameState, SpellAutomationCondition, SpellAutomationConfig, SpellAutomationTargetRule, SpellPresetSlot } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { SpellIcon } from './SpellIcon'

type AutomationDraft = SpellAutomationConfig & { autoCast: boolean }

const conditionTypes = [
  ['player-hp', 'Player HP'],
  ['enemy-hp', 'Enemy HP'],
  ['mana', 'Mana'],
  ['player-buff', 'Player Buff'],
  ['enemy-debuff', 'Enemy Debuff'],
  ['boss', 'Enemy Type'],
  ['player-barrier-below', 'Player Barrier'],
  ['player-has-cleanseable-debuff', 'Cleanseable Debuff'],
] as const

type EditableConditionType = typeof conditionTypes[number][0]

const createCondition = (type: EditableConditionType): SpellAutomationCondition => {
  if (type === 'player-hp' || type === 'enemy-hp' || type === 'mana') return { type, operator: 'below', percent: 50 }
  if (type === 'player-buff' || type === 'enemy-debuff') return { type, operator: 'missing', effectId: type === 'player-buff' ? 'regeneration' : 'kindled' }
  if (type === 'boss') return { type, operator: 'is' }
  if (type === 'player-barrier-below') return { type, value: 10 }
  return { type: 'player-has-cleanseable-debuff' }
}

const addConditionCandidates = conditionTypes.map(([type]) => type)
const conditionKey = (condition: SpellAutomationCondition) => JSON.stringify(condition)
const isKnownCondition = (condition: SpellAutomationCondition) => condition.type === 'always' || conditionTypes.some(([type]) => type === condition.type)

const draftFromSlot = (slot: SpellPresetSlot): AutomationDraft => {
  const config = getSpellAutomationConfig(slot)
  return { ...config, conditions: config.conditions.map((condition) => ({ ...condition })), autoCast: slot.autoCast }
}

const toneForCheck = (check: { passed: boolean }): 'success' | 'warning' => check.passed ? 'success' : 'warning'

export function SpellAutomationModal({ open, slot, slotIndex, presetName, loadoutSlots = [], readOnly = false, applyError = null, onClose, onApply }: { open: boolean; slot: SpellPresetSlot | null; slotIndex: number; presetName: string; loadoutSlots?: SpellPresetSlot[]; readOnly?: boolean; applyError?: string | null; onClose: () => void; onApply: (config: SpellAutomationConfig, autoCast: boolean) => unknown }) {
  const liveState = useGameStore(useShallow((state) => ({
    schools: state.schools,
    player: state.player,
    combat: state.combat,
    progress: state.progress,
    debug: state.debug,
    activities: state.activities,
    equipment: state.equipment,
    artifactProgress: state.artifactProgress,
    arcaneCore: state.arcaneCore,
    crystals: state.crystals,
  }))) as unknown as GameState
  const [draft, setDraft] = useState<AutomationDraft | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [showEvaluationDetails, setShowEvaluationDetails] = useState(false)
  const spell = slot ? SPELLS[slot.spellId] : null
  const school = spell ? SCHOOLS[spell.school] : null

  useEffect(() => {
    if (open && slot) {
      setDraft(draftFromSlot(slot))
      setConfirmDiscard(false)
      setShowEvaluationDetails(false)
    }
  }, [open, slot?.spellId, slot?.autoCast, slot?.automation])

  const projectedPreview = useMemo(() => {
    const baseSlots = loadoutSlots.length ? loadoutSlots : slot ? [slot] : []
    if (!slot || !draft) return { state: liveState, slots: baseSlots, slot: slot ?? null }
    const editedSlot: SpellPresetSlot = {
      ...slot,
      autoCast: draft.autoCast,
      automation: normalizeSpellAutomationConfig(draft, slot.spellId, draft.autoCast, false),
    }
    const slots = baseSlots.map((candidate, index) => index === slotIndex ? editedSlot : candidate)
    const autoCast = { ...liveState.activities.autoCast }
    slots.forEach((candidate) => { autoCast[candidate.spellId] = Boolean(candidate.autoCast) })
    return {
      state: {
        ...liveState,
        activities: {
          ...liveState.activities,
          autoCast,
          autoCastPriority: slots.filter((candidate) => candidate.autoCast).map((candidate) => candidate.spellId),
        },
      } as GameState,
      slots,
      slot: editedSlot,
    }
  }, [draft, liveState, loadoutSlots, slot, slotIndex])
  const evaluation = useMemo<SpellAutomationEvaluation | null>(() => {
    if (!projectedPreview.slot) return null
    return evaluateSpellAutomation(projectedPreview.state, projectedPreview.slot)
  }, [projectedPreview])
  const priorityPreview = useMemo(() => {
    if (!projectedPreview.slot || !projectedPreview.slots.length) return null
    return getSpellAutomationPriorityPreview(projectedPreview.state, projectedPreview.slots, slotIndex)
  }, [projectedPreview, slotIndex])
  if (!slot || !spell || !school || !draft) return null

  const targetOptions = getSpellAutomationTargetOptions(slot.spellId)
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFromSlot(slot))
  const hasDuplicateConditions = new Set(draft.conditions.map(conditionKey)).size !== draft.conditions.length
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose() }
  const updateCondition = (index: number, condition: SpellAutomationCondition) => setDraft((current) => current ? { ...current, conditions: current.conditions.map((entry, entryIndex) => entryIndex === index ? condition : entry) } : current)
  const removeCondition = (index: number) => setDraft((current) => {
    if (!current) return current
    const next = current.conditions.filter((_, entryIndex) => entryIndex !== index)
    return { ...current, conditions: next.length ? next : [{ type: 'always' }] }
  })
  const addCondition = () => setDraft((current) => {
    if (!current || current.conditions.length >= MAX_AUTOMATION_CONDITIONS) return current
    const conditions = current.conditions.some((condition) => condition.type === 'always') ? [] : [...current.conditions]
    const nextType = addConditionCandidates.find((type) => !conditions.some((condition) => conditionKey(condition) === conditionKey(createCondition(type))))
    return nextType ? { ...current, conditions: [...conditions, createCondition(nextType)] } : current
  })
  const reset = () => setDraft({ ...getDefaultSpellAutomationConfig(slot.spellId, true, true), autoCast: true })
  const apply = () => { if (!hasDuplicateConditions) onApply(normalizeSpellAutomationConfig(draft, slot.spellId, draft.autoCast, false), draft.autoCast) }

  return <ModalPortal open={open} onClose={requestClose} onEscape={requestClose} backdropClassName="spell-automation-backdrop" surfaceClassName="spell-automation-modal" ariaLabel={`${spell.name} Automation`}>
    <header className="spell-automation-modal-header">
      <div className="spell-automation-title"><GameTooltip wide placement="right" delay={200} content={<LiveSpellCardTooltip spellId={spell.id} />}><span className="spell-automation-title-icon-tooltip-target"><SpellIcon school={spell.school} spellId={spell.id} size="medium" /></span></GameTooltip><div><span className="panel-kicker">{school.name.toUpperCase()} · SLOT {String(slotIndex + 1).padStart(2, '0')}</span><h2>{spell.name} — AUTOMATION</h2><p>{presetName} · priority follows Combat Loadout order</p></div></div>
      <Button variant="ghost" icon dataNoDrag ariaLabel="Close Spell Automation" onClick={requestClose}><X size={17} aria-hidden="true" /></Button>
    </header>
    <div className="spell-automation-modal-body">
      <section className="spell-automation-section spell-automation-main-section">
        <div className="spell-automation-section-heading"><div><span className="section-label">AUTOMATION</span><p>{readOnly ? 'Active battle snapshot · configuration is read-only.' : 'Only AUTO spells are considered from top to bottom.'}</p></div><GameTooltip content={<TooltipContent title={draft.autoCast ? 'Auto-Cast Enabled' : 'Manual Only'} description={draft.autoCast ? 'This Spell can be selected by combat automation when its conditions pass.' : 'This Spell is excluded from combat automation and requires a manual cast.'} />}><Button variant={draft.autoCast ? 'success' : 'secondary'} disabled={readOnly} ariaPressed={draft.autoCast} onClick={() => setDraft((current) => current ? { ...current, autoCast: !current.autoCast } : current)}>{draft.autoCast ? 'ON · AUTO' : 'OFF · MANUAL'}</Button></GameTooltip></div>
        <div className="spell-automation-condition-heading"><span>CAST WHEN</span><small>ALL CONDITIONS MUST BE TRUE</small></div>
        <div className="spell-automation-condition-list">{draft.conditions.map((condition, index) => <AutomationConditionRow key={`${index}-${condition.type}`} condition={condition} disabled={readOnly} onChange={(next) => updateCondition(index, next)} onRemove={() => removeCondition(index)} />)}</div>
        <GameTooltip content={<TooltipContent title="Add Condition" description={draft.conditions.length >= MAX_AUTOMATION_CONDITIONS ? `The rule already has the maximum of ${MAX_AUTOMATION_CONDITIONS} conditions.` : "Add another requirement to this Spell’s AND rule."} />}><Button variant="ghost" className="spell-automation-add-condition" disabled={readOnly || draft.conditions.length >= MAX_AUTOMATION_CONDITIONS} onClick={addCondition}><Plus size={14} aria-hidden="true" /> ADD CONDITION</Button></GameTooltip>
        <small className="spell-automation-limit">{draft.conditions.length} / {MAX_AUTOMATION_CONDITIONS} conditions</small>
        {hasDuplicateConditions && <small className="spell-automation-duplicate-warning">Duplicate conditions must be changed before applying.</small>}
      </section>
      <section className="spell-automation-section spell-automation-compact-section"><span className="section-label">TARGET</span><GameTooltip block content={<TooltipContent title="Automation Target" description={draft.targetRule === "self" ? "The Spell resolves against the wizard." : "The Spell resolves against the current enemy target."} />}><div className="spell-automation-target">{targetOptions.length === 1 ? <strong>{targetOptions[0].label}</strong> : <select aria-label="Automation target" disabled={readOnly} value={draft.targetRule} onChange={(event) => setDraft((current) => current ? { ...current, targetRule: event.target.value as SpellAutomationTargetRule } : current)}>{targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}<small>{draft.targetRule === 'self' ? 'This Spell affects the wizard.' : 'This Spell uses the current enemy target.'}</small></div></GameTooltip></section>
      <section className="spell-automation-section spell-automation-compact-section"><span className="section-label">PRIORITY</span><GameTooltip block content={<TooltipContent title="Automation Priority" description="AUTO Spells are evaluated from top to bottom in Combat Loadout order." />}><div className="spell-automation-priority"><strong>{String(slotIndex + 1).padStart(2, '0')} · Combat Loadout order</strong><p>Move this Spell in the loadout to change its priority.</p></div></GameTooltip></section>
      <AutomationEvaluationPanel evaluation={evaluation} priorityPreview={priorityPreview} activeCombat={liveState.combat.active} detailsOpen={showEvaluationDetails} onToggleDetails={() => setShowEvaluationDetails((value) => !value)} />
    </div>
    <footer className="spell-automation-modal-footer"><GameTooltip content={<TooltipContent title="Reset Automation" description="Restore the authored default condition and enable Auto-Cast." />}><Button variant="ghost" disabled={readOnly} onClick={reset}><RotateCcw size={14} aria-hidden="true" /> RESET</Button></GameTooltip><span className="spell-automation-footer-spacer" />{applyError && <span className="spell-automation-apply-error" role="alert">{applyError}</span>}{confirmDiscard ? <><span className="spell-automation-discard-copy">Discard automation changes?</span><Button variant="ghost" onClick={() => setConfirmDiscard(false)}>CANCEL</Button><Button variant="danger" onClick={onClose}>DISCARD</Button></> : <><Button variant="ghost" onClick={requestClose}>CANCEL</Button>{!readOnly && <GameTooltip content={<TooltipContent title="Apply Automation" description="Save this mode, target, and condition rule to the selected loadout slot." />}><Button variant="primary" disabled={hasDuplicateConditions} onClick={apply}>APPLY</Button></GameTooltip>}</>}</footer>
  </ModalPortal>
}

function AutomationConditionRow({ condition, disabled = false, onChange, onRemove }: { condition: SpellAutomationCondition; disabled?: boolean; onChange: (condition: SpellAutomationCondition) => void; onRemove: () => void }) {
  const playerBuffs = getAutomationEffectOptions('player-buff')
  const enemyDebuffs = getAutomationEffectOptions('enemy-debuff')
  if (condition.type === 'always') return <div className="spell-automation-condition-row"><select aria-label="Condition type" value="always" disabled><option value="always">Always</option></select><span className="spell-automation-condition-fallback">Fallback rule</span></div>
  if (!isKnownCondition(condition)) return <div className="spell-automation-condition-row spell-automation-unsupported-condition"><div><strong>Unsupported Condition</strong><code>{String((condition as { type?: unknown }).type ?? 'unknown')}</code></div>{!disabled && <RemoveConditionButton onRemove={onRemove} />}</div>
  return <div className="spell-automation-condition-row">
    <select aria-label="Condition type" disabled={disabled} value={condition.type} onChange={(event) => onChange(event.target.value === 'always' ? { type: 'always' } : createCondition(event.target.value as EditableConditionType))}><option value="always">Always</option>{conditionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    {condition.type === 'player-hp' || condition.type === 'enemy-hp' || condition.type === 'mana' ? <><select aria-label="Condition operator" disabled={disabled} value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'below' | 'above' })}><option value="below">Below</option><option value="above">Above</option></select><input aria-label="Condition percentage" disabled={disabled} type="number" min={1} max={100} value={condition.percent} onChange={(event) => onChange({ ...condition, percent: Number(event.target.value) })} /><span>%</span></> : null}
    {condition.type === 'player-buff' || condition.type === 'enemy-debuff' ? <><select aria-label="Effect operator" disabled={disabled} value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'missing' | 'has' | 'remaining-below', seconds: event.target.value === 'remaining-below' ? condition.seconds ?? 1 : undefined })}><option value="missing">Missing</option><option value="has">Has</option><option value="remaining-below">Remaining Below</option></select><select aria-label="Effect" disabled={disabled} value={condition.effectId} onChange={(event) => onChange({ ...condition, effectId: event.target.value as typeof condition.effectId })}>{(condition.type === 'player-buff' ? playerBuffs : enemyDebuffs).map((effect) => <option key={effect.id} value={effect.id}>{effect.label}</option>)}</select>{condition.operator === 'remaining-below' && <><input aria-label="Duration seconds" disabled={disabled} type="number" min={0} step={0.1} value={condition.seconds ?? 1} onChange={(event) => onChange({ ...condition, seconds: Number(event.target.value) })} /><span>sec</span></>}</> : null}
    {condition.type === 'boss' ? <select aria-label="Boss operator" disabled={disabled} value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'is' | 'is-not' })}><option value="is">Is Boss</option><option value="is-not">Is Not Boss</option></select> : null}
    {condition.type === 'player-barrier-below' ? <><span>&lt;</span><input aria-label="Barrier value" disabled={disabled} type="number" min={0} value={condition.value} onChange={(event) => onChange({ ...condition, value: Math.max(0, Number(event.target.value)) })} /><span>barrier</span></> : null}
    {condition.type === 'player-has-cleanseable-debuff' ? <span className="spell-automation-condition-static">Has cleanseable debuff</span> : null}
    {!disabled && <RemoveConditionButton onRemove={onRemove} />}
  </div>
}

function RemoveConditionButton({ onRemove }: { onRemove: () => void }) {
  return <GameTooltip accent="warning" content={<TooltipContent title="Remove Condition" description="Remove this exact condition from the AND rule." />}><Button variant="ghost" className="spell-automation-remove-condition" icon dataNoDrag ariaLabel="Remove Condition" onClick={onRemove}><Minus size={15} aria-hidden="true" /></Button></GameTooltip>
}

export function CombatAutomationOverviewModal({ open, presetName, slots, readOnly = false, onClose, onEdit, onToggleMode }: { open: boolean; presetName: string; slots: SpellPresetSlot[]; readOnly?: boolean; onClose: () => void; onEdit: (index: number) => void; onToggleMode: (slot: SpellPresetSlot) => void }) {
  if (!open) return null
  return <ModalPortal open={open} onClose={onClose} backdropClassName="spell-automation-backdrop" surfaceClassName="combat-automation-overview-modal" ariaLabel="Combat Automation Overview">
    <header className="spell-automation-modal-header"><div><span className="panel-kicker">COMBAT AUTOMATION</span><h2>Automation Overview</h2><p>Preset: {presetName}</p></div><Button variant="ghost" icon dataNoDrag ariaLabel="Close Combat Automation Overview" onClick={onClose}><X size={17} aria-hidden="true" /></Button></header>
    <div className="combat-automation-overview-body"><div className="combat-automation-overview-head"><span>PRIORITY</span><span>SPELL</span><span>MODE</span><span>RULE</span><span>ACTION</span></div>{slots.length ? slots.map((slot, index) => { const spell = SPELLS[slot.spellId]; const school = SCHOOLS[spell.school]; return <div className="combat-automation-overview-row" key={`${slot.spellId}-${index}`}><strong>{String(index + 1).padStart(2, '0')}</strong><div className="combat-automation-spell"><GameTooltip wide placement="right" delay={200} content={<LiveSpellCardTooltip spellId={spell.id} />}><span className="combat-automation-spell-icon-tooltip-target"><SpellIcon school={spell.school} spellId={spell.id} size="small" /></span></GameTooltip><span><b>{spell.name}</b><small>{school.name.toUpperCase()}</small></span></div><GameTooltip content={<TooltipContent title={slot.autoCast ? 'Auto-Cast Enabled' : 'Manual Only'} description={slot.autoCast ? 'This Spell may be selected by combat automation.' : 'This Spell is excluded from combat automation.'} />}><Button variant={slot.autoCast ? 'success' : 'secondary'} className="combat-automation-mode" disabled={readOnly} ariaPressed={slot.autoCast} onClick={() => onToggleMode(slot)}>{slot.autoCast ? 'AUTO' : 'MANUAL'}</Button></GameTooltip><GameTooltip content={<TooltipContent title="Automation Rule" description="Review the configured conditions for this Spell." />}><span className="combat-automation-summary">{formatSpellAutomationSummary(slot)}</span></GameTooltip><GameTooltip content={<TooltipContent title={readOnly ? 'View Automation' : 'Edit Automation'} description={readOnly ? 'Inspect this Spell’s automation without changing the active battle snapshot.' : 'Edit this Spell’s mode, target, and conditions.'} />}><Button variant="ghost" onClick={() => onEdit(index)}><SlidersHorizontal size={13} aria-hidden="true" /> {readOnly ? 'VIEW' : 'EDIT'}</Button></GameTooltip></div> }) : <p className="combat-automation-empty">No prepared Spells in this preset.</p>}</div>
    <footer className="spell-automation-modal-footer"><span>Priority is determined by Combat Loadout order.</span><Button variant="secondary" onClick={onClose}>DONE</Button></footer>
  </ModalPortal>
}

function AutomationEvaluationPanel({ evaluation, priorityPreview, activeCombat, detailsOpen, onToggleDetails }: { evaluation: SpellAutomationEvaluation | null; priorityPreview: ReturnType<typeof getSpellAutomationPriorityPreview> | null; activeCombat: boolean; detailsOpen: boolean; onToggleDetails: () => void }) {
  if (!evaluation) return null
  const manualOverride = activeCombat && evaluation.mode === 'auto' ? evaluation.systemChecks.find((check) => check.key === 'manual-override' && !check.passed) : undefined
  const waitingForPriority = Boolean(activeCombat && evaluation.eligible && priorityPreview && !priorityPreview.isNext)
  const status = !activeCombat ? 'WAITING FOR COMBAT' : evaluation.mode === 'manual' ? 'MANUAL' : manualOverride ? 'MANUAL OVERRIDE' : waitingForPriority ? 'WAITING PRIORITY' : evaluation.eligible ? 'WOULD CAST' : 'BLOCKED'
  const blockingSpell = priorityPreview?.blockingSpellId ? SPELLS[priorityPreview.blockingSpellId] : null
  const summary = !activeCombat ? 'Live cast evaluation becomes available during an encounter.' : manualOverride?.reason ?? (waitingForPriority ? `Eligible, but ${blockingSpell?.name ?? 'an earlier AUTO Spell'} has higher priority.` : evaluation.eligible ? 'All conditions and system checks pass.' : evaluation.failureReason ?? 'A required condition or system check is not met.')
  return <section className="spell-automation-section spell-automation-evaluation"><div className="spell-automation-evaluation-heading"><div><span className="section-label">EVALUATION</span><p className="spell-automation-evaluation-summary">{summary}</p></div><Status tone={!activeCombat ? 'neutral' : waitingForPriority ? 'warning' : evaluation.eligible ? 'success' : 'warning'}>{status}</Status></div><GameTooltip content={<TooltipContent title={detailsOpen ? 'Hide Evaluation Details' : 'Show Evaluation Details'} description="Inspect the condition and system checks used by the automation evaluator." />}><Button variant="ghost" className="spell-automation-details-toggle" ariaPressed={detailsOpen} onClick={onToggleDetails}>{detailsOpen ? 'HIDE DETAILS' : 'SHOW DETAILS'}</Button></GameTooltip>{detailsOpen && <div className="spell-automation-evaluation-details">{!activeCombat ? <><div className="spell-automation-check-group"><small>CONFIGURED RULES</small>{evaluation.conditions.map((check) => <div className="spell-automation-check" key={check.key}><Status tone="success">✓</Status><span><b>{check.label}</b></span></div>)}</div><div className="spell-automation-live-note"><small>LIVE CHECKS</small><span>Available when combat starts.</span></div></> : <><div className="spell-automation-check-group"><small>CONDITIONS</small>{evaluation.conditions.map((check) => <div className="spell-automation-check" key={check.key}><Status tone={toneForCheck(check)}>{check.passed ? '✓' : '•'}</Status><span><b>{check.label}</b><em>{check.reason}</em></span></div>)}</div><div className="spell-automation-check-group"><small>SYSTEM CHECKS</small>{evaluation.systemChecks.map((check) => <div className="spell-automation-check" key={check.key}><Status tone={toneForCheck(check)}>{check.passed ? '✓' : '•'}</Status><span><b>{check.label}</b><em>{check.reason}</em></span></div>)}</div></>}</div>}</section>
}
