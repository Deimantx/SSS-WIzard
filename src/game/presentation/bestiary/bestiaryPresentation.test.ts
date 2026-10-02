import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyResonanceReward } from '../../systems/resonance/resonanceRuntime'
import { buildBestiaryBossPhases, getBestiaryBossSummaryTags, getBestiaryResonancePresentation, getBestiaryResonanceSearchText, getBestiaryTraitPresentations } from './bestiaryPresentation'
import { buildCombatStatusDetailPresentation } from '../combat'

describe('Bestiary combat presentation', () => {
  it('formats Haste and Corruption modifiers from status data', () => {
    expect(buildCombatStatusDetailPresentation('haste').modifiers).toEqual(['+15% Action Speed', '+15% Basic Attack Speed'])
    expect(buildCombatStatusDetailPresentation('corruption').modifiers).toEqual(['+3% Damage Taken per stack'])
    expect(buildCombatStatusDetailPresentation('corruption').maxStacks).toBe(5)
  })

  it('presents Forest Heart threshold mechanics and phase transition', () => {
    const traits = getBestiaryTraitPresentations(MONSTERS['forest-heart'])
    const livingCore = traits.find((trait) => trait.id === 'forest-heart-living-core')
    expect(livingCore?.triggers[0]).toMatchObject({ label: 'Below 35% HP', oncePerEncounter: true })
    expect(livingCore?.triggers[0].effects.map((effect) => effect.label)).toEqual(['Heal', 'Pattern Change'])
    expect(livingCore?.triggers[0].effects[0].detail).toContain('15%')
    expect(livingCore?.triggers[0].effects[1].detail).toBe('Switch to Overgrown')
    expect(buildBestiaryBossPhases(MONSTERS['forest-heart']).phases.map((phase) => phase.label)).toEqual(['Default', 'Overgrown'])
  })

  it('keeps Edrin opening separate from the repeating Unbound phase', () => {
    const phases = buildBestiaryBossPhases(MONSTERS['archmage-edrin-shade'])
    expect(phases.phases.map((phase) => phase.id)).toEqual(['default', 'unbound-opening', 'unbound'])
    expect(phases.phases[1].opening).toBe(true)
    expect(phases.transitions.default.effects.map((effect) => effect.label)).toContain('Unbound Power')
    expect(getBestiaryBossSummaryTags(MONSTERS['archmage-edrin-shade'])).toContain('Soft Enrage')
  })

  it('presents current Power-derived loot tier resonance in canonical order and omits zero values', () => {
    const presentation = getBestiaryResonancePresentation(MONSTERS['graveglass-shade'], 2)
    const expected = resolveEnemyResonanceReward('graveglass-shade', 2)
    expect(presentation).toMatchObject({ worldTier: 2, lootTier: expected.lootTier, lootQuantityMultiplier: expected.lootQuantityMultiplier, bossQuantityMultiplier: expected.bossQuantityMultiplier, rewardMultiplier: expected.rewardMultiplier })
    expect(presentation.entries.map((entry) => [entry.label, entry.baseAmount, entry.finalAmount])).toEqual([
      ['Water Resonance', expected.baseYield.water, expected.finalYield.water],
      ['Earth Resonance', expected.baseYield.earth, expected.finalYield.earth],
    ])
  })

  it('keeps Bestiary Resonance search identity on authored base values', () => {
    expect(getBestiaryResonanceSearchText(MONSTERS['forest-wisp']).toLowerCase()).toContain('air resonance')
    expect(getBestiaryResonanceSearchText(MONSTERS['meridian-warden'])).toBe('')
  })
})
