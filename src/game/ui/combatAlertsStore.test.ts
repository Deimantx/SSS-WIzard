import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import type { CombatEvent } from '../systems/combat/combatTypes'
import { clearCombatAlerts, combatAlertsObserver, combatAlertsSink, useCombatAlertsStore } from './combatAlertsStore'

const baseEvent = (overrides: Partial<CombatEvent> = {}): CombatEvent => ({
  source: { kind: 'player' },
  target: 'enemy',
  targetMonsterId: 'forest-wisp',
  category: 'damage',
  sourceKind: 'spell',
  spellId: 'fire-bolt',
  amount: 10,
  ...overrides,
})

describe('combat alerts', () => {
  beforeEach(() => clearCombatAlerts())

  it('suppresses routine damage, ticks, healing, and barrier activity', () => {
    ;[
      baseEvent({ category: 'basic-attack', sourceKind: 'basic-attack' }),
      baseEvent({ category: 'spell' }),
      baseEvent({ category: 'damage', sourceKind: 'status', originSourceId: 'ignite' }),
      baseEvent({ category: 'heal', sourceKind: 'status', target: 'player', effectiveAmount: 5 }),
      baseEvent({ category: 'barrier', sourceKind: 'spell', barrierGranted: 20, barrierBefore: 0, barrierAfter: 20 }),
      baseEvent({ category: 'damage', barrierAbsorbed: 10, barrierBefore: 20, barrierAfter: 10 }),
    ].forEach((event) => combatAlertsSink.push(event))
    expect(useCombatAlertsStore.getState().alerts).toHaveLength(0)
  })

  it('ignores action starts while alerting on trait triggers, phase shifts, barrier breaks, and death', () => {
    combatAlertsSink.push(baseEvent({ source: { kind: 'enemy', monsterId: 'forest-heart' }, sourceKind: 'action', target: 'player', category: 'system', actionId: 'heart-pulse', actionPhase: 'start' }))
    combatAlertsSink.push(baseEvent({ source: { kind: 'enemy', monsterId: 'forest-wisp' }, sourceKind: 'system', category: 'trait', traitId: 'forest-wisp-flicker', ruleId: 'forest-wisp-flicker-arc-spark' }))
    combatAlertsSink.push(baseEvent({ source: { kind: 'enemy', monsterId: 'forest-heart' }, sourceKind: 'system', category: 'pattern', sourceId: 'unbound' }))
    combatAlertsSink.push(baseEvent({ category: 'damage', barrierBefore: 10, barrierAfter: 0, barrierAbsorbed: 10 }))
    combatAlertsSink.push(baseEvent({ source: { kind: 'system' }, sourceKind: 'system', category: 'death', target: 'enemy', targetMonsterId: 'forest-heart', sourceId: 'enemy-defeated' }))
    const alerts = useCombatAlertsStore.getState().alerts
    expect(alerts).toHaveLength(3)
    expect(alerts[0].priority).toBe('critical')
    expect(alerts.some((alert) => alert.category === 'death')).toBe(true)
    expect(alerts.some((alert) => alert.category === 'boss')).toBe(true)
  })

  it('dedupes mana starvation and expires timed alerts without losing priority', () => {
    const manaEvent = baseEvent({ source: { kind: 'player' }, sourceKind: 'spell', target: undefined, category: 'system', sourceId: 'spell-cast-failed', spellId: 'fire-bolt', failure: 'mana' })
    combatAlertsSink.push(manaEvent)
    combatAlertsSink.push({ ...manaEvent, spellId: 'frostbite' })
    expect(useCombatAlertsStore.getState().alerts).toHaveLength(1)
    expect(useCombatAlertsStore.getState().alerts[0].dedupeKey).toBe('mana-starved')
    const state = createInitialState()
    state.combat.active = true
    combatAlertsObserver.advance(3_501, state)
    expect(useCombatAlertsStore.getState().alerts).toHaveLength(0)
  })

  it('keeps critical player health visible until the condition resolves', () => {
    const state = createInitialState()
    state.combat.active = true
    state.player.health = state.player.maxHealth * 0.2
    combatAlertsObserver.advance(1, state)
    expect(useCombatAlertsStore.getState().alerts[0].dedupeKey).toBe('critical-player-health')
    state.player.health = state.player.maxHealth
    combatAlertsObserver.advance(1, state)
    expect(useCombatAlertsStore.getState().alerts).toHaveLength(0)
  })

  it('caps the visible stack at three alerts while retaining the highest priorities', () => {
    const push = useCombatAlertsStore.getState().push
    push({ dedupeKey: 'info', priority: 'info', category: 'system', title: 'INFO', detail: 'info', semantic: 'info', durationMs: 3_000 })
    push({ dedupeKey: 'important', priority: 'important', category: 'system', title: 'IMPORTANT', detail: 'important', semantic: 'warning', durationMs: 3_000 })
    push({ dedupeKey: 'critical', priority: 'critical', category: 'system', title: 'CRITICAL', detail: 'critical', semantic: 'danger', durationMs: 3_000 })
    push({ dedupeKey: 'second-critical', priority: 'critical', category: 'system', title: 'SECOND', detail: 'second', semantic: 'danger', durationMs: 3_000 })
    expect(useCombatAlertsStore.getState().alerts).toHaveLength(3)
    expect(useCombatAlertsStore.getState().alerts[0].priority).toBe('critical')
    expect(useCombatAlertsStore.getState().alerts.some((alert) => alert.dedupeKey === 'info')).toBe(false)
  })
})
