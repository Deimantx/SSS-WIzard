import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { getSpellBrowserEntries, getSpellCatalogTags } from './spellBrowserSelectors'
import { SPELL_CATALOG_PLACEHOLDERS } from './spellCatalogPlaceholders'
import { SPELLS } from '../../game/content/spells/spells'

const filters = (overrides: Partial<Parameters<typeof getSpellBrowserEntries>[1]> = {}) => ({ school: 'all' as const, search: '', showUnlockedOnly: false, type: 'All Types' as const, sort: 'Unlock Level' as const, ...overrides })

describe('spell browser selectors', () => {
  it('builds the 12 authored entries plus 12 UI-only future slots', () => {
    const state = createInitialState()
    const entries = getSpellBrowserEntries(state, filters())
    expect(entries).toHaveLength(24)
    expect(entries.filter((entry) => entry.kind === 'placeholder')).toHaveLength(SPELL_CATALOG_PLACEHOLDERS.length)
    expect(entries.filter((entry) => entry.kind === 'spell').every((entry) => entry.kind === 'spell' && !entry.unlocked)).toBe(true)
  })

  it('supports school, type, unlocked-only, search, and stable sort filters', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, fireball: 3, 'water-ward': 1 }
    expect(getSpellBrowserEntries(state, filters({ school: 'fire', showUnlockedOnly: true })).map((entry) => entry.id)).toEqual(['fire-bolt', 'fireball'])
    expect(getSpellBrowserEntries(state, filters({ type: 'Barrier' })).map((entry) => entry.id)).toEqual(['water-ward'])
    expect(getSpellBrowserEntries(state, filters({ search: 'reliable' })).map((entry) => entry.id)).toEqual(['fire-bolt'])
    expect(getSpellBrowserEntries(state, filters({ search: 'Fire Bolt' })).map((entry) => entry.id)).toEqual(['fire-bolt'])
    expect(getSpellBrowserEntries(createInitialState(), filters({ search: 'Fire Bolt' }))).toEqual([])
    const sorted = getSpellBrowserEntries(state, filters({ showUnlockedOnly: true, sort: 'Name' }))
    expect(sorted.map((entry) => entry.id)).toEqual(['fire-bolt', 'fireball', 'water-ward'])
  })

  it('derives browser tags from authored effects and status definitions', () => {
    expect(getSpellCatalogTags(SPELLS.ignite)).toEqual(['Damage', 'DoT'])
    expect(getSpellCatalogTags(SPELLS.frostbite)).toEqual(['Damage', 'Control'])
    expect(getSpellCatalogTags(SPELLS.stoneguard)).toEqual(['Barrier'])
    expect(getSpellCatalogTags(SPELLS.fortify)).toEqual(['Buff'])
  })
})
