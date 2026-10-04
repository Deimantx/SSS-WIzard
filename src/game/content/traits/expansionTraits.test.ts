import { describe, expect, it } from 'vitest'
import { TRAIT_DEFINITIONS } from './traits'

describe('Combat expansion phase Traits', () => {
  it('registers every phase Trait directly in the Trait registry', () => {
    const ids = [
      'moonwake-leviathan-phase', 'furnace-maw-phase', 'tempest-sovereign-phase',
      'unmade-magister-phase', 'pyrehold-castellan-phase', 'drowned-regent-phase',
      'steam-tyrant-phase', 'sepulcher-flamekeeper-phase', 'deep-bell-saint-phase',
      'abbot-ninth-gale-phase', 'closed-index-phase',
    ] as const
    const expansionIds = new Set<string>(ids)
    for (const id of ids) expect(TRAIT_DEFINITIONS[id]).toBeDefined()
    expect(Object.keys(TRAIT_DEFINITIONS).filter((id) => expansionIds.has(id))).toHaveLength(11)
  })
})
