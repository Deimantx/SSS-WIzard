import { STATUS_DEFINITIONS } from '../../content/statuses'
import { formatSpellMagnitude } from '../spells/spellEffectTooltipModel'
import { scaleMagnitude, type CombatEffect, type ModifierKey, type StatusId } from '../../systems/combat/combatTypes'
import { formatCombatModifier } from './combatModifierPresentation'
import { formatDecimal } from '../../utils'

export interface CombatStatusPeriodicPresentation {
  intervalMs: number
  intervalLabel: string
  tickCount: number
  effects: string[]
  totalEffects: string[]
}

export interface CombatStatusDetailPresentation {
  statusId: StatusId
  name: string
  description: string
  classificationLabel: string
  durationMs: number | null
  durationLabel: string
  stackingLabel: string
  maxStacks?: number
  modifiers: string[]
  periodic?: CombatStatusPeriodicPresentation
  cleanseable: boolean
  dispellable: boolean
  preventsAction: boolean
  preventsSpellCast: boolean
}

export interface CombatStatusDetailOptions {
  durationMs?: number | null
  periodicEffects?: CombatEffect[]
  modifierOverrides?: Partial<Record<ModifierKey, number>>
}

export const formatCombatStatusDuration = (durationMs: number | null) => {
  if (durationMs === null) return 'Permanent'
  const seconds = Math.max(0, durationMs) / 1000
  if (Number.isInteger(seconds)) return `${seconds} sec`
  if (seconds < 60) return `${formatDecimal(seconds, 1)} sec`
  const minutes = seconds / 60
  if (Number.isInteger(minutes)) return `${minutes} min`
  return `${formatDecimal(minutes, 1)} min`
}

const formatStatusMagnitude = (magnitude: Parameters<typeof formatSpellMagnitude>[0]) => formatSpellMagnitude(magnitude)
  .replace(/ of Max Health/g, ' Max HP')
  .replace(/ of Max Mana/g, ' Max Mana')
  .replace(/ of Basic Damage/g, ' Basic Attack Damage')
  .replace(/ of current Barrier/g, ' of current Barrier')

const formatPeriodicEffect = (effect: CombatEffect) => {
  if (effect.type === 'heal') return `Restores ${formatStatusMagnitude(effect.magnitude)} Health per tick`
  if (effect.type === 'deal-damage') return effect.components.map((component) => `${formatStatusMagnitude(component.magnitude)} ${component.damageType[0].toUpperCase()}${component.damageType.slice(1)} damage per tick`).join(' + ')
  if (effect.type === 'gain-barrier') return `Gains ${formatStatusMagnitude(effect.magnitude)} Barrier per tick`
  return effect.type.replace(/-/g, ' ')
}

const formatPeriodicTotal = (effect: CombatEffect, tickCount: number) => {
  if (tickCount < 1) return undefined
  if (effect.type === 'heal') return `Restores ${formatStatusMagnitude(scaleMagnitude(effect.magnitude, tickCount))} Health over the full duration`
  if (effect.type === 'deal-damage') return effect.components.map((component) => `${formatStatusMagnitude(scaleMagnitude(component.magnitude, tickCount))} ${component.damageType[0].toUpperCase()}${component.damageType.slice(1)} damage over the full duration`).join(' + ')
  if (effect.type === 'gain-barrier') return `Gains ${formatStatusMagnitude(scaleMagnitude(effect.magnitude, tickCount))} Barrier over the full duration`
  return undefined
}

const stackingLabel = (mode: string) => mode === 'stacks' ? 'Stacks' : `${mode[0].toUpperCase()}${mode.slice(1)}`

/** Shared status read model for Bestiary and live combat status explanations. */
export const buildCombatStatusDetailPresentation = (statusId: StatusId, options: CombatStatusDetailOptions = {}): CombatStatusDetailPresentation => {
  const definition = STATUS_DEFINITIONS[statusId]
  if (!definition) {
    return {
      statusId,
      name: statusId.replace(/[-_]/g, ' '),
      description: 'Status details unavailable.',
      classificationLabel: 'Status',
      durationMs: options.durationMs ?? null,
      durationLabel: formatCombatStatusDuration(options.durationMs ?? null),
      stackingLabel: 'Refresh',
      modifiers: [],
      cleanseable: false,
      dispellable: false,
      preventsAction: false,
      preventsSpellCast: false,
    }
  }
  const durationMs = options.durationMs === undefined ? definition.defaultDurationMs : options.durationMs
  const periodicEffects = options.periodicEffects ?? definition.periodic?.effects
  const intervalMs = definition.periodic?.intervalMs ?? 0
  const tickCount = durationMs !== null && durationMs !== undefined && intervalMs > 0 ? Math.floor(Math.max(0, durationMs) / intervalMs) : 0
  const periodic = periodicEffects?.length && intervalMs > 0
    ? {
        intervalMs,
        intervalLabel: formatCombatStatusDuration(intervalMs),
        tickCount,
        effects: periodicEffects.map(formatPeriodicEffect),
        totalEffects: periodicEffects.map((effect) => formatPeriodicTotal(effect, tickCount)).filter((value): value is string => Boolean(value)),
      }
    : undefined
  return {
    statusId,
    name: definition.name,
    description: definition.description,
    classificationLabel: definition.classification === 'buff' ? 'Buff' : definition.classification === 'debuff' ? 'Debuff' : 'Status',
    durationMs: durationMs ?? null,
    durationLabel: formatCombatStatusDuration(durationMs ?? null),
    stackingLabel: stackingLabel(definition.stacking.mode),
    maxStacks: definition.stacking.maxStacks,
    modifiers: (definition.modifiers ?? []).map((modifier) => {
      const override = options.modifierOverrides?.[modifier.key]
      return formatCombatModifier(override !== undefined && Number.isFinite(override) ? { ...modifier, value: override } : modifier)
    }),
    periodic,
    cleanseable: definition.cleanseable,
    dispellable: definition.dispellable,
    preventsAction: Boolean(definition.preventsAction),
    preventsSpellCast: Boolean(definition.preventsSpellCast),
  }
}
