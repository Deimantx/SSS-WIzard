import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES, ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { formatArcaneCoreModifierValue, formatArcaneCoreNodeEffect, getArcaneCoreConnectorSegments, getArcaneCoreGraphGeometry } from './arcaneCorePresentation'

describe('Arcane Core presentation', () => {
  it('contains every node and the virtual hub inside the computed graph bounds', () => {
    for (const branch of ARCANE_CORE_BRANCHES) {
      const geometry = getArcaneCoreGraphGeometry(branch)
      for (const node of branch.nodes) {
        expect(geometry.nodeLeft(node)).toBeGreaterThanOrEqual(0)
        expect(geometry.nodeTop(node)).toBeGreaterThanOrEqual(0)
        expect(geometry.nodeLeft(node) + 86).toBeLessThanOrEqual(geometry.width)
        expect(geometry.nodeTop(node) + 54).toBeLessThanOrEqual(geometry.height)
      }
      expect(geometry.hub.bottomY).toBeLessThanOrEqual(geometry.nodeTop(branch.nodes[0]))
    }
  })

  it('connects every starter to the virtual hub without missing node references', () => {
    for (const branch of ARCANE_CORE_BRANCHES) {
      const geometry = getArcaneCoreGraphGeometry(branch)
      const nodeIds = new Set(branch.nodes.map((node) => node.id))
      const connectors = getArcaneCoreConnectorSegments(branch, geometry)
      const starters = branch.nodes.filter((node) => node.prerequisites.length === 0)
      expect(connectors.filter((connector) => connector.virtual)).toHaveLength(starters.length)
      for (const connector of connectors) {
        expect(connector.targetId).toBeTruthy()
        expect(nodeIds.has(connector.targetId)).toBe(true)
        expect(connector.virtual ? connector.sourceId === branch.rootId : nodeIds.has(connector.sourceId)).toBe(true)
      }
    }
  })

  it('formats percent and flat modifiers in player-readable units', () => {
    expect(formatArcaneCoreModifierValue('critChance', 0.002)).toBe('+0.20%')
    expect(formatArcaneCoreModifierValue('critDamage', 0.01)).toBe('+1.00%')
    expect(formatArcaneCoreModifierValue('spellPower', 1)).toBe('+1')
    expect(formatArcaneCoreModifierValue('defense', 0.5)).toBe('+0.5')

    const percentNode = ARCANE_CORE_NODES.find((node) => node.stats?.critChance !== undefined)!
    expect(formatArcaneCoreNodeEffect(percentNode, 1)).toContain('+1.00%')
  })
})
