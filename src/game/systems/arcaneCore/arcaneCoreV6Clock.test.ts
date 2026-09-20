import { describe, expect, it } from 'vitest'
import { ARCANE_CORE_BRANCHES } from '../../content/arcaneCore/arcaneCoreBranches'
import { createInitialState } from '../../../store/initialState'
import { advanceArcaneCoreV6RuntimeTime } from './arcaneCoreRuntime'
import { commitArcaneCoreV6SpellCast, getArcaneCoreV6CastModifiers, processArcaneCoreV6CombatEvent } from './arcaneCoreV6Runtime'
import { advanceCombatState } from '../simulation/advanceGameState'

const node = (branch: 'power' | 'vitality' | 'focus' | 'control', name: string, major = false) => ARCANE_CORE_BRANCHES.find((entry) => entry.id === branch)!.nodes.find((candidate) => candidate.name === name && (candidate.nodeType === 'major') === major)!
const context = (overrides: Partial<Parameters<typeof getArcaneCoreV6CastModifiers>[1]> = {}): Parameters<typeof getArcaneCoreV6CastModifiers>[1] => ({ origin: 'auto', spellId: 'fire-bolt', loadoutSlotIndex: 0, damaging: true, manaCost: 30, maxMana: 100, playerMana: 100, enemyHealthPercent: 100, ...overrides })

describe('Arcane Core V6 monotonic combat clock', () => {
  it('advances independently of the encounter downtime countdown', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.encounterTimerMs = 7_000
    advanceCombatState(state, 1_250, { mode: 'live' })
    expect(state.combat.arcaneCoreRuntime.elapsedMs).toBe(1_250)
    expect(state.combat.encounterTimerMs).toBe(5_750)
  })

  it('uses the monotonic clock for cast windows', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('focus', 'Overchannel', true).id] = { rank: 1 }
    state.combat.encounterTimerMs = 0
    commitArcaneCoreV6SpellCast(state, context())
    expect(state.combat.arcaneCoreRuntime.overchannelUntilMs).toBe(5_000)
    expect(state.combat.arcaneCoreRuntime.manaRegenDisabledUntilMs).toBe(5_000)
    advanceArcaneCoreV6RuntimeTime(state, 4_999)
    expect(getArcaneCoreV6CastModifiers(state, context(), false).actionSpeedMultiplier).toBeGreaterThan(1)
    advanceArcaneCoreV6RuntimeTime(state, 2)
    expect(getArcaneCoreV6CastModifiers(state, context(), false).actionSpeedMultiplier).toBe(1)
  })

  it('keeps the clock monotonic and clamps invalid deltas', () => {
    const state = createInitialState()
    advanceArcaneCoreV6RuntimeTime(state, 500)
    advanceArcaneCoreV6RuntimeTime(state, -10)
    advanceArcaneCoreV6RuntimeTime(state, Number.NaN)
    expect(state.combat.arcaneCoreRuntime.elapsedMs).toBe(500)
  })

  it('enforces Pain to Mana internal cooldowns on the V6 clock', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('vitality', 'Pain to Mana').id] = { rank: 1 }
    const context = { healthDamage: 100, eventTarget: 'player' as const, changedActor: 'player' as const }
    processArcaneCoreV6CombatEvent(state, 'player', 'on-damage-taken', context)
    expect(state.combat.arcaneCoreRuntime.lastDamageTakenAtMs).toBe(0)
    advanceArcaneCoreV6RuntimeTime(state, 500)
    processArcaneCoreV6CombatEvent(state, 'player', 'on-damage-taken', context)
    expect(state.combat.arcaneCoreRuntime.lastDamageTakenAtMs).toBe(0)
    advanceArcaneCoreV6RuntimeTime(state, 500)
    processArcaneCoreV6CombatEvent(state, 'player', 'on-damage-taken', context)
    expect(state.combat.arcaneCoreRuntime.lastDamageTakenAtMs).toBe(1_000)
  })

  it('keeps Rapid Escalation inside its three-second cast window', () => {
    const state = createInitialState()
    state.arcaneCore.nodes[node('power', 'Rapid Escalation').id] = { rank: 1 }
    commitArcaneCoreV6SpellCast(state, context())
    advanceArcaneCoreV6RuntimeTime(state, 2_999)
    expect(getArcaneCoreV6CastModifiers(state, context(), true).damageMultiplier).toBeCloseTo(1.02)
    advanceArcaneCoreV6RuntimeTime(state, 2)
    expect(getArcaneCoreV6CastModifiers(state, context(), true).damageMultiplier).toBe(1)
  })
})
