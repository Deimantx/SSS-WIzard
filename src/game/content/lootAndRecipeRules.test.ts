import { describe, expect, it } from 'vitest'
import { getItemDropSources } from './contentRelations'
import { ARTIFACTS, isArtifactId } from './artifacts/artifacts'
import { DUNGEONS, DUNGEON_ORDER } from './dungeons/dungeons'
import { ARTIFACT_EQUIPMENT_IDS, getEquipmentIdsForDungeon, getEquipmentOrigin } from './equipment/equipmentSets'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions } from './monsters'
import { ARTIFICING_RECIPES } from './recipes/artificingRecipes'
import { RECIPES, validateRecipeDefinitions } from './recipes/recipes'
import { createInitialState } from '../../store/initialState'
import { isRecipeUnlocked } from './recipes/recipeUnlocks'

describe('dungeon loot and equipment ownership', () => {
  it('keeps authored monster loot material-only and validates all authored tables', () => {
    expect(validateMonsterDefinitions()).toEqual([])
    expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).every((drop) => ITEMS[drop.itemId]?.kind !== 'equipment')).toBe(true)
    expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).some((drop) => isArtifactId(drop.itemId))).toBe(false)
    expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).some((drop) => drop.itemId === 'life-essence' || drop.itemId === 'artifact-essence')).toBe(false)
  })

  it('keeps every current monster on the authored non-currency loot path', () => {
    DUNGEON_ORDER.forEach((dungeonId) => {
      const dungeon = DUNGEONS[dungeonId]
      dungeon.monsterPool.forEach((monsterId) => expect(MONSTERS[monsterId].loot.every((entry) => entry.itemId !== 'life-essence' && entry.itemId !== 'artifact-essence')).toBe(true))
      expect(MONSTERS[dungeon.boss].loot.every((entry) => entry.itemId !== 'life-essence' && entry.itemId !== 'artifact-essence')).toBe(true)
    })
  })

  it('removes dungeon Equipment pools while keeping Artifact crafting one-to-one', () => {
    expect(ARTIFACT_EQUIPMENT_IDS).toHaveLength(12)
    expect(DUNGEON_ORDER.every((dungeonId) => getEquipmentIdsForDungeon(dungeonId).length === 0)).toBe(true)
    expect(getEquipmentOrigin('ember-staff')).toBeNull()
    expect(Object.keys(ARTIFICING_RECIPES)).toEqual(expect.arrayContaining([...ARTIFACT_EQUIPMENT_IDS]))
    expect(Object.values(ARTIFACTS).every((artifact) => ARTIFICING_RECIPES[artifact.id].output.itemId === artifact.id)).toBe(true)
    expect(validateRecipeDefinitions()).toEqual([])
    expect(RECIPES['windthread-wand']).toBeDefined()
  })

  it('keeps gated Act 1 Artifact recipes gated by their authored boss', () => {
    const state = createInitialState()
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(false)
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(true)
    expect(getItemDropSources('galeshard-staff')).toEqual([])
  })
})
