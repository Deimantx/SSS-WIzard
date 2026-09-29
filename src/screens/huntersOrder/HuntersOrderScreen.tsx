import type { HunterContractState, MonsterId } from '../../game/types'
import { useState } from 'react'
import { BookOpen, Map, RefreshCw, Shield, SkipForward, Target, Trophy } from 'lucide-react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../game/content/monsters/huntersOrder'
import { HUNTER_UPGRADES } from '../../game/content/huntersOrder/hunterUpgrades'
import { MONSTERS } from '../../game/content/monsters'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { BALANCE } from '../../game/core/balance/balance'
import { doesMonsterMatchHunterContract, getHunterAuthorization, getHunterContractTargetLabel, getHunterRankProgress, getHunterBlockSlotCount, getHunterUpgradePurchaseStatus, getHunterRerollMarkCost, getHunterSkipMarkCost, isHuntersOrderUnlocked } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import { useGameStore } from '../../store/gameStore'
import { BestiaryScreen } from '../bestiary/BestiaryScreen'
import { useUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import type { HuntersOrderScreenTab } from '../../ui/preferences/uiPreferencesTypes'

const tabs: readonly { id: HuntersOrderScreenTab; label: string; hint: string }[] = [
  { id: 'contracts', label: 'Contracts', hint: 'Choose and track a monster-hunting assignment.' },
  { id: 'rank', label: 'Order Rank', hint: 'Review Hunter Reputation and standing.' },
  { id: 'upgrades', label: 'Upgrades', hint: 'Order services and future progression.' },
  { id: 'bestiary', label: 'Bestiary', hint: 'Review encountered monsters and hunting records.' },
  { id: 'grounds', label: 'Hunting Grounds', hint: 'Find contract-eligible hunting locations.' },
]

export function HuntersOrderScreen() {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const order = state.progress.huntersOrder
  const tab = preferences.screenState.huntersOrder.activeTab
  const setTab = (activeTab: HuntersOrderScreenTab) => setUiPreferences({ screenState: { huntersOrder: { activeTab } } })
  const unlocked = isHuntersOrderUnlocked(state)
  const visibleTab = unlocked ? tab : 'bestiary'
  const rankProgress = getHunterRankProgress(order.reputation)
  const rank = rankProgress.currentRank
  const nextRank = rankProgress.nextRank
  const panels = visibleTab === 'contracts' ? [{ id: 'hunter-contracts', content: <ContractsPanel state={state} /> }]
    : visibleTab === 'rank' ? [{ id: 'hunter-rank', content: <Card className="hunter-rank-card"><div className="hunter-card-kicker"><Shield size={14} /> ORDER STANDING</div><h2>{rank.name}</h2><p>{order.reputation.toLocaleString()} Reputation{nextRank ? ` · ${Math.max(0, nextRank.reputation - order.reputation).toLocaleString()} to ${nextRank.name}` : ' · Highest rank'}</p><div className="hunter-progress-track"><span style={{ width: `${rankProgress.progress * 100}%` }} /></div><div className="hunter-rank-unlocks"><span>{nextRank ? `NEXT RANK · ${nextRank.name} AT ${nextRank.reputation.toLocaleString()} REPUTATION` : 'CURRENT RANK BENEFITS'}</span><ul>{(nextRank ?? rank).unlocks.map((unlock) => <li key={unlock}>{unlock}</li>)}</ul></div><div className="hunter-stat-row"><span>Contracts completed</span><strong>{order.totalContractsCompleted.toLocaleString()}</strong><span>Hunter Marks</span><strong>{order.hunterMarks.toLocaleString()}</strong></div></Card> }]
    : visibleTab === 'upgrades' ? [{ id: 'hunter-upgrades', content: <div className="hunter-upgrade-grid">{HUNTER_UPGRADES.map((upgrade) => { const status = getHunterUpgradePurchaseStatus(state, upgrade.id); const owned = status.ownedRank >= upgrade.maxRank; const lockedByRank = status.reason === 'rank-required'; const label = owned ? 'Purchased' : lockedByRank ? `Requires ${status.requiredRank?.name}` : status.reason === 'marks-required' ? `Need ${status.cost ?? 0} Marks` : `Unlock · ${status.cost ?? 0} Marks`; return <Card key={upgrade.id} className="hunter-upgrade-card"><div className="hunter-card-kicker"><Trophy size={14} /> HUNTER UPGRADE</div><h2>{upgrade.name}</h2><p>{upgrade.description}</p><div className="hunter-upgrade-rank"><span>Required Rank</span><strong>{status.requiredRank?.name}</strong><span>Current Rank</span><strong>{status.currentRank.name}</strong></div>{lockedByRank && <Status tone="warning">Reach {status.requiredRank?.name} to unlock this upgrade.</Status>}<GameTooltip content={`${upgrade.description} Requires ${status.requiredRank?.name}. Current rank: ${status.currentRank.name}. ${status.cost === null ? 'Fully upgraded.' : `Next rank costs ${status.cost} Hunter Marks.`}`}><Button variant={owned ? 'success' : 'primary'} disabled={!status.canPurchase} onClick={() => methodsPurchase(upgrade.id)}>{label}</Button></GameTooltip></Card> })}</div> }]
    : visibleTab === 'bestiary' ? [{ id: 'hunter-bestiary', content: <BestiaryScreen embedded /> }]
    : [{ id: 'hunter-grounds', content: <HuntingGrounds state={state} /> }]
  return <div className="screen-content hunters-order-screen">
        <header className="screen-header hunters-order-header"><div><div className="eyebrow">{unlocked ? 'HUNTER’S ORDER · CONTRACTS' : 'FIELD ARCHIVE · BESTIARY'}</div><h1>{unlocked ? 'Hunter’s Order' : 'Know what waits beyond the tower.'}</h1><p>{unlocked ? 'Choose a quarry, track its progress, and claim the Order’s rewards.' : `The Bestiary remains open. Defeat Corrupted Greatbear to unlock Hunter Contracts, Rank, Upgrades, and Hunting Grounds (${Math.min(1, state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0)} / 1).`}</p></div>{unlocked && <div className="hunter-header-insignia"><Target size={20} /><span>{rank.name}</span></div>}</header>
    <div className="hunter-tab-rail" role="tablist" aria-label="Hunter’s Order sections">{tabs.map((entry) => { const disabled = !unlocked && entry.id !== 'bestiary'; return <GameTooltip key={entry.id} content={disabled ? 'Defeat Corrupted Greatbear to unlock the Hunter’s Order.' : entry.hint} block><Button role="tab" aria-selected={visibleTab === entry.id} aria-disabled={disabled} disabled={disabled} variant={visibleTab === entry.id ? 'primary' : 'ghost'} onClick={() => setTab(entry.id)}>{entry.label}</Button></GameTooltip> })}</div>
    <ScreenGrid screen="hunters-order" panels={panels} />
  </div>
}

function methodsPurchase(id: string) { return useGameStore.getState().purchaseHunterUpgrade(id) }

function ContractsPanel({ state }: { state: ReturnType<typeof useGameStore.getState> }) {
  const [manageBlocks, setManageBlocks] = useState(false)
  const order = state.progress.huntersOrder
  const active = order.activeContract
  const offers = order.availableContracts
  const methods = useGameStore.getState()
  const blockNames = order.blockedTargets.map((id) => ({ id, name: MONSTERS[id]?.name ?? id }))
  const refreshCost = getHunterRerollMarkCost(state)
  return <section className="hunter-contract-layout">
    <div className="hunter-contract-main">
      <div className="hunter-board-heading"><div><span className="hunter-card-kicker">CONTRACT BOARD</span><h2>{active ? 'Current contract' : 'Choose a contract'}</h2><p>{active ? 'Track the marked quarry and pursue it in Gloamridge.' : 'Select one assignment. The remaining choices stay on the board.'}</p></div></div>
      {active && <Card className="hunter-active-contract"><div className="hunter-contract-emblem"><Target size={22} /></div><div className="hunter-contract-copy"><div className="hunter-card-kicker">{active.tier.toUpperCase()} · ACTIVE</div><h3>{getHunterContractTargetLabel(active)}</h3><p>{active.progress.toLocaleString()} / {active.target.toLocaleString()} tracked kills · {active.reputationReward.toLocaleString()} Reputation · {active.marksReward} Marks</p><div className="hunter-progress-track" role="progressbar" aria-label="Contract progress" aria-valuenow={active.progress} aria-valuemin={0} aria-valuemax={active.target}><span style={{ width: `${Math.min(100, active.progress / active.target * 100)}%` }} /></div><GameTooltip content="Open Combat to pursue matching quarry in Gloamridge."><Button variant="primary" onClick={() => methods.setScreen('combat')}><Map size={14} /> View Hunting Ground</Button></GameTooltip></div><GameTooltip content={`Skip this assignment for ${getHunterSkipMarkCost(state)} Hunter Marks; current progress is forfeited.`}><Button variant="ghost" disabled={order.hunterMarks < getHunterSkipMarkCost(state)} onClick={() => methods.skipHunterContract()}><SkipForward size={15} /> Skip</Button></GameTooltip></Card>}
      <div className="hunter-offer-heading"><h3>{active ? 'Other board choices' : 'Available contracts'}</h3></div>
      {offers.length ? <div className="hunter-offer-grid">{offers.map((contract) => <Card key={contract.id} className="hunter-offer-card"><GameTooltip content={`${contract.tier} Hunt Contract. Complete ${contract.target} tracked kills for ${contract.reputationReward} Reputation and ${contract.marksReward} Hunter Marks.`}><div className={`hunter-tier-mark hunter-tier-${contract.tier}`}>{contract.tier}</div></GameTooltip><h3>{getHunterContractTargetLabel(contract)}</h3><p>{contract.targetSpec.type === 'monster' || contract.targetSpec.type === 'boss' ? MONSTERS[contract.targetSpec.monsterId]?.subtitle : 'Hunt eligible creatures matching this target.'}</p><div className="hunter-offer-target">{contract.target.toLocaleString()} contract kills</div><div className="hunter-reward-line"><span>{contract.reputationReward.toLocaleString()} Reputation</span><strong>{contract.marksReward} Marks</strong></div><div className="hunter-offer-actions"><GameTooltip content="Accept this assignment. Only one Hunt Contract can be active at a time."><Button variant="primary" disabled={Boolean(active)} onClick={() => methods.acceptHunterContract(contract.id)}>Accept Contract</Button></GameTooltip><HunterBlockAction contract={contract} blockedTargets={order.blockedTargets} blockSlots={getHunterBlockSlotCount(state)} onToggle={(id) => methods.setHunterTargetBlocked(id, !order.blockedTargets.includes(id))} /></div></Card>)}</div> : active ? <Card className="hunter-empty-state hunter-secondary-empty"><h3>No other contracts on the board</h3><p>Your active assignment remains in progress. Refresh the board when you want different choices.</p></Card> : <Card className="hunter-empty-state"><Target size={22} /><h3>No contracts available</h3>{order.blockedTargets.length > 0 ? <><p>Current target blocks exclude eligible quarry from contract generation. Remove a block or clear the list, then the board will refill immediately.</p><div className="hunter-empty-count">{order.blockedTargets.length} target {order.blockedTargets.length === 1 ? 'block' : 'blocks'} active</div></> : <p>No quarry is currently eligible at this Order rank. Your contract board will appear when eligible targets unlock.</p>}<GameTooltip content="Open the blocked target list and unblock quarry so it can return to contract offers."><Button variant="primary" onClick={() => setManageBlocks(true)}>Open Block List</Button></GameTooltip></Card>}
    </div>
    <aside className="hunter-contract-sidebar" aria-label="Order contract controls">
      <Card className="hunter-order-resource"><div className="hunter-card-kicker">HUNTER MARKS</div><strong className="hunter-mark-balance">{order.hunterMarks.toLocaleString()}</strong><div className="hunter-refresh-cost"><span>Refresh cost</span><strong>{refreshCost} Marks</strong></div><GameTooltip content={`Spend ${refreshCost} Hunter Marks to replace available choices. Active progress is preserved.`}><Button variant="secondary" disabled={order.hunterMarks < refreshCost} onClick={() => methods.rerollHunterContracts()}><RefreshCw size={14} /> Refresh Contracts</Button></GameTooltip>{order.hunterMarks < refreshCost && <p className="hunter-disabled-note">Need {refreshCost} Hunter Marks to refresh.</p>}</Card>
      <Card className="hunter-block-summary"><div className="hunter-block-heading"><div><div className="hunter-card-kicker">TARGET BLOCKS</div><strong>{blockNames.length ? `${blockNames.length} active` : 'None active'}</strong></div><GameTooltip content="Manage creatures excluded from future contract boards."><Button variant="ghost" aria-expanded={manageBlocks} onClick={() => setManageBlocks((open) => !open)}>{manageBlocks ? 'Close' : 'Manage Blocks'}</Button></GameTooltip></div>{blockNames.length ? <><ul className="hunter-block-preview">{blockNames.slice(0, 3).map((entry) => <li key={entry.id}>{entry.name}</li>)}</ul>{manageBlocks && <div role="region" className="hunter-block-list" aria-label="Blocked targets">{blockNames.map((entry) => <div className="hunter-block-row" key={entry.id}><span>{entry.name}</span><GameTooltip content="Remove this target block and return the creature to future contract boards."><Button variant="ghost" onClick={() => methods.setHunterTargetBlocked(entry.id, false)}>Unblock</Button></GameTooltip></div>)}</div>}{blockNames.length > 0 && <GameTooltip content="Remove every target block. The Order immediately rebuilds available contracts."><Button variant="secondary" onClick={() => methods.clearHunterTargetBlocks()}>Clear All Blocks</Button></GameTooltip>}</> : <p className="hunter-disabled-note">Blocked quarry will not appear on new contract boards.</p>}</Card>
      <Card className="hunter-contract-guidance"><div className="hunter-card-kicker">FIELD NOTE</div><p>Contracts authorize matching quarry in Gloamridge. Blocked targets are excluded when the Order prepares a board.</p></Card>
    </aside>
  </section>
}

function HunterBlockAction({ contract, blockedTargets, blockSlots, onToggle }: { contract: HunterContractState; blockedTargets: MonsterId[]; blockSlots: number; onToggle: (id: MonsterId) => void }) {
  if (contract.targetSpec.type !== 'monster') return null
  const monsterId = contract.targetSpec.monsterId
  const blocked = blockedTargets.includes(monsterId)
  return <GameTooltip content={blocked ? 'Unblock this creature so it can appear on future boards.' : `Block this creature from future choices. ${blockedTargets.length}/${blockSlots} slots are occupied.`}>
    <Button variant="ghost" disabled={!blocked && blockedTargets.length >= blockSlots} onClick={() => onToggle(monsterId)}>{blocked ? 'Unblock' : 'Block Target'}</Button>
  </GameTooltip>
}

function HuntingGrounds({ state }: { state: ReturnType<typeof useGameStore.getState> }) {
  const active = state.progress.huntersOrder.activeContract
  const eligibleTargets = active ? HUNTER_EXCLUSIVE_MONSTER_IDS.filter((id) => id !== 'nightglass-alpha' && doesMonsterMatchHunterContract(active, id, 'hunters-ground')) : []
  const apexAuthorization = getHunterAuthorization(state, 'nightglass-alpha', 'hunters-ground')
  return <div className="hunter-ground-panel"><Card><div className="hunter-card-kicker"><Map size={14} /> HUNTING GROUND</div><h2>Gloamridge</h2><p>A marked ridge beyond the Howling Den, bridging the Den’s threats toward the Abandoned Catacombs.</p><div className="hunter-ground-meta"><span>Recommended Threat <strong>{DUNGEONS['hunters-ground'].threatRequired.toLocaleString()}</strong></span><span>Hunter Rank <strong>Unlocks after Corrupted Greatbear</strong></span><span>Known quarry <strong>{DUNGEONS['hunters-ground'].monsterPool.length}</strong></span><span>Contract relevance <strong>{active ? `${eligibleTargets.length} eligible quarry` : 'No active Contract'}</strong></span><span>Apex status <strong>{apexAuthorization.authorized ? 'Boss Contract active' : active ? 'Matching Master Hunter Boss Contract required' : 'Contract-gated'}</strong></span></div><GameTooltip content={active ? 'Open Combat and select Gloamridge. Only quarry matching your active Contract can be hunted.' : 'Accept a Hunt Contract before engaging marked creatures in this ground.'}><Button variant="primary" disabled={!active} onClick={() => state.setScreen('combat')}>{active ? 'Open Combat' : 'Active contract required'}</Button></GameTooltip></Card><Card className="hunter-ground-roster">{HUNTER_EXCLUSIVE_MONSTER_IDS.map((id) => { const eligible = active && (id === 'nightglass-alpha' ? apexAuthorization.authorized : doesMonsterMatchHunterContract(active, id, 'hunters-ground')); return <div key={id}><span>{MONSTERS[id]?.name}</span><strong>{id === 'nightglass-alpha' ? `Apex · ${eligible ? 'Authorized' : 'Boss Contract'}` : eligible ? 'Contract eligible' : active ? 'Outside active Contract' : 'Contract target'}</strong></div> })}</Card></div>
}
