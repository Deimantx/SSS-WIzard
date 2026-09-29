import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Bug, Check, Command, PanelRight, RotateCcw, Search, X } from 'lucide-react'
import { Button, GameTooltip, Status } from '../components/ui'
import { useDeveloperGameStore as useGameStore } from './developerSandbox'
import { clampDeveloperToolsToViewport, closeDeveloperTools, dockDeveloperTools, resetDeveloperToolsWindow, setDeveloperToolsDockedPosition, setDeveloperToolsGeometry, setDeveloperToolsTab, setDeveloperWorkspace, useDeveloperToolsStore, workspaceDeveloperTools } from './developerToolsStore'
import { DeveloperTab } from './DeveloperToolTabs'
import { getDeveloperWorkspaceTools, searchDeveloperTools, DEVELOPER_WORKSPACE_REGISTRY } from './developerToolRegistry'
import { getActiveDebugOverrides, type ActiveDebugOverride } from './debugOverridePresentation'
import { restoreAndExitDeveloperSandbox } from './developerSandbox'

type Interaction = { pointerId: number; startX: number; startY: number; geometry: { x: number; y: number; width: number; height: number } }

export function DeveloperToolsWindow() {
  const session = useDeveloperToolsStore()
  const debug = useGameStore((state) => state.debug)
  const resetDebug = useGameStore((state) => state.resetDebugOverrides)
  const combatActive = useGameStore((state) => state.combat.active)
  const worldTier = useGameStore((state) => state.worldTier.current)
  const [copied, setCopied] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const interaction = useRef<Interaction | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV && !session.sandbox.active && getActiveDebugOverrides(debug).length > 0) {
      console.error('[SSS Wizard] Gameplay debug overrides are active outside Developer Sandbox.')
    }
  }, [debug, session.sandbox.active])

  useEffect(() => {
    const onResize = () => clampDeveloperToolsToViewport()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useEffect(() => () => closeDeveloperTools(), [])
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!session.open) return null
  const activeOverrides = getActiveDebugOverrides(debug)
  const workspaceDefinition = DEVELOPER_WORKSPACE_REGISTRY.find((entry) => entry.id === session.activeWorkspace) ?? DEVELOPER_WORKSPACE_REGISTRY[0]
  const workspaceTools = getDeveloperWorkspaceTools(workspaceDefinition.id)
  const searchResults = searchDeveloperTools(search)
  const clearOverride = (override: ActiveDebugOverride) => {
    const state = useGameStore.getState()
    const key = override.key
    if (key === 'playerStats') return state.resetDebugPlayerStats()
    if (key === 'allowManaOverCap') return state.setDebugAllowManaOverCap(false)
    if (key === 'showLockedTransmutationRecipes') return state.setDebugShowLockedTransmutationRecipes(false)
    if (key === 'showLockedArtificingRecipes') return state.setDebugShowLockedArtificingRecipes(false)
    if (key === 'playerImmortal') return state.setDebugPlayerImmortal(false)
    if (key === 'enemyImmortal') return state.setDebugEnemyImmortal(false)
    if (key === 'infiniteMana') return state.setDebugInfiniteMana(false)
    if (key === 'ignoreSpellCooldowns') return state.setDebugIgnoreSpellCooldowns(false)
    if (key === 'disableAutoCast') return state.setDebugDisableAutoCast(false)
    if (key === 'freezePlayerActions') return state.setDebugFreezePlayerActions(false)
    if (key === 'freezeEnemyActions') return state.setDebugFreezeEnemyActions(false)
    if (key === 'combatPaused') return state.setDebugCombatPaused(false)
    if (key === 'combatTimeScale') return state.setDebugCombatTimeScale(1)
    if (key === 'artifactFreeRankPurchase') return state.setDebugArtifactFreeRankPurchase(false)
    if (key === 'artifactIgnoreOwnership') return state.setDebugArtifactIgnoreOwnership(false)
    if (key === 'arcaneCoreFreeCosts') return state.setDebugArcaneCoreFreeCosts(false)
    if (key === 'arcaneCoreIgnorePrerequisites') return state.setDebugArcaneCoreIgnorePrerequisites(false)
    if (key === 'bonusAcolytes') return state.setDebugAcolyteBonus(0)
    if (key === 'acolyteTotalOverride') return state.setDebugAcolyteTotalOverride(null)
    if (key === 'ignoreAcolyteLimit') return state.setDebugIgnoreAcolyteLimit(false)
    if (key === 'arcaneFluxCapacityOverride') return state.setDebugArcaneFluxCapacity(null)
    return undefined
  }
  const copy = async (label: string, value: unknown) => {
    try { await navigator.clipboard?.writeText(typeof value === 'string' ? value : JSON.stringify(value, null, 2)); setCopied(label); window.setTimeout(() => setCopied(''), 1800) }
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
    event.currentTarget.dataset.resizeEdge = edge
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
  const windowStyle = session.mode === 'docked' ? { left: session.dockedX, top: session.dockedY, width: session.dockedWidth, height: session.dockedHeight } as CSSProperties : undefined
  const workspace = session.mode === 'workspace'
  return <div className={`developer-tools-layer ${workspace ? 'workspace-mode' : 'docked-mode'}`} aria-label="Developer Tools workspace">
    <section className={`developer-tools-window ${workspace ? 'workspace' : 'docked'}`} style={windowStyle} role="dialog" aria-modal={workspace} aria-label="Developer Tools">
      <header className="developer-tools-header" onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endInteraction} onPointerCancel={endInteraction}>
        <div className="developer-tools-title"><div className="eyebrow"><Bug size={13} /> {workspaceDefinition.eyebrow} / DEVELOPER WORKSPACE</div><h2>{workspaceDefinition.label}</h2></div>
        <div className="developer-tools-header-status">{session.sandbox.active && <Status tone="warning" role="status">SANDBOX ACTIVE · AUTOSAVE PAUSED</Status>}{activeOverrides.length > 0 && <GameTooltip content={`${activeOverrides.length} active debug override${activeOverrides.length === 1 ? '' : 's'}`}><Status tone="warning">{`${activeOverrides.length} ACTIVE OVERRIDE${activeOverrides.length === 1 ? '' : 'S'}`}</Status></GameTooltip>}{copied && <Status tone={copied === 'Clipboard unavailable' ? 'warning' : 'success'}>{copied === 'Clipboard unavailable' ? copied : <><Check size={13} /> {copied} copied</>}</Status>}</div>
        <div className="developer-tools-header-actions">
          {session.sandbox.active && <GameTooltip content="Restore the captured profile state and resume profile saving."><Button variant="primary" className="developer-sandbox-exit" onClick={restoreAndExitDeveloperSandbox}>RESTORE &amp; EXIT</Button></GameTooltip>}
          {!workspace && <GameTooltip content="Reset docked window position and size"><button className="icon-button" onClick={resetDeveloperToolsWindow} aria-label="Reset Developer Tools window position and size"><RotateCcw size={15} /></button></GameTooltip>}
          <GameTooltip content="Clear all debug overrides"><Button variant="ghost" className="developer-clear-all-button" onClick={resetDebug} disabled={activeOverrides.length === 0} ariaLabel="Clear all debug overrides"><span>CLEAR ALL</span></Button></GameTooltip>
          <GameTooltip content="Search registered tools and tester surfaces"><button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="Open Developer command palette"><Search size={16} /></button></GameTooltip>
          <GameTooltip content={workspace ? 'Move Developer Tools into a docked window' : 'Open full Developer Workspace'}><button className="icon-button" onClick={workspace ? dockDeveloperTools : workspaceDeveloperTools} aria-label={workspace ? 'Dock Developer Tools' : 'Open full Developer Workspace'}><PanelRight size={16} /></button></GameTooltip>
          <GameTooltip content="Close Developer Tools"><button className="icon-button" onClick={closeDeveloperTools} aria-label="Close Developer Tools"><X size={18} /></button></GameTooltip>
        </div>
      </header>
      <div className="developer-context-bar"><span>WT{worldTier}</span><span>{combatActive ? 'COMBAT ACTIVE' : 'COMBAT IDLE'}</span><span>{activeOverrides.length ? `${activeOverrides.length} SESSION OVERRIDES` : 'SESSION CLEAN'}</span>{session.sandbox.active && <span className="developer-sandbox-indicator">DEV SANDBOX · AUTOSAVE PAUSED</span>}</div>
      {activeOverrides.length > 0 && <details className="developer-override-center"><summary><strong>{activeOverrides.length} SESSION OVERRIDES</strong><span>Inspect active runtime mutations</span></summary><div>{activeOverrides.map((override) => <span className="developer-override-entry" key={override.id}><span className={`developer-override-chip ${override.tone}`}>{override.label}</span><button type="button" className="developer-override-clear" onClick={() => clearOverride(override)}>CLEAR</button></span>)}<button type="button" className="developer-override-clear" onClick={resetDebug}>CLEAR ALL SESSION OVERRIDES</button></div></details>}
      <div className="developer-local-tabs" role="tablist" aria-label={`${workspaceDefinition.label} tools`}>{workspaceTools.map((tool) => <button key={tool.id} role="tab" aria-selected={session.activeTab === tool.id} className={session.activeTab === tool.id ? 'active' : ''} onClick={() => setDeveloperToolsTab(tool.id)}>{tool.label}</button>)}</div>
      <div className="developer-tools-body">
        <nav className="developer-tools-tabs" aria-label="Developer workspaces">{DEVELOPER_WORKSPACE_REGISTRY.map((entry) => { const Icon = getDeveloperWorkspaceTools(entry.id)[0]?.icon; return <button key={entry.id} className={session.activeWorkspace === entry.id ? 'active' : ''} aria-selected={session.activeWorkspace === entry.id} onClick={() => setDeveloperWorkspace(entry.id)}>{Icon && <Icon size={14} aria-hidden />}<span>{entry.label}</span></button> })}</nav>
        <main className="developer-tools-content"><DeveloperTab tab={session.activeTab} copy={copy} /></main>
      </div>
      {session.mode === 'docked' && <><div className="developer-tools-resize-handle right" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'right')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} /><div className="developer-tools-resize-handle bottom" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'bottom')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} /><div className="developer-tools-resize-handle corner" aria-hidden="true" onPointerDown={(event) => beginResize(event, 'corner')} onPointerMove={moveResize} onPointerUp={endInteraction} onPointerCancel={endInteraction} /></>}
      {searchOpen && <div className="developer-command-palette" role="dialog" aria-modal="true" aria-label="Developer command palette"><div className="developer-command-palette-inner"><div className="developer-command-palette-head"><div><span className="eyebrow"><Command size={13} /> COMMAND PALETTE</span><h2>Find a tool</h2></div><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="Close Developer command palette"><X size={16} /></button></div><label className="developer-command-search"><Search size={15} /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tools, systems, or keywords" aria-label="Search Developer tools" /></label><div className="developer-command-results">{searchResults.map((tool) => <button key={tool.id} onClick={() => { setDeveloperToolsTab(tool.id); setSearchOpen(false); setSearch('') }}><span><strong>{tool.label}</strong><small>{tool.workspace.toUpperCase()} · {tool.description}</small></span><span>OPEN</span></button>)}{searchResults.length === 0 && <div className="developer-empty-state"><strong>No registered tools found</strong><span>Try a system name or keyword.</span></div>}</div></div></div>}
    </section>
  </div>
}
