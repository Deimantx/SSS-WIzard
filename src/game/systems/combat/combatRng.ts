import { COMBAT_RNG_DEFAULT_SEED } from '../../core/balance/combatRng'
import type { CombatState, GameState } from '../../types'

export const normalizeCombatRngState = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 0xFFFFFFFF) return COMBAT_RNG_DEFAULT_SEED >>> 0
  return value >>> 0
}

type CombatRngOwner = Pick<GameState, 'combat'> | Pick<CombatState, 'combatRngState'>

/** Advances the persisted Mulberry32-compatible 32-bit combat stream. */
export const nextCombatRandom = (owner: CombatRngOwner): number => {
  const combat = 'combat' in owner ? owner.combat : owner
  let value = (normalizeCombatRngState(combat.combatRngState) + 0x6D2B79F5) >>> 0
  combat.combatRngState = value
  value = Math.imul(value ^ value >>> 15, value | 1)
  value ^= value + Math.imul(value ^ value >>> 7, value | 61)
  return ((value ^ value >>> 14) >>> 0) / 4_294_967_296
}
