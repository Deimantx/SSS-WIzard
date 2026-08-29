import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { migrateSave } from './migrations'
import { serializeGameState } from './profileSaveManager'

describe('V16 spell progression migration', () => {
  it('converts old unlockedSpells to Rank I without relocking old Lv4 progress', () => {
    const initial = createInitialState()
    const old = {
      ...initial,
      saveVersion: 15,
      schools: { ...initial.schools, water: { level: 4, xp: 70 } },
      progress: { ...initial.progress, magicLevelCap: 10, spellRanks: {}, unlockedSpells: ['fire-bolt', 'ignite', 'flow-mend'] },
    }
    const migrated = migrateSave(old)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.progress.spellRanks).toMatchObject({ 'fire-bolt': 1, ignite: 1, 'flow-mend': 1 })
    expect(migrated.progress.magicLevelCap).toBe(20)
    const serialized = serializeGameState(migrated)
    expect(serialized.progress).not.toHaveProperty('unlockedSpells')
    expect(serialized.progress.spellRanks).toMatchObject({ 'flow-mend': 1 })
  })

  it('seeds newly authored Lv16 spells for qualifying old schools and preserves a higher cap', () => {
    const initial = createInitialState()
    const migrated = migrateSave({
      ...initial,
      saveVersion: 15,
      progress: { ...initial.progress, magicLevelCap: 60, spellRanks: {}, bossKillsByBoss: {} },
      schools: { ...initial.schools, air: { level: 16, xp: 320 } },
    })
    expect(migrated.progress.spellRanks['shock-spark']).toBe(1)
    expect(migrated.progress.magicLevelCap).toBe(60)
  })

  it('raises migrated cap for Edrin evidence but not for Forest Heart alone', () => {
    const initial = createInitialState()
    const forest = migrateSave({ ...initial, saveVersion: 15, progress: { ...initial.progress, magicLevelCap: 10, bossKillsByBoss: { 'forest-heart': 1 } } })
    const edrin = migrateSave({ ...initial, saveVersion: 15, progress: { ...initial.progress, magicLevelCap: 20, bossKillsByBoss: { 'archmage-edrin-shade': 1 } } })
    expect(forest.progress.magicLevelCap).toBe(20)
    expect(edrin.progress.magicLevelCap).toBe(40)
  })
})
