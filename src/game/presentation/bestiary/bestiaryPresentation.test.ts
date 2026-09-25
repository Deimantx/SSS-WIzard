import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { buildBestiaryBossPhases, getBestiaryBossSummaryTags, getBestiaryResonancePresentation, getBestiaryResonanceSearchText, getBestiaryTraitPresentations } from './bestiaryPresentation'
import { buildCombatStatusDetailPresentation } from '../combat'

describe('Bestiary combat presentation', () => {
  it('explains Rapid Regrow from the authored status definition', () => {
    const presentation = buildCombatStatusDetailPresentation('rapid-regrow')
    expect(presentation.modifiers).toEqual([])
    expect(presentation.periodic?.effects).toContain('Restores 5% Max HP Health per tick')
    expect(presentation.periodic?.intervalLabel).toBe('1 sec')
    expect(presentation.periodic?.tickCount).toBe(8)
    expect(presentation.periodic?.totalEffects).toContain('Restores 40% Max HP Health over the full duration')
    expect(presentation.durationLabel).toBe('8 sec')
    expect(presentation.dispellable).toBe(true)
  })

  it('formats Haste and Corruption modifiers from status data', () => {
    expect(buildCombatStatusDetailPresentation('haste').modifiers).toEqual(['+15% Action Speed', '+15% Basic Attack Speed'])
    expect(buildCombatStatusDetailPresentation('corruption').modifiers).toEqual(['+3% Damage Taken per stack'])
    expect(buildCombatStatusDetailPresentation('corruption').maxStacks).toBe(5)
  })

  it('presents Forest Heart threshold mechanics and phase transition', () => {
    const traits = getBestiaryTraitPresentations(MONSTERS['forest-heart'])
    const livingCore = traits.find((trait) => trait.id === 'forest-heart-living-core')
    expect(livingCore?.triggers[0]).toMatchObject({ label: 'Below 50% HP', oncePerEncounter: true })
    expect(livingCore?.triggers[0].effects.map((effect) => effect.label)).toEqual(['Haste', 'Rapid Regrow', 'Pattern Change'])
    expect(livingCore?.triggers[0].effects[2].detail).toBe('Switch to Overgrown')
    expect(buildBestiaryBossPhases(MONSTERS['forest-heart']).phases.map((phase) => phase.label)).toEqual(['Default', 'Overgrown'])
  })

  it('keeps Edrin opening separate from the repeating Unbound phase', () => {
    const phases = buildBestiaryBossPhases(MONSTERS['archmage-edrin-shade'])
    expect(phases.phases.map((phase) => phase.id)).toEqual(['default', 'unbound-opening', 'unbound'])
    expect(phases.phases[1].opening).toBe(true)
    expect(phases.transitions.default.effects.map((effect) => effect.label)).toContain('Unbound Power')
    expect(getBestiaryBossSummaryTags(MONSTERS['archmage-edrin-shade'])).toContain('Soft Enrage')
  })

  it('presents current World Tier resonance in canonical order and omits zero values', () => {
    const presentation = getBestiaryResonancePresentation(MONSTERS['graveglass-shade'], 2)
    expect(presentation).toMatchObject({ worldTier: 2, worldTierRewardMultiplier: 2, globalRewardMultiplier: 0.2, rewardMultiplier: 0.4 })
    expect(presentation.entries.map((entry) => [entry.label, entry.baseAmount, entry.finalAmount])).toEqual([
      ['Water Resonance', 24, 9],
      ['Earth Resonance', 12, 4],
    ])
  })

  it('keeps Bestiary Resonance search identity on authored base values', () => {
    expect(getBestiaryResonanceSearchText(MONSTERS['forest-wisp']).toLowerCase()).toContain('air resonance')
    expect(getBestiaryResonanceSearchText(MONSTERS['meridian-warden'])).toBe('')
  })
})
