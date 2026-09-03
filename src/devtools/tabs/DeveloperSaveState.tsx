import { AlertTriangle, Clipboard, RotateCcw } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import { getUiPreferences, resetAppearance } from '../../ui/preferences/uiPreferencesStore'
import { getLayoutEditorState, resetAllScreenLayouts } from '../../ui/layout-editor/layoutEditorStore'
import { useProfileSession } from '../../profiles/profileSessionStore'
import { profileSaveKey } from '../../profiles/profileKeys'
import { PROFILE_RESET_CONFIRMATION } from '../developerProfileReset'

export function DeveloperSaveState({ copy }: { copy: (label: string, value: unknown) => Promise<void> }) {
  const state = useGameStore()
  const save = useGameStore((game) => game.saveGame)
  const reload = useGameStore((game) => game.reloadFromStorage)
  const reset = useGameStore((game) => game.resetSave)
  const preferences = getUiPreferences()
  const layouts = getLayoutEditorState().document
  const profileSession = useProfileSession()
  const activeProfile = profileSession.activeProfileId ? profileSession.profiles.slots[profileSession.activeProfileId] : null
 return <div className="developer-tab-grid"><Card title="Save and export"><div className="button-row"><Button variant="success" onClick={save}>Save now</Button><Button variant="secondary" onClick={reload}>Reload saved profile</Button><Button variant="ghost" onClick={() => copy('Gameplay state', state)}> <Clipboard size={14} /> Copy gameplay JSON</Button></div><div className="button-row"><Button variant="ghost" onClick={() => copy('UI preferences', preferences)}>Copy UI preferences JSON</Button><Button variant="ghost" onClick={() => copy('UI layout', layouts)}>Copy UI layout JSON</Button></div><div className="developer-diagnostics"><strong>Diagnostics</strong><span>Profile <b>{activeProfile ? `${activeProfile.name} (${activeProfile.slotId})` : 'None selected'}</b></span><span>Profile Save Key <b>{activeProfile ? profileSaveKey(activeProfile.slotId) : '-'}</b></span><span>Mode <b>{activeProfile?.gameMode ?? '-'}  -  {activeProfile?.difficulty ?? '-'}</b></span><span>App version <b>0.1.0</b></span><span>Save schema <b>v{state.saveVersion}</b></span><span>Layout schema <b>v{layouts.version}</b></span><span>Theme <b>{preferences.theme}  -  {preferences.textSize}</b></span><span>Screen ID <b>{state.ui.screen}</b></span><span>Viewport <b>{typeof window === 'undefined' ? '-' : `${window.innerWidth} x ${window.innerHeight}`}</b></span><span>Device pixel ratio <b>{typeof window === 'undefined' ? '-' : window.devicePixelRatio}</b></span></div></Card><Card title="Danger zone"><p className="muted">These controls affect persisted UI or gameplay state and require confirmation.</p><div className="button-row"><Button variant="danger" disabled={!activeProfile} onClick={() => { if (window.confirm(PROFILE_RESET_CONFIRMATION)) reset() }}><RotateCcw size={14} /> Reset Current Profile Progress</Button><Button variant="secondary" onClick={() => { if (window.confirm('Reset UI appearance?')) resetAppearance() }}>Reset UI appearance</Button><Button variant="secondary" onClick={() => { if (window.confirm('Reset UI layouts?')) resetAllScreenLayouts() }}>Reset UI layouts</Button></div><div className="developer-warning"><AlertTriangle size={15} /> UI layout and preferences are stored outside gameplay save.</div></Card></div>
}
