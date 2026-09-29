import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useGameStore } from '../store/gameStore'
import { ArcaneAtmosphere } from '../components/ArcaneAtmosphere'
import { ScreenRouter } from '../screens/ScreenRouter'
import { getNavigationContext } from './navigation'
import { setUiPreferences, useUiPreferences } from '../ui/preferences/uiPreferencesStore'
import { themeColors } from '../ui/theme/themePresets'
import { getDeveloperToolsState, openDeveloperTools } from '../devtools/developerToolsStore'
import { DeveloperToolsWindow } from '../devtools/DeveloperToolsWindow'
import { AUTOSAVE_INTERVAL_MS } from '../persistence/saveConstants'
import { useProfileSession } from '../profiles/profileSessionStore'
import { leaveToProfiles } from '../profiles/profileController'
import { Sidebar } from './shell/Sidebar'
import { Topbar } from './shell/Topbar'
import { ActivityMonitor } from './shell/ActivityMonitor'
import { RecipePinsDock } from '../components/recipe-pins/RecipePinsDock'
import { OfflineBankPopover } from './shell/OfflineBankPopover'
import { OfflineBankResultsDialog } from './shell/OfflineBankResultsDialog'
import { ToastStack } from './shell/ToastStack'
import { SaveProtectionNotice } from './shell/SaveProtectionNotice'
import { TooltipProvider, dismissGameTooltips } from '../components/ui/tooltip/Tooltip'
import { DefeatSummaryModal } from '../screens/combat/DefeatSummaryModal'
import { createCursorValue } from '../ui/game-feel/gameCursor'
import { GameFeelLayer } from '../ui/game-feel/GameFeelLayer'
import { ProgressionFeelObserver } from '../ui/game-feel/ProgressionFeelObserver'
import { getAmbientProfile } from '../ui/game-feel/ambientProfiles'
import { GameFeelInteractionLayer } from '../ui/game-feel/GameFeelInteractionLayer'
import { GameFeelAudioObserver } from '../ui/game-feel/GameFeelAudioObserver'
import { NotificationFeelObserver } from '../ui/game-feel/NotificationFeelObserver'
import { AcquisitionFeelObserver } from '../ui/game-feel/AcquisitionFeelObserver'
import { LootRevealLayer } from '../ui/rewards/LootRevealLayer'
import { MilestoneBannerLayer } from '../ui/rewards/MilestoneBannerLayer'
import { clearLootReveals } from '../ui/rewards/lootRevealStore'
import { clearMilestones } from '../ui/rewards/milestoneStore'
import { DiscoveryAttentionObserver } from '../ui/attention/DiscoveryAttentionObserver'
import { getLiveVisibilityTransition } from './liveVisibility'
import { isAllowedNativeDragTarget, isNativeInteractionTarget } from '../ui/game-feel/gameClientInteraction'
import { GameContextMenuProvider } from '../ui/context-menu/GameContextMenuProvider'
import { StoryEventModal } from '../components/story/StoryEventModal'
import { useUITuning } from '../ui/config/uiTuningResolver'
import { ModalPortal, Button } from '../components/ui'
import { restoreAndExitDeveloperSandbox } from '../devtools/developerSandbox'

export function GameShell() {
  const screen = useGameStore((state) => state.ui.screen)
  const setScreen = useGameStore((state) => state.setScreen)
  const legacyArchiveRoute = useGameStore((state) => state.ui.legacyArchiveRoute ?? null)
  const consumeLegacyArchiveRoute = useGameStore((state) => state.consumeLegacyArchiveRoute)
  const tick = useGameStore((state) => state.tick)
  const saveGame = useGameStore((state) => state.saveGame)
  const preferences = useUiPreferences()
  const { style: uiTuningStyle } = useUITuning(screen)
  const appearance = themeColors(preferences.theme, preferences.customTheme)
  const navigation = getNavigationContext(screen)
  const profileSession = useProfileSession()
  const activeProfile = profileSession.activeProfileId ? profileSession.profiles.slots[profileSession.activeProfileId] : null
  const [profileSwitchError, setProfileSwitchError] = useState<string | null>(null)
  const [sandboxSwitchOpen, setSandboxSwitchOpen] = useState(false)
  const [offlineBankOpen, setOfflineBankOpen] = useState(false)
  const [offlineResultsOpen, setOfflineResultsOpen] = useState(false)
  const lastOfflineBankReport = useGameStore((state) => state.lastOfflineBankReport)
  const lastFrame = useRef(performance.now())
  const hiddenRef = useRef(false)

  useEffect(() => {
    const group = navigation.group.id
    if (group !== 'overview' && preferences.navigationGroups[group] === true) setUiPreferences({ navigationGroups: { ...preferences.navigationGroups, [group]: false } })
  }, [navigation.group.id, preferences.navigationGroups, screen])

  useEffect(() => {
    if (legacyArchiveRoute === 'registry' && screen === 'arcane-guild') {
      setUiPreferences({ screenState: { guild: { activeTab: 'registry' } } })
      consumeLegacyArchiveRoute()
    } else if (legacyArchiveRoute === 'bestiary' && screen === 'hunters-order') {
      setUiPreferences({ screenState: { huntersOrder: { activeTab: 'bestiary' } } })
      consumeLegacyArchiveRoute()
    }
  }, [consumeLegacyArchiveRoute, legacyArchiveRoute, screen])

  useEffect(() => {
    if (!lastOfflineBankReport) return
    setOfflineResultsOpen(true)
    setOfflineBankOpen(false)
  }, [lastOfflineBankReport])

  useEffect(() => {
    clearLootReveals()
    clearMilestones()
  }, [profileSession.activeProfileId])

  useEffect(() => {
    const interval = window.setInterval(() => { if (document.hidden || hiddenRef.current) return; const now = performance.now(); const elapsed = now - lastFrame.current; lastFrame.current = now; tick(elapsed) }, 100)
    const autosave = window.setInterval(() => { if (!getDeveloperToolsState().sandbox.active) saveGame('autosave') }, AUTOSAVE_INTERVAL_MS)
    const visibility = () => { const transition = getLiveVisibilityTransition(document.hidden, performance.now(), lastFrame.current); hiddenRef.current = transition.hidden; lastFrame.current = transition.lastFrame; if (transition.shouldSaveSafetyAnchor && !getDeveloperToolsState().sandbox.active) saveGame('visibility') }
    const pageHide = () => { if (!getDeveloperToolsState().sandbox.active) saveGame('visibility') }
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pageHide)
    return () => { window.clearInterval(interval); window.clearInterval(autosave); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pageHide) }
  }, [saveGame, tick])

  const toggleGroup = (id: string) => {
    if (id === 'overview') return
    const groupId = id as keyof typeof preferences.navigationGroups
    setUiPreferences({ navigationGroups: { ...preferences.navigationGroups, [groupId]: !preferences.navigationGroups[groupId] } })
  }
  const openDevTools = () => { dismissGameTooltips(); setOfflineBankOpen(false); setOfflineResultsOpen(false); openDeveloperTools() }
  const switchProfile = () => {
    if (getDeveloperToolsState().sandbox.active) { setProfileSwitchError(null); setSandboxSwitchOpen(true); return }
    const result = leaveToProfiles()
    if (!result.ok) setProfileSwitchError(result.error)
  }
  const restoreAndSwitchProfile = () => {
    if (!restoreAndExitDeveloperSandbox()) { setProfileSwitchError('No Sandbox snapshot is available.'); setSandboxSwitchOpen(false); return }
    const result = leaveToProfiles()
    setSandboxSwitchOpen(false)
    if (!result.ok) setProfileSwitchError(result.error)
  }

  const ambient = getAmbientProfile(screen, appearance)
  const atmosphereOpacity = preferences.theme === 'light' ? 0.22 : 0.72
  const shellStyle = { ...uiTuningStyle, '--game-cursor-default': createCursorValue({ accent: appearance.accent, secondary: appearance.secondary, variant: 'default' }), '--game-cursor-action': createCursorValue({ accent: appearance.accent, secondary: appearance.secondary, variant: 'action' }), '--game-cursor-disabled': createCursorValue({ accent: appearance.accent, secondary: appearance.secondary, variant: 'disabled' }), '--ambient-strength': ambient.intensity, '--ambient-drift': preferences.reducedMotion ? '0s' : `${ambient.driftDuration}s`, '--ambient-accent': ambient.accentColor, '--ambient-secondary': ambient.secondaryColor, '--ambient-fog-opacity': ambient.fogOpacity, '--ambient-vignette-opacity': ambient.vignetteOpacity, '--ambient-particle-speed': ambient.particleSpeed, '--ambient-bias-x': ambient.biasX, '--ambient-bias-y': ambient.biasY } as CSSProperties
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--ui-tuning-tooltip-max-width', uiTuningStyle['--ui-tuning-tooltip-max-width'])
    root.style.setProperty('--ui-tuning-tooltip-padding-x', uiTuningStyle['--ui-tuning-tooltip-padding-x'])
    root.style.setProperty('--ui-tuning-tooltip-padding-y', uiTuningStyle['--ui-tuning-tooltip-padding-y'])
    root.style.setProperty('--ui-tuning-tooltip-font-size', uiTuningStyle['--ui-tuning-tooltip-font-size'])
    root.style.setProperty('--ui-tuning-tooltip-line-height', uiTuningStyle['--ui-tuning-tooltip-line-height'])
  }, [uiTuningStyle['--ui-tuning-tooltip-max-width'], uiTuningStyle['--ui-tuning-tooltip-padding-x'], uiTuningStyle['--ui-tuning-tooltip-padding-y'], uiTuningStyle['--ui-tuning-tooltip-font-size'], uiTuningStyle['--ui-tuning-tooltip-line-height']])
  return <TooltipProvider><GameContextMenuProvider><div className={`game-shell ${preferences.reducedMotion ? 'reduced-motion' : 'motion-enabled'} ${preferences.customCursor ? 'cursor-enabled' : ''} ${preferences.backgroundEffects ? 'effects-enabled' : 'effects-disabled'}`} data-nav-group={navigation.group.id} data-ambient-profile={ambient.id} data-background-effects={preferences.backgroundEffects ? 'on' : 'off'} style={shellStyle} onContextMenu={(event) => { if (!isNativeInteractionTarget(event.target)) event.preventDefault() }} onDragStart={(event) => { if (!isAllowedNativeDragTarget(event.target)) event.preventDefault() }}>
    {preferences.backgroundEffects && <ArcaneAtmosphere accentColor={ambient.accentColor} secondaryColor={ambient.secondaryColor} opacity={atmosphereOpacity} intensity={ambient.intensity} particleSpeed={ambient.particleSpeed} reducedMotion={preferences.reducedMotion} />}
    <Sidebar screen={screen} setScreen={setScreen} preferences={preferences} toggleGroup={toggleGroup} activeProfile={activeProfile} profileKey={profileSession.activeProfileId} profileSwitchError={profileSwitchError} switchProfile={switchProfile} />
    <main className="main-area">
      <Topbar screen={screen} offlineBankOpen={offlineBankOpen} onOfflineBankToggle={() => { dismissGameTooltips(); setOfflineResultsOpen(false); setOfflineBankOpen((open) => !open) }} onDeveloperTools={openDevTools} onSettings={() => { dismissGameTooltips(); setOfflineBankOpen(false); setOfflineResultsOpen(false); setScreen('settings') }} onMobileMenu={() => setScreen('home')} />
      <OfflineBankPopover open={offlineBankOpen} onClose={() => setOfflineBankOpen(false)} onViewLastResults={() => { setOfflineBankOpen(false); setOfflineResultsOpen(true) }} />
      <div className="screen-scroll"><ScreenRouter /></div>
      <RecipePinsDock />
      <ActivityMonitor />
    </main>
    <ProgressionFeelObserver profileKey={profileSession.activeProfileId} />
    <DiscoveryAttentionObserver profileKey={profileSession.activeProfileId} />
    <NotificationFeelObserver />
    <AcquisitionFeelObserver />
    <GameFeelAudioObserver />
    <GameFeelInteractionLayer />
    <GameFeelLayer />
    <DeveloperToolsWindow />
    <ModalPortal open={sandboxSwitchOpen} onClose={() => setSandboxSwitchOpen(false)} ariaLabel="Developer Sandbox profile switch" backdropClassName="sandbox-switch-backdrop" surfaceClassName="sandbox-switch-dialog"><div className="sandbox-switch-content"><span className="eyebrow">PROFILE SWITCH</span><h2>Developer Sandbox is active</h2><p>Restore the captured profile state before switching profiles. Sandbox changes will be discarded.</p><div className="sandbox-switch-actions"><Button variant="primary" onClick={restoreAndSwitchProfile}>RESTORE &amp; SWITCH</Button><Button variant="ghost" onClick={() => setSandboxSwitchOpen(false)}>CANCEL</Button></div></div></ModalPortal>
    <OfflineBankResultsDialog report={lastOfflineBankReport} open={offlineResultsOpen} onClose={() => setOfflineResultsOpen(false)} onOpenInventory={() => { setOfflineResultsOpen(false); setScreen('inventory') }} />
    <div className="global-feedback-stack">
      <SaveProtectionNotice />
      <ToastStack />
      <MilestoneBannerLayer />
      <LootRevealLayer />
    </div>
    <DefeatSummaryModal />
    <StoryEventModal />
  </div></GameContextMenuProvider></TooltipProvider>
}
