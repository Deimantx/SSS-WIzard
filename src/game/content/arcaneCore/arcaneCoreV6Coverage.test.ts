import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_V6_CATALOG } from './arcaneCoreV6Catalog'
import { getArcaneCoreV6CatalogEntries, getArcaneCoreV6ImplementationDefinition, validateArcaneCoreV6ImplementationCoverage } from './arcaneCoreV6Runtime'

describe('Arcane Core V6 implementation coverage', () => {
  it('recognizes every catalog entry with a unique stable mechanic identity', () => {
    const entries = getArcaneCoreV6CatalogEntries()
    expect(entries).toHaveLength(288)
    expect(new Set(entries.map((entry) => entry.mechanicId)).size).toBe(288)
    expect(validateArcaneCoreV6ImplementationCoverage()).toEqual([])
    expect(Object.keys(ARCANE_CORE_V6_CATALOG)).toEqual(['power', 'vitality', 'focus', 'control'])
  })

  it('keeps display labels separate from runtime identity for duplicate names', () => {
    const entries = getArcaneCoreV6CatalogEntries()
    const duplicateNames = [...new Set(entries.map((entry) => entry.name).filter((name) => entries.filter((entry) => entry.name === name).length > 1))]
    expect(duplicateNames.length).toBeGreaterThan(0)
    duplicateNames.forEach((name) => {
      const ids = entries.filter((entry) => entry.name === name).map((entry) => getArcaneCoreV6ImplementationDefinition(entry).mechanicId)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })
})
