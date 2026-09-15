import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { buildCombatActNavigationViewModel, getCombatActRouteState, getDefaultCombatActId, getDefaultCombatActNodeId, getInitialCombatDungeon, getLatestUnlockedDungeon, getVisibleCombatActs } from './combatActNavigationReadModel'
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

  it('prefers the last successfully entered dungeon and falls back to the latest unlocked dungeon', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    expect(getLatestUnlockedDungeon(state.progress)).toBe('rootscar-hollow')
    expect(getInitialCombatDungeon({ combat: state.combat, progress: state.progress })).toBe('rootscar-hollow')
    expect(getInitialCombatDungeon({ combat: state.combat, lastEnteredDungeonId: 'flooded-reliquary', progress: state.progress })).toBe('flooded-reliquary')
    expect(getInitialCombatDungeon({ combat: state.combat, lastEnteredDungeonId: 'black-gate', progress: state.progress })).toBe('rootscar-hollow')

    state.combat.active = true
    state.combat.dungeonId = 'fractured-approach'
    expect(getInitialCombatDungeon({ combat: state.combat, lastEnteredDungeonId: 'flooded-reliquary', progress: state.progress })).toBe('fractured-approach')
  })

  it('keeps the Paint campaign columns and presentation route segments', () => {
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
    expect(node('ashen-watch').x).toBe(node('flooded-reliquary').x)
    expect(node('flooded-reliquary').x).toBe(node('crossroads-of-ruin').x)
    expect(node('crossroads-of-ruin').x).toBe(node('rootscar-hollow').x)
    expect(node('starfallen-observatory').x).toBe(node('stormvault-gallery').x)
    expect(node('stormvault-gallery').x).toBe(node('broken-meridian').x)
    expect(node('broken-meridian').x).toBe(node('graveglass-hollow').x)
    expect(node('hall-of-unbound-names').x).toBe(node('vault-of-the-black-sigil').x)
    expect(act.chapters).toEqual([])
    expect(node('fractured-approach').y).toBe(430)
    expect(node('crossroads-of-ruin').y).toBe(430)
    expect(node('broken-meridian').y).toBe(430)
    expect(node('black-gate').y).toBe(430)
    expect(act.connections).toEqual([
      { from: 'fractured-approach', to: 'crossroads-of-ruin', kind: 'main' },
      { from: 'crossroads-of-ruin', to: 'broken-meridian', kind: 'main' },
      { from: 'broken-meridian', to: 'black-gate', kind: 'main' },
    ])
    expect(act.routeSegments?.map((segment) => segment.id)).toEqual([
      'main-t2-to-t25', 'main-t25-to-t210', 'main-t210-to-t212',
      'first-upper-vertical', 'first-t23-stub', 'first-t22-stub',
      'first-lower-vertical', 'first-t24-stub',
      'second-upper-vertical', 'second-t28-stub', 'second-t27-stub',
      'second-lower-vertical', 'second-t26-stub',
      'final-vertical', 'final-upper-t211-stub', 'final-lower-t211-stub',
    ])
    expect(act.routeSegments).toHaveLength(16)
    expect(act.routeSegments?.every(({ x1, y1, x2, y2 }) => x1 === x2 || y1 === y2)).toBe(true)
    const segment = (id: string) => act.routeSegments?.find((entry) => entry.id === id)
    expect(segment('main-t2-to-t25')).toMatchObject({ x1: 315, y1: 430, x2: 605, y2: 430, kind: 'main', nodeIds: ['fractured-approach', 'crossroads-of-ruin'] })
    expect(segment('main-t25-to-t210')).toMatchObject({ x1: 795, y1: 430, x2: 1085, y2: 430, kind: 'main', nodeIds: ['crossroads-of-ruin', 'broken-meridian'] })
    expect(segment('main-t210-to-t212')).toMatchObject({ x1: 1275, y1: 430, x2: 1930, y2: 430, kind: 'main', nodeIds: ['broken-meridian', 'black-gate'], finalApproach: true })
    expect(act.routeSegments?.filter((segment) => segment.kind === 'branch' && segment.x1 === segment.x2).map((segment) => segment.id)).toEqual([
      'first-upper-vertical', 'first-lower-vertical', 'second-upper-vertical', 'second-lower-vertical', 'final-vertical',
    ])
    expect(act.routeSegments?.find((segment) => segment.id === 'first-t23-stub')).toMatchObject({ x1: 500, y1: 150, x2: 605, y2: 150 })
    expect(act.routeSegments?.find((segment) => segment.id === 'first-t22-stub')).toMatchObject({ x1: 500, y1: 290, x2: 605, y2: 290 })
    expect(act.routeSegments?.find((segment) => segment.id === 'first-t24-stub')).toMatchObject({ x1: 545, y1: 690, x2: 605, y2: 690 })
    expect(act.routeSegments?.find((segment) => segment.id === 'second-t28-stub')).toMatchObject({ x1: 980, y1: 150, x2: 1085, y2: 150 })
    expect(act.routeSegments?.find((segment) => segment.id === 'second-t27-stub')).toMatchObject({ x1: 980, y1: 300, x2: 1085, y2: 300 })
    expect(act.routeSegments?.find((segment) => segment.id === 'second-t26-stub')).toMatchObject({ x1: 1025, y1: 690, x2: 1085, y2: 690 })
    expect(act.routeSegments?.find((segment) => segment.id === 'final-upper-t211-stub')).toMatchObject({ x1: 1490, y1: 250, x2: 1565, y2: 250 })
    expect(act.routeSegments?.find((segment) => segment.id === 'final-lower-t211-stub')).toMatchObject({ x1: 1490, y1: 650, x2: 1565, y2: 650 })
  })

  it('keeps main route state local to each progression section', () => {
    const state = createInitialState()
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    const before = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'fractured-approach', selectedActId: 'act-1', selectedNodeId: 'fractured-approach' })
    const beforeNodes = before.selectedAct.nodes
    const beforeSegment = ['fractured-approach', 'crossroads-of-ruin'].map((id) => beforeNodes.find((node) => node.id === id)!.state)
    expect(getCombatActRouteState(beforeSegment)).toEqual({ locked: true, completed: false })

    state.progress.bossKillsByBoss['drowned-keeper'] = 1
    state.progress.bossKillsByBoss['flamebound-revenant'] = 1
    state.progress.bossKillsByBoss['rootscar-ancient'] = 1
    const after = buildCombatActNavigationViewModel({ progress: state.progress, combat: state.combat, selectedDungeonId: 'fractured-approach', selectedActId: 'act-1', selectedNodeId: 'fractured-approach' })
    const afterNodes = after.selectedAct.nodes
    const afterSegment = ['fractured-approach', 'crossroads-of-ruin'].map((id) => afterNodes.find((node) => node.id === id)!.state)
    expect(getCombatActRouteState(afterSegment)).toEqual({ locked: false, completed: false })
  })
})
