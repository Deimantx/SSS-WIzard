import { describe, expect, it } from 'vitest'
import { formatCombatCondition, formatCombatEffect, formatCombatRule, formatDuration, formatEquipmentEffectSummary, formatPercent } from './balanceFormatters'
import type { ItemDefinition } from '../../types'

describe('balance presentation formatters', () => {
  it('uses readable time and percentage units', () => {
    expect(formatDuration(1400)).toBe('1.4 s')
    expect(formatDuration(120000)).toBe('2 min')
    expect(formatPercent(0.025)).toBe('2.5%')
  })

  it('turns combat conditions and effects into designer language', () => {
    expect(formatCombatCondition({ type: 'self-hp-below-percent', percent: 30 })).toBe("the caster's Health is below 30%")
    expect(formatCombatEffect({ type: 'apply-status', target: 'opponent', statusId: 'burning', durationMs: 5000 })).toBe('Apply Burning to the opponent for 5 s')
  })

  it('formats triggered equipment rules without serialized data', () => {
    const item = { combat: { rules: [{ id: 'barrier-proc', event: 'on-hp-threshold' as const, condition: { type: 'self-hp-below-percent' as const, percent: 30 }, effects: [{ type: 'gain-barrier' as const, target: 'self' as const, magnitude: { type: 'flat' as const, value: 20 } }] }] } }
    const rule = item.combat.rules[0]!
    expect(formatCombatRule(rule)).toContain('Barrier Proc')
    expect(formatEquipmentEffectSummary(item as unknown as ItemDefinition).join('\\n')).not.toContain('"target"')
  })
})
