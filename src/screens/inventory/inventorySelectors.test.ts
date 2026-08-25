import { describe, expect, it } from 'vitest'
import { getResearchXp } from '../../game/content/items/items'
import { makeInitialState } from '../../store/gameStore'
import { formatStat, friendlyStatLabel } from '../../components/ui/item/ItemTooltip'
import { inventorySummary, selectOwnedItemIds, selectVisibleItemIds } from './inventorySelectors'

describe('Inventory V3 selectors and display rules', () => {
  it('shows owned items only and summarizes visible quantity', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 12
    state.inventory['wisp-essence'] = 0

    const owned = selectOwnedItemIds(state.inventory)
    expect(owned).toContain('apprentice-wand')
    expect(owned).toContain('fire-fragment')
    expect(owned).not.toContain('wisp-essence')
    expect(inventorySummary(owned, state.inventory)).toMatchObject({ types: 2, total: 13 })
  })

  it('supports search, category, protected/equipped filtering, and quantity sorting', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 12
    state.inventory['water-fragment'] = 2
    state.inventory['ember-staff'] = 1
    state.protectedItems['fire-fragment'] = true

    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, 'fire', 'All', 'Name')).toEqual(['fire-fragment'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Elemental', 'Quantity')).toEqual(['fire-fragment', 'water-fragment'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Protected', 'Category')).toEqual(['fire-fragment', 'apprentice-wand'])
    expect(selectVisibleItemIds(state.inventory, state.protectedItems, state.equipment, '', 'Equipment', 'Name')).toEqual(['apprentice-wand', 'ember-staff'])
  })

  it('uses current research rewards and friendly equipment stat labels', () => {
    expect(getResearchXp('fire-fragment', 'fire')).toBe(12)
    expect(getResearchXp('fire-fragment', 'water')).toBe(8)
    expect(friendlyStatLabel('basicDamage')).toBe('Basic Attack Damage')
    expect(formatStat('fireSpellDamagePct', 0.2)).toBe('+20%')
    expect(formatStat('maxMana', 10)).toBe('+10')
  })
})
