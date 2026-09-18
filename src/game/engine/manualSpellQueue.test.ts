import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../store/initialState'
import { requestManualSpell } from './spellEngine'
import { resolveCombatDeaths, spawnEnemy } from '../systems/combat/combatRuntime'
import { advanceGameState } from '../systems/simulation/advanceGameState'

const stateWithSpells = (...spellIds: string[]) => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.player.maxHealth = 100_000
  state.player.health = 100_000
  state.player.maxMana = 1_000
  state.player.mana = 1_000
  spellIds.forEach((spellId) => { state.progress.spellRanks[spellId as keyof typeof state.progress.spellRanks] = 1 })
  spawnEnemy(state, 'forest-wisp')
  state.combat.enemyMaxHp = 100_000
  state.combat.enemyHp = 100_000
  return state
}

describe('manual Spell queue and interrupt control', () => {
  it('starts a ready manual Spell immediately', () => {
    const state = stateWithSpells('fire-bolt')
    expect(requestManualSpell(state, 'fire-bolt')).toEqual({ ok: true, action: 'started' })
    expect(state.combat.pendingPlayerSpellCast?.spellId).toBe('fire-bolt')
    expect(state.combat.queuedPlayerSpellId).toBeNull()
  })

  it('interrupts a different current Spell without successful-cast consequences', () => {
    const state = stateWithSpells('fire-bolt', 'wind-blade')
    expect(requestManualSpell(state, 'fire-bolt')).toMatchObject({ ok: true, action: 'started' })
    const manaBefore = state.player.mana
    state.combat.pendingPlayerSpellCast!.remainingWorkMs = 700
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'interrupted-and-started' })
    expect(state.combat.pendingPlayerSpellCast).toMatchObject({ spellId: 'wind-blade', remainingWorkMs: 650 })
    expect(state.player.mana).toBe(manaBefore)
    expect(state.combat.spellCooldowns['fire-bolt']).toBe(0)
    expect(state.combat.enemyHp).toBe(100_000)
  })

  it('does not restart the exact Spell already being cast', () => {
    const state = stateWithSpells('fire-bolt')
    expect(requestManualSpell(state, 'fire-bolt')).toMatchObject({ ok: true, action: 'started' })
    state.combat.pendingPlayerSpellCast!.remainingWorkMs = 437
    expect(requestManualSpell(state, 'fire-bolt')).toEqual({ ok: true, action: 'already-casting' })
    expect(state.combat.pendingPlayerSpellCast?.remainingWorkMs).toBe(437)
  })

  it('queues a cooldown Spell and starts it at the exact cooldown boundary after the current cast', () => {
    const state = stateWithSpells('fire-bolt', 'wind-blade')
    expect(requestManualSpell(state, 'fire-bolt')).toMatchObject({ ok: true, action: 'started' })
    state.combat.spellCooldowns['wind-blade'] = 1_500
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'queued' })

    advanceGameState(state, 1_000, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast).toBeNull()
    expect(state.combat.queuedPlayerSpellId).toBe('wind-blade')

    advanceGameState(state, 500, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast?.spellId).toBe('wind-blade')
    expect(state.combat.queuedPlayerSpellId).toBeNull()
  })

  it('keeps a manual queue ahead of Auto-Cast while waiting for cooldown', () => {
    const state = stateWithSpells('fire-bolt', 'wind-blade')
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCastPriority = ['fire-bolt']
    state.combat.spellCooldowns['wind-blade'] = 300
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'queued' })
    advanceGameState(state, 200, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast).toBeNull()
    expect(state.combat.queuedPlayerSpellId).toBe('wind-blade')
    advanceGameState(state, 100, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast?.spellId).toBe('wind-blade')
  })

  it('keeps a queued Spell while Mana is short and starts it after funding', () => {
    const state = stateWithSpells('wind-blade')
    state.player.mana = 0
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'queued' })
    advanceGameState(state, 200, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast).toBeNull()
    expect(state.combat.queuedPlayerSpellId).toBe('wind-blade')

    state.player.mana = 100
    advanceGameState(state, 1, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast?.spellId).toBe('wind-blade')
    expect(state.combat.queuedPlayerSpellId).toBeNull()
  })

  it('replaces a queued Spell and clicking it again cancels the queue', () => {
    const state = stateWithSpells('wind-blade', 'thunderstrike')
    state.combat.spellCooldowns['wind-blade'] = 1_000
    state.combat.spellCooldowns.thunderstrike = 2_000
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'queued' })
    expect(requestManualSpell(state, 'thunderstrike')).toEqual({ ok: true, action: 'queued' })
    expect(state.combat.queuedPlayerSpellId).toBe('thunderstrike')
    expect(requestManualSpell(state, 'thunderstrike')).toEqual({ ok: true, action: 'queue-cancelled' })
    expect(state.combat.queuedPlayerSpellId).toBeNull()
  })

  it('keeps the manual queue through enemy death and gives it first chance on the next enemy', () => {
    const state = stateWithSpells('fire-bolt', 'wind-blade')
    state.combat.spellCooldowns['wind-blade'] = 500
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'queued' })
    state.combat.enemyHp = 0
    advanceGameState(state, 100, { mode: 'live' })
    expect(state.combat.queuedPlayerSpellId).toBe('wind-blade')
    state.combat.spellCooldowns['wind-blade'] = 0
    spawnEnemy(state, 'thornling')
    advanceGameState(state, 100, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast?.spellId).toBe('wind-blade')
  })

  it('clears the manual queue when the player is defeated', () => {
    const state = stateWithSpells('wind-blade')
    state.combat.spellCooldowns['wind-blade'] = 1_000
    expect(requestManualSpell(state, 'wind-blade')).toEqual({ ok: true, action: 'queued' })
    state.player.health = 0
    expect(resolveCombatDeaths(state)).toBe(true)
    expect(state.combat.queuedPlayerSpellId).toBeNull()
  })

  it('completes a self-only Mending Waters cast during encounter downtime', () => {
    const state = stateWithSpells('mending-waters')
    state.combat.enemyHp = 0
    expect(resolveCombatDeaths(state)).toBe(true)
    state.player.health = 25

    expect(requestManualSpell(state, 'mending-waters')).toEqual({ ok: true, action: 'started' })
    expect(state.combat.pendingPlayerSpellCast?.targetInstanceKey).toBeNull()

    advanceGameState(state, 1_000, { mode: 'live' })
    advanceGameState(state, 600, { mode: 'live' })

    expect(state.combat.pendingPlayerSpellCast).toBeNull()
    expect(state.player.health).toBeGreaterThan(25)
    expect(state.player.mana).toBe(950)
    expect(state.combat.spellCooldowns['mending-waters']).toBe(10_000)
  })

  it('completes a self-only Stone Skin cast during encounter downtime', () => {
    const state = stateWithSpells('stone-skin')
    state.combat.enemyHp = 0
    expect(resolveCombatDeaths(state)).toBe(true)

    expect(requestManualSpell(state, 'stone-skin')).toEqual({ ok: true, action: 'started' })
    advanceGameState(state, 1_000, { mode: 'live' })
    advanceGameState(state, 500, { mode: 'live' })

    expect(state.combat.pendingPlayerSpellCast).toBeNull()
    expect(state.combat.playerStatuses.some((status) => status.statusId === 'stone-skin')).toBe(true)
  })

  it('keeps an enemy-target queue parked during downtime and starts it after spawn', () => {
    const state = stateWithSpells('fire-bolt')
    state.combat.enemyHp = 0
    expect(resolveCombatDeaths(state)).toBe(true)

    expect(requestManualSpell(state, 'fire-bolt')).toEqual({ ok: true, action: 'queued' })
    advanceGameState(state, 1_000, { mode: 'live' })
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.pendingPlayerSpellCast).toBeNull()
    expect(state.combat.queuedPlayerSpellId).toBe('fire-bolt')

    spawnEnemy(state, 'thornling')
    advanceGameState(state, 1, { mode: 'live' })
    expect(state.combat.pendingPlayerSpellCast?.spellId).toBe('fire-bolt')
  })
})
