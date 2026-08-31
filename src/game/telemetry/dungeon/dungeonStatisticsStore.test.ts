import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { dungeonStatisticsObserver, useDungeonStatisticsStore } from './dungeonStatisticsStore'

const event = (sourceId: string, targetMonsterId?: 'forest-wisp' | 'forest-heart', itemId?: 'life-essence', amount?: number) => ({ source: { kind: 'system' as const }, sourceKind: 'system' as const, dungeonId: 'whispering-woods' as const, target: targetMonsterId ? 'enemy' as const : undefined, targetMonsterId, category: sourceId === 'loot-drop' ? 'loot' as const : 'death' as const, sourceId, itemId, amount })

describe('Dungeon Statistics observer', () => {
  beforeEach(() => dungeonStatisticsObserver.clear())

  it('counts a full run only when the boss is defeated', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    dungeonStatisticsObserver.beginSession('whispering-woods')
    dungeonStatisticsObserver.beginEncounter('forest-wisp', false)
    dungeonStatisticsObserver.advance(4_000, state)
    dungeonStatisticsObserver.consume(event('enemy-defeated', 'forest-wisp'))
    expect(useDungeonStatisticsStore.getState().session).toMatchObject({ completedRuns: 0, normalEncounterCount: 1, normalEncounterDurationTotalMs: 4_000 })

    state.combat.enemyId = 'forest-heart'
    dungeonStatisticsObserver.beginEncounter('forest-heart', true)
    dungeonStatisticsObserver.advance(8_000, state)
    dungeonStatisticsObserver.consume(event('enemy-defeated', 'forest-heart'))
    expect(useDungeonStatisticsStore.getState().session).toMatchObject({ completedRuns: 1, bossEncounterCount: 1, completedRunDurationTotalMs: 12_000, bestRunMs: 12_000 })
  })

  it('tracks loot quantities and uptime independently of screen mounting', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    dungeonStatisticsObserver.beginSession('whispering-woods')
    dungeonStatisticsObserver.advance(4_000, state)
    state.combat.enemyId = null
    dungeonStatisticsObserver.advance(2_000, state)
    dungeonStatisticsObserver.consume(event('loot-drop', undefined, 'life-essence', 3))
    expect(useDungeonStatisticsStore.getState().session).toMatchObject({ elapsedMs: 6_000, engagedMs: 4_000, totalLootQuantity: 3, lootByItemId: { 'life-essence': 3 } })
  })

  it('ends without recording a failed run on leave or player death', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    dungeonStatisticsObserver.beginSession('whispering-woods')
    dungeonStatisticsObserver.advance(4_000, state)
    dungeonStatisticsObserver.consume(event('player-defeated'))
    expect(useDungeonStatisticsStore.getState()).toMatchObject({ active: false, session: { completedRuns: 0, normalEncounterCount: 0 } })
  })

  it('reset starts a clean measurement session while combat continues', () => {
    const state = createInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    dungeonStatisticsObserver.beginSession('whispering-woods')
    dungeonStatisticsObserver.advance(5_000, state)
    dungeonStatisticsObserver.reset()
    expect(useDungeonStatisticsStore.getState().session).toMatchObject({ elapsedMs: 0, engagedMs: 0, completedRuns: 0, currentRunElapsedMs: 0 })
    expect(useDungeonStatisticsStore.getState().active).toBe(true)
  })
})
