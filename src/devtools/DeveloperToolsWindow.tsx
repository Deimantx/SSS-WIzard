import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Bug, Check, Maximize2, Minus, RotateCcw, X } from 'lucide-react'
import { GameTooltip, Status } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { clampDeveloperToolsToViewport, closeDeveloperTools, minimizeDeveloperTools, resetDeveloperToolsWindow, restoreDeveloperTools, setDeveloperToolsGeometry, setDeveloperToolsMinimizedPosition, setDeveloperToolsTab, useDeveloperToolsStore, type DeveloperToolsTab } from './developerToolsStore'
import { getDeveloperToolsMinimizedWidth } from './developerToolsWindowGeometry'
import { DeveloperTab } from './DeveloperToolTabs'
import { getActiveDebugOverrides } from './debugOverridePresentation'

const tabGroups: readonly { label: string; tabs: readonly { id: DeveloperToolsTab; label: string }[] }[] = [
  { label: 'PLAYER', tabs: [{ id: 'character', label: 'Character' }, { id: 'progression', label: 'Progression' }, { id: 'inventory', label: 'Inventory' }, { id: 'equipment', label: 'Equipment / Loadouts' }] },
  { label: 'MAGIC', tabs: [{ id: 'schools', label: 'Magic Schools' }, { id: 'spells', label: 'Spells' }, { id: 'research', label: 'Research' }, { id: 'channeling', label: 'Channeling' }, { id: 'focus', label: 'Focus' }, { id: 'transmutation', label: 'Transmutation' }] },
  { label: 'COMBAT', tabs: [{ id: 'combat', label: 'Combat Lab' }, { id: 'monsters', label: 'Monsters' }, { id: 'statuses', label: 'Statuses' }] },
  { label: 'SYSTEM', tabs: [{ id: 'save', label: 'Save / Profile' }, { id: 'diagnostics', label: 'Diagnostics' }] },
]

type Interaction = { pointerId: number; startX: number; startY: number; geometry: { x: number; y: number; width: number; height: number }; minimized: boolean }

export function DeveloperToolsWindow() {
  const session = useDeveloperToolsStore()
  const debug = useGameStore((state) => state.debug)
  const resetDebug = useGameStore((state) => state.resetDebugOverrides)
  const [copied, setCopied] = useState('')
  const interaction = useRef<Interaction | null>(null)

  useEffect(() => {
    const onResize = () => clampDeveloperToolsToViewport()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  // The shell stays mounted during screen navigation, so this does not close
  // the workspace during normal use. It prevents a stale open session from
  // leaking into a separately mounted shell (including test harnesses).
  useEffect(() => () => closeDeveloperTools(), [])

  if (!session.open) return null
  const activeOverrides = getActiveDebugOverrides(debug)
  const copy = async (label: string, value: unknown) => {
    try { await navigator.clipboard?.writeText(JSON.stringify(value, null, 2)); setCopied(label); window.setTimeout(() => setCopied(''), 1800) }
    catch { setCopied('Clipboard unavailable') }
  }

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button,input,select,textarea,a')) return
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, geometry: { x: session.minimized ? session.minimizedX : session.x, y: session.minimized ? session.minimizedY : session.y, width: session.width, height: session.height }, minimized: session.minimized }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current
    if (!active || active.pointerId !== event.pointerId) return
    const x = active.geometry.x + event.clientX - active.startX
    const y = active.geometry.y + event.clientY - active.startY
    if (active.minimized) setDeveloperToolsMinimizedPosition(x, y, false)
    else setDeveloperToolsGeometry({ x, y }, false)
  }
  const endInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if (interaction.current?.pointerId === event.pointerId) {
      interaction.current = null
      setDeveloperToolsGeometry({}, true)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }
  const beginResize = (event: ReactPointerEvent<HTMLElement>, edge: 'right' | 'bottom' | 'corner') => {
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, geometry: session, minimized: false }
    ;(event.currentTarget as HTMLElement).dataset.resizeEdge = edge
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }
  const moveResize = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current
    if (!active) return
    const edge = (event.currentTarget as HTMLElement).dataset.resizeEdge
    const dx = event.clientX - active.startX
    const dy = event.clientY - active.startY
    setDeveloperToolsGeometry({ width: edge === 'bottom' ? active.geometry.width : active.geometry.width + dx, height: edge === 'right' ? active.geometry.height : active.geometry.height + dy }, false)
  }

  const minimized = session.minimized
  const windowStyle = (minimized ? {
    left: session.minimizedX,
    top: session.minimizedY,
    width: getDeveloperToolsMinimizedWidth(),
    height: undefined,
    '--developer-tools-left': `${session.minimizedX}px`,
    '--developer-tools-top': `${session.minimizedY}px`,
    '--developer-tools-width': `${getDeveloperToolsMinimizedWidth()}px`,
  } : { left: session.x, top: session.y, width: session.width, height: session.height }) as CSSProperties
  return <div className="developer-tools-layer" aria-label="Developer Tools workspace">
    <section className={`developer-tools-window${minimized ? ' minimized' : ''}`} style={windowStyle} role="dialog" aria-label="Developer Tools">
      <header className="developer-tools-header" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
        <div className="developer-tools-title">{minimized ? <strong className="developer-tools-minimized-title"><Bug size={13} /> DEV TOOLS</strong> : <><div className="eyebrow"><Bug size={13} /> DEVELOPER WORKSPACE</div><h2>Developer Tools</h2></>}</div>
        <div className="developer-tools-header-status">
          {activeOverrides.length > 0 && <GameTooltip content={`${activeOverrides.length} active debug override${activeOverrides.length === 1 ? '' : 's'}`}><Status tone="warning">{minimized ? `${activeOverrides.length} OVERRIDE${activeOverrides.length === 1 ? '' : 'S'}` : `${activeOverrides.length} ACTIVE OVERRIDE${activeOverrides.length === 1 ? '' : 'S'}`}</Status></GameTooltip>}
          {copied && <Status tone={copied === 'Clipboard unavailable' ? 'warning' : 'success'}>{minimized ? 'COPIED' : copied === 'Clipboard unavailable' ? copied : <><Check size={13} /> {copied} copied</>}</Status>}
        </div>
        <div className="developer-tools-header-actions">
          <GameTooltip content="Reset window position and size"><button className="icon-button" onClick={resetDeveloperToolsWindow} aria-label="Reset Developer Tools window position and size"><RotateCcw size={15} /></button></GameTooltip>
          <GameTooltip content="Clear all debug overrides"><button className="icon-button" onClick={resetDebug} disabled={activeOverrides.length === 0} aria-label="Clear all debug overrides"><span className="developer-clear-label">{minimized ? 'CLEAR' : 'CLEAR ALL'}</span></button></GameTooltip>
          <GameTooltip content={minimized ? 'Restore Developer Tools' : 'Minimize Developer Tools'}><button className="icon-button" onClick={minimized ? restoreDeveloperTools : minimizeDeveloperTools} aria-label={minimized ? 'Restore Developer Tools' : 'Minimize Developer Tools'}>{minimized ? <Maximize2 size={16} /> : <Minus size={16} />}</button></GameTooltip>
          <GameTooltip content="Close Developer Tools"><button className="icon-button" onClick={closeDeveloperTools} aria-label="Close Developer Tools"><X size={18} /></button></GameTooltip>
        </div>
      </header>
      {!session.minimized && <>
        {activeOverrides.length > 0 && <div className="developer-active-overrides" role="status"><strong>ACTIVE OVERRIDES</strong><span>{activeOverrides.map((override) => override.label).join(' · ')}</span></div>}
        <div className="developer-tools-body">
          <nav className="developer-tools-tabs" aria-label="Developer tool sections">{tabGroups.map((group) => <div className="developer-tools-tab-group" key={group.label}><span className="developer-tools-tab-group-label">{group.label}</span>{group.tabs.map((tab) => <button key={tab.id} className={session.activeTab === tab.id ? 'active' : ''} aria-selected={session.activeTab === tab.id} onClick={() => setDeveloperToolsTab(tab.id)}>{tab.label}</button>)}</div>)}<button className="developer-tools-legacy-tab" aria-label="Player" onClick={() => setDeveloperToolsTab('character')}>Player</button></nav>
          <main className="developer-tools-content"><DeveloperTab tab={session.activeTab} copy={copy} /></main>
        </div>
        <div className="developer-tools-resize-handle right" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'right')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
        <div className="developer-tools-resize-handle bottom" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'bottom')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
        <div className="developer-tools-resize-handle corner" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'corner')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
      </>}
    </section>
  </div>
}
