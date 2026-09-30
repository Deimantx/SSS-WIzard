import { useMemo, useState } from 'react'
import { Check, LockKeyhole, RotateCcw, Sparkles } from 'lucide-react'
import { Button, Card, FilterBar, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_SKILL_NODES, GUILD_REGULAR_PROGRAM_IDS, GUILD_MAJOR_PROGRAM_IDS, type GuildSkillBranch } from '../../game/content/guild/guildSkills'
import { canPurchaseGuildSkillNode, getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { useGameStore } from '../../store/gameStore'
import type { GuildSkillNodeId } from '../../game/types'
import { GUILD_STANDINGS, getGuildStanding } from '../../game/content/guild/guildStandings'

const groups: readonly { value: GuildSkillBranch | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL PROGRAMS' }, { value: 'scholarship', label: 'SCHOLARSHIP' }, { value: 'transmutation', label: 'TRANSMUTATION' }, { value: 'tower-operations', label: 'TOWER OPERATIONS' }, { value: 'guild-service', label: 'GUILD SERVICE' },
]
const statuses = [{ value: 'all', label: 'ALL' }, { value: 'available', label: 'AVAILABLE' }, { value: 'locked', label: 'LOCKED' }, { value: 'maxed', label: 'MAXED' }] as const
const titleBranch = (branch: GuildSkillBranch) => branch.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
const scaledEffect = (description: string, rank: number) => description.replace(/(\d+(?:\.\d+)?)%/g, (_match, value: string) => `${(Number(value) * rank).toFixed(Number(value) % 1 ? 2 : 0)}%`).replace(/\s+per rank/gi, '')

export function GuildAdvancementTab() {
  const state = useGameStore()
  const [group, setGroup] = useState<GuildSkillBranch | 'all'>('all')
  const [status, setStatus] = useState<typeof statuses[number]['value']>('all')
  const [selectedId, setSelectedId] = useState<GuildSkillNodeId>(GUILD_REGULAR_PROGRAM_IDS[0])
  const spent = getGuildPointsSpent(state)
  const available = getGuildPointsAvailable(state)
  const majors = GUILD_MAJOR_PROGRAM_IDS.map((id) => GUILD_SKILL_NODES[id])
  const programs = GUILD_REGULAR_PROGRAM_IDS.map((id) => GUILD_SKILL_NODES[id])
  const visible = programs.filter((node) => {
    const rank = state.progress.guildSkillNodeRanks[node.id] ?? 0
    const isAvailable = canPurchaseGuildSkillNode(state, node.id)
    if (group !== 'all' && node.branch !== group) return false
    if (status === 'available' && !isAvailable) return false
    if (status === 'locked' && (isAvailable || rank >= node.maxRank)) return false
    if (status === 'maxed' && rank < node.maxRank) return false
    return true
  })
  const selected = useMemo(() => GUILD_SKILL_NODES[selectedId], [selectedId])
  const selectedRank = state.progress.guildSkillNodeRanks[selectedId] ?? 0
  const selectedAvailable = canPurchaseGuildSkillNode(state, selectedId)
  const selectedMajor = selected.branch === 'milestones'
  const nextRank = selectedRank < selected.maxRank ? selectedRank + 1 : null
  const reqSpent = selected.requiredInvestedPoints
  const economy = getGuildAdvancementPointEconomy()
  const nextMajor = majors.find((major) => (major.requiredInvestedPoints ?? 0) + 1 > spent)
  const currentStanding = getGuildStanding(state.progress.guildReputation)
  const selectNode = (id: GuildSkillNodeId) => setSelectedId(id)
  const tooltipFor = (id: GuildSkillNodeId) => {
    const node = GUILD_SKILL_NODES[id]
    const rank = state.progress.guildSkillNodeRanks[id] ?? 0
    const requiredStanding = node.minimumStandingId && GUILD_STANDINGS.find((standing) => standing.id === node.minimumStandingId)
    const requirements = [
      requiredStanding ? `Unlocks at ${requiredStanding.name} (${requiredStanding.reputation.toLocaleString()} Reputation)` : null,
      node.requiredInvestedPoints !== undefined ? `${node.requiredInvestedPoints} AP invested before this Major can be unlocked` : null,
      node.prerequisiteId ? `Requires ${GUILD_SKILL_NODES[node.prerequisiteId]?.name ?? 'its prerequisite program'}` : null,
    ].filter(Boolean).join('. ')
    return `${node.name} · ${node.description} ${requirements ? `${requirements}. ` : ''}Current: ${scaledEffect(node.description, rank)} Next: ${rank < node.maxRank ? scaledEffect(node.description, rank + 1) : 'Maximum rank reached.'} Maximum: ${scaledEffect(node.description, node.maxRank)} Cost: ${node.maxRank === 1 ? '1 AP once' : '1 AP per rank'}.`
  }
  return <section className="guild-advancement-workspace" aria-label="Guild Advancement Board">
    <Card className="guild-advancement-catalog"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">PERMANENT GUILD PROGRAMS</span><h2>Advancement Board</h2><p>Twenty-four ranked programs · all investments remain available to earn.</p></div><div className="guild-advancement-wallet"><span>AVAILABLE AP</span><strong>{available}</strong><small>{spent} invested</small></div></div>
      <div className="guild-advancement-filter"><FilterBar options={groups} value={group} onChange={(value) => setGroup(value as GuildSkillBranch | 'all')} ariaLabel="Advancement program groups" /><FilterBar options={statuses.map((entry) => ({ value: entry.value, label: entry.label }))} value={status} onChange={(value) => setStatus(value as typeof statuses[number]['value'])} ariaLabel="Advancement program status" /></div>
      <div className="guild-advancement-program-grid">{visible.length ? visible.map((node) => { const rank = state.progress.guildSkillNodeRanks[node.id] ?? 0; const canBuy = canPurchaseGuildSkillNode(state, node.id); const requiredStanding = node.minimumStandingId && GUILD_STANDINGS.find((standing) => standing.id === node.minimumStandingId); return <GameTooltip key={node.id} content={tooltipFor(node.id)} block><Button variant={selectedId === node.id ? 'primary' : 'ghost'} ariaPressed={selectedId === node.id} className={`guild-advancement-program${rank >= node.maxRank ? ' maxed' : ''}`} onClick={() => selectNode(node.id)}><div><span>{titleBranch(node.branch)}</span><b>{canBuy ? 'AVAILABLE' : rank >= node.maxRank ? 'MAXED' : 'LOCKED'}</b></div><strong>{node.name}</strong><p>{node.description}</p><small>{node.requiredInvestedPoints !== undefined ? `${node.requiredInvestedPoints} AP investment threshold` : `Standing ${requiredStanding?.name ?? 'Initiate I'}`} · RANK {rank}/{node.maxRank} · 1 AP</small><Progress value={rank / node.maxRank * 100} tone={rank >= node.maxRank ? 'green' : 'gold'} /></Button></GameTooltip> }) : <div className="guild-v3-empty-filter-state"><Status tone="neutral">No matching programs</Status><span>Change the group or status filter to browse other programs.</span></div>}</div>
    </Card>
    <Card className="guild-advancement-inspector"><InspectorTransition identity={selected.id} accent={selectedMajor ? 'var(--gold)' : 'var(--ui-accent)'} fill><div className="guild-advancement-inspector-content"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">{titleBranch(selected.branch)} · PROGRAM DOSSIER</span><h2>{selected.name}</h2></div><Status tone={selectedRank >= selected.maxRank ? 'success' : selectedAvailable ? 'active' : 'locked'}>{selectedRank >= selected.maxRank ? 'Maxed' : selectedAvailable ? 'Available' : 'Locked'}</Status></div><p>{selected.description}</p><div className="guild-advancement-effect-matrix"><div><span>EFFECT PER RANK</span><strong>{selected.description}</strong></div><div><span>CURRENT</span><strong>{scaledEffect(selected.description, selectedRank)}</strong></div><div><span>NEXT RANK</span><strong>{nextRank ? scaledEffect(selected.description, nextRank) : 'Maximum rank reached'}</strong></div><div><span>MAXIMUM</span><strong>{scaledEffect(selected.description, selected.maxRank)}</strong></div></div><div className="guild-advancement-requirements"><span>{selectedMajor ? `Major unlock · ${reqSpent} AP invested` : `Current Standing · ${currentStanding.name}`}</span>{reqSpent !== undefined && <Progress value={Math.min(100, spent / Math.max(1, reqSpent) * 100)} tone="gold" />}<span>{selectedMajor ? `${spent} / ${reqSpent} AP invested · unlock costs 1 AP` : `Unlocks at ${GUILD_STANDINGS.find((standing) => standing.id === selected.minimumStandingId)?.name ?? 'Initiate I'} · each rank costs 1 Advancement Point.`}</span></div><div className="guild-advancement-inspector-actions"><GameTooltip content={selectedAvailable ? `Invest 1 AP in ${selected.name}.` : selectedRank >= selected.maxRank ? 'This program is at maximum rank.' : available < 1 ? 'Earn another Advancement Point to invest.' : selected.minimumStandingId ? `Reach ${GUILD_STANDINGS.find((standing) => standing.id === selected.minimumStandingId)?.name} to unlock this program.` : `Meet the displayed investment threshold to unlock ${selected.name}.`}><Button variant="primary" disabled={!selectedAvailable} onClick={() => state.purchaseGuildSkillNode(selectedId)}>{selectedRank >= selected.maxRank ? 'Program Maxed' : selectedMajor ? 'Unlock Major · 1 AP' : `Invest · 1 AP · Rank ${nextRank}`}</Button></GameTooltip><GameTooltip content="Refund Guild Advancement ranks outside combat. Acolyte capacity changes still obey assignment safety."><Button variant="ghost" onClick={() => state.resetGuildSkillTree()}><RotateCcw size={14} /> Respec Board</Button></GameTooltip></div></div></InspectorTransition></Card>
    <Card className="guild-advancement-major-rail"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">MAJOR STANDING MILESTONES</span><h2>Major programs</h2><p>{nextMajor ? `Next milestone at ${nextMajor.requiredInvestedPoints} invested AP.` : 'All Major thresholds reached.'} Final supply {economy.maxBoundedPoints} AP / {economy.totalBoardPointCost} AP.</p></div><Sparkles size={17} /></div><div className="guild-major-rail">{majors.map((major) => { const rank = state.progress.guildSkillNodeRanks[major.id] ?? 0; const threshold = major.requiredInvestedPoints ?? 0; const canBuy = canPurchaseGuildSkillNode(state, major.id); return <GameTooltip key={major.id} content={tooltipFor(major.id)} block><Button variant={selectedId === major.id ? 'primary' : 'ghost'} ariaPressed={selectedId === major.id} className={`guild-major-card${rank ? ' unlocked' : ''}`} onClick={() => selectNode(major.id)}><span>{rank ? <Check size={13} /> : spent >= threshold ? <Sparkles size={13} /> : <LockKeyhole size={13} />} {threshold} AP invested</span><strong>{major.name}</strong><small>{canBuy ? 'Ready · 1 AP' : rank ? 'Unlocked' : major.description}</small></Button></GameTooltip>})}</div></Card>
  </section>
}
