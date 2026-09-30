import { describe, expect, it } from 'vitest'
import { GUILD_MAJOR_PROGRAM_IDS, GUILD_REGULAR_PROGRAM_IDS } from '../../content/guild/guildSkills'
import { createInitialState } from '../../../store/initialState'
import { getGuildAdvancementDepartmentView, getGuildAdvancementProgramStatus, getGuildAdvancementProgramsForDepartment } from './guildAdvancementPresentation'

describe('Guild Advancement department presentation', () => {
  it('groups all 24 regular programs once across four six-program departments', () => {
    const state = createInitialState()
    const departments = getGuildAdvancementDepartmentView(state)
    expect(departments.map(({ id, programs }) => [id, programs.length])).toEqual([['scholarship', 6], ['transmutation', 6], ['tower-operations', 6], ['guild-service', 6]])
    expect(departments.flatMap(({ programs }) => programs).sort()).toEqual([...GUILD_REGULAR_PROGRAM_IDS].sort())
    expect(departments.flatMap(({ programs }) => programs).some((id) => GUILD_MAJOR_PROGRAM_IDS.includes(id))).toBe(false)
  })

  it('keeps the eight Majors in a separate one-rank collection', () => {
    expect(GUILD_MAJOR_PROGRAM_IDS).toHaveLength(8)
    expect(GUILD_MAJOR_PROGRAM_IDS.every((id) => getGuildAdvancementProgramStatus(createInitialState(), id).maxRank === 1)).toBe(true)
  })

  it('shows current rank and purchase state from the authoritative selector', () => {
    const state = createInitialState()
    state.progress.guildUnlocked = true
    state.progress.guildReputation = 1000
    state.progress.guildPointsEarned = 2
    state.progress.guildSkillNodeRanks['scholarship-measured-inquiry'] = 1
    expect(getGuildAdvancementProgramStatus(state, 'scholarship-measured-inquiry')).toMatchObject({ rank: 1, maxRank: 4, status: 'invested', canPurchase: true })
  })
})
