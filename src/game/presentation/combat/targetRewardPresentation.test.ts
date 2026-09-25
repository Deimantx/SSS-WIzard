import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { getNonZeroResonanceEntries } from '../resonance/resonancePresentation'
import { resolveWorldTierLootQuantity } from '../../systems/world-tier/worldTierRuntime'
import { resolvePowerScaledCurrencyRewardRange } from '../../systems/loot/powerScaledCurrencyRewards'
import { buildCombatTargetRewardPresentation } from './targetRewardPresentation'
import { resolveEnemyPowerRating } from './enemyPowerRating'

describe('combat target reward presentation', () => {
  it('exposes authored item drops before Bestiary discovery and applies canonical item scaling', () => {
    const reward = buildCombatTargetRewardPresentation('cinder-moth', 2)
    const lifeEssence = resolvePowerScaledCurrencyRewardRange('cinder-moth', 'life-essence', 2)
    const artifactEssence = resolvePowerScaledCurrencyRewardRange('cinder-moth', 'artifact-essence', 2)
    expect(reward.itemDrops).toEqual([...MONSTERS['cinder-moth'].loot.map((drop) => ({
      ...drop,
      min: resolveWorldTierLootQuantity(drop.min, 2),
      max: resolveWorldTierLootQuantity(drop.max, 2),
    })), { itemId: 'life-essence', min: lifeEssence.finalMin, max: lifeEssence.finalMax, chance: 1 }, { itemId: 'artifact-essence', min: artifactEssence.finalMin, max: artifactEssence.finalMax, chance: 1 }])
    expect(reward.resonance.fire).toBeGreaterThan(0)
    expect(reward.itemDrops[0].min).toBe(lifeEssence.finalMin)
  })

  it('keeps multi-type Resonance in canonical Fire, Water, Earth, Air order', () => {
    const reward = buildCombatTargetRewardPresentation('tempest-stag', 1)
    expect(getNonZeroResonanceEntries(reward.resonance).map((entry) => entry.type)).toEqual(['earth', 'air'])
    expect(reward.powerRating).toBeGreaterThan(0)
    expect(reward.threatGain).toBe(resolveEnemyPowerRating('tempest-stag', 1))
  })

  it('keeps location-owned Zone Affix context out of target reward payloads', () => {
    const reward = buildCombatTargetRewardPresentation('bonehide-boar', 1)
    expect('minorAffix' in reward).toBe(false)
    expect('zoneAffix' in reward).toBe(false)
  })
})
