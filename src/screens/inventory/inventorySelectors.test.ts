import { describe, expect, it } from 'vitest'
import { getResearchXp, ITEMS } from '../../game/content/items/items'
import { makeInitialState, recordRecentAcquisition, type RecentAcquisition } from '../../store/gameStore'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'
import { INVENTORY_FILTERS, MATERIAL_SUBCATEGORIES, inventorySummary, selectOwnedItemIds, selectVisibleItemIds } from './inventorySelectors'
import { getInventoryCategory, getItemUses, getInventorySearchText } from '../../game/content/items/inventoryMetadata'
import { getEquipmentComparison } from './inventoryEquipmentComparison'

describe('Inventory V3 selectors and display rules', () => {
  it('shows owned items only and summarizes visible quantity', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 12
    state.inventory['wisp-essence'] = 0

    const owned = selectOwnedItemIds(state.inventory)
    expect(owned).toContain('fire-fragment')
    expect(owned).not.toContain('wisp-essence')
    expect(inventorySummary(owned, state.inventory)).toMatchObject({ types: 1, total: 12 })
  })

  it('supports search, category, protected/equipped filtering, and quantity sorting', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 12
    state.inventory['water-fragment'] = 2
    state.inventory['ember-staff'] = 1
    state.protectedItems['fire-fragment'] = true

    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, 'fire', 'All', 'Name')).toEqual(['ember-staff', 'fire-fragment'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Elemental', 'Quantity')).toEqual(['fire-fragment', 'water-fragment'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Protected', 'Category')).toEqual(['fire-fragment'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Equipment', 'Name')).toEqual(['ember-staff'])
  })

  it('uses current research rewards and friendly equipment stat labels', () => {
    expect(getResearchXp('fire-fragment', 'fire')).toBe(12)
    expect(getResearchXp('fire-fragment', 'water')).toBe(8)
    expect(friendlyStatLabel('basicDamage')).toBe('Basic Attack Damage')
    expect(friendlyStatLabel('spellPower')).toBe('Spell Power')
    expect(formatStat('critChance', 0.2)).toBe('+20%')
    expect(formatStat('maxMana', 10)).toBe('+10')
  })

  it('uses the Vault category model and material subcategories', () => {
    expect(INVENTORY_FILTERS).toEqual(['All', 'Materials', 'Loot', 'Equipment', 'Special'])
    expect(MATERIAL_SUBCATEGORIES).toEqual(['All Materials', 'Elemental', 'Creature', 'Ore', 'Refined', 'Arcane'])
    expect(getInventoryCategory('fire-fragment')).toBe('material')
    expect(getInventoryCategory('life-essence')).toBe('material')
    expect(getInventoryCategory('heartseed')).toBe('loot')
    expect(getInventoryCategory('ember-staff')).toBe('equipment')
  })

  it('filters owned Materials by subtype and records transient latest gains', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 5
    state.inventory['wisp-essence'] = 2
    state.inventory.heartseed = 1
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Materials', 'Category', 'Elemental')).toEqual(['fire-fragment'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Loot', 'Category')).toEqual(['heartseed'])
    const runtime = state as typeof state & { recentAcquisitions?: RecentAcquisition[] }
    recordRecentAcquisition(runtime, 'fire-fragment', 5)
    expect(runtime.recentAcquisitions).toMatchObject([{ itemId: 'fire-fragment', amount: 5, isNew: true }])
  })

  it('searches authored metadata and derives real uses', () => {
    expect(getInventorySearchText('ember-staff')).toContain('fire')
    expect(getInventorySearchText('fire-fragment')).toContain('research')
    expect(getItemUses('fire-fragment').map((use) => use.destination)).toEqual(expect.arrayContaining(['tower-transmutation', 'tower-channeling', 'tower-research', 'guild']))
  })

  it('links Focus Capacity only to Prismatic Fragment', () => {
    const prismaticUses = getItemUses('prismatic-fragment')
    const lifeEssenceUses = getItemUses('life-essence')
    expect(prismaticUses.some((use) => use.label === 'Focus Capacity' && use.destination === 'tower-focus')).toBe(true)
    expect(lifeEssenceUses.some((use) => use.label === 'Focus Capacity')).toBe(false)
  })

  it('returns same-slot equipment comparison deltas', () => {
    expect(getEquipmentComparison(ITEMS['ember-staff'], ITEMS['wispwood-wand']).find((row) => row.key === 'basicDamage')).toMatchObject({ selectedValue: '+4', equippedValue: '+2', delta: '+2', direction: 'positive' })
  })
})
