import { beforeEach, describe, expect, it } from 'vitest'
import { combatDefeatSink, useCombatDefeatStore } from './combatDefeatStore'
import { combatLogUiSink } from './combatLogStore'
import { combatTelemetryObserver, useCombatTelemetryStore } from '../telemetry/combat/combatTelemetryStore'

const damageEvent = (index: number) => ({ source: { kind: 'player' as const }, sourceKind: 'spell' as const, dungeonId: 'whispering-woods' as const, target: 'enemy' as const, targetMonsterId: 'forest-wisp' as const, category: 'damage' as const, sourceId: 'fire-bolt', spellId: 'fire-bolt' as const, damageType: 'fire' as const, amount: 20, healthDamage: 20, timestampMs: 1_000 + index * 1_000 })

describe('combat defeat snapshot', () => {
  beforeEach(() => { useCombatDefeatStore.getState().clear(); useCombatTelemetryStore.getState().clear() })

  it('copies the last ten typed events in chronological order and includes death', () => {
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.beginEncounter('forest-wisp')
    for (let index = 0; index < 11; index += 1) {
      const event = damageEvent(index)
      combatTelemetryObserver.consume(event)
      combatLogUiSink.push(event)
    }
    const death = { source: { kind: 'system' as const }, sourceKind: 'system' as const, dungeonId: 'whispering-woods' as const, target: 'player' as const, targetMonsterId: 'forest-wisp' as const, category: 'death' as const, sourceId: 'player-defeated', timestampMs: 12_000 }
    combatLogUiSink.push(death)
    combatDefeatSink.push(death)
    const snapshot = useCombatDefeatStore.getState().snapshot
    expect(snapshot).toMatchObject({ dungeonId: 'whispering-woods', enemyId: 'forest-wisp', defeatedAtMs: 12_000, damageDone: 220 })
    expect(snapshot?.events).toHaveLength(10)
    expect(snapshot?.events[snapshot.events.length - 1]?.sourceId).toBe('player-defeated')
    expect(snapshot?.events[0]?.timestampMs).toBe(3_000)
  })

  it('clears transient defeat state without changing persisted gameplay data', () => {
    combatDefeatSink.push({ source: { kind: 'system' }, target: 'player', targetMonsterId: 'forest-wisp', category: 'death', sourceId: 'player-defeated' })
    expect(useCombatDefeatStore.getState().snapshot).not.toBeNull()
    useCombatDefeatStore.getState().clear()
    expect(useCombatDefeatStore.getState().snapshot).toBeNull()
  })
})
