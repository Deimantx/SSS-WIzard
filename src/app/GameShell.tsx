import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Edit3, Menu, Settings, X, Wrench } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { selectFreeFocus, selectManaRegen, selectOfflineBankMs, selectTopbarStatus, selectUsedFocus } from '../store/selectors'
import type { ScreenId } from '../game/types'
import { formatNumber, formatOfflineBank } from '../game/utils'
import { ArcaneAtmosphere } from '../components/ArcaneAtmosphere'
import { ScreenRouter } from '../screens/ScreenRouter'
import { getNavigationContext, navigationGroups } from './navigation'
import { setUiPreferences, useUiPreferences } from '../ui/preferences/uiPreferencesStore'
import { themeColors } from '../ui/theme/themePresets'
import { closeLayoutEditor, openLayoutEditor, useLayoutEditorStore } from '../ui/layout-editor/layoutEditorStore'
import { LayoutEditorDrawer } from '../ui/layout-editor/LayoutEditorDrawer'
import { openDeveloperTools } from '../devtools/developerToolsStore'
import { DeveloperToolsWindow } from '../devtools/DeveloperToolsWindow'
import { AUTOSAVE_INTERVAL_MS } from '../persistence/saveConstants'
import { useProfileSession } from '../profiles/profileSessionStore'
import { leaveToProfiles } from '../profiles/profileController'

export function GameShell() {
  const screen = useGameStore((state) => state.ui.screen)
  const player = useGameStore((state) => state.player)
  const combat = useGameStore((state) => state.combat)
  const activities = useGameStore((state) => state.activities)
  const editor = useLayoutEditorStore()
  const notifications = useGameStore((state) => state.notifications)
  const setScreen = useGameStore((state) => state.setScreen)
  const tick = useGameStore((state) => state.tick)
  const saveGame = useGameStore((state) => state.saveGame)
  const dismissNotification = useGameStore((state) => state.dismissNotification)
  const resumeFromHidden = useGameStore((state) => state.resumeFromHidden)
  const lastFrame = useRef(performance.now())
  const hiddenAt = useRef<number | null>(null)
  const hiddenRef = useRef(false)
  const usedFocus = useGameStore(selectUsedFocus)
  const freeFocus = useGameStore(selectFreeFocus)
  const manaRegen = useGameStore(selectManaRegen)
  const combatStatus = useGameStore(selectTopbarStatus)
  const offlineBankMs = useGameStore(selectOfflineBankMs)
  const preferences = useUiPreferences()
  const appearance = themeColors(preferences.theme, preferences.customTheme)
  const navigation = getNavigationContext(screen)
  const profileSession = useProfileSession()
  const activeProfile = profileSession.activeProfileId ? profileSession.profiles.slots[profileSession.activeProfileId] : null
  const [profileSwitchError, setProfileSwitchError] = useState<string | null>(null)

  useEffect(() => {
    if (!editor.isEditing) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !(event.target as HTMLElement | null)?.matches('input,select,textarea')) { event.preventDefault(); closeLayoutEditor() } }
    const onResize = () => { if (window.innerWidth < 1024) closeLayoutEditor('UI Editor is available on desktop-sized layouts.') }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('resize', onResize) }
  }, [editor.isEditing])

  useEffect(() => {
    const group = navigation.group.id
    if (group !== 'overview' && preferences.navigationGroups[group] === true) setUiPreferences({ navigationGroups: { ...preferences.navigationGroups, [group]: false } })
  }, [navigation.group.id, preferences.navigationGroups, screen])

  useEffect(() => {
    const interval = window.setInterval(() => { if (document.hidden || hiddenRef.current) return; const now = performance.now(); const elapsed = now - lastFrame.current; lastFrame.current = now; tick(elapsed) }, 100)
    const autosave = window.setInterval(() => saveGame('autosave'), AUTOSAVE_INTERVAL_MS)
    const visibility = () => { if (document.hidden) { hiddenAt.current = Date.now(); hiddenRef.current = true; saveGame('visibility') } else if (hiddenAt.current) { resumeFromHidden(Date.now() - hiddenAt.current, false); hiddenAt.current = null; hiddenRef.current = false; lastFrame.current = performance.now(); saveGame('profile-anchor') } }
    const pageHide = () => saveGame('visibility')
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pageHide)
    return () => { window.clearInterval(interval); window.clearInterval(autosave); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pageHide) }
  }, [resumeFromHidden, saveGame, tick])

  useEffect(() => {
    const timeout = window.setTimeout(() => { if (notifications[0]) dismissNotification(notifications[0].id) }, 5000)
    return () => window.clearTimeout(timeout)
  }, [notifications, dismissNotification])

  const toggleGroup = (id: string) => {
    if (id === 'overview') return
    const groupId = id as keyof typeof preferences.navigationGroups
    setUiPreferences({ navigationGroups: { ...preferences.navigationGroups, [groupId]: !preferences.navigationGroups[groupId] } })
  }

  return <div className="game-shell">
    {preferences.backgroundEffects && <ArcaneAtmosphere accentColor={appearance.accent} opacity={preferences.theme === 'light' ? 0.22 : 0.72} reducedMotion={preferences.reducedMotion} />}
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">SSS</div><div><strong>SSS Wizard</strong><span>Arcane incremental RPG</span></div></div>
      <nav className="nav-list" aria-label="Main navigation">{navigationGroups.map((group) => { const collapsed = group.id !== 'overview' && preferences.navigationGroups[group.id] === true; return <section className={`nav-group ${collapsed ? 'collapsed' : ''}`} key={group.id}><button className="nav-group-header" onClick={() => toggleGroup(group.id)} aria-label={`Toggle ${group.label} group`} aria-expanded={!collapsed}><span>{group.label}</span>{group.id !== 'overview' && (collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />)}</button>{!collapsed && <div className="nav-group-items">{group.items.map(({ id, label, icon: Icon, hint }) => <button key={id} className={`nav-item ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)} title={hint}><Icon size={16} /><span>{label}</span>{screen === id && <ChevronRight className="nav-chevron" size={14} />}</button>)}</div>}</section> })}</nav>
      <div className="sidebar-foot"><div className="save-dot"><span /> Autosave {String.fromCharCode(183)} 30s</div><div className="version">Profile {activeProfile?.slotNumber ?? '-'} {String.fromCharCode(183)} {activeProfile?.name ?? 'No profile'}</div>{profileSwitchError && <small className="profile-switch-error" role="alert">{profileSwitchError}</small>}<button className="profile-switch-button" onClick={() => { const result = leaveToProfiles(); if (!result.ok) setProfileSwitchError(result.error) }} title="Return to Profile Selection">Switch Profile</button></div>
    </aside>
    <main className={`main-area ${editor.isEditing ? 'editor-open' : ''}`}>
      <header className="topbar topbar-v2">
        <button className="mobile-menu" onClick={() => setScreen('home')} aria-label="Go to overview"><Menu size={19} /></button>
        <div className="crumb"><span>{navigation.group.breadcrumb}</span>{navigation.group.id !== 'overview' && <ChevronRight size={14} />}<strong>{navigation.item.label}</strong></div>
        <div className="topbar-metrics">
          <div className="topbar-primary"><ResourceChip tone="hp" icon={String.fromCharCode(9829)} label="HP" value={`${formatNumber(player.health)} / ${formatNumber(player.maxHealth)}`} percent={player.health / player.maxHealth * 100} /><ResourceChip tone="mana" icon={String.fromCharCode(10022)} label="MANA" value={`${formatNumber(player.mana)} / ${formatNumber(player.maxMana)}`} percent={player.mana / player.maxMana * 100} /><div className="resource-chip focus resource-chip-focus" title={`${formatNumber(freeFocus)} free Focus ${String.fromCharCode(183)} ${formatNumber(usedFocus)} / ${formatNumber(player.maxFocus)} reserved`}><span className="resource-icon">{String.fromCharCode(9672)}</span><div><small>FOCUS</small><strong>{formatNumber(freeFocus)} FREE</strong></div><div className="mini-bar"><i style={{ width: `${usedFocus / player.maxFocus * 100}%` }} /></div></div></div>
          <div className="topbar-secondary"><div className="secondary-metric" title="Mana regeneration"><small>REGEN</small><strong>{String.fromCharCode(8599)} +{manaRegen}/s</strong></div><div className="secondary-metric" title="Current player status"><small>STATUS</small><strong>{String.fromCharCode(9874)} {combatStatus}</strong></div><div className="secondary-metric" title={`Offline Bank \u00b7 Banked time: ${Math.max(0, Math.floor(offlineBankMs / 1000))} seconds`}><small>OFFLINE</small><strong>{String.fromCharCode(9687)} {formatOfflineBank(offlineBankMs)}</strong></div></div>
        </div>
        <div className="topbar-actions"><button className="topbar-tool-button" onClick={() => openDeveloperTools()} title="Open Developer Tools"><Wrench size={15} /><span>Dev Tools</span></button><button className="topbar-tool-button topbar-editor-button" onClick={() => editor.isEditing ? closeLayoutEditor() : openLayoutEditor(screen)} title={editor.isEditing ? 'Exit UI editor' : 'Edit UI layout'}><Edit3 size={15} /><span>{editor.isEditing ? 'Exit UI' : 'Edit UI'}</span></button><button className="icon-button" onClick={() => setScreen('settings')} title="Settings" aria-label="Settings"><Settings size={17} /></button></div>
      </header>
      <div className="screen-scroll"><ScreenRouter /></div>
      <ActivityDock />
    </main>
    <LayoutEditorDrawer screen={screen} />
    <DeveloperToolsWindow />
    {!editor.isEditing && editor.notice && <div className="layout-editor-notice-toast" role="status">{editor.notice}</div>}
    <div className="toast-stack">{notifications.map((note) => <div className={`toast ${note.tone}`} key={note.id}><span>{note.tone === 'success' ? String.fromCharCode(10022) : note.tone === 'warning' ? '!' : '\u00b7'}</span><div>{note.text}</div><button onClick={() => dismissNotification(note.id)} aria-label="Dismiss notification"><X size={13} /></button></div>)}</div>
  </div>
}

function ResourceChip({ tone, icon, label, value, percent }: { tone: string; icon: string; label: string; value: string; percent: number }) {
  return <div className={`resource-chip ${tone}`}><span className="resource-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong></div><div className="mini-bar"><i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} /></div></div>
}

function ActivityDock() {
  const activities = useGameStore((state) => state.activities)
  const combat = useGameStore((state) => state.combat)
  const setScreen = useGameStore((state) => state.setScreen)
  const items = [
    ...(combat.active ? [{ label: combat.enemyId ? `Combat \u00b7 ${combat.enemyId.replace(/-/g, ' ')}` : 'Combat \u00b7 next encounter', progress: combat.enemyId ? (combat.enemyHp / combat.enemyMaxHp) * 100 : 20, tone: 'red', screen: 'combat' as ScreenId }] : []),
    ...(activities.condense.running ? [{ label: `Condensing ${activities.condense.element}`, progress: Math.min(100, activities.condense.progressMs / 60), tone: 'orange', screen: 'tower-condensation' as ScreenId }] : []),
    ...(activities.research.running ? [{ label: `Research \u00b7 ${activities.research.targetSchoolId ?? 'School'} \u00b7 ${activities.research.remainingQuantity} left`, progress: Math.min(100, activities.research.progressMs / 50), tone: 'violet', screen: 'tower-research' as ScreenId }] : []),
    ...(activities.transmutation.running ? [{ label: 'Transmutation', progress: Math.min(100, activities.transmutation.progressMs / 80), tone: 'gold', screen: 'tower-transmutation' as ScreenId }] : []),
  ]
  if (!items.length) return <div className="activity-dock empty"><span>Activity Dock</span><small>Your active systems will appear here. Navigation never pauses gameplay.</small></div>
  return <div className="activity-dock">{items.map((item) => <button key={item.label} className="dock-activity" onClick={() => setScreen(item.screen)}><span className={`activity-dot ${item.tone}`} /><span className="dock-label">{item.label}</span><span className="dock-track"><i className={item.tone} style={{ width: `${item.progress}%` }} /></span><ChevronRight size={14} /></button>)}</div>
}
