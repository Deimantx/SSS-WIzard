import { describe, expect, it } from 'vitest'
import { GUARDIANS, GUARDIAN_IDS, SUMMONING_UNLOCK_BOSS_ID } from '../../content/guardians/guardians'
import { createInitialState } from '../../../store/initialState'
import { getGuardianManaUpkeep, getGuardianPassiveProviders, getSelectedGuardian, isSummoningUnlocked } from './summoningSelectors'

describe('summoning selectors', () => {
  it('keeps the chamber hidden until the canonical Gatekeeper kill exists', () => {
    const state = createInitialState()

    expect(isSummoningUnlocked(state)).toBe(false)
    state.progress.bossKillsByBoss[SUMMONING_UNLOCK_BOSS_ID] = 1
    expect(isSummoningUnlocked(state)).toBe(true)
  })

  it('exposes the four level-one Guardian definitions without a default selection', () => {
    const state = createInitialState()

    expect(state.guardians.selectedGuardianId).toBeNull()
    expect(GUARDIAN_IDS).toHaveLength(4)
    expect(GUARDIANS['fire-guardian'].attack).toMatchObject({ intervalMs: 4000, spellPowerCoefficient: 0.30, damageType: 'fire' })
    expect(GUARDIANS['water-guardian'].attack).toMatchObject({ intervalMs: 4000, spellPowerCoefficient: 0.26, damageType: 'water' })
    expect(GUARDIANS['earth-guardian'].attack).toMatchObject({ intervalMs: 4500, spellPowerCoefficient: 0.30, damageType: 'earth' })
    expect(GUARDIANS['air-guardian'].attack).toMatchObject({ intervalMs: 3200, spellPowerCoefficient: 0.22, damageType: 'air' })
    expect(getSelectedGuardian(state)).toBeUndefined()
  })

  it('exposes upkeep and passive providers only for the active snapshot', () => {
    const state = createInitialState()
    state.combat.guardian.activeGuardianId = 'earth-guardian'

    expect(getGuardianManaUpkeep(state)).toBe(5)
    expect(getGuardianPassiveProviders(state)).toEqual([{ modifier: { key: 'defense-flat', value: 5 }, sourceId: 'earth-guardian', sourceName: 'Earth Guardian' }])

    state.combat.guardian.activeGuardianId = null
    expect(getGuardianManaUpkeep(state)).toBe(0)
    expect(getGuardianPassiveProviders(state)).toEqual([])
  })
})
