import type { CombatModifier, CombatTriggerRule } from '../../systems/combat/combatTypes'
import { STATUS_DEFINITIONS } from '../statuses/statuses'
import { createCombatValidationContext, validateCombatModifier, validateCombatTriggerRule } from '../../systems/combat/combatEffectValidation'

export type EliteMinorAffixId = 'vicious' | 'frenzied' | 'warded' | 'armored' | 'relentless' | 'regenerative'

export interface EliteMinorAffixDefinition {
  id: EliteMinorAffixId
  name: string
  description: string
  modifiers?: CombatModifier[]
  rules?: CombatTriggerRule[]
}

const sourceMaxHealth = (value: number) => ({ type: 'source-max-health-percent' as const, value })

export const ELITE_MINOR_AFFIXES: Record<EliteMinorAffixId, EliteMinorAffixDefinition> = {
  vicious: {
    id: 'vicious',
    name: 'Vicious',
    description: 'Deals 15% more damage.',
    modifiers: [{ key: 'damage-dealt-percent', value: 0.15 }],
  },
  frenzied: {
    id: 'frenzied',
    name: 'Frenzied',
    description: 'At 50% HP, gains Haste once.',
    rules: [{
      id: 'frenzied-threshold',
      event: 'on-hp-threshold',
      condition: { type: 'self-hp-below-percent', percent: 50 },
      effects: [{ type: 'apply-status', target: 'self', statusId: 'haste' }],
      oncePerEncounter: true,
    }],
  },
  warded: {
    id: 'warded',
    name: 'Warded',
    description: 'Starts this encounter with a Barrier equal to 15% Max HP.',
    rules: [{
      id: 'warded-start',
      event: 'on-combat-start',
      effects: [{ type: 'gain-barrier', target: 'self', magnitude: sourceMaxHealth(0.15), mode: 'add', durationMs: null, tags: ['barrier'] }],
      oncePerEncounter: true,
    }],
  },
  armored: {
    id: 'armored',
    name: 'Armored',
    description: 'Defense increased by 25%.',
    modifiers: [{ key: 'defense-percent', value: 0.25 }],
  },
  relentless: {
    id: 'relentless',
    name: 'Relentless',
    description: 'Control effects received are 40% shorter.',
    modifiers: [{ key: 'status-duration-received-percent', value: -0.4, statusTags: ['control'] }],
  },
  regenerative: {
    id: 'regenerative',
    name: 'Regenerative',
    description: 'At 50% HP, restores 12% Max HP once.',
    rules: [{
      id: 'regenerative-threshold',
      event: 'on-hp-threshold',
      condition: { type: 'self-hp-below-percent', percent: 50 },
      effects: [{ type: 'heal', target: 'self', magnitude: sourceMaxHealth(0.12), tags: ['heal', 'direct'] }],
      oncePerEncounter: true,
    }],
  },
}

export const getEliteMinorAffix = (id: EliteMinorAffixId | null | undefined) => id ? ELITE_MINOR_AFFIXES[id] ?? null : null

export const validateEliteMinorAffixes = () => {
  const errors: string[] = []
  const entries = Object.entries(ELITE_MINOR_AFFIXES) as Array<[EliteMinorAffixId, EliteMinorAffixDefinition]>
  const ids = entries.map(([key, definition]) => { if (key !== definition.id) errors.push(`${key}: key/id mismatch`); return definition.id })
  if (new Set(ids).size !== ids.length) errors.push('affixes: IDs must be unique')
  entries.forEach(([key, definition]) => {
    if (!definition.name.trim()) errors.push(`${key}: name is required`)
    if (!definition.description.trim()) errors.push(`${key}: description is required`)
    definition.modifiers?.forEach((modifier) => errors.push(...validateCombatModifier(modifier, `${key}/modifier`, createCombatValidationContext(STATUS_DEFINITIONS))))
    const ruleIds = (definition.rules ?? []).map((rule) => rule.id)
    if (new Set(ruleIds).size !== ruleIds.length) errors.push(`${key}: rule IDs must be unique`)
    definition.rules?.forEach((rule) => errors.push(...validateCombatTriggerRule(rule, `${key}/${rule.id}`, createCombatValidationContext(STATUS_DEFINITIONS))))
  })
  return errors
}
