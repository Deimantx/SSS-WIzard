import type { DeveloperToolsTab } from './developerToolsStore'
import { DeveloperActivities } from './tabs/DeveloperActivities'
import { DeveloperCombat } from './tabs/DeveloperCombat'
import { DeveloperInventory } from './tabs/DeveloperInventory'
import { DeveloperOverview } from './tabs/DeveloperOverview'
import { DeveloperPlayer } from './tabs/DeveloperPlayer'
import { DeveloperProgression } from './tabs/DeveloperProgression'
import { DeveloperSaveState } from './tabs/DeveloperSaveState'
import { DeveloperSchools } from './tabs/DeveloperSchools'

export function DeveloperTab({ tab, copy }: { tab: DeveloperToolsTab; copy: (label: string, value: unknown) => Promise<void> }) {
  if (tab === 'overview') return <DeveloperOverview />
  if (tab === 'player') return <DeveloperPlayer />
  if (tab === 'schools') return <DeveloperSchools />
  if (tab === 'inventory') return <DeveloperInventory />
  if (tab === 'combat') return <DeveloperCombat />
  if (tab === 'activities') return <DeveloperActivities />
  if (tab === 'progression') return <DeveloperProgression />
  return <DeveloperSaveState copy={copy} />
}
