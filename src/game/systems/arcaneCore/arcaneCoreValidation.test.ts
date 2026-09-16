import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_RANK_COSTS } from '../../content/arcaneCore/arcaneCoreBalance'
import { validateArcaneCoreCatalog } from './arcaneCoreValidation'

describe('Arcane Core catalog', () => {
  it('contains the four authored branches and the complete prototype graph', () => {
    expect(validateArcaneCoreCatalog()).toEqual([])
    expect(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).toEqual(['power', 'vitality', 'focus', 'control'])
    expect(ARCANE_CORE_NODES).toHaveLength(256)
    expect(ARCANE_CORE_NODES.every((node) => node.maxRank === 5)).toBe(true)
    expect(ARCANE_CORE_NODES.every((node) => node.prerequisites.length === 0 || node.prerequisiteMode === 'any' || node.prerequisiteMode === 'all')).toBe(true)
    expect(ARCANE_CORE_RANK_COSTS).toEqual([25, 35, 50, 70, 100])
  })
})
