import { useEffect, useRef } from 'react'
import { BookOpen, ChevronRight, CircleHelp, FlaskConical, Gem, Home, LayoutDashboard, Library, Menu, Settings, Shield, Swords, TowerControl, X } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import type { ScreenId } from '../game/types'
import { formatNumber, formatTime } from '../game/utils'
import { ArcaneAtmosphere } from '../components/ArcaneAtmosphere'
import { Screen } from '../screens/Screens'

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
  const editMode = useGameStore((state) => state.ui.editMode)
  const notifications = useGameStore((state) => state.notifications)
  const setScreen = useGameStore((state) => state.setScreen)
  const tick = useGameStore((state) => state.tick)
  const saveGame = useGameStore((state) => state.saveGame)
  const dismissNotification = useGameStore((state) => state.dismissNotification)
  const resumeFromHidden = useGameStore((state) => state.resumeFromHidden)
  const lastFrame = useRef(performance.now())

  useEffect(() => {
    const interval = window.setInterval(() => { const now = performance.now(); const elapsed = now - lastFrame.current; lastFrame.current = now; tick(elapsed) }, 100)
    const autosave = window.setInterval(() => saveGame(), 15000)
    let hiddenAt = 0
    const visibility = () => { if (document.hidden) hiddenAt = Date.now(); else if (hiddenAt) { resumeFromHidden(Date.now() - hiddenAt); hiddenAt = 0 } }
    document.addEventListener('visibilitychange', visibility)
    return () => { window.clearInterval(interval); window.clearInterval(autosave); document.removeEventListener('visibilitychange', visibility) }
  }, [resumeFromHidden, saveGame, tick])

  useEffect(() => {
    const timeout = window.setTimeout(() => { if (notifications[0]) dismissNotification(notifications[0].id) }, 5000)
    return () => window.clearTimeout(timeout)
  }, [notifications, dismissNotification])

  return <div className="game-shell">
    <ArcaneAtmosphere />
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">SSS</div><div><strong>SSS Wizard</strong><span>Arcane incremental RPG</span></div></div>
      <nav className="nav-list">{NAV.map(({ id, label, icon: Icon, hint }) => <button key={id} className={`nav-item ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)} title={hint}><Icon size={17} /><span>{label}</span>{screen === id && <ChevronRight className="nav-chevron" size={14} />}</button>)}</nav>
      <div className="sidebar-foot"><div className="save-dot"><span /> Autosave active</div><div className="version">MVP · local save</div></div>
    </aside>
    <main className={`main-area ${editMode ? 'edit-mode' : ''}`}>
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setScreen('home')} aria-label="Go to overview"><Menu size={19} /></button>
        <div className="crumb"><span>Wizard Tower</span><ChevronRight size={14} /><strong>{NAV.find((item) => item.id === screen)?.label}</strong></div>
        <div className="top-resources">
          <div className="resource-chip hp"><span className="resource-icon">♥</span><div><small>HEALTH</small><strong>{formatNumber(player.health)} / {formatNumber(player.maxHealth)}</strong></div><div className="mini-bar"><i style={{ width: `${(player.health / player.maxHealth) * 100}%` }} /></div></div>
          <div className="resource-chip mana"><span className="resource-icon">✦</span><div><small>MANA</small><strong>{formatNumber(player.mana)} / {formatNumber(player.maxMana)}</strong></div><div className="mini-bar"><i style={{ width: `${(player.mana / player.maxMana) * 100}%` }} /></div></div>
          <div className="focus-chip"><span className="focus-glyph">◈</span><div><small>FOCUS</small><strong><FocusValue /> / {player.maxFocus}</strong></div></div>
        </div>
        <button className="icon-button" onClick={() => setScreen('settings')} title="Settings"><Settings size={17} /></button>
      </header>
      <div className="screen-scroll"><Screen /></div>
      <ActivityDock />
      {editMode && <div className="layout-badge">UI EDIT MODE · layout changes are local to this session</div>}
    </main>
    <div className="toast-stack">{notifications.map((note) => <div className={`toast ${note.tone}`} key={note.id}><span>{note.tone === 'success' ? '✦' : note.tone === 'warning' ? '!' : '·'}</span><div>{note.text}</div><button onClick={() => dismissNotification(note.id)}><X size={13} /></button></div>)}</div>
  </div>
}

function FocusValue() { const value = useGameStore((state) => state.player.maxFocus); const used = useGameStore((state) => { const a = state.activities; let total = a.autoChannel ? 15 : 0; if (a.condense.running) total += 20; if (a.research.running) total += 25; if (a.transmutation.running) total += 20; Object.values(a.autoCast).forEach((active) => { if (active) total += 15 }); return Math.min(value, total) }); return <>{used}</> }

function ActivityDock() {
  const activities = useGameStore((state) => state.activities)
  const combat = useGameStore((state) => state.combat)
  const setScreen = useGameStore((state) => state.setScreen)
  const items = [
    ...(combat.active ? [{ label: combat.enemyId ? `Combat · ${combat.enemyId.replace(/-/g, ' ')}` : 'Combat · next encounter', progress: combat.enemyId ? (combat.enemyHp / combat.enemyMaxHp) * 100 : 20, tone: 'red', screen: 'combat' as ScreenId }] : []),
    ...(activities.condense.running ? [{ label: `Condensing ${activities.condense.element}`, progress: Math.min(100, activities.condense.progressMs / 60), tone: 'orange', screen: 'tower' as ScreenId }] : []),
    ...(activities.research.running ? [{ label: 'Arcane Research', progress: Math.min(100, activities.research.progressMs / 50), tone: 'violet', screen: 'tower' as ScreenId }] : []),
    ...(activities.transmutation.running ? [{ label: 'Transmutation', progress: Math.min(100, activities.transmutation.progressMs / 80), tone: 'gold', screen: 'tower' as ScreenId }] : []),
  ]
  if (!items.length) return <div className="activity-dock empty"><span>Activity Dock</span><small>Your active systems will appear here. Navigation never pauses gameplay.</small></div>
  return <div className="activity-dock">{items.map((item) => <button key={item.label} className="dock-activity" onClick={() => setScreen(item.screen)}><span className={`activity-dot ${item.tone}`} /><span className="dock-label">{item.label}</span><span className="dock-track"><i className={item.tone} style={{ width: `${item.progress}%` }} /></span><ChevronRight size={14} /></button>)}</div>
}
