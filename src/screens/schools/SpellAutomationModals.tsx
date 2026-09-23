import { Minus, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, GameTooltip, ModalPortal, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SPELLS } from '../../game/content/spells/spells'
import { SCHOOLS } from '../../game/content/schools/schools'
import {
  evaluateSpellAutomation,
  formatSpellAutomationSummary,
  getAutomationEffectOptions,
  getDefaultSpellAutomationConfig,
  getSpellAutomationConfig,
  getSpellAutomationTargetOptions,
  MAX_AUTOMATION_CONDITIONS,
  normalizeSpellAutomationConfig,
  type SpellAutomationEvaluation,
} from '../../game/systems/spells'
import type { SpellAutomationCondition, SpellAutomationConfig, SpellAutomationTargetRule, SpellPresetSlot } from '../../game/types'
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

export function SpellAutomationModal({ open, slot, slotIndex, presetName, onClose, onApply }: { open: boolean; slot: SpellPresetSlot | null; slotIndex: number; presetName: string; onClose: () => void; onApply: (config: SpellAutomationConfig, autoCast: boolean) => void }) {
  const liveState = useGameStore()
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

  const evaluation = useMemo<SpellAutomationEvaluation | null>(() => {
    if (!slot || !draft) return null
    return evaluateSpellAutomation(liveState, { ...slot, autoCast: draft.autoCast, automation: normalizeSpellAutomationConfig(draft, slot.spellId, draft.autoCast, false) })
  }, [draft, liveState, slot])
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
      <div className="spell-automation-title"><SpellIcon school={spell.school} spellId={spell.id} size="medium" /><div><span className="panel-kicker">{school.name.toUpperCase()} · SLOT {String(slotIndex + 1).padStart(2, '0')}</span><h2>{spell.name} — AUTOMATION</h2><p>{presetName} · priority follows Combat Loadout order</p></div></div>
      <Button variant="ghost" icon dataNoDrag ariaLabel="Close Spell Automation" onClick={requestClose}><X size={17} aria-hidden="true" /></Button>
    </header>
    <div className="spell-automation-modal-body">
      <section className="spell-automation-section spell-automation-main-section">
        <div className="spell-automation-section-heading"><div><span className="section-label">AUTOMATION</span><p>Only AUTO spells are considered from top to bottom.</p></div><Button variant={draft.autoCast ? 'success' : 'secondary'} ariaPressed={draft.autoCast} onClick={() => setDraft((current) => current ? { ...current, autoCast: !current.autoCast } : current)}>{draft.autoCast ? 'ON · AUTO' : 'OFF · MANUAL'}</Button></div>
        <div className="spell-automation-condition-heading"><span>CAST WHEN</span><small>ALL CONDITIONS MUST BE TRUE</small></div>
        <div className="spell-automation-condition-list">{draft.conditions.map((condition, index) => <AutomationConditionRow key={`${index}-${condition.type}`} condition={condition} onChange={(next) => updateCondition(index, next)} onRemove={() => removeCondition(index)} />)}</div>
        <Button variant="ghost" className="spell-automation-add-condition" disabled={draft.conditions.length >= MAX_AUTOMATION_CONDITIONS} onClick={addCondition}><Plus size={14} aria-hidden="true" /> ADD CONDITION</Button>
        <small className="spell-automation-limit">{draft.conditions.length} / {MAX_AUTOMATION_CONDITIONS} conditions</small>
        {hasDuplicateConditions && <small className="spell-automation-duplicate-warning">Duplicate conditions must be changed before applying.</small>}
      </section>
      <section className="spell-automation-section spell-automation-compact-section"><span className="section-label">TARGET</span><div className="spell-automation-target">{targetOptions.length === 1 ? <strong>{targetOptions[0].label}</strong> : <select aria-label="Automation target" value={draft.targetRule} onChange={(event) => setDraft((current) => current ? { ...current, targetRule: event.target.value as SpellAutomationTargetRule } : current)}>{targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}<small>{draft.targetRule === 'self' ? 'This Spell affects the wizard.' : 'This Spell uses the current enemy target.'}</small></div></section>
      <section className="spell-automation-section spell-automation-compact-section"><span className="section-label">PRIORITY</span><div className="spell-automation-priority"><strong>{String(slotIndex + 1).padStart(2, '0')} · Combat Loadout order</strong><p>Move this Spell in the loadout to change its priority.</p></div></section>
      <AutomationEvaluationPanel evaluation={evaluation} activeCombat={liveState.combat.active} detailsOpen={showEvaluationDetails} onToggleDetails={() => setShowEvaluationDetails((value) => !value)} />
    </div>
    <footer className="spell-automation-modal-footer"><Button variant="ghost" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> RESET</Button><span className="spell-automation-footer-spacer" />{confirmDiscard ? <><span className="spell-automation-discard-copy">Discard automation changes?</span><Button variant="ghost" onClick={() => setConfirmDiscard(false)}>CANCEL</Button><Button variant="danger" onClick={onClose}>DISCARD</Button></> : <><Button variant="ghost" onClick={requestClose}>CANCEL</Button><Button variant="primary" disabled={hasDuplicateConditions} onClick={apply}>APPLY</Button></>}</footer>
  </ModalPortal>
}

function AutomationConditionRow({ condition, onChange, onRemove }: { condition: SpellAutomationCondition; onChange: (condition: SpellAutomationCondition) => void; onRemove: () => void }) {
  const playerBuffs = getAutomationEffectOptions('player-buff')
  const enemyDebuffs = getAutomationEffectOptions('enemy-debuff')
  if (condition.type === 'always') return <div className="spell-automation-condition-row"><select aria-label="Condition type" value="always" disabled><option value="always">Always</option></select><span className="spell-automation-condition-fallback">Fallback rule</span></div>
  if (!isKnownCondition(condition)) return <div className="spell-automation-condition-row spell-automation-unsupported-condition"><div><strong>Unsupported Condition</strong><code>{String((condition as { type?: unknown }).type ?? 'unknown')}</code></div><RemoveConditionButton onRemove={onRemove} /></div>
  return <div className="spell-automation-condition-row">
    <select aria-label="Condition type" value={condition.type} onChange={(event) => onChange(event.target.value === 'always' ? { type: 'always' } : createCondition(event.target.value as EditableConditionType))}><option value="always">Always</option>{conditionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    {condition.type === 'player-hp' || condition.type === 'enemy-hp' || condition.type === 'mana' ? <><select aria-label="Condition operator" value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'below' | 'above' })}><option value="below">Below</option><option value="above">Above</option></select><input aria-label="Condition percentage" type="number" min={1} max={100} value={condition.percent} onChange={(event) => onChange({ ...condition, percent: Number(event.target.value) })} /><span>%</span></> : null}
    {condition.type === 'player-buff' || condition.type === 'enemy-debuff' ? <><select aria-label="Effect operator" value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'missing' | 'has' | 'remaining-below', seconds: event.target.value === 'remaining-below' ? condition.seconds ?? 1 : undefined })}><option value="missing">Missing</option><option value="has">Has</option><option value="remaining-below">Remaining Below</option></select><select aria-label="Effect" value={condition.effectId} onChange={(event) => onChange({ ...condition, effectId: event.target.value as typeof condition.effectId })}>{(condition.type === 'player-buff' ? playerBuffs : enemyDebuffs).map((effect) => <option key={effect.id} value={effect.id}>{effect.label}</option>)}</select>{condition.operator === 'remaining-below' && <><input aria-label="Duration seconds" type="number" min={0} step={0.1} value={condition.seconds ?? 1} onChange={(event) => onChange({ ...condition, seconds: Number(event.target.value) })} /><span>sec</span></>}</> : null}
    {condition.type === 'boss' ? <select aria-label="Boss operator" value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'is' | 'is-not' })}><option value="is">Is Boss</option><option value="is-not">Is Not Boss</option></select> : null}
    {condition.type === 'player-barrier-below' ? <><span>&lt;</span><input aria-label="Barrier value" type="number" min={0} value={condition.value} onChange={(event) => onChange({ ...condition, value: Math.max(0, Number(event.target.value)) })} /><span>barrier</span></> : null}
    {condition.type === 'player-has-cleanseable-debuff' ? <span className="spell-automation-condition-static">Has cleanseable debuff</span> : null}
    <RemoveConditionButton onRemove={onRemove} />
  </div>
}

function RemoveConditionButton({ onRemove }: { onRemove: () => void }) {
  return <GameTooltip accent="warning" content={<TooltipContent title="Remove Condition" description="Remove this exact condition from the AND rule." />}><Button variant="ghost" className="spell-automation-remove-condition" icon dataNoDrag ariaLabel="Remove Condition" onClick={onRemove}><Minus size={15} aria-hidden="true" /></Button></GameTooltip>
}

export function CombatAutomationOverviewModal({ open, presetName, slots, onClose, onEdit, onToggleMode }: { open: boolean; presetName: string; slots: SpellPresetSlot[]; onClose: () => void; onEdit: (index: number) => void; onToggleMode: (slot: SpellPresetSlot) => void }) {
  return <ModalPortal open={open} onClose={onClose} backdropClassName="spell-automation-backdrop" surfaceClassName="combat-automation-overview-modal" ariaLabel="Combat Automation Overview">
    <header className="spell-automation-modal-header"><div><span className="panel-kicker">COMBAT AUTOMATION</span><h2>Automation Overview</h2><p>Preset: {presetName}</p></div><Button variant="ghost" icon dataNoDrag ariaLabel="Close Combat Automation Overview" onClick={onClose}><X size={17} aria-hidden="true" /></Button></header>
    <div className="combat-automation-overview-body"><div className="combat-automation-overview-head"><span>PRIORITY</span><span>SPELL</span><span>MODE</span><span>RULE</span><span>ACTION</span></div>{slots.length ? slots.map((slot, index) => { const spell = SPELLS[slot.spellId]; const school = SCHOOLS[spell.school]; return <div className="combat-automation-overview-row" key={`${slot.spellId}-${index}`}><strong>{String(index + 1).padStart(2, '0')}</strong><div className="combat-automation-spell"><SpellIcon school={spell.school} spellId={spell.id} size="small" /><span><b>{spell.name}</b><small>{school.name.toUpperCase()}</small></span></div><Button variant={slot.autoCast ? 'success' : 'secondary'} className="combat-automation-mode" ariaPressed={slot.autoCast} onClick={() => onToggleMode(slot)}>{slot.autoCast ? 'AUTO' : 'MANUAL'}</Button><span className="combat-automation-summary">{formatSpellAutomationSummary(slot)}</span><Button variant="ghost" onClick={() => onEdit(index)}><SlidersHorizontal size={13} aria-hidden="true" /> EDIT</Button></div> }) : <p className="combat-automation-empty">No prepared Spells in this preset.</p>}</div>
    <footer className="spell-automation-modal-footer"><span>Priority is determined by Combat Loadout order.</span><Button variant="secondary" onClick={onClose}>DONE</Button></footer>
  </ModalPortal>
}

function AutomationEvaluationPanel({ evaluation, activeCombat, detailsOpen, onToggleDetails }: { evaluation: SpellAutomationEvaluation | null; activeCombat: boolean; detailsOpen: boolean; onToggleDetails: () => void }) {
  if (!evaluation) return null
  const status = !activeCombat ? 'WAITING FOR COMBAT' : evaluation.mode === 'manual' ? 'MANUAL' : evaluation.eligible ? 'WOULD CAST' : 'BLOCKED'
  const summary = !activeCombat ? 'Live cast evaluation becomes available during an encounter.' : evaluation.eligible ? 'All conditions and system checks pass.' : evaluation.failureReason ?? 'A required condition or system check is not met.'
  return <section className="spell-automation-section spell-automation-evaluation"><div className="spell-automation-evaluation-heading"><div><span className="section-label">EVALUATION</span><p className="spell-automation-evaluation-summary">{summary}</p></div><Status tone={!activeCombat ? 'neutral' : evaluation.eligible ? 'success' : 'warning'}>{status}</Status></div><Button variant="ghost" className="spell-automation-details-toggle" ariaPressed={detailsOpen} onClick={onToggleDetails}>{detailsOpen ? 'HIDE DETAILS' : 'SHOW DETAILS'}</Button>{detailsOpen && <div className="spell-automation-evaluation-details">{!activeCombat ? <><div className="spell-automation-check-group"><small>CONFIGURED RULES</small>{evaluation.conditions.map((check) => <div className="spell-automation-check" key={check.key}><Status tone="success">✓</Status><span><b>{check.label}</b></span></div>)}</div><div className="spell-automation-live-note"><small>LIVE CHECKS</small><span>Available when combat starts.</span></div></> : <><div className="spell-automation-check-group"><small>CONDITIONS</small>{evaluation.conditions.map((check) => <div className="spell-automation-check" key={check.key}><Status tone={toneForCheck(check)}>{check.passed ? '✓' : '•'}</Status><span><b>{check.label}</b><em>{check.reason}</em></span></div>)}</div><div className="spell-automation-check-group"><small>SYSTEM CHECKS</small>{evaluation.systemChecks.map((check) => <div className="spell-automation-check" key={check.key}><Status tone={toneForCheck(check)}>{check.passed ? '✓' : '•'}</Status><span><b>{check.label}</b><em>{check.reason}</em></span></div>)}</div></>}</div>}</section>
}
