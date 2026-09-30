import { useMemo, useState } from 'react'
import { BookOpen, Check, FlaskConical, Handshake, LockKeyhole, RotateCcw, Sparkles, TowerControl, Zap } from 'lucide-react'
import { Button, Card, FilterBar, GameTooltip, ModalPortal, Progress, Status } from '../../components/ui'
import { GUILD_SKILL_NODES, GUILD_MAJOR_PROGRAM_IDS, type GuildSkillBranch } from '../../game/content/guild/guildSkills'
import { GUILD_STANDINGS } from '../../game/content/guild/guildStandings'
import { getGuildAdvancementEffectBreakdown } from '../../game/presentation/guild/guildAdvancementEffectBreakdown'
import { GUILD_ADVANCEMENT_DEPARTMENTS, getGuildAdvancementDepartmentView, getGuildAdvancementProgramStatus, getGuildAdvancementProgramsForDepartment } from '../../game/presentation/guild/guildAdvancementPresentation'
import { canPurchaseGuildSkillNode, getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'
import type { GuildSkillNodeId } from '../../game/types'

const departments = [
  { id: 'scholarship', Icon: BookOpen }, { id: 'transmutation', Icon: FlaskConical }, { id: 'tower-operations', Icon: TowerControl }, { id: 'guild-service', Icon: Handshake },
] as const
type GuildAdvancementDepartment = (typeof GUILD_ADVANCEMENT_DEPARTMENTS)[number]['id']
const statuses = [{ value: 'all', label: 'ALL' }, { value: 'available', label: 'AVAILABLE' }, { value: 'locked', label: 'LOCKED' }, { value: 'maxed', label: 'MAXED' }] as const
const titleBranch = (branch: GuildSkillBranch) => branch === 'milestones' ? 'Major Milestone' : branch.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const rankPips = (rank: number, maxRank: number) => maxRank === 1 ? (rank ? '◆' : '◇') : `${'■'.repeat(rank)}${'□'.repeat(Math.max(0, maxRank - rank))}`

export function GuildAdvancementTab() {
  const state = useGameStore()
  const guildPreferences = useUiPreferences().screenState.guild
  const [department, setDepartment] = useState<GuildAdvancementDepartment>(guildPreferences.advancementDepartment)
  const [selectedId, setSelectedId] = useState<GuildSkillNodeId>(() => {
    const saved = guildPreferences.selectedAdvancementId as GuildSkillNodeId | null
    return saved && (GUILD_SKILL_NODES[saved]?.branch === guildPreferences.advancementDepartment || GUILD_SKILL_NODES[saved]?.branch === 'milestones') ? saved : getGuildAdvancementProgramsForDepartment(guildPreferences.advancementDepartment)[0]
  })
  const [statusFilter, setStatusFilter] = useState<typeof statuses[number]['value']>('all')
  const [respecOpen, setRespecOpen] = useState(false)
  const spent = getGuildPointsSpent(state)
  const available = getGuildPointsAvailable(state)
  const economy = getGuildAdvancementPointEconomy()
  const departmentViews = getGuildAdvancementDepartmentView(state)
  const currentDepartment = departmentViews.find((entry) => entry.id === department) ?? departmentViews[0]
  const regularIds = currentDepartment.programs
  const visibleIds = regularIds.filter((id) => {
    const view = getGuildAdvancementProgramStatus(state, id)
    return statusFilter === 'all' || statusFilter === 'available' && view.canPurchase || statusFilter === 'locked' && view.status === 'locked' || statusFilter === 'maxed' && view.status === 'maxed'
  })
  const selected = GUILD_SKILL_NODES[selectedId]
  const rank = state.progress.guildSkillNodeRanks[selectedId] ?? 0
  const canBuy = canPurchaseGuildSkillNode(state, selectedId)
  const major = selected.branch === 'milestones'
  const effect = getGuildAdvancementEffectBreakdown(state, selectedId)
  const requiredStanding = selected.minimumStandingId && GUILD_STANDINGS.find(({ id }) => id === selected.minimumStandingId)
  const standingLocked = Boolean(requiredStanding && state.progress.guildReputation < requiredStanding.reputation)
  const pointLocked = selected.requiredInvestedPoints !== undefined && spent < selected.requiredInvestedPoints
  const unlockedMajors = GUILD_MAJOR_PROGRAM_IDS.filter((id) => (state.progress.guildSkillNodeRanks[id] ?? 0) > 0).length
  const majorTooltip = (id: GuildSkillNodeId) => {
    const node = GUILD_SKILL_NODES[id]
    const view = getGuildAdvancementProgramStatus(state, id)
    const milestoneState = view.rank ? 'UNLOCKED' : view.canPurchase ? 'ELIGIBLE' : 'LOCKED'
    return `${node.name} · ${milestoneState} · ${view.rank ? 'Already unlocked' : `Requires ${node.requiredInvestedPoints ?? 0} AP invested`}`
  }
  const selectDepartment = (branch: GuildAdvancementDepartment) => {
    const next = getGuildAdvancementProgramsForDepartment(branch)[0]
    setDepartment(branch)
    setSelectedId(next)
    setStatusFilter('all')
    setUiPreferences({ screenState: { guild: { advancementDepartment: branch, selectedAdvancementId: next } } })
  }
  const selectProgram = (id: GuildSkillNodeId) => {
    setSelectedId(id)
    setUiPreferences({ screenState: { guild: { selectedAdvancementId: id } } })
  }
  const actionLabel = rank >= selected.maxRank ? 'MAX RANK' : canBuy ? major ? 'UNLOCK MAJOR · 1 AP' : `INVEST · 1 AP · RANK ${rank + 1}` : standingLocked ? `REQUIRES ${requiredStanding?.name.toUpperCase()}` : pointLocked ? `REQUIRES ${selected.requiredInvestedPoints} AP INVESTED` : available < 1 ? 'EARN 1 AP' : major ? 'MAJOR LOCKED' : 'PROGRAM LOCKED'
  const nextMajor = GUILD_MAJOR_PROGRAM_IDS.map((id) => GUILD_SKILL_NODES[id]).find((node) => !(state.progress.guildSkillNodeRanks[node.id] ?? 0))

  return <section className="guild-advancement-workspace" aria-label="Guild Advancement Command Board">
    <div className="guild-advancement-board-column">
      <Card className="guild-advancement-command-bar"><div className="guild-advancement-command-title"><div><span className="guild-v3-kicker">ARCANE GUILD · PERMANENT PROGRAMS</span><h2>Advancement Command Board</h2></div><GameTooltip content="Reset every Advancement rank and refund all invested AP. Confirmation required."><Button variant="secondary" disabled={spent < 1} onClick={() => setRespecOpen(true)}><RotateCcw size={14} /> Respec</Button></GameTooltip></div><div className="guild-ap-readouts"><div><span>AVAILABLE AP</span><strong>{available}</strong></div><div><span>INVESTED AP</span><strong>{spent}</strong></div><div><span>TOTAL EARNED</span><strong>{state.progress.guildPointsEarned}</strong></div><small>Permanent rank investment · {economy.maxBoundedPoints} AP economy cap</small></div></Card>

      <nav className="guild-department-rail" aria-label="Advancement departments" role="tablist">{departmentViews.map((view) => { const entry = departments.find(({ id }) => id === view.id)!; const Icon = entry.Icon; return <Button key={view.id} role="tab" ariaPressed={department === view.id} variant={department === view.id ? 'primary' : 'ghost'} className={`guild-department-choice${department === view.id ? ' selected' : ''}`} onClick={() => selectDepartment(view.id)}><Icon size={18} /><span><strong>{view.label}</strong><small>{view.summary}</small></span><b>{view.investedRanks} / {view.totalRanks}<small>ranks</small></b></Button> })}</nav>

      <Card className="guild-advancement-catalog"><div className="guild-advancement-section-heading"><div><span className="guild-v3-kicker">DEPARTMENT PROGRAMS</span><h2>{currentDepartment.label}</h2></div><span>{visibleIds.length} / {regularIds.length} shown</span></div><div className="guild-advancement-status-filter"><FilterBar options={statuses.map((entry) => ({ value: entry.value, label: entry.label }))} value={statusFilter} onChange={(value) => setStatusFilter(value as typeof statusFilter)} ariaLabel="Filter department programs by status" /></div>
        <div className="guild-advancement-program-grid">{visibleIds.length ? visibleIds.map((id) => { const node = GUILD_SKILL_NODES[id]; const view = getGuildAdvancementProgramStatus(state, id); const breakdown = getGuildAdvancementEffectBreakdown(state, id); const stateLabel = view.status.toUpperCase(); return <GameTooltip key={id} block content={`${node.name} · ${breakdown?.maximumEffect ?? node.description} · Rank ${view.rank} of ${view.maxRank}${node.minimumStandingId ? ` · Requires ${GUILD_STANDINGS.find(({ id: standingId }) => standingId === node.minimumStandingId)?.name}` : ''}`}><Button variant={selectedId === id ? 'primary' : 'ghost'} ariaPressed={selectedId === id} className={`guild-advancement-program ${view.status}${selectedId === id ? ' selected' : ''}`} onClick={() => selectProgram(id)}><span className="guild-advancement-program-top"><BookOpen size={16} /><strong>{node.name}</strong><b>{stateLabel}</b></span><small>{breakdown?.tileEffect ?? node.description}</small><span className="guild-advancement-rank-pips"><b>{rankPips(view.rank, view.maxRank)}</b><span>{view.rank} / {view.maxRank}</span></span></Button></GameTooltip> }) : <div className="guild-advancement-empty"><Status tone="neutral">No programs in this view</Status><span>Choose another status or department to continue.</span></div>}</div>
      </Card>

      <Card className="guild-major-rail"><div className="guild-major-rail-heading"><div><span className="guild-v3-kicker">MAJOR MILESTONES</span><small>{unlockedMajors} / {GUILD_MAJOR_PROGRAM_IDS.length} unlocked{nextMajor ? ` · next at ${nextMajor.requiredInvestedPoints} AP` : ' · complete'}</small></div><span>ONE-RANK UNLOCKS</span></div><div className="guild-major-rail-nodes">{GUILD_MAJOR_PROGRAM_IDS.map((id) => { const node = GUILD_SKILL_NODES[id]; const view = getGuildAdvancementProgramStatus(state, id); const milestoneState = view.rank ? 'unlocked' : view.canPurchase ? 'eligible' : 'locked'; return <GameTooltip key={id} content={majorTooltip(id)}><Button variant={selectedId === id ? 'primary' : 'ghost'} ariaPressed={selectedId === id} ariaLabel={`${node.name}, ${milestoneState}, ${node.requiredInvestedPoints} AP invested`} className={`guild-major-node ${milestoneState}${selectedId === id ? ' selected' : ''}`} onClick={() => selectProgram(id)}><span>{view.rank ? <Check size={14} /> : view.canPurchase ? <Sparkles size={14} /> : <LockKeyhole size={14} />}</span><strong>{node.requiredInvestedPoints} AP</strong><small>{node.name}</small></Button></GameTooltip>})}</div></Card>
    </div>

    <Card className="guild-advancement-inspector"><InspectorTransition identity={selected.id} accent={major ? 'var(--gold)' : 'var(--ui-accent)'} fill><div className="guild-advancement-inspector-content"><div className="guild-advancement-dossier-head"><span className="guild-advancement-dossier-icon">{major ? <Zap size={20} /> : <BookOpen size={20} />}</span><div><span className="guild-v3-kicker">{titleBranch(selected.branch).toUpperCase()}</span><h2>{selected.name}</h2></div><Status tone={rank >= selected.maxRank ? 'success' : canBuy ? 'active' : 'locked'}>{rank >= selected.maxRank ? 'Maxed' : canBuy ? rank > 0 ? 'Invested · Ready' : 'Available' : 'Locked'}</Status></div><p className="guild-advancement-description">{selected.description}</p>
        <section className="guild-advancement-rank-block"><div><span>PROGRAM RANK</span><strong>{rank} / {selected.maxRank}</strong></div><div className="guild-advancement-rank-pips">{effect?.rankRows.map((row) => <GameTooltip key={row.rank} content={`Rank ${row.rank}: ${row.label}`}><i className={row.active ? 'active' : ''} aria-label={`Rank ${row.rank} ${row.active ? 'active' : 'not purchased'}`} /></GameTooltip>)}</div></section>
        {effect && <section className="guild-advancement-effect-profile"><span className="guild-v3-kicker">EFFECT PROFILE</span><div><span>CURRENT</span><strong>{effect.currentEffect}</strong></div><div><span>NEXT</span><strong>{rank >= selected.maxRank ? 'Maximum rank reached' : effect.nextEffect}</strong></div><div><span>MAX</span><strong>{effect.maximumEffect}</strong></div>{effect.notes.length > 0 && <ul>{effect.notes.map((note) => <li key={note}>{note}</li>)}</ul>}{effect.rankRows.length > 1 && <details className="guild-advancement-rank-details"><summary>View rank effects</summary><ol>{effect.rankRows.map((row) => <li className={row.active ? 'active' : ''} key={row.rank}><span>RANK {row.rank}{row.active ? ' · ACTIVE' : ''}</span><strong>{row.label}</strong></li>)}</ol></details>}</section>}
        <section className="guild-advancement-requirements"><span className="guild-v3-kicker">REQUIREMENTS</span>{requiredStanding && <div><span>Required Standing</span><strong>{requiredStanding.name}</strong></div>}{major && <><div><span>Investment threshold</span><strong>{selected.requiredInvestedPoints} AP invested</strong></div><Progress value={Math.min(100, spent / Math.max(1, selected.requiredInvestedPoints ?? 1) * 100)} tone="gold" /></>}<div><span>Cost</span><strong>1 Advancement Point</strong></div>{available < 1 && rank < selected.maxRank && <small>Available AP: {available}</small>}</section>
        <div className="guild-advancement-inspector-actions"><div><span>{rank >= selected.maxRank ? 'PROGRAM COMPLETE' : major ? 'NEXT · UNLOCK MAJOR' : `NEXT · RANK ${rank + 1} / ${selected.maxRank}`}</span><small>{canBuy ? 'Ready to invest' : standingLocked ? `${requiredStanding?.name} Standing required` : pointLocked ? `${selected.requiredInvestedPoints} AP must be invested first` : 'Requirements not met'}</small></div><GameTooltip content={canBuy ? `Invest 1 AP in ${selected.name}.` : rank >= selected.maxRank ? 'This program is at maximum rank.' : standingLocked ? `Reach ${requiredStanding?.name} to unlock this program.` : pointLocked ? `Invest ${selected.requiredInvestedPoints} AP across the board to unlock this Major.` : 'Earn an Advancement Point and meet all program requirements.'}><Button variant="primary" disabled={!canBuy} onClick={() => state.purchaseGuildSkillNode(selectedId)}>{actionLabel}</Button></GameTooltip></div>
      </div></InspectorTransition></Card>

    <ModalPortal open={respecOpen} onClose={() => setRespecOpen(false)} backdropClassName="guild-respec-backdrop" surfaceClassName="guild-respec-dialog" ariaLabel="Confirm Advancement respec"><span className="guild-v3-kicker">ADVANCEMENT · RESET</span><h2>Reset all Advancement ranks?</h2><p>This returns <strong>{spent} AP</strong> to your available balance and removes every purchased regular rank and Major unlock.</p><div className="guild-respec-actions"><Button variant="ghost" onClick={() => setRespecOpen(false)}>Keep ranks</Button><Button variant="danger" onClick={() => { state.resetGuildSkillTree(); setRespecOpen(false) }}>Reset board · refund {spent} AP</Button></div></ModalPortal>
  </section>
}
