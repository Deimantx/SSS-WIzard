import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearLootReveals, enqueueCombatLootReveal, getLootReveals, getVisibleLootReveals, MAX_QUEUED_LOOT_REVEALS, MAX_VISIBLE_LOOT_REVEALS } from './lootRevealStore'

describe('Loot Reveal store', () => {
  afterEach(() => { vi.useRealTimers(); clearLootReveals() })

  it('batches one combat result and retains discovery through coalescing', () => {
    enqueueCombatLootReveal({ sourceLabel: 'Whispering Woods', sourceDetail: 'Grove Sentinel', items: [{ itemId: 'life-essence', quantity: 2, isNewDiscovery: true }, { itemId: 'wisp-essence', quantity: 1, isNewDiscovery: false }], now: 1000 })
    enqueueCombatLootReveal({ sourceLabel: 'Whispering Woods', sourceDetail: 'Grove Sentinel', items: [{ itemId: 'life-essence', quantity: 3, isNewDiscovery: false }], now: 1500 })
    expect(getLootReveals()).toHaveLength(1)
    expect(getLootReveals()[0]?.items).toEqual(expect.arrayContaining([{ itemId: 'life-essence', quantity: 5, isNewDiscovery: true }, { itemId: 'wisp-essence', quantity: 1, isNewDiscovery: false }]))
  })

  it('keeps different source contexts separate and bounds the queue', () => {
    for (let index = 0; index < MAX_VISIBLE_LOOT_REVEALS + MAX_QUEUED_LOOT_REVEALS + 4; index += 1) enqueueCombatLootReveal({ sourceLabel: 'Dungeon', sourceDetail: `Monster ${index}`, items: [{ itemId: 'life-essence', quantity: 1, isNewDiscovery: false }], now: index * 2000 })
    expect(getLootReveals()).toHaveLength(MAX_VISIBLE_LOOT_REVEALS + MAX_QUEUED_LOOT_REVEALS)
    expect(getVisibleLootReveals()).toHaveLength(MAX_VISIBLE_LOOT_REVEALS)
    expect(getLootReveals()[0]?.sourceDetail).toBe('Monster 4')
  })
})
