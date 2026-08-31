import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { ArcaneAtmosphere } from '../components/ArcaneAtmosphere'
import { ScreenRouter } from '../screens/ScreenRouter'
import { getNavigationContext } from './navigation'
import { setUiPreferences, useUiPreferences } from '../ui/preferences/uiPreferencesStore'
import { themeColors } from '../ui/theme/themePresets'
import { cancelTopbarInteraction, closeLayoutEditor, openLayoutEditor, useLayoutEditorStore } from '../ui/layout-editor/layoutEditorStore'
import { openDeveloperTools } from '../devtools/developerToolsStore'
import { DeveloperToolsWindow } from '../devtools/DeveloperToolsWindow'
import { LayoutEditorDrawer } from '../ui/layout-editor/LayoutEditorDrawer'
import { AUTOSAVE_INTERVAL_MS } from '../persistence/saveConstants'
import { useProfileSession } from '../profiles/profileSessionStore'
import { leaveToProfiles } from '../profiles/profileController'
import { Sidebar } from './shell/Sidebar'
import { Topbar } from './shell/Topbar'
import { ActivityMonitor } from './shell/ActivityMonitor'
import { OfflineBankPopover } from './shell/OfflineBankPopover'
import { OfflineBankResultsDialog } from './shell/OfflineBankResultsDialog'
import { ToastStack } from './shell/ToastStack'
import { SaveProtectionNotice } from './shell/SaveProtectionNotice'
import { TooltipProvider, dismissGameTooltips } from '../components/ui/tooltip/Tooltip'
import { DefeatSummaryModal } from '../screens/combat/DefeatSummaryModal'

export function GameShell() {
  const screen = useGameStore((state) => state.ui.screen)
  const setScreen = useGameStore((state) => state.setScreen)
  const tick = useGameStore((state) => state.tick)
  const saveGame = useGameStore((state) => state.saveGame)
  const resumeFromHidden = useGameStore((state) => state.resumeFromHidden)
  const editor = useLayoutEditorStore()
  const preferences = useUiPreferences()
  const appearance = themeColors(preferences.theme, preferences.customTheme)
  const navigation = getNavigationContext(screen)
  const profileSession = useProfileSession()
  const activeProfile = profileSession.activeProfileId ? profileSession.profiles.slots[profileSession.activeProfileId] : null
  const [profileSwitchError, setProfileSwitchError] = useState<string | null>(null)
  const [offlineBankOpen, setOfflineBankOpen] = useState(false)
  const [offlineResultsOpen, setOfflineResultsOpen] = useState(false)
  const lastOfflineBankReport = useGameStore((state) => state.lastOfflineBankReport)
  const lastFrame = useRef(performance.now())
  const hiddenAt = useRef<number | null>(null)
  const hiddenRef = useRef(false)

  useEffect(() => {
    if (!editor.isEditing) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && !(event.target as HTMLElement | null)?.matches('input,select,textarea')) { event.preventDefault(); if (editor.shellInteraction !== 'idle') cancelTopbarInteraction(); else closeLayoutEditor() } }
    const onResize = () => { if (window.innerWidth < 1024) closeLayoutEditor('UI Editor is available on desktop-sized layouts.') }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('resize', onResize) }
  }, [editor.isEditing, editor.shellInteraction])

  useEffect(() => {
    const group = navigation.group.id
    if (group !== 'overview' && preferences.navigationGroups[group] === true) setUiPreferences({ navigationGroups: { ...preferences.navigationGroups, [group]: false } })
  }, [navigation.group.id, preferences.navigationGroups, screen])

  useEffect(() => {
    if (!lastOfflineBankReport) return
    setOfflineResultsOpen(true)
    setOfflineBankOpen(false)
  }, [lastOfflineBankReport])

  useEffect(() => {
    const interval = window.setInterval(() => { if (document.hidden || hiddenRef.current) return; const now = performance.now(); const elapsed = now - lastFrame.current; lastFrame.current = now; tick(elapsed) }, 100)
    const autosave = window.setInterval(() => saveGame('autosave'), AUTOSAVE_INTERVAL_MS)
    const visibility = () => { if (document.hidden) { hiddenAt.current = Date.now(); hiddenRef.current = true; saveGame('visibility') } else if (hiddenAt.current) { resumeFromHidden(Date.now() - hiddenAt.current, false); hiddenAt.current = null; hiddenRef.current = false; lastFrame.current = performance.now(); saveGame('profile-anchor') } }
    const pageHide = () => saveGame('visibility')
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pageHide)
    return () => { window.clearInterval(interval); window.clearInterval(autosave); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pageHide) }
  }, [resumeFromHidden, saveGame, tick])

  const toggleGroup = (id: string) => {
    if (id === 'overview') return
    const groupId = id as keyof typeof preferences.navigationGroups
    setUiPreferences({ navigationGroups: { ...preferences.navigationGroups, [groupId]: !preferences.navigationGroups[groupId] } })
  }
  const openDevTools = () => { dismissGameTooltips(); setOfflineBankOpen(false); setOfflineResultsOpen(false); openDeveloperTools() }
  const toggleEditor = () => { dismissGameTooltips(); if (editor.isEditing) closeLayoutEditor(); else openLayoutEditor(screen, 'shell') }
  const switchProfile = () => { const result = leaveToProfiles(); if (!result.ok) setProfileSwitchError(result.error) }

  return <TooltipProvider><div className="game-shell">
    {preferences.backgroundEffects && <ArcaneAtmosphere accentColor={appearance.accent} opacity={preferences.theme === 'light' ? 0.22 : 0.72} reducedMotion={preferences.reducedMotion} />}
    <Sidebar screen={screen} setScreen={setScreen} preferences={preferences} toggleGroup={toggleGroup} activeProfile={activeProfile} profileSwitchError={profileSwitchError} switchProfile={switchProfile} />
    <main className={`main-area ${editor.isEditing ? 'editor-open' : ''}`}>
      <Topbar screen={screen} editor={editor} offlineBankOpen={offlineBankOpen} onOfflineBankToggle={() => { dismissGameTooltips(); setOfflineResultsOpen(false); setOfflineBankOpen((open) => !open) }} onDeveloperTools={openDevTools} onEditUi={toggleEditor} onSettings={() => { dismissGameTooltips(); setOfflineBankOpen(false); setOfflineResultsOpen(false); setScreen('settings') }} onMobileMenu={() => setScreen('home')} />
      <OfflineBankPopover open={offlineBankOpen} onClose={() => setOfflineBankOpen(false)} onViewLastResults={() => { setOfflineBankOpen(false); setOfflineResultsOpen(true) }} />
      <div className="screen-scroll"><ScreenRouter /></div>
      <ActivityMonitor />
    </main>
    <LayoutEditorDrawer screen={screen} />
    <DeveloperToolsWindow />
    <OfflineBankResultsDialog report={lastOfflineBankReport} open={offlineResultsOpen} onClose={() => setOfflineResultsOpen(false)} onOpenInventory={() => { setOfflineResultsOpen(false); setScreen('inventory') }} />
    {!editor.isEditing && editor.notice && <div className="layout-editor-notice-toast" role="status">{editor.notice}</div>}
    <SaveProtectionNotice />
    <ToastStack />
    <DefeatSummaryModal />
  </div></TooltipProvider>
}
