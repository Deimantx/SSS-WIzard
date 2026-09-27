import { useSyncExternalStore } from 'react'
import { clampDeveloperToolsGeometry, getDefaultDeveloperGeometry, loadDeveloperToolsGeometry, saveDeveloperToolsGeometry, type DeveloperToolsGeometry, type DeveloperToolsMode } from './developerToolsWindowGeometry'
import { DEVELOPER_TOOL_IDS, type DeveloperToolsTab } from './developerToolIds'
import { getDefaultDeveloperTool, getDeveloperWorkspace, type DeveloperWorkspaceId } from './developerToolRegistryModel'

export type DeveloperCombatTab = 'live' | 'encounter' | 'boss' | 'actions' | 'status' | 'telemetry' | 'balance'
export type { DeveloperToolsTab } from './developerToolIds'
export type { DeveloperWorkspaceId } from './developerToolRegistryModel'
export interface DeveloperToolsSessionState extends DeveloperToolsGeometry { open: boolean; activeTab: DeveloperToolsTab; activeWorkspace: DeveloperWorkspaceId; combatTab: DeveloperCombatTab; showArtifactDevPanel: boolean; selectedEntityIds: Partial<Record<string, string>>; paneMode: 'browse' | 'inspect' }

export function normalizeDeveloperToolsTab(tab: string): DeveloperToolsTab {
  if (tab === 'equipment') return 'inventory'
  if (tab === 'schools') return 'spells'
  return DEVELOPER_TOOL_IDS.includes(tab as DeveloperToolsTab) ? tab as DeveloperToolsTab : 'quick'
}

const geometry = loadDeveloperToolsGeometry()
export const DEVELOPER_TOOLS_SESSION_KEY = 'sss-wizard-devtools-session-v4'
const LEGACY_DEVELOPER_TOOLS_SESSION_KEY = 'sss-wizard-devtools-session-v3'
const loadSessionPreferences = (): Pick<DeveloperToolsSessionState, 'activeTab' | 'activeWorkspace' | 'combatTab' | 'showArtifactDevPanel' | 'selectedEntityIds' | 'paneMode'> => {
  const defaults = { activeTab: 'quick' as DeveloperToolsTab, activeWorkspace: 'dashboard' as DeveloperWorkspaceId, combatTab: 'live' as DeveloperCombatTab, showArtifactDevPanel: false, selectedEntityIds: {}, paneMode: 'browse' as const }
  if (typeof localStorage === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(DEVELOPER_TOOLS_SESSION_KEY) ?? localStorage.getItem(LEGACY_DEVELOPER_TOOLS_SESSION_KEY)
    const saved = JSON.parse(raw ?? 'null') as { activeTab?: string; activeWorkspace?: DeveloperWorkspaceId; combatTab?: DeveloperCombatTab; showArtifactDevPanel?: boolean; selectedEntityIds?: Partial<Record<string, string>>; paneMode?: 'browse' | 'inspect' } | null
    const combatTabs: DeveloperCombatTab[] = ['live', 'encounter', 'boss', 'actions', 'status', 'telemetry', 'balance']
    const activeTab = normalizeDeveloperToolsTab(saved?.activeTab ?? 'quick')
    const activeWorkspace = saved?.activeWorkspace && ['dashboard', 'player', 'magic', 'tower', 'equipment', 'combat', 'progression', 'system'].includes(saved.activeWorkspace) ? saved.activeWorkspace : getDeveloperWorkspace(activeTab)
    return { activeTab, activeWorkspace, combatTab: combatTabs.includes(saved?.combatTab as DeveloperCombatTab) ? saved!.combatTab! : 'live', showArtifactDevPanel: saved?.showArtifactDevPanel === true, selectedEntityIds: saved?.selectedEntityIds ?? {}, paneMode: saved?.paneMode === 'inspect' ? 'inspect' : 'browse' }
  } catch { return defaults }
}
const sessionPreferences = loadSessionPreferences()
let current: DeveloperToolsSessionState = { open: false, ...sessionPreferences, ...geometry }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const update = (changes: Partial<DeveloperToolsSessionState>, persistGeometry = false) => {
  current = { ...current, ...changes }
  if (persistGeometry) {
    saveDeveloperToolsGeometry(current)
    try {
      const payload = { activeTab: current.activeTab, activeWorkspace: current.activeWorkspace, combatTab: current.combatTab, showArtifactDevPanel: current.showArtifactDevPanel, selectedEntityIds: current.selectedEntityIds, paneMode: current.paneMode }
      localStorage.setItem(DEVELOPER_TOOLS_SESSION_KEY, JSON.stringify(payload))
      // Keep the old key readable for installed builds that have not migrated yet.
      localStorage.setItem('sss-wizard-devtools-session-v3', JSON.stringify(payload))
    } catch { /* Storage is optional. */ }
  }
  emit()
}

export const getDeveloperToolsState = () => current
export const openDeveloperTools = (activeTab: DeveloperToolsTab = current.activeTab) => { const normalized = normalizeDeveloperToolsTab(activeTab); return update({ open: true, activeTab: normalized, activeWorkspace: getDeveloperWorkspace(normalized) }, true) }
export const closeDeveloperTools = () => update({ open: false })
export const toggleDeveloperTools = () => update({ open: !current.open })
export const setDeveloperToolsTab = (activeTab: DeveloperToolsTab) => { const normalized = normalizeDeveloperToolsTab(activeTab); return update({ activeTab: normalized, activeWorkspace: getDeveloperWorkspace(normalized) }, true) }
export const setDeveloperWorkspace = (activeWorkspace: DeveloperWorkspaceId) => update({ activeWorkspace, activeTab: getDefaultDeveloperTool(activeWorkspace) }, true)
export const setDeveloperCombatTab = (combatTab: DeveloperCombatTab) => update({ combatTab }, true)
export const setArtifactDevPanelVisible = (showArtifactDevPanel: boolean) => update({ showArtifactDevPanel }, true)
export const setDeveloperPaneMode = (paneMode: 'browse' | 'inspect') => update({ paneMode }, true)
export const setDeveloperSelectedEntity = (entityType: string, entityId: string | null) => update({ selectedEntityIds: entityId ? { ...current.selectedEntityIds, [entityType]: entityId } : Object.fromEntries(Object.entries(current.selectedEntityIds).filter(([key]) => key !== entityType)) }, true)
export const setDeveloperToolsMode = (mode: DeveloperToolsMode, persist = true) => update({ mode }, persist)
export const setDeveloperToolsGeometry = (next: Partial<DeveloperToolsGeometry>, persist = true) => update(clampDeveloperToolsGeometry({ mode: current.mode, dockedX: current.dockedX, dockedY: current.dockedY, dockedWidth: current.dockedWidth, dockedHeight: current.dockedHeight, ...next }), persist)
export const setDeveloperToolsDockedPosition = (x: number, y: number, persist = true) => setDeveloperToolsGeometry({ dockedX: x, dockedY: y }, persist)
export const setDeveloperToolsDockedSize = (width: number, height: number, persist = true) => setDeveloperToolsGeometry({ dockedWidth: width, dockedHeight: height }, persist)
export const dockDeveloperTools = () => setDeveloperToolsMode('docked')
export const workspaceDeveloperTools = () => setDeveloperToolsMode('workspace')
export const resetDeveloperToolsWindow = () => update({ ...getDefaultDeveloperGeometry(), mode: current.mode }, true)
export const clampDeveloperToolsToViewport = () => update(clampDeveloperToolsGeometry(current), true)
export const useDeveloperToolsStore = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => current, () => current)
