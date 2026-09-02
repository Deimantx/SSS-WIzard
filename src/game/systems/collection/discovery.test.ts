import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { resolveMonsterLoot } from '../loot/lootResolution'
import { completeTransmutationCycle } from '../transmutation/transmutationEngine'
import { discoverMonster } from './discovery'
import { grantItem } from '../inventory/itemAcquisition'

describe('archive discovery', () => {
  it('records a monster on encounter and remains idempotent', () => {
    const state = createInitialState()
    discoverMonster(state, 'forest-wisp')
    discoverMonster(state, 'forest-wisp')
    expect(state.progress.discoveredMonsters).toEqual(['forest-wisp'])
  })

  it('records guaranteed loot through the same transaction as the inventory grant', () => {
    const state = createInitialState()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    resolveMonsterLoot(state, 'forest-wisp')
    expect(state.inventory['wisp-essence']).toBe(1)
    expect(state.inventory['life-essence']).toBe(1)
    expect(state.progress.discoveredItems).toEqual(expect.arrayContaining(['wisp-essence', 'life-essence']))
    vi.restoreAllMocks()
  })

  it('keeps discovery after the item is consumed', () => {
    const state = createInitialState()
    grantItem(state, 'fire-fragment', 1)
    state.inventory['fire-fragment'] = 0
    expect(state.progress.discoveredItems).toContain('fire-fragment')
  })

  it('discovers successful Transmutation output', () => {
    const state = createInitialState()
    for (const itemId of ['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'] as const) state.inventory[itemId] = 2
    state.inventory['life-essence'] = 10
    expect(completeTransmutationCycle(state, { id: 'prismatic-fragment', name: 'Prismatic Fragment', output: { itemId: 'prismatic-fragment', quantity: 1 }, category: 'material', baseDurationMs: 1, manaCost: 0, ingredients: [{ itemId: 'fire-fragment', quantity: 2 }, { itemId: 'water-fragment', quantity: 2 }, { itemId: 'earth-fragment', quantity: 2 }, { itemId: 'air-fragment', quantity: 2 }, { itemId: 'life-essence', quantity: 10 }], unlock: { type: 'always' } }, { mode: 'live' })).toBe(true)
    expect(state.inventory['prismatic-fragment']).toBe(1)
    expect(state.progress.discoveredItems).toContain('prismatic-fragment')
  })
})
