import { describe, expect, it } from 'vitest'
import { GUILD_COMMISSION_CHAINS } from '../../content/guild/guildCommissionChains'
import { GUILD_STANDINGS } from '../../content/guild/guildStandings'
import { createInitialState } from '../../../store/initialState'
import { getDefaultGuildStudyChapter, getGuildStudyChapters } from './guildStudyPresentation'

describe('Guild Study chapter presentation', () => {
  it('authors valid per-study Standing gates whose macro rank matches minimumRank', () => {
    for (const study of GUILD_COMMISSION_CHAINS) {
      const standing = GUILD_STANDINGS.find(({ id }) => id === study.minimumStandingId)
      expect(standing, study.id).toBeTruthy()
      expect(study.minimumRank, study.id).toBe(standing?.rankId)
    }
  })

  it('places every authored Study in exactly one of five rank chapters', () => {
    const chapters = getGuildStudyChapters(createInitialState())
    expect(chapters.map(({ id, total }) => [id, total])).toEqual([['initiate', 3], ['apprentice', 3], ['adept', 4], ['magister', 3], ['circle-master', 2]])
    expect(chapters.flatMap(({ studies }) => studies.map(({ id }) => id)).sort()).toEqual(GUILD_COMMISSION_CHAINS.map(({ id }) => id).sort())
  })

  it('prefers the active Study chapter, then the highest unlocked chapter with incomplete clears', () => {
    const state = createInitialState()
    state.progress.guildReputation = 26000
    expect(getDefaultGuildStudyChapter(state)).toBe('adept')
    state.progress.arcaneGuild.completedChainIds = GUILD_COMMISSION_CHAINS.filter(({ minimumRank }) => minimumRank === 'adept').map(({ id }) => id)
    expect(getDefaultGuildStudyChapter(state)).toBe('apprentice')
    state.progress.arcaneGuild.activeCommissionChain = { id: 'study-grand-confluence', stageIndex: 1, stageProgress: 2 }
    expect(getDefaultGuildStudyChapter(state)).toBe('circle-master')
  })

  it('exposes the required chapter Standing and keeps future chapters locked', () => {
    const state = createInitialState()
    state.progress.guildReputation = 6000
    const chapters = getGuildStudyChapters(state)
    expect(chapters[0]).toMatchObject({ requiredStandingId: 'initiate-3', unlocked: true })
    expect(chapters[1]).toMatchObject({ requiredStandingId: 'apprentice-2', unlocked: false })
  })
})
