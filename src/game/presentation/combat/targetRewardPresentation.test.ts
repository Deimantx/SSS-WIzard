import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { getNonZeroResonanceEntries } from '../resonance/resonancePresentation'
import { resolveWorldTierLootQuantity } from '../../systems/world-tier/worldTierRuntime'
import { buildCombatTargetRewardPresentation } from './targetRewardPresentation'

describe('combat target reward presentation', () => {
  it('exposes authored item drops before Bestiary discovery and applies canonical item scaling', () => {
    const reward = buildCombatTargetRewardPresentation('cinder-moth', 2)
    const authored = MONSTERS['cinder-moth'].loot[0]
    expect(reward.itemDrops).toEqual(MONSTERS['cinder-moth'].loot.map((drop) => ({
      ...drop,
      min: resolveWorldTierLootQuantity(drop.min, 2),
      max: resolveWorldTierLootQuantity(drop.max, 2),
    })))
    expect(reward.resonance.fire).toBeGreaterThan(0)
    expect(reward.itemDrops[0].min).toBe(resolveWorldTierLootQuantity(authored.min, 2))
  })

  it('keeps multi-type Resonance in canonical Fire, Water, Earth, Air order', () => {
    const reward = buildCombatTargetRewardPresentation('tempest-stag', 1)
    expect(getNonZeroResonanceEntries(reward.resonance).map((entry) => entry.type)).toEqual(['earth', 'air'])
    expect(reward.powerRating).toBeGreaterThan(0)
  })

  it('includes the authored Elite Minor Affix in target reward inspection', () => {
    const reward = buildCombatTargetRewardPresentation('bonehide-boar', 1, 'armored')
    expect(reward.minorAffix).toMatchObject({ id: 'armored', name: 'Armored' })
    expect(reward.minorAffix?.description).toContain('25%')
  })
})
