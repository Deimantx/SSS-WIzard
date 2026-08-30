import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CombatLogEvent, CombatUiEventSink } from '../systems/combat/combatTypes'
import { advanceGameState } from '../systems/simulation/advanceGameState'
import { spawnEnemy } from '../systems/combat/combatRuntime'
import { createInitialState } from '../../store/initialState'
import { clearCombatLogUi, combatLogUiSink, useCombatLogStore } from './combatLogStore'

const event = (amount: number, timestampMs = amount): CombatLogEvent => ({
  source: { kind: 'player' },
  target: 'enemy',
  targetMonsterId: 'forest-wisp',
  category: 'damage',
  damageType: 'fire',
  amount,
  timestampMs,
})

describe('combatLogStore', () => {
  beforeEach(() => clearCombatLogUi())
  afterEach(() => clearCombatLogUi())

  it('keeps a newest-first transient ring buffer of 300 events', () => {
    for (let index = 1; index <= 305; index += 1) useCombatLogStore.getState().push(event(index))

    const entries = useCombatLogStore.getState().entries
    expect(entries).toHaveLength(300)
    expect(entries[0].amount).toBe(305)
    expect(entries[entries.length - 1]?.amount).toBe(6)
    expect(entries.every((entry, index) => index === 0 || entry.sequence < entries[index - 1].sequence)).toBe(true)
  })

  it('uses a monotonic sequence and clears only the live UI feed', () => {
    useCombatLogStore.getState().push(event(1))
    const firstSequence = useCombatLogStore.getState().entries[0].sequence
    clearCombatLogUi()
    combatLogUiSink.push({ ...event(2), timestampMs: 2 })
    const nextEntry = useCombatLogStore.getState().entries[0]

    expect(nextEntry.sequence).toBeGreaterThan(firstSequence)
    expect(nextEntry.amount).toBe(2)
    expect(useCombatLogStore.getState().entries).toHaveLength(1)
  })

  it('emits live combat detail while suppressing the same stream in banked simulation', () => {
    const liveState = createInitialState()
    liveState.combat.active = true
    liveState.combat.dungeonId = 'whispering-woods'
    const liveSink: CombatUiEventSink = { push: vi.fn() }
    spawnEnemy(liveState, 'forest-wisp', liveSink)
    liveState.combat.playerAttackTimerMs = 0
    advanceGameState(liveState, 1, { mode: 'live', uiEvents: liveSink })

    const bankedState = createInitialState()
    bankedState.combat.active = true
    bankedState.combat.dungeonId = 'whispering-woods'
    spawnEnemy(bankedState, 'forest-wisp')
    const bankedSink: CombatUiEventSink = { push: vi.fn() }
    advanceGameState(bankedState, 1_000, { mode: 'banked', uiEvents: bankedSink })

    expect(liveSink.push).toHaveBeenCalledWith(expect.objectContaining({ category: 'basic-attack', target: 'enemy', targetMonsterId: 'forest-wisp' }))
    expect(bankedSink.push).not.toHaveBeenCalled()
  })
})
