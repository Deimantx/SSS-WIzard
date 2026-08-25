import { ChevronRight, Clock3, Edit3, Heart, Menu, Settings, Sparkles, Target, Wrench } from 'lucide-react'
import type { ScreenId } from '../../game/types'
import { deriveFocusReservations } from '../../game/engine'
import { getManaFlowBreakdown } from '../../game/systems/channeling/manaFlow'
import { formatNumber, formatOfflineBank, formatSignedRate } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import { getNavigationContext } from '../navigation'

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
  const flowDetail = flow.etaKind === 'full' ? (flow.etaMs === null ? 'FULL' : `FULL IN ${formatDuration(flow.etaMs)}`) : flow.etaKind === 'empty' ? `EMPTY IN ${formatDuration(flow.etaMs ?? 0)}` : flow.etaKind === 'starved' ? 'STARVED' : ''

  return <header className="topbar topbar-v3">
    <button className="mobile-menu" onClick={onMobileMenu} aria-label="Go to overview"><Menu size={19} /></button>
    <div className="crumb"><span>{navigation.group.breadcrumb}</span>{navigation.group.id !== 'overview' && <ChevronRight size={14} />}<strong>{navigation.item.label}</strong></div>
    <div className="topbar-resources">
      <div className={`topbar-resource hp-resource ${hpPercent < 35 ? 'low-resource' : ''}`} title={`Health ${formatNumber(player.health)} / ${formatNumber(player.maxHealth)}`}><Heart size={15} /><div><small>HP</small><strong>{formatNumber(player.health)} / {formatNumber(player.maxHealth)}</strong><Meter value={hpPercent} tone="hp" /></div></div>
      <div className={`mana-hero flow-${flow.state}`} title={`Mana ${formatNumber(player.mana)} / ${formatNumber(player.maxMana)}`}>
        <div className="mana-hero-head"><span><Sparkles size={13} /> MANA</span><strong>{formatNumber(player.mana)} / {formatNumber(player.maxMana)}</strong></div>
        <Meter value={manaPercent} tone="mana" />
        {player.mana > player.maxMana && <span className="mana-cap-state">OVER CAP</span>}
        <details className="mana-flow-details"><summary><span>{flowLabel} {formatSignedRate(flow.net)}</span>{flowDetail && <small>· {flowDetail}</small>}</summary><div className="mana-flow-popover"><strong>Mana Flow</strong><div className="flow-row"><span>Production</span><b>{formatSignedRate(flow.production)}</b></div><div className="flow-row flow-demand-heading"><span>Consumption</span><b>{formatSignedRate(-flow.demand)}</b></div>{flow.demandSources.length ? flow.demandSources.map((source) => <div className="flow-row flow-source" key={source.id}><span>{source.label}{source.estimated ? ' · estimated' : ''}</span><b>{formatSignedRate(-source.manaPerSecond)}</b></div>) : <div className="flow-empty">No active Mana consumers.</div>}<div className="flow-row flow-net"><span>Net</span><b>{formatSignedRate(flow.net)}</b></div></div></details>
      </div>
      <div className={`topbar-resource focus-resource ${freeFocus < 10 ? 'tight-resource' : ''}`} title="Focus Allocation"><div className="focus-head"><span><Target size={14} /> FOCUS</span><strong>{formatNumber(freeFocus)} FREE</strong></div><small>{formatNumber(usedFocus)} RESERVED / {formatNumber(player.maxFocus)} MAX</small><Meter value={focusPercent} tone="focus" /><div className="focus-allocation-details">{reservations.length ? reservations.map((reservation) => <span key={reservation.id}>{reservation.label} · {formatNumber(reservation.amount)}</span>) : <span>No active reservations</span>}</div></div>
    </div>
    <div className="topbar-actions"><button className={`topbar-tool-button offline-bank-trigger ${offlineBankOpen ? 'active' : ''}`} onClick={onOfflineBankToggle} title={`Offline Bank · ${formatOfflineBank(offlineBankMs)} banked`} aria-label="Offline Bank"><Clock3 size={15} /><span>{formatOfflineBank(offlineBankMs)}</span></button><button className="topbar-tool-button" onClick={onDeveloperTools} title="Open Developer Tools"><Wrench size={15} /><span>Dev Tools</span></button><button className="topbar-tool-button topbar-editor-button" onClick={onEditUi} title={editor.isEditing ? 'Exit UI editor' : 'Edit UI layout'}><Edit3 size={15} /><span>{editor.isEditing ? 'Exit UI' : 'Edit UI'}</span></button><button className="icon-button" onClick={onSettings} title="Settings" aria-label="Settings"><Settings size={17} /></button></div>
  </header>
}

function Meter({ value, tone }: { value: number; tone: 'hp' | 'mana' | 'focus' }) {
  return <div className={`shell-meter ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

function formatDuration(ms: number | null) {
  if (ms === null) return ''
  const seconds = Math.max(0, ms) / 1000
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)}s`
  return `${Math.floor(seconds / 60)}m`
}
