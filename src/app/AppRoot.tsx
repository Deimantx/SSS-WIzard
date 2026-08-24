import { GameShell } from './GameShell'
import { ProfileSelectScreen } from '../profiles/ProfileSelectScreen'
import { useProfileSession } from '../profiles/profileSessionStore'

export function AppRoot() {
  const session = useProfileSession()
  return session.activeProfileId ? <GameShell /> : <ProfileSelectScreen />
}
