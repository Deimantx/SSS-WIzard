import { Clock3, Heart, Menu, Settings, Sparkles, Users, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { getManaFlowBreakdown } from '../../game/systems/channeling/manaFlow'
import { selectTotalAcolytes, selectUsedAcolytes } from '../../game/systems/acolytes'
import { formatNumber, formatOfflineBank, formatSignedRate } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
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

export function Topbar({ offlineBankOpen, onOfflineBankToggle, onDeveloperTools, onSettings, onMobileMenu }: TopbarProps) {
  const health = useGameStore((state) => state.player.health)
  const maxHealth = useGameStore((state) => state.player.maxHealth)
  const mana = useGameStore((state) => state.player.mana)
  const maxMana = useGameStore((state) => state.player.maxMana)
  const acolytes = useSampledGameReadModel((state) => ({ total: selectTotalAcolytes(state), used: selectUsedAcolytes(state) }))
  const offlineBankMs = useGameStore((state) => state.offlineBankMs)
  const flow = useSampledGameReadModel((state) => getManaFlowBreakdown(state))
  const freeAcolytes = Math.max(0, acolytes.total - acolytes.used)
  const acolytePercent = clampResourcePercent(acolytes.used, acolytes.total)
  const manaPercent = clampResourcePercent(mana, maxMana)
  const hpPercent = clampResourcePercent(health, maxHealth)
  const flowLabel = flow.state === 'surplus' ? 'SURPLUS' : flow.state === 'deficit' ? 'DEFICIT' : 'BALANCED'
  const isManaOverCap = mana > maxMana
  const flowDetail = isManaOverCap && flow.state === 'surplus' ? 'OVER CAP' : flow.etaKind === 'full' ? (flow.etaMs === null ? 'FULL' : `FULL IN ${formatDuration(flow.etaMs)}`) : flow.etaKind === 'empty' ? `EMPTY IN ${formatDuration(flow.etaMs ?? 0)}` : flow.etaKind === 'starved' ? 'STARVED' : ''

  type ResourceId = 'health' | 'mana' | 'acolytes'
  const resource = (id: ResourceId, children: ReactNode, tooltip: ReactNode, accent: 'neutral' | 'mana' | 'health' | 'acolyte' = 'neutral') => {
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
    if (id === 'acolytes') return resource(id, <div className={`topbar-resource acolyte-resource ${freeAcolytes === 0 ? 'tight-resource' : ''}`} tabIndex={0} aria-label="Acolyte staffing"><div className="acolyte-head"><span><Users size={14} /> ACOLYTES</span><strong>{formatNumber(freeAcolytes)} FREE</strong></div><small>{formatNumber(acolytes.used)} ASSIGNED / {formatNumber(acolytes.total)} TOTAL</small><Meter value={acolytePercent} tone="acolyte" /></div>, <TooltipContent title="Acolyte staffing" description="Acolytes are the shared workforce for Channeling, Research, and Transmutation."><TooltipRow label="Free" value={formatNumber(freeAcolytes)} /><TooltipRow label="Assigned" value={formatNumber(acolytes.used)} /><TooltipRow label="Total" value={formatNumber(acolytes.total)} /></TooltipContent>, 'acolyte')
    return null
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
    <div className="topbar-flex-spacer" aria-hidden="true" />
    <div className="topbar-right-hud"><div className="topbar-resource-cluster">{renderResource('health')}{renderResource('mana')}{renderResource('acolytes')}</div>{utilities}</div>
  </header>
}

function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
function Meter({ value, tone }: { value: number; tone: 'hp' | 'mana' | 'acolyte' }) { return <div className={`shell-meter ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div> }
function formatDuration(ms: number | null) { if (ms === null) return ''; const seconds = Math.max(0, ms) / 1000; return seconds < 60 ? `${seconds.toFixed(seconds < 10 ? 1 : 0)}s` : `${Math.floor(seconds / 60)}m` }
