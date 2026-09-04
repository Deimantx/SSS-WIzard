import { afterEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../initialState'
import { ITEMS } from '../../game/content/items/items'
import { getEquipmentStatSnapshot, getEquipmentPreview } from '../../game/presentation/equipment/equipmentReadModel'
import type { ItemDefinition, ItemId } from '../../game/types'
import { getEquippedReservedQuantity } from './inventoryActions'
import { equipItemAction } from './equipmentActions'
import { BALANCE } from '../../game/core/balance/balance'

const testRingId = 'test-arcane-ring' as ItemId
const testDefenseId = 'test-defense-robe' as ItemId
afterEach(() => { delete ITEMS[testRingId]; delete ITEMS[testDefenseId] })

describe('equipment actions', () => {
  it('automatically removes an Offhand when equipping a 2H weapon', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['tide-focus'] = 1
    state.equipment.offhand = 'tide-focus'
    const result = equipItemAction(state, 'ember-staff')
    expect(result.ok).toBe(true)
    expect(state.equipment.weapon).toBe('ember-staff')
    expect(state.equipment.offhand).toBeNull()
    expect(state.inventory['tide-focus']).toBe(1)
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].text).toBe('Ember Staff equipped. Tide Focus was unequipped.')
  })

  it('blocks an Offhand while a 2H weapon is active', () => {
    const state = createInitialState()
    state.inventory['tide-focus'] = 1
    state.equipment.weapon = 'ember-staff'
    const result = equipItemAction(state, 'tide-focus')
    expect(result).toMatchObject({ ok: false, reason: 'incompatible' })
    expect(state.equipment.offhand).toBeNull()
    expect(state.notifications[0].text).toBe('Requires a one-handed Weapon.')
  })

  it('previews the same final values that a 2H equip produces', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['tide-focus'] = 1
    state.equipment.offhand = 'tide-focus'
    const preview = getEquipmentPreview(state, 'ember-staff')
    expect(preview.compatible).toBe(true)
    expect(preview.removedOffhand).toBe('tide-focus')
    equipItemAction(state, 'ember-staff')
    expect(getEquipmentStatSnapshot(state, state.equipment)).toEqual(preview.preview)
  })

  it('previews the flat Spell Power contribution of a new weapon', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    const preview = getEquipmentPreview(state, 'ember-staff')
    expect(preview.current.spellPower).toBe(BALANCE.player.baseSpellPower)
    expect(preview.preview?.spellPower).toBe(BALANCE.player.baseSpellPower + 20)
    expect(preview.impact.spellPower).toBe(20)
  })

  it('previews the derived Defense damage reduction change', () => {
    ITEMS[testDefenseId] = { id: testDefenseId, name: 'Test Defense Robe', description: 'Test armor', icon: '▤', color: '#fff', kind: 'equipment', category: 'equipment', inventoryCategory: 'equipment', source: 'Test', sellValue: 1, canDestroy: true, equipmentSlot: 'armor', stats: { defense: 100 } } satisfies ItemDefinition
    const state = createInitialState()
    state.inventory[testDefenseId] = 1
    const preview = getEquipmentPreview(state, testDefenseId)
    const currentDefenseReduction = BALANCE.player.baseDefense / (BALANCE.player.baseDefense + 100)
    const previewDefenseReduction = (BALANCE.player.baseDefense + 100) / (BALANCE.player.baseDefense + 100 + 100)
    expect(preview.current.damageReduction).toBeCloseTo(currentDefenseReduction)
    expect(preview.preview?.damageReduction).toBeCloseTo(previewDefenseReduction)
    expect(preview.impact.damageReduction).toBeCloseTo(previewDefenseReduction - currentDefenseReduction)
  })

  it('uses Ring 1 then Ring 2 and reserves duplicate copies safely', () => {
    ITEMS[testRingId] = { id: testRingId, name: 'Test Arcane Ring', description: 'Test ring', icon: '◌', color: '#fff', kind: 'equipment', category: 'equipment', inventoryCategory: 'equipment', source: 'Test', sellValue: 1, canDestroy: true, equipmentSlot: 'ring', stats: {} } satisfies ItemDefinition
    const state = createInitialState()
    state.inventory[testRingId] = 2
    expect(equipItemAction(state, testRingId)).toMatchObject({ ok: true, position: 'ring1' })
    expect(equipItemAction(state, testRingId)).toMatchObject({ ok: true, position: 'ring2' })
    expect(getEquippedReservedQuantity(state, testRingId)).toBe(2)
    state.inventory[testRingId] = 1
    expect(equipItemAction(state, testRingId, 'ring1')).toMatchObject({ ok: false, reason: 'insufficient-copies' })
    expect(equipItemAction(state, testRingId, 'ring2')).toMatchObject({ ok: false, reason: 'insufficient-copies' })
  })
})
