import { setDeveloperCombatTab, useDeveloperToolsStore, type DeveloperCombatTab } from '../developerToolsStore'
import { DeveloperCombatActions } from './combat/DeveloperCombatActions'
import { DeveloperCombatBoss } from './combat/DeveloperCombatBoss'
import { DeveloperCombatEncounter } from './combat/DeveloperCombatEncounter'
import { DeveloperCombatLive } from './combat/DeveloperCombatLive'
import { DeveloperCombatStatus } from './combat/DeveloperCombatStatus'
import { DeveloperCombatTelemetry } from './combat/DeveloperCombatTelemetry'

export type DeveloperCopy = (label: string, value: unknown) => Promise<void>
const tabs: Array<{ id: DeveloperCombatTab; label: string }> = [{ id: 'live', label: 'LIVE' }, { id: 'encounter', label: 'ENCOUNTER' }, { id: 'boss', label: 'BOSS' }, { id: 'actions', label: 'ACTIONS' }, { id: 'status', label: 'STATUS' }, { id: 'telemetry', label: 'TELEMETRY' }]

export function DeveloperCombat({ copy }: { copy: DeveloperCopy }) {
  const combatTab = useDeveloperToolsStore().combatTab
  return <div className="developer-combat-lab">
    <nav className="developer-combat-tabs" aria-label="Combat Lab sections" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={combatTab === tab.id} className={combatTab === tab.id ? 'active' : ''} onClick={() => setDeveloperCombatTab(tab.id)}>{tab.label}</button>)}</nav>
    {combatTab === 'live' && <DeveloperCombatLive />}
    {combatTab === 'encounter' && <DeveloperCombatEncounter />}
    {combatTab === 'boss' && <DeveloperCombatBoss />}
    {combatTab === 'actions' && <DeveloperCombatActions />}
    {combatTab === 'status' && <DeveloperCombatStatus />}
    {combatTab === 'telemetry' && <DeveloperCombatTelemetry copy={copy} />}
  </div>
}
