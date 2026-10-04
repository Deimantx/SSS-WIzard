import { MONSTERS } from '../../content/monsters'
import type { MonsterId } from '../../types'
import { getDefenseReductionFromRating } from './combatStats'

export interface EnemyPowerBreakdown { power: number; effectiveHealth: number; basicDps: number; defenseReduction: number }
export const roundToNearest5 = (value: number) => Math.round(value / 5) * 5

/** Canonical encounter Power used by both the player-facing readout and Sigil loot. */
export const resolveEnemyPowerBreakdown = (monsterId: MonsterId): EnemyPowerBreakdown => {
  const monster = MONSTERS[monsterId]
  const defenseReduction = getDefenseReductionFromRating(monster?.defense ?? 0)
  const effectiveHealth = (monster?.maxHealth ?? 0) / Math.max(.01, 1 - defenseReduction)
  const attackSeconds = Math.max(.1, (monster?.basicAttackTimeMs ?? 0) / 1000)
  const basicDps = (monster?.basicAttackDamage ?? 0) / attackSeconds
  const rawPower = Math.sqrt(Math.max(0, effectiveHealth * basicDps)) * 10
  const power = Math.max(1, roundToNearest5(Math.max(1, Number.isFinite(rawPower) ? rawPower : 1)))
  return { power, effectiveHealth, basicDps, defenseReduction }
}
export const resolveEnemyPowerRating = (monsterId: MonsterId) => resolveEnemyPowerBreakdown(monsterId).power
