import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEquipmentPreview, getEquipmentStatSnapshot } from './equipmentReadModel'

describe('Equipment read model', () => {
  it('uses authored sheet inputs without borrowing transient encounter state', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    const sheet = getEquipmentStatSnapshot(state, state.equipment)

    const combatState = {
      ...state,
      combat: {
        ...state.combat,
        active: true,
        dungeonId: 'whispering-woods' as const,
        enemyId: 'forest-wisp' as const,
        enemyHp: 1,
        enemyMaxHp: 44,
        playerStatuses: [{ statusId: 'chilled' as const, holder: 'player' as const, instanceKey: 'test:chilled', source: { actor: 'enemy' as const, kind: 'action' as const, sourceId: 'test' }, remainingMs: 5000, initialDurationMs: 5000, stacks: 1 }],
      },
    }
    expect(getEquipmentStatSnapshot(combatState, combatState.equipment)).toEqual(sheet)
  })

  it('reports the central evaluator failure reason in the preview', () => {
    const state = createInitialState()
    state.inventory['gravebinder-ring'] = 1
    state.equipment.ring1 = 'gravebinder-ring'
    const preview = getEquipmentPreview(state, 'gravebinder-ring', 'ring2')
    expect(preview).toMatchObject({ compatible: false, failureReason: 'insufficient-copies' })
    expect(preview.reason).toContain('second copy')
  })
})
