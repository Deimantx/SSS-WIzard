import type { GameState, SigilInstance, SigilStatId, SigilTraitId } from '../../types'
import { getEligibleSigilTraits } from '../../content/sigils/sigilTraits'
import { SIGIL_SECONDARY_STAT_IDS } from '../../content/sigils/sigilStats'
import { getSigilQualityDefinition } from '../../content/sigils/sigilQualities'
import { clampSigilRollQuality, getSigilEnhancementCap, getSigilEnhancementCost } from './sigilRuntime'

export interface SigilEnhancementOptions { rng?: () => number; bypassGlobalCap?: boolean }
export type SigilEnhancementResult = { ok: true; cost: number; rank: number; milestone: 'new-secondary' | 'improve-secondary' | 'trait' | null } | { ok: false; reason: string }

const milestones = [3, 6, 9, 12, 15, 18]
const randomIndex = (length: number, rng: () => number) => Math.min(length - 1, Math.floor(clampSigilRollQuality(rng()) * length))

export const enhanceSigil = (state: GameState, instanceId: string, options: SigilEnhancementOptions = {}): SigilEnhancementResult => {
  const sigil = state.sigils.storage[instanceId]
  if (!sigil) return { ok: false, reason: 'Sigil not found.' }
  const nextRank = sigil.rank + 1
  const qualityCap = getSigilQualityDefinition(sigil.quality).maxRank
  const globalCap = options.bypassGlobalCap ? Number.POSITIVE_INFINITY : getSigilEnhancementCap(state)
  if (nextRank > qualityCap) return { ok: false, reason: `Quality cap is +${qualityCap}.` }
  if (nextRank > globalCap) return { ok: false, reason: `Enhancement cap is +${globalCap}.` }
  const cost = getSigilEnhancementCost(sigil, nextRank)
  if (state.sigils.dust < cost) return { ok: false, reason: `Requires ${cost} Sigil Dust.` }
  state.sigils.dust -= cost
  sigil.rank = nextRank
  state.sigils.highestRankEver = Math.max(state.sigils.highestRankEver, nextRank)
  if (!milestones.includes(nextRank)) return { ok: true, cost, rank: nextRank, milestone: null }
  const rng = options.rng ?? Math.random
  let milestone: SigilEnhancementResult extends infer _ ? 'new-secondary' | 'improve-secondary' | 'trait' : never = 'improve-secondary'
  if (sigil.secondaries.length < 4) {
    const occupied = new Set<SigilStatId>([sigil.mainStatId, ...sigil.secondaries.map((secondary) => secondary.statId)])
    const candidates = SIGIL_SECONDARY_STAT_IDS.filter((statId) => !occupied.has(statId))
    if (candidates.length) {
      const statId = candidates[randomIndex(candidates.length, rng)]
      const quality01 = clampSigilRollQuality(rng())
      sigil.secondaries.push({ statId, rolls: [{ quality01, rank: nextRank }] })
      sigil.rollHistory.push({ rank: nextRank, kind: 'new-secondary', statId, rollQuality01: quality01 })
      state.sigils.secondaryRollsLifetime += 1
      milestone = 'new-secondary'
    }
  } else {
    const secondary = sigil.secondaries[randomIndex(sigil.secondaries.length, rng)]
    const quality01 = clampSigilRollQuality(rng())
    secondary.rolls.push({ quality01, rank: nextRank })
    sigil.rollHistory.push({ rank: nextRank, kind: 'improve-secondary', statId: secondary.statId, rollQuality01: quality01 })
    state.sigils.secondaryRollsLifetime += 1
  }
  if ((sigil.quality === 'perfect' && nextRank === 15) || (sigil.quality === 'legendary' && (nextRank === 15 || nextRank === 20))) {
    const excluded = sigil.traitIds
    const candidates = getEligibleSigilTraits(sigil.setId, excluded)
    if (candidates.length && sigil.traitIds.length < getSigilQualityDefinition(sigil.quality).traitCount) {
      const traitId = candidates[randomIndex(candidates.length, rng)] as SigilTraitId
      sigil.traitIds.push(traitId)
      sigil.rollHistory.push({ rank: nextRank, kind: 'trait', traitId })
      state.sigils.discovery.discoveredTraits[traitId] = true
      state.sigils.traitsUnlockedLifetime += 1
      milestone = 'trait'
    }
  }
  return { ok: true, cost, rank: nextRank, milestone }
}
