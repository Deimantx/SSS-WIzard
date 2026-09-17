import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_NODE_COUNT, ARCANE_CORE_NODE_COUNT_PER_BRANCH } from '../../content/arcaneCore/arcaneCoreBalance'
import { ARCANE_CORE_RING_INDICES } from '../../content/arcaneCore/arcaneCoreRings'
import { validateArcaneCoreCatalog } from './arcaneCoreValidation'

describe('Arcane Core V4 catalog', () => {
  it('contains four Cores with eight Rings of eight standards and one Major', () => {
    expect(validateArcaneCoreCatalog()).toEqual([])
    expect(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).toEqual(['power', 'vitality', 'focus', 'control'])
    expect(ARCANE_CORE_NODES).toHaveLength(ARCANE_CORE_NODE_COUNT)
    expect(ARCANE_CORE_BRANCHES.every((branch) => branch.nodes.length === ARCANE_CORE_NODE_COUNT_PER_BRANCH)).toBe(true)
    for (const branch of ARCANE_CORE_BRANCHES) for (const ring of ARCANE_CORE_RING_INDICES) {
      const nodes = branch.nodes.filter((node) => node.ring === ring)
      expect(nodes).toHaveLength(9)
      expect(nodes.filter((node) => node.nodeType === 'major')).toHaveLength(1)
      expect(nodes.filter((node) => node.nodeType !== 'major')).toHaveLength(8)
    }
    expect(ARCANE_CORE_MAX_LEVEL).toBe(1377)
  })
})
