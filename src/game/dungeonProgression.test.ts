import { describe, expect, it } from 'vitest'
import { DUNGEONS, isDungeonCompleted, isTutorialCompleted } from './content/dungeons/dungeons'
import { createInitialState } from '../store/initialState'
import { finishEnemy, spawnEnemy } from './systems/combat/combatRuntime'
import { promoteGuildAction } from '../store/actions/guildActions'
import { useGameStore } from '../store/gameStore'
import { createCombatTestState } from './systems/combat/testCombatState'

const resetCombatGame = () => {
  const game = useGameStore.getState()
  game.resetSave()
  useGameStore.setState(createCombatTestState())
  return useGameStore.getState()
}

describe('dungeon progression helpers', () => {
  it('uses boss records for dungeon and tutorial completion', () => {
    const state = createCombatTestState()
    expect(isDungeonCompleted('whispering-woods', state.progress)).toBe(false)
    expect(isTutorialCompleted(state.progress)).toBe(false)

    state.progress.firstMainBossKill = true
    expect(isTutorialCompleted(state.progress)).toBe(false)
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    expect(isDungeonCompleted('abandoned-catacombs', state.progress)).toBe(true)
    expect(isTutorialCompleted(state.progress)).toBe(true)
  })

  it('replaces an active normal monster without resolving it when engaging a boss', () => {
    const game = resetCombatGame()
    game.setBossKills('forest-heart', 1)
    game.enterTargetedCombat('howling-den', 'cavefang-wolf')
    game.spawnDebugEnemy('cavefang-wolf')
    game.setThreat(DUNGEONS['howling-den'].threatRequired)
    game.setPlayerBarrier(37)
    useGameStore.setState((state) => ({ combat: { ...state.combat, spellCooldowns: { ...state.combat.spellCooldowns, 'fire-bolt': 123 } } }))
    const before = useGameStore.getState()
    const beforeHealth = before.player.health
    const beforeMana = before.player.mana
    const beforeBarrier = before.combat.playerBarrier
    const beforeCooldown = before.combat.spellCooldowns['fire-bolt']
    const beforeThreat = before.combat.threatCleared
    const beforeKills = before.progress.lifetimeKills
    const beforeMonsterKills = before.progress.lifetimeKillsByMonster['cavefang-wolf'] ?? 0
    const beforeInventory = { ...before.inventory }

    game.engageBoss('corrupted-greatbear')

    const after = useGameStore.getState()
    expect(after.combat.enemyId).toBe('corrupted-greatbear')
    expect(after.combat.enemyHp).toBe(after.combat.enemyMaxHp)
    expect(after.combat.inBossFight).toBe(true)
    expect(after.combat.threatCleared).toBe(beforeThreat)
    expect(after.player.health).toBe(beforeHealth)
    expect(after.player.mana).toBe(beforeMana)
    expect(after.combat.playerBarrier).toBe(beforeBarrier)
    expect(after.combat.spellCooldowns['fire-bolt']).toBe(beforeCooldown)
    expect(after.progress.lifetimeKills).toBe(beforeKills)
    expect(after.progress.lifetimeKillsByMonster['cavefang-wolf'] ?? 0).toBe(beforeMonsterKills)
    expect(after.inventory).toEqual(beforeInventory)
    expect(after.progress.bossKillsByBoss['corrupted-greatbear']).toBeUndefined()
  })

  it('does not duplicate a boss transition when a boss is already queued by Auto Hunt', () => {
    const game = resetCombatGame()
    game.setBossKills('forest-heart', 1)
    game.enterTargetedCombat('howling-den', 'cavefang-wolf')
    game.toggleAutoHunt('howling-den')
    game.setThreat(DUNGEONS['howling-den'].threatRequired - 1)
    game.spawnDebugEnemy('cavefang-wolf')
    game.killCurrentEnemy()
    expect(useGameStore.getState().combat.pendingBossId).toBe('corrupted-greatbear')

    game.engageBoss('corrupted-greatbear')
    expect(useGameStore.getState().combat.pendingBossId).toBe('corrupted-greatbear')
    expect(useGameStore.getState().combat.enemyId).toBeNull()

    for (let index = 0; index < DUNGEONS['howling-den'].encounterDelayMs / 1000; index += 1) game.tick(1000)
    const nextEnemy = useGameStore.getState().combat.enemyId
    expect(nextEnemy).toBe('corrupted-greatbear')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)
  })

  it('switches an active run directly into another unlocked dungeon without resolving the old encounter', () => {
    const game = resetCombatGame()
    game.setBossKills('forest-heart', 1)
    game.enterTargetedCombat('whispering-woods', 'forest-wisp')
    game.setThreat(18)
    game.spawnDebugEnemy('grove-sentinel')
    const before = useGameStore.getState()
    const beforeInventory = { ...before.inventory }
    const beforeKills = before.progress.lifetimeKills
    const beforeMonsterKills = before.progress.lifetimeKillsByMonster['grove-sentinel'] ?? 0

    game.enterTargetedCombat('howling-den', 'cavefang-wolf')

    const after = useGameStore.getState()
    expect(after.combat.active).toBe(true)
    expect(after.combat.dungeonId).toBe('howling-den')
    expect(after.combat.threatCleared).toBe(0)
    expect(after.combat.pendingBossId).toBeNull()
    expect(after.combat.inBossFight).toBe(false)
    expect(after.combat.enemyId).toBeTruthy()
    expect(after.ui.lastEnteredCombatDungeonId).toBe('howling-den')
    expect(DUNGEONS['howling-den'].monsterPool).toContain(after.combat.enemyId)
    expect(after.inventory).toEqual(beforeInventory)
    expect(after.progress.lifetimeKills).toBe(beforeKills)
    expect(after.progress.lifetimeKillsByMonster['grove-sentinel'] ?? 0).toBe(beforeMonsterKills)
  })

  it('abandons a queued or active boss attempt when switching dungeons', () => {
    const game = resetCombatGame()
    game.setBossKills('forest-heart', 1)
    game.enterTargetedCombat('whispering-woods', 'forest-wisp')
    game.jumpDebugToBoss('whispering-woods')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)

    game.enterTargetedCombat('howling-den', 'cavefang-wolf')

    const after = useGameStore.getState()
    expect(after.combat.dungeonId).toBe('howling-den')
    expect(after.combat.threatCleared).toBe(0)
    expect(after.combat.inBossFight).toBe(false)
    expect(after.combat.enemyId).not.toBe('forest-heart')
    expect(after.progress.bossKillsByBoss['forest-heart']).toBe(1)
  })

  it('returns to the same active dungeon without restarting its run', () => {
    const game = resetCombatGame()
    game.enterTargetedCombat('whispering-woods', 'forest-wisp')
    game.setThreat(17)
    game.setEnemyHealthPercent(37)
    const before = useGameStore.getState()
    const beforeEnemy = before.combat.enemyId
    const beforeEnemyHp = before.combat.enemyHp
    const beforeEnemySerial = before.combat.enemyInstanceSerial

    game.enterTargetedCombat('whispering-woods', 'forest-wisp')

    const after = useGameStore.getState()
    expect(after.combat.dungeonId).toBe('whispering-woods')
    expect(after.combat.threatCleared).toBe(17)
    expect(after.combat.enemyId).toBe(beforeEnemy)
    expect(after.combat.enemyHp).toBe(beforeEnemyHp)
    expect(after.combat.enemyInstanceSerial).toBe(beforeEnemySerial)
  })

  it('keeps the active run when a locked dungeon is requested', () => {
    const game = resetCombatGame()
    game.enterTargetedCombat('whispering-woods', 'forest-wisp')
    game.setThreat(12)
    const before = useGameStore.getState()

    game.enterTargetedCombat('howling-den', 'cavefang-wolf')

    const after = useGameStore.getState()
    expect(after.combat.active).toBe(true)
    expect(after.combat.dungeonId).toBe('whispering-woods')
    expect(after.combat.threatCleared).toBe(12)
    expect(after.combat.enemyId).toBe(before.combat.enemyId)
  })

})

describe('dungeon-specific Guild request progression', () => {
  it('counts Grove Sentinel as a normal kill and keeps Clear the Woods local to Whispering Woods', () => {
    const state = createCombatTestState()
    state.combat.active = true
    state.combat.dungeonId = 'howling-den'
    state.progress.requestProgress['clear-the-woods'] = 10

    for (let index = 0; index < 5; index += 1) {
      spawnEnemy(state, 'cavefang-wolf')
      finishEnemy(state)
    }
    expect(state.progress.requestProgress['clear-the-woods']).toBe(10)

    state.combat.dungeonId = 'whispering-woods'
    spawnEnemy(state, 'forest-wisp')
    finishEnemy(state)
    expect(state.progress.requestProgress['clear-the-woods']).toBe(11)
    spawnEnemy(state, 'grove-sentinel')
    finishEnemy(state)
    spawnEnemy(state, 'grove-sentinel')
    finishEnemy(state)

    expect(state.progress.requestProgress['clear-the-woods']).toBe(13)
    expect(state.progress.lifetimeKillsByMonster['grove-sentinel']).toBe(2)
    expect(state.progress.requestProgress['sentinel-breaker']).toBe(2)
  })

  it('keeps Apprentice promotion reachable when all three requests are complete', () => {
    const state = createInitialState()
    state.progress.guildRank = 'initiate'
    state.progress.guildReputation = 175
    state.progress.requestProgress = { 'arcane-supply': 20, 'clear-the-woods': 30, 'sentinel-breaker': 2 }

    promoteGuildAction(state)

    expect(state.progress.guildRank).toBe('apprentice')
    expect(state.progress.permanentManaBonuses['guild-apprentice']).toBe(10)
  })

  it('claims each completed Guild Request once and preserves the authored reputation total', () => {
    const game = resetCombatGame()
    useGameStore.setState((state) => {
      state.progress.guildUnlocked = true
      state.progress.requestProgress = { 'clear-the-woods': 30, 'sentinel-breaker': 2 }
      state.inventory['fire-fragment'] = 20
      return state
    })

    game.donateGuildRequest('arcane-supply', 'max')
    game.claimGuildReward('arcane-supply')
    game.claimGuildReward('clear-the-woods')
    game.claimGuildReward('sentinel-breaker')
    game.claimGuildReward('sentinel-breaker')

    const state = useGameStore.getState()
    expect(state.progress.requestClaims).toEqual({ 'arcane-supply': true, 'clear-the-woods': true, 'sentinel-breaker': true })
    expect(state.progress.guildReputation).toBe(175)
    expect(state.inventory['fire-fragment']).toBe(0)
  })

})
