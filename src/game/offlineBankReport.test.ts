import { describe, expect, it, vi } from 'vitest'
import { BALANCE } from './core/balance/balance'
import { getSchoolTotalXpForLevel } from './core/balance/schoolXpCurve'
import { advanceGameState } from './systems/simulation/advanceGameState'
import { advanceWithOfflineBank, isOfflineBankSimulationActive } from './systems/offline-bank/offlineBankSimulation'
import { createOfflineBankReportCollector } from './systems/offline-bank/offlineBankReport'
import { makeInitialState } from '../store/gameStore'
import { serializeGameState } from '../persistence/profileSaveManager'
import { prepareResearchAction, setResearchEchoesAction } from '../store/actions/researchActions'

const runTick = (state: ReturnType<typeof makeInitialState>, report: ReturnType<typeof createOfflineBankReportCollector>) => {
  advanceGameState(state, 1, { mode: 'banked', report })
  return report.finalize(state)
}

describe('Offline Bank event reports', () => {
  it('reports Transmutation and research independently when their net inventory change is zero', () => {
    const state = makeInitialState()
    state.player.mana = state.player.maxMana
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 5999 }
    state.inventory['fire-fragment'] = 1
    state.activities.research = { ...state.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'fire', remainingQuantity: 1, progressMs: BALANCE.research.durationPerItemMs - 1 }
    const report = createOfflineBankReportCollector(state, 1, 1_000)
    const result = runTick(state, report)

    expect(result.production.transmutation['fire-fragment']).toBe(1)
    expect(result.research.researchedItems['fire-fragment']).toBe(1)
    expect(result.research.xpBySchool.fire).toBe(12)
    expect(result.netInventory['fire-fragment']).toBe(0)
  })

  it('reports successful equipment Transmutation ingredients and output', () => {
    const state = makeInitialState()
    state.progress.firstBossKill = true
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    state.inventory['fire-fragment'] = 4
    state.inventory['wisp-essence'] = 4
    state.inventory['grove-bark'] = 1
    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 1, progressMs: 7_999 }
    const report = createOfflineBankReportCollector(state, 1, 1_000)
    const result = runTick(state, report)

    expect(result.production.craftsByRecipe['ember-staff']).toBe(1)
    expect(result.production.transmutation['ember-staff']).toBe(1)
    expect(result.consumption.transmutation).toEqual({ 'fire-fragment': 4, 'wisp-essence': 4, 'grove-bark': 1 })
  })

  it('reports real combat defeats and loot events', () => {
    const state = makeInitialState()
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 1
    state.combat.enemyMaxHp = 1
    state.combat.playerAttackTimerMs = 0
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const report = createOfflineBankReportCollector(state, 1, 1_000)
    const result = runTick(state, report)
    random.mockRestore()

    expect(result.combat.killsTotal).toBe(1)
    expect(result.combat.killsByMonster['forest-wisp']).toBe(1)
    expect(Object.keys(result.combat.loot).length).toBeGreaterThan(0)
  })

  it('reports research stopping at the current level cap without consuming an item', () => {
    const state = makeInitialState()
    state.inventory['fire-fragment'] = 1
    state.schools.fire.level = state.progress.magicLevelCap
    state.schools.fire.xp = getSchoolTotalXpForLevel(state.progress.magicLevelCap)
    state.activities.research = { ...state.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'fire', remainingQuantity: 1, progressMs: BALANCE.research.durationPerItemMs }
    const report = createOfflineBankReportCollector(state, 1, 1_000)
    const result = runTick(state, report)

    expect(result.research.stoppedAtCap).toBe(true)
    expect(result.research.researchedItems).toEqual({})
    expect(state.inventory['fire-fragment']).toBe(1)
  })

  it('collects multiple successful systems from one shared simulation tick', () => {
    const state = makeInitialState()
    state.player.mana = state.player.maxMana
    state.progress.firstBossKill = true
    state.progress.lifetimeKillsByMonster['grove-sentinel'] = 1
    state.inventory['fire-fragment'] = 4
    state.inventory['wisp-essence'] = 4
    state.inventory['grove-bark'] = 1
    state.activities.transmutation.jobs['fire-fragment'] = { echoesAssigned: 1, progressMs: 5999 }
    state.activities.research = { ...state.activities.research, running: true, itemId: 'fire-fragment', targetSchoolId: 'fire', remainingQuantity: 1, progressMs: BALANCE.research.durationPerItemMs - 1 }
    state.activities.transmutation.jobs['ember-staff'] = { echoesAssigned: 1, progressMs: 7_999 }
    state.combat.active = true
    state.combat.dungeonId = 'whispering-woods'
    state.combat.enemyId = 'forest-wisp'
    state.combat.enemyHp = 1
    state.combat.enemyMaxHp = 1
    state.combat.playerAttackTimerMs = 0
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const report = createOfflineBankReportCollector(state, 1, 1_000)
    const result = runTick(state, report)
    random.mockRestore()

    expect(result.production.transmutation['fire-fragment']).toBe(1)
    expect(result.research.researchedItems['fire-fragment']).toBe(1)
    expect(result.production.craftsByRecipe['ember-staff']).toBe(1)
    expect(result.combat.killsTotal).toBe(1)
    expect(result.netInventory['fire-fragment']).toBe(-4)
  })

  it('aggregates multiple Research jobs during Offline Bank simulation', () => {
    const state = makeInitialState()
    state.player.mana = state.player.maxMana
    state.inventory['fire-fragment'] = 10
    state.inventory['water-fragment'] = 10
    prepareResearchAction(state, 'fire-fragment', 'fire', 5)
    prepareResearchAction(state, 'water-fragment', 'water', 5)
    setResearchEchoesAction(state, 'research-1', 2)
    setResearchEchoesAction(state, 'research-2', 1)
    const report = createOfflineBankReportCollector(state, 5_000, 5_000)

    for (let index = 0; index < 5; index += 1) advanceGameState(state, 1_000, { mode: 'banked', report })
    const result = report.finalize(state)

    expect(result.research.researchedItems).toEqual({ 'fire-fragment': 2, 'water-fragment': 1 })
    expect(result.research.xpBySchool).toEqual({ fire: 24, water: 12 })
    expect(result.consumption.research).toEqual({ 'fire-fragment': 2, 'water-fragment': 1 })
  })
})

describe('Offline Bank failure handling', () => {
  it('rolls back an unexpected failure and always clears the active guard', async () => {
    const state = makeInitialState()
    state.offlineBankMs = 1_000
    const before = JSON.stringify(state)
    const result = await advanceWithOfflineBank(1_000, () => state, (recipe) => { recipe(state) }, () => { throw new Error('save failed') })

    expect(result.ok).toBe(false)
    expect(JSON.stringify(state)).toBe(before)
    expect(isOfflineBankSimulationActive()).toBe(false)
  })

  it('never spends below zero and rejects a second advance without enough banked time', async () => {
    const state = makeInitialState()
    state.offlineBankMs = 1_000
    const setState = (recipe: (state: ReturnType<typeof makeInitialState>) => void) => { recipe(state) }
    const first = await advanceWithOfflineBank(1_000, () => state, setState, () => undefined)
    const second = await advanceWithOfflineBank(1, () => state, setState, () => undefined)

    expect(first.ok).toBe(true)
    expect(state.offlineBankMs).toBe(0)
    expect(second.ok).toBe(false)
    expect(state.offlineBankMs).toBe(0)
  })

  it('keeps the transient report out of serialized gameplay state', () => {
    const state = makeInitialState() as ReturnType<typeof makeInitialState> & { lastOfflineBankReport?: unknown }
    state.lastOfflineBankReport = { durationMs: 60_000 }
    const saved = serializeGameState(state)

    expect(Object.prototype.hasOwnProperty.call(saved, 'lastOfflineBankReport')).toBe(false)
  })
})
