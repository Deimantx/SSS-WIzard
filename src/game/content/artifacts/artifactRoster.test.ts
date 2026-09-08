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

const artifactIds: ArtificingRecipeId[] = ['ember-staff', 'tideglass-wand', 'stoneheart-scepter', 'windthread-wand', 'prismatic-focus', 'wispweave-robe', 'wispveil-hood']
const firstKillMonsters = ['forest-wisp', 'thornling', 'stone-root', 'grove-sentinel'] as const
const spellSource = (school: 'water' | 'earth' | 'air'): CombatSource => ({ actor: 'player', kind: 'spell', sourceId: `artifact-${school}`, school, tags: ['spell', school] })

describe('Tier 1 Artifact roster', () => {
  it('contains exactly seven validated Artifact bases without item-level stat/combat duplicates', () => {
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
    expect(getArtifactEffectiveStats(state, 'tideglass-wand')).toMatchObject({ basicDamage: 15, spellPower: 56 })
    expect(getArtifactEffectiveStats(state, 'prismatic-focus')).toMatchObject({ maxMana: 42, spellPower: 39 })
    expect(getArtifactEffectiveStats(state, 'wispweave-robe')).toMatchObject({ maxHealth: 92, defense: 19 })
    expect(getArtifactEffectiveStats(state, 'wispveil-hood')).toMatchObject({ maxHealth: 49, defense: 14 })
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
      expect(ARTIFACTS[id].nodes.filter((node) => node.catalyst).map((node) => `${node.requiresLevel}:${node.requiresBossKill}:${node.catalyst?.itemId}:${node.catalyst?.quantity}`).sort()).toEqual(expectedPath.sort())
    })
  })

  it('supports one-handed Artifact plus Focus and rejects the two-handed Ember combination', () => {
    const inventory = { 'tideglass-wand': 1, 'prismatic-focus': 1, 'ember-staff': 1 }
    expect(normalizeEquipmentState({ weapon: 'tideglass-wand', offhand: 'prismatic-focus' }, inventory)).toMatchObject({ weapon: 'tideglass-wand', offhand: 'prismatic-focus' })
    expect(normalizeEquipmentState({ weapon: 'ember-staff', offhand: 'prismatic-focus' }, inventory)).toMatchObject({ weapon: 'ember-staff', offhand: null })
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
