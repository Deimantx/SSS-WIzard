import { useGameStore } from '../../store/gameStore'
import { Button, Card, GameTooltip } from '../../components/ui'
import { BookOpen, Map, ScrollText, Shield, Trophy } from 'lucide-react'
import { COMBAT_LOCATIONS } from '../../game/content/combat-locations/worldNavigation'
import { HUNTER_GROUNDS } from '../../game/content/hunters-order/hunterGrounds'
import { HUNTER_STANDINGS } from '../../game/content/hunters-order/hunterRanks'
import { MONSTERS } from '../../game/content/monsters'
import { getHunterHeaderPresentation, getHunterContractPresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import { getHunterBlockSlotCount, getHunterContractBoardSlotCount, getHunterRerollMarkCost, getHunterSkipMarkCost } from '../../game/systems/hunters-order/huntersOrderRuntime'
import type { CombatLocationId, GameState, MonsterId } from '../../game/types'
import { openHunterContractInCombat } from '../../ui/navigation/hunterContractNavigation'
import type { HuntersOrderScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import { openHunterBestiaryEntry } from '../../ui/navigation/hunterOrderNavigation'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { HunterContractArt } from './HunterContractArt'

export function HunterOverviewActiveHuntPanel({ state, onNavigate }: { state: GameState; onNavigate: (tab: HuntersOrderScreenTab) => void }) {
  const order = state.progress.huntersOrder
  const active = order.activeContract
  const header = getHunterHeaderPresentation(state)
  const activeView = active ? getHunterContractPresentation(state, active) : null
  const activeTarget = active?.targetSpec.type === 'monster' || active?.targetSpec.type === 'boss' ? active.targetSpec.monsterId : activeView?.eligibleMonsterIds[0]
  const setScreen = useGameStore.getState().setScreen
  return <Card className="hunter-overview-active">
    <div className="hunter-overview-kicker"><ScrollText size={15} /> ACTIVE HUNT</div>
    {active && activeView ? <>
      <div className="hunter-overview-target"><HunterContractArt contract={active} state={state} /><div><span>{active.tier.toUpperCase()} · {activeView.groundName.toUpperCase()}</span><h2>{activeView.objective}</h2></div></div>
      <div className="hunter-overview-progress-label"><strong>{active.progress.toLocaleString()} / {active.target.toLocaleString()}</strong><span>{activeView.remaining.toLocaleString()} remaining</span></div>
      <div className="hunter-progress-track"><span style={{ width: `${activeView.progressPercent}%` }} /></div>
      <div className="hunter-overview-rewards"><span>+{active.reputationReward.toLocaleString()} REP</span><strong>+{active.marksReward} MARKS</strong></div>
      <div className="hunter-overview-actions"><GameTooltip content={`Open Combat at ${activeView.groundName} with an eligible quarry selected.`}><Button variant="primary" onClick={() => openHunterContractInCombat(state, setScreen)}><Map size={15} /> OPEN {activeView.groundName.toUpperCase()}</Button></GameTooltip>{activeTarget && <Button variant="ghost" onClick={() => openHunterBestiaryEntry(activeTarget)}><BookOpen size={14} /> VIEW DOSSIER</Button>}</div>
    </> : <><h2>Dispatch is ready.</h2><p>{header.currentStanding.name} · {order.availableContracts.length} board offers</p><Button variant="primary" onClick={() => onNavigate('contracts')}>OPEN CONTRACT BOARD</Button></>}
  </Card>
}

export function HunterOverviewServicesPanel({ state, onNavigate }: { state: GameState; onNavigate: (tab: HuntersOrderScreenTab) => void }) {
  const order = state.progress.huntersOrder
  const header = getHunterHeaderPresentation(state)
  return <Card className="hunter-overview-services">
    <div className="hunter-overview-kicker"><Trophy size={15} /> ORDER SERVICES</div>
    <dl><div><dt>Board choices</dt><dd>{getHunterContractBoardSlotCount(state)} / 3</dd></div><div><dt>Target Blocks</dt><dd>{order.blockedTargets.length} / {getHunterBlockSlotCount(state)}</dd></div><div><dt>Refresh cost</dt><dd>{getHunterRerollMarkCost(state)} Marks</dd></div><div><dt>Skip cost</dt><dd>{getHunterSkipMarkCost(state)} Marks</dd></div><div><dt>Upgrades ready</dt><dd>{header.availableUpgradeCount}</dd></div></dl>
    <Button variant="ghost" onClick={() => onNavigate('upgrades')}>OPEN UPGRADE CATALOG</Button>
  </Card>
}

export function HunterOverviewStandingPanel({ state, onNavigate }: { state: GameState; onNavigate: (tab: HuntersOrderScreenTab) => void }) {
  const header = getHunterHeaderPresentation(state)
  return <Card className="hunter-overview-rank">
    <div className="hunter-overview-kicker"><Shield size={15} /> STANDING</div>
    <div className="hunter-overview-rank-line"><strong>{header.currentStanding.name}</strong><span>{header.nextStanding ? `Next · ${header.nextStanding.name}` : 'Order cap reached'}</span></div>
    <div className="hunter-overview-progress-label"><b>{header.reputation.toLocaleString()} / {header.nextStanding?.reputation.toLocaleString() ?? header.reputation.toLocaleString()} Reputation</b><span>{header.remaining.toLocaleString()} remaining</span></div>
    <div className="hunter-progress-track"><span style={{ width: `${header.progressPercent}%` }} /></div>
    <ul>{(header.nextStanding ?? header.currentStanding).unlocks.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
    <Button variant="ghost" onClick={() => onNavigate('rank')}>VIEW STANDING REGISTER</Button>
  </Card>
}

export function HunterOverviewGroundsPanel({ state }: { state: GameState }) {
  const header = getHunterHeaderPresentation(state)
  const active = state.progress.huntersOrder.activeContract
  const activeView = active ? getHunterContractPresentation(state, active) : null
  const setScreen = useGameStore.getState().setScreen
  const openGround = (groundId: CombatLocationId, targetId?: MonsterId | null) => {
    setNavigationIntent({ combatLocationId: groundId, combatMonsterId: targetId ?? null })
    setScreen('combat')
  }
  const enabledGrounds = HUNTER_GROUNDS.filter((ground) => ground.enabled)
  return <section className="hunter-overview-grounds" aria-label="Hunting Grounds">
    <header><div className="hunter-overview-kicker"><Map size={15} /> HUNTING GROUNDS</div><span>{enabledGrounds.length} ACTIVE</span></header>
    <div className="hunter-ground-card-grid">{enabledGrounds.map((ground) => {
      const dungeon = COMBAT_LOCATIONS[ground.id]
      const required = HUNTER_STANDINGS.find((standing) => standing.id === ground.minimumStandingId)!
      const locked = header.reputation < required.reputation
      const quarry = [...dungeon.monsterPool, ...(dungeon.boss ? [dungeon.boss] : [])].filter((id) => MONSTERS[id]?.hunter?.exclusive)
      const groundActive = active?.huntingGroundId === ground.id
      const rememberedTarget = groundActive ? activeView?.eligibleMonsterIds[0] : null
      return <Card key={ground.id} className={`hunter-ground-card ${locked ? 'is-locked' : ''}`}><div><h3>{ground.name}</h3><span>HUNTING GROUND</span></div><p>{locked ? `Requires ${required.name}` : `${quarry.length} quarry · AVAILABLE`}</p>{groundActive && <strong className="hunter-ground-active">Active Contract · {activeView?.objective}</strong>}<GameTooltip content={locked ? `Reach ${required.name} to hunt in this location.` : `Open ${ground.name} Combat and choose an authorized quarry.`}><Button variant={locked ? 'secondary' : 'primary'} disabled={locked} onClick={() => openGround(ground.id, rememberedTarget)}>{locked ? `LOCKED · ${required.name.toUpperCase()}` : `OPEN ${ground.name.toUpperCase()}`}</Button></GameTooltip></Card>
    })}</div>
  </section>
}
