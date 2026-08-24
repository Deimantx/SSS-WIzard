import { useEffect, useRef } from 'react'
import { BookOpen, ChevronRight, Edit3, Gem, Home, LayoutDashboard, Library, Menu, Settings, Shield, Swords, TowerControl, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import { selectCombatStatus, selectManaRegen, selectOfflineBankMs, selectUsedFocus } from '../store/selectors'
import type { ScreenId } from '../game/types'
import { formatNumber, formatTime } from '../game/utils'
import { ArcaneAtmosphere } from '../components/ArcaneAtmosphere'
import { ScreenRouter } from '../screens/ScreenRouter'
import { useUiPreferences } from '../ui/preferences/uiPreferencesStore'
import { themeColors } from '../ui/theme/themePresets'
import { closeLayoutEditor, openLayoutEditor, useLayoutEditorStore } from '../ui/layout-editor/layoutEditorStore'
import { LayoutEditorDrawer } from '../ui/layout-editor/LayoutEditorDrawer'

const NAV: { id: ScreenId; label: string; icon: typeof Home; hint: string }[] = [
  { id: 'home', label: 'Overview', icon: Home, hint: 'Your wizard at a glance' },
  { id: 'tower', label: 'Wizard Tower', icon: TowerControl, hint: 'Channel, condense, research' },
  { id: 'schools', label: 'Magic Schools', icon: BookOpen, hint: 'XP, levels, and spells' },
  { id: 'combat', label: 'Combat', icon: Swords, hint: 'Whispering Woods' },
  { id: 'inventory', label: 'Inventory', icon: Gem, hint: 'Materials and loot' },
  { id: 'equipment', label: 'Equipment', icon: Shield, hint: 'Build your focus' },
  { id: 'guild', label: 'Guild', icon: Library, hint: 'Requests and rank' },
  { id: 'collection', label: 'Collection', icon: LayoutDashboard, hint: 'Discover the wilds' },
  { id: 'settings', label: 'Settings / Info', icon: Settings, hint: 'Save and testing' },
]

export function GameShell() {
  const screen = useGameStore((state) => state.ui.screen)
  const player = useGameStore((state) => state.player)
  const combat = useGameStore((state) => state.combat)
  const progress = useGameStore((state) => state.progress)
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
  const manaRegen = useGameStore(selectManaRegen)
  const combatStatus = useGameStore(selectCombatStatus)
  const offlineBankMs = useGameStore(selectOfflineBankMs)
  const preferences = useUiPreferences()
  const appearance = themeColors(preferences.theme, preferences.customTheme)

  useEffect(() => {
    if (!editor.isEditing) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !(event.target as HTMLElement | null)?.matches('input,select,textarea')) { event.preventDefault(); closeLayoutEditor() } }
    const onResize = () => { if (window.innerWidth < 1024) closeLayoutEditor('UI Editor is available on desktop-sized layouts.') }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('resize', onResize) }
  }, [editor.isEditing])

  useEffect(() => {
    const interval = window.setInterval(() => { if (document.hidden || hiddenRef.current) return; const now = performance.now(); const elapsed = now - lastFrame.current; lastFrame.current = now; tick(elapsed) }, 100)
    const autosave = window.setInterval(() => saveGame(), 15000)
    const visibility = () => { if (document.hidden) { hiddenAt.current = Date.now(); hiddenRef.current = true; saveGame() } else if (hiddenAt.current) { resumeFromHidden(Date.now() - hiddenAt.current); hiddenAt.current = null; hiddenRef.current = false; lastFrame.current = performance.now() } }
    document.addEventListener('visibilitychange', visibility)
    return () => { window.clearInterval(interval); window.clearInterval(autosave); document.removeEventListener('visibilitychange', visibility) }
  }, [resumeFromHidden, saveGame, tick])

  useEffect(() => {
    const timeout = window.setTimeout(() => { if (notifications[0]) dismissNotification(notifications[0].id) }, 5000)
    return () => window.clearTimeout(timeout)
  }, [notifications, dismissNotification])

  return <div className="game-shell">
    {preferences.backgroundEffects && <ArcaneAtmosphere accentColor={appearance.accent} opacity={preferences.theme === 'light' ? 0.22 : 0.72} reducedMotion={preferences.reducedMotion} />}
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">SSS</div><div><strong>SSS Wizard</strong><span>Arcane incremental RPG</span></div></div>
      <nav className="nav-list">{NAV.map(({ id, label, icon: Icon, hint }) => <button key={id} className={`nav-item ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)} title={hint}><Icon size={17} /><span>{label}</span>{screen === id && <ChevronRight className="nav-chevron" size={14} />}</button>)}</nav>
      <div className="sidebar-foot"><div className="save-dot"><span /> Autosave active</div><div className="version">MVP · local save</div></div>
    </aside>
    <main className={`main-area ${editor.isEditing ? 'editor-open' : ''}`}>
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setScreen('home')} aria-label="Go to overview"><Menu size={19} /></button>
        <div className="crumb"><span>Wizard Tower</span><ChevronRight size={14} /><strong>{NAV.find((item) => item.id === screen)?.label}</strong></div>
        <div className="top-resources">
          <div className="resource-chip hp"><span className="resource-icon">♥</span><div><small>HEALTH</small><strong>{formatNumber(player.health)} / {formatNumber(player.maxHealth)}</strong></div><div className="mini-bar"><i style={{ width: `${(player.health / player.maxHealth) * 100}%` }} /></div></div>
          <div className="resource-chip mana"><span className="resource-icon">✦</span><div><small>MANA</small><strong>{formatNumber(player.mana)} / {formatNumber(player.maxMana)}</strong></div><div className="mini-bar"><i style={{ width: `${(player.mana / player.maxMana) * 100}%` }} /></div></div>
          <div className="focus-chip"><span className="focus-glyph">◈</span><div><small>FOCUS</small><strong>{usedFocus} / {player.maxFocus}</strong></div></div>
          <div className="focus-chip top-detail"><span className="focus-glyph">↗</span><div><small>MANA REGEN</small><strong>+{manaRegen}/s</strong></div></div>
          <div className="focus-chip top-detail"><span className="focus-glyph">⚔</span><div><small>STATUS</small><strong>{combatStatus}</strong></div></div>
          <div className="focus-chip top-detail"><span className="focus-glyph">◷</span><div><small>OFFLINE BANK</small><strong>{formatTime(offlineBankMs)}</strong></div></div>
        </div>
        <button className="topbar-editor-button" onClick={() => editor.isEditing ? closeLayoutEditor() : openLayoutEditor(screen)} title={editor.isEditing ? 'Exit UI editor' : 'Edit UI layout'}><Edit3 size={15} /><span>{editor.isEditing ? 'Exit UI Edit' : 'Edit UI Layout'}</span></button><button className="icon-button" onClick={() => setScreen('settings')} title="Settings"><Settings size={17} /></button>
      </header>
      <div className="screen-scroll"><ScreenRouter /></div>
      <ActivityDock />
    </main>
    <LayoutEditorDrawer screen={screen} />
    {!editor.isEditing && editor.notice && <div className="layout-editor-notice-toast" role="status">{editor.notice}</div>}
    <div className="toast-stack">{notifications.map((note) => <div className={`toast ${note.tone}`} key={note.id}><span>{note.tone === 'success' ? '✦' : note.tone === 'warning' ? '!' : '·'}</span><div>{note.text}</div><button onClick={() => dismissNotification(note.id)}><X size={13} /></button></div>)}</div>
  </div>
}

function ActivityDock() {
  const activities = useGameStore((state) => state.activities)
  const combat = useGameStore((state) => state.combat)
  const setScreen = useGameStore((state) => state.setScreen)
  const items = [
    ...(combat.active ? [{ label: combat.enemyId ? `Combat · ${combat.enemyId.replace(/-/g, ' ')}` : 'Combat · next encounter', progress: combat.enemyId ? (combat.enemyHp / combat.enemyMaxHp) * 100 : 20, tone: 'red', screen: 'combat' as ScreenId }] : []),
    ...(activities.condense.running ? [{ label: `Condensing ${activities.condense.element}`, progress: Math.min(100, activities.condense.progressMs / 60), tone: 'orange', screen: 'tower' as ScreenId }] : []),
    ...(activities.research.running ? [{ label: `Research · ${activities.research.targetSchoolId ?? 'School'} · ${activities.research.remainingQuantity} left`, progress: Math.min(100, activities.research.progressMs / 50), tone: 'violet', screen: 'tower' as ScreenId }] : []),
    ...(activities.transmutation.running ? [{ label: 'Transmutation', progress: Math.min(100, activities.transmutation.progressMs / 80), tone: 'gold', screen: 'tower' as ScreenId }] : []),
  ]
  if (!items.length) return <div className="activity-dock empty"><span>Activity Dock</span><small>Your active systems will appear here. Navigation never pauses gameplay.</small></div>
  return <div className="activity-dock">{items.map((item) => <button key={item.label} className="dock-activity" onClick={() => setScreen(item.screen)}><span className={`activity-dot ${item.tone}`} /><span className="dock-label">{item.label}</span><span className="dock-track"><i className={item.tone} style={{ width: `${item.progress}%` }} /></span><ChevronRight size={14} /></button>)}</div>
}
