import { SIGIL_QUALITIES, type SigilQuality } from './sigilQualities'
import type { SigilTier } from './sigilTiers'

export const SIGIL_STORAGE_SOFT_CAP = 500
export const DEBUG_SIGIL_STORAGE_HARD_CAP = 1_000
export const SIGIL_ATTUNEMENT_WEIGHT = 3
export const SIGIL_AUTO_SALVAGE_DEFAULTS = Object.fromEntries(SIGIL_QUALITIES.map(({ id }) => [id, false])) as Record<SigilQuality, boolean>

export const SIGIL_CRAFT_QUALITY_WEIGHTS: Record<SigilTier, Record<SigilQuality, number>> = {
  1: { common: 70, refined: 25, perfect: 4.5, legendary: .5 },
  2: { common: 50, refined: 35, perfect: 12, legendary: 3 },
}
