import { describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
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
    expect(state.combat.targetEnemyId).toBe('cinder-moth')
    expect(state.ui.screen).toBe('combat')
    expect(chooseStartingSchoolAction(state, 'water')).toBe(false)
  })
})
