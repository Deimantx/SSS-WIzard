import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { migrateSave } from './migrations'

describe('Combat V2 save migration', () => {
  it('migrates the prior canonical save version without losing active combat state', () => {
    const initial = createInitialState()
    const old = { ...initial, saveVersion: SAVE_VERSION - 1, combat: { ...initial.combat, active: true, dungeonId: 'whispering-woods' as const, enemyId: 'forest-wisp' as const, enemyHp: 17, enemyMaxHp: 200 } }
    const migrated = migrateSave(old)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.combat).toMatchObject({ active: true, dungeonId: 'whispering-woods', enemyId: 'forest-wisp', enemyHp: 17 })
    expect(migrated.combat.elementalDamageReductions).toEqual([])
  })

  it('validates and retains bounded elemental Ward state in the current schema', () => {
    const initial = createInitialState()
    const current = migrateSave({ ...initial, combat: { ...initial.combat, active: true, elementalDamageReductions: [
      { element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 5000 },
      { element: 'unknown', reduction: 0.15, sourceId: 'bad' },
      { element: 'water', reduction: 1, sourceId: 'immune' },
    ] } } as never)
    expect(current.combat.elementalDamageReductions).toEqual([{ element: 'fire', reduction: 0.15, sourceId: 'fire-ward', expiresAt: 5000, durationMs: 20_000 }])
  })

  it('opens the elemental frontier for players with progress from before this tutorial', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 55, progress: { ...initial.progress, lifetimeKills: 12 } })
    expect(migrated.progress.chronicle.eventFlags['elemental-tutorial-zones-opened']).toBe(true)
  })
})
