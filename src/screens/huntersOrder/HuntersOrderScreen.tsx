import type { HunterContractState, MonsterId } from '../../game/types'
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
        <header className="screen-header hunters-order-header"><div><div className="eyebrow">{unlocked ? 'HUNTER’S ORDER · TRACK / STUDY / PURSUE' : 'FIELD ARCHIVE · BESTIARY'}</div><h1>{unlocked ? 'The ground remembers every hunt.' : 'Know what waits beyond the tower.'}</h1><p>{unlocked ? 'Contracts are the Order’s work. Only an active contract authorizes matching quarry in Gloamridge.' : `The Bestiary remains open. Defeat Corrupted Greatbear to unlock Hunter Contracts, Rank, Upgrades, and Hunting Grounds (${Math.min(1, state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0)} / 1).`}</p></div>{unlocked && <div className="hunter-header-insignia"><Target size={20} /><span>{rank.name}</span></div>}</header>
    <div className="hunter-tab-rail" role="tablist" aria-label="Hunter’s Order sections">{tabs.map((entry) => { const disabled = !unlocked && entry.id !== 'bestiary'; return <GameTooltip key={entry.id} content={disabled ? 'Defeat Corrupted Greatbear to unlock the Hunter’s Order.' : entry.hint} block><Button role="tab" aria-selected={visibleTab === entry.id} aria-disabled={disabled} disabled={disabled} variant={visibleTab === entry.id ? 'primary' : 'ghost'} onClick={() => setTab(entry.id)}>{entry.label}</Button></GameTooltip> })}</div>
    <ScreenGrid screen="hunters-order" panels={panels} />
  </div>
}

function methodsPurchase(id: string) { return useGameStore.getState().purchaseHunterUpgrade(id) }

function ContractsPanel({ state }: { state: ReturnType<typeof useGameStore.getState> }) {
  const order = state.progress.huntersOrder
  const active = order.activeContract
  const offers = order.availableContracts
  const methods = useGameStore.getState()
  return <section className="hunter-contract-view">
    <div className="hunter-board-heading"><div><span className="hunter-card-kicker">THE TRACKER’S BOARD</span><h2>{active ? 'Active Hunt Contract' : 'Choose a contract'}</h2><p>{active ? 'Only this active assignment authorizes hunts in Gloamridge.' : 'Select one assignment. The remaining choices stay on the board.'}</p></div><div className="hunter-currency-line"><span>Hunter Marks</span><strong>{order.hunterMarks.toLocaleString()}</strong></div></div>
    {active && <Card className="hunter-active-contract"><div className="hunter-contract-emblem"><Target size={22} /></div><div className="hunter-contract-copy"><div className="hunter-card-kicker">{active.tier.toUpperCase()} · ACTIVE</div><h3>{getHunterContractTargetLabel(active)}</h3><p>{active.progress} / {active.target} tracked kills · {active.reputationReward} Reputation · {active.marksReward} Marks</p><div className="hunter-progress-track"><span style={{ width: `${Math.min(100, active.progress / active.target * 100)}%` }} /></div></div><GameTooltip content={`Abandon this assignment and spend ${getHunterSkipMarkCost(state)} Hunter Marks; progress is forfeited.`}><Button variant="ghost" disabled={order.hunterMarks < getHunterSkipMarkCost(state)} onClick={() => methods.skipHunterContract()}><SkipForward size={15} /> Skip · {getHunterSkipMarkCost(state)} Marks</Button></GameTooltip></Card>}
    <div className="hunter-offer-heading"><h3>Available contracts</h3><GameTooltip content={`Spend ${getHunterRerollMarkCost(state)} Hunter Marks to replace the current choices. Refreshing does not cancel your active contract.`}><Button variant="secondary" disabled={order.hunterMarks < getHunterRerollMarkCost(state)} onClick={() => methods.rerollHunterContracts()}><RefreshCw size={14} /> Refresh · {getHunterRerollMarkCost(state)} Marks</Button></GameTooltip></div>
    {offers.length ? <div className="hunter-offer-grid">{offers.map((contract) => <Card key={contract.id} className="hunter-offer-card"><GameTooltip content={`${contract.tier} Hunt Contract. Complete ${contract.target} tracked kills for ${contract.reputationReward} Reputation and ${contract.marksReward} Hunter Marks.`}><div className={`hunter-tier-mark hunter-tier-${contract.tier}`}>{contract.tier}</div></GameTooltip><h3>{getHunterContractTargetLabel(contract)}</h3><p>{contract.targetSpec.type === 'monster' || contract.targetSpec.type === 'boss' ? MONSTERS[contract.targetSpec.monsterId]?.subtitle : 'Hunt eligible creatures matching this target.'}</p><div className="hunter-offer-target">{contract.target} contract kills</div><div className="hunter-reward-line"><span>{contract.reputationReward} Reputation</span><strong>{contract.marksReward} Marks</strong></div><div className="hunter-offer-actions"><GameTooltip content="Accept this assignment. Only one Hunt Contract can be active at a time."><Button variant="primary" disabled={Boolean(active)} onClick={() => methods.acceptHunterContract(contract.id)}>Accept Contract</Button></GameTooltip><HunterBlockAction contract={contract} blockedTargets={order.blockedTargets} blockSlots={getHunterBlockSlotCount(state)} onToggle={(id) => methods.setHunterTargetBlocked(id, !order.blockedTargets.includes(id))} /></div></Card>)}</div> : <Card className="hunter-empty-state"><Target size={22} /><h3>No contracts can be generated.</h3><p>Remove a target block to return that creature to the board.</p></Card>}
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
