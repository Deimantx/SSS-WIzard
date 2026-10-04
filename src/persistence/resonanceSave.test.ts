import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { serializeGameState } from './profileSaveManager'
import { getCriticalSaveSnapshot, criticalSaveSnapshotsEqual, validateStoredSave } from './saveIntegrity'
import { migrateSave } from './migrations'

describe('save integrity after World Tier removal', () => {
  it('keeps current resonance state valid and omits retired difficulty fields', () => {
    const state = createInitialState()
    state.resonance = { fire: 17, water: 23, earth: 0, air: 91, arcane: 7 }
    const encoded = JSON.stringify(serializeGameState(state))
    expect(encoded).not.toContain('worldTier')
    expect(encoded).not.toContain('enemyWorldTier')
    expect(validateStoredSave(encoded).state?.resonance).toEqual(state.resonance)
  })

  it('discards legacy World Tier fields while preserving unrelated progress', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    const legacy = { ...state, saveVersion: 67, worldTier: { current: 5, highestUnlocked: 5 }, combat: { ...state.combat, enemyWorldTier: 4 }, inventory: { ...state.inventory, 'life-essence': 29 } }
    const migrated = migrateSave(legacy as any)
    expect('worldTier' in migrated).toBe(false)
    expect('enemyWorldTier' in migrated.combat).toBe(false)
    expect(migrated.inventory['life-essence']).toBe(29)
    expect(migrated.progress.bossKillsByBoss['archmage-edrin-shade']).toBe(1)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
  })

  it('includes Resonance in critical save snapshots and requires it for current saves', () => {
    const state = createInitialState()
    const changed = createInitialState()
    changed.resonance.earth = 10
    expect(criticalSaveSnapshotsEqual(getCriticalSaveSnapshot(state), getCriticalSaveSnapshot(changed))).toBe(false)
    expect(validateStoredSave(JSON.stringify({ ...state, resonance: undefined })).ok).toBe(false)
    expect(validateStoredSave(JSON.stringify({ ...serializeGameState(state), resonance: undefined })).ok).toBe(false)
  })
})
