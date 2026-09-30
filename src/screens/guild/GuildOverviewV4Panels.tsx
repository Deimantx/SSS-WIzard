import { Archive, BookOpenCheck, BriefcaseBusiness, Sparkles } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_PROJECTS } from '../../game/content/guild/guildProjects'
import { GUILD_COMMISSION_CHAINS } from '../../game/content/guild/guildCommissionChains'
import { getArcaneRegistryEntries, getArcaneRegistrySummary, isArcaneRegistryEntryAvailable } from '../../game/systems/guild/arcaneRegistry'
import { getGuildPointsAvailable, getGuildPointsSpent, getGuildAdvancementPointEconomy, getGuildStandingProgress } from '../../game/systems/guild/guildSelectors'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import type { GameStore } from '../../store/gameStore'
import { formatGuildCommissionObjective, getGuildCommissionProgress } from '../../game/presentation/guild/guildPresentation'

export function GuildOverviewStandingPanel({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const standing = getGuildStandingProgress(state)
  return <Card className="guild-v4-overview-card guild-v4-overview-standing"><div className="guild-v4-overview-heading"><div><span className="guild-v3-kicker">REPUTATION DOSSIER</span><h2>{standing.current.name}</h2></div><Status tone="active">{standing.current.rankId === state.progress.guildRank ? 'Macro rank aligned' : 'Standing advances'}</Status></div><p>{standing.reputation.toLocaleString()} / {standing.next?.reputation.toLocaleString() ?? '52,000'} REP{standing.next ? ` · Next ${standing.next.name}` : ' · Maximum Standing'}</p><Progress value={standing.progress * 100} tone="gold" /><div className="guild-v4-overview-footer"><span>Grade {standing.current.grade} / V</span><GameTooltip content="Open the full 25-grade Standing register and promotion milestones."><Button variant="secondary" onClick={() => onNavigate('standing')}>Standing Register</Button></GameTooltip></div></Card>
}

export function GuildOverviewCommissionPanel({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const guild = state.progress.arcaneGuild
  const active = guild.activeCommission
  const progress = active ? getGuildCommissionProgress(active) : null
  const study = guild.activeCommissionChain
  const studyDefinition = study ? GUILD_COMMISSION_CHAINS.find((entry) => entry.id === study.id) : null
  const stage = studyDefinition?.stages[study?.stageIndex ?? 0]
  return <Card className="guild-v4-overview-card guild-v4-overview-commission"><div className="guild-v4-overview-heading"><div><span className="guild-v3-kicker">ACTIVE GUILD WORK</span><h2>{active ? active.category === 'mixed' ? 'Mixed Commission' : `${active.category} Commission` : 'Commission Board'}</h2></div><BriefcaseBusiness size={18} aria-hidden="true" /></div>
    {active ? <><strong className="guild-v4-active-objective">{formatGuildCommissionObjective(active)}</strong><Progress value={(progress!.current / Math.max(1, progress!.target)) * 100} tone="gold" /><div className="guild-v4-overview-footer"><span>{active.quality.toUpperCase()} · {progress?.current.toLocaleString()} / {progress?.target.toLocaleString()}</span><b>+{active.reputationReward.toLocaleString()} REP</b></div></> : <p>{guild.availableCommissions.length} prepared offers await selection. One regular Commission may be active.</p>}
    {studyDefinition && stage && <div className="guild-v4-active-study"><BookOpenCheck size={15} /><span>Study · {studyDefinition.name}</span><strong>Stage {(study?.stageIndex ?? 0) + 1} / {studyDefinition.stages.length}</strong></div>}
    <GameTooltip content="Open the Commission board or continue a parallel Guild Study."><Button variant="secondary" onClick={() => onNavigate('commissions')}>Open Commissions</Button></GameTooltip>
  </Card>
}

export function GuildOverviewRegistryPanel({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const summary = getArcaneRegistrySummary(state)
  const ready = getArcaneRegistryEntries().filter(({ item }) => isArcaneRegistryEntryAvailable(state, item.id)).length
  return <Card className="guild-v4-overview-card"><div className="guild-v4-overview-heading"><div><span className="guild-v3-kicker">ARCANE REGISTRY</span><h2>{summary.registered} / {summary.total} registered</h2></div><Archive size={17} /></div><Progress value={summary.percent} tone="gold" /><p>{summary.percent}% entries · {summary.completeSets} / {summary.totalSets} Sets complete · {ready} ready</p><GameTooltip content={`${ready} entries meet their current registration requirement. Inspect the Registry for consumptive and discovery requirements.`}><Button variant="secondary" onClick={() => onNavigate('registry')}>Open Registry</Button></GameTooltip></Card>
}

export function GuildOverviewAdvancementPanel({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const available = getGuildPointsAvailable(state)
  const spent = getGuildPointsSpent(state)
  const nextMajor = getGuildAdvancementPointEconomy().majorMilestones.find((entry) => entry.pointsRequired > spent)
  return <Card className="guild-v4-overview-card"><div className="guild-v4-overview-heading"><div><span className="guild-v3-kicker">ADVANCEMENT BOARD</span><h2>{available} AP ready</h2></div><Sparkles size={17} /></div><p>{spent} invested · {nextMajor ? `${nextMajor.pointsRequired} invested for next Major` : 'all Majors reached'}</p><GameTooltip content="Inspect current, next-rank, and maximum effects for each Advancement program."><Button variant="secondary" onClick={() => onNavigate('advancement')}>Open Advancement</Button></GameTooltip></Card>
}

export function GuildOverviewProjectsPanel({ state, onNavigate }: { state: GameStore; onNavigate: (tab: GuildScreenTab) => void }) {
  const guild = state.progress.arcaneGuild
  const next = GUILD_PROJECTS.find((project) => !guild.completedProjectIds.includes(project.id))
  return <Card className="guild-v4-overview-card"><div className="guild-v4-overview-heading"><div><span className="guild-v3-kicker">FACILITY PROGRAM</span><h2>{guild.completedProjectIds.length} / {GUILD_PROJECTS.length} projects</h2></div><Archive size={17} /></div><p>{next ? `Next in ${next.facilityId.replaceAll('-', ' ')} · ${next.name}` : 'All Facilities restored.'}</p><GameTooltip content="Browse the six Facilities and inspect their available Projects."><Button variant="secondary" onClick={() => onNavigate('projects')}>Open Projects</Button></GameTooltip></Card>
}
