import { describe, expect, it } from 'vitest'
import { createOfflineCombatTrace, MAX_OFFLINE_COMBAT_TRACE_EVENTS } from './offlineCombatTrace'

const damageEvent = (index: number) => ({
  source: { kind: 'enemy' as const, monsterId: 'forest-wisp' as const },
  sourceKind: 'basic-attack' as const,
  target: 'player' as const,
  targetMonsterId: 'forest-wisp' as const,
  dungeonId: 'whispering-woods' as const,
  category: 'damage' as const,
  sourceId: 'forest-wisp-basic-attack',
  amount: 4,
  healthDamage: 4,
  timestampMs: index,
})

describe('offline combat trace', () => {
  it('keeps a bounded useful tail and captures the terminal defeat', () => {
    const trace = createOfflineCombatTrace()
    for (let index = 0; index < MAX_OFFLINE_COMBAT_TRACE_EVENTS + 5; index += 1) trace.push(damageEvent(index))
    trace.captureDefeat({ source: { kind: 'system' }, target: 'player', targetMonsterId: 'forest-wisp', dungeonId: 'whispering-woods', category: 'death', sourceId: 'player-defeated', timestampMs: 100 }, null)

    const result = trace.getDefeat()
    expect(result?.recentEvents).toHaveLength(MAX_OFFLINE_COMBAT_TRACE_EVENTS)
    expect(result?.recentEvents[0]?.sourceId).toBe('player-defeated')
    expect(result?.recentEvents.some((event) => event.sourceId === 'forest-wisp-basic-attack')).toBe(true)
  })

  it('ignores action-start events', () => {
    const trace = createOfflineCombatTrace()
    trace.push({ ...damageEvent(1), actionPhase: 'start' })
    trace.captureDefeat({ source: { kind: 'system' }, category: 'death', sourceId: 'player-defeated' }, null)
    expect(trace.getDefeat()?.recentEvents).toHaveLength(1)
  })
})
