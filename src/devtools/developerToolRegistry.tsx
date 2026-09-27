import type { ComponentType } from 'react'
import { Activity, Archive, Beaker, BookOpen, Boxes, Bug, Castle, CircleGauge, Compass, Cpu, Crosshair, Database, Gem, Globe2, Hammer, Hexagon, LayoutDashboard, Library, ListChecks, Package, PersonStanding, Save, ScrollText, Settings2, Shield, Sparkles, Swords, Telescope, TowerControl, Wrench, Zap } from 'lucide-react'
import { DeveloperArtificing } from './tabs/DeveloperArtificing'
import { DeveloperArtifacts } from './tabs/DeveloperArtifacts'
import { DeveloperArcaneCore } from './tabs/DeveloperArcaneCore'
import { DeveloperAcolytes } from './tabs/DeveloperAcolytes'
import { DeveloperChanneling } from './tabs/DeveloperChanneling'
import { DeveloperCharacter } from './tabs/DeveloperCharacter'
import { DeveloperChronicles } from './tabs/DeveloperChronicles'
import { DeveloperCombat } from './tabs/DeveloperCombat'
import { DeveloperCrystals } from './tabs/DeveloperCrystals'
import { DeveloperDiagnostics } from './tabs/DeveloperDiagnostics'
import { DeveloperInventory } from './tabs/DeveloperInventory'
import { DeveloperMonsters } from './tabs/DeveloperMonsters'
import { DeveloperProgression } from './tabs/DeveloperProgression'
import { DeveloperQuickSetup } from './tabs/DeveloperQuickSetup'
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
import { DeveloperDashboardOverview, DeveloperOfflineBank, DeveloperScenarios, DeveloperSettings, DeveloperV4TesterPlaceholder } from './tabs/DeveloperV4SupportTabs'
import { DEVELOPER_TOOL_METADATA, DEVELOPER_WORKSPACES, type DeveloperToolMetadata, type DeveloperWorkspaceDefinition, type DeveloperWorkspaceId } from './developerToolRegistryModel'
import type { DeveloperToolsTab } from './developerToolIds'

export type DeveloperToolProps = { copy?: (label: string, value: unknown) => Promise<void> }
export type DeveloperToolIcon = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>
export interface DeveloperToolDefinition extends DeveloperToolMetadata { icon: DeveloperToolIcon; component: ComponentType<DeveloperToolProps> }

const noProps = (Component: ComponentType<any>): ComponentType<DeveloperToolProps> => function RegisteredDeveloperTool(props) { return <Component {...props} /> }
const placeholder = (title: string, description: string, systems: string[]) => function Placeholder() { return <DeveloperV4TesterPlaceholder title={title} description={description} systems={systems} /> }
const emptyCopy = async () => undefined
const diagnosticsTool: ComponentType<DeveloperToolProps> = function DiagnosticsTool(props) { return <DeveloperDiagnostics copy={props.copy ?? emptyCopy} /> }
const uiTuningTool: ComponentType<DeveloperToolProps> = function UiTuningTool(props) { return <DeveloperUITuning copy={props.copy ?? emptyCopy} /> }

const icons: Record<DeveloperToolsTab, DeveloperToolIcon> = {
  quick: Zap, scenarios: Compass, 'offline-bank': Activity, character: PersonStanding, 'arcane-core': CircleGauge,
  spells: Sparkles, schools: BookOpen, resonance: Gem, acolytes: PersonStanding, channeling: TowerControl, research: Telescope,
  transmutation: Beaker, artificing: Hammer, summoning: Shield, inventory: Package, artifacts: Boxes, crystals: Gem, sigils: Hexagon,
  combat: Swords, 'world-tier': Globe2, monsters: Crosshair, statuses: ListChecks, progression: Castle, chronicles: ScrollText,
  guild: Library, archive: Archive, 'story-portal': Globe2, save: Save, diagnostics: Bug, 'ui-tuning': Wrench, settings: Settings2,
}

const components: Record<DeveloperToolsTab, ComponentType<DeveloperToolProps>> = {
  quick: noProps(DeveloperQuickSetup), scenarios: noProps(DeveloperScenarios), 'offline-bank': noProps(DeveloperOfflineBank),
  character: noProps(DeveloperCharacter), 'arcane-core': noProps(DeveloperArcaneCore), spells: noProps(DeveloperSpells), schools: noProps(DeveloperSchools), resonance: noProps(DeveloperResonance),
  acolytes: noProps(DeveloperAcolytes), channeling: noProps(DeveloperChanneling), research: noProps(DeveloperResearch), transmutation: noProps(DeveloperTransmutation), artificing: noProps(DeveloperArtificing),
  summoning: noProps(placeholder('Summoning / Guardians', 'Inspect Guardian unlock, activation, suppression, Mana demand, and combat runtime state.', ['Guardian browser', 'Unlock evidence', 'Combat fixture'])),
  inventory: noProps(DeveloperInventory), artifacts: noProps(DeveloperArtifacts), crystals: noProps(DeveloperCrystals), sigils: noProps(DeveloperSigils),
  combat: noProps(DeveloperCombat), 'world-tier': noProps(DeveloperWorldTier), monsters: noProps(DeveloperMonsters), statuses: noProps(DeveloperStatuses),
  progression: noProps(DeveloperProgression), chronicles: noProps(DeveloperChronicles),
  guild: noProps(placeholder('Guild tester', 'Exercise Guild rank, reputation, contracts, Guild Points, and skill-tree actions through canonical production paths.', ['Ranks and reputation', 'Contracts', 'Skill tree'])),
  archive: noProps(placeholder('Archive discovery', 'Manipulate discovery evidence only; content inspection remains in the owning Inventory, Enemies, and Sigils tools.', ['Items', 'Bestiary', 'Sigils'])),
  'story-portal': noProps(placeholder('Story / Dark Portal', 'Inspect story event state, portal shards, progression, and unlock evidence through canonical APIs.', ['Story events', 'Portal shards', 'Progression'])),
  save: noProps(DeveloperSaveState), diagnostics: diagnosticsTool, 'ui-tuning': uiTuningTool, settings: noProps(DeveloperSettings),
}

export const DEVELOPER_TOOL_REGISTRY: readonly DeveloperToolDefinition[] = DEVELOPER_TOOL_METADATA.map((metadata) => ({ ...metadata, icon: icons[metadata.id], component: components[metadata.id] }))
export const DEVELOPER_WORKSPACE_REGISTRY: readonly DeveloperWorkspaceDefinition[] = DEVELOPER_WORKSPACES
export const getDeveloperToolDefinition = (id: string): DeveloperToolDefinition | undefined => DEVELOPER_TOOL_REGISTRY.find((tool) => tool.id === id)
export const getDeveloperWorkspaceTools = (workspace: DeveloperWorkspaceId) => DEVELOPER_TOOL_REGISTRY.filter((tool) => tool.workspace === workspace)
export const searchDeveloperTools = (query: string) => { const normalized = query.trim().toLowerCase(); return normalized ? DEVELOPER_TOOL_REGISTRY.filter((tool) => `${tool.label} ${tool.description} ${tool.keywords.join(' ')}`.toLowerCase().includes(normalized)) : DEVELOPER_TOOL_REGISTRY }
