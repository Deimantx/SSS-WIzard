import { describe, expect, it } from 'vitest'
import { consumeCombatEvent, createCombatTelemetryScope } from '../../telemetry/combat/combatTelemetryAggregator'
import { getCombatDetailsPresentation, cycleCombatDetailsMode, formatCompactCombatValue } from './combatDetailsPresentation'

const populatedScope = () => {
  const scope = createCombatTelemetryScope('run-1', 1, 'whispering-woods', 'grove-sentinel')
  scope.engagedMs = 30_000
  consumeCombatEvent(scope, { source: { kind: 'player' }, sourceKind: 'spell', spellId: 'fire-bolt', category: 'spell', target: 'enemy', targetMonsterId: 'grove-sentinel', sourceId: 'fire-bolt', amount: 120, healthDamage: 120, barrierAbsorbed: 0, damageType: 'fire' })
  consumeCombatEvent(scope, { source: { kind: 'player' }, sourceKind: 'basic-attack', category: 'basic-attack', target: 'enemy', targetMonsterId: 'grove-sentinel', sourceId: 'weapon-basic', amount: 30, healthDamage: 20, barrierAbsorbed: 10, damageType: 'physical' })
  consumeCombatEvent(scope, { source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'action', actionId: 'root-crush', category: 'enemy-action', target: 'player', amount: 50, healthDamage: 40, barrierAbsorbed: 10, damageType: 'physical' })
  consumeCombatEvent(scope, { source: { kind: 'player' }, sourceKind: 'spell', spellId: 'flow-mend', category: 'heal', target: 'player', sourceId: 'flow-mend', amount: 40, attemptedAmount: 60, effectiveAmount: 40, overheal: 20 })
  return scope
}

describe('combat details presentation', () => {
  it('cycles metrics in the requested order and wraps in both directions', () => {
    expect(cycleCombatDetailsMode('damage-done', 1)).toBe('damage-taken')
    expect(cycleCombatDetailsMode('damage-taken', 1)).toBe('healing')
    expect(cycleCombatDetailsMode('healing', 1)).toBe('damage-done')
    expect(cycleCombatDetailsMode('damage-done', -1)).toBe('healing')
  })

  it('presents all ranked player run sources with exact aggregate percentages', () => {
    const details = getCombatDetailsPresentation(populatedScope(), 'damage-done')
    expect(details.total).toBe(150)
    expect(details.rate).toBe(5)
    expect(details.rows.map((row) => [row.rank, row.source.name, row.total, row.percent])).toEqual([
      [1, 'Fire Bolt', 120, 80],
      [2, 'Basic Attack', 30, 20],
    ])
  })

  it('uses enemy source identity for Player Damage Taken and effective healing for Healing', () => {
    const scope = populatedScope()
    const taken = getCombatDetailsPresentation(scope, 'damage-taken')
    expect(taken.total).toBe(50)
    expect(taken.rows[0].source.name).toBe('Root Crush')
    expect(taken.rows[0].source.subtitle).toBe('Grove Sentinel')

    const healing = getCombatDetailsPresentation(scope, 'healing')
    expect(healing.total).toBe(40)
    expect(healing.rate).toBeCloseTo(1.3333, 4)
  })

  it('returns a safe empty model', () => {
    const empty = getCombatDetailsPresentation(null, 'healing')
    expect(empty).toMatchObject({ total: 0, rate: 0, rows: [] })
  })

  it('uses compact values only for the dock presentation', () => {
    expect(formatCompactCombatValue(999)).toBe('999')
    expect(formatCompactCombatValue(1_240)).toBe('1.2k')
    expect(formatCompactCombatValue(14_628)).toBe('14.6k')
    expect(formatCompactCombatValue(1_300_000)).toBe('1.3m')
  })
})
