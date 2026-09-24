import { afterEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { ITEMS } from '../../game/content/items/items'
import { getEquipmentStatSnapshot, getEquipmentPreview } from '../../game/presentation/equipment/equipmentReadModel'
import type { ItemDefinition, ItemId } from '../../game/types'
import { getEquippedReservedQuantity } from './inventoryActions'
import { equipItemAction } from './equipmentActions'
import { BALANCE } from '../../game/core/balance/balance'
import { getDefenseReductionFromRating } from '../../game/systems/combat/combatStats'

const testWeaponId = 'test-arcane-weapon' as ItemId
const testDefenseId = 'test-defense-robe' as ItemId
afterEach(() => { delete ITEMS[testWeaponId]; delete ITEMS[testDefenseId] })

describe('equipment actions', () => {
  it('equips a Weapon into the single Weapon slot and keeps the owned copies', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['tideglass-wand'] = 1
    state.equipment.weapon = 'ember-staff'
    const result = equipItemAction(state, 'tideglass-wand')
    expect(result.ok).toBe(true)
    expect(state.equipment.weapon).toBe('tideglass-wand')
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].text).toBe('Tideglass Wand equipped')
  })

  it('previews the same final values as the Weapon equip action', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['tideglass-wand'] = 1
    state.equipment.weapon = 'ember-staff'
    const preview = getEquipmentPreview(state, 'tideglass-wand')
    expect(preview.compatible).toBe(true)
    expect('removedOffhand' in preview).toBe(false)
    equipItemAction(state, 'tideglass-wand')
    expect(getEquipmentStatSnapshot(state, state.equipment)).toEqual(preview.preview)
  })

  it('previews the flat Spell Power contribution of a new weapon', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    const preview = getEquipmentPreview(state, 'ember-staff')
    expect(preview.current.spellPower).toBe(BALANCE.player.baseSpellPower)
    expect(preview.preview?.spellPower).toBe(BALANCE.player.baseSpellPower + 15)
    expect(preview.impact.spellPower).toBe(15)
  })

  it('previews the derived Defense damage reduction change', () => {
    ITEMS[testDefenseId] = { id: testDefenseId, name: 'Test Defense Robe', description: 'Test armor', icon: 'â–¤', color: '#fff', kind: 'equipment', category: 'equipment', inventoryCategory: 'equipment', source: 'Test', sellValue: 1, canDestroy: true, equipmentSlot: 'armor', stats: { defense: 100 } } satisfies ItemDefinition
    const state = createInitialState()
    state.inventory[testDefenseId] = 1
    const preview = getEquipmentPreview(state, testDefenseId)
    const currentDefenseReduction = getDefenseReductionFromRating(BALANCE.player.baseDefense)
    const previewDefenseReduction = getDefenseReductionFromRating(BALANCE.player.baseDefense + 100)
    expect(preview.current.damageReduction).toBeCloseTo(currentDefenseReduction)
    expect(preview.preview?.damageReduction).toBeCloseTo(previewDefenseReduction)
    expect(preview.impact.damageReduction).toBeCloseTo(previewDefenseReduction - currentDefenseReduction)
  })

  it('keeps the single Weapon slot and its reservation safe', () => {
    ITEMS[testWeaponId] = { id: testWeaponId, name: 'Test Arcane Weapon', description: 'Test weapon', icon: 'â—Œ', color: '#fff', kind: 'equipment', category: 'equipment', inventoryCategory: 'equipment', source: 'Test', sellValue: 1, canDestroy: true, equipmentSlot: 'weapon', stats: {} } satisfies ItemDefinition
    const state = createInitialState()
    state.inventory[testWeaponId] = 1
    state.inventory['tideglass-wand'] = 1
    expect(equipItemAction(state, testWeaponId)).toMatchObject({ ok: true, position: 'weapon' })
    expect(getEquippedReservedQuantity(state, testWeaponId)).toBe(1)
    expect(equipItemAction(state, 'tideglass-wand')).toMatchObject({ ok: true, position: 'weapon' })
    expect(getEquippedReservedQuantity(state, 'tideglass-wand')).toBe(1)
    expect(Object.keys(state.equipment)).toEqual(['weapon', 'armor', 'head'])
  })
})
