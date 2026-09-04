import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { STATUS_DEFINITIONS } from '../../content/statuses'
import { advanceGameState } from './advanceGameState'
import { applyStatus } from '../combat/statusRuntime'
import { gainBarrier } from '../combat/barrierRuntime'
import { spawnEnemy } from '../combat/combatRuntime'
import { executeCombatEffects } from '../combat/effectResolver'
import { startEnemyAction, clearCurrentEnemyAction } from '../combat/actionRuntime'
import type { CombatEvent, CombatSource, GameState } from '../../types'
import { combatTelemetryObserver, useCombatTelemetryStore } from '../../telemetry/combat/combatTelemetryStore'
import { dungeonStatisticsObserver, useDungeonStatisticsStore } from '../../telemetry/dungeon/dungeonStatisticsStore'

const playerSource: CombatSource = { actor: 'player', kind: 'spell', sourceId: 'downtime-test', school: 'fire', tags: ['spell', 'magic', 'fire'] }

const stateInDowntime = (encounterTimerMs = 5_000) => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.encounterTimerMs = encounterTimerMs
  state.player.mana = state.player.maxMana
  return state
}

const advance = (state: GameState, durationMs: number, context: Parameters<typeof advanceGameState>[2] = { mode: 'banked' }) => {
  let remaining = durationMs
  while (remaining > 0) {
    const step = Math.min(1_000, remaining)
    advanceGameState(state, step, context)
    remaining -= step
  }
}

const unlock = (state: GameState, spellId: keyof GameState['progress']['spellRanks']) => {
  state.progress.spellRanks[spellId] = 1
}

const observerSink = (events: CombatEvent[]) => ({
  push: (event: CombatEvent) => {
    events.push(event)
    combatTelemetryObserver.consume(event)
    dungeonStatisticsObserver.consume(event)
  },
})

describe('active dungeon downtime timeline', () => {
  beforeEach(() => {
    combatTelemetryObserver.clear()
    dungeonStatisticsObserver.clear()
  })

  it('continues spell cooldowns while waiting for the next encounter', () => {
    const state = stateInDowntime(5_000)
    state.combat.spellCooldowns.fireball = 8_000

    advance(state, 5_000)

    expect(state.combat.enemyId).not.toBeNull()
    expect(state.combat.spellCooldowns.fireball).toBe(3_000)
  })

  it('does not Auto-Cast a ready spell without an enemy target', () => {
    const state = stateInDowntime(5_000)
    unlock(state, 'fire-bolt')
    state.activities.autoCast['fire-bolt'] = true
    state.combat.spellCooldowns['fire-bolt'] = 1_000
    const mana = state.player.mana

    advance(state, 2_000)

    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(state.player.mana).toBe(mana)
  })

  it('casts a ready Auto-Cast spell at the exact spawn boundary', () => {
    const state = stateInDowntime(50)
    unlock(state, 'fire-bolt')
    state.activities.autoCast['fire-bolt'] = true
    state.combat.spellCooldowns['fire-bolt'] = 0
    const mana = state.player.mana

    advanceGameState(state, 50, { mode: 'live' })

    expect(state.player.mana).toBe(mana - 12)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(3_500)
  })

  it('expires player statuses and barriers during downtime', () => {
    const state = stateInDowntime(5_000)
    applyStatus(state, 'player', 'fortified', playerSource, { durationMs: 2_000, now: 0 })
    gainBarrier(state, 20, playerSource, 'player', ['barrier'], { mode: 'replace', durationMs: 2_000 })

    advance(state, 5_000)

    expect(state.combat.playerStatuses).toHaveLength(0)
    expect(state.combat.playerBarrier).toBe(0)
    expect(state.combat.playerBarrierRemainingMs).toBeNull()
    expect(state.combat.enemyId).not.toBeNull()
  })

  it('ticks player periodic statuses during downtime and resolves death before spawn', () => {
    const healingState = stateInDowntime(6_000)
    healingState.player.maxHealth = 100
    healingState.player.health = 50
    applyStatus(healingState, 'player', 'regeneration', playerSource, { durationMs: 5_000, now: 0 })

    advance(healingState, 5_000)

    expect(healingState.player.health).toBe(75)
    expect(healingState.combat.enemyId).toBeNull()

    const lethalState = stateInDowntime(1_000)
    lethalState.player.maxHealth = 100
    lethalState.player.health = 1
    applyStatus(lethalState, 'player', 'burning', playerSource, { durationMs: 5_000, now: 0 })

    advance(lethalState, 2_000)

    expect(lethalState.combat.active).toBe(false)
    expect(lethalState.combat.enemyId).toBeNull()
  })

  it('recomputes cooldown recovery after a timed modifier expires mid-delay', () => {
    const state = stateInDowntime(6_000)
    const originalModifiers = STATUS_DEFINITIONS.haste.modifiers
    STATUS_DEFINITIONS.haste.modifiers = [...(originalModifiers ?? []), { key: 'cooldown-recovery-percent', value: 0.5 }]
    try {
      applyStatus(state, 'player', 'haste', playerSource, { durationMs: 2_000, now: 0 })
      state.combat.spellCooldowns.fireball = 10_000

      advance(state, 5_000)

      expect(state.combat.spellCooldowns.fireball).toBe(4_000)
    } finally {
      STATUS_DEFINITIONS.haste.modifiers = originalModifiers
    }
  })

  it('preserves leftover time when an encounter spawns mid-quantum', () => {
    const state = stateInDowntime(50)

    advanceGameState(state, 100, { mode: 'banked' })

    expect(state.combat.enemyId).not.toBeNull()
    expect(state.combat.playerAttackTimerMs).toBe(state.combat.playerAttackDurationMs - 50)
    expect(state.combat.enemyActionTimerMs).toBe(state.combat.enemyActionDurationMs - 50)
  })

  it('attempts a ready spell immediately when an encounter is already active', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.player.mana = state.player.maxMana
    unlock(state, 'fire-bolt')
    state.activities.autoCast['fire-bolt'] = true
    spawnEnemy(state, 'forest-wisp')
    const mana = state.player.mana

    advance(state, 1, { mode: 'live' })

    expect(state.player.mana).toBe(mana - 12)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(3_499)
  })

  it('reacts to a conditional Auto-Cast at the enemy action timestamp', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.player.maxHealth = 100
    state.player.health = 75
    state.player.mana = state.player.maxMana
    unlock(state, 'flow-mend')
    state.activities.autoCast['flow-mend'] = true
    spawnEnemy(state, 'thornling')
    clearCurrentEnemyAction(state)
    expect(startEnemyAction(state, 'thorn-lash', executeCombatEffects)).toBe(true)
    state.combat.enemyActionTimerMs = 20
    const events: CombatEvent[] = []

    advance(state, 100, { mode: 'live', uiEvents: { push: (event) => events.push(event) } })

    expect(state.player.health).toBe(100)
    expect(state.combat.spellCooldowns['flow-mend']).toBe(9_920)
    expect(events.find((event) => event.sourceId === 'flow-mend' && event.sourceKind === 'spell')).toBeDefined()
  })

  it('advances time without looping or spamming mana failures for a starved Auto-Cast', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    unlock(state, 'fire-bolt')
    state.activities.autoCast['fire-bolt'] = true
    state.player.mana = 0
    spawnEnemy(state, 'forest-wisp')
    const events: CombatEvent[] = []

    advance(state, 1_000, { mode: 'live', uiEvents: { push: (event) => events.push(event) } })

    expect(state.combat.playerAttackTimerMs).toBe(1_200)
    expect(events.filter((event) => event.sourceId === 'spell-cast-failed')).toHaveLength(1)

    state.player.mana = 12
    advance(state, 1_200)
    expect(state.combat.spellCooldowns['fire-bolt']).toBeGreaterThan(0)
    expect(events.filter((event) => event.sourceId === 'spell-cast-failed')).toHaveLength(1)
  })

  it('splits telemetry and Dungeon Statistics at exact death and spawn boundaries', () => {
    const deathState = createInitialState()
    deathState.combat.active = true
    deathState.combat.dungeonId = 'whispering-woods'
    const deathEvents: CombatEvent[] = []
    const deathSink = observerSink(deathEvents)
    combatTelemetryObserver.beginRun('whispering-woods')
    dungeonStatisticsObserver.beginSession('whispering-woods')
    spawnEnemy(deathState, 'forest-wisp', deathSink)
    deathState.combat.enemyHp = 1
    deathState.combat.playerAttackTimerMs = 20

    advance(deathState, 100, { mode: 'live', uiEvents: deathSink, telemetry: combatTelemetryObserver, statistics: dungeonStatisticsObserver })

    expect(useCombatTelemetryStore.getState().run).toMatchObject({ elapsedMs: 100, engagedMs: 20 })
    expect(useDungeonStatisticsStore.getState().session).toMatchObject({ elapsedMs: 100, engagedMs: 20 })
    expect(deathState.combat.encounterTimerMs).toBe(4_920)

    combatTelemetryObserver.clear()
    dungeonStatisticsObserver.clear()
    const spawnState = stateInDowntime(50)
    const spawnEvents: CombatEvent[] = []
    const spawnSink = observerSink(spawnEvents)
    combatTelemetryObserver.beginRun('whispering-woods')
    dungeonStatisticsObserver.beginSession('whispering-woods')

    advance(spawnState, 100, { mode: 'live', uiEvents: spawnSink, telemetry: combatTelemetryObserver, statistics: dungeonStatisticsObserver })

    expect(useCombatTelemetryStore.getState().run).toMatchObject({ elapsedMs: 100, engagedMs: 50 })
    expect(useCombatTelemetryStore.getState().encounter).toMatchObject({ elapsedMs: 50, engagedMs: 50 })
    expect(useDungeonStatisticsStore.getState().session).toMatchObject({ elapsedMs: 100, engagedMs: 50 })
  })

})
