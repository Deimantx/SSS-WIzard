import { describe, expect, it } from 'vitest'
import { createInitialState, SAVE_VERSION } from '../store/initialState'
import { ARCANE_CORE_TOTAL_TREE_COST, getArcaneCoreTotalXpForLevel } from '../game/content/arcaneCore/arcaneCoreBalance'
import { migrateSave } from './migrations'

describe('Arcane Core V6 migration', () => {
  it('converts V36 XP completion into available V6 Arcane Points and clears allocations', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 36, arcaneCore: { totalXp: getArcaneCoreTotalXpForLevel(2), nodes: { 'power-r1-arcane-force': { rank: 1 } } } } as any)
    expect(migrated.saveVersion).toBe(SAVE_VERSION)
    expect(migrated.arcaneCore).toEqual({ totalPointsEarned: Math.round(ARCANE_CORE_TOTAL_TREE_COST / 1376), nodes: {} })
    expect(migrated.arcaneCore).not.toHaveProperty('totalXp')
  })

  it('uses malformed legacy spent ranks as a floor without creating a negative wallet', () => {
    const initial = createInitialState()
    const migrated = migrateSave({ ...initial, saveVersion: 36, arcaneCore: { totalXp: 0, nodes: { 'power-r1-arcane-force': { rank: 5, coreSpent: 99999 } }, corePoints: -20 } } as any)
    expect(migrated.arcaneCore.totalPointsEarned).toBe(ARCANE_CORE_TOTAL_TREE_COST)
    expect(migrated.arcaneCore.nodes).toEqual({})
  })
})
