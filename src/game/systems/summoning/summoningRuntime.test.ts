import { describe, expect, it } from 'vitest'
import { SUMMONING_UNLOCK_BOSS_ID } from '../../content/guardians/guardians'
import { createInitialState } from '../../../store/initialState'
import { getCombatModifiers } from '../combat/modifiers'
import { spawnEnemy } from '../combat/combatRuntime'
import { createCombatTestState } from '../combat/testCombatState'
import { advanceGuardianUpkeep, clearGuardianRuntime, ensureGuardianForCurrentEncounter, resolveGuardianAttack } from './summoningRuntime'

const unlockedState = () => {
  const state = createCombatTestState()
  state.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID] = 1
  state.guardians.selectedGuardianId = 'fire-guardian'
  state.combat.active = true
  state.combat.dungeonId = 'whispering-woods'
  state.player.mana = 100
  return state
}

describe('summoning runtime', () => {
  it('snapshots the selected Guardian when an enemy encounter begins', () => {
    const state = unlockedState()
    spawnEnemy(state, 'forest-wisp')

    expect(state.combat.guardian).toMatchObject({ activeGuardianId: 'fire-guardian', attackTimerMs: 4000, suppressedForEncounter: false })
    expect(state.combat.log).toContain('Fire Guardian joins the battle.')
  })

  it('drains upkeep, suppresses at zero Mana, and waits for the next encounter', () => {
    const state = unlockedState()
    state.player.mana = 5
    spawnEnemy(state, 'forest-wisp')

    advanceGuardianUpkeep(state, 1000)
    expect(state.player.mana).toBe(0)
    expect(state.combat.guardian).toMatchObject({ activeGuardianId: null, attackTimerMs: 0, suppressedForEncounter: true })

    state.player.mana = 100
    expect(ensureGuardianForCurrentEncounter(state)).toBeNull()
    expect(state.combat.guardian.suppressedForEncounter).toBe(true)

    spawnEnemy(state, 'thornling')
    expect(state.combat.guardian.activeGuardianId).toBe('fire-guardian')
    expect(state.combat.guardian.suppressedForEncounter).toBe(false)
  })

  it('resolves a Guardian attack through the combat effect pipeline and exposes its passive', () => {
    const state = unlockedState()
    spawnEnemy(state, 'forest-wisp')
    state.combat.guardian.attackTimerMs = 0
    const beforeHp = state.combat.enemyHp

    resolveGuardianAttack(state)

    expect(state.combat.enemyHp).toBeLessThan(beforeHp)
    expect(getCombatModifiers(state, 'player', 'damage-over-time-percent')).toBeCloseTo(0.05)

    clearGuardianRuntime(state)
    expect(getCombatModifiers(state, 'player', 'damage-over-time-percent')).toBe(0)
  })

  it('keeps the encounter snapshot when selection changes and uses the new choice next time', () => {
    const state = unlockedState()
    spawnEnemy(state, 'forest-wisp')
    state.guardians.selectedGuardianId = 'air-guardian'

    expect(state.combat.guardian.activeGuardianId).toBe('fire-guardian')
    spawnEnemy(state, 'thornling')
    expect(state.combat.guardian.activeGuardianId).toBe('air-guardian')
  })
})
