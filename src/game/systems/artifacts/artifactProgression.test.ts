import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { grantItem } from '../inventory/itemAcquisition'
import { upgradeArtifactInstant } from '../artificing/artificingEngine'
import { canUpgradeArtifact, getArtifactLevelCap, getArtifactNodeEligibility } from './artifactProgression'

describe('Artifact progression foundation', () => {
  it('caps Artifact ownership and returns the actual granted amount', () => {
    const state = createInitialState()
    expect(grantItem(state, 'ember-staff', 1)).toBe(1)
    expect(grantItem(state, 'ember-staff', 10)).toBe(0)
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.artifactProgress['ember-staff']).toEqual({ level: 1, allocatedNodeIds: [], attunedNodeIds: [] })
  })

  it('repairs missing progression when an owned Artifact is granted again', () => {
    const state = createInitialState()
    state.inventory['tideglass-wand'] = 1
    expect(state.artifactProgress['tideglass-wand']).toBeUndefined()
    expect(grantItem(state, 'tideglass-wand', 1)).toBe(0)
    expect(state.artifactProgress['tideglass-wand']).toEqual({ level: 1, allocatedNodeIds: [], attunedNodeIds: [] })
  })

  it('upgrades immediately, consumes exact materials, and does not acquire an extra item', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.inventory['fire-fragment'] = 50
    expect(upgradeArtifactInstant(state, 'ember-staff')).toMatchObject({ ok: false })
    expect(state.inventory['fire-fragment']).toBe(50)
    state.artifactProgress['ember-staff'] = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
    state.activities.artificing.activeJob = { kind: 'recipe', recipeId: 'windthread-wand' }
    expect(canUpgradeArtifact(state, 'ember-staff')).toBe(true)
    expect(upgradeArtifactInstant(state, 'ember-staff')).toMatchObject({ ok: true })
    expect(state.inventory['ember-staff']).toBe(1)
    expect(state.inventory['fire-fragment']).toBe(0)
    expect(state.artifactProgress['ember-staff'].level).toBe(2)
    expect(state.activities.artificing.activeJob).toEqual({ kind: 'recipe', recipeId: 'windthread-wand' })
  })

  it('reports specific node eligibility states', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { level: 1, allocatedNodeIds: [], attunedNodeIds: [] }
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'arcane-kindling').status).toBe('missingLevel')
    state.artifactProgress['ember-staff'].level = 2
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'arcane-kindling').status).toBe('available')
    state.artifactProgress['ember-staff'].allocatedNodeIds.push('arcane-kindling')
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'arcane-kindling').status).toBe('allocated')
    state.artifactProgress['ember-staff'].level = 4
    state.artifactProgress['ember-staff'].allocatedNodeIds.push('cinder-memory', 'lingering-flame')
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'heartfed-embers').status).toBe('missingBoss')
    state.progress.bossKillsByBoss['forest-heart'] = 1
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'heartfed-embers').status).toBe('missingCatalyst')
  })

  it('keeps authored caps and gates intact until artifact overrides are enabled', () => {
    const state = createInitialState()
    state.inventory['ember-staff'] = 1
    state.artifactProgress['ember-staff'] = { level: 10, allocatedNodeIds: ['arcane-kindling', 'cinder-memory', 'lingering-flame'], attunedNodeIds: [] }
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(4)
    state.debug.artifactIgnoreLevelCap = true
    expect(getArtifactLevelCap(state, 'ember-staff')).toBe(10)

    state.artifactProgress['ember-staff'].level = 4
    state.debug.artifactBonusPointsByArtifact['ember-staff'] = 1
    state.inventory.heartseed = 1
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'heartfed-embers').status).toBe('missingBoss')
    state.debug.artifactIgnoreDungeonGate = true
    expect(getArtifactNodeEligibility(state, 'ember-staff', 'heartfed-embers').status).toBe('available')
  })
})
