import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ScreenId } from '../../game/types'
import { navigationGroups } from '../navigation'
import type { UiPreferences } from '../../ui/preferences/uiPreferencesTypes'

interface SidebarProps {
  screen: ScreenId
  setScreen: (screen: ScreenId) => void
  preferences: UiPreferences
  toggleGroup: (id: string) => void
  activeProfile: { slotNumber: number; name: string } | null
  profileSwitchError: string | null
  switchProfile: () => void
}

export function Sidebar({ screen, setScreen, preferences, toggleGroup, activeProfile, profileSwitchError, switchProfile }: SidebarProps) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">SSS</div><div><strong>SSS Wizard</strong><span>Arcane incremental RPG</span></div></div>
    <nav className="nav-list" aria-label="Main navigation">
      {navigationGroups.map((group) => {
        const collapsed = group.id !== 'overview' && preferences.navigationGroups[group.id] === true
        return <section className={`nav-group ${collapsed ? 'collapsed' : ''}`} key={group.id}>
          <button className="nav-group-header" onClick={() => toggleGroup(group.id)} aria-label={`Toggle ${group.label} group`} aria-expanded={!collapsed}><span>{group.label}</span>{group.id !== 'overview' && (collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />)}</button>
          {!collapsed && <div className="nav-group-items">{group.items.map(({ id, label, icon: Icon, hint }) => <button key={id} className={`nav-item ${screen === id ? 'active' : ''}`} onClick={() => setScreen(id)} title={hint}><Icon size={16} /><span>{label}</span>{screen === id && <ChevronRight className="nav-chevron" size={14} />}</button>)}</div>}
        </section>
      })}
    </nav>
    <div className="sidebar-foot"><div className="save-dot"><span /> Autosave · 30s</div><div className="version">Profile {activeProfile?.slotNumber ?? '-'} · {activeProfile?.name ?? 'No profile'}</div>{profileSwitchError && <small className="profile-switch-error" role="alert">{profileSwitchError}</small>}<button className="profile-switch-button" onClick={switchProfile} title="Return to Profile Selection">Switch Profile</button></div>
  </aside>
}

