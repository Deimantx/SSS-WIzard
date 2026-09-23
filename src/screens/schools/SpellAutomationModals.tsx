import { Plus, RotateCcw, SlidersHorizontal, Trash2, X } from 'lucide-react'
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
] as const

const createCondition = (type: typeof conditionTypes[number][0]): SpellAutomationCondition => {
  if (type === 'player-hp' || type === 'enemy-hp' || type === 'mana') return { type, operator: 'below', percent: 50 }
  if (type === 'player-buff' || type === 'enemy-debuff') return { type, operator: 'missing', effectId: type === 'player-buff' ? 'regeneration' : 'kindled' }
  return { type: 'boss', operator: 'is' }
}

const draftFromSlot = (slot: SpellPresetSlot): AutomationDraft => {
  const config = getSpellAutomationConfig(slot)
  return { ...config, conditions: config.conditions.map((condition) => ({ ...condition })), autoCast: slot.autoCast }
}

const toneForCheck = (check: { passed: boolean }): 'success' | 'warning' => check.passed ? 'success' : 'warning'

export function SpellAutomationModal({ open, slot, slotIndex, presetName, onClose, onApply }: { open: boolean; slot: SpellPresetSlot | null; slotIndex: number; presetName: string; onClose: () => void; onApply: (config: SpellAutomationConfig, autoCast: boolean) => void }) {
  const liveState = useGameStore()
  const [draft, setDraft] = useState<AutomationDraft | null>(null)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const spell = slot ? SPELLS[slot.spellId] : null
  const school = spell ? SCHOOLS[spell.school] : null

  useEffect(() => {
    if (open && slot) {
      setDraft(draftFromSlot(slot))
      setConfirmDiscard(false)
    }
  }, [open, slot?.spellId, slot?.autoCast, slot?.automation])

  const evaluation = useMemo<SpellAutomationEvaluation | null>(() => {
    if (!slot || !draft) return null
    return evaluateSpellAutomation(liveState, { ...slot, autoCast: draft.autoCast, automation: normalizeSpellAutomationConfig(draft, slot.spellId, draft.autoCast, false) })
  }, [draft, liveState, slot])
  if (!slot || !spell || !school || !draft) return null

  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFromSlot(slot))
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
    return { ...current, conditions: [...conditions, createCondition('player-hp')] }
  })
  const reset = () => setDraft({ ...getDefaultSpellAutomationConfig(slot.spellId, true, false), autoCast: true })
  const apply = () => { onApply(normalizeSpellAutomationConfig(draft, slot.spellId, draft.autoCast, false), draft.autoCast); onClose() }

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
      </section>
      <section className="spell-automation-section"><span className="section-label">TARGET</span><div className="spell-automation-target"><select aria-label="Automation target" value={draft.targetRule} disabled={getSpellAutomationTargetOptions(slot.spellId).length === 1} onChange={(event) => setDraft((current) => current ? { ...current, targetRule: event.target.value as SpellAutomationTargetRule } : current)}>{getSpellAutomationTargetOptions(slot.spellId).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><small>{draft.targetRule === 'self' ? 'This Spell affects the wizard.' : 'This Spell uses the current enemy target.'}</small></div></section>
      <section className="spell-automation-section"><span className="section-label">PRIORITY</span><div className="spell-automation-priority"><strong>Current Priority: {String(slotIndex + 1).padStart(2, '0')}</strong><p>Priority is determined by Combat Loadout order. Move this Spell in the loadout to change when it is checked.</p></div></section>
      <AutomationEvaluationPanel evaluation={evaluation} activeCombat={liveState.combat.active} />
    </div>
    <footer className="spell-automation-modal-footer"><Button variant="ghost" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> RESET</Button><span className="spell-automation-footer-spacer" />{confirmDiscard ? <><span className="spell-automation-discard-copy">Discard automation changes?</span><Button variant="ghost" onClick={() => setConfirmDiscard(false)}>CANCEL</Button><Button variant="danger" onClick={onClose}>DISCARD</Button></> : <><Button variant="ghost" onClick={requestClose}>CANCEL</Button><Button variant="primary" onClick={apply}>APPLY</Button></>}</footer>
  </ModalPortal>
}

function AutomationConditionRow({ condition, onChange, onRemove }: { condition: SpellAutomationCondition; onChange: (condition: SpellAutomationCondition) => void; onRemove: () => void }) {
  const playerBuffs = getAutomationEffectOptions('player-buff')
  const enemyDebuffs = getAutomationEffectOptions('enemy-debuff')
  const currentType = condition.type === 'always' ? 'always' : condition.type
  return <div className="spell-automation-condition-row">
    <select aria-label="Condition type" value={currentType} disabled={condition.type === 'always'} onChange={(event) => onChange(event.target.value === 'always' ? { type: 'always' } : createCondition(event.target.value as typeof conditionTypes[number][0]))}><option value="always">Always</option>{conditionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    {condition.type === 'player-hp' || condition.type === 'enemy-hp' || condition.type === 'mana' ? <><select aria-label="Condition operator" value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'below' | 'above' })}><option value="below">Below</option><option value="above">Above</option></select><input aria-label="Condition percentage" type="number" min={1} max={100} value={condition.percent} onChange={(event) => onChange({ ...condition, percent: Number(event.target.value) })} /><span>%</span></> : null}
    {condition.type === 'player-buff' || condition.type === 'enemy-debuff' ? <><select aria-label="Effect operator" value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'missing' | 'has' | 'remaining-below', seconds: event.target.value === 'remaining-below' ? condition.seconds ?? 1 : undefined })}><option value="missing">Missing</option><option value="has">Has</option><option value="remaining-below">Remaining Below</option></select><select aria-label="Effect" value={condition.effectId} onChange={(event) => onChange({ ...condition, effectId: event.target.value as typeof condition.effectId })}>{(condition.type === 'player-buff' ? playerBuffs : enemyDebuffs).map((effect) => <option key={effect.id} value={effect.id}>{effect.label}</option>)}</select>{condition.operator === 'remaining-below' && <><input aria-label="Duration seconds" type="number" min={0} step={0.1} value={condition.seconds ?? 1} onChange={(event) => onChange({ ...condition, seconds: Number(event.target.value) })} /><span>sec</span></>}</> : null}
    {condition.type === 'boss' ? <select aria-label="Boss operator" value={condition.operator} onChange={(event) => onChange({ ...condition, operator: event.target.value as 'is' | 'is-not' })}><option value="is">Is Boss</option><option value="is-not">Is Not Boss</option></select> : null}
    <GameTooltip content={<TooltipContent title="Remove Condition" description="Remove this condition from the AND rule." />}><Button variant="ghost" icon dataNoDrag ariaLabel="Remove Condition" onClick={onRemove}><Trash2 size={13} aria-hidden="true" /></Button></GameTooltip>
  </div>
}

export function CombatAutomationOverviewModal({ open, presetName, slots, onClose, onEdit, onToggleMode }: { open: boolean; presetName: string; slots: SpellPresetSlot[]; onClose: () => void; onEdit: (index: number) => void; onToggleMode: (slot: SpellPresetSlot) => void }) {
  return <ModalPortal open={open} onClose={onClose} backdropClassName="spell-automation-backdrop" surfaceClassName="combat-automation-overview-modal" ariaLabel="Combat Automation Overview">
    <header className="spell-automation-modal-header"><div><span className="panel-kicker">COMBAT AUTOMATION</span><h2>Automation Overview</h2><p>Preset: {presetName}</p></div><Button variant="ghost" icon dataNoDrag ariaLabel="Close Combat Automation Overview" onClick={onClose}><X size={17} aria-hidden="true" /></Button></header>
    <div className="combat-automation-overview-body"><div className="combat-automation-overview-head"><span>PRIORITY</span><span>SPELL</span><span>MODE</span><span>RULE</span><span>ACTION</span></div>{slots.length ? slots.map((slot, index) => { const spell = SPELLS[slot.spellId]; const school = SCHOOLS[spell.school]; return <div className="combat-automation-overview-row" key={`${slot.spellId}-${index}`}><strong>{String(index + 1).padStart(2, '0')}</strong><div className="combat-automation-spell"><SpellIcon school={spell.school} spellId={spell.id} size="small" /><span><b>{spell.name}</b><small>{school.name.toUpperCase()}</small></span></div><Button variant={slot.autoCast ? 'success' : 'secondary'} className="combat-automation-mode" ariaPressed={slot.autoCast} onClick={() => onToggleMode(slot)}>{slot.autoCast ? 'AUTO' : 'MANUAL'}</Button><span className="combat-automation-summary">{formatSpellAutomationSummary(slot)}</span><Button variant="ghost" onClick={() => onEdit(index)}><SlidersHorizontal size={13} aria-hidden="true" /> EDIT</Button></div> }) : <p className="combat-automation-empty">No prepared Spells in this preset.</p>}</div>
    <footer className="spell-automation-modal-footer"><span>Priority is determined by Combat Loadout order.</span><Button variant="secondary" onClick={onClose}>DONE</Button></footer>
  </ModalPortal>
}

function AutomationEvaluationPanel({ evaluation, activeCombat }: { evaluation: SpellAutomationEvaluation | null; activeCombat: boolean }) {
  if (!evaluation) return null
  return <section className="spell-automation-section spell-automation-evaluation"><div className="spell-automation-evaluation-heading"><span className="section-label">CURRENT EVALUATION</span><Status tone={evaluation.eligible ? 'success' : 'warning'}>{evaluation.mode === 'manual' ? 'MANUAL' : evaluation.eligible ? 'WOULD CAST NOW' : 'WOULD NOT CAST'}</Status></div>{!activeCombat && <p className="spell-automation-preview-note">Combat preview unavailable outside combat. Rules will evaluate when an encounter is active.</p>}<div className="spell-automation-check-group"><small>CONDITIONS</small>{evaluation.conditions.map((check) => <div className="spell-automation-check" key={check.key}><Status tone={toneForCheck(check)}>{check.passed ? '✓' : '•'}</Status><span><b>{check.label}</b><em>{check.reason}</em></span></div>)}</div><div className="spell-automation-check-group"><small>SYSTEM CHECKS</small>{evaluation.systemChecks.map((check) => <div className="spell-automation-check" key={check.key}><Status tone={toneForCheck(check)}>{check.passed ? '✓' : '•'}</Status><span><b>{check.label}</b><em>{check.reason}</em></span></div>)}</div>{evaluation.failureReason && <p className="spell-automation-failure">{evaluation.failureReason}</p>}</section>
}
