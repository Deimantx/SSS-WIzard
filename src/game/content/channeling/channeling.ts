/** Shared Channeling tuning. Permanent Pillar definitions live in manaPillars.ts. */
export const CHANNELING_DEFAULTS = {
  baseNaturalRegenPerSecond: 0,
  echoManaPerSecond: 5,
  discoveryEchoMultiplier: 1.1,
  stableLeylineRegenBonus: 1,
  stableLeylineThreshold: 2500,
  echoResonanceDurationMs: 120000,
  deepReservoirThreshold: 225,
  deepReservoirCapacityBonus: 25,
} as const
