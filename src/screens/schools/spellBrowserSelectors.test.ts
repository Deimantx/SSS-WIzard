import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { getSpellBrowserEntries, getSpellCatalogTags } from './spellBrowserSelectors'
import { SPELL_CATALOG_PLACEHOLDERS } from './spellCatalogPlaceholders'
import { SPELLS } from '../../game/content/spells/spells'

const filters = (overrides: Partial<Parameters<typeof getSpellBrowserEntries>[1]> = {}) => ({ school: 'all' as const, search: '', showUnlockedOnly: false, type: 'All Types' as const, sort: 'Unlock Level' as const, ...overrides })

describe('spell browser selectors', () => {
  it('builds the 32 authored entries plus UI-only future slots', () => {
    const state = createInitialState()
    const entries = getSpellBrowserEntries(state, filters())
    expect(entries).toHaveLength(32 + SPELL_CATALOG_PLACEHOLDERS.length)
    expect(entries.filter((entry) => entry.kind === 'placeholder')).toHaveLength(SPELL_CATALOG_PLACEHOLDERS.length)
    expect(entries.filter((entry) => entry.kind === 'spell').every((entry) => entry.kind === 'spell' && !entry.unlocked)).toBe(true)
  })

  it('supports school, type, unlocked-only, search, and stable sort filters', () => {
    const state = createInitialState()
    state.progress.spellRanks = { 'fire-bolt': 1, 'flame-burst': 3, 'earthen-barrier': 1 }
    expect(getSpellBrowserEntries(state, filters({ school: 'fire', showUnlockedOnly: true })).map((entry) => entry.id)).toEqual(['fire-bolt', 'flame-burst'])
    expect(getSpellBrowserEntries(state, filters({ type: 'Barrier' })).map((entry) => entry.id)).toEqual(['earthen-barrier'])
    expect(getSpellBrowserEntries(state, filters({ search: 'quick' })).map((entry) => entry.id)).toEqual(['fire-bolt'])
    expect(getSpellBrowserEntries(state, filters({ search: 'Fire Bolt' })).map((entry) => entry.id)).toEqual(['fire-bolt'])
    expect(getSpellBrowserEntries(createInitialState(), filters({ search: 'Fire Bolt' }))).toEqual([])
    const sorted = getSpellBrowserEntries(state, filters({ showUnlockedOnly: true, sort: 'Name' }))
    expect(sorted.map((entry) => entry.id)).toEqual(['earthen-barrier', 'fire-bolt', 'flame-burst'])
  })

  it('derives browser tags from authored effects and status definitions', () => {
    expect(getSpellCatalogTags(SPELLS['searing-touch'])).toEqual(['Damage', 'DoT'])
    expect(getSpellCatalogTags(SPELLS['frost-touch'])).toEqual(['Damage', 'Control'])
    expect(getSpellCatalogTags(SPELLS['earthen-barrier'])).toEqual(['Barrier'])
    expect(getSpellCatalogTags(SPELLS.harden)).toEqual(['Buff'])
  })
})
