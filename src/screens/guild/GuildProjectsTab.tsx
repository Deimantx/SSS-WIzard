import { Archive, Check, ScrollText } from 'lucide-react'
import { Button, Card, GameTooltip, Progress } from '../../components/ui'
import { GUILD_PROJECTS } from '../../game/content/guild/guildProjects'
import { GUILD_COMMISSION_CHAINS } from '../../game/content/guild/guildCommissionChains'
import { ITEMS } from '../../game/content/items/items'
import { useGameStore } from '../../store/gameStore'

export function GuildProjectsTab() {
  const state = useGameStore()
  const guild = state.progress.arcaneGuild
  return <section className="guild-project-grid" aria-label="Guild Projects">{GUILD_PROJECTS.map((project) => {
    const complete = guild.completedProjectIds.includes(project.id)
    const required = project.requirements.reduce((sum, entry) => sum + entry.quantity, 0)
    const contributed = project.requirements.reduce((sum, entry) => sum + Math.min(entry.quantity, guild.projects[project.id]?.[entry.itemId] ?? 0), 0)
    return <Card key={project.id} className="guild-project-card"><div className="guild-v3-kicker"><Archive size={14} /> PERMANENT GUILD PROJECT</div><h2>{project.name}</h2><p>{project.description}</p><div className="guild-project-rewards"><span>+{project.reputationReward} Reputation</span><strong>+{project.advancementPointsReward} Advancement Point</strong></div><Progress value={contributed / required * 100} tone="gold" /><div className="guild-project-progress">{contributed} / {required} materials contributed</div><div className="guild-project-requirements">{project.requirements.map((entry) => { const amount = guild.projects[project.id]?.[entry.itemId] ?? 0; const remaining = Math.max(0, entry.quantity - amount); const owned = state.inventory[entry.itemId] ?? 0; return <div key={entry.itemId}><span>{ITEMS[entry.itemId].name} <b>{amount} / {entry.quantity}</b></span><GameTooltip content={`Contribute up to the remaining ${remaining}. Protected items cannot be contributed.`}><Button variant="secondary" disabled={complete || remaining < 1 || owned < 1} onClick={() => state.contributeGuildProject(project.id, entry.itemId, 'max')}>{complete ? 'Complete' : `Contribute · ${Math.min(remaining, owned)}`}</Button></GameTooltip></div> })}</div>{complete && <div className="guild-project-complete"><Check size={15} /> Project complete</div>}</Card>
  })}</section>
}

export function GuildCommissionChainsTab() {
  const state = useGameStore()
  const guild = state.progress.arcaneGuild
  const active = guild.activeCommissionChain
  return <section className="guild-chain-list" aria-label="Commission Chains">{GUILD_COMMISSION_CHAINS.map((chain) => {
    const isActive = active?.id === chain.id
    const index = isActive ? active.stageIndex : 0
    const stage = chain.stages[index]
    const unlocked = ['outsider','initiate','apprentice','adept','magister','circle-master'].indexOf(state.progress.guildRank) >= chain.minimumRank
    return <Card key={chain.id} className={`guild-chain-card${isActive ? ' active' : ''}`}><div className="guild-v3-kicker"><ScrollText size={14} /> STAGED GUILD ASSIGNMENT</div><h2>{chain.name}</h2><p>{chain.description}</p><ol>{chain.stages.map((entry, stageIndex) => <li key={stageIndex} className={isActive && stageIndex === active.stageIndex ? 'current' : ''}><span>STAGE {stageIndex + 1}</span><strong>{entry.category === 'delivery' ? `Deliver ${entry.target} ${ITEMS[entry.itemId].name}` : `${entry.category === 'research' ? 'Complete Research' : 'Perform Transmutations'} · ${entry.target}`}</strong></li>)}</ol><div className="guild-project-rewards"><span>+{chain.reputationReward} Reputation</span><strong>+{chain.advancementPointsReward} Advancement Point</strong></div>{isActive && stage ? <div className="guild-chain-progress"><Progress value={active.stageProgress / stage.target * 100} tone="gold" /><span>Stage {active.stageIndex + 1} · {active.stageProgress} / {stage.target}{stage.category === 'delivery' ? ` · ${ITEMS[stage.itemId].name}` : ''}</span>{stage.category === 'delivery' && <GameTooltip content={`Contribute ${ITEMS[stage.itemId].name} to the active chain stage. Protected items are excluded.`}><Button variant="primary" disabled={(state.inventory[stage.itemId] ?? 0) < 1} onClick={() => state.contributeGuildCommissionChainDelivery('max')}>Deliver max · {state.inventory[stage.itemId] ?? 0}</Button></GameTooltip>}</div> : <GameTooltip content={unlocked ? 'Accept the staged assignment. Chain progress persists across sessions.' : 'Reach Adept Guild Rank to unlock Commission Chains.'}><Button variant="primary" disabled={!unlocked || Boolean(active)} onClick={() => state.startGuildCommissionChain(chain.id)}>{unlocked ? active ? 'Another chain is active' : 'Accept Chain' : 'Adept rank required'}</Button></GameTooltip>}</Card>
  })}</section>
}
