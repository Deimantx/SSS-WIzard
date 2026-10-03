import { describe, expect, it } from 'vitest'
import { MONSTERS } from './index'
import { EXPANSION_BOSSES_BY_LOCATION, EXPANSION_LOCATION_ROSTERS, EXPANSION_MONSTERS } from './expansionMonsters'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER } from '../combat-locations/worldNavigation'
import { TRAIT_DEFINITIONS } from '../traits/traits'

describe('Phase 01 combat expansion content', () => {
  it('adds 79 normal enemies across 13 directly owned locations and 11 bosses', () => {
    const normalIds = Object.values(EXPANSION_LOCATION_ROSTERS).flat()
    expect(normalIds).toHaveLength(79)
    expect(new Set(normalIds).size).toBe(79)
    expect(Object.keys(EXPANSION_BOSSES_BY_LOCATION)).toHaveLength(11)
    expect(Object.keys(EXPANSION_MONSTERS)).toHaveLength(90)
    expect(COMBAT_LOCATION_ORDER).toHaveLength(33)
    expect(Object.values(EXPANSION_LOCATION_ROSTERS)).toHaveLength(13)
    for (const [locationId, roster] of Object.entries(EXPANSION_LOCATION_ROSTERS)) {
      const location = COMBAT_LOCATIONS[locationId as keyof typeof COMBAT_LOCATIONS]!
      expect(location.monsterPool).toEqual(roster)
      expect(roster.length).toBeGreaterThan(0)
      expect(roster.every((id) => ['first-special', 'second-special'].every((skillId) => Boolean(MONSTERS[id].actions[skillId])) && MONSTERS[id].defaultActionPatternId in MONSTERS[id].actionPatterns)).toBe(true)
    }
  })

  it('gives each new boss two deterministic phases and a one-time half-health transition', () => {
    for (const [locationId, bossId] of Object.entries(EXPANSION_BOSSES_BY_LOCATION)) {
      const boss = MONSTERS[bossId!]
      expect(COMBAT_LOCATIONS[locationId as keyof typeof COMBAT_LOCATIONS].boss).toBe(bossId)
      expect(Object.keys(boss.actions).filter((actionId) => actionId.startsWith('skill-'))).toHaveLength(6)
      expect(boss.actionPatterns['phase-one']?.steps.length).toBeGreaterThan(0)
      expect(boss.actionPatterns['phase-two']?.steps.length).toBeGreaterThan(0)
      expect(boss.ui?.bestiary?.phaseLabels).toMatchObject({ 'phase-one': expect.any(String), 'phase-two': expect.any(String) })
      const phaseTrait = boss.traitIds.find((traitId) => traitId.endsWith('-phase'))
      expect(phaseTrait).toBeTruthy()
      expect(boss.traitIds).toContain(phaseTrait)
      const phaseDefinition = TRAIT_DEFINITIONS[phaseTrait!]!
      const rule = phaseDefinition.rules?.[0]!
      expect(rule).toMatchObject({ event: 'on-hp-threshold', oncePerEncounter: true, condition: { type: 'self-hp-below-percent', percent: 50 } })
      expect(rule.effects).toContainEqual({ type: 'set-action-pattern', target: 'self', patternId: 'phase-two' })
      for (const pattern of Object.values(boss.actionPatterns)) {
        for (const step of pattern.steps) if (step.type === 'action') expect(boss.actions[step.actionId]).toBeDefined()
      }
    }
  })

  it('authors Steam Tyrant mixed-element skills, action delay, and exact phase sequences', () => {
    const tyrant = MONSTERS['steam-tyrant']
    const crown = tyrant.actions['skill-1'].effects.find((effect) => effect.type === 'deal-damage')
    const hammer = tyrant.actions['skill-3'].effects.find((effect) => effect.type === 'deal-damage')
    const flashBoil = tyrant.actions['skill-5'].effects.find((effect) => effect.type === 'modify-action-timer')
    const rupture = tyrant.actions['skill-6'].effects.find((effect) => effect.type === 'deal-damage')
    expect(crown?.type === 'deal-damage' && crown.components.map(({ damageType }) => damageType)).toEqual(['fire', 'water'])
    expect(hammer?.type === 'deal-damage' && hammer.components.map(({ damageType }) => damageType)).toEqual(['water'])
    expect(flashBoil).toMatchObject({ type: 'modify-action-timer', target: 'opponent', amountMs: 500, action: 'current' })
    expect(rupture?.type === 'deal-damage' && rupture.components.map(({ damageType }) => damageType)).toEqual(['fire', 'water'])
    expect(tyrant.actionPatterns['phase-one'].steps.map((step) => step.type === 'basic' ? 'basic' : step.actionId)).toEqual(['skill-1', 'basic', 'skill-2', 'skill-4', 'basic', 'skill-3'])
    expect(tyrant.actionPatterns['phase-two'].steps.map((step) => step.type === 'basic' ? 'basic' : step.actionId)).toEqual(['skill-6', 'skill-5', 'basic', 'skill-1', 'skill-2', 'skill-3'])
  })
})
