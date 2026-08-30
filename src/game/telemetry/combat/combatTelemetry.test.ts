import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CombatEvent, CombatEventSink } from '../../systems/combat/combatTypes'
import { createInitialState } from '../../../store/initialState'
import { advanceGameState } from '../../systems/simulation/advanceGameState'
import { createCombatEventSink } from '../../systems/combat/combatEventSink'
import { executeCombatEffects } from '../../systems/combat/effectResolver'
import { advanceCombatTelemetryScope, consumeCombatEvent, createCombatTelemetryScope, getCombatMetricRate, getCombatMetricSourceKey } from './combatTelemetryAggregator'
import { combatTelemetryObserver, useCombatTelemetryStore } from './combatTelemetryStore'

const damageEvent = (source: CombatEvent['source'], sourceKind: NonNullable<CombatEvent['sourceKind']>, sourceId: string, amount: number, target: 'player' | 'enemy', targetMonsterId?: CombatEvent['targetMonsterId']): CombatEvent => ({ source, sourceKind, sourceId, target, targetMonsterId, dungeonId: 'whispering-woods', category: 'damage', damageType: 'fire', amount, healthDamage: amount - 20, barrierAbsorbed: 20 })

describe('combat telemetry foundation', () => {
  beforeEach(() => useCombatTelemetryStore.getState().clear())

  it('aggregates resolved damage to both actor perspectives with barrier detail', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods', 'grove-sentinel')
    const event = damageEvent({ kind: 'player' }, 'spell', 'fire-bolt', 50, 'enemy', 'grove-sentinel')
    consumeCombatEvent(scope, event)

    expect(scope.player.damageDone.total).toBe(50)
    expect(scope.enemy.damageTaken.total).toBe(50)
    expect(scope.player.damageDone.bySource['spell:fire-bolt']).toMatchObject({ total: 50, healthDamage: 30, barrierAbsorbed: 20, events: 1 })
    expect(scope.enemy.damageTaken.bySource['spell:fire-bolt']).toMatchObject({ total: 50, healthDamage: 30, barrierAbsorbed: 20, events: 1 })
    expect(scope.enemy.barrierAbsorbed).toBe(20)
  })

  it('uses effective healing, retains overheal, and tracks granted barrier separately', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods')
    consumeCombatEvent(scope, { source: { kind: 'player' }, sourceKind: 'spell', sourceId: 'flow-mend', spellId: 'flow-mend', category: 'heal', amount: 25, attemptedAmount: 60, effectiveAmount: 25, overheal: 35 })
    consumeCombatEvent(scope, { source: { kind: 'player' }, sourceKind: 'spell', sourceId: 'water-ward', spellId: 'water-ward', category: 'barrier', amount: 35 })

    expect(scope.player.healingDone.total).toBe(25)
    expect(scope.player.healingDone.bySource['spell:flow-mend']).toMatchObject({ total: 25, effectiveHealing: 25, overheal: 35 })
    expect(scope.player.barrierGranted).toBe(35)
    expect(scope.player.damageDone.total).toBe(0)
  })

  it('emits a resolved heal event even when the attempt is fully overheal', () => {
    const state = createInitialState()
    state.combat.dungeonId = 'whispering-woods'
    const events: CombatEvent[] = []
    executeCombatEffects(state, [{ type: 'heal', target: 'self', magnitude: { type: 'flat', value: 60 } }], { actor: 'player', kind: 'spell', sourceId: 'flow-mend' }, undefined, { push: (event) => events.push(event) })
    expect(events).toContainEqual(expect.objectContaining({ category: 'heal', attemptedAmount: 60, effectiveAmount: 0, overheal: 60 }))
  })

  it('canonicalizes status, trait, and monster-specific action sources', () => {
    expect(getCombatMetricSourceKey({ source: { kind: 'player' }, sourceKind: 'status', sourceId: 'burning', statusId: 'burning', category: 'damage', amount: 1 })).toBe('status:burning')
    expect(getCombatMetricSourceKey({ source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'action', sourceId: 'root-crush', actionId: 'root-crush', category: 'damage', amount: 1 })).toBe('enemy:grove-sentinel:action:root-crush')
    expect(getCombatMetricSourceKey({ source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'trait', sourceId: 'grove-sentinel-ancient-growth', traitId: 'grove-sentinel-ancient-growth', category: 'damage', amount: 1 })).toBe('enemy:grove-sentinel:trait:grove-sentinel-ancient-growth')
  })

  it('does not treat trigger notifications as resolved metric events', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods', 'grove-sentinel')
    consumeCombatEvent(scope, { source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'system', target: 'player', category: 'trait', sourceId: 'grove-sentinel-ancient-growth', amount: 99, healthDamage: 99 })
    expect(scope.enemy.damageDone.total).toBe(0)
    expect(scope.player.damageTaken.total).toBe(0)
  })

  it('uses simulation time for stable rates and handles zero engaged time', () => {
    const scope = createCombatTelemetryScope('run-test', 1)
    expect(getCombatMetricRate(100, 0)).toBe(0)
    consumeCombatEvent(scope, damageEvent({ kind: 'player' }, 'basic-attack', 'player-basic-attack', 100, 'enemy', 'forest-wisp'))
    advanceCombatTelemetryScope(scope, 10_000, true)
    expect(getCombatMetricRate(scope.player.damageDone.total, scope.engagedMs)).toBe(10)
    expect(scope.elapsedMs).toBe(10_000)
  })

  it('resets encounters while retaining run totals, then keeps a completed run transiently inspectable', () => {
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.beginEncounter('grove-sentinel')
    combatTelemetryObserver.advance(1_000, { combat: { active: true, enemyId: 'grove-sentinel' } } as ReturnType<typeof createInitialState>)
    combatTelemetryObserver.consume(damageEvent({ kind: 'player' }, 'spell', 'fire-bolt', 40, 'enemy', 'grove-sentinel'))

    expect(useCombatTelemetryStore.getState().run?.engagedMs).toBe(1_000)
    expect(useCombatTelemetryStore.getState().encounter?.player.damageDone.total).toBe(40)
    combatTelemetryObserver.endEncounter('death')
    combatTelemetryObserver.beginEncounter('thornling')
    expect(useCombatTelemetryStore.getState().encounter?.player.damageDone.total).toBe(0)
    expect(useCombatTelemetryStore.getState().run?.player.damageDone.total).toBe(40)

    combatTelemetryObserver.endRun('leave')
    expect(useCombatTelemetryStore.getState().run).toBeNull()
    expect(useCombatTelemetryStore.getState().lastRun?.player.damageDone.total).toBe(40)
    expect(useCombatTelemetryStore.getState().lastRun?.scopeId.startsWith('last-')).toBe(true)
  })

  it('collects lifecycle events without depending on a mounted Combat screen', () => {
    combatTelemetryObserver.consume({ source: { kind: 'system' }, sourceKind: 'system', dungeonId: 'whispering-woods', target: 'enemy', targetMonsterId: 'forest-wisp', category: 'system', sourceId: 'encounter-start' })
    combatTelemetryObserver.advance(500, { combat: { active: true, enemyId: 'forest-wisp' } } as ReturnType<typeof createInitialState>)
    combatTelemetryObserver.consume(damageEvent({ kind: 'player' }, 'spell', 'fire-bolt', 10, 'enemy', 'forest-wisp'))
    expect(useCombatTelemetryStore.getState().run?.engagedMs).toBe(500)
    expect(useCombatTelemetryStore.getState().encounter?.player.damageDone.total).toBe(10)
  })

  it('suppresses telemetry during banked simulation and isolates observer failures in the composite sink', () => {
    const state = createInitialState()
    const observer = { advance: vi.fn() }
    advanceGameState(state, 1_000, { mode: 'banked', telemetry: observer as never })
    expect(observer.advance).not.toHaveBeenCalled()

    const received = vi.fn()
    const throwing: CombatEventSink = { push: () => { throw new Error('diagnostic sink failed') } }
    const sink = createCombatEventSink(throwing, { push: received })
    const event = damageEvent({ kind: 'player' }, 'spell', 'fire-bolt', 1, 'enemy', 'forest-wisp')
    expect(() => sink.push(event)).not.toThrow()
    expect(received).toHaveBeenCalledWith(event)
  })
})
