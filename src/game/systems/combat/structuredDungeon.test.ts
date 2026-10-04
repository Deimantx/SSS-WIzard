import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'
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
  state.combat.locationId = 'abandoned-catacombs'
  state.combat.sequenceIndex = 0
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
    state.progress.autoHuntBossByLocation['abandoned-catacombs'] = true
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('restless-skeleton')

    killCurrent(state)
    expect(state.combat.sequenceIndex).toBe(1)
    expect(state.combat.threatCleared).toBe(0)
    expect(state.combat.pendingBossId).toBeNull()
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('grave-wraith')
    killCurrent(state)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('fallen-acolyte')
    killCurrent(state)
    expect(state.combat.sequenceIndex).toBe(3)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('archmage-edrin-shade')
    expect(state.combat.inBossFight).toBe(true)
  })

  it.each([
    ['fractured-approach', 'corrupted-elemental-gatekeeper'],
    ['crossroads-of-ruin', 'crossroads-keeper'],
    ['broken-meridian', 'meridian-splitter'],
    ['black-gate', 'black-gatekeeper'],
  ] as const)('spawns %s in the authored order without Threat', (locationId, bossId) => {
    const state = prepare()
    state.combat.locationId = locationId
    state.combat.sequenceIndex = 0
    const sequenceBossIds = COMBAT_LOCATIONS[locationId].sequenceBossIds ?? []
    for (const expectedEnemyId of COMBAT_LOCATIONS[locationId].encounterSequence ?? []) {
      expect(spawnNextEnemy(state)).toBe(true)
      expect(state.combat.enemyId).toBe(expectedEnemyId)
      if (sequenceBossIds.includes(expectedEnemyId)) expect(state.combat.inBossFight).toBe(true)
      killCurrent(state)
      expect(state.combat.threatCleared).toBe(0)
    }
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(bossId)
    expect(state.combat.inBossFight).toBe(true)
  })

  it('uses the Broken Meridian unlock prerequisites and keeps it as a sequence dungeon', () => {
    const state = prepare()
    state.combat.locationId = 'broken-meridian'
    expect(COMBAT_LOCATIONS['broken-meridian'].unlock).toEqual({ type: 'all-boss-kills', bossIds: ['graveglass-behemoth', 'storm-archivist', 'fallen-astromancer'] })
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(COMBAT_LOCATIONS['broken-meridian'].encounterSequence?.[0])
    expect(state.combat.threatCleared).toBe(0)
  })

  it('ends the Black Gate after Black Gatekeeper', () => {
    const state = prepare()
    state.combat.locationId = 'black-gate'
    const sequenceBossIds = COMBAT_LOCATIONS['black-gate'].sequenceBossIds ?? []
    for (const expectedEnemyId of COMBAT_LOCATIONS['black-gate'].encounterSequence ?? []) {
      expect(spawnNextEnemy(state)).toBe(true)
      expect(state.combat.enemyId).toBe(expectedEnemyId)
      if (sequenceBossIds.includes(expectedEnemyId)) expect(state.combat.inBossFight).toBe(true)
      killCurrent(state)
    }
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('black-gatekeeper')
    killCurrent(state)

    expect(state.combat.active).toBe(false)
  })

  it('completes after Edrin, preserves player resources, and clears the run state', () => {
    const state = prepare()
    state.player.health = 61
    state.player.mana = 37
    const result = fastResolveNormalEnemiesForDebug(state, 3, 'abandoned-catacombs', false)
    expect(result).toMatchObject({ resolved: 3, bossReady: true })
    expect(state.combat.sequenceIndex).toBe(3)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('archmage-edrin-shade')
    killCurrent(state)
    expect(state.combat.active).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect('enemyWorldTier' in state.combat).toBe(false)
    expect(state.combat.sequenceIndex).toBeNull()
    expect(state.combat.targetEnemyId).toBeNull()
    expect(state.combat.pendingBossId).toBeNull()
    expect(state.combat.inBossFight).toBe(false)
    expect(state.combat.encounterTimerMs).toBe(0)
    expect(state.player.health).toBe(61)
    expect(state.player.mana).toBe(37)
    expect(state.progress.bossKillsByBoss['archmage-edrin-shade']).toBe(1)
  })

  it('resets the sequence on player death and on leaving the dungeon', () => {
    const death = prepare()
    spawnNextEnemy(death)
    death.player.health = 0
    expect(resolveCombatDeaths(death)).toBe(true)
    expect(death.combat.active).toBe(false)
    expect(death.combat.sequenceIndex).toBeNull()
    expect(death.combat.log).toContain('The wizard falls. Dungeon run reset.')

    const leave = prepare()
    useGameStore.setState({ ...useGameStore.getState(), ...leave })
    useGameStore.getState().leaveDungeon()
    expect(useGameStore.getState().combat.active).toBe(false)
    expect(useGameStore.getState().combat.sequenceIndex).toBeNull()
    expect(useGameStore.getState().combat.targetEnemyId).toBeNull()
    expect(useGameStore.getState().combat.log).toContain('Left the dungeon run.')

    const combatLeave = prepare()
    combatLeave.combat.locationId = 'whispering-woods'
    useGameStore.setState({ ...useGameStore.getState(), ...combatLeave })
    useGameStore.getState().leaveDungeon()
    expect(useGameStore.getState().combat.log).toContain('Left the Location. Threat resets.')
    expect(useGameStore.getState().combat.log).not.toContain('Left the dungeon.')

    const hunterGround = prepare()
    hunterGround.combat.locationId = 'hunters-ground'
    useGameStore.setState({ ...useGameStore.getState(), ...hunterGround })
    useGameStore.getState().leaveDungeon()
    expect(useGameStore.getState().combat.log).toContain('Left the Location.')
    expect(useGameStore.getState().combat.log.some((entry) => /Threat/.test(entry))).toBe(false)
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
    expect(offline.combat.sequenceIndex).toBe(1)
    expect(offline.combat.threatCleared).toBe(0)

    const fast = prepare()
    const result = fastResolveNormalEnemiesForDebug(fast, COMBAT_LOCATIONS['abandoned-catacombs'].encounterSequence?.length ?? 0, 'abandoned-catacombs', false)
    expect(result.resolved).toBe(3)
    expect(fast.progress.lifetimeKillsByMonster['restless-skeleton']).toBe(1)
    expect(fast.progress.lifetimeKillsByMonster['grave-wraith']).toBe(1)
    expect(fast.progress.lifetimeKillsByMonster['fallen-acolyte']).toBe(1)
    expect(fast.combat.sequenceIndex).toBe(3)
    expect(fast.combat.threatCleared).toBe(0)
  })

  it('keeps Broken Meridian sequence order and zero Threat across Offline Bank and Fast Resolve', async () => {
    const offline = prepare()
    offline.combat.locationId = 'broken-meridian'
    offline.combat.sequenceIndex = 0
    offline.offlineBankMs = 6_000
    expect(spawnNextEnemy(offline)).toBe(true)
    offline.combat.enemyHp = 0
    const offlineResult = await advanceWithOfflineBank(6_000, () => offline, (recipe) => recipe(offline), () => {}, undefined, {})
    expect(offlineResult.ok).toBe(true)
    expect(offline.combat.enemyId).toBe('fractured-channeler')
    expect(offline.combat.sequenceIndex).toBe(1)
    expect(offline.combat.threatCleared).toBe(0)

    const fast = prepare()
    fast.combat.locationId = 'broken-meridian'
    const result = fastResolveNormalEnemiesForDebug(fast, 2, 'broken-meridian', false)
    expect(result.resolved).toBe(2)
    expect(fast.combat.sequenceIndex).toBe(2)
    expect(fast.combat.threatCleared).toBe(0)
  })
})
