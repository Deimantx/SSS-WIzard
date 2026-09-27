import { LockKeyhole, Shield, Swords } from 'lucide-react'
import { Button, GameTooltip } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import type { GameStore } from '../../store/gameStore'
import { getGuildPromotionProgress } from '../../game/systems/guild/guildSelectors'
import { useUiPreferences, setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import type { GuildScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import { GuildHeader } from './GuildHeader'
import { GuildOverviewTab } from './GuildOverviewTab'
import { GuildContractsTab } from './GuildContractsTab'
import { GuildSkillTreeTab } from './GuildSkillTreeTab'

export function GuildScreen() {
  const state = useGameStore()
  const preferences = useUiPreferences()
  const activeTab = preferences.screenState.guild.activeTab
  const promotion = getGuildPromotionProgress(state)
  const setActiveTab = (tab: GuildScreenTab) => setUiPreferences({ screenState: { guild: { activeTab: tab } } })

  if (!state.progress.guildUnlocked) return <GuildLockedState state={state} />

  return <div className="screen-content guild-v3-screen">
    <GuildHeader state={state} promotion={promotion} activeTab={activeTab} onTabChange={setActiveTab} />
    <main className="guild-v3-main" aria-live="polite">
      {activeTab === 'overview' && <GuildOverviewTab state={state} onNavigate={setActiveTab} />}
      {activeTab === 'contracts' && <GuildContractsTab state={state} />}
      {activeTab === 'skills' && <GuildSkillTreeTab state={state} />}
    </main>
  </div>
}

function GuildLockedState({ state }: { state: GameStore }) {
  const forestHeartDefeated = state.progress.forestHeartUnlocked ? 1 : 0
  return <div className="screen-content guild-v3-screen guild-v3-locked-screen">
    <div className="screen-header"><div><div className="eyebrow">THE VERDANT CIRCLE</div><h1>A guild invitation, still sealed.</h1><p>Defeat the Forest Heart to unlock Requests, Reputation, and the Initiate to Apprentice progression.</p></div></div>
    <section className="guild-v3-lock-card" aria-labelledby="guild-invitation-sealed"><div className="guild-v3-lock-crest"><Shield size={42} strokeWidth={1.2} /><LockKeyhole className="guild-v3-lock-icon" size={17} /></div><span className="guild-v3-kicker">VERDANT CIRCLE · ACCESS CONTROL</span><h2 id="guild-invitation-sealed">Invitation Sealed</h2><p>The Circle is waiting for proof that the tower can survive the forest’s first guardian.</p><div className="guild-v3-lock-requirement"><span>FOREST HEART</span><strong>{forestHeartDefeated} / 1</strong></div><GameTooltip content="Open Combat to challenge the Forest Heart and unlock the Guild." block><Button variant="primary" onClick={() => state.setScreen('combat')}><Swords size={15} /> Open Combat</Button></GameTooltip></section>
  </div>
}

export const GuildScreenV2 = GuildScreen
