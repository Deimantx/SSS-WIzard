import { describe, expect, it } from 'vitest'
import { DUNGEONS, isDungeonCompleted, isTutorialCompleted } from './content/dungeons/dungeons'
import { createInitialState } from '../store/initialState'
import { finishEnemy, spawnEnemy } from './systems/combat/combatRuntime'
import { promoteGuildAction } from '../store/actions/guildActions'
import { useGameStore } from '../store/gameStore'

describe('dungeon progression helpers', () => {
  it('uses boss records for dungeon and tutorial completion', () => {
    const state = createInitialState()
    expect(isDungeonCompleted('whispering-woods', state.progress)).toBe(false)
    expect(isTutorialCompleted(state.progress)).toBe(false)

    state.progress.firstMainBossKill = true
    expect(isTutorialCompleted(state.progress)).toBe(false)
    state.progress.bossKillsByBoss['archmage-edrin-shade'] = 1
    expect(isDungeonCompleted('abandoned-catacombs', state.progress)).toBe(true)
    expect(isTutorialCompleted(state.progress)).toBe(true)
  })

  it('does not replace an active normal monster when engaging a boss', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setBossKills('forest-heart', 1)
    game.enterDungeon('howling-den')
    game.spawnDebugEnemy('cavefang-wolf')
    game.setThreat(DUNGEONS['howling-den'].threatRequired)
    const before = useGameStore.getState()

    game.engageBoss('corrupted-greatbear')

    const after = useGameStore.getState()
    expect(after.combat.enemyId).toBe('cavefang-wolf')
    expect(after.combat.enemyHp).toBe(before.combat.enemyHp)
    expect(after.combat.inBossFight).toBe(false)
    expect(after.combat.threatCleared).toBe(DUNGEONS['howling-den'].threatRequired)
    expect(after.progress.bossKillsByBoss['corrupted-greatbear']).toBeUndefined()
  })

  it('consumes a queued boss when manually engaging it during the encounter gap', () => {
    const game = useGameStore.getState()
    game.resetSave()
    game.setBossKills('forest-heart', 1)
    game.enterDungeon('howling-den')
    game.toggleAutoHunt('howling-den')
    game.setThreat(DUNGEONS['howling-den'].threatRequired - 1)
    game.spawnDebugEnemy('cavefang-wolf')
    game.killCurrentEnemy()
    expect(useGameStore.getState().combat.pendingBossId).toBe('corrupted-greatbear')

    game.engageBoss('corrupted-greatbear')
    expect(useGameStore.getState().combat.pendingBossId).toBeNull()
    expect(useGameStore.getState().combat.enemyId).toBe('corrupted-greatbear')
    expect(useGameStore.getState().combat.inBossFight).toBe(true)

    game.killCurrentEnemy()
    for (let index = 0; index < DUNGEONS['howling-den'].encounterDelayMs / 1000; index += 1) game.tick(1000)
    const nextEnemy = useGameStore.getState().combat.enemyId
    expect(nextEnemy).not.toBe('corrupted-greatbear')
    expect(nextEnemy ? DUNGEONS['howling-den'].monsterPool : []).toContain(nextEnemy)
  })
})

describe('dungeon-specific Guild request progression', () => {
  it('counts Grove Sentinel as a normal kill and keeps Clear the Woods local to Whispering Woods', () => {
    const state = createInitialState()
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
    expect(state.progress.permanentFocusBonuses['guild-apprentice']).toBe(10)
  })

  it('makes the chapter-complete developer preset canonical', () => {
    const game = useGameStore.getState()
    game.preset('chapter-complete')
    const state = useGameStore.getState()

    expect(DUNGEONS['whispering-woods'].boss).toBe('forest-heart')
    expect(DUNGEONS['howling-den'].boss).toBe('corrupted-greatbear')
    expect(DUNGEONS['abandoned-catacombs'].boss).toBe('archmage-edrin-shade')
    expect(state.progress.bossKillsByBoss['forest-heart']).toBe(1)
    expect(state.progress.bossKillsByBoss['corrupted-greatbear']).toBe(1)
    expect(state.progress.bossKillsByBoss['archmage-edrin-shade']).toBe(1)
    expect(isTutorialCompleted(state.progress)).toBe(true)
  })
})
