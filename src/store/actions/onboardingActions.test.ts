import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { useGameStore } from '../gameStore'
import { chooseStartingSchoolAction } from './onboardingActions'

describe('starting-school onboarding', () => {
  it('establishes the Level 10 school, starter artifact, and three-spell combat preset', () => {
    const state = createInitialState()
    expect(chooseStartingSchoolAction(state, 'fire')).toBe(true)
    expect(state.progress.startingSchoolId).toBe('fire')
    expect(state.progress.tutorialStage).toBe('combat')
    expect(state.schools.fire.level).toBe(10)
    expect(state.schools.water.level).toBe(1)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.equipment.weapon).toBe('ember-staff')
    expect(state.player.mana).toBe(state.player.maxMana)
    expect(state.spellPresets.presets[0]?.slots).toHaveLength(3)
    expect(state.combat.active).toBe(false)
    expect(state.combat.targetEnemyId).toBeNull()
    expect(state.combat.activeSpellLoadout).toBeNull()
    expect(Object.values(state.activities.autoCast).some(Boolean)).toBe(false)
    expect(state.activities.autoCastPriority).toEqual([])
    expect(state.spellPresets.selectedPresetId).not.toBeNull()
    expect(state.spellPresets.presets[0]?.slots.every((slot) => slot.autoCast && slot.automation)).toBe(true)
    expect(state.ui.screen).toBe('combat')
    expect(state.ui.lastEnteredCombatDungeonId).toBe('stonewake-hollow')
    expect(state.spellPresets.presets[0]?.slots.map((slot) => slot.spellId)).toEqual(['fire-bolt', 'searing-touch', 'flame-burst'])
    expect(chooseStartingSchoolAction(state, 'water')).toBe(false)
  })

  it('activates the selected starter preset and target only when a Hunt starts', () => {
    const state = createInitialState()
    expect(chooseStartingSchoolAction(state, 'air')).toBe(true)
    useGameStore.setState({ ...useGameStore.getState(), ...state })

    expect(useGameStore.getState().combat.active).toBe(false)
    expect(useGameStore.getState().combat.targetEnemyId).toBeNull()
    expect(useGameStore.getState().activities.autoCastPriority).toEqual([])

    expect(useGameStore.getState().huntCombatTarget('tideglass-caverns', 'tideglass-tide-wisp')).toBe(true)
    const active = useGameStore.getState()
    expect(active.combat.active).toBe(true)
    expect(active.combat.activeSpellLoadout).not.toBeNull()
    expect(active.activities.autoCastPriority.length).toBeGreaterThan(0)
    expect(active.combat.targetEnemyId).toBe('tideglass-tide-wisp')
  })

  it('routes each starting School to the zone it counters', () => {
    const routes = { fire: 'stonewake-hollow', earth: 'galecrest-heights', air: 'tideglass-caverns', water: 'emberfall-basin' } as const
    for (const [school, dungeonId] of Object.entries(routes) as Array<[keyof typeof routes, typeof routes[keyof typeof routes]]>) {
      const state = createInitialState()
      expect(chooseStartingSchoolAction(state, school)).toBe(true)
      expect(state.ui.lastEnteredCombatDungeonId).toBe(dungeonId)
      expect(state.spellPresets.presets[0]?.slots).toHaveLength(3)
      expect(state.spellPresets.presets[0]?.slots.some((slot) => slot.spellId?.endsWith('-ward'))).toBe(false)
    }
  })
})
