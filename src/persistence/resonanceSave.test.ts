import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { serializeGameState } from './profileSaveManager'
import { getCriticalSaveSnapshot, criticalSaveSnapshotsEqual, validateStoredSave } from './saveIntegrity'
import { migrateSave } from './migrations'

describe('Resonance save migration and integrity', () => {
  it('migrates a pre-Resonance save to zero balances and the current version', () => {
    const state = createInitialState()
    const migrated = migrateSave({ ...state, saveVersion: SAVE_VERSION - 1, resonance: undefined })
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.resonance).toEqual({ fire: 0, water: 0, earth: 0, air: 0 })
  })

  it('preserves valid balances and sanitizes malformed persisted values', () => {
    const state = createInitialState()
    state.resonance = { fire: 17, water: 23, earth: 0, air: 91 }
    const roundTrip = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(roundTrip.resonance).toEqual(state.resonance)
    const malformed = migrateSave({ ...state, saveVersion: SAVE_VERSION, resonance: { fire: -2, water: 3.9, earth: Number.POSITIVE_INFINITY, air: 'bad', unknown: 42 } } as any)
    expect(malformed.resonance).toEqual({ fire: 0, water: 3, earth: 0, air: 0 })
  })

  it('round-trips World Tier state and derives WT2 unlock from a historical Edrin defeat', () => {
    const state = createInitialState()
    state.worldTier = { current: 2, highestUnlocked: 2 }
    const roundTrip = migrateSave(JSON.parse(JSON.stringify(serializeGameState(state))))
    expect(roundTrip.worldTier).toEqual({ current: 2, highestUnlocked: 2 })

    const legacy = { ...state, saveVersion: 39, worldTier: undefined, progress: { ...state.progress, bossKillsByBoss: { ...state.progress.bossKillsByBoss, 'archmage-edrin-shade': 1 } } }
    expect(migrateSave(legacy).worldTier).toEqual({ current: 1, highestUnlocked: 2 })
    const malformed = migrateSave({ ...state, saveVersion: SAVE_VERSION, worldTier: { current: 2, highestUnlocked: 1 } } as any)
    expect(malformed.worldTier).toEqual({ current: 1, highestUnlocked: 1 })
  })

  it('preserves valid WT5 progression and clamps current tier to the saved unlock ceiling', () => {
    const state = createInitialState()
    const wt5 = migrateSave({ ...state, worldTier: { current: 5, highestUnlocked: 5 } } as any)
    expect(wt5.worldTier).toEqual({ current: 5, highestUnlocked: 5 })
    const clamped = migrateSave({ ...state, worldTier: { current: 5, highestUnlocked: 3 } } as any)
    expect(clamped.worldTier).toEqual({ current: 3, highestUnlocked: 3 })
    const unknown = migrateSave({ ...state, worldTier: { current: 9, highestUnlocked: 9 } } as any)
    expect(unknown.worldTier).toEqual({ current: 1, highestUnlocked: 1 })
  })

  it('includes Resonance in critical save snapshots and requires it for current saves', () => {
    const state = createInitialState()
    const changed = createInitialState()
    changed.resonance.earth = 10
    expect(criticalSaveSnapshotsEqual(getCriticalSaveSnapshot(state), getCriticalSaveSnapshot(changed))).toBe(false)
    const encoded = JSON.stringify({ ...state, resonance: undefined })
    expect(validateStoredSave(encoded).ok).toBe(false)
    expect(validateStoredSave(JSON.stringify({ ...state, saveVersion: SAVE_VERSION - 1, resonance: undefined })).ok).toBe(true)
  })
})
