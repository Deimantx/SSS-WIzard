import { describe, expect, it } from 'vitest'
import { createInitialState } from '../../../store/initialState'
import { useGameStore } from '../../../store/gameStore'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { getCombatLocationByDungeonId, isCombatTargetForLocation } from '../../content/world-navigation'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { resolveEnemyPowerRating } from '../../presentation/combat/enemyPowerRating'
import { abandonCurrentEncounter, finishEnemy, spawnNextEnemy, spawnEnemy } from './combatRuntime'
import { fastResolveNormalEnemiesForDebug } from './debugCombatRuntime'

const prepare = () => {
  const state = createInitialState()
  state.progress.spellRanks['fire-bolt'] = 1
  state.spellPresets.presets = [{ id: 'targeted-test', name: 'Targeted Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'targeted-test'
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  return state
}

const installStoreState = (state: ReturnType<typeof prepare>) => {
  useGameStore.setState({ ...useGameStore.getState(), ...state })
}

describe('Whispering Woods targeted farming', () => {
  it('validates only authored normal targets and rejects the Zone Boss', () => {
    const location = getCombatLocationByDungeonId('whispering-woods')
    expect(isCombatTargetForLocation(location, 'whispering-woods', 'cinder-moth')).toBe(true)
    expect(isCombatTargetForLocation(location, 'whispering-woods', 'forest-heart')).toBe(false)
    expect(isCombatTargetForLocation(location, 'whispering-woods', 'corrupted-greatbear')).toBe(false)
    expect(isCombatTargetForLocation(getCombatLocationByDungeonId('howling-den'), 'howling-den', 'cinder-moth')).toBe(false)
  })

  it('repeats the selected target regardless of encounter RNG', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'cinder-moth'
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('cinder-moth')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('cinder-moth')
    expect(state.combat.threatCleared).toBe(resolveEnemyPowerRating('cinder-moth', 1))
  })

  it('switches the next normal spawn without interrupting the current enemy', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'stone-root'
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('stone-root')
    state.combat.targetEnemyId = 'forest-wisp'
    expect(state.combat.enemyId).toBe('stone-root')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('forest-wisp')
  })

  it.each([
    ['forest-wisp', 'air', 10],
    ['cinder-moth', 'fire', 20],
    ['tempest-stag', 'air', 50],
  ] as const)('adds Power Threat for %s', (enemyId, type, amount) => {
    const state = prepare()
    state.combat.targetEnemyId = enemyId
    spawnNextEnemy(state)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(resolveEnemyPowerRating(enemyId, 1))
    expect(state.resonance[type]).toBe(amount)
  })

  it('keeps the target through the Zone Boss and resumes the same target', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'tempest-stag'
    spawnEnemy(state, 'forest-heart')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(0)
    expect(state.combat.targetEnemyId).toBe('tempest-stag')
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('tempest-stag')
  })

  it('uses the canonical World Tier resolver for target rewards', () => {
    expect(resolveEnemyResonanceReward('dewbound-sprite', 1).finalYield).toMatchObject({ water: 18 })
    expect(resolveEnemyResonanceReward('cinder-moth', 1).finalYield).toMatchObject({ fire: 20 })
    expect(resolveEnemyResonanceReward('tempest-stag', 1).finalYield).toMatchObject({ air: 50, earth: 15 })
    expect(resolveEnemyResonanceReward('dewbound-sprite', 2).finalYield).toMatchObject({ water: 36 })
    expect(resolveEnemyResonanceReward('cinder-moth', 2).finalYield).toMatchObject({ fire: 40 })
    expect(resolveEnemyResonanceReward('tempest-stag', 2).finalYield).toMatchObject({ air: 100, earth: 30 })
  })

  it('honors target selection in every targeted zone and Fast Resolve', () => {
    const randomState = prepare()
    randomState.combat.dungeonId = 'howling-den'
    randomState.combat.targetEnemyId = 'cavefang-wolf'
    const randomResult = fastResolveNormalEnemiesForDebug(randomState, 1, 'howling-den', false)
    expect(randomResult.resolved).toBe(1)
    expect(randomState.progress.lifetimeKillsByMonster['cavefang-wolf']).toBe(1)

    const targetedState = prepare()
    targetedState.combat.targetEnemyId = 'forest-wisp'
    const result = fastResolveNormalEnemiesForDebug(targetedState, 2, 'whispering-woods', false)
    expect(result.resolved).toBe(2)
    expect(targetedState.progress.lifetimeKillsByMonster['forest-wisp']).toBe(2)
    expect(targetedState.resonance.air).toBe(20)
  })

  it('uses the target during the next offline simulation spawn', async () => {
    const state = prepare()
    state.combat.targetEnemyId = 'cinder-moth'
    state.offlineBankMs = 5_000
    expect(spawnNextEnemy(state)).toBe(true)
    state.combat.enemyHp = 0
    const { advanceWithOfflineBank } = await import('../offline-bank/offlineBankSimulation')
    const result = await advanceWithOfflineBank(5_000, () => state, (recipe) => recipe(state), () => {}, undefined, {})
    expect(result.ok).toBe(true)
    expect(state.progress.lifetimeKillsByMonster['cinder-moth']).toBeGreaterThanOrEqual(1)
  })

  it('abandons a normal encounter immediately without granting its pending rewards', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'cinder-moth'
    spawnEnemy(state, 'cinder-moth')
    state.combat.enemyHp = 1
    state.combat.threatCleared = 7
    state.player.health = 73
    state.player.mana = 12
    const killsBefore = state.progress.lifetimeKills
    const resonanceBefore = { ...state.resonance }
    const arcanePointsBefore = state.arcaneCore.totalPointsEarned

    installStoreState(state)
    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'forest-wisp')).toBe(true)
    const next = useGameStore.getState()
    expect(next.combat.enemyId).toBe('forest-wisp')
    expect(next.combat.targetEnemyId).toBe('forest-wisp')
    expect(next.combat.threatCleared).toBe(7)
    expect(next.player.health).toBe(73)
    expect(next.player.mana).toBe(12)
    expect(next.progress.lifetimeKills).toBe(killsBefore)
    expect(next.resonance).toEqual(resonanceBefore)
    expect(next.arcaneCore.totalPointsEarned).toBe(arcanePointsBefore)
  })

  it('keeps the same active target instance intact when HUNT TARGET is repeated', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'tempest-stag'
    spawnEnemy(state, 'tempest-stag')
    state.combat.enemyHp = 123
    state.combat.encounterTimerMs = 456
    state.combat.pendingBossId = 'forest-heart'
    const instanceKey = state.combat.enemyInstanceKey

    installStoreState(state)
    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'tempest-stag')).toBe(true)
    const next = useGameStore.getState()
    expect(next.combat.enemyId).toBe('tempest-stag')
    expect(next.combat.enemyInstanceKey).toBe(instanceKey)
    expect(next.combat.enemyHp).toBe(123)
    expect(next.combat.encounterTimerMs).toBe(456)
    expect(next.combat.pendingBossId).toBeNull()
  })

  it('abandons a boss without boss progression and preserves Threat before spawning the target', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'tempest-stag'
    state.combat.threatCleared = DUNGEONS['whispering-woods'].threatRequired
    spawnEnemy(state, 'forest-heart')
    const bossKillsBefore = state.progress.bossKillsByBoss['forest-heart'] ?? 0
    const firstBossKillBefore = state.progress.firstBossKill
    const resonanceBefore = { ...state.resonance }

    installStoreState(state)
    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'stone-root')).toBe(true)
    const next = useGameStore.getState()
    expect(next.combat.enemyId).toBe('stone-root')
    expect(next.combat.inBossFight).toBe(false)
    expect(next.combat.threatCleared).toBe(DUNGEONS['whispering-woods'].threatRequired)
    expect(next.progress.bossKillsByBoss['forest-heart'] ?? 0).toBe(bossKillsBefore)
    expect(next.progress.firstBossKill).toBe(firstBossKillBefore)
    expect(next.resonance).toEqual(resonanceBefore)
  })

  it('switches to a different Location through the same canonical Hunt action', () => {
    const state = prepare()
    state.combat.dungeonId = 'howling-den'
    spawnEnemy(state, 'cavefang-wolf')
    installStoreState(state)

    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'forest-wisp')).toBe(true)
    const next = useGameStore.getState()
    expect(next.combat.active).toBe(true)
    expect(next.combat.dungeonId).toBe('whispering-woods')
    expect(next.combat.enemyId).toBe('forest-wisp')
    expect(next.combat.targetEnemyId).toBe('forest-wisp')
  })

  it('lets an explicit Hunt cancel a pending Auto Hunt boss transition', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'forest-wisp'
    state.combat.pendingBossId = 'forest-heart'
    state.progress.autoHuntBossByDungeon['whispering-woods'] = true
    installStoreState(state)

    expect(useGameStore.getState().huntCombatTarget('whispering-woods', 'forest-wisp')).toBe(true)
    const next = useGameStore.getState()
    expect(next.combat.enemyId).toBe('forest-wisp')
    expect(next.combat.pendingBossId).toBeNull()
    expect(next.combat.inBossFight).toBe(false)
  })

  it('clears only enemy runtime when the reusable abandonment helper is used', () => {
    const state = prepare()
    state.combat.targetEnemyId = 'forest-wisp'
    state.combat.threatCleared = 9
    state.combat.playerBarrier = 22
    state.combat.playerStatuses = [{ statusId: 'burning', holder: 'player', instanceKey: 'test-player-burning', source: { actor: 'player', kind: 'system', sourceId: 'test' }, remainingMs: 1000, initialDurationMs: 1000, stacks: 1 }]
    spawnEnemy(state, 'forest-wisp')
    state.combat.enemyHp = 1
    state.combat.enemyBarrier = 11
    abandonCurrentEncounter(state)
    expect(state.combat.enemyId).toBeNull()
    expect(state.combat.enemyHp).toBe(0)
    expect(state.combat.enemyBarrier).toBe(0)
    expect(state.combat.threatCleared).toBe(9)
    expect(state.combat.playerBarrier).toBe(22)
    expect(state.combat.playerStatuses).toHaveLength(1)
  })
})

describe('Elemental Scar targeted farming', () => {
  it('does not enter a targeted Location through the no-target Dungeon action', () => {
    const state = prepare()
    state.progress.bossKillsByBoss['corrupted-elemental-gatekeeper'] = 1
    state.combat.active = false
    state.combat.dungeonId = null
    installStoreState(state)
    useGameStore.getState().enterDungeon('flooded-reliquary')
    const next = useGameStore.getState()
    expect(next.combat.active).toBe(false)
    expect(next.combat.dungeonId).toBeNull()
    expect(next.notifications.some((note) => note.text.includes('Select a Hunt Target'))).toBe(true)
  })

  it('requires a valid Hunt Target instead of falling back to a random pool', () => {
    const state = prepare()
    state.combat.dungeonId = 'flooded-reliquary'
    expect(spawnNextEnemy(state)).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.notifications.some((note) => note.text.includes('Select a Hunt Target'))).toBe(true)
  })

  it.each([
    ['flooded-reliquary', 'tidefang-serpent', 'water'],
    ['ashen-watch', 'emberwing-harrier', 'fire'],
    ['rootscar-hollow', 'sporeback-brute', 'earth'],
  ] as const)('repeats %s target and resolves Power Threat plus Resonance', (dungeonId, targetEnemyId, resonanceType) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    state.combat.targetEnemyId = targetEnemyId
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(targetEnemyId)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(resolveEnemyPowerRating(targetEnemyId, 1))
    expect(state.resonance[resonanceType]).toBeGreaterThan(0)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(targetEnemyId)
  })
})

describe('Shattered Meridian targeted farming', () => {
  it.each([
    ['graveglass-hollow', 'epitaph-weaver', 'water', 38],
    ['stormvault-gallery', 'thundercoil-serpent', 'air', 44],
    ['starfallen-observatory', 'comet-wraith', 'fire', 42],
  ] as const)('repeats the selected %s target without random fallback', (dungeonId, targetEnemyId, resonanceType, resonanceAmount) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    state.combat.targetEnemyId = targetEnemyId
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(targetEnemyId)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(resolveEnemyPowerRating(targetEnemyId, 1))
    expect(state.resonance[resonanceType]).toBe(resonanceAmount)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(targetEnemyId)
  })

  it.each(['graveglass-hollow', 'stormvault-gallery', 'starfallen-observatory'] as const)('rejects a no-target spawn for %s instead of choosing a random normal', (dungeonId) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    expect(spawnNextEnemy(state)).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.notifications.some((note) => note.text.includes('Select a Hunt Target'))).toBe(true)
  })

  it('preserves the selected Shattered target through its boss encounter', () => {
    const state = prepare()
    state.combat.dungeonId = 'graveglass-hollow'
    state.combat.targetEnemyId = 'ossuary-oracle'
    spawnEnemy(state, 'graveglass-behemoth')
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.targetEnemyId).toBe('ossuary-oracle')
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe('ossuary-oracle')
  })
})

describe('Black Sigil Reach targeted farming', () => {
  it.each([
    ['hall-of-unbound-names', 'nameless-cantor', 'unspoken-prelate', 'air', 32],
    ['vault-of-the-black-sigil', 'blackscript-colossus', 'sigil-warden', 'earth', 70],
  ] as const)('repeats the selected %s target without random fallback', (dungeonId, targetEnemyId, bossId, resonanceType, resonanceAmount) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    state.combat.targetEnemyId = targetEnemyId
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(targetEnemyId)
    state.combat.enemyHp = 0
    finishEnemy(state)
    expect(state.combat.threatCleared).toBe(resolveEnemyPowerRating(targetEnemyId, 1))
    expect(state.resonance[resonanceType]).toBe(resonanceAmount)
    expect(spawnNextEnemy(state)).toBe(true)
    expect(state.combat.enemyId).toBe(targetEnemyId)
    expect(bossId).not.toBe(targetEnemyId)
  })

  it.each(['hall-of-unbound-names', 'vault-of-the-black-sigil'] as const)('rejects a no-target spawn for %s instead of selecting a random normal', (dungeonId) => {
    const state = prepare()
    state.combat.dungeonId = dungeonId
    expect(spawnNextEnemy(state)).toBe(false)
    expect(state.combat.enemyId).toBeNull()
    expect(state.notifications.some((note) => note.text.includes('Select a Hunt Target'))).toBe(true)
  })
})
