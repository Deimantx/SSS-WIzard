import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { advanceWithOfflineBank } from '../offline-bank/offlineBankSimulation'
import { fastResolveNormalEnemiesForDebug } from './debugCombatRuntime'
import { resolveCombatDeaths, spawnEnemy, spawnNextEnemy } from './combatRuntime'

const prepare = () => {
  const state = createInitialState()
  state.progress.bossKillsByBoss['corrupted-greatbear'] = 1
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'sequence-test', name: 'Sequence Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'sequence-test'
  state.combat.active = true
  state.combat.dungeonId = 'abandoned-catacombs'
  state.combat.dungeonSequenceIndex = 0
  return state
}

const killCurrent = (state: ReturnType<typeof prepare>) => {
  state.combat.enemyHp = 0
  expect(resolveCombatDeaths(state)).toBe(true)
}

describe('structured dungeon encounters', () => {
  it('spawns Catacombs in authored order without Threat or Auto Hunt progression', () => {
    const state = prepare()
    state.progress.autoHuntBossUnlocked = true
    state.progress.autoHuntBossByDungeon['abandoned-catacombs'] = true
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('restless-skeleton')

    killCurrent(state)
    expect(state.combat.dungeonSequenceIndex).toBe(1)
    expect(state.combat.threatCleared).toBe(0)
    expect(state.combat.pendingBossId).toBeNull()
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('grave-wraith')
    killCurrent(state)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('fallen-acolyte')
    killCurrent(state)
    expect(state.combat.dungeonSequenceIndex).toBe(3)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('archmage-edrin-shade')
    expect(state.combat.inBossFight).toBe(true)
  })

  it.each([
    ['fractured-approach', ['rift-wolf', 'arcane-scavenger', 'withered-watcher', 'warded-husk'], 'corrupted-elemental-gatekeeper'],
    ['crossroads-of-ruin', ['arcane-binder', 'rift-archer', 'remnant-marauder', 'broken-construct'], 'crossroads-keeper'],
    ['broken-meridian', ['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade'], 'meridian-splitter'],
  ] as const)('spawns %s in the authored order without Threat', (dungeonId, sequence, bossId) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    state.combat.dungeonSequenceIndex = 0
    for (const expectedEnemyId of sequence) {
      expect(spawnNextEnemy(state)).toBe(true)
      expect(state.combat.enemyId).toBe(expectedEnemyId)
      killCurrent(state)
      expect(state.combat.threatCleared).toBe(0)
    }
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(bossId)
    expect(state.combat.inBossFight).toBe(true)
  })

  it('uses the Broken Meridian unlock prerequisites and keeps it as a sequence dungeon', () => {
    const state = prepare()
    state.combat.dungeonId = 'broken-meridian'
    expect(DUNGEONS['broken-meridian'].unlock).toEqual({ type: 'all-boss-kills', bossIds: ['graveglass-behemoth', 'storm-archivist', 'fallen-astromancer'] })
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('meridian-warden')
    expect(state.combat.threatCleared).toBe(0)
  })

  it('completes after Edrin, preserves player resources, and clears the run state', () => {
    const state = prepare()
    state.player.health = 61
    state.player.mana = 37
    const result = fastResolveNormalEnemiesForDebug(state, 3, 'abandoned-catacombs', false)
    expect(result).toMatchObject({ resolved: 3, bossReady: true })
    expect(state.combat.dungeonSequenceIndex).toBe(3)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('archmage-edrin-shade')
    killCurrent(state)
    expect(state.combat.active).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.enemyWorldTier).toBeNull()
    expect(state.combat.dungeonSequenceIndex).toBeNull()
    expect(state.combat.targetEnemyId).toBeNull()
    expect(state.combat.pendingBossId).toBeNull()
    expect(state.combat.inBossFight).toBe(false)
    expect(state.combat.encounterTimerMs).toBe(0)
    expect(state.player.health).toBe(61)
    expect(state.player.mana).toBe(37)
    expect(state.progress.bossKillsByBoss['archmage-edrin-shade']).toBe(1)
    expect(state.worldTier.highestUnlocked).toBe(2)
  })

  it('resets the sequence on player death and on leaving the dungeon', () => {
    const death = prepare()
    spawnNextEnemy(death)
    death.player.health = 0
    expect(resolveCombatDeaths(death)).toBe(true)
    expect(death.combat.active).toBe(false)
    expect(death.combat.dungeonSequenceIndex).toBeNull()
    expect(death.combat.log).toContain('The wizard falls. Dungeon run reset.')

    const leave = prepare()
    useGameStore.setState({ ...useGameStore.getState(), ...leave })
    useGameStore.getState().leaveDungeon()
    expect(useGameStore.getState().combat.active).toBe(false)
    expect(useGameStore.getState().combat.dungeonSequenceIndex).toBeNull()
    expect(useGameStore.getState().combat.targetEnemyId).toBeNull()
    expect(useGameStore.getState().combat.log).toContain('Left the dungeon run.')

    const combatLeave = prepare()
    combatLeave.combat.dungeonId = 'whispering-woods'
    useGameStore.setState({ ...useGameStore.getState(), ...combatLeave })
    useGameStore.getState().leaveDungeon()
    expect(useGameStore.getState().combat.log).toContain('Left the Location. Threat resets.')
    expect(useGameStore.getState().combat.log).not.toContain('Left the dungeon.')
  })

  it('uses the same deterministic sequence during Offline Bank and Fast Resolve', async () => {
    const offline = prepare()
    offline.offlineBankMs = 6_000
    spawnNextEnemy(offline)
    offline.combat.enemyHp = 0
    const offlineResult = await advanceWithOfflineBank(6_000, () => offline, (recipe) => recipe(offline), () => {}, undefined, {})
    expect(offlineResult.ok).toBe(true)
    expect(offline.progress.lifetimeKillsByMonster['restless-skeleton']).toBe(1)
    expect(offline.combat.enemyId).toBe('grave-wraith')
    expect(offline.combat.dungeonSequenceIndex).toBe(1)
    expect(offline.combat.threatCleared).toBe(0)

    const fast = prepare()
    const result = fastResolveNormalEnemiesForDebug(fast, DUNGEONS['abandoned-catacombs'].encounterSequence?.length ?? 0, 'abandoned-catacombs', false)
    expect(result.resolved).toBe(3)
    expect(fast.progress.lifetimeKillsByMonster['restless-skeleton']).toBe(1)
    expect(fast.progress.lifetimeKillsByMonster['grave-wraith']).toBe(1)
    expect(fast.progress.lifetimeKillsByMonster['fallen-acolyte']).toBe(1)
    expect(fast.combat.dungeonSequenceIndex).toBe(3)
    expect(fast.combat.threatCleared).toBe(0)
  })

  it('keeps Broken Meridian sequence order and zero Threat across Offline Bank and Fast Resolve', async () => {
    const offline = prepare()
    offline.combat.dungeonId = 'broken-meridian'
    offline.combat.dungeonSequenceIndex = 0
    offline.offlineBankMs = 6_000
    expect(spawnNextEnemy(offline)).toBe(true)
    offline.combat.enemyHp = 0
    const offlineResult = await advanceWithOfflineBank(6_000, () => offline, (recipe) => recipe(offline), () => {}, undefined, {})
    expect(offlineResult.ok).toBe(true)
    expect(offline.combat.enemyId).toBe('fractured-channeler')
    expect(offline.combat.dungeonSequenceIndex).toBe(1)
    expect(offline.combat.threatCleared).toBe(0)

    const fast = prepare()
    fast.combat.dungeonId = 'broken-meridian'
    const result = fastResolveNormalEnemiesForDebug(fast, 2, 'broken-meridian', false)
    expect(result.resolved).toBe(2)
    expect(fast.combat.dungeonSequenceIndex).toBe(2)
    expect(fast.combat.threatCleared).toBe(0)
  })
})
