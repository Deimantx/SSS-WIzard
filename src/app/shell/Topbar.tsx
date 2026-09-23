import { ChevronRight, Clock3, Heart, Menu, Settings, Sparkles, Target, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { deriveFocusReservations } from '../../game/engine'
import { getManaFlowBreakdown } from '../../game/systems/channeling/manaFlow'
import { formatNumber, formatOfflineBank, formatSignedRate } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { getNavigationContext } from '../navigation'
import { dismissGameTooltips, GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { GameValue } from '../../ui/game-feel/GameValue'
import { FpsCounter } from '../../ui/performance/FpsCounter'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'
import { useSampledGameReadModel } from './sampledGameReadModel'

interface TopbarProps {
  screen: ScreenId
  offlineBankOpen: boolean
  onOfflineBankToggle: () => void
  onDeveloperTools: () => void
  onSettings: () => void
  onMobileMenu: () => void
}

export const clampResourcePercent = (value: number, max: number) => max <= 0 ? 0 : Math.max(0, Math.min(100, value / max * 100))

export function Topbar({ screen, offlineBankOpen, onOfflineBankToggle, onDeveloperTools, onSettings, onMobileMenu }: TopbarProps) {
  const health = useGameStore((state) => state.player.health)
  const maxHealth = useGameStore((state) => state.player.maxHealth)
  const mana = useGameStore((state) => state.player.mana)
  const maxMana = useGameStore((state) => state.player.maxMana)
  const maxFocus = useGameStore((state) => state.player.maxFocus)
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const focusReadout = useSampledGameReadModel((state) => {
    const reservations = deriveFocusReservations(state)
    return { reservations, usedFocus: reservations.reduce((total, reservation) => total + reservation.amount, 0) }
  })
  const flow = useSampledGameReadModel((state) => getManaFlowBreakdown(state))
  const reservations = focusReadout.reservations
  const usedFocus = focusReadout.usedFocus
  const freeFocus = Math.max(0, maxFocus - usedFocus)
  const navigation = getNavigationContext(screen)
  const focusPercent = clampResourcePercent(usedFocus, maxFocus)
  const manaPercent = clampResourcePercent(mana, maxMana)
  const hpPercent = clampResourcePercent(health, maxHealth)
  const flowLabel = flow.state === 'surplus' ? 'SURPLUS' : flow.state === 'deficit' ? 'DEFICIT' : 'BALANCED'
  const isManaOverCap = mana > maxMana
  const flowDetail = isManaOverCap && flow.state === 'surplus' ? 'OVER CAP' : flow.etaKind === 'full' ? (flow.etaMs === null ? 'FULL' : `FULL IN ${formatDuration(flow.etaMs)}`) : flow.etaKind === 'empty' ? `EMPTY IN ${formatDuration(flow.etaMs ?? 0)}` : flow.etaKind === 'starved' ? 'STARVED' : ''

  type ResourceId = 'health' | 'mana' | 'focus'
  const resource = (id: ResourceId, children: ReactNode, tooltip: ReactNode, accent: 'neutral' | 'mana' | 'health' | 'focus' = 'neutral') => {
    return <div key={id} className={`topbar-resource-slot topbar-resource-slot-${id}`}>
      <GameTooltip block content={tooltip} accent={accent}>{children}</GameTooltip>
    </div>
  }

  const renderResource = (id: ResourceId) => {
    if (id === 'health') return resource(id, <div className={`topbar-resource hp-resource ${hpPercent < 35 ? 'low-resource' : ''}`}><Heart size={15} /><div><small>HP</small><strong><GameValue value={health} tone="health" formatted={`${formatNumber(health)} / ${formatNumber(maxHealth)}`} /></strong><Meter value={hpPercent} tone="hp" /></div></div>, <TooltipContent title="Health" description="Current vitality for the wizard."><TooltipRow label="Current" value={`${formatNumber(health)} / ${formatNumber(maxHealth)}`} /></TooltipContent>, 'health')
    if (id === 'mana') return resource(id, <div className={`mana-hero flow-${flow.state}`}>
      <div className="mana-hero-head"><span><Sparkles size={13} /> MANA</span><strong>{formatResourceAmount(mana)} / {formatResourceAmount(maxMana)}</strong></div>
      <Meter value={manaPercent} tone="mana" />
      {isManaOverCap && <span className="mana-cap-state">OVER CAP</span>}
      <details className="mana-flow-details"><summary onClick={() => dismissGameTooltips()}><span>{flowLabel} {formatSignedRate(flow.net)}</span>{flowDetail && <small> · {flowDetail}</small>}</summary><div className="mana-flow-popover"><strong>Mana Flow</strong><div className="flow-row"><span>Production</span><b>{formatSignedRate(flow.production)}</b></div><div className="flow-row flow-demand-heading"><span>Consumption</span><b>{formatSignedRate(-flow.demand)}</b></div>{flow.demandSources.length ? flow.demandSources.map((source) => <div className="flow-row flow-source" key={source.id}><span>{source.label}{source.estimated ? ' · estimated' : ''}</span><b>{formatSignedRate(-source.manaPerSecond)}</b></div>) : <div className="flow-empty">No active Mana consumers.</div>}<div className="flow-row flow-net"><span>Net</span><b>{formatSignedRate(flow.net)}</b></div></div></details>
    </div>, <TooltipContent title="Mana" description="Current reserves, production, and active consumption."><TooltipRow label="Current" value={`${formatResourceAmount(mana)} / ${formatResourceAmount(maxMana)}`} /><TooltipRow label="Net flow" value={formatSignedRate(flow.net)} /></TooltipContent>, 'mana')
    return resource(id, <div className={`topbar-resource focus-resource ${freeFocus < 10 ? 'tight-resource' : ''}`} tabIndex={0} aria-label="Focus allocation"><div className="focus-head"><span><Target size={14} /> FOCUS</span><strong><GameValue value={freeFocus} tone="focus" formatted={`${formatNumber(freeFocus)} FREE`} /></strong></div><small>{formatNumber(usedFocus)} RESERVED / {formatNumber(maxFocus)} MAX</small><Meter value={focusPercent} tone="focus" /></div>, <TooltipContent title="Focus allocation" description="Reserved Focus is derived from active automated systems."><TooltipRow label="Free" value={formatNumber(freeFocus)} /><TooltipRow label="Reserved" value={formatNumber(usedFocus)} /><TooltipRow label="Maximum" value={formatNumber(maxFocus)} />{reservations.length > 0 && <div className="tooltip-section"><small>RESERVATIONS</small>{reservations.map((reservation) => <TooltipRow key={reservation.id} label={reservation.label} value={formatNumber(reservation.amount)} />)}</div>}</TooltipContent>, 'focus')
  }

  const utilities = <div className="topbar-utility-cluster" aria-label="Header utilities">
    <GameTooltip content={<TooltipContent title="Offline Bank" description={`${formatOfflineBank(offlineBankMs)} banked. Spend it to advance active systems.`} />}>
      <button className={`topbar-tool-button offline-bank-trigger ${offlineBankOpen ? 'active' : ''} ${offlineBankMs > 0 ? 'has-bank' : ''}`} onClick={onOfflineBankToggle} aria-label="Offline Bank"><Clock3 size={15} /><span className="offline-bank-label">OFFLINE</span><strong>{formatOfflineBank(offlineBankMs)}</strong></button>
    </GameTooltip>
    <FpsCounter />
    <GameTooltip content="Developer Tools">
      <button className="topbar-tool-button" onClick={onDeveloperTools} aria-label="Dev Tools"><Wrench size={15} /><span>Dev Tools</span></button>
    </GameTooltip>
    <GameTooltip content="Settings">
      <button className="icon-button topbar-settings-button" onClick={onSettings} aria-label="Settings"><Settings size={17} /></button>
    </GameTooltip>
  </div>

  return <header className="topbar topbar-v3">
    <button className="mobile-menu" onClick={onMobileMenu} aria-label="Go to overview"><Menu size={19} /></button>
    <div className="topbar-context"><GameTooltip block content={<TooltipContent title="Current location" description={`${navigation.group.breadcrumb} · ${navigation.item.label}`} />}><div className="crumb"><span>{navigation.group.breadcrumb}</span>{navigation.group.id !== 'overview' && <ChevronRight size={14} />}<strong>{navigation.item.label}</strong></div></GameTooltip></div>
    <div className="topbar-flex-spacer" aria-hidden="true" />
    <div className="topbar-right-hud"><div className="topbar-resource-cluster">{renderResource('health')}{renderResource('mana')}{renderResource('focus')}</div>{utilities}</div>
  </header>
}

function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
function Meter({ value, tone }: { value: number; tone: 'hp' | 'mana' | 'focus' }) { return <div className={`shell-meter ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div> }
function formatDuration(ms: number | null) { if (ms === null) return ''; const seconds = Math.max(0, ms) / 1000; return seconds < 60 ? `${seconds.toFixed(seconds < 10 ? 1 : 0)}s` : `${Math.floor(seconds / 60)}m` }
