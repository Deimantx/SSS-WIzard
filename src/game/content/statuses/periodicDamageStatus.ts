import { STATUS_DEFINITIONS } from './statuses'
import type { CombatEffect, DamageType, StatusId } from '../../systems/combat/combatTypes'
import type { Magnitude } from '../../systems/combat/combatTypes'
import { scaleMagnitude } from '../../systems/combat/combatTypes'

export interface PeriodicDamageStatusOptions {
  statusId: StatusId
  durationMs: number
  /** Legacy flat total retained for old content and save compatibility. */
  totalBaseDamage?: number
  /** Authored total magnitude, divided across the status tick count. */
  totalMagnitude?: Magnitude
  damageType: DamageType
}

/**
 * Content authoring helper for interval-aligned periodic damage. The total
 * payload may use any supported Magnitude and is split across the authored
 * tick count before runtime snapshots it per application.
 * Runtime snapshots this payload per application, so ranks and source-specific
 * values do not leak into other instances of the same status type.
 */
export const periodicDamageStatus = ({ statusId, durationMs, totalBaseDamage, totalMagnitude, damageType }: PeriodicDamageStatusOptions): CombatEffect => {
  const definition = STATUS_DEFINITIONS[statusId]
  const intervalMs = definition?.periodic?.intervalMs
  if (!definition || !intervalMs || !Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error(`periodicDamageStatus(${statusId}): status must define a positive periodic interval`)
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs % intervalMs !== 0) throw new Error(`periodicDamageStatus(${statusId}): duration must be a positive multiple of ${intervalMs}ms`)
  if (totalMagnitude === undefined && (!Number.isFinite(totalBaseDamage) || (totalBaseDamage ?? 0) < 0)) throw new Error(`periodicDamageStatus(${statusId}): totalBaseDamage must be finite and non-negative`)
  if (totalMagnitude && 'value' in totalMagnitude && (!Number.isFinite(totalMagnitude.value) || totalMagnitude.value < 0)) throw new Error(`periodicDamageStatus(${statusId}): magnitude value must be finite and non-negative`)
  if (totalMagnitude?.type === 'spell-power' && (!Number.isFinite(totalMagnitude.coefficient) || totalMagnitude.coefficient < 0)) throw new Error(`periodicDamageStatus(${statusId}): Spell Power coefficient must be finite and non-negative`)
  if (totalMagnitude?.type === 'school-level' && (!Number.isFinite(totalMagnitude.base) || totalMagnitude.base < 0 || !Number.isFinite(totalMagnitude.perLevel) || totalMagnitude.perLevel < 0)) throw new Error(`periodicDamageStatus(${statusId}): school magnitude must be finite and non-negative`)
  if (!definition.tags.includes('dot')) throw new Error(`periodicDamageStatus(${statusId}): status must be tagged dot`)
  const ticks = durationMs / intervalMs
  return {
    type: 'apply-status',
    target: 'opponent',
    statusId,
    durationMs,
    periodicEffects: [{
      type: 'deal-damage',
      target: 'self',
      damageType,
      magnitude: scaleMagnitude(totalMagnitude ?? { type: 'flat', value: totalBaseDamage ?? 0 }, 1 / ticks),
      tags: ['dot', damageType],
    }],
    tags: ['debuff', 'dot', damageType],
  }
}
