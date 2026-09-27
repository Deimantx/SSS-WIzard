export type SigilTier = number

export interface SigilTierDefinition {
  tier: SigilTier
  label: string
  minEnemyPower: number
  maxEnemyPowerExclusive?: number
  mainStatMultiplier: number
  secondaryRollMultiplier: number
  salvageMultiplier: number
  craftCostMultiplier: number
}

/** The only authored source of Sigil tier thresholds and scaling. */
export const SIGIL_TIERS: readonly SigilTierDefinition[] = [
  { tier: 1, label: 'T1', minEnemyPower: 0, maxEnemyPowerExclusive: 5000, mainStatMultiplier: 1, secondaryRollMultiplier: 1, salvageMultiplier: 1, craftCostMultiplier: 1 },
  { tier: 2, label: 'T2', minEnemyPower: 5000, mainStatMultiplier: 1.4, secondaryRollMultiplier: 1.3, salvageMultiplier: 2.25, craftCostMultiplier: 1.8 },
]

const safePower = (power: number) => Number.isFinite(power) ? Math.max(0, power) : 0

export const getSigilTierDefinition = (tier: SigilTier): SigilTierDefinition => {
  return SIGIL_TIERS.find((definition) => definition.tier === tier) ?? SIGIL_TIERS[0]
}

export const resolveSigilTierFromEnemyPower = (power: number): SigilTier => {
  const sanitized = safePower(power)
  const eligible = [...SIGIL_TIERS].sort((a, b) => a.minEnemyPower - b.minEnemyPower).filter((definition) => definition.minEnemyPower <= sanitized)
  return eligible[eligible.length - 1]?.tier ?? SIGIL_TIERS[0].tier
}

export const isSigilTier = (value: unknown): value is SigilTier =>
  typeof value === 'number' && SIGIL_TIERS.some((definition) => definition.tier === value)

export const getHighestCraftableSigilTier = (highestSourcePowerDefeated: number) =>
  resolveSigilTierFromEnemyPower(highestSourcePowerDefeated)
