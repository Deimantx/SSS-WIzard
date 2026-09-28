import { useState } from 'react'
import type { HunterContractState, MonsterId } from '../../game/types'
import { BookOpen, Map, RefreshCw, Shield, SkipForward, Target, Trophy } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { HUNTER_EXCLUSIVE_MONSTER_IDS } from '../../game/content/monsters/huntersOrder'
import { HUNTER_UPGRADES } from '../../game/content/huntersOrder/hunterUpgrades'
import { MONSTERS } from '../../game/content/monsters'
import { DUNGEONS } from '../../game/content/dungeons/dungeons'
import { getHunterContractTargetLabel, getHunterRankProgress, getHunterBlockSlotCount, isHuntersOrderUnlocked } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import { BALANCE } from '../../game/core/balance/balance'
import { useGameStore } from '../../store/gameStore'
import { BestiaryScreen } from '../bestiary/BestiaryScreen'

type HuntersTab = 'contracts' | 'rank' | 'upgrades' | 'bestiary' | 'grounds'
const tabs: readonly { id: HuntersTab; label: string; hint: string }[] = [
  { id: 'contracts', label: 'Contracts', hint: 'Choose and track a monster-hunting assignment.' },
  { id: 'rank', label: 'Order Rank', hint: 'Review Hunter Reputation and standing.' },
  { id: 'upgrades', label: 'Upgrades', hint: 'Order services and future progression.' },
  { id: 'bestiary', label: 'Bestiary', hint: 'Review encountered monsters and hunting records.' },
  { id: 'grounds', label: 'Hunting Grounds', hint: 'Find contract-eligible hunting locations.' },
]

export function HuntersOrderScreen() {
  const state = useGameStore()
  const order = state.progress.huntersOrder
  const [tab, setTab] = useState<HuntersTab>('contracts')
  if (!isHuntersOrderUnlocked(state)) return <div className="screen-content hunters-order-screen"><header className="screen-header"><div><div className="eyebrow">HUNTER’S ORDER · SEALED</div><h1>The trail is not yet open.</h1><p>Defeat the Howling Den boss to receive an invitation to the Order.</p></div></header></div>
  const rankProgress = getHunterRankProgress(order.reputation)
  const rank = rankProgress.currentRank
  const nextRank = rankProgress.nextRank
  const panels = tab === 'contracts' ? [{ id: 'hunter-contracts', content: <ContractsPanel state={state} /> }]
    : tab === 'rank' ? [{ id: 'hunter-rank', content: <Card className="hunter-rank-card"><div className="hunter-card-kicker"><Shield size={14} /> ORDER STANDING</div><h2>{rank.name}</h2><p>{order.reputation.toLocaleString()} Reputation{nextRank ? ` · ${Math.max(0, nextRank.reputation - order.reputation).toLocaleString()} to next rank` : ' · Highest rank'}</p><div className="hunter-progress-track"><span style={{ width: `${rankProgress.progress * 100}%` }} /></div><div className="hunter-stat-row"><span>Contracts completed</span><strong>{order.totalContractsCompleted.toLocaleString()}</strong><span>Hunter Marks</span><strong>{order.hunterMarks.toLocaleString()}</strong></div></Card> }]
    : tab === 'upgrades' ? [{ id: 'hunter-upgrades', content: <div className="hunter-upgrade-grid">{HUNTER_UPGRADES.map((upgrade) => { const ownedRank = order.purchasedUpgrades[upgrade.id] ?? 0; const cost = upgrade.markCosts[ownedRank]; const owned = ownedRank >= upgrade.maxRank; return <Card key={upgrade.id} className="hunter-upgrade-card"><div className="hunter-card-kicker"><Trophy size={14} /> HUNTER UPGRADE</div><h2>{upgrade.name}</h2><p>{upgrade.description}</p><GameTooltip content={`${upgrade.description} Costs ${(cost ?? 0)} Hunter Marks.`}><Button variant={owned ? 'success' : 'primary'} disabled={owned || order.hunterMarks < (cost ?? Infinity)} onClick={() => methodsPurchase(upgrade.id)}>{owned ? 'Purchased' : `Unlock · ${(cost ?? 0)} Marks`}</Button></GameTooltip></Card> })}</div> }]
    : tab === 'bestiary' ? [{ id: 'hunter-bestiary', content: <BestiaryScreen embedded /> }]
    : [{ id: 'hunter-grounds', content: <HuntingGrounds state={state} /> }]
  return <div className="screen-content hunters-order-screen">
    <header className="screen-header hunters-order-header"><div><div className="eyebrow">HUNTER’S ORDER · TRACK / STUDY / PURSUE</div><h1>The ground remembers every hunt.</h1><p>Contracts are the Order’s work. Only an active contract grants access to its marked hunting ground.</p></div><div className="hunter-header-insignia"><Target size={20} /><span>{rank.name}</span></div></header>
    <div className="hunter-tab-rail" role="tablist" aria-label="Hunter’s Order sections">{tabs.map((entry) => <GameTooltip key={entry.id} content={entry.hint} block><Button role="tab" aria-selected={tab === entry.id} variant={tab === entry.id ? 'primary' : 'ghost'} onClick={() => setTab(entry.id)}>{entry.label}</Button></GameTooltip>)}</div>
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
    {active && <Card className="hunter-active-contract"><div className="hunter-contract-emblem"><Target size={22} /></div><div className="hunter-contract-copy"><div className="hunter-card-kicker">{active.tier.toUpperCase()} · ACTIVE</div><h3>{getHunterContractTargetLabel(active)}</h3><p>{active.progress} / {active.target} tracked kills ? {active.reputationReward} Reputation ? {active.marksReward} Marks</p><div className="hunter-progress-track"><span style={{ width: `${Math.min(100, active.progress / active.target * 100)}%` }} /></div></div><GameTooltip content="Abandon this assignment and spend the configured Hunter Mark cost; progress is forfeited."><Button variant="ghost" disabled={order.hunterMarks < BALANCE.huntersOrder.skipMarkCost} onClick={() => methods.skipHunterContract()}><SkipForward size={15} /> Skip</Button></GameTooltip></Card>}
    <div className="hunter-offer-heading"><h3>Available contracts</h3><GameTooltip content="Spend the configured Hunter Mark cost to replace the current choices. Refreshing does not cancel your active contract."><Button variant="secondary" disabled={order.hunterMarks < BALANCE.huntersOrder.rerollMarkCost} onClick={() => methods.rerollHunterContracts()}><RefreshCw size={14} /> Refresh · 1 Mark</Button></GameTooltip></div>
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
  return <div className="hunter-ground-panel"><Card><div className="hunter-card-kicker"><Map size={14} /> HUNTER-ONLY LOCATION</div><h2>Gloamridge Hunting Ground</h2><p>A marked ridge beyond the Howling Den, built to bridge the Den’s threats toward the Abandoned Catacombs.</p><div className="hunter-ground-meta"><span>Recommended threat <strong>{DUNGEONS['hunters-ground'].threatRequired.toLocaleString()}</strong></span><span>Targets <strong>{DUNGEONS['hunters-ground'].monsterPool.length} contract targets</strong></span></div><GameTooltip content={active ? 'Open Combat and select Gloamridge Hunting Ground. The active contract currently grants access.' : 'Accept a Hunt Contract before engaging marked creatures in this ground.'}><Button variant="primary" disabled={!active} onClick={() => state.setScreen('combat')}>{active ? 'Open Combat' : 'Active contract required'}</Button></GameTooltip></Card><Card className="hunter-ground-roster">{HUNTER_EXCLUSIVE_MONSTER_IDS.map((id) => <div key={id}><span>{MONSTERS[id]?.name}</span><strong>{id === 'nightglass-alpha' ? 'Apex' : 'Contract target'}</strong></div>)}</Card></div>
}
