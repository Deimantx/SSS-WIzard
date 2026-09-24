import { describe, expect, it } from 'vitest'
import { ITEMS } from '../items/items'
import { ARTIFACTS, ACT1_ARTIFACT_IDS, validateArtifactDefinitions } from './artifacts'
import { createInitialState } from '../../../store/initialState'
import { getActiveArtifactCombatProviders, getArtifactEffectiveStats, getArtifactMaxInvestedRanks, getArtifactTotalInvestedRanks, mergeArtifactResolvedEffects, purchaseArtifactMinorRank } from '../../systems/artifacts/artifactProgression'

describe('V6 Artifact roster', () => {
  it('contains the six Act 0 and six Act 1 definitions in the canonical schema', () => {
    expect(Object.keys(ARTIFACTS)).toHaveLength(12)
    expect(ACT1_ARTIFACT_IDS).toHaveLength(6)
    Object.values(ARTIFACTS).forEach((artifact) => {
      const expectedCount = ACT1_ARTIFACT_IDS.includes(artifact.id) ? 6 : 5
      expect(artifact.minorNodes).toHaveLength(expectedCount)
      expect(artifact.majorMilestones).toHaveLength(expectedCount)
      expect(artifact.minorNodes.every((node) => node.maxRank === 10 && node.rankCosts.length === 10 && node.rankEffects.length === 10)).toBe(true)
      expect(artifact.majorMilestones.map((major) => major.unlockAtTotalRanks)).toEqual(Array.from({ length: expectedCount }, (_, index) => (index + 1) * 10))
    })
  })

  it('passes authored content validation', () => expect(validateArtifactDefinitions(ITEMS)).toEqual([]))

  it('uses the authored Fire critical-chance progression while preserving stable node IDs', () => {
    const emberFocus = ARTIFACTS['ember-staff'].minorNodes.find((node) => node.id === 'quickkindle')
    const pyreFocus = ARTIFACTS['pyrebound-staff'].minorNodes.find((node) => node.id === 'cinder-tempo')
    expect(emberFocus).toMatchObject({ name: 'Cinder Focus', description: 'Spell Critical Chance' })
    expect(pyreFocus).toMatchObject({ name: 'Pyre Focus', description: 'Spell Critical Chance' })
    expect(emberFocus?.rankEffects).toHaveLength(10)
    expect(pyreFocus?.rankEffects).toHaveLength(10)
    expect(mergeArtifactResolvedEffects(emberFocus?.rankEffects ?? []).stats?.critChance).toBeCloseTo(0.075, 10)
    expect(mergeArtifactResolvedEffects(pyreFocus?.rankEffects ?? []).stats?.critChance).toBeCloseTo(0.1, 10)
    expect(mergeArtifactResolvedEffects(pyreFocus?.rankEffects ?? []).stats?.critChance).toBeGreaterThan(mergeArtifactResolvedEffects(emberFocus?.rankEffects ?? []).stats?.critChance ?? 0)
    for (const node of [emberFocus, pyreFocus]) {
      expect(node?.rankEffects.every((rankEffect) => rankEffect.stats?.critChance !== undefined)).toBe(true)
      expect(node?.rankEffects.flatMap((rankEffect) => rankEffect.combat?.modifiers ?? []).some((modifier) => modifier.key === 'spell-cast-time-percent')).toBe(false)
    }
  })

  it('keeps Fire weapon Artifacts free of Fire Spell Cast Time modifiers', () => {
    for (const artifactId of ['ember-staff', 'pyrebound-staff'] as const) {
      const artifact = ARTIFACTS[artifactId]
      const authoredEffects = [
        ...artifact.minorNodes.flatMap((node) => node.rankEffects),
        ...artifact.majorMilestones.map((milestone) => milestone.effects),
      ]
      const fireCastTimeModifier = authoredEffects
        .flatMap((rankEffect) => rankEffect.combat?.modifiers ?? [])
        .find((modifier) => modifier.key === 'spell-cast-time-percent' && modifier.sourceTags?.includes('fire'))
      expect(fireCastTimeModifier).toBeUndefined()
    }
  })

  it('keeps Rank 0 baselines in runtime equipment stats', () => {
    expect(getArtifactEffectiveStats({ artifactProgress: {} }, 'ember-staff')).toMatchObject({ spellPower: 15 })
    expect(getArtifactEffectiveStats({ artifactProgress: {} }, 'tideglass-wand')).toMatchObject({ spellPower: 15, maxMana: 10 })
    expect(getArtifactEffectiveStats({ artifactProgress: {} }, 'reliquary-scepter')).toMatchObject({ spellPower: 235, maxMana: 60, healingDonePct: 0.1 })
  })

  it('keeps signature threshold effects in the combat provider registry', () => {
    const state = createInitialState()
    state.artifactProgress['tideglass-wand'] = { minorRanks: { 'arcane-current': 10, 'deep-reservoir': 10, 'mending-current': 10, 'frosted-surge': 10, 'lingering-chill': 10 } }
    const providers = getActiveArtifactCombatProviders(state, 'tideglass-wand')
    expect(providers.flatMap((provider) => provider.rules)).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'artifact-tidal-grace', oncePerEncounter: true, event: 'on-hp-threshold' })]))
  })

  it('uses one central item and resonance transaction for a Minor rank', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { minorRanks: {} }
    state.inventory['artifact-essence'] = 15
    state.inventory['fire-fragment'] = 50
    state.resonance.fire = 50
    const result = purchaseArtifactMinorRank(state, 'ember-staff', 'arcane-embers')
    expect(result.ok).toBe(true)
    expect(getArtifactTotalInvestedRanks(state, 'ember-staff')).toBe(1)
    expect(getArtifactMaxInvestedRanks('ember-staff')).toBe(50)
    expect(state.inventory['artifact-essence']).toBe(0)
    expect(state.resonance.fire).toBe(0)
  })
})
