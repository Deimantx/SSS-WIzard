import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { formatArcaneCoreModifierValue, formatArcaneCoreNodeEffect, getArcaneCoreNodePosition } from './arcaneCorePresentation'

describe('Arcane Core V3 presentation', () => {
  it('positions every node on its authored Ring angle', () => {
    for (const node of ARCANE_CORE_NODES) { const position = getArcaneCoreNodePosition(node); expect(position.left).toBeGreaterThan(0); expect(position.top).toBeGreaterThan(0) }
  })
  it('formats modifiers and ranked effects in player-readable units', () => {
    expect(formatArcaneCoreModifierValue('critChance', 0.002)).toBe('+0.20%')
    expect(formatArcaneCoreModifierValue('spellPower', 1)).toBe('+1')
    const node = ARCANE_CORE_NODES.find((candidate) => candidate.id === 'power-r1-critical-insight')!
    expect(formatArcaneCoreNodeEffect(node, 1)).toContain('+0.50%')
    expect(formatArcaneCoreNodeEffect(node, 5)).toContain('+2.50%')
  })
})
