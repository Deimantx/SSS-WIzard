import { describe, expect, it } from 'vitest'
import { createInitialState } from '../store/initialState'
import { migrateSave } from './migrations'
import { serializeGameState } from './profileSaveManager'

describe('Combat debug save safety', () => {
  it('does not serialize runtime overrides or legacy godMode', () => {
    const state = createInitialState()
    state.debug.playerImmortal = true
    state.debug.enemyImmortal = true
    state.debug.combatTimeScale = 10
    state.player.godMode = true
    const serialized = serializeGameState(state)
    expect(serialized).not.toHaveProperty('debug')
    expect(serialized.player.godMode).toBe(false)
  })

  it('disables legacy and runtime immortality values when hydrating a profile', () => {
    const state = createInitialState()
    const migrated = migrateSave({ ...state, player: { ...state.player, godMode: true }, debug: { ...state.debug, playerImmortal: true, enemyImmortal: true } })
    expect(migrated.player.godMode).toBe(false)
    expect(migrated.debug.playerImmortal).toBe(false)
    expect(migrated.debug.enemyImmortal).toBe(false)
  })
})
