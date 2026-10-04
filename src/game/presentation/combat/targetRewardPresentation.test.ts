import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { getNonZeroResonanceEntries } from '../resonance/resonancePresentation'
import { resolveCombatCurrencyRewardRange } from '../../systems/loot/combatCurrencyRewards'
import { buildCombatTargetRewardPresentation } from './targetRewardPresentation'
import { resolveEnemyPowerRating } from './enemyPowerRating'

describe('combat target reward presentation', () => {
  it('exposes authored item drops before Bestiary discovery and applies canonical item scaling', () => {
    const reward = buildCombatTargetRewardPresentation('cinder-moth')
    const lifeEssence = resolveCombatCurrencyRewardRange('cinder-moth', 'life-essence')
    const artifactEssence = resolveCombatCurrencyRewardRange('cinder-moth', 'artifact-essence')
    expect(reward.itemDrops).toEqual([...MONSTERS['cinder-moth'].loot.map((drop, index) => ({
      itemId: drop.itemId,
      min: reward.itemDrops[index].min,
      max: reward.itemDrops[index].max,
      chance: reward.itemDrops[index].chance,
    })), { itemId: 'life-essence', min: lifeEssence.finalMin, max: lifeEssence.finalMax, chance: 1 }, { itemId: 'artifact-essence', min: artifactEssence.finalMin, max: artifactEssence.finalMax, chance: 1 }])
    expect(reward.lootTier).toBeGreaterThan(0)
    expect(reward.resonance.fire).toBeGreaterThan(0)
    expect(reward.itemDrops[0].min).toBe(lifeEssence.finalMin)
  })

  it('keeps multi-type Resonance in canonical Fire, Water, Earth, Air order', () => {
    const reward = buildCombatTargetRewardPresentation('tempest-stag')
    expect(getNonZeroResonanceEntries(reward.resonance).map((entry) => entry.type)).toEqual(['earth', 'air'])
    expect(reward.powerRating).toBeGreaterThan(0)
    expect(reward.threatGain).toBe(resolveEnemyPowerRating('tempest-stag'))
  })

  it('keeps location-owned Zone Affix context out of target reward payloads', () => {
    const reward = buildCombatTargetRewardPresentation('bonehide-boar')
    expect('minorAffix' in reward).toBe(false)
    expect('zoneAffix' in reward).toBe(false)
  })
})
