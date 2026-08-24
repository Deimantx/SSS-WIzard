import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { createInitialState } from '../store/initialState'

describe('save navigation migration', () => {
  it('maps the old aggregate Tower screen to Channeling', () => {
    const old = { ...createInitialState(), saveVersion: 1, ui: { screen: 'tower' } }
    expect(migrateSave(old).ui.screen).toBe('tower-channeling')
  })
})
