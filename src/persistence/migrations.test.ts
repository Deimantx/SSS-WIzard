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

  it('preserves dynamic content records that are absent from the initial state', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 4,
      inventory: { 'apprentice-wand': 1, 'fire-fragment': 37, 'life-essence': 9, 'removed-item': 12 },
      protectedItems: { 'apprentice-wand': true, 'fire-fragment': true, 'removed-item': true },
      progress: {
        ...initial.progress,
        requestProgress: { 'arcane-supply': 7, 'removed-request': 99 },
        requestClaims: { 'arcane-supply': true, 'removed-request': true },
        permanentFocusBonuses: { 'forest-heart': 10, 'guild-apprentice': 10, 'removed-reward': 40 },
        lifetimeKillsByMonster: { 'forest-wisp': 12, 'thornling': 3, 'removed-monster': 100 },
        bossKillsByBoss: { 'grove-sentinel': 2, 'forest-heart': 1, 'removed-boss': 100 },
        autoHuntBossByDungeon: { 'whispering-woods': true, 'removed-dungeon': true },
      },
      combat: { ...initial.combat, enemySpecialUsed: { 'ancient-growth': true, 'living-core': false, 'removed-special': true } },
    })

    expect(migrated.inventory).toMatchObject({ 'fire-fragment': 37, 'life-essence': 9 })
    expect(migrated.protectedItems['fire-fragment']).toBe(true)
    expect(migrated.progress.requestProgress).toEqual({ 'arcane-supply': 7 })
    expect(migrated.progress.requestClaims).toEqual({ 'arcane-supply': true })
    expect(migrated.progress.permanentFocusBonuses).toEqual({ 'forest-heart': 10, 'guild-apprentice': 10 })
    expect(migrated.progress.lifetimeKillsByMonster).toEqual({ 'forest-wisp': 12, thornling: 3 })
    expect(migrated.progress.bossKillsByBoss).toEqual({ 'grove-sentinel': 2, 'forest-heart': 1 })
    expect(migrated.progress.autoHuntBossByDungeon).toEqual({ 'whispering-woods': true })
    expect(migrated.combat.enemySpecialUsed).toEqual({ 'ancient-growth': true, 'living-core': false })
    expect(migrated.inventory).not.toHaveProperty('removed-item')
  })

  it('sanitizes dynamic values without wiping valid item keys', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 4,
      inventory: { 'fire-fragment': 12.9, 'life-essence': -4, 'water-fragment': Number.NaN },
      progress: { ...initial.progress, lifetimeKillsByMonster: { 'forest-wisp': 6.8 } },
    })

    expect(migrated.inventory['fire-fragment']).toBe(12)
    expect(migrated.inventory['life-essence']).toBe(0)
    expect(migrated.inventory).not.toHaveProperty('water-fragment')
    expect(migrated.progress.lifetimeKillsByMonster['forest-wisp']).toBe(6)
  })
})
