import { Check, Crown, Gift, Lock, Package, RotateCcw, Sparkles } from 'lucide-react'
import { GUILD_REQUESTS, GUILD_REQUEST_IDS, type GuildRequestId } from '../../game/content/guild/guildRequests'
import { GUILD_SKILL_BRANCHES, GUILD_SKILL_NODES, type GuildSkillBranch } from '../../game/content/guild/guildSkills'
import { GUILD_RANKS } from '../../game/content/guild/guildRanks'
import { useGameStore, type GameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { ItemIcon } from '../../components/ui/item'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { getItemDropSources } from '../../game/content/contentRelations'
import { ITEMS } from '../../game/content/items/items'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { canPurchaseGuildSkillNode, getGuildPointsAvailable, getGuildPromotionProgress, getGuildRequestProgress, isGuildRequestComplete } from '../../game/systems/guild/guildSelectors'

const requestLabels = { donation: 'Supply', 'dungeon-kills': 'Hunt', 'monster-kills': 'Bounty', 'boss-kill': 'Expedition' } as const
const branchLabels: Record<GuildSkillBranch, string> = { hunter: 'Hunter', quartermaster: 'Quartermaster', tower: 'Tower' }

export function GuildScreenV2() {
  const state = useGameStore()
  const { progress, inventory } = state
  const promotion = getGuildPromotionProgress(state)
  const promotionReady = promotion.eligible

  if (!progress.guildUnlocked) return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">THE VERDANT CIRCLE</div><h1>A guild invitation, still sealed.</h1><p>Defeat the Forest Heart to unlock Requests, Reputation, and the Initiate to Apprentice progression.</p></div></div><ScreenGrid screen="guild" panels={[{ id: 'guild-banner', content: <div className="locked-screen"><div className="locked-seal"><Lock size={28} /></div><h2>Guild Locked</h2><p>The forest boss holds the first letter of introduction.</p></div> }]} /></div>

  const requestPanels = GUILD_REQUEST_IDS.map((requestId, index) => ({ id: `guild-request-${index + 1}`, content: <RequestCard requestId={requestId} index={index} progress={progress} inventory={inventory} onDonate={state.donateGuildRequest} onClaim={state.claimGuildReward} /> }))
  const banner = <div className="guild-banner"><div className="guild-emblem">¤</div><div><Status tone="success">Unlocked</Status><h2>Verdant Circle</h2><p>Current rank · {promotion.currentRank.name}</p></div><div className="rank-step">{GUILD_RANKS.slice(0, 3).map((rank, index) => <span key={rank.id} className={rank.id === promotion.currentRank.id ? 'current' : ''}>{index > 0 ? '→ ' : ''}{rank.name}</span>)}</div></div>
  const rankAndSkills = <Card title="Guild progression" action={<span className="muted">{getGuildPointsAvailable(state)} Guild Points available</span>}><div className="rank-promotion"><div><Crown size={22} color="var(--gold)" /><strong>{promotion.nextRank ? `${promotion.currentRank.name} → ${promotion.nextRank.name}` : `${promotion.currentRank.name} achieved`}</strong><span>{promotion.requirements.map((requirement) => `${requirement.label} ${requirement.current} / ${requirement.target}`).join(' · ') || 'The highest Guild rank has been achieved.'}</span></div><Button variant={promotion.eligible ? 'success' : 'secondary'} disabled={!promotion.nextRank || !promotionReady} onClick={state.promoteGuild}>{promotion.nextRank ? `Promote to ${promotion.nextRank.name}` : 'Highest Rank'}</Button></div><div className="guild-skill-tree">{GUILD_SKILL_BRANCHES.map((branch) => <SkillBranch key={branch} branch={branch} state={state} />)}</div><div className="guild-tree-actions"><GameTooltip content="Refund all Guild Skill Points outside active combat. Expanded Quarters cannot be removed while too many Acolytes are assigned."><Button variant="ghost" onClick={() => state.resetGuildSkillTree()}><RotateCcw size={14} /> Respec Tree</Button></GameTooltip><span>{Object.values(progress.guildSkillNodeRanks).filter(Boolean).length} / 9 nodes invested · Reputation is non-spendable.</span></div><div className="equipment-note"><Sparkles size={15} /><span>Guild Points come from unique Request claims and promotion. Skill effects are permanent until a free respec.</span></div></Card>
  return <div className="screen-content"><div className="screen-header"><div><div className="eyebrow">THE VERDANT CIRCLE</div><h1>Your first guild hall.</h1><p>Complete field work, claim rewards once, and shape the Guild Skill Tree.</p></div><div className="guild-summary"><span>GUILD REPUTATION</span><strong>{progress.guildReputation}</strong><em>{progress.guildRank}</em></div></div><ScreenGrid screen="guild" panels={[{ id: 'guild-banner', content: banner }, ...requestPanels, { id: 'guild-rank', content: rankAndSkills }]} /></div>
}

function RequestCard({ requestId, index, progress, inventory, onDonate, onClaim }: { requestId: GuildRequestId; index: number; progress: import('../../game/types').ProgressState; inventory: Record<string, number>; onDonate: (requestId: string, amount: number | 'max') => void; onClaim: (requestId: string) => void }) {
  const request = GUILD_REQUESTS[requestId]
  const value = getGuildRequestProgress({ progress }, requestId)
  const complete = isGuildRequestComplete({ progress }, requestId)
  const claimed = Boolean(progress.requestClaims[requestId])
  const remaining = Math.max(0, request.target - value)
  return <Card className={`request-card ${complete ? 'done' : ''}`}><div className="request-icon">{complete ? <Check size={20} /> : <Gift size={20} />}</div><div><Status tone={claimed ? 'success' : complete ? 'warning' : 'neutral'}>{claimed ? 'Reward claimed' : complete ? 'Request complete' : requestLabels[request.kind]}</Status><h3>{request.name}</h3><p>{request.description}</p><Progress value={value / request.target * 100} tone="gold" right={`${Math.min(value, request.target)} / ${request.target}`} /><div className="request-reward-line"><span>+{request.reputation} Reputation</span><strong>+{request.guildPoints} GP</strong></div>{request.kind === 'donation' && request.itemId && <div className="donation-buttons"><GuildMaterialReference itemId={request.itemId} onDonateOne={() => onDonate(requestId, 1)} onDonateRequired={() => onDonate(requestId, 'max')} /><Button variant="ghost" onClick={() => onDonate(requestId, 1)}>Donate 1</Button><Button variant="ghost" onClick={() => onDonate(requestId, 5)}>Donate 5</Button><Button variant="ghost" onClick={() => onDonate(requestId, 'max')}>Donate Max</Button><small>Available: {inventory[request.itemId] ?? 0}</small></div>}{complete && !claimed && <Button variant="success" className="wide" onClick={() => onClaim(requestId)}>Claim reward</Button>}{!complete && <small className="request-hint">{remaining} more required · Request {index + 1}</small>}</div></Card>
}

function SkillBranch({ branch, state }: { branch: GuildSkillBranch; state: GameStore }) {
  const nodes = Object.values(GUILD_SKILL_NODES).filter((node) => node.branch === branch)
  return <section className="guild-skill-branch"><header><span>{branchLabels[branch]}</span><small>Sequential path</small></header>{nodes.map((node) => { const purchased = Boolean(state.progress.guildSkillNodeRanks[node.id]); const available = canPurchaseGuildSkillNode(state, node.id); return <GameTooltip key={node.id} block content={<span>{node.description}{node.requiredRank ? ` Requires ${node.requiredRank} rank.` : ''}{node.prerequisiteId ? ` Requires ${GUILD_SKILL_NODES[node.prerequisiteId].name}.` : ''}</span>}><div className={`guild-skill-node ${purchased ? 'purchased' : ''}`}><div><strong>{node.name}</strong><small>{node.description}</small></div><Button variant={purchased ? 'success' : 'secondary'} disabled={purchased || !available} onClick={() => state.purchaseGuildSkillNode(node.id)}>{purchased ? 'Owned' : available ? 'Invest · 1 GP' : 'Locked'}</Button></div></GameTooltip> })}</section>
}

function GuildMaterialReference({ itemId, onDonateOne, onDonateRequired }: { itemId: import('../../game/types').ItemId; onDonateOne: () => void; onDonateRequired: () => void }) {
  const item = ITEMS[itemId]
  const state = useGameStore()
  const preferences = useUiPreferences()
  const { openContextMenu } = useGameContextMenu()
  const drop = getItemDropSources(itemId)[0]
  return <button type="button" className="guild-material-reference" onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: 'GUILD REQUEST MATERIAL' }, sections: [{ id: 'item', actions: [{ id: 'inventory', label: 'Open in Inventory', onSelect: () => { setNavigationIntent({ inventoryItemId: itemId }); state.setScreen('inventory') } }, ...(drop ? [{ id: 'source', label: 'Where to Get', icon: Package, onSelect: () => { setNavigationIntent({ combatDungeonId: drop.dungeonId, combatMonsterId: drop.monsterId }); state.setScreen('combat') } }] : []), { id: 'track', label: preferences.trackedItemId === itemId ? 'Untrack Item' : 'Track Item', onSelect: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === itemId ? null : itemId }) }, { id: 'donate-one', label: 'Donate 1', onSelect: onDonateOne }, { id: 'donate-required', label: 'Donate Required', onSelect: onDonateRequired }] }] }) }}><ItemIcon itemId={itemId} size="tiny" /><strong>{item.name}</strong></button>
}
