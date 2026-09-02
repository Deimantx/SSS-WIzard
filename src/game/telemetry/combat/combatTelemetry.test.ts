import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CombatEvent, CombatEventSink, CombatSource } from '../../systems/combat/combatTypes'
import { createInitialState } from '../../../store/initialState'
import { advanceGameState } from '../../systems/simulation/advanceGameState'
import { createCombatEventSink } from '../../systems/combat/combatEventSink'
import { executeCombatEffects } from '../../systems/combat/effectResolver'
import { applyStatus, tickStatuses } from '../../systems/combat/statusRuntime'
import { spawnEnemy } from '../../systems/combat/combatRuntime'
import { advanceCombatTelemetryScope, consumeCombatEvent, createCombatTelemetryScope, getCombatMetricRate, getCombatMetricSourceKey, reconcileCombatBarrierTelemetry } from './combatTelemetryAggregator'
import { combatTelemetryObserver, useCombatTelemetryStore } from './combatTelemetryStore'

const damageEvent = (source: CombatEvent['source'], sourceKind: NonNullable<CombatEvent['sourceKind']>, sourceId: string, amount: number, target: 'player' | 'enemy', targetMonsterId?: CombatEvent['targetMonsterId']): CombatEvent => ({ source, sourceKind, sourceId, target, targetMonsterId, dungeonId: 'whispering-woods', category: 'damage', damageType: 'fire', amount, healthDamage: amount - 20, barrierAbsorbed: 20 })
const barrierEvent = (source: CombatEvent['source'], sourceId: string, amount: number, target: 'player' | 'enemy', mode: 'add' | 'replace' = 'add'): CombatEvent => ({ source, sourceKind: source.kind === 'player' ? 'spell' : 'action', sourceId, spellId: source.kind === 'player' ? sourceId as 'water-ward' : undefined, actionId: source.kind === 'enemy' ? sourceId : undefined, target, category: 'barrier', amount, barrierGranted: amount, barrierMode: mode, barrierAfter: amount })
const absorbedDamage = (amount: number, target: 'player' | 'enemy' = 'player'): CombatEvent => ({ source: target === 'player' ? { kind: 'enemy', monsterId: 'grove-sentinel' } : { kind: 'player' }, sourceKind: target === 'player' ? 'action' : 'spell', sourceId: target === 'player' ? 'root-crush' : 'fire-bolt', actionId: target === 'player' ? 'root-crush' : undefined, spellId: target === 'enemy' ? 'fire-bolt' : undefined, target, targetMonsterId: target === 'enemy' ? 'grove-sentinel' : undefined, category: 'damage', damageType: 'physical', amount, healthDamage: 0, barrierAbsorbed: amount })

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

  it('credits only absorbed shield damage to the original grant source, in FIFO order', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods')
    consumeCombatEvent(scope, barrierEvent({ kind: 'player' }, 'water-ward', 20, 'player'))
    consumeCombatEvent(scope, barrierEvent({ kind: 'player' }, 'stoneguard', 30, 'player'))

    expect(scope.player.healingDone.total).toBe(0)
    consumeCombatEvent(scope, absorbedDamage(25))

    expect(scope.player.healingDone.total).toBe(25)
    expect(scope.player.healingDone.bySource['spell:water-ward']).toMatchObject({ total: 20, barrierGranted: 20, barrierAbsorbed: 20 })
    expect(scope.player.healingDone.bySource['spell:stoneguard']).toMatchObject({ total: 5, barrierGranted: 30, barrierAbsorbed: 5 })
  })

  it('does not count unused or expired shield capacity, but counts full and partial absorption', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods')
    const state = createInitialState()
    consumeCombatEvent(scope, barrierEvent({ kind: 'player' }, 'water-ward', 35, 'player', 'replace'))
    state.combat.playerBarrier = 35
    reconcileCombatBarrierTelemetry(scope, state)
    state.combat.playerBarrier = 0
    reconcileCombatBarrierTelemetry(scope, state)
    expect(scope.player.healingDone.total).toBe(0)

    consumeCombatEvent(scope, barrierEvent({ kind: 'player' }, 'water-ward', 35, 'player', 'replace'))
    consumeCombatEvent(scope, absorbedDamage(12))
    expect(scope.player.healingDone.total).toBe(12)
    expect(scope.player.healingDone.bySource['spell:water-ward']).toMatchObject({ barrierGranted: 70, barrierAbsorbed: 12 })
  })

  it('removes replaced shield layers before attributing later absorption', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods')
    consumeCombatEvent(scope, barrierEvent({ kind: 'player' }, 'water-ward', 20, 'player'))
    consumeCombatEvent(scope, barrierEvent({ kind: 'player' }, 'stoneguard', 30, 'player', 'replace'))
    consumeCombatEvent(scope, absorbedDamage(25))

    expect(scope.player.healingDone.bySource['spell:water-ward']).toMatchObject({ total: 0, barrierAbsorbed: 0 })
    expect(scope.player.healingDone.bySource['spell:stoneguard']).toMatchObject({ total: 25, barrierGranted: 30, barrierAbsorbed: 25 })
  })

  it('tracks enemy shield absorption symmetrically for the original enemy grant source', () => {
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods', 'grove-sentinel')
    consumeCombatEvent(scope, barrierEvent({ kind: 'enemy', monsterId: 'grove-sentinel' }, 'root-crush', 40, 'enemy'))
    consumeCombatEvent(scope, absorbedDamage(25, 'enemy'))

    expect(scope.enemy.healingDone.total).toBe(25)
    expect(scope.enemy.healingDone.bySource['enemy:grove-sentinel:action:root-crush']).toMatchObject({ total: 25, barrierGranted: 40, barrierAbsorbed: 25 })
  })

  it('uses resolved runtime barrier capacity and damage-before values for attribution', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'grove-sentinel'
    state.combat.enemyInstanceSerial = 1
    state.combat.enemyInstanceKey = 'enemy:1'
    const events: CombatEvent[] = []
    const sink: CombatEventSink = { push: (event) => events.push(event) }
    const ward: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'water-ward', school: 'water', tags: ['spell', 'water'] }
    const rootCrush: CombatSource = { actor: 'enemy', kind: 'action', sourceId: 'root-crush', ruleId: 'root-crush', sourceMonsterId: 'grove-sentinel', sourceInstanceKey: 'enemy:1', tags: ['special'] }
    executeCombatEffects(state, [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'flat', value: 35 }, mode: 'replace', durationMs: 9_000 }], ward, undefined, sink)
    executeCombatEffects(state, [{ type: 'deal-damage', target: 'opponent', components: [{ damageType: 'physical', magnitude: { type: 'flat', value: 20 } }] }], rootCrush, undefined, sink)

    expect(events[0]).toMatchObject({ category: 'barrier', amount: 35, barrierGranted: 35, barrierMode: 'replace', barrierAfter: 35 })
    expect(events[1]).toMatchObject({ category: 'enemy-action', amount: 20, barrierBefore: 35, barrierAfter: 15, barrierAbsorbed: 20 })
    const scope = createCombatTelemetryScope('run-test', 1, 'whispering-woods')
    events.forEach((event) => consumeCombatEvent(scope, event))
    expect(scope.player.healingDone.total).toBe(20)
    expect(scope.player.healingDone.bySource['spell:water-ward']).toMatchObject({ total: 20, barrierGranted: 35, barrierAbsorbed: 20 })
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
    const igniteBurn = { source: { kind: 'player' } as const, sourceKind: 'status' as const, sourceId: 'burning', statusId: 'burning' as const, originSourceKind: 'spell' as const, originSourceId: 'ignite', category: 'damage' as const, amount: 100 }
    const fireballBurn = { ...igniteBurn, originSourceId: 'fireball', amount: 20 }
    expect(getCombatMetricSourceKey(igniteBurn)).toBe('status:burning:origin:spell:ignite')
    expect(getCombatMetricSourceKey(fireballBurn)).toBe('status:burning:origin:spell:fireball')
    const scope = createCombatTelemetryScope('origin-test', 1, 'whispering-woods')
    consumeCombatEvent(scope, igniteBurn)
    consumeCombatEvent(scope, fireballBurn)
    expect(Object.keys(scope.player.damageDone.bySource)).toEqual(['status:burning:origin:spell:ignite', 'status:burning:origin:spell:fireball'])
    expect(scope.player.damageDone.total).toBe(120)
    expect(scope.player.damageDone.bySource['status:burning:origin:spell:ignite'].total).toBe(100)
    expect(scope.player.damageDone.bySource['status:burning:origin:spell:fireball'].total).toBe(20)
    expect(getCombatMetricSourceKey({ source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'action', sourceId: 'root-crush', actionId: 'root-crush', category: 'damage', amount: 1 })).toBe('enemy:grove-sentinel:action:root-crush')
    expect(getCombatMetricSourceKey({ source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'trait', sourceId: 'grove-sentinel-ancient-growth', traitId: 'grove-sentinel-ancient-growth', category: 'damage', amount: 1 })).toBe('enemy:grove-sentinel:trait:grove-sentinel-ancient-growth')
  })

  it('keeps Equipment proc damage, healing, and barriers out of Basic Attack analytics', () => {
    const source = { source: { kind: 'player' } as const, sourceKind: 'equipment' as const, sourceId: 'wispwood-wand', providerInstanceKey: 'ring1', ruleId: 'flame-retaliation' }
    const damage = { ...source, category: 'damage' as const, amount: 30, healthDamage: 30 }
    const heal = { ...source, category: 'heal' as const, amount: 4, effectiveAmount: 4 }
    const barrier = { ...source, category: 'barrier' as const, amount: 5, barrierGranted: 5, barrierMode: 'add' as const }
    expect(getCombatMetricSourceKey(damage)).toBe('player:equipment:wispwood-wand:provider:ring1:rule:flame-retaliation')
    const scope = createCombatTelemetryScope('equipment-test', 1, 'whispering-woods')
    consumeCombatEvent(scope, damage)
    consumeCombatEvent(scope, heal)
    consumeCombatEvent(scope, barrier)
    const contribution = scope.player.damageDone.bySource['player:equipment:wispwood-wand:provider:ring1:rule:flame-retaliation']
    expect(contribution.kind).toBe('equipment')
    expect(contribution.total).toBe(30)
    expect(scope.player.healingDone.bySource['player:equipment:wispwood-wand:provider:ring1:rule:flame-retaliation'].effectiveHealing).toBe(4)
    expect(scope.player.barrierGrantedBySource['player:equipment:wispwood-wand:provider:ring1:rule:flame-retaliation'].barrierGranted).toBe(5)
    expect(contribution.kind).not.toBe('basic-attack')
  })

  it('keeps duplicate Equipment providers and Status origins distinct without changing totals', () => {
    const ring1 = { source: { kind: 'player' } as const, sourceKind: 'equipment' as const, sourceId: 'wispwood-wand', providerInstanceKey: 'ring1', ruleId: 'burn' }
    const ring2 = { ...ring1, providerInstanceKey: 'ring2' }
    expect(getCombatMetricSourceKey({ ...ring1, category: 'damage' as const, amount: 1 })).not.toBe(getCombatMetricSourceKey({ ...ring2, category: 'damage' as const, amount: 1 }))
    const status1 = { source: { kind: 'player' } as const, sourceKind: 'status' as const, sourceId: 'burning', statusId: 'burning' as const, originSourceKind: 'equipment' as const, originSourceId: 'wispwood-wand', providerInstanceKey: 'ring1', ruleId: 'burn', category: 'damage' as const, amount: 5 }
    const status2 = { ...status1, providerInstanceKey: 'ring2' }
    expect(getCombatMetricSourceKey(status1)).not.toBe(getCombatMetricSourceKey(status2))
    const scope = createCombatTelemetryScope('provider-test', 1)
    consumeCombatEvent(scope, status1)
    consumeCombatEvent(scope, status2)
    expect(scope.player.damageDone.total).toBe(10)
    expect(Object.keys(scope.player.damageDone.bySource)).toHaveLength(2)
  })

  it('preserves Ignite and Fireball origins through runtime Status ticks', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    const ignite = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'ignite', tags: ['spell', 'fire'] as ('spell' | 'fire')[] }
    const fireball = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'fireball', tags: ['spell', 'fire'] as ('spell' | 'fire')[] }
    applyStatus(state, 'enemy', 'burning', ignite, { now: 0 })
    applyStatus(state, 'enemy', 'burning', fireball, { now: 0 })
    const events: CombatEvent[] = []
    tickStatuses(state, 1_000, executeCombatEffects, { push: (event) => events.push(event) }, ['enemy'])
    const ticks = events.filter((event) => event.category === 'damage' && event.sourceKind === 'status')
    expect(ticks.map((event) => event.originSourceId)).toEqual(['ignite', 'fireball'])
    const scope = createCombatTelemetryScope('runtime-origin-test', 1, 'whispering-woods')
    ticks.forEach((event) => consumeCombatEvent(scope, event))
    expect(Object.keys(scope.player.damageDone.bySource)).toEqual(['status:burning:origin:spell:ignite', 'status:burning:origin:spell:fireball'])
    expect(scope.player.damageDone.total).toBe(10)
    expect(Object.values(scope.player.damageDone.bySource).reduce((sum, contribution) => sum + contribution.total, 0)).toBe(scope.player.damageDone.total)
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

  it('resets transient measurements without touching gameplay barriers and neutralizes pre-reset shield provenance', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'grove-sentinel'
    state.combat.playerBarrier = 35
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.beginEncounter('grove-sentinel')
    combatTelemetryObserver.consume(damageEvent({ kind: 'player' }, 'spell', 'fire-bolt', 40, 'enemy', 'grove-sentinel'))

    combatTelemetryObserver.resetMeasurement()
    expect(useCombatTelemetryStore.getState().lastRun).toBeNull()
    expect(useCombatTelemetryStore.getState().run?.player.damageDone.total).toBe(0)
    expect(useCombatTelemetryStore.getState().encounter?.player.damageDone.total).toBe(0)
    expect(state.combat.playerBarrier).toBe(35)

    combatTelemetryObserver.advance(1_000, state)
    combatTelemetryObserver.consume(absorbedDamage(35))
    expect(useCombatTelemetryStore.getState().run?.player.healingDone.total).toBe(0)

    combatTelemetryObserver.consume(barrierEvent({ kind: 'player' }, 'water-ward', 10, 'player', 'replace'))
    combatTelemetryObserver.consume(absorbedDamage(10))
    expect(useCombatTelemetryStore.getState().run?.player.healingDone.total).toBe(10)
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
