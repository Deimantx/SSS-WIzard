import { STATUS_DEFINITIONS } from '../../content/statuses'
import { RESONANCE_METADATA, RESONANCE_TYPES } from '../../content/resonance/resonance'
import { getMonsterTraits } from '../../systems/combat/traitRuntime'
import { resolveEnemyResonanceReward } from '../../systems/resonance/resonanceRuntime'
import type { MonsterDefinition } from '../../content/monsters'
import type { ResonanceType } from '../../content/resonance/resonance'
import type { WorldTierId } from '../../types'
import type { ActionPattern, CombatCondition, CombatEffect, CombatModifier, CombatTriggerRule, StatusId, TraitDefinition } from '../../systems/combat/combatTypes'
import { buildCombatActionPresentation, formatCombatCondition, formatCombatEffect, formatCombatModifier, formatCombatStatusDuration } from '../combat'

export type BestiaryMechanicEffectKind = 'damage' | 'heal' | 'barrier' | 'status' | 'control' | 'resource' | 'pattern' | 'utility'

export interface BestiaryMechanicEffectPresentation {
  id: string
  kind: BestiaryMechanicEffectKind
  label: string
  detail?: string
  statusId?: StatusId
  durationMs?: number | null
  periodicEffects?: CombatEffect[]
  patternId?: string
}

export interface BestiaryTraitTriggerPresentation {
  id: string
  label: string
  oncePerEncounter: boolean
  effects: BestiaryMechanicEffectPresentation[]
}

export interface BestiaryTraitPresentation {
  id: string
  name: string
  description: string
  passiveModifiers: string[]
  triggers: BestiaryTraitTriggerPresentation[]
}

export interface BestiaryBossPhasePresentation {
  id: string
  label: string
  thresholdLabel: string
  patternId: string
  opening: boolean
}

export interface BestiaryBossTransitionPresentation {
  label: string
  triggerLabel: string
  oncePerEncounter: boolean
  effects: BestiaryMechanicEffectPresentation[]
}

export interface BestiaryResonanceEntryPresentation {
  type: ResonanceType
  label: string
  shortLabel: string
  baseAmount: number
  finalAmount: number
}

export interface BestiaryResonancePresentation {
  worldTier: WorldTierId
  worldTierRewardMultiplier: number
  globalRewardMultiplier: number
  rewardMultiplier: number
  entries: BestiaryResonanceEntryPresentation[]
}

export const getBestiaryResonancePresentation = (monster: MonsterDefinition, worldTier: WorldTierId): BestiaryResonancePresentation => {
  const reward = resolveEnemyResonanceReward(monster.id, worldTier)
  return {
    worldTier: reward.worldTier,
    worldTierRewardMultiplier: reward.worldTierRewardMultiplier,
    globalRewardMultiplier: reward.globalRewardMultiplier,
    rewardMultiplier: reward.rewardMultiplier,
    entries: RESONANCE_TYPES.flatMap((type) => {
      const finalAmount = reward.finalYield[type] ?? 0
      return finalAmount > 0
        ? [{ type, label: RESONANCE_METADATA[type].label, shortLabel: RESONANCE_METADATA[type].shortLabel, baseAmount: reward.baseYield[type] ?? 0, finalAmount }]
        : []
    }),
  }
}

/** Search identity is authored/base data, so it remains stable across World Tier changes. */
export const getBestiaryResonanceSearchText = (monster: MonsterDefinition) => RESONANCE_TYPES.flatMap((type) => {
  const amount = monster.resonanceYield?.[type] ?? 0
  return amount > 0 ? [type, RESONANCE_METADATA[type].shortLabel, RESONANCE_METADATA[type].label] : []
}).join(' ')

export interface BestiaryBossPhasesPresentation {
  phases: BestiaryBossPhasePresentation[]
  transitions: Record<string, BestiaryBossTransitionPresentation>
}

const titleCase = (value: string) => value.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export const getBestiaryPatternLabel = (monster: MonsterDefinition, patternId: string) => monster.ui?.bestiary?.phaseLabels?.[patternId] ?? (patternId === monster.defaultActionPatternId ? 'Default' : titleCase(patternId))

const conditionTriggerLabel = (condition?: CombatCondition) => {
  if (!condition) return undefined
  if (condition.type === 'self-hp-below-percent') return `Below ${condition.percent}% HP`
  if (condition.type === 'self-hp-above-percent') return `Above ${condition.percent}% HP`
  return formatCombatCondition(condition)
}

const eventLabel = (rule: CombatTriggerRule) => {
  const labels: Record<CombatTriggerRule['event'], string> = {
    'on-combat-start': 'Combat start',
    'on-spell-cast': 'After a Spell cast',
    'on-basic-attack-hit': 'After a Basic Attack hit',
    'on-spell-hit': 'After a Spell hit',
    'on-damage-dealt': 'After dealing damage',
    'on-damage-taken': 'After taking damage',
    'on-barrier-broken': 'When Barrier breaks',
    'on-status-applied': 'When a status is applied',
    'on-hp-threshold': 'At a Health threshold',
    'on-action-start': 'When an action starts',
    'on-action-resolve': 'When an action resolves',
    'on-heal': 'After healing',
    'on-heal-received': 'After receiving healing',
    'on-barrier-gained': 'When Barrier is gained',
    'on-status-removed': 'When a status is removed',
    'on-status-expired': 'When a status expires',
    'on-kill': 'After a kill',
  }
  return labels[rule.event]
}

const formatEffectDetail = (effect: CombatEffect, monster: MonsterDefinition) => {
  const presentation = formatCombatEffect(effect, { actor: 'enemy', kind: 'trait', sourceMonsterId: monster.id }, { monster })
  return [presentation.value, presentation.scalingLabel, presentation.detail?.replace(/^Target: (Player|Enemy)$/, '')].filter(Boolean).join(' · ') || undefined
}

const mechanicKind = (effect: CombatEffect): BestiaryMechanicEffectKind => {
  if (effect.type === 'deal-damage') return 'damage'
  if (effect.type === 'heal') return 'heal'
  if (effect.type === 'gain-barrier' || effect.type === 'consume-barrier') return 'barrier'
  if (effect.type === 'apply-status' || effect.type === 'remove-status' || effect.type === 'cleanse' || effect.type === 'dispel') return 'status'
  if (effect.type === 'modify-action-timer' || effect.type === 'modify-cooldown') return 'control'
  if (effect.type === 'restore-resource' || effect.type === 'drain-resource') return 'resource'
  if (effect.type === 'set-action-pattern') return 'pattern'
  return 'utility'
}

export const buildBestiaryMechanicEffect = (effect: CombatEffect, monster: MonsterDefinition, id: string): BestiaryMechanicEffectPresentation => {
  if (effect.type === 'apply-status') {
    const status = STATUS_DEFINITIONS[effect.statusId]
    const durationMs = effect.durationMs === undefined ? status?.defaultDurationMs ?? null : effect.durationMs
    return {
      id,
      kind: 'status',
      label: status?.name ?? titleCase(effect.statusId),
      detail: durationMs === null ? 'Permanent' : formatCombatStatusDuration(durationMs),
      statusId: effect.statusId,
      durationMs,
      periodicEffects: effect.periodicEffects,
    }
  }
  if (effect.type === 'set-action-pattern') return {
    id,
    kind: 'pattern',
    label: 'Pattern Change',
    detail: `Switch to ${getBestiaryPatternLabel(monster, effect.patternId)}`,
    patternId: effect.patternId,
  }
  const presentation = formatCombatEffect(effect, { actor: 'enemy', kind: 'trait', sourceMonsterId: monster.id }, { monster })
  return { id, kind: mechanicKind(effect), label: presentation.label, detail: formatEffectDetail(effect, monster) }
}

const buildTraitTrigger = (rule: CombatTriggerRule, monster: MonsterDefinition): BestiaryTraitTriggerPresentation => ({
  id: rule.id,
  label: conditionTriggerLabel(rule.condition) ?? eventLabel(rule),
  oncePerEncounter: Boolean(rule.oncePerEncounter),
  effects: rule.effects.map((effect, index) => buildBestiaryMechanicEffect(effect, monster, `${rule.id}:${index}`)),
})

export const buildBestiaryTraitPresentation = (trait: TraitDefinition, monster: MonsterDefinition): BestiaryTraitPresentation => ({
  id: trait.id,
  name: trait.name,
  description: trait.description,
  passiveModifiers: (trait.modifiers ?? []).map(formatCombatModifier),
  triggers: (trait.rules ?? []).map((rule) => buildTraitTrigger(rule, monster)),
})

export const getBestiaryTraitPresentations = (monster: MonsterDefinition) => getMonsterTraits(monster).map((trait) => buildBestiaryTraitPresentation(trait, monster))

const findPhaseTransition = (monster: MonsterDefinition) => getMonsterTraits(monster)
  .flatMap((trait) => (trait.rules ?? []).map((rule) => ({ trait, rule })))
  .find(({ rule }) => rule.event === 'on-hp-threshold' && rule.effects.some((effect) => effect.type === 'set-action-pattern'))

const findPatternSwitch = (monster: MonsterDefinition, pattern: ActionPattern | undefined) => pattern?.steps
  .filter((step): step is Extract<ActionPattern['steps'][number], { type: 'action' }> => step.type === 'action')
  .flatMap((step) => monster.actions[step.actionId]?.effects ?? [])
  .find((effect) => effect.type === 'set-action-pattern' && effect.target === 'self')

export const buildBestiaryBossPhases = (monster: MonsterDefinition): BestiaryBossPhasesPresentation => {
  const transitionSource = findPhaseTransition(monster)
  const transitionPatternId = transitionSource?.rule.effects.find((effect) => effect.type === 'set-action-pattern')?.patternId
  const transitionPattern = transitionPatternId ? monster.actionPatterns[transitionPatternId] : undefined
  const patternSwitch = findPatternSwitch(monster, transitionPattern)
  const repeatPatternId = patternSwitch?.type === 'set-action-pattern'
    ? patternSwitch.patternId
    : undefined
  const inferredPatternIds = [monster.defaultActionPatternId, transitionPatternId, repeatPatternId].filter((id): id is string => Boolean(id))
  const authoredPatternIds = monster.ui?.bestiary?.phaseOrder ?? Object.keys(monster.actionPatterns)
  const patternIds = [...new Set([...inferredPatternIds, ...authoredPatternIds])].filter((id) => Boolean(monster.actionPatterns[id]))
  const threshold = transitionSource?.rule.condition?.type === 'self-hp-below-percent' || transitionSource?.rule.condition?.type === 'self-hp-above-percent'
    ? transitionSource.rule.condition.percent
    : undefined
  const hasOpening = Boolean(transitionPatternId && repeatPatternId && transitionPatternId !== repeatPatternId)
  const phases = patternIds.map((patternId, index) => {
    const opening = hasOpening && patternId === transitionPatternId
    const thresholdLabel = index === 0
      ? threshold === undefined ? 'Opening phase' : transitionSource?.rule.condition?.type === 'self-hp-below-percent' ? `100% → ${threshold}% HP` : `Above ${threshold}% HP`
      : opening ? 'Phase 2 opening · Cast once' : threshold === undefined ? 'Later phase' : `Below ${threshold}% HP`
    return { id: patternId, label: getBestiaryPatternLabel(monster, patternId), thresholdLabel, patternId, opening }
  })
  const transitions: Record<string, BestiaryBossTransitionPresentation> = {}
  if (transitionSource && transitionPatternId) {
    const triggerLabel = conditionTriggerLabel(transitionSource.rule.condition) ?? eventLabel(transitionSource.rule)
    transitions[monster.defaultActionPatternId] = {
      label: transitionSource.trait.name,
      triggerLabel,
      oncePerEncounter: Boolean(transitionSource.rule.oncePerEncounter),
      effects: transitionSource.rule.effects.map((effect, index) => buildBestiaryMechanicEffect(effect, monster, `${transitionSource.rule.id}:${index}`)),
    }
  }
  return { phases, transitions }
}

export const getBestiaryBossSummaryTags = (monster: MonsterDefinition) => {
  const authored = monster.ui?.bestiary?.roleTags ?? []
  if (authored.length > 0) return authored
  const tags = new Set<string>()
  const actions = Object.values(monster.actions)
  if (actions.some((action) => action.tags?.includes('physical'))) tags.add('Physical')
  if (actions.some((action) => action.tags?.includes('magic') || action.tags?.includes('arcane'))) tags.add('Magic')
  if (actions.some((action) => action.effects.some((effect) => effect.type === 'heal' || effect.type === 'gain-barrier'))) tags.add('Sustain')
  if (actions.some((action) => action.effects.some((effect) => effect.type === 'modify-action-timer' || effect.type === 'apply-status' && STATUS_DEFINITIONS[effect.statusId]?.tags.includes('control')))) tags.add('Control')
  if (actions.some((action) => action.effects.some((effect) => effect.type === 'deal-damage' && Boolean(effect.lifeStealPercent)))) tags.add('Lifesteal')
  const phaseCount = buildBestiaryBossPhases(monster).phases.length
  if (phaseCount > 1) tags.add(`${phaseCount} Phases`)
  return [...tags]
}

const collectMagnitudeStatusIds = (magnitude: { type: string; statusId?: StatusId; base?: unknown }, statusIds: Set<StatusId>) => {
  if ('statusId' in magnitude && magnitude.statusId) statusIds.add(magnitude.statusId)
  if (magnitude.type === 'opponent-status-stack-scaled' || magnitude.type === 'source-status-stack-scaled') collectMagnitudeStatusIds(magnitude.base as { type: string; statusId?: StatusId; base?: unknown }, statusIds)
}

const collectEffectStatusIds = (effect: CombatEffect, statusIds: Set<StatusId>) => {
  if (effect.type === 'apply-status' || effect.type === 'remove-status' || effect.type === 'detonate-status') statusIds.add(effect.statusId)
  if ('magnitude' in effect && effect.magnitude) collectMagnitudeStatusIds(effect.magnitude, statusIds)
  if (effect.type === 'deal-damage') effect.components.forEach((component) => collectMagnitudeStatusIds(component.magnitude, statusIds))
  if (effect.type === 'apply-status') effect.periodicEffects?.forEach((periodicEffect) => collectEffectStatusIds(periodicEffect, statusIds))
}

export const getBestiaryReferencedStatusIds = (monster: MonsterDefinition) => {
  const statusIds = new Set<StatusId>()
  getMonsterTraits(monster).forEach((trait) => {
    trait.modifiers?.forEach((modifier) => {
      modifier.statusIds?.forEach((statusId) => statusIds.add(statusId))
      const condition = modifier.condition
      if (condition && 'statusId' in condition) statusIds.add(condition.statusId)
    })
    trait.rules?.forEach((rule) => rule.effects.forEach((effect) => collectEffectStatusIds(effect, statusIds)))
  })
  Object.values(monster.actions).forEach((action) => action.effects.forEach((effect) => collectEffectStatusIds(effect, statusIds)))
  return [...statusIds]
}

export const getBestiaryMechanicSearchText = (monster: MonsterDefinition) => {
  const statuses = getBestiaryReferencedStatusIds(monster).flatMap((statusId) => {
    const status = STATUS_DEFINITIONS[statusId]
    return status ? [status.name, status.description, ...(status.modifiers ?? []).map(formatCombatModifier)] : []
  })
  return statuses.join(' ')
}

export const getBestiaryTraitSearchText = (monster: MonsterDefinition) => getBestiaryTraitPresentations(monster).flatMap((trait) => [trait.name, trait.description, ...trait.passiveModifiers, ...trait.triggers.flatMap((trigger) => [trigger.label, ...trigger.effects.map((effect) => `${effect.label} ${effect.detail ?? ''}`)])]).join(' ')

export const getBestiaryActionSearchText = (monster: MonsterDefinition) => Object.values(monster.actions).flatMap((action) => {
  const presentation = buildCombatActionPresentation(action, { actor: 'enemy', kind: 'action', sourceMonsterId: monster.id }, { monster })
  return [presentation.name, presentation.description, ...presentation.effects.flatMap((effect) => [effect.label, effect.value ?? '', effect.scalingLabel ?? '', effect.lifeStealLabel ?? '', effect.timeLabel ?? '', effect.detail ?? ''])]
}).join(' ')
