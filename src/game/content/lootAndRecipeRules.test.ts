import { describe, expect, it } from 'vitest'
import { getItemDropSources, getItemSourceInfo } from './contentRelations'
import { ITEMS } from './items/items'
import { MONSTERS, validateMonsterDefinitions, type MonsterDefinition } from './monsters'
import { DUNGEONS, DUNGEON_ORDER } from './dungeons/dungeons'
import { BOSS_SIGNATURE_EQUIPMENT_IDS, DUNGEON_EQUIPMENT_BY_DUNGEON, getEquipmentOrigin } from './equipment/equipmentSets'
import { ARTIFICING_RECIPES, ARTIFICING_RECIPE_ORDER, RECIPES, RECIPE_ORDER, type CraftingRecipeDefinition, validateRecipeDefinitions } from './recipes/recipes'
import { ARTIFACTS, isArtifactId } from './artifacts/artifacts'
import { ARTIFACT_EQUIPMENT_IDS } from './equipment/equipmentSets'
import { BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE, BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE, DUNGEON_LOOT, REGULAR_EQUIPMENT_LOOT_CHANCE, validateDungeonLootDefinitions } from './dungeons/dungeonLoot'
import { createInitialState } from '../../store/initialState'
import { isRecipeUnlocked } from './recipes/recipeUnlocks'
import type { ItemId, RecipeId } from '../types'

const RETIRED_ACT0_MATERIAL_IDS = [
  'wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark', 'heartseed',
  'predator-fang', 'predator-hide', 'predator-sinew', 'corrupted-beast-essence', 'greatbear-core',
  'ossuary-remnant', 'soul-residue', 'graveglass-shard', 'burial-cloth', 'edrin-remnant',
] as const

const findDrop = (monsterId: keyof typeof MONSTERS, itemId: ItemId) => MONSTERS[monsterId].loot.find((drop) => drop.itemId === itemId)

describe('Act 0 universal dungeon loot', () => {
  it('validates every dungeon loot configuration and keeps Artifact pools out of combat', () => {
    expect(validateDungeonLootDefinitions()).toEqual([])
    Object.values(DUNGEON_LOOT).forEach((loot) => expect(loot.regularEquipment.every((itemId) => !isArtifactId(itemId))).toBe(true))
    expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).some((drop) => isArtifactId(drop.itemId))).toBe(false)
    expect(validateMonsterDefinitions()).toEqual([])
  })

  it('gives every normal monster Life Essence, Artifact Essence, and its dungeon equipment pool', () => {
    DUNGEON_ORDER.forEach((dungeonId) => {
      const dungeon = DUNGEONS[dungeonId]
      dungeon.monsterPool.forEach((monsterId) => {
        const loot = MONSTERS[monsterId].loot
        expect(findDrop(monsterId, 'life-essence')).toBeDefined()
        expect(findDrop(monsterId, 'artifact-essence')).toEqual({ itemId: 'artifact-essence', min: DUNGEON_LOOT[dungeonId].artifactEssence.normal[0], max: DUNGEON_LOOT[dungeonId].artifactEssence.normal[1], chance: 1 })
        DUNGEON_LOOT[dungeonId].regularEquipment.forEach((itemId) => expect(loot).toContainEqual({ itemId, min: 1, max: 1, chance: REGULAR_EQUIPMENT_LOOT_CHANCE }))
      })
    })
  })

  it('gives every boss Artifact Essence, its regular pool at 5%, and only its signature at 10%', () => {
    DUNGEON_ORDER.forEach((dungeonId) => {
      const dungeon = DUNGEONS[dungeonId]
      const loot = MONSTERS[dungeon.boss].loot
      expect(loot).toContainEqual({ itemId: 'artifact-essence', min: DUNGEON_LOOT[dungeonId].artifactEssence.boss[0], max: DUNGEON_LOOT[dungeonId].artifactEssence.boss[1], chance: 1 })
      DUNGEON_LOOT[dungeonId].regularEquipment.forEach((itemId) => expect(loot).toContainEqual({ itemId, min: 1, max: 1, chance: BOSS_REGULAR_EQUIPMENT_LOOT_CHANCE }))
      expect(loot).toContainEqual({ itemId: DUNGEON_LOOT[dungeonId].bossSignature, min: 1, max: 1, chance: BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE })
    })
  })

  it('preserves each monster’s authored Life Essence range and chance', () => {
    const expectedLifeDrops = {
      'forest-wisp': [1, 3, 1], 'thornling': [1, 3, 1], 'stone-root': [1, 3, 0.2], 'grove-sentinel': [2, 5, 1], 'forest-heart': [10, 18, 1],
      'cavefang-wolf': [3, 5, 1], 'razorclaw-lynx': [3, 5, 1], 'corrupted-dire-wolf': [3, 5, 1], 'corrupted-greatbear': [12, 30, 1],
      'restless-skeleton': [4, 8, 1], 'grave-wraith': [4, 8, 1], 'fallen-acolyte': [5, 10, 1], 'archmage-edrin-shade': [21, 48, 1],
      'warded-husk': [5, 10, 1], 'rift-wolf': [5, 10, 1], 'arcane-scavenger': [5, 10, 1], 'withered-watcher': [5, 10, 1], 'corrupted-elemental-gatekeeper': [25, 55, 1],
    } as const
    Object.entries(expectedLifeDrops).forEach(([monsterId, [min, max, chance]]) => expect(MONSTERS[monsterId as keyof typeof MONSTERS].loot).toContainEqual({ itemId: 'life-essence', min, max, chance }))
  })
})

describe('Direct Equipment loot', () => {
  it('allows non-Artifact Equipment in monster loot and rejects Artifact Equipment', () => {
    const fixture: MonsterDefinition = {
      ...MONSTERS['forest-heart'],
      loot: [...MONSTERS['forest-heart'].loot, { itemId: 'ember-staff' as ItemId, min: 1, max: 1, chance: 0.05 }],
    }
    expect(validateMonsterDefinitions({ ...MONSTERS, 'forest-heart': fixture })).toContain('forest-heart: monster loot may not contain Artifact Equipment; ember-staff')
  })

  it('keeps dungeon Equipment grouping separate from starter Artifacts', () => {
    expect(ARTIFACT_EQUIPMENT_IDS).toHaveLength(10)
    expect(Object.values(DUNGEON_EQUIPMENT_BY_DUNGEON).flat()).not.toEqual(expect.arrayContaining([...ARTIFACT_EQUIPMENT_IDS]))
    expect(getEquipmentOrigin('ember-staff')).toBeNull()
    expect(getEquipmentOrigin('wispglass-earring')).toBe('whispering-woods')
    expect(getEquipmentOrigin('heartseed-necklace')).toBe('whispering-woods')
  })
})

describe('Boss-signature Equipment', () => {
  it('maps each signature to exactly one assigned boss', () => {
    expect(BOSS_SIGNATURE_EQUIPMENT_IDS).toHaveLength(15)
    BOSS_SIGNATURE_EQUIPMENT_IDS.forEach((itemId) => {
      const dungeonId = DUNGEON_ORDER.find((id) => DUNGEON_LOOT[id].bossSignature === itemId)!
      const bossId = DUNGEONS[dungeonId].boss
      const sources = getItemDropSources(itemId as ItemId)
      expect(sources).toHaveLength(1)
      expect(sources[0]).toMatchObject({ monsterId: bossId, role: 'boss', chance: BOSS_SIGNATURE_EQUIPMENT_LOOT_CHANCE })
      expect(ARTIFICING_RECIPES[itemId as keyof typeof ARTIFICING_RECIPES]).toBeDefined()
      expect(ITEMS[itemId as ItemId]).toMatchObject({ source: expect.stringContaining('Combat →'), sourceNavigation: 'combat' })
      expect(Object.values(MONSTERS).filter((monster) => monster.bestiaryCategory === 'monster' && monster.loot.some((drop) => drop.itemId === itemId))).toHaveLength(0)
    })
  })
})

describe('Artifact-only Artificing', () => {
  it('keeps one Artificing recipe for every Equipment item', () => {
    const state = createInitialState()
    expect(ARTIFICING_RECIPE_ORDER).toHaveLength(Object.values(ARTIFICING_RECIPES).length)
    expect(ARTIFICING_RECIPE_ORDER.filter((id) => ARTIFACT_EQUIPMENT_IDS.includes(id as typeof ARTIFACT_EQUIPMENT_IDS[number]))).toEqual([...ARTIFACT_EQUIPMENT_IDS])
    expect(ARTIFICING_RECIPES['galeshard-staff']).toMatchObject({ unlock: { type: 'boss-kill', bossId: 'corrupted-elemental-gatekeeper' }, sourceDungeonId: 'fractured-approach' })
    expect(Object.values(ARTIFICING_RECIPES).every((recipe) => ITEMS[recipe.output.itemId]?.kind === 'equipment')).toBe(true)
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['windthread-charm'])).toBe(true)
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(false)
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['galeshard-staff'])).toBe(true)
  })

  it('keeps Forge and Artificing recipe ingredients synchronized and rejects non-Artifact outputs', () => {
    expect(validateRecipeDefinitions()).toEqual([])
    Object.values(ARTIFACTS).forEach((artifact) => expect(artifact.forge.ingredients).toEqual(ARTIFICING_RECIPES[artifact.id].ingredients))
    const invalid = { ...RECIPES, 'invalid-equipment': { ...ARTIFICING_RECIPES['ember-staff'], id: 'invalid-equipment' as RecipeId, output: { itemId: 'windthread-charm' as never, quantity: 1 } } } as unknown as Record<string, CraftingRecipeDefinition>
    expect(validateRecipeDefinitions(invalid, [...RECIPE_ORDER, 'invalid-equipment'])).toEqual(expect.arrayContaining(['windthread-charm: Equipment must have exactly one Artificing recipe (found 2)']))
  })
})

describe('Artifact Essence economy', () => {
  it('uses direct combat metadata for Artifact Essence and explicit Transmutation navigation for fragments', () => {
    expect(ITEMS['artifact-essence']).toMatchObject({ source: 'Combat → all dungeon enemies', sourceNavigation: 'combat', materialSubtype: 'arcane' })
    ;(['fire-fragment', 'water-fragment', 'earth-fragment', 'air-fragment'] as const).forEach((itemId) => expect(ITEMS[itemId].sourceNavigation).toBe('tower-transmutation'))
    expect(ITEMS['prismatic-fragment'].description).toContain('forge or strengthen')
  })
})

describe('Retired material regression', () => {
  it('keeps retired Act 0 material IDs out of active registries and relations', () => {
    const activeContent = JSON.stringify({ ITEMS, MONSTERS, ARTIFICING_RECIPES, RECIPES, ARTIFACTS, DUNGEON_EQUIPMENT_BY_DUNGEON })
    RETIRED_ACT0_MATERIAL_IDS.forEach((itemId) => {
      expect(activeContent).not.toContain(`"${itemId}"`)
      expect(Object.keys(ITEMS)).not.toContain(itemId)
      expect(Object.values(MONSTERS).flatMap((monster) => monster.loot).map((drop) => drop.itemId)).not.toContain(itemId)
    })
    ARTIFACT_EQUIPMENT_IDS.forEach((artifactId) => expect(ARTIFACTS[artifactId].nodes.every((node) => node.catalyst === undefined)).toBe(true))
    Object.keys(ITEMS).forEach((itemId) => expect(getItemSourceInfo(itemId as ItemId).relations.map((relation) => relation.id)).not.toEqual(expect.arrayContaining([...RETIRED_ACT0_MATERIAL_IDS])))
  })
})
