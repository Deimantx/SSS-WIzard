import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { chooseStartingSchoolAction } from '../../../store/actions/onboardingActions'
import { assignChannelingAcolyteAction } from '../../../store/actions/acolyteActions'
import { spawnEnemy } from './combatRuntime'
import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'

describe('combat independence', () => {
  it('starts combat with every Acolyte assigned to Tower work', () => {
    const state = createInitialState()
    chooseStartingSchoolAction(state, 'fire')
    for (let index = 0; index < 5; index += 1) assignChannelingAcolyteAction(state)
    state.combat.active = true
    state.combat.locationId = 'whispering-woods'
    const enemyId = COMBAT_LOCATIONS['whispering-woods'].monsterPool[0]
    expect(enemyId).toBeTruthy()
    expect(spawnEnemy(state, enemyId!)).toBe(true)
    expect(state.combat.active).toBe(true)
    expect(state.activities.channeling.acolytesAssigned).toBe(5)
  })
})
