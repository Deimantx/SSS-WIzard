import { describe, expect, it } from 'vitest'
import { getItemDropSources } from './contentRelations'
import { ARTIFACTS, isArtifactId } from './artifacts/artifacts'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER, hasBossEncounter } from './combat-locations/worldNavigation'
import { ARTIFACT_ITEM_ORDER } from './artifacts/artifacts'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions, validateMonsterLootDrop } from './monsters'
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

  it('validates future direct material, equipment, and unique categories against item kinds', () => {
    const itemKinds = { 'fire-fragment': { kind: 'material' }, 'ember-staff': { kind: 'equipment' }, 'black-portal-shard': { kind: 'artifact' } }
    const drop = (category: 'material' | 'equipment' | 'unique', itemId: 'fire-fragment' | 'ember-staff' | 'black-portal-shard', minLootTier = 20) => ({ itemId, category, baseChance: .02, quantity: { min: 1, max: 1 }, minLootTier })
    expect(validateMonsterLootDrop('fixture', drop('material', 'fire-fragment'), itemKinds)).toEqual([])
    expect(validateMonsterLootDrop('fixture', drop('equipment', 'ember-staff'), itemKinds)).toEqual([])
    expect(validateMonsterLootDrop('fixture', drop('unique', 'fire-fragment'), itemKinds)).toEqual([])
    expect(validateMonsterLootDrop('fixture', drop('unique', 'ember-staff'), itemKinds)).toEqual([])
    expect(validateMonsterLootDrop('fixture', drop('material', 'ember-staff'), itemKinds).some((error) => error.includes('requires material item'))).toBe(true)
    expect(validateMonsterLootDrop('fixture', drop('equipment', 'fire-fragment'), itemKinds).some((error) => error.includes('requires equipment item'))).toBe(true)
    expect(validateMonsterLootDrop('fixture', drop('unique', 'black-portal-shard'), itemKinds).some((error) => error.includes('requires material or equipment'))).toBe(true)
    expect(validateMonsterLootDrop('fixture', drop('material', 'fire-fragment', 21), itemKinds).some((error) => error.includes('invalid minimum loot tier'))).toBe(true)
    expect(validateMonsterLootDrop('fixture', drop('material', 'fire-fragment', 21), itemKinds, new Set([1, 20, 21]))).toEqual([])
    expect(validateMonsterLootDrop('fixture', { ...drop('unique', 'fire-fragment'), category: 'sigil' } as never, itemKinds).some((error) => error.includes('dedicated reward system'))).toBe(true)
  })

  it('keeps every current monster on the authored non-currency loot path', () => {
    COMBAT_LOCATION_ORDER.forEach((locationId) => {
      const dungeon = COMBAT_LOCATIONS[locationId]
      dungeon.monsterPool.forEach((monsterId) => expect(MONSTERS[monsterId].loot.every((entry) => entry.itemId !== 'life-essence' && entry.itemId !== 'artifact-essence')).toBe(true))
      if (hasBossEncounter(dungeon)) expect(MONSTERS[dungeon.boss].loot.every((entry) => entry.itemId !== 'life-essence' && entry.itemId !== 'artifact-essence')).toBe(true)
    })
  })

  it('removes dungeon Equipment pools while keeping Artifact crafting one-to-one', () => {
    expect(ARTIFACT_ITEM_ORDER).toHaveLength(12)
    expect(Object.keys(ARTIFICING_RECIPES)).toEqual(expect.arrayContaining([...ARTIFACT_ITEM_ORDER]))
    expect(Object.values(ARTIFACTS).every((artifact) => ARTIFICING_RECIPES[artifact.id].output.itemId === artifact.id)).toBe(true)
    expect(validateRecipeDefinitions()).toEqual([])
    expect(RECIPES['windthread-wand']).toBeDefined()
  })

  it('keeps gated Tier 2 Artifact recipes gated by their authored boss', () => {
    const state = createInitialState()
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(false)
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(true)
    expect(getItemDropSources('galeshard-staff')).toEqual([])
  })
})
