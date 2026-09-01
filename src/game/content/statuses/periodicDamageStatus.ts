import { STATUS_DEFINITIONS } from './statuses'
import type { CombatEffect, DamageType, StatusId } from '../../systems/combat/combatTypes'

export interface PeriodicDamageStatusOptions {
  statusId: StatusId
  durationMs: number
  totalBaseDamage: number
  damageType: DamageType
}

/**
 * Content authoring helper for interval-aligned, flat periodic damage.
 * Runtime snapshots this payload per application, so ranks and source-specific
 * values do not leak into other instances of the same status type.
 */
export const periodicDamageStatus = ({ statusId, durationMs, totalBaseDamage, damageType }: PeriodicDamageStatusOptions): CombatEffect => {
  const definition = STATUS_DEFINITIONS[statusId]
  const intervalMs = definition?.periodic?.intervalMs
  if (!definition || !intervalMs || !Number.isFinite(intervalMs) || intervalMs <= 0) throw new Error(`periodicDamageStatus(${statusId}): status must define a positive periodic interval`)
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs % intervalMs !== 0) throw new Error(`periodicDamageStatus(${statusId}): duration must be a positive multiple of ${intervalMs}ms`)
  if (!Number.isFinite(totalBaseDamage) || totalBaseDamage < 0) throw new Error(`periodicDamageStatus(${statusId}): totalBaseDamage must be finite and non-negative`)
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
      magnitude: { type: 'flat', value: totalBaseDamage / ticks },
      tags: ['dot', damageType],
    }],
    tags: ['debuff', 'dot', damageType],
  }
}

