import { Check, Gift, Package, Target } from 'lucide-react'
import { Button, Card, GameTooltip, Progress, Status } from '../../components/ui'
import { ItemIcon } from '../../components/ui/item'
import { GUILD_REQUEST_KIND_LABELS, getGuildRequestPresentation } from '../../game/presentation/guild/guildPresentation'
import { getItemDropSources } from '../../game/content/contentRelations'
import { ITEMS } from '../../game/content/items/items'
import type { GuildRequestId } from '../../game/content/guild/guildRequests'
import type { ItemId } from '../../game/types'
import type { GameStore } from '../../store/gameStore'
import { useGameStore } from '../../store/gameStore'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'

export function GuildContractCard({ state, requestId }: { state: GameStore; requestId: GuildRequestId }) {
  const { request, value, complete, claimed, remaining, percent } = getGuildRequestPresentation(state, requestId)
  return <Card className={`guild-v3-contract-card${complete ? ' complete' : ''}${claimed ? ' claimed' : ''}`}>
    <div className="guild-v3-contract-top"><div className={`guild-v3-contract-icon${complete ? ' complete' : ''}`}>{complete ? <Check size={19} /> : request.kind === 'donation' ? <Gift size={19} /> : <Target size={19} />}</div><div><Status tone={claimed ? 'success' : complete ? 'warning' : 'neutral'}>{claimed ? 'Reward claimed' : complete ? 'Ready to claim' : GUILD_REQUEST_KIND_LABELS[request.kind]}</Status><h3>{request.name}</h3></div><span className="guild-v3-contract-index">CONTRACT</span></div>
    <p className="guild-v3-contract-description">{request.description}</p>
    <div className="guild-v3-contract-requirement"><div><span className="guild-v3-label">REQUIREMENT</span><strong>{request.kind === 'donation' && request.itemId ? <GuildMaterialReference itemId={request.itemId} /> : request.kind === 'dungeon-kills' ? 'Howling Den hunts' : request.kind === 'monster-kills' ? 'Den Stalker defeats' : 'Corrupted Greatbear defeat'}</strong></div><span className="guild-v3-contract-count">{Math.min(value, request.target).toLocaleString()} / {request.target.toLocaleString()}</span></div>
    <Progress value={percent} tone={complete ? 'green' : 'gold'} />
    {!complete && <span className="guild-v3-contract-hint">{remaining.toLocaleString()} more required to complete this contract.</span>}
    <div className="guild-v3-reward-block"><div><span className="guild-v3-label">REWARDS</span><strong>+{request.reputation} Reputation</strong></div><span className="guild-v3-gp-reward">+{request.guildPoints} GP</span></div>
    {request.kind === 'donation' && request.itemId && !claimed && <DonationControls state={state} requestId={requestId} itemId={request.itemId} />}
    {complete && !claimed && <Button variant="success" className="guild-v3-claim-button" onClick={() => state.claimGuildReward(requestId)}><Gift size={14} /> Claim reward</Button>}
  </Card>
}

function DonationControls({ state, requestId, itemId }: { state: GameStore; requestId: GuildRequestId; itemId: ItemId }) {
  const available = state.inventory[itemId] ?? 0
  return <div className="guild-v3-donation-controls"><span>Available: {available.toLocaleString()}</span><div><Button variant="ghost" onClick={() => state.donateGuildRequest(requestId, 1)} disabled={available < 1}>Donate 1</Button><Button variant="ghost" onClick={() => state.donateGuildRequest(requestId, 5)} disabled={available < 1}>Donate 5</Button><Button variant="ghost" onClick={() => state.donateGuildRequest(requestId, 'max')} disabled={available < 1}>Donate max</Button></div></div>
}

function GuildMaterialReference({ itemId }: { itemId: ItemId }) {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const { openContextMenu } = useGameContextMenu()
  const item = ITEMS[itemId]
  const drop = getItemDropSources(itemId)[0]
  return <GameTooltip content="Right-click for inventory, source, tracking, and donation actions"><button type="button" className="guild-v3-material-reference" onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: 'GUILD CONTRACT MATERIAL' }, sections: [{ id: 'item', actions: [{ id: 'inventory', label: 'Open in Inventory', onSelect: () => { setNavigationIntent({ inventoryItemId: itemId }); state.setScreen('inventory') } }, ...(drop ? [{ id: 'source', label: 'Where to Get', icon: Package, onSelect: () => { setNavigationIntent({ combatDungeonId: drop.dungeonId, combatMonsterId: drop.monsterId }); state.setScreen('combat') } }] : []), { id: 'track', label: preferences.trackedItemId === itemId ? 'Untrack Item' : 'Track Item', onSelect: () => setUiPreferences({ trackedItemId: preferences.trackedItemId === itemId ? null : itemId }) }] }] }) }}><ItemIcon itemId={itemId} size="tiny" /><span>{item.name}</span></button></GameTooltip>
}
