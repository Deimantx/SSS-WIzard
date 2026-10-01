import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { isDungeonCompleted } from '../../content/combat-locations/dungeons/dungeons'
import { isSummoningUnlocked } from '../summoning/summoningSelectors'
import { finishEnemy, spawnEnemy } from './combatRuntime'
import { createCombatTestState } from './testCombatState'
import { getHunterContractChoiceCount } from '../hunters-order/huntersOrderRuntime'

describe('Corrupted Elemental Gatekeeper completion', () => {
  it('uses the normal boss death pipeline once for T2 completion and Summoning unlock', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.locationId = 'fractured-approach'
    spawnEnemy(state, 'corrupted-elemental-gatekeeper')
    state.combat.enemyHp = 0
    let lootResolutions = 0

    finishEnemy(state, undefined, undefined, undefined, (_state, enemyId, drops) => {
      expect(enemyId).toBe('corrupted-elemental-gatekeeper')
      expect(drops.length).toBeGreaterThan(0)
      lootResolutions += 1
    })

    expect(state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper']).toBe(1)
    expect(isDungeonCompleted('fractured-approach', state.progress)).toBe(true)
    expect(isSummoningUnlocked(state)).toBe(true)
    expect(state.notifications.map((notification) => notification.text)).toEqual(expect.arrayContaining([
      'Wizard Tower: Summoning unlocked.',
      'FRACTURED APPROACH COMPLETE / Branch routes unlocked.',
    ]))
    expect(lootResolutions).toBe(1)

    finishEnemy(state)
    expect(state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper']).toBe(1)
    expect(lootResolutions).toBe(1)
  })

  it('clears the active spell runtime when a sequence dungeon completes', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.locationId = 'fractured-approach'
    expect(spawnEnemy(state, 'corrupted-elemental-gatekeeper')).toBe(true)
    state.combat.activeSpellLoadout = { presetId: 'spell-preset-1', presetName: 'Active Snapshot', slots: [{ spellId: 'fire-bolt', autoCast: true }], signature: 'fire-bolt:1' }
    state.activities.autoCast['fire-bolt'] = true
    state.activities.autoCastPriority = ['fire-bolt']
    state.combat.enemyHp = 0

    finishEnemy(state)

    expect(state.combat.active).toBe(false)
    expect(state.combat.activeSpellLoadout).toBeNull()
    expect(state.activities.autoCast['fire-bolt']).toBe(false)
    expect(state.activities.autoCastPriority).toEqual([])
    expect(state.spellPresets.selectedPresetId).toBe('spell-preset-1')
  })
})

describe('Hunter Order first unlock', () => {
  it('issues the first Routine Contract from the actual first Greatbear kill', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.locationId = 'howling-den'
    expect(spawnEnemy(state, 'corrupted-greatbear')).toBe(true)
    state.combat.enemyHp = 0

    finishEnemy(state)

    expect(state.progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(state.progress.huntersOrder.activeContract).toMatchObject({ tier: 'routine', target: expect.any(Number), marksReward: 3 })
    expect(state.progress.huntersOrder.availableContracts).toEqual([])
    expect(state.progress.huntersOrder.totalContractsAccepted).toBe(1)
    expect(getHunterContractChoiceCount(state)).toBe(0)
  })
})
