import { describe, expect, it } from 'vitest'
import { DUNGEONS } from '../../content/dungeons/dungeons'
import { createInitialState } from '../../../store/initialState'
import { canManuallyEngageDungeonBoss } from './combatBossSelectors'
import { spawnEnemy } from './combatRuntime'

const activeReadyState = () => {
  const state = createInitialState()
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.combat.threatCleared = DUNGEONS['whispering-woods'].threatRequired
  return state
}

describe('manual Boss engage eligibility', () => {
  it('allows a ready Boss during a normal encounter before Auto Hunt unlock', () => {
    const state = activeReadyState()
    spawnEnemy(state, 'thornling')

    expect(canManuallyEngageDungeonBoss(state, DUNGEONS['whispering-woods'])).toBe(true)
  })

  it('rejects below-threshold, Auto Hunt, queued, and active-Boss states', () => {
    const belowThreshold = activeReadyState()
    belowThreshold.combat.threatCleared -= 1
    expect(canManuallyEngageDungeonBoss(belowThreshold, DUNGEONS['whispering-woods'])).toBe(false)

    const autoHunt = activeReadyState()
    autoHunt.progress.autoHuntBossUnlocked = true
    autoHunt.progress.autoHuntBossByDungeon['whispering-woods'] = true
    expect(canManuallyEngageDungeonBoss(autoHunt, DUNGEONS['whispering-woods'])).toBe(false)

    const queued = activeReadyState()
    queued.combat.pendingBossId = 'forest-heart'
    expect(canManuallyEngageDungeonBoss(queued, DUNGEONS['whispering-woods'])).toBe(false)

    const boss = activeReadyState()
    spawnEnemy(boss, 'forest-heart')
    expect(canManuallyEngageDungeonBoss(boss, DUNGEONS['whispering-woods'])).toBe(false)
  })
})
