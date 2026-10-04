import { describe, expect, it } from 'vitest'
import { COMBAT_LOCATIONS } from '../../content/combat-locations/worldNavigation'
import { createInitialState } from '../../../store/initialState'
import { canManuallyEngageDungeonBoss, isBossCurrentlyActive } from './combatBossSelectors'
import { spawnEnemy } from './combatRuntime'

const activeReadyState = () => {
  const state = createInitialState()
  for (const bossId of ['archmage-edrin-shade', 'corrupted-elemental-gatekeeper', 'crossroads-keeper', 'meridian-splitter'] as const) state.progress.bossKillsByBoss[bossId] = 1
  state.progress.spellRanks['fire-bolt'] = 1
  state.progress.chronicle.eventFlags['first-elemental-tutorial-boss-defeated'] = true
  state.spellPresets.presets = [{ id: 'boss-selector-test', name: 'Boss Selector Test', slots: [{ spellId: 'fire-bolt', autoCast: false }] }]
  state.spellPresets.selectedPresetId = 'boss-selector-test'
  state.combat.active = true
  state.combat.locationId = 'whispering-woods'
  state.combat.threatCleared = COMBAT_LOCATIONS['whispering-woods'].threatRequired!
  return state
}

describe('manual Boss engage eligibility', () => {
  it('allows a ready Boss during a normal encounter before Auto Hunt unlock', () => {
    const state = activeReadyState()
    spawnEnemy(state, 'thornling')

    expect(canManuallyEngageDungeonBoss(state, COMBAT_LOCATIONS['whispering-woods'])).toBe(true)
  })

  it('rejects below-threshold, Auto Hunt, queued, and active-Boss states', () => {
    const belowThreshold = activeReadyState()
    belowThreshold.combat.threatCleared -= 1
    expect(canManuallyEngageDungeonBoss(belowThreshold, COMBAT_LOCATIONS['whispering-woods'])).toBe(false)

    const autoHunt = activeReadyState()
    autoHunt.progress.autoHuntBossUnlocked = true
    autoHunt.progress.autoHuntBossByLocation['whispering-woods'] = true
    expect(canManuallyEngageDungeonBoss(autoHunt, COMBAT_LOCATIONS['whispering-woods'])).toBe(false)

    const queued = activeReadyState()
    queued.combat.pendingBossId = 'forest-heart'
    expect(canManuallyEngageDungeonBoss(queued, COMBAT_LOCATIONS['whispering-woods'])).toBe(false)

    const boss = activeReadyState()
    spawnEnemy(boss, 'forest-heart')
    expect(isBossCurrentlyActive(boss)).toBe(true)
    expect(canManuallyEngageDungeonBoss(boss, COMBAT_LOCATIONS['whispering-woods'])).toBe(false)
  })
})
