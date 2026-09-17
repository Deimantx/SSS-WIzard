import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_NODES } from '../../content/arcaneCore/arcaneCoreBranches'
import { formatArcaneCoreModifierValue, formatArcaneCoreNodeEffect, getArcaneCoreNodeEffectTexts, getArcaneCoreNodePosition } from './arcaneCorePresentation'

describe('Arcane Core V4 presentation', () => {
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
  it('formats exact ranked rules and Major inactive state', () => {
    const feedback = ARCANE_CORE_NODES.find((candidate) => candidate.id === 'power-r2-critical-feedback')!
    expect(getArcaneCoreNodeEffectTexts(feedback, 3)).toContain('Reduce Spell cooldowns by 100 ms · Internal Cooldown: 500 ms')

    const pressure = ARCANE_CORE_NODES.find((candidate) => candidate.id === 'control-r1-control-pressure')!
    expect(getArcaneCoreNodeEffectTexts(pressure, 5)).toContain('Delay enemy current action by 100 ms · Internal Cooldown: 1 sec')

    const lock = ARCANE_CORE_NODES.find((candidate) => candidate.id === 'control-r4-arcane-lock')!
    expect(getArcaneCoreNodeEffectTexts(lock, 0)).toEqual(['Inactive'])
    expect(getArcaneCoreNodeEffectTexts(lock, 1)).toEqual(expect.arrayContaining(['Damage Taken +10.00%', 'Delay enemy current action by 250 ms · Internal Cooldown: 5 sec']))
  })
})
