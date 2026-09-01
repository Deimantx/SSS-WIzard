import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Bug, Check, Maximize2, Minus, RotateCcw, X } from 'lucide-react'
import { GameTooltip, Status } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { clampDeveloperToolsToViewport, closeDeveloperTools, minimizeDeveloperTools, resetDeveloperToolsWindow, restoreDeveloperTools, setDeveloperToolsGeometry, setDeveloperToolsSearch, setDeveloperToolsTab, useDeveloperToolsStore, type DeveloperToolsTab } from './developerToolsStore'
import { DeveloperTab } from './DeveloperToolTabs'
import { getActiveDebugOverrides } from './debugOverridePresentation'

const tabs: { id: DeveloperToolsTab; label: string }[] = [{ id: 'character', label: 'Character' }, { id: 'channeling', label: 'Channeling' }, { id: 'focus', label: 'Focus' }, { id: 'research', label: 'Research' }, { id: 'transmutation', label: 'Transmutation' }, { id: 'inventory', label: 'Inventory' }, { id: 'combat', label: 'Combat Lab' }, { id: 'schools', label: 'Magic Schools' }, { id: 'progression', label: 'Guild / Progression' }, { id: 'save', label: 'Save / Profile' }, { id: 'diagnostics', label: 'Diagnostics' }]

type Interaction = { pointerId: number; startX: number; startY: number; geometry: { x: number; y: number; width: number; height: number } }

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
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, geometry: session }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current
    if (!active || active.pointerId !== event.pointerId) return
    setDeveloperToolsGeometry({ x: active.geometry.x + event.clientX - active.startX, y: active.geometry.y + event.clientY - active.startY }, false)
  }
  const endInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if (interaction.current?.pointerId === event.pointerId) {
      interaction.current = null
      setDeveloperToolsGeometry({}, true)
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }
  const beginResize = (event: ReactPointerEvent<HTMLElement>, edge: 'right' | 'bottom' | 'corner') => {
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, geometry: session }
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

  return <div className="developer-tools-layer" aria-label="Developer Tools workspace">
    <section className={`developer-tools-window${session.minimized ? ' minimized' : ''}`} style={{ left: session.x, top: session.y, width: session.minimized ? Math.min(session.width, 360) : session.width, height: session.minimized ? undefined : session.height }} role="dialog" aria-label="Developer Tools">
      <header className="developer-tools-header" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
        <div className="developer-tools-title"><div className="eyebrow"><Bug size={13} /> DEVELOPER WORKSPACE</div><h2>Developer Tools</h2></div>
        <div className="developer-tools-header-actions">
          {activeOverrides.length > 0 && <Status tone="warning">{activeOverrides.length} ACTIVE OVERRIDE{activeOverrides.length === 1 ? '' : 'S'}</Status>}
          {copied && <Status tone={copied === 'Clipboard unavailable' ? 'warning' : 'success'}>{copied === 'Clipboard unavailable' ? copied : <><Check size={13} /> {copied} copied</>}</Status>}
          <GameTooltip content="Reset window position and size"><button className="icon-button" onClick={resetDeveloperToolsWindow} aria-label="Reset Developer Tools window position and size"><RotateCcw size={15} /></button></GameTooltip>
          <GameTooltip content="Clear every runtime debug override"><button className="icon-button" onClick={resetDebug} disabled={activeOverrides.length === 0} aria-label="Clear all debug overrides"><span className="developer-clear-label">CLEAR ALL</span></button></GameTooltip>
          <GameTooltip content={session.minimized ? 'Restore Developer Tools' : 'Minimize Developer Tools'}><button className="icon-button" onClick={session.minimized ? restoreDeveloperTools : minimizeDeveloperTools} aria-label={session.minimized ? 'Restore Developer Tools' : 'Minimize Developer Tools'}>{session.minimized ? <Maximize2 size={16} /> : <Minus size={16} />}</button></GameTooltip>
          <GameTooltip content="Close Developer Tools"><button className="icon-button" onClick={closeDeveloperTools} aria-label="Close Developer Tools"><X size={18} /></button></GameTooltip>
        </div>
      </header>
      {!session.minimized && <>
        {activeOverrides.length > 0 && <div className="developer-active-overrides" role="status"><strong>ACTIVE OVERRIDES</strong><span>{activeOverrides.map((override) => override.label).join(' · ')}</span></div>}
        <div className="developer-tools-body">
          <nav className="developer-tools-tabs" aria-label="Developer tool sections">{tabs.map((tab) => <button key={tab.id} className={session.activeTab === tab.id ? 'active' : ''} aria-selected={session.activeTab === tab.id} onClick={() => setDeveloperToolsTab(tab.id)}>{tab.label}</button>)}<button className="developer-tools-legacy-tab" aria-label="Player" onClick={() => setDeveloperToolsTab('character')}>Player</button></nav>
          <main className="developer-tools-content"><div className="developer-tools-toolbar"><label>Search tools<input value={session.search} onChange={(event) => setDeveloperToolsSearch(event.target.value)} placeholder="Filter item or school names" /></label></div><DeveloperTab tab={session.activeTab} copy={copy} /></main>
        </div>
        <div className="developer-tools-resize-handle right" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'right')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
        <div className="developer-tools-resize-handle bottom" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'bottom')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
        <div className="developer-tools-resize-handle corner" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'corner')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
      </>}
    </section>
  </div>
}
