import { SIGIL_QUALITIES, type SigilQuality } from './sigilQualities'
import type { SigilTier } from './sigilTiers'

export const SIGIL_DROP_CHANCE = { normal: .04, boss: .35 } as const
export const SIGIL_STORAGE_SOFT_CAP = 500
export const DEBUG_SIGIL_STORAGE_HARD_CAP = 1_000
export const SIGIL_ATTUNEMENT_WEIGHT = 3
export const SIGIL_AUTO_SALVAGE_DEFAULTS = Object.fromEntries(SIGIL_QUALITIES.map(({ id }) => [id, false])) as Record<SigilQuality, boolean>

export const SIGIL_QUALITY_WEIGHTS: Record<string, Record<SigilQuality, number>> = {
  '1-normal': { common: 75, refined: 22, perfect: 2.8, legendary: .2 },
  '1-boss': { common: 55, refined: 35, perfect: 9, legendary: 1 },
  '2-normal': { common: 55, refined: 32, perfect: 11, legendary: 2 },
  '2-boss': { common: 35, refined: 40, perfect: 22, legendary: 3 },
}

export const SIGIL_CRAFT_QUALITY_WEIGHTS: Record<SigilTier, Record<SigilQuality, number>> = {
  1: { common: 70, refined: 25, perfect: 4.5, legendary: .5 },
  2: { common: 50, refined: 35, perfect: 12, legendary: 3 },
}
