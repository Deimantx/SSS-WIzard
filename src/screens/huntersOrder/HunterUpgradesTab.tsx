import { useMemo, useState } from 'react'
import { Backpack, Crosshair, Eye, Map, ScrollText, ShieldCheck, Sparkles, Target, Trophy, Wrench } from 'lucide-react'
import { Button, Card, FilterBar, GameTooltip, Status, type FilterOption } from '../../components/ui'
import { HUNTER_UPGRADE_CATEGORIES, HUNTER_UPGRADES, type HunterUpgradeCategory } from '../../game/content/hunters-order/hunterUpgrades'
import { getHunterUpgradePresentation } from '../../game/presentation/huntersOrder/hunterPresentation'
import { useGameStore } from '../../store/gameStore'
import type { GameState } from '../../game/types'

type UpgradeStatusFilter = 'all' | 'available' | 'locked' | 'maxed'
const categoryOptions: FilterOption<string>[] = [{ value: 'all', label: 'ALL PROGRAMS' }, ...HUNTER_UPGRADE_CATEGORIES.map((value) => ({ value, label: value.toUpperCase() }))]
const statusOptions: FilterOption<UpgradeStatusFilter>[] = [{ value: 'all', label: 'ALL' }, { value: 'available', label: 'AVAILABLE' }, { value: 'locked', label: 'LOCKED' }, { value: 'maxed', label: 'MAXED' }]
const categoryLabels: Record<HunterUpgradeCategory, string> = { control: 'CONTROL', efficiency: 'EFFICIENCY', rewards: 'ORDER REWARDS', harvest: 'QUARRY HARVEST', intelligence: 'FIELD INTELLIGENCE' }
const icons = [ScrollText, ShieldCheck, Crosshair, Target, Sparkles, Eye, Wrench, Trophy, Backpack, Map]

export function HunterUpgradesTab({ state }: { state: GameState }) {
  const methods = useGameStore.getState()
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<UpgradeStatusFilter>('all')
  const [selectedId, setSelectedId] = useState<string>('trail-kit')
  const views = useMemo(() => HUNTER_UPGRADES.map((upgrade) => ({ upgrade, view: getHunterUpgradePresentation(state, upgrade.id, state.progress.huntersOrder.activeContract ?? undefined)! })), [state])
  const filtered = views.filter(({ upgrade, view }) => (category === 'all' || upgrade.category === category) && (status === 'all' || status === 'maxed' && view.maxed || status === 'available' && view.canPurchase || status === 'locked' && !view.canPurchase && !view.maxed))
  const selected = views.find(({ upgrade }) => upgrade.id === selectedId) ?? views[0]
  const SelectedIcon = icons[HUNTER_UPGRADES.findIndex((entry) => entry.id === selected.upgrade.id) % icons.length]
  const locked = selected.view.reason === 'rank-required' || selected.view.reason === 'ground-required'
  const groundLocked = selected.view.reason === 'ground-required'
  return <div className="hunter-upgrade-v3">
    <section className="hunter-upgrade-catalog">
      <header className="hunter-upgrade-catalog-heading"><div><span className="hunter-card-kicker">PERMANENT ORDER PROGRAMS</span><h2>Hunter Mark Catalog</h2></div><strong>{state.progress.huntersOrder.hunterMarks.toLocaleString()} <small>MARKS</small></strong></header>
      <FilterBar options={categoryOptions} value={category} onChange={setCategory} ariaLabel="Filter Hunter upgrades by category" />
      <FilterBar options={statusOptions} value={status} onChange={setStatus} ariaLabel="Filter Hunter upgrades by availability" />
      <div className="hunter-upgrade-grid hunter-upgrade-catalog-grid">{filtered.map(({ upgrade, view }) => { const Icon = icons[HUNTER_UPGRADES.findIndex((entry) => entry.id === upgrade.id) % icons.length]; const stateLabel = view.maxed ? 'MAXED' : view.canPurchase ? 'AVAILABLE' : 'LOCKED'; return <GameTooltip key={upgrade.id} content={<div className="hunter-upgrade-tooltip"><strong>{upgrade.name}</strong><span>{categoryLabels[upgrade.category]} / {stateLabel} / RANK {view.ownedRank}/{upgrade.maxRank}</span><span>{view.breakdown.perRank ?? view.breakdown.tileEffect}</span><span>CURRENT / {view.currentEffect}</span><span>NEXT / {view.nextEffect}</span><span>MAX / {view.maximumEffect}</span>{view.breakdown.notes.map((note) => <small key={note}>{note}</small>)}<small>{view.maxed ? '+MAX RANK' : `NEXT RANK COST / ${view.cost ?? 0} HUNTER MARKS`}</small></div>}><Button variant="ghost" className={`hunter-upgrade-tile ${view.maxed ? 'is-maxed' : view.canPurchase ? 'is-available' : 'is-locked'} ${selectedId === upgrade.id ? 'is-selected' : ''}`} aria-pressed={selectedId === upgrade.id} onClick={() => setSelectedId(upgrade.id)}><Icon size={17} /><span><strong>{upgrade.name}</strong><small>{view.breakdown.tileEffect}</small></span><i>{view.ownedRank}/{upgrade.maxRank}</i></Button></GameTooltip> })}</div>
      {filtered.length === 0 && <div className="hunter-quarry-empty"><Wrench size={22} /><strong>No programs match this filter.</strong><span>Choose another category or availability state.</span></div>}
    </section>
    <Card className="hunter-upgrade-inspector">
      <div className="hunter-overview-kicker"><Wrench size={15} /> PROGRAM INSPECTOR</div>
      <div className="hunter-upgrade-inspector-title"><span><SelectedIcon size={22} /></span><div><small>{categoryLabels[selected.upgrade.category]}</small><h2>{selected.upgrade.name}</h2></div><Status tone={selected.view.maxed ? 'success' : selected.view.canPurchase ? 'active' : 'warning'}>{selected.view.maxed ? 'MAXED' : selected.view.canPurchase ? 'AVAILABLE' : 'LOCKED'}</Status></div>
      <p>{selected.upgrade.description}</p>
      <div className="hunter-upgrade-rank-display"><div><span>PROGRAM RANK</span><strong>{selected.view.ownedRank} / {selected.upgrade.maxRank}</strong></div><div className="hunter-upgrade-pips">{Array.from({ length: selected.upgrade.maxRank }, (_, index) => <i key={index} className={index < selected.view.ownedRank ? 'is-filled' : ''} />)}</div></div>
      <section className="hunter-upgrade-inspector-section"><h3>PER RANK EFFECT</h3><p>{selected.view.breakdown.perRank ?? selected.view.breakdown.tileEffect}</p></section>
      <section className="hunter-upgrade-inspector-section"><h3>RANK UNLOCKS</h3><ol>{selected.view.breakdown.rankRows.map((row) => <li key={row.rank} className={row.active ? 'is-active' : ''}><span>RANK {row.rank}{row.active ? ' / ACTIVE' : ''}</span><strong>{row.label}</strong></li>)}</ol></section>
      <dl className="hunter-upgrade-effects"><div><dt>CURRENT EFFECT</dt><dd>{selected.view.currentEffect}</dd></div><div><dt>NEXT RANK</dt><dd>{selected.view.maxed ? 'Maximum rank reached' : selected.view.nextEffect}</dd></div><div><dt>MAX EFFECT</dt><dd>{selected.view.maximumEffect}</dd></div></dl>
      {selected.view.breakdown.notes.length > 0 && <section className="hunter-upgrade-inspector-section"><h3>RULES & EXAMPLES</h3><ul>{selected.view.breakdown.notes.map((note) => <li key={note}>{note}</li>)}</ul></section>}
      <section className="hunter-upgrade-inspector-section hunter-upgrade-requirement"><h3>COST</h3><p>{selected.view.maxed ? 'Maximum rank reached' : `${selected.view.cost ?? 0} Hunter Marks for rank ${selected.view.ownedRank + 1}`}</p><h3>REQUIRED STANDING</h3><p>{selected.view.requiredStanding?.name ?? 'No additional standing requirement'}</p><h3>STATUS</h3>{groundLocked ? <><Status tone="warning">REQUIRES MULTIPLE HUNTING GROUNDS</Status><p>Available when a second Hunting Ground is authored and enabled.</p></> : locked ? <><Status tone="warning">LOCKED</Status><p>Current Standing: {selected.view.currentStanding?.name ?? 'Unranked'}.</p></> : <Status tone={selected.view.maxed ? 'success' : selected.view.canPurchase ? 'active' : 'warning'}>{selected.view.maxed ? 'MAXED' : selected.view.canPurchase ? 'AVAILABLE' : selected.view.reason === 'marks-required' ? `NEED ${selected.view.cost} MARKS` : 'LOCKED'}</Status>}</section>
      <div className="hunter-upgrade-inspector-actions"><span>{selected.view.maxed ? 'Program complete' : `NEXT RANK COST / ${selected.view.cost ?? 0} Hunter Marks`}</span><GameTooltip content={selected.view.maxed ? selected.view.maximumEffect : groundLocked ? 'This program becomes available when at least two authored Hunting Grounds are enabled.' : locked ? `Reach ${selected.view.requiredStanding?.name ?? 'the required standing'} to access this program.` : `Purchase rank ${selected.view.ownedRank + 1}. ${selected.view.nextEffect}.`}><Button variant="primary" disabled={!selected.view.canPurchase} onClick={() => methods.purchaseHunterUpgrade(selected.upgrade.id)}>{selected.view.maxed ? 'MAX RANK' : selected.view.reason === 'marks-required' ? `NEED ${selected.view.cost} MARKS` : locked ? 'LOCKED' : 'UPGRADE'}</Button></GameTooltip></div>
    </Card>
  </div>
}
