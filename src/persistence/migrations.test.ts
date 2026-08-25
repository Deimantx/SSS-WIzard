import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { createInitialState } from '../store/initialState'

describe('save navigation migration', () => {
  it('maps the old aggregate Tower screen to Channeling', () => {
    const old = { ...createInitialState(), saveVersion: 1, ui: { screen: 'tower' } }
    expect(migrateSave(old).ui.screen).toBe('tower-channeling')
  })

  it('migrates V2 Auto Channel to one Arcane Echo with clean V3 defaults', () => {
    const migrated = migrateSave({ ...createInitialState(), saveVersion: 2, activities: { ...createInitialState().activities, autoChannel: true, channelCooldownMs: 500 } })
    expect(migrated.saveVersion).toBe(3)
    expect(migrated.activities.channeling.echoesAssigned).toBe(1)
    expect(migrated.progress.channeling).toMatchObject({ manaReservoirRank: 0, leylineConduitRank: 0, totalManaGenerated: 0, fiveEchoSustainMs: 0 })
    expect(migrated.progress.channeling.discoveries).toEqual({ 'stable-leyline': false, 'echo-resonance': false, 'deep-reservoir': false })
    expect('autoChannel' in migrated.activities).toBe(false)
    expect('channelCooldownMs' in migrated).toBe(false)
  })
})
