import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatActNavigationViewModel, getDefaultCombatActId, getDefaultCombatActNodeId, getVisibleCombatActs } from './combatActNavigationReadModel'

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

  it('makes the three next branch routes available after the Gatekeeper clear without inventing their combat content', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    const before = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'fractured-approach', selectedActId: 'act-1', selectedNodeId: 'flooded-reliquary' })
    expect(before.selectedNode).toMatchObject({ state: 'prototype', prototype: true, unlockText: 'Complete Fractured Approach to reveal this route.' })

    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    const after = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'fractured-approach', selectedActId: 'act-1', selectedNodeId: 'flooded-reliquary' })
    expect(after.selectedNode).toMatchObject({ state: 'available', statusLabel: 'AVAILABLE', prototype: true, dungeonId: null })
    expect(after.selectedAct.nodes.filter((node) => ['flooded-reliquary', 'ashen-watch', 'rootscar-hollow'].includes(node.id)).every((node) => node.state === 'available')).toBe(true)
    expect(after.selectedAct.nodes.find((node) => node.id === 'prototype-area-05')?.state).toBe('prototype')
  })

  it('follows an active Fractured Approach run in the Act 1 navigation', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.combat.active = true
    state.combat.dungeonId = 'fractured-approach'
    expect(getDefaultCombatActId(state.progress, state.combat)).toBe('act-1')
    expect(getDefaultCombatActNodeId('act-1', state.progress, state.combat, 'whispering-woods')).toBe('fractured-approach')
  })
})
