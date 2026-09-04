import { ChevronRight, Clock3, Edit3, Heart, Menu, Settings, Sparkles, Target, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ScreenId } from '../../game/types'
import { deriveFocusReservations } from '../../game/engine'
import { getManaFlowBreakdown } from '../../game/systems/channeling/manaFlow'
import { formatNumber, formatOfflineBank, formatSignedRate } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { getNavigationContext } from '../navigation'
import { dismissGameTooltips, GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { getTopbarLayout, useLayoutEditorStore } from '../../ui/layout-editor/layoutEditorStore'
import { EditableTopbarRegion } from '../../ui/layout-editor/EditableTopbarRegion'
import { TOPBAR_RESOURCE_IDS } from '../../ui/layout-editor/shellLayout'
import type { TopbarRegionId } from '../../ui/layout-editor/layoutEditorTypes'
import { GameValue } from '../../ui/game-feel/GameValue'
import { FpsCounter } from '../../ui/performance/FpsCounter'

interface TopbarProps {
  screen: ScreenId
  editor: { isEditing: boolean }
  offlineBankOpen: boolean
  onOfflineBankToggle: () => void
  onDeveloperTools: () => void
  onEditUi: () => void
  onSettings: () => void
  onMobileMenu: () => void
}

export const clampResourcePercent = (value: number, max: number) => max <= 0 ? 0 : Math.max(0, Math.min(100, value / max * 100))

export function Topbar({ screen, editor, offlineBankOpen, onOfflineBankToggle, onDeveloperTools, onEditUi, onSettings, onMobileMenu }: TopbarProps) {
  const state = useGameStore()
  const layoutEditor = useLayoutEditorStore()
  const layout = getTopbarLayout()
  const player = state.player
  const reservations = deriveFocusReservations(state)
  const usedFocus = reservations.reduce((total, reservation) => total + reservation.amount, 0)
  const freeFocus = Math.max(0, player.maxFocus - usedFocus)
  const offlineBankMs = state.offlineBankMs
  const flow = getManaFlowBreakdown(state)
  const navigation = getNavigationContext(screen)
  const focusPercent = clampResourcePercent(usedFocus, player.maxFocus)
  const manaPercent = clampResourcePercent(player.mana, player.maxMana)
  const hpPercent = clampResourcePercent(player.health, player.maxHealth)
  const flowLabel = flow.state === 'surplus' ? 'SURPLUS' : flow.state === 'deficit' ? 'DEFICIT' : 'BALANCED'
  const isManaOverCap = player.mana > player.maxMana
  const flowDetail = isManaOverCap && flow.state === 'surplus' ? 'OVER CAP' : flow.etaKind === 'full' ? (flow.etaMs === null ? 'FULL' : `FULL IN ${formatDuration(flow.etaMs)}`) : flow.etaKind === 'empty' ? `EMPTY IN ${formatDuration(flow.etaMs ?? 0)}` : flow.etaKind === 'starved' ? 'STARVED' : ''
  const shellEditing = editor.isEditing && layoutEditor.layoutTarget === 'shell'
  const shellDragging = layoutEditor.shellInteraction !== 'idle'

  const resource = (id: TopbarRegionId, children: ReactNode, tooltip: ReactNode, accent: 'neutral' | 'mana' | 'health' | 'focus' = 'neutral') => {
    const content = <EditableTopbarRegion regionId={id} label={id === 'topbar-health' ? 'Health' : id === 'topbar-mana' ? 'Mana' : 'Focus'} editing={editor.isEditing} width={layout.widths[id]}>{children}</EditableTopbarRegion>
    return <div key={id} className={`topbar-resource-slot topbar-resource-slot-${id.replace('topbar-', '')}`} style={{ width: `${layout.widths[id]}px` }}>
      <GameTooltip block disabled={shellEditing} content={tooltip} accent={accent}>{content}</GameTooltip>
    </div>
  }

  const renderResource = (id: TopbarRegionId) => {
    if (id === 'topbar-health') return resource(id, <div className={`topbar-resource hp-resource ${hpPercent < 35 ? 'low-resource' : ''}`}><Heart size={15} /><div><small>HP</small><strong><GameValue value={player.health} tone="health" formatted={`${formatNumber(player.health)} / ${formatNumber(player.maxHealth)}`} /></strong><Meter value={hpPercent} tone="hp" /></div></div>, <TooltipContent title="Health" description="Current vitality for the wizard."><TooltipRow label="Current" value={`${formatNumber(player.health)} / ${formatNumber(player.maxHealth)}`} /></TooltipContent>, 'health')
    if (id === 'topbar-mana') return resource(id, <div className={`mana-hero flow-${flow.state}`}>
      <div className="mana-hero-head"><span><Sparkles size={13} /> MANA</span><strong>{formatNumber(player.mana)} / {formatNumber(player.maxMana)}</strong></div>
      <Meter value={manaPercent} tone="mana" />
      {isManaOverCap && <span className="mana-cap-state">OVER CAP</span>}
      <details className="mana-flow-details"><summary onClick={() => dismissGameTooltips()}><span>{flowLabel} {formatSignedRate(flow.net)}</span>{flowDetail && <small> · {flowDetail}</small>}</summary><div className="mana-flow-popover"><strong>Mana Flow</strong><div className="flow-row"><span>Production</span><b>{formatSignedRate(flow.production)}</b></div><div className="flow-row flow-demand-heading"><span>Consumption</span><b>{formatSignedRate(-flow.demand)}</b></div>{flow.demandSources.length ? flow.demandSources.map((source) => <div className="flow-row flow-source" key={source.id}><span>{source.label}{source.estimated ? ' · estimated' : ''}</span><b>{formatSignedRate(-source.manaPerSecond)}</b></div>) : <div className="flow-empty">No active Mana consumers.</div>}<div className="flow-row flow-net"><span>Net</span><b>{formatSignedRate(flow.net)}</b></div></div></details>
    </div>, <TooltipContent title="Mana" description="Current reserves, production, and active consumption."><TooltipRow label="Current" value={`${formatNumber(player.mana)} / ${formatNumber(player.maxMana)}`} /><TooltipRow label="Net flow" value={formatSignedRate(flow.net)} /></TooltipContent>, 'mana')
    return resource(id, <div className={`topbar-resource focus-resource ${freeFocus < 10 ? 'tight-resource' : ''}`} tabIndex={0} aria-label="Focus allocation"><div className="focus-head"><span><Target size={14} /> FOCUS</span><strong><GameValue value={freeFocus} tone="focus" formatted={`${formatNumber(freeFocus)} FREE`} /></strong></div><small>{formatNumber(usedFocus)} RESERVED / {formatNumber(player.maxFocus)} MAX</small><Meter value={focusPercent} tone="focus" /></div>, <TooltipContent title="Focus allocation" description="Reserved Focus is derived from active automated systems."><TooltipRow label="Free" value={formatNumber(freeFocus)} /><TooltipRow label="Reserved" value={formatNumber(usedFocus)} /><TooltipRow label="Maximum" value={formatNumber(player.maxFocus)} />{reservations.length > 0 && <div className="tooltip-section"><small>RESERVATIONS</small>{reservations.map((reservation) => <TooltipRow key={reservation.id} label={reservation.label} value={formatNumber(reservation.amount)} />)}</div>}</TooltipContent>, 'focus')
  }

  const utilities = <div className={`topbar-utility-cluster ${shellDragging ? 'is-interacting' : ''}`} aria-label="Header utilities">
    <GameTooltip disabled={shellEditing} content={<TooltipContent title="Offline Bank" description={`${formatOfflineBank(offlineBankMs)} banked. Spend it to advance active systems.`} />}>
      <button className={`topbar-tool-button offline-bank-trigger ${offlineBankOpen ? 'active' : ''} ${offlineBankMs > 0 ? 'has-bank' : ''}`} onClick={onOfflineBankToggle} disabled={shellDragging} aria-label="Offline Bank"><Clock3 size={15} /><span className="offline-bank-label">OFFLINE</span><strong>{formatOfflineBank(offlineBankMs)}</strong></button>
    </GameTooltip>
    <FpsCounter />
    <GameTooltip disabled={shellEditing} content="Developer Tools">
      <button className="topbar-tool-button" onClick={onDeveloperTools} disabled={shellDragging} aria-label="Dev Tools"><Wrench size={15} /><span>Dev Tools</span></button>
    </GameTooltip>
    <GameTooltip disabled={shellEditing} content={<TooltipContent title={editor.isEditing ? 'Exit UI Editor' : 'Edit UI'} description="Customize screen and header layouts." />}>
      <button className="topbar-tool-button topbar-editor-button" onClick={onEditUi} aria-label={editor.isEditing ? 'Exit UI' : 'Edit UI'}><Edit3 size={15} /><span>{editor.isEditing ? 'Exit UI' : 'Edit UI'}</span></button>
    </GameTooltip>
    <GameTooltip disabled={shellEditing} content="Settings">
      <button className="icon-button topbar-settings-button" onClick={onSettings} disabled={shellDragging} aria-label="Settings"><Settings size={17} /></button>
    </GameTooltip>
  </div>

  return <header className="topbar topbar-v3">
    <button className="mobile-menu" onClick={onMobileMenu} aria-label="Go to overview"><Menu size={19} /></button>
    <div className="topbar-context"><GameTooltip block content={<TooltipContent title="Current location" description={`${navigation.group.breadcrumb} · ${navigation.item.label}`} />}><div className="crumb"><span>{navigation.group.breadcrumb}</span>{navigation.group.id !== 'overview' && <ChevronRight size={14} />}<strong>{navigation.item.label}</strong></div></GameTooltip></div>
    <div className="topbar-flex-spacer" aria-hidden="true" />
    <div className="topbar-right-hud"><div className="topbar-resource-cluster">{layout.order.filter((id): id is TopbarRegionId => TOPBAR_RESOURCE_IDS.includes(id)).map(renderResource)}</div>{utilities}</div>
  </header>
}

function TooltipRow({ label, value }: { label: string; value: ReactNode }) { return <span className="tooltip-row"><span>{label}</span><b>{value}</b></span> }
function Meter({ value, tone }: { value: number; tone: 'hp' | 'mana' | 'focus' }) { return <div className={`shell-meter ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div> }
function formatDuration(ms: number | null) { if (ms === null) return ''; const seconds = Math.max(0, ms) / 1000; return seconds < 60 ? `${seconds.toFixed(seconds < 10 ? 1 : 0)}s` : `${Math.floor(seconds / 60)}m` }
