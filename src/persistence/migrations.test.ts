import { describe, expect, it } from 'vitest'
import { migrateSave } from './migrations'
import { createInitialState } from '../store/initialState'

describe('save navigation migration', () => {
  it('maps the old aggregate Tower screen to Channeling', () => {
    const old = { ...createInitialState(), saveVersion: 1, ui: { screen: 'tower' } }
    expect(migrateSave(old).ui.screen).toBe('tower-channeling')
  })

  it('migrates V2 Auto Channel to one Arcane Echo with clean V4 defaults', () => {
    const migrated = migrateSave({ ...createInitialState(), saveVersion: 2, activities: { ...createInitialState().activities, autoChannel: true, channelCooldownMs: 500 } })
    expect(migrated.saveVersion).toBe(4)
    expect(migrated.activities.channeling.echoesAssigned).toBe(1)
    expect(migrated.progress.channeling.pillars['arcane-reservoir']).toMatchObject({ rank: 1, level: 0 })
    expect(migrated.progress.channeling.pillars['leyline-conduit']).toMatchObject({ rank: 1, level: 0 })
    expect(migrated.progress.channeling.totalManaGenerated).toBe(0)
    expect(migrated.progress.channeling.fiveEchoSustainMs).toBe(0)
    expect(migrated.progress.channeling.discoveries).toEqual({ 'stable-leyline': false, 'echo-resonance': false, 'deep-reservoir': false })
    expect('autoChannel' in migrated.activities).toBe(false)
    expect('channelCooldownMs' in migrated).toBe(false)
  })

  it('migrates V3 ranks into the matching Rank I Pillars and preserves Discoveries', () => {
    const old = { ...createInitialState(), saveVersion: 3, progress: { ...createInitialState().progress, channeling: { manaReservoirRank: 4, leylineConduitRank: 3, totalManaGenerated: 120, fiveEchoSustainMs: 5000, discoveries: { 'stable-leyline': true, 'echo-resonance': false, 'deep-reservoir': true } } } }
    const migrated = migrateSave(old)
    expect(migrated.saveVersion).toBe(4)
    expect(migrated.progress.channeling.pillars['arcane-reservoir']).toEqual({ rank: 1, level: 4 })
    expect(migrated.progress.channeling.pillars['leyline-conduit']).toEqual({ rank: 1, level: 3 })
    expect(migrated.progress.channeling.pillars['mana-resonance']).toEqual({ rank: 1, level: 0 })
    expect(migrated.progress.channeling.totalManaGenerated).toBe(120)
    expect(migrated.progress.channeling.discoveries['deep-reservoir']).toBe(true)
    expect('manaReservoirRank' in migrated.progress.channeling).toBe(false)
  })
})
