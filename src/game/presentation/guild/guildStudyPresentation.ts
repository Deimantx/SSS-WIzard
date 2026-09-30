import { GUILD_COMMISSION_CHAINS, type GuildCommissionChainDefinition } from '../../content/guild/guildCommissionChains'
import { GUILD_STANDINGS, type GuildStandingId } from '../../content/guild/guildStandings'
import type { GameState, GuildRankId } from '../../types'

export type GuildStudyChapterId = 'initiate' | 'apprentice' | 'adept' | 'magister' | 'circle-master'
const chapterOrder: readonly GuildStudyChapterId[] = ['initiate', 'apprentice', 'adept', 'magister', 'circle-master']
const chapterLabels: Record<GuildRankId, { number: string; title: string }> = {
  outsider: { number: '', title: '' }, initiate: { number: 'I', title: 'Initiate Studies' }, apprentice: { number: 'II', title: 'Apprentice Studies' },
  adept: { number: 'III', title: 'Adept Studies' }, magister: { number: 'IV', title: 'Arcanist Studies' }, 'circle-master': { number: 'V', title: 'Grand Magister Studies' },
}

export interface GuildStudyChapterView {
  id: GuildStudyChapterId
  number: string
  title: string
  requiredStandingId: GuildStandingId
  requiredStandingName: string
  studies: readonly GuildCommissionChainDefinition[]
  completed: number
  total: number
  completionPercent: number
  unlocked: boolean
  containsActiveStudy: boolean
}

export const getGuildStudyChapters = (state: Pick<GameState, 'progress'>): GuildStudyChapterView[] => chapterOrder.map((rank) => {
  const studies = GUILD_COMMISSION_CHAINS.filter((entry) => GUILD_STANDINGS.find((standing) => standing.id === entry.minimumStandingId)?.rankId === rank)
  const required = GUILD_STANDINGS.find((standing) => standing.id === studies[0]?.minimumStandingId) ?? GUILD_STANDINGS[0]
  const completed = studies.filter(({ id }) => state.progress.arcaneGuild.completedChainIds.includes(id)).length
  const active = state.progress.arcaneGuild.activeCommissionChain
  const label = chapterLabels[rank]
  return { id: rank, ...label, requiredStandingId: required.id, requiredStandingName: required.name, studies, completed, total: studies.length, completionPercent: studies.length ? Math.round(completed / studies.length * 100) : 0, unlocked: state.progress.guildReputation >= required.reputation, containsActiveStudy: studies.some(({ id }) => id === active?.id) }
})

export const getDefaultGuildStudyChapter = (state: Pick<GameState, 'progress'>, chapters = getGuildStudyChapters(state)) => {
  const active = state.progress.arcaneGuild.activeCommissionChain
  const activeChapter = chapters.find(({ studies }) => studies.some(({ id }) => id === active?.id))
  if (activeChapter) return activeChapter.id
  const unlocked = chapters.filter((chapter) => chapter.unlocked)
  return [...unlocked].reverse().find((chapter) => chapter.completed < chapter.total)?.id ?? unlocked[unlocked.length - 1]?.id ?? chapters[0].id
}
