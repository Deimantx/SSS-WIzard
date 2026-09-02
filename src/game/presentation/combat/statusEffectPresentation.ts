import { STATUS_DEFINITIONS } from '../../content/statuses'
import type { CombatModifier, ModifierKey, StatusId } from '../../systems/combat/combatTypes'

/**
 * Returns the modifier payload an applied Status actually uses at runtime:
 * authored overrides replace only the matching default values.
 */
export const getEffectiveAppliedStatusModifiers = (statusId: StatusId, modifierOverrides?: Partial<Record<ModifierKey, number>>): CombatModifier[] => {
  const defaults = STATUS_DEFINITIONS[statusId]?.modifiers ?? []
  return defaults.map((modifier) => {
    const override = modifierOverrides?.[modifier.key]
    return override !== undefined && Number.isFinite(override) ? { ...modifier, value: override } : modifier
  })
}
