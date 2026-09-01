import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import type { CombatEvent, CombatEventSink } from './combatTypes'
import type { GameState } from '../../types'
import { executeCombatEffects } from './effectResolver'
import { resolveCombatDeaths, spawnEnemy } from './combatRuntime'
import { combatTelemetrySink, useCombatTelemetryStore } from '../../telemetry/combat/combatTelemetryStore'
import { forceKillEnemyForDebug, fastResolveNormalEnemiesForDebug } from './debugCombatRuntime'
import { castSpellAction } from '../../engine/spellEngine'
import { advanceGameState } from '../simulation/advanceGameState'
import { applyStatus } from './statusRuntime'

const source = { actor: 'player' as const, kind: 'spell' as const, sourceId: 'debug-spell', tags: ['spell' as const, 'direct' as const] }
const enemySource = (state: GameState) => ({ actor: 'enemy' as const, kind: 'basic-attack' as const, sourceId: 'debug-enemy-hit', sourceMonsterId: state.combat.enemyId ?? undefined, sourceInstanceKey: state.combat.enemyInstanceKey ?? undefined, tags: ['basic-attack' as const, 'direct' as const] })
const damage = (value: number, actor: 'player' | 'enemy' = 'player') => ({ type: 'deal-damage' as const, target: 'opponent' as const, damageType: 'physical' as const, magnitude: { type: 'flat' as const, value }, tags: actor === 'player' ? ['spell' as const, 'direct' as const] : ['basic-attack' as const, 'direct' as const] })

const activeState = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  return state
}

describe('Combat Lab immortality and forced-resolution runtime', () => {
  beforeEach(() => useCombatTelemetryStore.getState().clear())

  it('keeps an immortal enemy at one HP while real damage telemetry continues', () => {
    const state = activeState()
    state.debug.enemyImmortal = true
    const events: CombatEvent[] = []
    const sink: CombatEventSink = { push: (event) => { events.push(event); combatTelemetrySink.push(event) } }
    useCombatTelemetryStore.getState().beginRun('whispering-woods')
    spawnEnemy(state, 'forest-wisp', sink)
    state.combat.enemyHp = 1

    executeCombatEffects(state, [damage(500)], source, 0, sink)
    executeCombatEffects(state, [damage(250)], source, 0, sink)
    expect(state.combat.enemyHp).toBe(1)
    expect(resolveCombatDeaths(state, undefined, undefined, sink)).toBe(false)
    expect(events.filter((event) => event.sourceId === 'debug-spell')).toHaveLength(2)
    expect(useCombatTelemetryStore.getState().run?.player.damageDone.total).toBeCloseTo(500 * 1.5 * (1 - 10 / 110) + 250 * (1 - 10 / 110))
    expect(events.some((event) => event.sourceId === 'enemy-defeated')).toBe(false)
  })

  it('keeps an immortal player at one HP while incoming damage remains measurable', () => {
    const state = activeState()
    state.debug.playerImmortal = true
    const events: CombatEvent[] = []
    const sink: CombatEventSink = { push: (event) => { events.push(event); combatTelemetrySink.push(event) } }
    useCombatTelemetryStore.getState().beginRun('whispering-woods')
    spawnEnemy(state, 'forest-wisp', sink)
    state.player.health = 1

    executeCombatEffects(state, [damage(500, 'enemy')], enemySource(state), 0, sink)
    expect(state.player.health).toBe(1)
    expect(resolveCombatDeaths(state, undefined, undefined, sink)).toBe(false)
    expect(useCombatTelemetryStore.getState().run?.player.damageTaken.total).toBeCloseTo(500 * 1.5 * (1 - 10 / 110))
    expect(events.some((event) => event.sourceId === 'player-defeated')).toBe(false)
  })

  it('consumes barriers before applying immortal HP protection', () => {
    const state = activeState()
    state.debug.enemyImmortal = true
    const events: CombatEvent[] = []
    const sink: CombatEventSink = { push: (event) => events.push(event) }
    spawnEnemy(state, 'forest-wisp', sink)
    state.combat.enemyHp = 1
    state.combat.enemyBarrier = 100
    executeCombatEffects(state, [damage(250)], source, 0, sink)
    const event = events.find((candidate) => candidate.sourceId === 'debug-spell')
    expect(state.combat.enemyBarrier).toBe(0)
    expect(state.combat.enemyHp).toBe(1)
    expect(event?.amount).toBeCloseTo(250 * 1.5 * (1 - 10 / 110))
    expect(event?.healthDamage).toBeCloseTo(250 * 1.5 * (1 - 10 / 110) - 100)
    expect(event).toMatchObject({ barrierAbsorbed: 100 })
  })

  it('protects an immortal enemy from lethal periodic status damage', () => {
    const state = activeState()
    state.debug.enemyImmortal = true
    const events: CombatEvent[] = []
    spawnEnemy(state, 'forest-wisp', { push: (event) => events.push(event) })
    state.combat.enemyHp = 1
    applyStatus(state, 'enemy', 'burning', { actor: 'player', kind: 'spell', sourceId: 'debug-dot' })

    advanceGameState(state, 1_000, { mode: 'live', uiEvents: { push: (event) => events.push(event) } })

    expect(state.combat.enemyHp).toBe(1)
    expect(state.combat.enemyId).toBe('forest-wisp')
    expect(events.some((event) => event.sourceId === 'burning' && event.category === 'damage')).toBe(true)
    expect(events.some((event) => event.sourceId === 'enemy-defeated')).toBe(false)
  })

  it('lets forced developer kills bypass enemy immortality and preserve the toggle', () => {
    const state = activeState()
    state.debug.enemyImmortal = true
    spawnEnemy(state, 'forest-wisp')
    expect(forceKillEnemyForDebug(state)).toBe(true)
    expect(state.combat.enemyId).toBeNull()
    expect(state.debug.enemyImmortal).toBe(true)
  })

  it('fast-resolves normal enemies through progression and stops at authored boss threat', () => {
    const state = activeState()
    const result = fastResolveNormalEnemiesForDebug(state, 100, 'howling-den', true)
    expect(result.resolved).toBe(25)
    expect(state.combat.threatCleared).toBe(25)
    expect(state.progress.lifetimeKills).toBe(25)
    expect(state.combat.enemyId).toBeNull()
  })

  it('allows infinite mana and ignores spell cooldowns without unlocking spells', () => {
    const state = activeState()
    state.progress.spellRanks['fire-bolt'] = 1
    spawnEnemy(state, 'forest-wisp')
    state.player.mana = 0
    state.debug.infiniteMana = true
    state.debug.ignoreSpellCooldowns = true
    expect(castSpellAction(state, 'fire-bolt')).toBe(true)
    expect(castSpellAction(state, 'fire-bolt')).toBe(true)
    expect(state.player.mana).toBe(0)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(castSpellAction(state, 'fireball')).toBe(false)
  })

  it('pauses and scales only the Combat clock', () => {
    const paused = activeState()
    spawnEnemy(paused, 'forest-wisp')
    paused.debug.combatPaused = true
    const pausedPlayerTimer = paused.combat.playerAttackTimerMs
    const pausedEnemyTimer = paused.combat.enemyActionTimerMs
    const pausedMana = paused.player.mana
    advanceGameState(paused, 1000, { mode: 'live' })
    expect(paused.combat.playerAttackTimerMs).toBe(pausedPlayerTimer)
    expect(paused.combat.enemyActionTimerMs).toBe(pausedEnemyTimer)
    expect(paused.player.mana).toBeGreaterThan(pausedMana)

    const normal = activeState()
    const fast = activeState()
    spawnEnemy(normal, 'forest-wisp')
    spawnEnemy(fast, 'forest-wisp')
    fast.debug.combatTimeScale = 5
    const normalTimer = normal.combat.playerAttackTimerMs
    const fastTimer = fast.combat.playerAttackTimerMs
    const normalEvents: CombatEvent[] = []
    const fastEvents: CombatEvent[] = []
    advanceGameState(normal, 1000, { mode: 'live', uiEvents: { push: (event) => normalEvents.push(event) } })
    advanceGameState(fast, 1000, { mode: 'live', uiEvents: { push: (event) => fastEvents.push(event) } })
    expect(normal.combat.playerAttackTimerMs).toBe(normalTimer - 1000)
    expect(fastEvents.filter((event) => event.source.kind === 'player' && event.category === 'basic-attack').length).toBeGreaterThan(normalEvents.filter((event) => event.source.kind === 'player' && event.category === 'basic-attack').length)
    expect(fastTimer).toBe(normalTimer)
    expect(normal.player.mana).toBe(fast.player.mana)
  })

  it('freezes player and enemy automatic actions independently', () => {
    const playerFrozen = activeState()
    const playerEvents: CombatEvent[] = []
    spawnEnemy(playerFrozen, 'forest-wisp')
    playerFrozen.combat.enemyMaxHp = 10_000
    playerFrozen.combat.enemyHp = 10_000
    playerFrozen.debug.freezePlayerActions = true
    const playerTimer = playerFrozen.combat.playerAttackTimerMs
    const enemyTimer = playerFrozen.combat.enemyActionTimerMs
    advanceGameState(playerFrozen, 1_000, { mode: 'live', uiEvents: { push: (event) => playerEvents.push(event) } })
    expect(playerFrozen.combat.playerAttackTimerMs).toBe(playerTimer)
    expect(playerFrozen.combat.enemyActionTimerMs).toBeLessThan(enemyTimer)
    expect(playerEvents.some((event) => event.category === 'basic-attack' && event.source.kind === 'player')).toBe(false)

    const enemyFrozen = activeState()
    const enemyEvents: CombatEvent[] = []
    spawnEnemy(enemyFrozen, 'forest-wisp')
    enemyFrozen.combat.enemyMaxHp = 10_000
    enemyFrozen.combat.enemyHp = 10_000
    enemyFrozen.debug.freezeEnemyActions = true
    enemyFrozen.combat.playerAttackTimerMs = 1
    const frozenEnemyTimer = enemyFrozen.combat.enemyActionTimerMs
    advanceGameState(enemyFrozen, 1_000, { mode: 'live', uiEvents: { push: (event) => enemyEvents.push(event) } })
    expect(enemyFrozen.combat.enemyActionTimerMs).toBe(frozenEnemyTimer)
    expect(enemyEvents.some((event) => event.category === 'basic-attack' && event.source.kind === 'player')).toBe(true)
  })
})
