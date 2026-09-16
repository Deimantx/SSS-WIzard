import { describe, expect, it } from 'vitest'
import { getItemDropSources } from './contentRelations'
import { ARTIFACTS, isArtifactId } from './artifacts/artifacts'
import { DUNGEONS, DUNGEON_ORDER } from './dungeons/dungeons'
import { DUNGEON_LOOT, validateDungeonLootDefinitions } from './dungeons/dungeonLoot'
import { ARTIFACT_EQUIPMENT_IDS, getEquipmentIdsForDungeon, getEquipmentOrigin } from './equipment/equipmentSets'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions } from './monsters'
import { ARTIFICING_RECIPES } from './recipes/artificingRecipes'
import { RECIPES, validateRecipeDefinitions } from './recipes/recipes'
import { createInitialState } from '../../store/initialState'
import { isRecipeUnlocked } from './recipes/recipeUnlocks'

describe('dungeon loot and equipment ownership', () => {
  it('keeps dungeon loot material-only and validates all authored tables', () => {
    expect(validateDungeonLootDefinitions()).toEqual([])
    expect(validateMonsterDefinitions()).toEqual([])
    expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).every((drop) => ITEMS[drop.itemId]?.kind !== 'equipment')).toBe(true)
    expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).some((drop) => isArtifactId(drop.itemId))).toBe(false)
  })

  it('gives each normal monster and boss its authored material baseline', () => {
    DUNGEON_ORDER.forEach((dungeonId) => {
      const dungeon = DUNGEONS[dungeonId]
      dungeon.monsterPool.forEach((monsterId) => {
        const drop = MONSTERS[monsterId].loot.find((entry) => entry.itemId === 'artifact-essence')
        expect(drop).toEqual({ itemId: 'artifact-essence', min: DUNGEON_LOOT[dungeonId].artifactEssence.normal[0], max: DUNGEON_LOOT[dungeonId].artifactEssence.normal[1], chance: 1 })
        expect(MONSTERS[monsterId].loot.some((entry) => entry.itemId === 'life-essence')).toBe(true)
      })
      const bossDrop = MONSTERS[dungeon.boss].loot.find((entry) => entry.itemId === 'artifact-essence')
      expect(bossDrop).toEqual({ itemId: 'artifact-essence', min: DUNGEON_LOOT[dungeonId].artifactEssence.boss[0], max: DUNGEON_LOOT[dungeonId].artifactEssence.boss[1], chance: 1 })
      expect(MONSTERS[dungeon.boss].loot.some((entry) => entry.itemId === 'life-essence')).toBe(true)
    })
  })

  it('removes dungeon Equipment pools while keeping Artifact crafting one-to-one', () => {
    expect(ARTIFACT_EQUIPMENT_IDS).toHaveLength(12)
    expect(DUNGEON_ORDER.every((dungeonId) => getEquipmentIdsForDungeon(dungeonId).length === 0)).toBe(true)
    expect(getEquipmentOrigin('ember-staff')).toBeNull()
    expect(Object.keys(ARTIFICING_RECIPES)).toEqual(expect.arrayContaining(ARTIFACT_EQUIPMENT_IDS))
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
