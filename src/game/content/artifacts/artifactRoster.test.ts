import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
import { ITEMS } from '../items/items'
import { MONSTERS } from '../monsters'
import { ARTIFICING_RECIPES, isRecipeUnlocked } from '../recipes/recipes'
import { ARTIFACTS, validateArtifactDefinitions } from './artifacts'
import { getArtifactEffectiveStats, getArtifactLevelCap } from '../../systems/artifacts/artifactProgression'
import { getCombatModifiers, getResistance } from '../../systems/combat/modifiers'
import { damagePlayer } from '../../systems/combat/effectResolver'
import { normalizeEquipmentState } from '../../core/equipment/equipmentRules'
import type { ArtificingRecipeId, CombatSource } from '../../types'

const artifactIds: ArtificingRecipeId[] = ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood']
const firstKillMonsters = ['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel'] as const
const spellSource = (school: 'water' | 'earth' | 'air'): CombatSource => ({ actor: 'player', kind: 'spell', sourceId: `artifact-${school}`, school, tags: ['spell', school] })

describe('Tier 1 Artifact roster', () => {
  it('contains exactly six validated Artifact bases without item-level stat/combat duplicates', () => {
    expect(Object.keys(ARTIFACTS)).toEqual(artifactIds)
    expect(validateArtifactDefinitions(ITEMS, MONSTERS)).toEqual([])
    artifactIds.forEach((id) => {
      expect(ITEMS[id]).toMatchObject({ kind: 'equipment', source: 'Artificing', equipmentTier: 1, sellValue: null, canDestroy: false })
      expect(ITEMS[id].stats).toBeUndefined()
      expect(ITEMS[id].combat).toBeUndefined()
      expect(ARTIFACTS[id]?.maxLevel).toBe(10)
    })
  })

  it('resolves the authored level-10 core stat tables', () => {
    const state = createInitialState()
    artifactIds.forEach((id) => { state.artifactProgress[id] = { level: 10, allocatedNodeIds: [], attunedNodeIds: [] } })
    expect(getArtifactEffectiveStats(state, 'ember-staff')).toMatchObject({ basicDamage: 17, spellPower: 75 })
    expect(getArtifactEffectiveStats(state, 'tideglass-wand')).toMatchObject({ basicDamage: 16, spellPower: 72 })
    expect(getArtifactEffectiveStats(state, 'stoneheart-scepter')).toMatchObject({ basicDamage: 19, spellPower: 67 })
    expect(getArtifactEffectiveStats(state, 'windthread-wand')).toMatchObject({ basicDamage: 14, spellPower: 73 })
    expect(getArtifactEffectiveStats(state, 'wispweave-robe')).toMatchObject({ maxHealth: 92, defense: 19 })
    expect(getArtifactEffectiveStats(state, 'wispveil-hood')).toMatchObject({ maxHealth: 49, defense: 14 })
  })

  it('uses the reduced dungeon material costs for Wispweave Robe and Wispveil Hood upgrades', () => {
    const amounts = (artifactId: ArtificingRecipeId, itemIds: readonly string[]) => ARTIFACTS[artifactId]!.upgrades.map(({ ingredients }) => (
      Object.fromEntries(itemIds.map((itemId) => [itemId, ingredients.find((ingredient) => ingredient.itemId === itemId)?.quantity ?? 0]))
    ))
    const universalAmounts = (artifactId: ArtificingRecipeId, itemId: string) => ARTIFACTS[artifactId]!.upgrades.map(({ ingredients }) => ingredients.find((ingredient) => ingredient.itemId === itemId)?.quantity ?? 0)

    expect(amounts('wispweave-robe', ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark', 'predator-hide', 'predator-fang', 'corrupted-beast-essence', 'predator-sinew', 'ossuary-remnant', 'soul-residue', 'graveglass-shard', 'burial-cloth'])).toEqual([
      { 'wisp-essence': 7, 'thorn-fiber': 7, 'rootstone-shard': 6, 'grove-bark': 6, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 16, 'thorn-fiber': 16, 'rootstone-shard': 17, 'grove-bark': 17, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 30, 'thorn-fiber': 30, 'rootstone-shard': 30, 'grove-bark': 30, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 13, 'predator-fang': 13, 'corrupted-beast-essence': 13, 'predator-sinew': 13, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 25, 'predator-fang': 25, 'corrupted-beast-essence': 25, 'predator-sinew': 25, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 42, 'predator-fang': 42, 'corrupted-beast-essence': 41, 'predator-sinew': 41, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 15, 'soul-residue': 15, 'graveglass-shard': 15, 'burial-cloth': 15 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 35, 'soul-residue': 35, 'graveglass-shard': 35, 'burial-cloth': 35 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 68, 'soul-residue': 68, 'graveglass-shard': 68, 'burial-cloth': 68 },
    ])
    expect(amounts('wispveil-hood', ['wisp-essence', 'thorn-fiber', 'rootstone-shard', 'grove-bark', 'predator-hide', 'predator-fang', 'corrupted-beast-essence', 'predator-sinew', 'ossuary-remnant', 'soul-residue', 'graveglass-shard', 'burial-cloth'])).toEqual([
      { 'wisp-essence': 7, 'thorn-fiber': 7, 'rootstone-shard': 6, 'grove-bark': 6, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 13, 'thorn-fiber': 13, 'rootstone-shard': 13, 'grove-bark': 13, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 26, 'thorn-fiber': 26, 'rootstone-shard': 27, 'grove-bark': 27, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 10, 'predator-fang': 10, 'corrupted-beast-essence': 10, 'predator-sinew': 10, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 16, 'predator-fang': 16, 'corrupted-beast-essence': 17, 'predator-sinew': 17, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 28, 'predator-fang': 28, 'corrupted-beast-essence': 28, 'predator-sinew': 28, 'ossuary-remnant': 0, 'soul-residue': 0, 'graveglass-shard': 0, 'burial-cloth': 0 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 13, 'soul-residue': 13, 'graveglass-shard': 13, 'burial-cloth': 13 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 18, 'soul-residue': 18, 'graveglass-shard': 18, 'burial-cloth': 18 },
      { 'wisp-essence': 0, 'thorn-fiber': 0, 'rootstone-shard': 0, 'grove-bark': 0, 'predator-hide': 0, 'predator-fang': 0, 'corrupted-beast-essence': 0, 'predator-sinew': 0, 'ossuary-remnant': 47, 'soul-residue': 47, 'graveglass-shard': 46, 'burial-cloth': 46 },
    ])
    expect(universalAmounts('wispweave-robe', 'life-essence')).toEqual([13, 25, 50, 75, 125, 188, 250, 338, 450])
    expect(universalAmounts('wispveil-hood', 'life-essence')).toEqual([10, 20, 40, 63, 105, 163, 225, 300, 413])
    expect(universalAmounts('wispweave-robe', 'prismatic-fragment')).toEqual([0, 0, 5, 8, 13, 20, 25, 38, 55])
    expect(universalAmounts('wispveil-hood', 'prismatic-fragment')).toEqual([0, 5, 8, 10, 15, 23, 30, 43, 63])
  })

  it('unlocks every Tier 1 Artifact recipe after any one normal Whispering Woods kill', () => {
    firstKillMonsters.forEach((monsterId) => {
      const state = createInitialState()
      state.progress.lifetimeKillsByMonster[monsterId] = 1
      artifactIds.forEach((id) => expect(isRecipeUnlocked(state, ARTIFICING_RECIPES[id])).toBe(true))
      expect(isRecipeUnlocked(state, ARTIFICING_RECIPES['heartseed-necklace'])).toBe(false)
    })

    const bossState = createInitialState()
    bossState.progress.bossKillsByBoss['forest-heart'] = 1
    expect(isRecipeUnlocked(bossState, ARTIFICING_RECIPES['heartseed-necklace'])).toBe(true)
  })

  it('keeps the 4/7/10 progression caps and Artifact Path catalyst requirements', () => {
    const state = createInitialState()
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(4)
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(7)
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(10)

    const expectedPath = [
      '4:forest-heart:heartseed:1', '4:forest-heart:heartseed:1',
      '7:corrupted-greatbear:greatbear-core:1', '7:corrupted-greatbear:greatbear-core:1',
      '10:archmage-edrin-shade:edrin-remnant:1', '10:archmage-edrin-shade:edrin-remnant:1',
    ]
    artifactIds.forEach((id) => {
      expect(ARTIFACTS[id]!.nodes.filter((node) => node.catalyst).map((node) => `${node.requiresLevel}:${node.requiresBossKill}:${node.catalyst?.itemId}:${node.catalyst?.quantity}`).sort()).toEqual(expectedPath.sort())
    })
  })

  it('treats every current Artifact as compatible with the single Weapon slot', () => {
    const inventory = { 'ember-staff': 1, 'tideglass-wand': 1, 'stoneheart-scepter': 1, 'windthread-wand': 1 }
    artifactIds.slice(0, 4).forEach((id) => expect(normalizeEquipmentState({ weapon: id }, inventory).weapon).toBe(id))
  })

  it('filters Tideglass Barrier power to Water-origin Spell Barriers', () => {
    const state = createInitialState()
    state.equipment.weapon = 'tideglass-wand'
    state.artifactProgress['tideglass-wand'] = { level: 3, allocatedNodeIds: ['flowing-conduit', 'protective-current'], attunedNodeIds: [] }
    expect(getCombatModifiers(state, 'player', 'barrier-power-percent', { source: spellSource('water'), damageType: 'water' })).toBeCloseTo(0.1)
    expect(getCombatModifiers(state, 'player', 'barrier-power-percent', { source: spellSource('earth'), damageType: 'earth' })).toBe(0)
  })

  it('applies Greatbear Stormheart only while Mana is above half', () => {
    const state = createInitialState()
    state.equipment.weapon = 'windthread-wand'
    state.artifactProgress['windthread-wand'] = { level: 7, allocatedNodeIds: ['greatbear-stormheart'], attunedNodeIds: [] }
    state.player.mana = 60
    expect(getCombatModifiers(state, 'player', 'spell-damage-percent', { source: spellSource('air') })).toBeCloseTo(0.15)
    state.player.mana = 40
    expect(getCombatModifiers(state, 'player', 'spell-damage-percent', { source: spellSource('air') })).toBe(0)
  })

  it('runs a new Artifact defensive threshold trigger and merges nested resistances', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyInstanceKey = 'artifact-roster-test'
    state.combat.enemyMaxHp = 1000
    state.combat.enemyHp = 1000
    state.equipment.armor = 'wispweave-robe'
    state.inventory['wispweave-robe'] = 1
    state.artifactProgress['wispweave-robe'] = { level: 10, allocatedNodeIds: ['edrins-deathless-weave', 'greatbear-arcana'], attunedNodeIds: [] }
    recalculateDerivedStats(state)
    expect(getResistance(state, 'player', 'fire')).toBeCloseTo(0.1)
    expect(getResistance(state, 'player', 'water')).toBeCloseTo(0.1)
    state.player.health = state.player.maxHealth
    const enemySource: CombatSource = { actor: 'enemy', kind: 'action', sourceId: 'artifact-roster-hit', sourceMonsterId: 'forest-wisp', sourceInstanceKey: 'artifact-roster-test', tags: ['physical'] }
    damagePlayer(state, 180, enemySource)
    expect(state.combat.playerBarrier).toBe(75)
  })
})
