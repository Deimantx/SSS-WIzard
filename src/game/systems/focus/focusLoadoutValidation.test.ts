import { afterEach, describe, expect, it } from 'vitest'
import { ITEMS } from '../../content/items/items'
import { recalculateDerivedStats, selectUsedFocus } from '../../engine'
import { getEquipmentPreview } from '../../presentation/equipment/equipmentReadModel'
import type { ItemId } from '../../types'
import { createInitialState } from '../../../store/initialState'
import { equipItemAction } from '../../../store/actions/equipmentActions'
import { validateFocusForEquipment } from './focusLoadoutValidation'

const focusCapacityWeapon = 'focus-capacity-test-weapon' as ItemId
const focusEfficientWeapon = 'focus-efficient-test-weapon' as ItemId

afterEach(() => {
  delete ITEMS[focusCapacityWeapon]
  delete ITEMS[focusEfficientWeapon]
})

const overcommittedState = () => {
  ITEMS[focusCapacityWeapon] = { ...ITEMS['ember-staff'], id: focusCapacityWeapon, name: 'Focus Capacity Test Weapon', stats: { maxFocus: 10 } }
  const state = createInitialState()
  state.inventory[focusCapacityWeapon] = 1
  state.inventory['tideglass-wand'] = 1
  state.equipment.weapon = focusCapacityWeapon
  state.progress.spellRanks = { 'fire-bolt': 7 }
  state.activities.autoCast['fire-bolt'] = true
  state.combat.active = true
  state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'fire-bolt:1' }
  state.activities.channeling.echoesAssigned = 5
  recalculateDerivedStats(state)
  return state
}

describe('Focus candidate loadout validation', () => {
  it('blocks swapping away from an overcommitted Focus-capacity loadout', () => {
    const state = overcommittedState()
    expect(state.player.maxFocus).toBe(110)
    expect(selectUsedFocus(state)).toBe(120)

    const result = equipItemAction(state, 'tideglass-wand')

    expect(result).toMatchObject({ ok: false, reason: 'insufficient-focus-capacity', maxFocus: 100, usedFocus: 120, deficit: 20 })
    expect(state.equipment.weapon).toBe(focusCapacityWeapon)
    expect(state.activities.channeling.echoesAssigned).toBe(5)
    expect(state.activities.autoCast['fire-bolt']).toBe(true)
    expect(state.notifications[state.notifications.length - 1]?.text).toContain('Free 20 Focus')
  })

  it('allows the swap after the player frees enough Focus', () => {
    const state = overcommittedState()
    state.activities.channeling.echoesAssigned = 3
    expect(selectUsedFocus(state)).toBe(100)

    const result = equipItemAction(state, 'tideglass-wand')

    expect(result).toMatchObject({ ok: true, position: 'weapon' })
    expect(state.equipment.weapon).toBe('tideglass-wand')
  })

  it('uses candidate Focus Efficiency when recalculating Auto-Cast reservations', () => {
    ITEMS[focusEfficientWeapon] = { ...ITEMS['ember-staff'], id: focusEfficientWeapon, name: 'Focus Efficient Test Weapon', stats: { focusEfficiencyPct: 0.5 } }
    const state = createInitialState()
    state.inventory[focusEfficientWeapon] = 1
    state.player.baseMaxFocus = 70
    state.progress.spellRanks = { 'fire-bolt': 8 }
    state.activities.autoCast['fire-bolt'] = true
    state.combat.active = true
    state.combat.activeSpellLoadout = { presetId: null, presetName: 'Test', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'fire-bolt:1' }
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
