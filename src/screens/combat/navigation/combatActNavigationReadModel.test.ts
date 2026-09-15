import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatActNavigationViewModel, getDefaultCombatActId, getDefaultCombatActNodeId, getVisibleCombatActs } from './combatActNavigationReadModel'
import { COMBAT_ACT_DEFINITIONS } from './combatActDefinitions'

describe('Act 1 campaign navigation', () => {
  it('reveals Fractured Approach only after the Act 0 final boss', () => {
    const state = createInitialState()
    expect(getVisibleCombatActs(state.progress).map((act) => act.id)).toEqual(['act-0'])

    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    expect(getVisibleCombatActs(state.progress).map((act) => act.id)).toEqual(['act-0', 'act-1'])
    const view = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'whispering-woods', selectedActId: 'act-1', selectedNodeId: 'fractured-approach' })
    expect(view.selectedNode).toMatchObject({ id: 'fractured-approach', dungeonId: 'fractured-approach', state: 'available' })
    expect(view.selectedNode.prototype).toBeUndefined()
    expect(view.selectedNode.threatRequired).toBe(35)
  })

  it('keeps the three next branch routes locked until the Gatekeeper clear', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    const before = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'fractured-approach', selectedActId: 'act-1', selectedNodeId: 'flooded-reliquary' })
    expect(before.selectedNode).toMatchObject({ state: 'locked', dungeonId: 'flooded-reliquary' })
    expect(before.selectedNode.prototype).toBeUndefined()

    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    const after = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'fractured-approach', selectedActId: 'act-1', selectedNodeId: 'flooded-reliquary' })
    expect(after.selectedNode).toMatchObject({ state: 'available', statusLabel: 'AVAILABLE', dungeonId: 'flooded-reliquary' })
    expect(after.selectedNode.prototype).toBeUndefined()
    expect(after.selectedAct.nodes.filter((node) => ['flooded-reliquary', 'ashen-watch', 'rootscar-hollow'].includes(node.id)).every((node) => node.state === 'available')).toBe(true)
    expect(after.selectedAct.nodes).toHaveLength(12)
    expect(after.selectedAct.nodes.every((node) => node.dungeonId !== null && !node.prototype)).toBe(true)
  })

  it('follows an active Fractured Approach run in the Act 1 navigation', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'fractured-approach'
    expect(getDefaultCombatActId(state.progress, state.combat)).toBe('act-1')
    expect(getDefaultCombatActNodeId('act-1', state.progress, state.combat, 'whispering-woods')).toBe('fractured-approach')
  })

  it('keeps the Paint campaign branch order and presentation rails', () => {
    const act = COMBAT_ACT_DEFINITIONS.find((definition) => definition.id === 'act-1')!
    const node = (id: string) => act.nodes.find((entry) => entry.id === id)!
    expect(Object.fromEntries(act.nodes.map((entry) => [entry.id, entry.tierLabel]))).toMatchObject({
      'flooded-reliquary': 'TIER II.2',
      'ashen-watch': 'TIER II.3',
      'rootscar-hollow': 'TIER II.4',
      'crossroads-of-ruin': 'TIER II.5',
      'graveglass-hollow': 'TIER II.6',
      'stormvault-gallery': 'TIER II.7',
      'starfallen-observatory': 'TIER II.8',
      'broken-meridian': 'TIER II.10',
      'hall-of-unbound-names': 'TIER II.11',
      'vault-of-the-black-sigil': 'TIER II.11',
      'black-gate': 'TIER II.12',
    })
    expect(node('ashen-watch').y).toBeLessThan(node('flooded-reliquary').y)
    expect(node('flooded-reliquary').y).toBeLessThan(node('rootscar-hollow').y)
    expect(node('starfallen-observatory').y).toBeLessThan(node('stormvault-gallery').y)
    expect(node('stormvault-gallery').y).toBeLessThan(node('graveglass-hollow').y)
    expect(act.connections).toEqual([
      { from: 'fractured-approach', to: 'crossroads-of-ruin', kind: 'main' },
      { from: 'crossroads-of-ruin', to: 'broken-meridian', kind: 'main' },
      { from: 'broken-meridian', to: 'black-gate', kind: 'main' },
    ])
    expect(act.branchRails).toHaveLength(3)
    expect(act.branchRails?.every((rail) => rail.stubs.length === 3 || rail.stubs.length === 2)).toBe(true)
  })
})
