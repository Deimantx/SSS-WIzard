import { LockKeyhole, Shield, Swords } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { useGameStore } from '../../store/gameStore'
import type { GameStore } from '../../store/gameStore'
import { getGuildPromotionProgress } from '../../game/systems/guild/guildSelectors'
import { useUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import { GuildHeader, GuildTabs } from './GuildHeader'
import { GuildOverviewAdvancementPanel, GuildOverviewCommissionPanel, GuildOverviewProjectsPanel, GuildOverviewRegistryPanel, GuildOverviewStandingPanel } from './GuildOverviewV4Panels'
import { GuildContractsBoard } from './GuildContractsTab'
import { ArcaneRegistryTab } from './ArcaneRegistryTab'
import { GuildProjectsTab, GuildCommissionChainsTab } from './GuildProjectsTab'
import { GuildAdvancementTab } from './GuildAdvancementTab'
import { GuildStandingTab } from './GuildStandingTab'

export function GuildScreen() {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const activeTab = preferences.screenState.guild.activeTab
  const promotion = getGuildPromotionProgress(state)
  const setActiveTab = (tab: GuildScreenTab) => setUiPreferences({ screenState: { guild: { activeTab: tab } } })

  if (!state.progress.guildUnlocked) {
    if (activeTab !== 'registry') return <GuildLockedState state={state} />
    return <div className="screen-content guild-v3-screen">
      <div className="screen-header"><div><div className="eyebrow">ARCANE GUILD</div><h1>Registry archive</h1><p>Previously discovered items remain available to browse. Defeat the Forest Heart to register new entries.</p></div></div>
      <ScreenGrid screen="arcane-guild" panels={[{ id: 'guild-registry', content: <ArcaneRegistryTab /> }]} />
    </div>
  }

  const panels = [
    { id: 'guild-header', content: <GuildHeader state={state} promotion={promotion} /> },
    { id: 'guild-tabs', content: <GuildTabs activeTab={activeTab} onTabChange={setActiveTab} commissionCount={state.progress.arcaneGuild.availableCommissions.length} /> },
    ...(activeTab === 'overview' ? [
      { id: 'guild-overview-standing', content: <GuildOverviewStandingPanel state={state} onNavigate={setActiveTab} /> },
      { id: 'guild-overview-commission', content: <GuildOverviewCommissionPanel state={state} onNavigate={setActiveTab} /> },
      { id: 'guild-overview-registry', content: <GuildOverviewRegistryPanel state={state} onNavigate={setActiveTab} /> },
      { id: 'guild-overview-advancement', content: <GuildOverviewAdvancementPanel state={state} onNavigate={setActiveTab} /> },
      { id: 'guild-overview-projects', content: <GuildOverviewProjectsPanel state={state} onNavigate={setActiveTab} /> },
    ] : activeTab === 'commissions' ? [
      { id: 'guild-contracts', content: <GuildCommissionWorkspace state={state} studyTab={preferences.screenState.guild.commissionTab} onSelect={(tab) => setUiPreferences({ screenState: { guild: { commissionTab: tab } } })} /> },
    ] : activeTab === 'standing' ? [
      { id: 'guild-standing', content: <GuildStandingTab state={state} /> },
    ] : activeTab === 'projects' ? [{ id: 'guild-projects', content: <GuildProjectsTab /> }]
    : activeTab === 'registry' ? [] : [{ id: 'guild-advancement', content: <GuildAdvancementTab /> }]),
  ]
  const registryPanels = activeTab === 'registry' ? [
    { id: 'guild-header', content: <GuildHeader state={state} promotion={promotion} /> },
    { id: 'guild-tabs', content: <GuildTabs activeTab={activeTab} onTabChange={setActiveTab} commissionCount={state.progress.arcaneGuild.availableCommissions.length} /> },
    { id: 'guild-registry', content: <ArcaneRegistryTab /> },
  ] : panels

  return <div className="screen-content guild-v3-screen">
    <main className="guild-v3-main" aria-live="polite"><ScreenGrid screen="arcane-guild" panels={registryPanels} /></main>
  </div>
}

function GuildCommissionWorkspace({ state, studyTab, onSelect }: { state: GameStore; studyTab: 'board' | 'studies'; onSelect: (tab: 'board' | 'studies') => void }) {
  return <section className="guild-commission-workspace"><div className="guild-commission-subtabs" role="tablist" aria-label="Guild Commissions"><Button role="tab" ariaPressed={studyTab === 'board'} variant={studyTab === 'board' ? 'primary' : 'ghost'} onClick={() => onSelect('board')}>Board</Button><Button role="tab" ariaPressed={studyTab === 'studies'} variant={studyTab === 'studies' ? 'primary' : 'ghost'} onClick={() => onSelect('studies')}>Studies</Button></div>{studyTab === 'board' ? <GuildContractsBoard state={state} /> : <GuildCommissionChainsTab />}</section>
}

function GuildLockedState({ state }: { state: GameStore }) {
  const forestHeartDefeated = state.progress.forestHeartUnlocked ? 1 : 0
  return <div className="screen-content guild-v3-screen guild-v3-locked-screen">
    <div className="screen-header"><div><div className="eyebrow">ARCANE GUILD</div><h1>A guild invitation, still sealed.</h1><p>Defeat the Forest Heart to receive an invitation to the Arcane Guild and open its Registry and commissions.</p></div></div>
    <ScreenGrid screen="arcane-guild" panels={[{ id: 'guild-locked', content: <GuildLockedCard state={state} forestHeartDefeated={forestHeartDefeated} /> }]} />
  </div>
}

function GuildLockedCard({ state, forestHeartDefeated }: { state: GameStore; forestHeartDefeated: number }) {
  return <section className="guild-v3-lock-card" aria-labelledby="guild-invitation-sealed"><div className="guild-v3-lock-crest"><Shield size={42} strokeWidth={1.2} /><LockKeyhole className="guild-v3-lock-icon" size={17} /></div><span className="guild-v3-kicker">ARCANE GUILD · ACCESS CONTROL</span><h2 id="guild-invitation-sealed">Invitation Sealed</h2><p>The Guild awaits proof that the tower can survive the forest’s first guardian.</p><div className="guild-v3-lock-requirement"><span>FOREST HEART</span><strong>{forestHeartDefeated} / 1</strong></div><GameTooltip content="Open Combat to challenge the Forest Heart and unlock the Guild." block><Button variant="primary" onClick={() => state.setScreen('combat')}><Swords size={15} /> Open Combat</Button></GameTooltip></section>
}

export const GuildScreenV2 = GuildScreen
