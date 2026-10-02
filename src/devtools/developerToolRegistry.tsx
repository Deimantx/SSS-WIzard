import type { ComponentType } from 'react'
import { Activity, Beaker, BookOpen, Boxes, Bug, Castle, CircleGauge, Compass, Crosshair, Gem, Globe2, Hammer, Hexagon, Library, ListChecks, Package, PersonStanding, Save, ScrollText, Sparkles, Swords, Telescope, TowerControl, Wrench, Zap } from 'lucide-react'
import { DeveloperArtificing } from './tabs/DeveloperArtificing'
import { DeveloperArtifacts } from './tabs/DeveloperArtifacts'
import { DeveloperArcaneCore } from './tabs/DeveloperArcaneCore'
import { DeveloperAcolytes } from './tabs/DeveloperAcolytes'
import { DeveloperChanneling } from './tabs/DeveloperChanneling'
import { DeveloperCharacter } from './tabs/DeveloperCharacter'
import { DeveloperChronicles } from './tabs/DeveloperChronicles'
import { DeveloperCombat } from './tabs/DeveloperCombat'
import { DeveloperCombatActions } from './tabs/combat/DeveloperCombatActions'
import { DeveloperCombatBoss } from './tabs/combat/DeveloperCombatBoss'
import { DeveloperCombatEncounter } from './tabs/combat/DeveloperCombatEncounter'
import { DeveloperCombatBalance } from './tabs/combat/DeveloperCombatBalance'
import { DeveloperCombatTelemetry } from './tabs/combat/DeveloperCombatTelemetry'
import { DeveloperCrystals } from './tabs/DeveloperCrystals'
import { DeveloperDiagnostics } from './tabs/DeveloperDiagnostics'
import { DeveloperInventory } from './tabs/DeveloperInventory'
import { DeveloperMonsters } from './tabs/DeveloperMonsters'
import { DeveloperProgression } from './tabs/DeveloperProgression'
import { DeveloperResearch } from './tabs/DeveloperResearch'
import { DeveloperResonance } from './tabs/DeveloperResonance'
import { DeveloperSaveState } from './tabs/DeveloperSaveState'
import { DeveloperSchools } from './tabs/DeveloperSchools'
import { DeveloperSigils } from './tabs/DeveloperSigils'
import { DeveloperSpells } from './tabs/DeveloperSpells'
import { DeveloperStatuses } from './tabs/DeveloperStatuses'
import { DeveloperTransmutation } from './tabs/DeveloperTransmutation'
import { DeveloperUITuning } from './tabs/DeveloperUITuning'
import { DeveloperWorldTier } from './tabs/DeveloperWorldTier'
import { DeveloperUniversalLootTiers } from './tabs/DeveloperUniversalLootTiers'
import { DeveloperDashboardOverview, DeveloperOfflineBank, DeveloperScenarios } from './tabs/DeveloperV4SupportTabs'
import { DEVELOPER_TOOL_METADATA, DEVELOPER_WORKSPACES, type DeveloperToolMetadata, type DeveloperWorkspaceDefinition, type DeveloperWorkspaceId } from './developerToolRegistryModel'
import type { DeveloperToolsTab } from './developerToolIds'

export type DeveloperToolProps = { copy?: (label: string, value: unknown) => Promise<void> }
export type DeveloperToolIcon = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>
export interface DeveloperToolDefinition extends DeveloperToolMetadata { icon: DeveloperToolIcon; component: ComponentType<DeveloperToolProps> }

const noProps = (Component: ComponentType<any>): ComponentType<DeveloperToolProps> => function RegisteredDeveloperTool(props) { return <Component {...props} /> }
const emptyCopy = async () => undefined
const diagnosticsTool: ComponentType<DeveloperToolProps> = function DiagnosticsTool(props) { return <DeveloperDiagnostics copy={props.copy ?? emptyCopy} /> }
const uiTuningTool: ComponentType<DeveloperToolProps> = function UiTuningTool(props) { return <DeveloperUITuning copy={props.copy ?? emptyCopy} /> }

const icons: Record<DeveloperToolsTab, DeveloperToolIcon> = {
  quick: Zap, scenarios: Compass, 'offline-bank': Activity, character: PersonStanding, 'arcane-core': CircleGauge,
  spells: Sparkles, 'magic-schools': BookOpen, resonance: Gem, acolytes: PersonStanding, channeling: TowerControl, research: Telescope,
  transmutation: Beaker, artificing: Hammer, inventory: Package, artifacts: Boxes, crystals: Gem, sigils: Hexagon,
  combat: Swords, 'combat-encounter': Crosshair, 'combat-boss': Swords, 'combat-actions': ListChecks, 'combat-balance': CircleGauge, 'combat-telemetry': Activity, 'universal-loot-tiers': Boxes, 'world-tier': Globe2, monsters: Crosshair, statuses: ListChecks, progression: Castle, chronicles: ScrollText,
  save: Save, diagnostics: Bug, 'ui-tuning': Wrench,
}

const components: Record<DeveloperToolsTab, ComponentType<DeveloperToolProps>> = {
  quick: noProps(DeveloperDashboardOverview), scenarios: noProps(DeveloperScenarios), 'offline-bank': noProps(DeveloperOfflineBank),
  character: noProps(DeveloperCharacter), 'arcane-core': noProps(DeveloperArcaneCore), spells: noProps(DeveloperSpells), 'magic-schools': noProps(DeveloperSchools), resonance: noProps(DeveloperResonance),
  acolytes: noProps(DeveloperAcolytes), channeling: noProps(DeveloperChanneling), research: noProps(DeveloperResearch), transmutation: noProps(DeveloperTransmutation), artificing: noProps(DeveloperArtificing),
  inventory: noProps(DeveloperInventory), artifacts: noProps(DeveloperArtifacts), crystals: noProps(DeveloperCrystals), sigils: noProps(DeveloperSigils),
  combat: noProps(DeveloperCombat), 'combat-encounter': noProps(DeveloperCombatEncounter), 'combat-boss': noProps(DeveloperCombatBoss), 'combat-actions': noProps(DeveloperCombatActions), 'combat-balance': noProps(DeveloperCombatBalance), 'combat-telemetry': noProps(DeveloperCombatTelemetry), 'universal-loot-tiers': noProps(DeveloperUniversalLootTiers), 'world-tier': noProps(DeveloperWorldTier), monsters: noProps(DeveloperMonsters), statuses: noProps(DeveloperStatuses),
  progression: noProps(DeveloperProgression), chronicles: noProps(DeveloperChronicles),
  save: noProps(DeveloperSaveState), diagnostics: diagnosticsTool, 'ui-tuning': uiTuningTool,
}

export const DEVELOPER_TOOL_REGISTRY: readonly DeveloperToolDefinition[] = DEVELOPER_TOOL_METADATA.map((metadata) => ({ ...metadata, icon: icons[metadata.id], component: components[metadata.id] }))
export const DEVELOPER_WORKSPACE_REGISTRY: readonly DeveloperWorkspaceDefinition[] = DEVELOPER_WORKSPACES
export const getDeveloperToolDefinition = (id: string): DeveloperToolDefinition | undefined => DEVELOPER_TOOL_REGISTRY.find((tool) => tool.id === id)
export const getDeveloperWorkspaceTools = (workspace: DeveloperWorkspaceId) => DEVELOPER_TOOL_REGISTRY.filter((tool) => tool.workspace === workspace)
export const searchDeveloperTools = (query: string) => { const normalized = query.trim().toLowerCase(); return normalized ? DEVELOPER_TOOL_REGISTRY.filter((tool) => `${tool.label} ${tool.description} ${tool.keywords.join(' ')}`.toLowerCase().includes(normalized)) : DEVELOPER_TOOL_REGISTRY }
