import type { DamageType, EquipmentStats } from '../../types'

const finiteNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0

/** Adds a stat bundle without allowing malformed or non-finite values to poison derived stats. */
export const addEquipmentStats = (target: EquipmentStats, source?: Partial<EquipmentStats>): EquipmentStats => {
  if (!source) return target

  Object.entries(source).forEach(([key, value]) => {
    if (key === 'resistances') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return
      const resistances = target.resistances ?? {}
      Object.entries(value as Record<string, unknown>).forEach(([damageType, resistance]) => {
        const next = finiteNumber(resistances[damageType as DamageType]) + finiteNumber(resistance)
        resistances[damageType as DamageType] = next
      })
      target.resistances = resistances
      return
    }

    const statKey = key as keyof EquipmentStats
    target[statKey] = (finiteNumber(target[statKey]) + finiteNumber(value)) as never
  })

  return target
}
