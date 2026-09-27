import { useDeveloperToolsStore, type DeveloperCombatTab } from '../developerToolsStore'
import { DeveloperCombatActions } from './combat/DeveloperCombatActions'
import { DeveloperCombatBoss } from './combat/DeveloperCombatBoss'
import { DeveloperCombatEncounter } from './combat/DeveloperCombatEncounter'
import { DeveloperCombatLive } from './combat/DeveloperCombatLive'
import { DeveloperCombatStatus } from './combat/DeveloperCombatStatus'
import { DeveloperCombatTelemetry } from './combat/DeveloperCombatTelemetry'
import { DeveloperCombatBalance } from './combat/DeveloperCombatBalance'

export type DeveloperCopy = (label: string, value: unknown) => Promise<void>
export function DeveloperCombat({ copy }: { copy: DeveloperCopy }) {
  const combatTab = useDeveloperToolsStore().combatTab
  return <div className="developer-combat-lab">
    {combatTab === 'live' && <DeveloperCombatLive />}
    {combatTab === 'encounter' && <DeveloperCombatEncounter />}
    {combatTab === 'boss' && <DeveloperCombatBoss />}
    {combatTab === 'actions' && <DeveloperCombatActions />}
    {combatTab === 'status' && <DeveloperCombatStatus />}
    {combatTab === 'telemetry' && <DeveloperCombatTelemetry copy={copy} />}
    {combatTab === 'balance' && <DeveloperCombatBalance copy={copy} />}
  </div>
}
