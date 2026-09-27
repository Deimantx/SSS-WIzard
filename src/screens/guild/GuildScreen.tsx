import { useState } from 'react'
import { LockKeyhole, Shield, Swords } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { ScreenGrid } from '../../components/layout/ScreenGrid'
import { useGameStore } from '../../store/gameStore'
import type { GameStore } from '../../store/gameStore'
import { getGuildPromotionProgress } from '../../game/systems/guild/guildSelectors'
import { useUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import { GuildHeader, GuildTabs } from './GuildHeader'
import { GuildRecommendedContracts, GuildSpecializationSummary } from './GuildOverviewTab'
import { GuildContractsBoard, GuildContractsControls, type GuildContractKindFilter, type GuildContractStatusFilter } from './GuildContractsTab'
import { GuildRankProgress } from './GuildRankProgress'
import { GuildSkillBranches, GuildSkillNote, GuildSkillSummary } from './GuildSkillTreeTab'

export function GuildScreen() {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const activeTab = preferences.screenState.guild.activeTab
  const promotion = getGuildPromotionProgress(state)
  const setActiveTab = (tab: GuildScreenTab) => setUiPreferences({ screenState: { guild: { activeTab: tab } } })
  const [contractStatusFilter, setContractStatusFilter] = useState<GuildContractStatusFilter>('all')
  const [contractKindFilter, setContractKindFilter] = useState<GuildContractKindFilter>('all')

  if (!state.progress.guildUnlocked) return <GuildLockedState state={state} />

  const panels = [
    { id: 'guild-header', content: <GuildHeader state={state} promotion={promotion} /> },
    { id: 'guild-tabs', content: <GuildTabs activeTab={activeTab} onTabChange={setActiveTab} /> },
    ...(activeTab === 'overview' ? [
      { id: 'guild-progression', content: <GuildRankProgress state={state} /> },
      { id: 'guild-recommended-contracts', content: <GuildRecommendedContracts state={state} onNavigate={setActiveTab} /> },
      { id: 'guild-specialization', content: <GuildSpecializationSummary state={state} onNavigate={setActiveTab} /> },
    ] : activeTab === 'contracts' ? [
      { id: 'guild-contract-controls', content: <GuildContractsControls statusFilter={contractStatusFilter} kindFilter={contractKindFilter} onStatusChange={setContractStatusFilter} onKindChange={setContractKindFilter} /> },
      { id: 'guild-contracts', content: <GuildContractsBoard state={state} statusFilter={contractStatusFilter} kindFilter={contractKindFilter} /> },
    ] : [
      { id: 'guild-skills-summary', content: <GuildSkillSummary state={state} /> },
      { id: 'guild-skills', content: <GuildSkillBranches state={state} /> },
      { id: 'guild-skills-note', content: <GuildSkillNote /> },
    ]),
  ]

  return <div className="screen-content guild-v3-screen">
    <main className="guild-v3-main" aria-live="polite"><ScreenGrid screen="guild" panels={panels} /></main>
  </div>
}

function GuildLockedState({ state }: { state: GameStore }) {
  const forestHeartDefeated = state.progress.forestHeartUnlocked ? 1 : 0
  return <div className="screen-content guild-v3-screen guild-v3-locked-screen">
    <div className="screen-header"><div><div className="eyebrow">THE VERDANT CIRCLE</div><h1>A guild invitation, still sealed.</h1><p>Defeat the Forest Heart to unlock Requests, Reputation, and the Initiate to Apprentice progression.</p></div></div>
    <ScreenGrid screen="guild" panels={[{ id: 'guild-locked', content: <GuildLockedCard state={state} forestHeartDefeated={forestHeartDefeated} /> }]} />
  </div>
}

function GuildLockedCard({ state, forestHeartDefeated }: { state: GameStore; forestHeartDefeated: number }) {
  return <section className="guild-v3-lock-card" aria-labelledby="guild-invitation-sealed"><div className="guild-v3-lock-crest"><Shield size={42} strokeWidth={1.2} /><LockKeyhole className="guild-v3-lock-icon" size={17} /></div><span className="guild-v3-kicker">VERDANT CIRCLE · ACCESS CONTROL</span><h2 id="guild-invitation-sealed">Invitation Sealed</h2><p>The Circle is waiting for proof that the tower can survive the forest's first guardian.</p><div className="guild-v3-lock-requirement"><span>FOREST HEART</span><strong>{forestHeartDefeated} / 1</strong></div><GameTooltip content="Open Combat to challenge the Forest Heart and unlock the Guild." block><Button variant="primary" onClick={() => state.setScreen('combat')}><Swords size={15} /> Open Combat</Button></GameTooltip></section>
}

export const GuildScreenV2 = GuildScreen
