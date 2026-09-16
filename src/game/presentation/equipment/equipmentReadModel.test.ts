import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { getEquipmentKeyChanges, getEquipmentLoadoutIdentity, getEquipmentPreview, getEquipmentStatSnapshot, resolveEquipmentPreviewTarget } from './equipmentReadModel'

describe('Equipment read model', () => {
  it('uses authored sheet inputs without borrowing transient encounter state', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    const sheet = getEquipmentStatSnapshot(state, state.equipment)
    const combatState = { ...state, combat: { ...state.combat, active: true, dungeonId: 'whispering-woods' as const, enemyId: 'forest-wisp' as const, enemyHp: 1, enemyMaxHp: 44 } }
    expect(getEquipmentStatSnapshot(combatState, combatState.equipment)).toEqual(sheet)
  })

  it('reports central evaluator failures and keeps incompatible explicit targets out', () => {
    const state = createInitialState()
    expect(getEquipmentPreview(state, 'ember-staff')).toMatchObject({ compatible: false, failureReason: 'not-owned' })
    state.inventory['wispweave-robe'] = 1
    expect(resolveEquipmentPreviewTarget({ itemId: 'wispweave-robe', selectedPosition: 'weapon', equipment: state.equipment })).toBe('armor')
    expect(getEquipmentPreview(state, 'wispweave-robe', 'armor')).toMatchObject({ compatible: true, position: 'armor' })
  })

  it('projects Artifact mechanics and returns compact build identity', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.equipment.weapon = 'ember-staff'
    state.artifactProgress['ember-staff'] = { level: 2, allocatedNodeIds: ['arcane-kindling'], attunedNodeIds: [] }
    expect(getEquipmentStatSnapshot(state, state.equipment).fireSpellDamage).toBeCloseTo(0.05)
    expect(getEquipmentLoadoutIdentity('ember-staff')).toEqual(['FIRE', 'DOT'])
    expect(getEquipmentLoadoutIdentity('tideglass-wand')).toEqual(['WATER', 'BARRIER'])
  })

  it('ranks compact key changes from preview impact', () => {
    const changes = getEquipmentKeyChanges({ maxHealth: 10, basicDamage: 7, spellPower: 17, maxMana: -42, maxFocus: -20, defense: 3, critChance: 0.04 })
    expect(changes.map(({ key }) => key)).toEqual(['maxHealth', 'basicDamage', 'spellPower', 'maxMana', 'maxFocus'])
    expect(changes[1]).toMatchObject({ label: 'Basic Attack Damage', formatted: '+7', direction: 'increase' })
  })
})
