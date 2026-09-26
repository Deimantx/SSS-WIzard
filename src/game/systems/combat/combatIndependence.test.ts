import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { chooseStartingSchoolAction } from '../../../store/actions/onboardingActions'
import { assignChannelingAcolyteAction } from '../../../store/actions/acolyteActions'
import { spawnEnemy } from './combatRuntime'
import { DUNGEONS } from '../../content/dungeons/dungeons'

describe('combat independence', () => {
  it('starts combat with every Acolyte assigned to Tower work', () => {
    const state = createInitialState()
    chooseStartingSchoolAction(state, 'fire')
    for (let index = 0; index < 5; index += 1) assignChannelingAcolyteAction(state)
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    const enemyId = DUNGEONS['whispering-woods'].monsterPool[0]
    expect(enemyId).toBeTruthy()
    expect(spawnEnemy(state, enemyId!)).toBe(true)
    expect(state.combat.active).toBe(true)
    expect(state.activities.channeling.acolytesAssigned).toBe(5)
  })
})
