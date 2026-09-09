import { afterEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { recalculateDerivedStats, selectUsedFocus } from '../../engine'
import { getEquipmentPreview } from '../../presentation/equipment/equipmentReadModel'
import type { ItemId } from '../../types'
import { createInitialState } from '../../../store/initialState'
import { equipItemAction, unequipItemAction } from '../../../store/actions/equipmentActions'
import { validateFocusForEquipment } from './focusLoadoutValidation'

const focusEfficientWeapon = 'focus-efficient-test-weapon' as ItemId

afterEach(() => { delete ITEMS[focusEfficientWeapon] })

const overcommittedState = () => {
  const state = createInitialState()
  state.inventory['prismatic-focus'] = 1
  state.inventory['ember-staff'] = 1
  state.equipment.weapon = 'prismatic-focus'
  state.artifactProgress['prismatic-focus'] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] }
  state.progress.spellRanks = { fireball: 7 }
  state.activities.autoCast.fireball = true
  state.activities.channeling.echoesAssigned = 5
  recalculateDerivedStats(state)
  return state
}

describe('Focus candidate loadout validation', () => {
  it('blocks swapping away from an overcommitted Prismatic Focus loadout', () => {
    const state = overcommittedState()
    expect(state.player.maxFocus).toBe(120)
    expect(selectUsedFocus(state)).toBe(120)

    const result = equipItemAction(state, 'ember-staff')

    expect(result).toMatchObject({ ok: false, reason: 'insufficient-focus-capacity', maxFocus: 100, usedFocus: 120, deficit: 20 })
    expect(state.equipment.weapon).toBe('prismatic-focus')
    expect(state.activities.channeling.echoesAssigned).toBe(5)
    expect(state.activities.autoCast.fireball).toBe(true)
    expect(state.notifications.at(-1)?.text).toContain('Free 20 Focus')
  })

  it('blocks unequipping Prismatic Focus while reservations exceed the candidate capacity', () => {
    const state = overcommittedState()

    const result = unequipItemAction(state, 'weapon')

    expect(result).toMatchObject({ ok: false, reason: 'insufficient-focus-capacity', maxFocus: 100, usedFocus: 120, deficit: 20 })
    expect(state.equipment.weapon).toBe('prismatic-focus')
  })

  it('allows the swap after the player frees enough Focus', () => {
    const state = overcommittedState()
    state.activities.channeling.echoesAssigned = 3
    expect(selectUsedFocus(state)).toBe(100)

    const result = equipItemAction(state, 'ember-staff')

    expect(result).toMatchObject({ ok: true, position: 'weapon' })
    expect(state.equipment.weapon).toBe('ember-staff')
  })

  it('uses candidate Focus Efficiency when recalculating Auto-Cast reservations', () => {
    ITEMS[focusEfficientWeapon] = { ...ITEMS['ember-staff'], id: focusEfficientWeapon, name: 'Focus Efficient Test Weapon', stats: { focusEfficiencyPct: 0.5 } }
    const state = createInitialState()
    state.inventory[focusEfficientWeapon] = 1
    state.player.baseMaxFocus = 70
    state.progress.spellRanks = { fireball: 8 }
    state.activities.autoCast.fireball = true
    recalculateDerivedStats(state)
    expect(selectUsedFocus(state)).toBe(80)

    const candidateEquipment = { ...state.equipment, weapon: focusEfficientWeapon }
    const validation = validateFocusForEquipment(state, candidateEquipment)
    const preview = getEquipmentPreview(state, focusEfficientWeapon)

    expect(validation).toEqual({ valid: true, maxFocus: 70, usedFocus: 40, deficit: 0 })
    expect(preview.compatible).toBe(true)
    expect(preview.focusValidation).toEqual(validation)
  })
})
