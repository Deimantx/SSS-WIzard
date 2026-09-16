import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { ARCANE_CORE_MAX_LEVEL, ARCANE_CORE_NODE_COUNT, ARCANE_CORE_NODE_COUNT_PER_BRANCH } from '../../content/arcaneCore/arcaneCoreBalance'
import { validateArcaneCoreCatalog } from './arcaneCoreValidation'

describe('Arcane Core V2 catalog', () => {
  it('contains four authored branches and 4 lanes of 10 sequential nodes each', () => {
    expect(validateArcaneCoreCatalog()).toEqual([])
    expect(ARCANE_CORE_BRANCHES.map((branch) => branch.id)).toEqual(['power', 'vitality', 'focus', 'control'])
    expect(ARCANE_CORE_NODES).toHaveLength(ARCANE_CORE_NODE_COUNT)
    expect(ARCANE_CORE_NODES.every((node) => node.cost === 1)).toBe(true)
    expect(ARCANE_CORE_NODES.every((node) => node.nodeType === 'minor' || node.nodeType === 'perk' || node.nodeType === 'major')).toBe(true)
    expect(ARCANE_CORE_BRANCHES.every((branch) => branch.nodes.length === ARCANE_CORE_NODE_COUNT_PER_BRANCH)).toBe(true)
    expect(ARCANE_CORE_MAX_LEVEL).toBe(161)
    for (const branch of ARCANE_CORE_BRANCHES) {
      const lanes = new Map<string, typeof branch.nodes>()
      for (const node of branch.nodes) lanes.set(node.laneId, [...(lanes.get(node.laneId) ?? []), node])
      expect(lanes.size).toBe(4)
      for (const nodes of lanes.values()) {
        expect(nodes).toHaveLength(10)
        for (let index = 1; index < nodes.length; index += 1) expect(nodes[index]?.prerequisites).toEqual([nodes[index - 1]?.id])
      }
    }
  })
})
