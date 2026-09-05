import { DeveloperArtificing } from './tabs/DeveloperArtificing'
import type { DeveloperToolsTab } from './developerToolsStore'
import { DeveloperQuickSetup } from './tabs/DeveloperQuickSetup'
import { DeveloperCombat } from './tabs/DeveloperCombat'
import { DeveloperChanneling } from './tabs/DeveloperChanneling'
import { DeveloperCharacter } from './tabs/DeveloperCharacter'
import { DeveloperDiagnostics } from './tabs/DeveloperDiagnostics'
import { DeveloperFocus } from './tabs/DeveloperFocus'
import { DeveloperTransmutation } from './tabs/DeveloperTransmutation'
import { DeveloperResearch } from './tabs/DeveloperResearch'
import { DeveloperInventory } from './tabs/DeveloperInventory'
import { DeveloperProgression } from './tabs/DeveloperProgression'
import { DeveloperSaveState } from './tabs/DeveloperSaveState'
import { DeveloperSpells } from './tabs/DeveloperSpells'
import { DeveloperMonsters } from './tabs/DeveloperMonsters'
import { DeveloperStatuses } from './tabs/DeveloperStatuses'

export function DeveloperTab({ tab, copy }: { tab: DeveloperToolsTab; copy: (label: string, value: unknown) => Promise<void> }) {
  if (tab === 'quick') return <DeveloperQuickSetup />
  if (tab === 'character') return <DeveloperCharacter />
  if (tab === 'channeling') return <DeveloperChanneling />
  if (tab === 'focus') return <DeveloperFocus />
  if (tab === 'artificing') return <DeveloperArtificing />
  if (tab === 'transmutation') return <DeveloperTransmutation />
  if (tab === 'research') return <DeveloperResearch />
  if (tab === 'inventory') return <DeveloperInventory initialView="all" />
  
  if (tab === 'combat') return <DeveloperCombat copy={copy} />
  if (tab === 'spells') return <DeveloperSpells />
  if (tab === 'monsters') return <DeveloperMonsters />
  if (tab === 'statuses') return <DeveloperStatuses />
  if (tab === 'progression') return <DeveloperProgression />
  if (tab === 'diagnostics') return <DeveloperDiagnostics copy={copy} />
  return <DeveloperSaveState copy={copy} />
}
