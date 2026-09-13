import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { recalculateDerivedStats } from '../../engine'
import { ITEMS } from '../items/items'
import { MONSTERS } from '../monsters'
import { ARTIFICING_RECIPES, isRecipeUnlocked } from '../recipes/recipes'
import { ARTIFACTS, validateArtifactDefinitions } from './artifacts'
import { getArtifactEffectiveStats, getArtifactLevelCap, getArtifactLevelCapRequirement, getArtifactUpgrade, isArtifactUpgradeUnlocked, canUpgradeArtifact } from '../../systems/artifacts/artifactProgression'
import { upgradeArtifactInstant } from '../../systems/artificing/artificingEngine'
import { getCombatModifiers, getResistance } from '../../systems/combat/modifiers'
import { damagePlayer } from '../../systems/combat/effectResolver'
import { normalizeEquipmentState } from '../../core/equipment/equipmentRules'
import type { ArtifactId, CombatSource, ItemId } from '../../types'

const artifactIds: readonly ArtifactId[] = ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'wispweave-robe', 'wispveil-hood']
const elementalArtifacts: readonly [ArtifactId, ItemId][] = [['ember-staff', 'fire-fragment'], ['tideglass-wand', 'water-fragment'], ['stoneheart-scepter', 'earth-fragment'], ['windthread-wand', 'air-fragment']]
const spellSource = (school: 'water' | 'earth' | 'air'): CombatSource => ({ actor: 'player', kind: 'spell', sourceId: `artifact-${school}`, school, tags: ['spell', school] })

describe('Tier 1 Artifact roster', () => {
  it('contains exactly six validated Artifact bases without item-level stat/combat duplicates', () => {
    expect(Object.keys(ARTIFACTS)).toEqual(artifactIds)
    expect(validateArtifactDefinitions(ITEMS, MONSTERS)).toEqual([])
    artifactIds.forEach((id) => {
      expect(ITEMS[id]).toMatchObject({ kind: 'equipment', source: 'Artificing', sourceNavigation: 'tower-artificing', equipmentTier: 1, sellValue: null, canDestroy: false })
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

  it('uses universal Artifact Essence plus the matching school fragment for elemental upgrades', () => {
    const fragments = [50, 100, 200, 300, 500, 750, 1000, 1650, 2750]
    const essence = [10, 20, 40, 60, 100, 150, 200, 300, 500]
    elementalArtifacts.forEach(([artifactId, fragmentId]) => {
      ARTIFACTS[artifactId]!.upgrades.forEach((upgrade, index) => {
        expect(upgrade.ingredients).toHaveLength(2)
        expect(upgrade.ingredients).toEqual(expect.arrayContaining([{ itemId: fragmentId, quantity: fragments[index] }, { itemId: 'artifact-essence', quantity: essence[index] }]))
        expect(upgrade.ingredients.every(({ itemId }) => itemId === fragmentId || itemId === 'artifact-essence')).toBe(true)
      })
    })
  })

  it('uses only Prismatic Fragment and Artifact Essence for robe and hood upgrades', () => {
    const fragments = [2, 4, 7, 10, 15, 20, 28, 38, 50]
    const essence = [10, 20, 40, 60, 100, 150, 200, 300, 500]
    ;(['wispweave-robe', 'wispveil-hood'] as const).forEach((artifactId) => {
      ARTIFACTS[artifactId].upgrades.forEach((upgrade, index) => {
        expect(upgrade.ingredients).toHaveLength(2)
        expect(upgrade.ingredients).toEqual(expect.arrayContaining([{ itemId: 'prismatic-fragment', quantity: fragments[index] }, { itemId: 'artifact-essence', quantity: essence[index] }]))
        expect(upgrade.ingredients.every(({ itemId }) => itemId === 'prismatic-fragment' || itemId === 'artifact-essence')).toBe(true)
      })
    })
  })

  it('unlocks all starter Artifact recipes on a fresh save', () => {
    const state = createInitialState()
    artifactIds.forEach((id) => {
      expect(ARTIFICING_RECIPES[id]).toMatchObject({ kind: 'artificing', unlock: { type: 'always' } })
      expect(ARTIFICING_RECIPES[id].sourceDungeonId).toBeUndefined()
      expect(isRecipeUnlocked(state, ARTIFICING_RECIPES[id])).toBe(true)
    })
  })

  it('uses Forest Heart and Corrupted Greatbear boss kills for Artifact level bands', () => {
    const state = createInitialState()
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(4)
    expect(getArtifactLevelCapRequirement(state, 'ember-staff')).toContain('Forest Heart')
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(7)
    expect(getArtifactLevelCapRequirement(state, 'ember-staff')).toContain('Corrupted Greatbear')
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(10)
    expect(getArtifactLevelCapRequirement(state, 'ember-staff')).toBeNull()
  })

  it('locks 4→5 and 7→8 until their boss is defeated without consuming ingredients', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { level: 4, allocatedNodeIds: [], attunedNodeIds: [] }
    const levelFive = getArtifactUpgrade('ember-staff', 4)!
    levelFive.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = quantity })
    expect(isArtifactUpgradeUnlocked(state, levelFive)).toBe(false)
    expect(canUpgradeArtifact(state, 'ember-staff')).toBe(false)
    expect(upgradeArtifactInstant(state, 'ember-staff')).toMatchObject({ ok: false })
    levelFive.ingredients.forEach(({ itemId, quantity }) => expect(state.inventory[itemId]).toBe(quantity))

    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(isArtifactUpgradeUnlocked(state, levelFive)).toBe(true)
    expect(canUpgradeArtifact(state, 'ember-staff')).toBe(true)
    expect(upgradeArtifactInstant(state, 'ember-staff')).toMatchObject({ ok: true })
    state.artifactProgress['ember-staff'].level = 7
    const levelEight = getArtifactUpgrade('ember-staff', 7)!
    levelEight.ingredients.forEach(({ itemId, quantity }) => { state.inventory[itemId] = quantity })
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 0
    expect(isArtifactUpgradeUnlocked(state, levelEight)).toBe(false)
    expect(canUpgradeArtifact(state, 'ember-staff')).toBe(false)
    expect(upgradeArtifactInstant(state, 'ember-staff')).toMatchObject({ ok: false })
    levelEight.ingredients.forEach(({ itemId, quantity }) => expect(state.inventory[itemId]).toBe(quantity))
    state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
    expect(isArtifactUpgradeUnlocked(state, levelEight)).toBe(true)
  })

  it('uses boss kills for current Artifact Path gates without catalysts', () => {
    const bossGatedNodes = Object.values(ARTIFACTS).flatMap((artifact) => artifact.nodes.filter((node) => node.requiresBossKill))
    expect(Object.values(ARTIFACTS).flatMap((artifact) => artifact.nodes).every((node) => node.catalyst === undefined)).toBe(true)
    expect(bossGatedNodes.every((node) => node.requiresBossKill && ['forest-heart', 'corrupted-greatbear', 'archmage-edrin-shade'].includes(node.requiresBossKill))).toBe(true)
  })

  it('treats every current Artifact as compatible with the single Weapon slot', () => {
    const inventory = { 'ember-staff': 1, 'tideglass-wand': 1, 'stoneheart-scepter': 1, 'windthread-wand': 1 }
    elementalArtifacts.forEach(([id]) => expect(normalizeEquipmentState({ weapon: id }, inventory).weapon).toBe(id))
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
