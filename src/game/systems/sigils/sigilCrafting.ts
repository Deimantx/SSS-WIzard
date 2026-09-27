import type { GameState, SigilSetId, SigilSlot, SigilTier } from '../../types'
import { getSigilTierDefinition, isSigilTier } from '../../content/sigils/sigilTiers'
import { generateCraftedSigil } from './sigilGeneration'

export type SigilCraftMode = 'basic' | 'focused'
export type SigilCraftResult = { ok: true; instanceId: string; cost: number } | { ok: false; reason: string }

export const getSigilCraftCost = (mode: SigilCraftMode, tier: SigilTier) => {
  const base = mode === 'basic' ? 100 : 180
  return Math.ceil(base * getSigilTierDefinition(tier).craftCostMultiplier)
}

export const craftSigil = (state: GameState, mode: SigilCraftMode, tier: SigilTier, setId: SigilSetId, rng: () => number, slot?: SigilSlot): SigilCraftResult => {
  if (!isSigilTier(tier)) return { ok: false, reason: 'That Sigil Tier is not authored.' }
  if (tier > 1 && state.sigils.highestSourcePowerDefeated < getSigilTierDefinition(tier).minEnemyPower) return { ok: false, reason: `Defeat an enemy with Power ${getSigilTierDefinition(tier).minEnemyPower}+ first.` }
  if (mode === 'focused' && !slot) return { ok: false, reason: 'Focused Craft requires a Slot.' }
  const cost = getSigilCraftCost(mode, tier)
  if (state.sigils.dust < cost) return { ok: false, reason: `Requires ${cost} Sigil Dust.` }
  state.sigils.dust -= cost
  const sigil = generateCraftedSigil({ state, dungeonId: 'whispering-woods', tier, setId, slot, rng })
  return { ok: true, instanceId: sigil.instanceId, cost }
}
