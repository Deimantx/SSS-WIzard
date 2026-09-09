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
  it('equips a Weapon into the single Weapon slot and keeps the owned copies', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['prismatic-focus'] = 1
    state.equipment.weapon = 'ember-staff'
    const result = equipItemAction(state, 'prismatic-focus')
    expect(result.ok).toBe(true)
    expect(state.equipment.weapon).toBe('prismatic-focus')
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.notifications).toHaveLength(1)
    expect(state.notifications[0].text).toBe('Prismatic Focus equipped')
  })

  it('previews the same final values as the Weapon equip action', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['prismatic-focus'] = 1
    state.equipment.weapon = 'ember-staff'
    const preview = getEquipmentPreview(state, 'prismatic-focus')
    expect(preview.compatible).toBe(true)
    expect('removedOffhand' in preview).toBe(false)
    equipItemAction(state, 'prismatic-focus')
    expect(getEquipmentStatSnapshot(state, state.equipment)).toEqual(preview.preview)
  })

  it('previews the flat Spell Power contribution of a new weapon', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    const preview = getEquipmentPreview(state, 'ember-staff')
    expect(preview.current.spellPower).toBe(BALANCE.player.baseSpellPower)
    expect(preview.preview?.spellPower).toBe(BALANCE.player.baseSpellPower + 16)
    expect(preview.impact.spellPower).toBe(16)
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

  it('uses Ring 1 then Ring 2 and reserves each equipped Ring safely', () => {
    ITEMS[testRingId] = { id: testRingId, name: 'Test Arcane Ring', description: 'Test ring', icon: '◌', color: '#fff', kind: 'equipment', category: 'equipment', inventoryCategory: 'equipment', source: 'Test', sellValue: 1, canDestroy: true, equipmentSlot: 'ring', stats: {} } satisfies ItemDefinition
    const state = createInitialState()
    state.inventory[testRingId] = 1
    state.inventory['wispbound-ring'] = 1
    expect(equipItemAction(state, testRingId)).toMatchObject({ ok: true, position: 'ring1' })
    expect(equipItemAction(state, 'wispbound-ring', 'ring2')).toMatchObject({ ok: true, position: 'ring2' })
    expect(getEquippedReservedQuantity(state, testRingId)).toBe(1)
    expect(getEquippedReservedQuantity(state, 'wispbound-ring')).toBe(1)
    expect(equipItemAction(state, testRingId, 'ring2')).toMatchObject({ ok: false, reason: 'duplicate-ring' })
  })
})
