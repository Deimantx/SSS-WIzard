import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Bug, Check, PanelRight, RotateCcw, X } from 'lucide-react'
import { GameTooltip, Status } from '../components/ui'
import { useGameStore } from '../store/gameStore'
import { clampDeveloperToolsToViewport, closeDeveloperTools, dockDeveloperTools, resetDeveloperToolsWindow, setDeveloperToolsDockedPosition, setDeveloperToolsGeometry, setDeveloperToolsTab, useDeveloperToolsStore, workspaceDeveloperTools, type DeveloperToolsTab } from './developerToolsStore'
import { DeveloperTab } from './DeveloperToolTabs'
import { getActiveDebugOverrides } from './debugOverridePresentation'

const tabGroups: readonly { label: string; tabs: readonly { id: DeveloperToolsTab; label: string }[] }[] = [
  { label: 'QUICK', tabs: [{ id: 'quick', label: 'Quick Setup' }] },
  { label: 'PLAYER', tabs: [{ id: 'character', label: 'Character' }, { id: 'inventory', label: 'Inventory & Equipment' }, { id: 'progression', label: 'Progression' }] },
  { label: 'MAGIC', tabs: [{ id: 'spells', label: 'Spells & Schools' }, { id: 'research', label: 'Research' }, { id: 'channeling', label: 'Channeling' }, { id: 'focus', label: 'Focus' }, { id: 'transmutation', label: 'Transmutation' }, { id: 'artificing', label: 'Artificing' }] },
  { label: 'COMBAT', tabs: [{ id: 'combat', label: 'Combat Lab' }, { id: 'monsters', label: 'Monsters' }, { id: 'statuses', label: 'Statuses' }] },
  { label: 'SYSTEM', tabs: [{ id: 'save', label: 'Save / Profile' }, { id: 'diagnostics', label: 'Advanced Diagnostics' }] },
]

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
  useEffect(() => () => closeDeveloperTools(), [])

  if (!session.open) return null
  const activeOverrides = getActiveDebugOverrides(debug)
  const copy = async (label: string, value: unknown) => {
    try { await navigator.clipboard?.writeText(JSON.stringify(value, null, 2)); setCopied(label); window.setTimeout(() => setCopied(''), 1800) }
    catch { setCopied('Clipboard unavailable') }
  }

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (session.mode !== 'docked' || (event.target as HTMLElement).closest('button,input,select,textarea,a')) return
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, geometry: { x: session.dockedX, y: session.dockedY, width: session.dockedWidth, height: session.dockedHeight } }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const active = interaction.current
    if (!active || active.pointerId !== event.pointerId) return
    setDeveloperToolsDockedPosition(active.geometry.x + event.clientX - active.startX, active.geometry.y + event.clientY - active.startY, false)
  }
  const endInteraction = (event: ReactPointerEvent<HTMLElement>) => {
    if (interaction.current?.pointerId !== event.pointerId) return
    interaction.current = null
    setDeveloperToolsGeometry({}, true)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const beginResize = (event: ReactPointerEvent<HTMLElement>, edge: 'right' | 'bottom' | 'corner') => {
    if (session.mode !== 'docked') return
    interaction.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, geometry: { x: session.dockedX, y: session.dockedY, width: session.dockedWidth, height: session.dockedHeight } }
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
    setDeveloperToolsGeometry({ dockedWidth: edge === 'bottom' ? active.geometry.width : active.geometry.width + dx, dockedHeight: edge === 'right' ? active.geometry.height : active.geometry.height + dy }, false)
  }

  const windowStyle = session.mode === 'docked' ? {
    left: session.dockedX,
    top: session.dockedY,
    width: session.dockedWidth,
    height: session.dockedHeight,
  } as CSSProperties : undefined
  const workspace = session.mode === 'workspace'
  return <div className={`developer-tools-layer ${workspace ? 'workspace-mode' : 'docked-mode'}`} aria-label="Developer Tools workspace">
    <section className={`developer-tools-window ${workspace ? 'workspace' : 'docked'}`} style={windowStyle} role="dialog" aria-modal={workspace} aria-label="Developer Tools">
      <header className="developer-tools-header" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
        <div className="developer-tools-title"><div className="eyebrow"><Bug size={13} /> DEVELOPER WORKSPACE</div><h2>Developer Tools</h2></div>
        <div className="developer-tools-header-status">
          {activeOverrides.length > 0 && <GameTooltip content={`${activeOverrides.length} active debug override${activeOverrides.length === 1 ? '' : 's'}`}><Status tone="warning">{`${activeOverrides.length} ACTIVE OVERRIDE${activeOverrides.length === 1 ? '' : 'S'}`}</Status></GameTooltip>}
          {copied && <Status tone={copied === 'Clipboard unavailable' ? 'warning' : 'success'}>{copied === 'Clipboard unavailable' ? copied : <><Check size={13} /> {copied} copied</>}</Status>}
        </div>
        <div className="developer-tools-header-actions">
          {!workspace && <GameTooltip content="Reset docked window position and size"><button className="icon-button" onClick={resetDeveloperToolsWindow} aria-label="Reset Developer Tools window position and size"><RotateCcw size={15} /></button></GameTooltip>}
          <GameTooltip content="Clear all debug overrides"><button className="icon-button" onClick={resetDebug} disabled={activeOverrides.length === 0} aria-label="Clear all debug overrides"><span className="developer-clear-label">CLEAR ALL</span></button></GameTooltip>
          <GameTooltip content={workspace ? 'Move Developer Tools into a docked window' : 'Open full Developer Workspace'}><button className="icon-button" onClick={workspace ? dockDeveloperTools : workspaceDeveloperTools} aria-label={workspace ? 'Dock Developer Tools' : 'Open full Developer Workspace'}><PanelRight size={16} /></button></GameTooltip>
          <GameTooltip content="Close Developer Tools"><button className="icon-button" onClick={closeDeveloperTools} aria-label="Close Developer Tools"><X size={18} /></button></GameTooltip>
        </div>
      </header>
      {activeOverrides.length > 0 && <div className="developer-active-overrides" role="status"><strong>ACTIVE OVERRIDES</strong><span>{activeOverrides.map((override) => override.label).join(' · ')}</span></div>}
      <div className="developer-tools-body">
        <nav className="developer-tools-tabs" aria-label="Developer tool sections">{tabGroups.map((group) => <div className="developer-tools-tab-group" key={group.label}><span className="developer-tools-tab-group-label">{group.label}</span>{group.tabs.map((tab) => <button key={tab.id} className={session.activeTab === tab.id ? 'active' : ''} aria-selected={session.activeTab === tab.id} onClick={() => setDeveloperToolsTab(tab.id)}>{tab.label}</button>)}</div>)}</nav>
        <main className="developer-tools-content"><DeveloperTab tab={session.activeTab} copy={copy} /></main>
      </div>
      {session.mode === 'docked' && <>
        <div className="developer-tools-resize-handle right" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'right')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
        <div className="developer-tools-resize-handle bottom" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'bottom')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
        <div className="developer-tools-resize-handle corner" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'corner')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} />
      </>}
    </section>
  </div>
}
