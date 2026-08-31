import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { combatTelemetryObserver, combatTelemetrySink, useCombatTelemetryStore } from '../telemetry/combat/combatTelemetryStore'
import type { CombatEvent } from '../systems/combat/combatTypes'
import { combatRecapSink, clearCombatRecap, useCombatRecapStore } from './combatRecapStore'

describe('combat encounter recap', () => {
  beforeEach(() => { clearCombatRecap(); useCombatTelemetryStore.getState().clear() })

  it('captures the finalized encounter scope before telemetry resets it', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    combatTelemetryObserver.beginRun('whispering-woods')
    const encounterStart: CombatEvent = { source: { kind: 'system' }, sourceKind: 'system', dungeonId: 'whispering-woods', target: 'enemy', targetMonsterId: 'forest-wisp', category: 'system', sourceId: 'encounter-start' }
    combatTelemetrySink.push(encounterStart)
    combatTelemetryObserver.advance(2_000, state)
    combatTelemetrySink.push({ source: { kind: 'player' }, sourceKind: 'spell', target: 'enemy', targetMonsterId: 'forest-wisp', category: 'spell', spellId: 'fire-bolt', amount: 40, healthDamage: 40 })

    combatRecapSink.push({ source: { kind: 'system' }, sourceKind: 'system', dungeonId: 'whispering-woods', target: 'enemy', targetMonsterId: 'forest-wisp', category: 'death', sourceId: 'enemy-defeated' })

    const recap = useCombatRecapStore.getState().lastEncounterRecap
    expect(recap).toMatchObject({ monsterId: 'forest-wisp', durationMs: 2_000, dps: 20, defeated: true, boss: false })
    expect(recap?.topSources[0]).toMatchObject({ spellId: 'fire-bolt', total: 40 })
  })

  it('retains the last recap at the Tower and clears it on the next run', () => {
    useCombatRecapStore.setState({ lastEncounterRecap: { monsterId: 'forest-wisp', durationMs: 1, dps: 1, dtps: 0, hps: 0, topSources: [], defeated: true, boss: false, createdAtMs: 1 } })
    expect(useCombatRecapStore.getState().lastEncounterRecap?.monsterId).toBe('forest-wisp')
    useCombatRecapStore.getState().beginRun()
    expect(useCombatRecapStore.getState().lastEncounterRecap).toBeNull()
  })
})
