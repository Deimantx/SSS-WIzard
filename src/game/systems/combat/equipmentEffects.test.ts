import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { ITEMS, validateItemDefinitions } from '../../content/items/items'
import { MONSTERS } from '../../content/monsters'
import { RECIPES, validateRecipeDefinitions } from '../../content/recipes/recipes'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { getEquipmentStats } from '../../core/equipment/equipmentStats'
import { getCooldownRecoveryMultiplier } from './combatStats'

describe('current Equipment content', () => {
  it('contains only Artifact Equipment in the three canonical slots', () => {
    const equipment = Object.values(ITEMS).filter((item) => item.kind === 'equipment')
    expect(equipment).toHaveLength(12)
    expect(equipment.every((item) => item.equipmentSlot === 'weapon' || item.equipmentSlot === 'armor' || item.equipmentSlot === 'helmet')).toBe(true)
    expect(validateItemDefinitions()).toEqual([])
    expect(validateRecipeDefinitions()).toEqual([])
  })

  it('feeds purchased Arcane Core nodes into the shared equipment stat aggregation', () => {
    const state = createInitialState()
    state.equipment.weapon = 'ember-staff'
    state.arcaneCore.nodes['power-a1'] = { purchased: true }
    state.arcaneCore.nodes['control-a1'] = { purchased: true }

    expect(getEquipmentStats(state)).toMatchObject({ spellPower: 19 })
    expect(getCooldownRecoveryMultiplier(state, 'player')).toBeCloseTo(1.01)
  })

  it('keeps all monster loot limited to material items', () => {
    expect(Object.values(MONSTERS).every((monster) => monster.loot.every((drop) => ITEMS[drop.itemId]?.kind !== 'equipment'))).toBe(true)
  })

  it('keeps boss loot on the legitimate material path without finished Equipment', () => {
    const state = createInitialState()
    const drops: string[] = []
    resolveMonsterLoot(state, 'forest-heart', (itemId) => drops.push(itemId))

    expect(drops).toEqual(expect.arrayContaining(['artifact-essence', 'life-essence']))
    expect(drops.some((itemId) => ITEMS[itemId as keyof typeof ITEMS]?.kind === 'equipment')).toBe(false)
    expect(state.inventory['artifact-essence']).toBeGreaterThan(0)
  })

  it('does not retain removed accessory recipes', () => {
    const recipes = RECIPES as Record<string, unknown>
    expect(recipes['windthread-charm']).toBeUndefined()
    expect(recipes['heartseed-necklace']).toBeUndefined()
    expect(recipes['predator-hide-mantle']).toBeUndefined()
  })
})
