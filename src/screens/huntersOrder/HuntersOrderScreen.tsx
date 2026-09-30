import type { HuntersOrderScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import { Button, GameTooltip } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { isHuntersOrderUnlocked } from '../../game/systems/huntersOrder/huntersOrderRuntime'
import { useGameStore } from '../../store/gameStore'
import { HunterBestiaryTab } from './HunterBestiaryTab'
import { HunterHeader } from './HunterHeader'
import { HunterOverviewActiveHuntPanel, HunterOverviewGroundsPanel, HunterOverviewServicesPanel, HunterOverviewStandingPanel } from './HunterOverviewTab'
import { HunterContractsTab } from './HunterContractsTab'
import { HunterRankTab } from './HunterRankTab'
import { HunterUpgradesTab } from './HunterUpgradesTab'
import { useUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { Compass, BookOpen, Medal, ScrollText, Wrench } from 'lucide-react'
import { getHunterHeaderPresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import { useProfileAttention } from '../../ui/attention/attentionStore'
import { getActiveProfileId } from '../../profiles/profileSessionStore'
const tabs: readonly { id: HuntersOrderScreenTab; label: string; hint: string }[] = [
  { id: 'overview', label: 'Overview', hint: 'Review your current hunt and Order services.' },
  { id: 'contracts', label: 'Contracts', hint: 'Choose and track a monster-hunting assignment.' },
  { id: 'rank', label: 'Order Rank', hint: 'Review Hunter Reputation and standing.' },
  { id: 'upgrades', label: 'Upgrades', hint: 'Order services and future progression.' },
  { id: 'bestiary', label: 'Bestiary', hint: 'Review encountered monsters and hunting records.' },
]

export function HuntersOrderScreen() {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const tab = preferences.screenState.huntersOrder.activeTab
  const setTab = (activeTab: HuntersOrderScreenTab) => setUiPreferences({ screenState: { huntersOrder: { activeTab } } })
  const unlocked = isHuntersOrderUnlocked(state)
  const visibleTab = unlocked ? tab : 'bestiary'
  const header = getHunterHeaderPresentation(state)
  const attention = useProfileAttention(getActiveProfileId())
  const tabIcons = { overview: Compass, contracts: ScrollText, rank: Medal, upgrades: Wrench, bestiary: BookOpen }
  const tabBadge = (id: HuntersOrderScreenTab) => id === 'contracts' ? state.progress.huntersOrder.activeContract ? '1' : state.progress.huntersOrder.availableContracts.length || null : id === 'upgrades' ? header.availableUpgradeCount || null : id === 'bestiary' ? attention.unseenMonsters.length ? 'NEW' : null : null
  const panels = visibleTab === 'overview' ? [
    { id: 'hunter-overview-active', content: <HunterOverviewActiveHuntPanel state={state} onNavigate={setTab} /> },
    { id: 'hunter-overview-services', content: <HunterOverviewServicesPanel state={state} onNavigate={setTab} /> },
    { id: 'hunter-overview-standing', content: <HunterOverviewStandingPanel state={state} onNavigate={setTab} /> },
    { id: 'hunter-overview-grounds', content: <HunterOverviewGroundsPanel state={state} /> },
  ]
    : visibleTab === 'contracts' ? [{ id: 'hunter-contracts', content: <HunterContractsTab state={state} /> }]
    : visibleTab === 'rank' ? [{ id: 'hunter-rank', content: <HunterRankTab state={state} /> }]
    : visibleTab === 'upgrades' ? [{ id: 'hunter-upgrades', content: <HunterUpgradesTab state={state} /> }]
    : [{ id: 'hunter-bestiary', content: <HunterBestiaryTab /> }]
  return <div className="screen-content hunters-order-screen">
    {!unlocked ? <header className="screen-header hunters-order-locked-header"><div><div className="eyebrow">FIELD ARCHIVE · BESTIARY</div><h1>Know what waits beyond the tower.</h1><p>{`The Bestiary remains open. Defeat Corrupted Greatbear to unlock Hunter’s Order (${Math.min(1, state.progress.bossKillsByBoss['corrupted-greatbear'] ?? 0)} / 1).`}</p></div></header> : <HunterHeader state={state} onNavigate={setTab} />}
    <div className="hunter-tab-rail" role="tablist" aria-label="Hunter’s Order sections">{tabs.map((entry) => { const disabled = !unlocked && entry.id !== 'bestiary'; const Icon = tabIcons[entry.id]; const badge = tabBadge(entry.id); return <GameTooltip key={entry.id} content={disabled ? 'Defeat Corrupted Greatbear to unlock the Hunter’s Order.' : entry.hint} block><Button role="tab" ariaLabel={entry.label} aria-selected={visibleTab === entry.id} aria-disabled={disabled} disabled={disabled} variant="ghost" className={`hunter-tab-button${visibleTab === entry.id ? ' is-active' : ''}`} onClick={() => setTab(entry.id)}><Icon size={15} /><span>{entry.label}</span>{badge && <span className={`hunter-tab-badge${badge === 'NEW' ? ' is-new' : ''}`}>{badge}</span>}</Button></GameTooltip> })}</div>
    <ScreenGrid screen="hunters-order" panels={panels} />
  </div>
}
