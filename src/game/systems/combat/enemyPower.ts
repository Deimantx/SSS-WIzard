import { MONSTERS } from '../../content/monsters'
import type { MonsterId, WorldTierId } from '../../types'
import { getDefenseReductionFromRating } from './combatStats'
import { resolveWorldTierEnemyProfile } from '../world-tier/worldTierRuntime'

export interface EnemyPowerBreakdown { power: number; effectiveHealth: number; basicDps: number; defenseReduction: number }
export const roundToNearest5 = (value: number) => Math.round(value / 5) * 5

/** Canonical encounter Power used by both the player-facing readout and Sigil loot. */
export const resolveEnemyPowerBreakdown = (monsterId: MonsterId, worldTier: WorldTierId): EnemyPowerBreakdown => {
  const monster = MONSTERS[monsterId]
  const profile = resolveWorldTierEnemyProfile(monsterId, worldTier)
  const defenseReduction = getDefenseReductionFromRating(profile.defense)
  const effectiveHealth = profile.maxHealth / Math.max(.01, 1 - defenseReduction)
  const attackSeconds = Math.max(.1, (monster?.basicAttackTimeMs ?? 0) / 1000)
  const basicDps = profile.basicAttackDamage / attackSeconds
  const rawPower = Math.sqrt(Math.max(0, effectiveHealth * basicDps)) * 10
  const power = Math.max(1, roundToNearest5(Math.max(1, Number.isFinite(rawPower) ? rawPower : 1)))
  return { power, effectiveHealth, basicDps, defenseReduction }
}
export const resolveEnemyPowerRating = (monsterId: MonsterId, worldTier: WorldTierId) => resolveEnemyPowerBreakdown(monsterId, worldTier).power
