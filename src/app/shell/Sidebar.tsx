import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ScreenId } from '../../game/types'
import { navigationGroups } from '../navigation'
import type { UiPreferences } from '../../ui/preferences/uiPreferencesTypes'
import { GameTooltip } from '../../components/ui/tooltip/Tooltip'
import { useSaveDiagnosticsStore } from '../../persistence/saveDiagnosticsStore'
import { hasUnseenAttention, useProfileAttention } from '../../ui/attention/attentionStore'

interface SidebarProps {
  screen: ScreenId
  setScreen: (screen: ScreenId) => void
  preferences: UiPreferences
  toggleGroup: (id: string) => void
  activeProfile: { slotNumber: number; name: string } | null
  profileKey: string | null
  profileSwitchError: string | null
  switchProfile: () => void
}

export function Sidebar({ screen, setScreen, preferences, toggleGroup, activeProfile, profileKey, profileSwitchError, switchProfile }: SidebarProps) {
  const saveDiagnostics = useSaveDiagnosticsStore()
  const attention = useProfileAttention(profileKey)
  const saveBlocked = saveDiagnostics.health === 'protected'
  const saveError = saveDiagnostics.health === 'error'
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">SSS</div><div><strong>SSS Wizard</strong><span>Arcane incremental RPG</span></div></div>
    <nav className="nav-list" aria-label="Main navigation">
      {navigationGroups.map((group) => {
        const collapsed = group.id !== 'overview' && preferences.navigationGroups[group.id] === true
        return <section className={`nav-group ${collapsed ? 'collapsed' : ''}`} key={group.id}>
          <button className="nav-group-header" onClick={() => toggleGroup(group.id)} aria-label={`Toggle ${group.label} group`} aria-expanded={!collapsed}><span>{group.label}</span>{group.id !== 'overview' && (collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />)}</button>
          <div className="nav-group-items" aria-hidden={collapsed} inert={collapsed}>{group.items.map(({ id, label, icon: Icon, hint }) => { const destination = id === 'inventory' || id === 'collection' || id === 'bestiary' || id === 'schools' || id === 'tower-transmutation' || id === 'tower-artificing' ? id === 'tower-transmutation' ? 'transmutation' : id === 'tower-artificing' ? 'artificing' : id : null; const hasNew = destination ? hasUnseenAttention(attention, destination) : false; return <GameTooltip block key={id} content={hasNew ? `${hint} · New discoveries available` : hint}><button key={id} className={`nav-item ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)} aria-label={`${label}${hasNew ? ', new discoveries available' : ''}`}><Icon size={16} /><span>{label}</span>{hasNew && <i className="nav-attention-dot" aria-hidden="true" />}{screen === id && <ChevronRight className="nav-chevron" size={14} />}</button></GameTooltip> })}</div>
        </section>
      })}
    </nav>
    <div className="sidebar-foot"><div className={`save-dot ${saveBlocked ? 'is-blocked' : saveError ? 'is-error' : ''}`}><span /> {saveBlocked ? 'Autosave: BLOCKED' : saveError ? 'Autosave: ERROR' : 'Autosave · 30s'}</div><div className="version">Profile {activeProfile?.slotNumber ?? '-'} · {activeProfile?.name ?? 'No profile'}</div>{profileSwitchError && <small className="profile-switch-error" role="alert">{profileSwitchError}</small>}<GameTooltip content="Return to Profile Selection"><button className="profile-switch-button" onClick={switchProfile}>Switch Profile</button></GameTooltip></div>
  </aside>
}
