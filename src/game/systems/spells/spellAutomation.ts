import { MONSTERS, isBossMonster } from '../../content/monsters'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { SPELLS } from '../../content/spells/spells'
import { actorCannotAct, actorCannotCastSpells } from '../combat/statusRuntime'
import { isSpellUnlocked } from './spellProgression'
import { getSpellManaPreview } from '../../engine/spellCastPreview'
import type { AutoCastCondition, CanonicalSpellId, GameState, SpellAutomationCondition, SpellAutomationConfig, SpellAutomationTargetRule, SpellDefinition, SpellPresetSlot, StatusId } from '../../types'

export const MAX_AUTOMATION_CONDITIONS = 5

export interface AutomationCheck {
  key: string
  passed: boolean
  label: string
  reason: string
}

export interface SpellAutomationEvaluation {
  eligible: boolean
  mode: 'auto' | 'manual'
  conditions: AutomationCheck[]
  systemChecks: AutomationCheck[]
  failureReason?: string
}

export interface AutomatedSpellSelection {
  spellId: CanonicalSpellId
  slotIndex: number
  evaluation: SpellAutomationEvaluation
  trace: Array<{ slotIndex: number; spellId: CanonicalSpellId; mode: 'auto' | 'manual'; evaluation?: SpellAutomationEvaluation }>
}

export interface SpellAutomationPriorityPreview {
  isNext: boolean
  firstEligibleSlotIndex: number | null
  blockingSpellId?: CanonicalSpellId
}

export interface AutomationEffectOption {
  id: StatusId
  label: string
}

const isStatusId = (value: unknown): value is StatusId => typeof value === 'string' && Object.prototype.hasOwnProperty.call(STATUS_DEFINITIONS, value)
const clampPercent = (value: unknown) => Math.max(1, Math.min(100, Number.isFinite(Number(value)) ? Number(value) : 50))
const clampSeconds = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 1)
const hasEnemyTarget = (spell: SpellDefinition) => spell.effects.some((effect) => effect.target === 'opponent')

export const getSpellAutomationTargetOptions = (spellId: CanonicalSpellId): Array<{ value: SpellAutomationTargetRule; label: string }> => {
  const spell = SPELLS[spellId]
  return spell && hasEnemyTarget(spell) ? [{ value: 'current-enemy', label: 'Current Enemy' }] : [{ value: 'self', label: 'Self' }]
}

export const getDefaultSpellAutomationTarget = (spellId: CanonicalSpellId): SpellAutomationTargetRule => getSpellAutomationTargetOptions(spellId)[0].value

const legacyConditionToAutomation = (condition: AutoCastCondition | undefined): SpellAutomationCondition[] => {
  if (!condition || condition.type === 'always') return [{ type: 'always' }]
  if (condition.type === 'all') return condition.conditions.flatMap((entry) => legacyConditionToAutomation(entry)).filter((entry) => entry.type !== 'always')
  if (condition.type === 'health-below') return [{ type: 'player-hp', operator: 'below', percent: clampPercent(condition.percent) }]
  if (condition.type === 'self-status-missing') return [{ type: 'player-buff', operator: 'missing', effectId: condition.statusId }]
  if (condition.type === 'target-status-missing') return [{ type: 'enemy-debuff', operator: 'missing', effectId: condition.statusId }]
  if (condition.type === 'barrier-below') return [{ type: 'player-barrier-below', value: Math.max(0, Number(condition.value) || 0) }]
  if (condition.type === 'self-has-cleanseable-debuff') return [{ type: 'player-has-cleanseable-debuff' }]
  return [{ type: 'always' }]
}

export const getDefaultSpellAutomationConfig = (spellId: CanonicalSpellId, autoCast: boolean, preserveAuthoredCondition = true): SpellAutomationConfig => {
  const spell = SPELLS[spellId]
  const authored = preserveAuthoredCondition ? legacyConditionToAutomation(spell?.autoCondition) : [{ type: 'always' as const }]
  return { conditions: authored.length ? authored : [{ type: 'always' }], targetRule: getDefaultSpellAutomationTarget(spellId) }
}

const normalizeCondition = (raw: unknown): SpellAutomationCondition | null => {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  switch (value.type) {
    case 'always': return { type: 'always' }
    case 'player-hp':
    case 'enemy-hp':
    case 'mana': return { type: value.type, operator: value.operator === 'above' ? 'above' : 'below', percent: clampPercent(value.percent) }
    case 'player-buff':
    case 'enemy-debuff': {
      if (!isStatusId(value.effectId)) return null
      const operator = value.operator === 'has' || value.operator === 'remaining-below' ? value.operator : 'missing'
      return operator === 'remaining-below'
        ? { type: value.type, operator, effectId: value.effectId, seconds: clampSeconds(value.seconds) }
        : { type: value.type, operator, effectId: value.effectId }
    }
    case 'boss': return { type: 'boss', operator: value.operator === 'is-not' ? 'is-not' : 'is' }
    case 'player-barrier-below': return { type: 'player-barrier-below', value: Math.max(0, Number(value.value) || 0) }
    case 'player-has-cleanseable-debuff': return { type: 'player-has-cleanseable-debuff' }
    default: return null
  }
}

export const normalizeSpellAutomationConfig = (raw: unknown, spellId: CanonicalSpellId, autoCast: boolean, preserveAuthoredCondition = true): SpellAutomationConfig => {
  const fallback = getDefaultSpellAutomationConfig(spellId, autoCast, preserveAuthoredCondition)
  if (!raw || typeof raw !== 'object') return fallback
  const value = raw as Record<string, unknown>
  const options = getSpellAutomationTargetOptions(spellId)
  const targetRule = options.some((option) => option.value === value.targetRule) ? value.targetRule as SpellAutomationTargetRule : fallback.targetRule
  const rawConditions = Array.isArray(value.conditions) ? value.conditions : []
  const seen = new Set<string>()
  const conditions = rawConditions.flatMap((entry) => {
    const condition = normalizeCondition(entry)
    if (!condition) return []
    const key = JSON.stringify(condition)
    if (seen.has(key)) return []
    seen.add(key)
    return [condition]
  }).slice(0, MAX_AUTOMATION_CONDITIONS)
  if (!conditions.length) return { conditions: [{ type: 'always' }], targetRule }
  const always = conditions.some((condition) => condition.type === 'always')
  return { conditions: always ? [{ type: 'always' }] : conditions, targetRule }
}

export const getSpellAutomationConfig = (slot: Pick<SpellPresetSlot, 'spellId' | 'autoCast' | 'automation'>): SpellAutomationConfig => normalizeSpellAutomationConfig(slot.automation, slot.spellId, slot.autoCast)

export const getAutomationEffectOptions = (kind: 'player-buff' | 'enemy-debuff'): AutomationEffectOption[] => Object.values(STATUS_DEFINITIONS)
  .filter((definition) => definition.classification === (kind === 'player-buff' ? 'buff' : 'debuff'))
  .map((definition) => ({ id: definition.id, label: definition.name }))

const formatPercent = (value: number) => `${Math.round(value)}%`
const formatSeconds = (value: number) => `${Number(value.toFixed(1))}s`

export const formatAutomationCondition = (condition: SpellAutomationCondition): string => {
  if (condition.type === 'always') return 'Always'
  if (condition.type === 'player-hp') return `Player HP ${condition.operator === 'below' ? '<' : '>'} ${formatPercent(condition.percent)}`
  if (condition.type === 'enemy-hp') return `Enemy HP ${condition.operator === 'below' ? '<' : '>'} ${formatPercent(condition.percent)}`
  if (condition.type === 'mana') return `Mana ${condition.operator === 'below' ? '<' : '>'} ${formatPercent(condition.percent)}`
  if (condition.type === 'boss') return `Enemy is ${condition.operator === 'is' ? '' : 'not '}Boss`
  if (condition.type === 'player-barrier-below') return `Player Barrier < ${Math.round(condition.value)}`
  if (condition.type === 'player-has-cleanseable-debuff') return 'Player has a cleanseable debuff'
  const name = STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Missing Effect'
  if (condition.operator === 'missing') return `Missing ${name}`
  if (condition.operator === 'has') return `Has ${name}`
  return `${name} < ${formatSeconds(condition.seconds ?? 0)}`
}

export const formatSpellAutomationSummary = (slot: Pick<SpellPresetSlot, 'spellId' | 'autoCast' | 'automation'>): string => {
  if (!slot.autoCast) return 'MANUAL'
  const conditions = getSpellAutomationConfig(slot).conditions
  if (conditions.length > 2) return `${conditions.length} CONDITIONS`
  return conditions.map(formatAutomationCondition).join(' + ')
}

const conditionResult = (condition: SpellAutomationCondition, passed: boolean, reason: string): AutomationCheck => ({ key: JSON.stringify(condition), passed, label: formatAutomationCondition(condition), reason })
const activeStatus = (state: GameState, actor: 'player' | 'enemy', statusId: StatusId) => (actor === 'player' ? state.combat.playerStatuses : state.combat.enemyStatuses).find((status) => status.statusId === statusId)

const evaluateCondition = (state: GameState, condition: SpellAutomationCondition): AutomationCheck => {
  if (condition.type === 'always') return conditionResult(condition, true, 'Always is enabled.')
  if (condition.type === 'player-hp') {
    const percent = state.player.health / Math.max(1, state.player.maxHealth) * 100
    const passed = condition.operator === 'below' ? percent < condition.percent : percent > condition.percent
    return conditionResult(condition, passed, `Player HP is ${formatPercent(percent)}, requires ${condition.operator} ${formatPercent(condition.percent)}.`)
  }
  if (condition.type === 'enemy-hp') {
    const percent = state.combat.enemyId ? state.combat.enemyHp / Math.max(1, state.combat.enemyMaxHp) * 100 : null
    if (percent === null) return conditionResult(condition, false, 'Enemy HP is unavailable outside an active enemy encounter.')
    const passed = condition.operator === 'below' ? percent < condition.percent : percent > condition.percent
    return conditionResult(condition, passed, `Enemy HP is ${formatPercent(percent)}, requires ${condition.operator} ${formatPercent(condition.percent)}.`)
  }
  if (condition.type === 'mana') {
    const percent = state.player.mana / Math.max(1, state.player.maxMana) * 100
    const passed = condition.operator === 'below' ? percent < condition.percent : percent > condition.percent
    return conditionResult(condition, passed, `Mana is ${formatPercent(percent)}, requires ${condition.operator} ${formatPercent(condition.percent)}.`)
  }
  if (condition.type === 'boss') {
    const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null
    if (!enemy) return conditionResult(condition, false, 'Boss state is unavailable outside an active enemy encounter.')
    const isBoss = isBossMonster(enemy)
    const passed = condition.operator === 'is' ? isBoss : !isBoss
    return conditionResult(condition, passed, isBoss ? 'Enemy is a boss.' : 'Enemy is not a boss.')
  }
  if (condition.type === 'player-barrier-below') {
    const passed = state.combat.playerBarrier < condition.value
    return conditionResult(condition, passed, `Player Barrier is ${Math.round(state.combat.playerBarrier)}, requires below ${Math.round(condition.value)}.`)
  }
  if (condition.type === 'player-has-cleanseable-debuff') {
    const passed = state.combat.playerStatuses.some((status) => STATUS_DEFINITIONS[status.statusId]?.classification === 'debuff' && STATUS_DEFINITIONS[status.statusId]?.cleanseable)
    return conditionResult(condition, passed, passed ? 'Player has a cleanseable debuff.' : 'Player has no cleanseable debuff.')
  }
  const actor = condition.type === 'player-buff' ? 'player' : 'enemy'
  const status = activeStatus(state, actor, condition.effectId)
  if (condition.operator === 'missing') return conditionResult(condition, !status, status ? `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} is active.` : `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} is missing.`)
  if (condition.operator === 'has') return conditionResult(condition, Boolean(status), status ? `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} is active.` : `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} is missing.`)
  const thresholdMs = (condition.seconds ?? 0) * 1000
  const passed = !status || (status.remainingMs !== null && status.remainingMs < thresholdMs)
  const reason = !status
    ? `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} is missing and needs applying.`
    : status.remainingMs === null
      ? `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} is permanent and has no expiry timer.`
      : `${STATUS_DEFINITIONS[condition.effectId]?.name ?? 'Effect'} has ${formatSeconds(status.remainingMs / 1000)} remaining, requires below ${formatSeconds(condition.seconds ?? 0)}.`
  return conditionResult(condition, passed, reason)
}

export const evaluateSpellAutomation = (state: GameState, slot: Pick<SpellPresetSlot, 'spellId' | 'autoCast' | 'automation'>): SpellAutomationEvaluation => {
  const spell = SPELLS[slot.spellId]
  const config = getSpellAutomationConfig(slot)
  const conditions = config.conditions.map((condition) => evaluateCondition(state, condition))
  const systemChecks: AutomationCheck[] = []
  const addSystem = (key: string, label: string, passed: boolean, reason: string) => systemChecks.push({ key, label, passed, reason })
  if (!spell) addSystem('spell', 'Spell available', false, 'Spell definition is missing.')
  else {
    const unlocked = isSpellUnlocked(state, spell.id)
    addSystem('unlocked', 'Spell unlocked', unlocked, unlocked ? 'Spell is unlocked.' : 'Spell is locked.')
    addSystem('combat', 'Combat active', state.combat.active, state.combat.active ? 'Combat is active.' : 'Combat preview unavailable outside combat.')
    const targetValid = config.targetRule === 'self' ? !hasEnemyTarget(spell) : hasEnemyTarget(spell) && Boolean(state.combat.enemyId)
    addSystem('target', 'Valid target', targetValid, targetValid ? config.targetRule === 'self' ? 'Self target is valid.' : 'Current enemy target is valid.' : 'The selected target rule is unavailable for this spell or encounter.')
    const cooldownReady = Boolean(state.debug.ignoreSpellCooldowns || (state.combat.spellCooldowns[spell.id] ?? 0) <= 0)
    addSystem('cooldown', 'Cooldown ready', cooldownReady, cooldownReady ? 'Spell cooldown is ready.' : `Cooldown has ${(state.combat.spellCooldowns[spell.id] ?? 0) / 1000}s remaining.`)
    const manaPreview = getSpellManaPreview(state, spell.id, 'auto')
    const enoughMana = Boolean(state.debug.infiniteMana || manaPreview?.free || (manaPreview && state.player.mana >= manaPreview.manaCost))
    const requiredMana = manaPreview?.manaCost ?? spell.manaCost
    addSystem('mana', 'Enough Mana', enoughMana, enoughMana ? 'Enough Mana is available.' : `Mana is ${Math.round(state.player.mana)}, but this Spell requires ${Math.round(requiredMana)}.`)
    const focusReserved = Boolean(state.debug.allowFocusOverCap || state.activities.autoCast[spell.id])
    addSystem('focus', 'Focus reserved', focusReserved, focusReserved ? 'Auto-Cast Focus is reserved for this Spell.' : 'This Spell has no active Auto-Cast Focus reservation.')
    const canAct = !actorCannotAct(state, 'player')
    addSystem('can-act', 'Wizard can act', canAct, canAct ? 'Wizard is able to act.' : 'Wizard is currently prevented from acting.')
    const canCast = !actorCannotCastSpells(state, 'player')
    addSystem('can-cast', 'Spell casting allowed', canCast, canCast ? 'Spell casting is allowed.' : 'A combat status prevents Spell casting.')
    addSystem('not-casting', 'No active cast', !state.combat.pendingPlayerSpellCast, state.combat.pendingPlayerSpellCast ? 'Another Spell is already being cast.' : 'No Spell is currently being cast.')
    const queuedManualSpellId = state.combat.queuedPlayerSpellId
    const pendingManualCast = state.combat.pendingPlayerSpellCast?.castOrigin === 'manual-direct' || state.combat.pendingPlayerSpellCast?.castOrigin === 'manual-queued'
    const manualOverrideClear = !queuedManualSpellId && !pendingManualCast
    const manualOverrideReason = queuedManualSpellId
      ? 'Manual Spell queued. Automation resumes after the manual request resolves.'
      : pendingManualCast
        ? 'Manual Spell is currently casting. Automation resumes after it resolves.'
        : 'No manual spell request is blocking automation.'
    addSystem('manual-override', 'Manual override clear', manualOverrideClear, manualOverrideReason)
  }
  const mode = slot.autoCast ? 'auto' : 'manual'
  const passed = mode === 'auto' && conditions.every((check) => check.passed) && systemChecks.every((check) => check.passed)
  const failed = mode === 'manual' ? 'Spell is set to Manual.' : conditions.find((check) => !check.passed)?.reason ?? systemChecks.find((check) => !check.passed)?.reason
  return { eligible: passed, mode, conditions, systemChecks, failureReason: failed }
}

export const selectNextAutomatedSpell = (state: GameState): AutomatedSpellSelection | null => {
  const slots = state.combat.activeSpellLoadout?.slots ?? []
  const trace: AutomatedSpellSelection['trace'] = []
  for (const [slotIndex, slot] of slots.entries()) {
    const evaluation = evaluateSpellAutomation(state, slot)
    trace.push({ slotIndex, spellId: slot.spellId, mode: evaluation.mode, evaluation })
    if (evaluation.eligible) return { spellId: slot.spellId, slotIndex, evaluation, trace }
  }
  return null
}

/** Evaluates a draft against the complete ordered loadout, not in isolation. */
export const getSpellAutomationPriorityPreview = (state: GameState, slots: readonly SpellPresetSlot[], slotIndex: number): SpellAutomationPriorityPreview => {
  const evaluations = slots.map((slot) => evaluateSpellAutomation(state, slot))
  const firstEligibleSlotIndex = evaluations.findIndex((evaluation, index) => Boolean(slots[index]?.autoCast && evaluation.eligible))
  return {
    isNext: firstEligibleSlotIndex === slotIndex,
    firstEligibleSlotIndex: firstEligibleSlotIndex >= 0 ? firstEligibleSlotIndex : null,
    blockingSpellId: firstEligibleSlotIndex >= 0 && firstEligibleSlotIndex !== slotIndex ? slots[firstEligibleSlotIndex]?.spellId : undefined,
  }
}

export const getNextAutomatedSpellCooldownMs = (state: GameState, cooldownRecovery: number): number | null => {
  if (cooldownRecovery <= 0 || state.debug.ignoreSpellCooldowns || state.combat.queuedPlayerSpellId) return null
  let next: number | null = null
  state.combat.activeSpellLoadout?.slots.forEach((slot) => {
    if (!slot.autoCast || !SPELLS[slot.spellId] || !isSpellUnlocked(state, slot.spellId)) return
    const cooldown = state.combat.spellCooldowns[slot.spellId] ?? 0
    if (cooldown > 0 && Number.isFinite(cooldown)) next = next === null ? cooldown / cooldownRecovery : Math.min(next, cooldown / cooldownRecovery)
  })
  return next
}
