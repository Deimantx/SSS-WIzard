import { Clipboard, RotateCcw } from 'lucide-react'
import { Button, Card } from '../../components/ui'
import { useState } from 'react'
import { useGameStore } from '../../store/gameStore'
import { getUiPreferences, resetAppearance } from '../../ui/preferences/uiPreferencesStore'
import { useProfileSession } from '../../profiles/profileSessionStore'
import { profileSaveKey } from '../../profiles/profileKeys'
import { PROFILE_RESET_CONFIRMATION } from '../developerProfileReset'
import { DeveloperConfirmModal } from '../components/DeveloperConfirmModal'
import packageMetadata from '../../../package.json'

export function DeveloperSaveState({ copy }: { copy: (label: string, value: unknown) => Promise<void> }) {
  const state = useGameStore()
  const save = useGameStore((game) => game.saveGame)
  const reload = useGameStore((game) => game.reloadFromStorage)
  const reset = useGameStore((game) => game.resetSave)
  const preferences = getUiPreferences()
  const profileSession = useProfileSession()
  const activeProfile = profileSession.activeProfileId ? profileSession.profiles.slots[profileSession.activeProfileId] : null
  const [confirmation, setConfirmation] = useState<'profile' | 'appearance' | null>(null)
  const profileConfirmation = confirmation === 'profile'
  return <div className="developer-tab-grid"><Card title="Save and export"><div className="button-row"><Button variant="success" onClick={save}>Save now</Button><Button variant="secondary" onClick={reload}>Reload saved profile</Button><Button variant="ghost" onClick={() => copy('Gameplay state', state)}> <Clipboard size={14} /> Copy gameplay JSON</Button></div><div className="button-row"><Button variant="ghost" onClick={() => copy('UI preferences', preferences)}>Copy UI preferences JSON</Button></div><div className="developer-diagnostics"><strong>Diagnostics</strong><span>Profile <b>{activeProfile ? `${activeProfile.name} (${activeProfile.slotId})` : 'None selected'}</b></span><span>Profile Save Key <b>{activeProfile ? profileSaveKey(activeProfile.slotId) : '-'}</b></span><span>Mode <b>{activeProfile?.gameMode ?? '-'}  -  {activeProfile?.difficulty ?? '-'}</b></span><span>App version <b>{packageMetadata.version}</b></span><span>Save schema <b>v{state.saveVersion}</b></span><span>Theme <b>{preferences.theme}  -  {preferences.textSize}</b></span><span>Screen ID <b>{state.ui.screen}</b></span><span>Viewport <b>{typeof window === 'undefined' ? '-' : `${window.innerWidth} x ${window.innerHeight}`}</b></span><span>Device pixel ratio <b>{typeof window === 'undefined' ? '-' : window.devicePixelRatio}</b></span></div></Card><Card title="Danger zone"><p className="muted">These controls affect persisted UI or gameplay state and require confirmation.</p><div className="button-row"><Button variant="danger" disabled={!activeProfile} onClick={() => setConfirmation('profile')}><RotateCcw size={14} /> Reset Current Profile Progress</Button><Button variant="secondary" onClick={() => setConfirmation('appearance')}>Reset UI appearance</Button></div></Card><DeveloperConfirmModal open={profileConfirmation} title="Reset current profile progress?" mutation="PROFILE CHANGE · DESTRUCTIVE" changes={[PROFILE_RESET_CONFIRMATION]} remains={['Developer session state', 'UI appearance and custom layouts']} confirmLabel="RESET PROFILE" onCancel={() => setConfirmation(null)} onConfirm={() => { setConfirmation(null); reset() }} /><DeveloperConfirmModal open={confirmation === 'appearance'} title="Reset UI appearance?" mutation="UI PREFERENCE CHANGE" changes={['Theme, typography, and appearance preferences']} remains={['Gameplay progress', 'Developer runtime overrides']} onCancel={() => setConfirmation(null)} onConfirm={() => { setConfirmation(null); resetAppearance() }} /></div>
}
