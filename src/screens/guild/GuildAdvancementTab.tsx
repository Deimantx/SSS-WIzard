import { useMemo, useState } from 'react'
import { Check, LockKeyhole, RotateCcw, Sparkles } from 'lucide-react'
import { Button, Card, FilterBar, GameTooltip, Progress, Status } from '../../components/ui'
import { GUILD_SKILL_NODES, GUILD_REGULAR_PROGRAM_IDS, GUILD_MAJOR_PROGRAM_IDS, type GuildSkillBranch } from '../../game/content/guild/guildSkills'
import { canPurchaseGuildSkillNode, getGuildAdvancementPointEconomy, getGuildPointsAvailable, getGuildPointsSpent } from '../../game/systems/guild/guildSelectors'
import { getGuildAdvancementEffectBreakdown } from '../../game/presentation/guild/guildAdvancementEffectBreakdown'
import { InspectorTransition } from '../../ui/game-feel/InspectorTransition'
import { useGameStore } from '../../store/gameStore'
import type { GuildSkillNodeId } from '../../game/types'
import { GUILD_STANDINGS } from '../../game/content/guild/guildStandings'

const groups: readonly { value: GuildSkillBranch | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL PROGRAMS' }, { value: 'scholarship', label: 'SCHOLARSHIP' }, { value: 'transmutation', label: 'TRANSMUTATION' }, { value: 'tower-operations', label: 'TOWER OPERATIONS' }, { value: 'guild-service', label: 'GUILD SERVICE' }, { value: 'milestones', label: 'MAJORS' },
]
const statuses = [{ value: 'all', label: 'ALL' }, { value: 'available', label: 'AVAILABLE' }, { value: 'locked', label: 'LOCKED' }, { value: 'maxed', label: 'MAXED' }] as const
const titleBranch = (branch: GuildSkillBranch) => branch === 'milestones' ? 'Major' : branch.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

export function GuildAdvancementTab() {
  const state = useGameStore()
  const [group, setGroup] = useState<GuildSkillBranch | 'all'>('all')
  const [status, setStatus] = useState<typeof statuses[number]['value']>('all')
  const [selectedId, setSelectedId] = useState<GuildSkillNodeId>(GUILD_REGULAR_PROGRAM_IDS[0])
  const spent = getGuildPointsSpent(state)
  const available = getGuildPointsAvailable(state)
  const nodeIds = [...GUILD_REGULAR_PROGRAM_IDS, ...GUILD_MAJOR_PROGRAM_IDS]
  const visible = nodeIds.filter((id) => {
    const node = GUILD_SKILL_NODES[id]
    const rank = state.progress.guildSkillNodeRanks[id] ?? 0
    const canBuy = canPurchaseGuildSkillNode(state, id)
    if (group !== 'all' && node.branch !== group) return false
    if (status === 'available' && !canBuy) return false
    if (status === 'locked' && (canBuy || rank >= node.maxRank)) return false
    if (status === 'maxed' && rank < node.maxRank) return false
    return true
  })
  const selected = useMemo(() => GUILD_SKILL_NODES[selectedId], [selectedId])
  const rank = state.progress.guildSkillNodeRanks[selectedId] ?? 0
  const canBuy = canPurchaseGuildSkillNode(state, selectedId)
  const major = selected.branch === 'milestones'
  const spentGate = selected.requiredInvestedPoints
  const effects = getGuildAdvancementEffectBreakdown(state, selectedId)
  const requiredStanding = selected.minimumStandingId && GUILD_STANDINGS.find((entry) => entry.id === selected.minimumStandingId)
  const economy = getGuildAdvancementPointEconomy()
  const unlockedMajors = GUILD_MAJOR_PROGRAM_IDS.filter((id) => (state.progress.guildSkillNodeRanks[id] ?? 0) > 0).length
  const nextMajor = GUILD_MAJOR_PROGRAM_IDS.map((id) => GUILD_SKILL_NODES[id]).find((node) => (state.progress.guildSkillNodeRanks[node.id] ?? 0) === 0)
  const tooltipFor = (id: GuildSkillNodeId) => {
    const node = GUILD_SKILL_NODES[id]
    const nodeRank = state.progress.guildSkillNodeRanks[id] ?? 0
    const breakdown = getGuildAdvancementEffectBreakdown(state, id)
    const standing = node.minimumStandingId && GUILD_STANDINGS.find((entry) => entry.id === node.minimumStandingId)
    return [node.name, `${titleBranch(node.branch)} · ${nodeRank}/${node.maxRank}`, breakdown?.perRank ?? breakdown?.maximumEffect, `CURRENT · ${breakdown?.currentEffect}`, `NEXT · ${breakdown?.nextEffect}`, `MAX · ${breakdown?.maximumEffect}`, standing ? `REQUIRES · ${standing.name}` : null, node.requiredInvestedPoints !== undefined ? `Requires ${node.requiredInvestedPoints} AP invested` : null].filter(Boolean).join('\n')
  }
  return <section className="guild-advancement-workspace" aria-label="Guild Advancement Board">
    <Card className="guild-advancement-catalog"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">PERMANENT GUILD PROGRAMS</span><h2>Advancement Catalog</h2><p>Ranked programs and milestone Majors share one board.</p></div><div className="guild-advancement-wallet"><span>AVAILABLE AP</span><strong>{available}</strong><small>{spent} invested · {economy.maxBoundedPoints} total supply</small></div></div>
      <div className="guild-advancement-filter"><FilterBar options={groups} value={group} onChange={(value) => setGroup(value as GuildSkillBranch | 'all')} ariaLabel="Advancement program groups" /><FilterBar options={statuses.map((entry) => ({ value: entry.value, label: entry.label }))} value={status} onChange={(value) => setStatus(value as typeof statuses[number]['value'])} ariaLabel="Advancement program status" /></div>
      <div className="guild-major-milestones"><div><span className="guild-v3-kicker">MAJOR MILESTONES</span><small>{unlockedMajors} / 8 unlocked{nextMajor ? ` · next: ${nextMajor.requiredInvestedPoints} AP invested` : ' · all reached'}</small></div><div>{GUILD_MAJOR_PROGRAM_IDS.map((id) => { const node = GUILD_SKILL_NODES[id]; const unlocked = (state.progress.guildSkillNodeRanks[id] ?? 0) > 0; const eligible = spent >= (node.requiredInvestedPoints ?? 0); return <GameTooltip key={id} content={tooltipFor(id)}><Button variant={selectedId === id ? 'primary' : 'ghost'} className={`guild-major-pip${unlocked ? ' unlocked' : ''}`} aria-label={`${node.name}, ${unlocked ? 'unlocked' : `${node.requiredInvestedPoints} AP threshold`}`} ariaPressed={selectedId === id} onClick={() => setSelectedId(id)}>{unlocked ? <Check size={12} /> : eligible ? <Sparkles size={12} /> : <LockKeyhole size={12} />}</Button></GameTooltip>})}</div></div>
      <div className="guild-advancement-program-grid">{visible.length ? visible.map((id) => { const node = GUILD_SKILL_NODES[id]; const nodeRank = state.progress.guildSkillNodeRanks[id] ?? 0; const availableNode = canPurchaseGuildSkillNode(state, id); const breakdown = getGuildAdvancementEffectBreakdown(state, id); return <GameTooltip key={id} content={tooltipFor(id)} block><Button variant={selectedId === id ? 'primary' : 'ghost'} ariaPressed={selectedId === id} className={`guild-advancement-program${node.branch === 'milestones' ? ' major' : ''}${nodeRank >= node.maxRank ? ' maxed' : ''}`} onClick={() => setSelectedId(id)}><div><span>{titleBranch(node.branch)}</span><b>{nodeRank >= node.maxRank ? 'MAXED' : availableNode ? 'AVAILABLE' : 'LOCKED'}</b></div><strong>{node.name}</strong><small>{breakdown?.tileEffect ?? node.description}</small><i>{nodeRank} / {node.maxRank}</i></Button></GameTooltip>}) : <div className="guild-v3-empty-filter-state"><Status tone="neutral">No matching programs</Status><span>Change the group or status filter to browse other programs.</span></div>}</div>
    </Card>
    <Card className="guild-advancement-inspector"><InspectorTransition identity={selected.id} accent={major ? 'var(--gold)' : 'var(--ui-accent)'} fill><div className="guild-advancement-inspector-content"><div className="guild-v3-panel-heading"><div><span className="guild-v3-kicker">{titleBranch(selected.branch)} · PROGRAM INSPECTOR</span><h2>{selected.name}</h2></div><Status tone={rank >= selected.maxRank ? 'success' : canBuy ? 'active' : 'locked'}>{rank >= selected.maxRank ? 'Maxed' : canBuy ? 'Available' : 'Locked'}</Status></div><p>{selected.description}</p><div className="guild-advancement-rank-block"><span>PROGRAM RANK · {rank} / {selected.maxRank}</span><div>{effects?.rankRows.map((row) => <GameTooltip key={row.rank} content={`Rank ${row.rank}: ${row.label}`}><i className={row.active ? 'active' : ''} aria-label={`Rank ${row.rank} ${row.active ? 'active' : 'locked'}`} /></GameTooltip>)}</div></div>{effects && <><div className="guild-advancement-effect-matrix"><div><span>{effects.perRank ? 'PER RANK EFFECT' : 'UNLOCK EFFECT'}</span><strong>{effects.perRank ?? effects.maximumEffect}</strong></div><div><span>CURRENT EFFECT</span><strong>{effects.currentEffect}</strong></div><div><span>{rank >= selected.maxRank ? 'MAXIMUM' : 'NEXT RANK'}</span><strong>{rank >= selected.maxRank ? effects.maximumEffect : effects.nextEffect}</strong></div>{effects.notes.map((note) => <small key={note}>{note}</small>)}</div></>}
      <div className="guild-advancement-requirements"><span>{major ? `Major unlock · ${spentGate ?? 0} AP invested` : `Required Standing · ${requiredStanding?.name ?? 'Initiate I'}`}</span>{major && <Progress value={Math.min(100, spent / Math.max(1, spentGate ?? 1) * 100)} tone="gold" />}<span>{major ? `${spent} / ${spentGate ?? 0} AP invested · 1 AP to unlock` : `${selected.maxRank} ranks · 1 AP per rank`}</span></div>
      <div className="guild-advancement-inspector-actions"><GameTooltip content={canBuy ? `Invest 1 AP in ${selected.name}.` : rank >= selected.maxRank ? 'This program is at maximum rank.' : available < 1 ? 'Earn another Advancement Point to invest.' : requiredStanding ? `Reach ${requiredStanding.name} to unlock this program.` : `Meet the displayed investment threshold to unlock ${selected.name}.`}><Button variant="primary" disabled={!canBuy} onClick={() => state.purchaseGuildSkillNode(selectedId)}>{rank >= selected.maxRank ? 'Program Maxed' : major ? 'Unlock Major · 1 AP' : `Invest · 1 AP · Rank ${rank + 1}`}</Button></GameTooltip><GameTooltip content="Refund Guild Advancement ranks outside combat. Acolyte capacity changes still obey assignment safety."><Button variant="ghost" onClick={() => state.resetGuildSkillTree()}><RotateCcw size={14} /> Respec Board</Button></GameTooltip></div></div></InspectorTransition></Card>
  </section>
}
