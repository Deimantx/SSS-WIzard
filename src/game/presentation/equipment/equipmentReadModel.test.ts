import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
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
    expect(preview).toMatchObject({ compatible: false, failureReason: 'duplicate-ring' })
    expect(preview.reason).toContain('same Ring')
  })

  it('projects Spell-origin Equipment modifiers into stable comparisons', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { level: 2, allocatedNodeIds: ['arcane-kindling'], attunedNodeIds: [] }
    const ember = getEquipmentStatSnapshot(state, state.equipment)
    expect(ember.fireSpellDamage).toBeCloseTo(0.05)

    const windState = createInitialState()
    windState.inventory['windthread-charm'] = 1
    windState.equipment.amulet = 'windthread-charm'
    expect(getEquipmentStatSnapshot(windState, windState.equipment).airSpellDamage).toBeCloseTo(0.1)
  })

  it('blocks an invalid Prismatic swap and permits it after Focus is freed', () => {
    const state = createInitialState()
    state.inventory['prismatic-focus'] = 1
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'prismatic-focus'
    state.artifactProgress['prismatic-focus'] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] }
    state.progress.spellRanks = { fireball: 7 }
    state.activities.channeling.echoesAssigned = 5
    state.activities.autoCast.fireball = true
    recalculateDerivedStats(state)

    const blocked = getEquipmentPreview(state, 'ember-staff')
    expect(blocked).toMatchObject({ compatible: false, failureReason: 'insufficient-focus-capacity', focusValidation: { maxFocus: 100, usedFocus: 120, deficit: 20 } })
    expect(blocked.reason).toBe('Free 20 Focus before equipping this item.')
    expect(state.equipment.weapon).toBe('prismatic-focus')

    state.activities.channeling.echoesAssigned = 3
    const allowed = getEquipmentPreview(state, 'ember-staff')
    expect(allowed).toMatchObject({ compatible: true, focusValidation: { maxFocus: 100, usedFocus: 100, deficit: 0 }, impact: { maxFocus: -20 } })
  })
})
