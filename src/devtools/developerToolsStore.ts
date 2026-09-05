import { useSyncExternalStore } from 'react'
import { clampDeveloperToolsGeometry, getDefaultDeveloperGeometry, loadDeveloperToolsGeometry, saveDeveloperToolsGeometry, type DeveloperToolsGeometry, type DeveloperToolsMode } from './developerToolsWindowGeometry'

export type DeveloperToolsTab = 'quick' | 'character' | 'progression' | 'inventory' | 'spells' | 'research' | 'channeling' | 'focus' | 'transmutation' | 'artificing' | 'combat' | 'monsters' | 'statuses' | 'save' | 'diagnostics'
export type DeveloperCombatTab = 'live' | 'encounter' | 'boss' | 'actions' | 'status' | 'telemetry'
export interface DeveloperToolsSessionState extends DeveloperToolsGeometry { open: boolean; activeTab: DeveloperToolsTab; combatTab: DeveloperCombatTab }

export function normalizeDeveloperToolsTab(tab: string): DeveloperToolsTab {
  if (tab === 'equipment') return 'inventory'
  if (tab === 'schools') return 'spells'
  const allowed: DeveloperToolsTab[] = ['quick', 'character', 'progression', 'inventory', 'spells', 'research', 'channeling', 'focus', 'transmutation', 'artificing', 'combat', 'monsters', 'statuses', 'save', 'diagnostics']
  return allowed.includes(tab as DeveloperToolsTab) ? tab as DeveloperToolsTab : 'quick'
}

const geometry = loadDeveloperToolsGeometry()
const DEVELOPER_TOOLS_SESSION_KEY = 'sss-wizard-devtools-session-v3'
const loadSessionPreferences = (): Pick<DeveloperToolsSessionState, 'activeTab' | 'combatTab'> => {
  if (typeof localStorage === 'undefined') return { activeTab: 'quick', combatTab: 'live' }
  try {
    const saved = JSON.parse(localStorage.getItem(DEVELOPER_TOOLS_SESSION_KEY) ?? 'null') as { activeTab?: string; combatTab?: DeveloperCombatTab } | null
    const combatTabs: DeveloperCombatTab[] = ['live', 'encounter', 'boss', 'actions', 'status', 'telemetry']
    return { activeTab: normalizeDeveloperToolsTab(saved?.activeTab ?? 'quick'), combatTab: combatTabs.includes(saved?.combatTab as DeveloperCombatTab) ? saved!.combatTab! : 'live' }
  } catch { return { activeTab: 'quick', combatTab: 'live' } }
}
const sessionPreferences = loadSessionPreferences()
let current: DeveloperToolsSessionState = { open: false, ...sessionPreferences, ...geometry }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const update = (changes: Partial<DeveloperToolsSessionState>, persistGeometry = false) => {
  current = { ...current, ...changes }
  if (persistGeometry) {
    saveDeveloperToolsGeometry(current)
    try { localStorage.setItem(DEVELOPER_TOOLS_SESSION_KEY, JSON.stringify({ activeTab: current.activeTab, combatTab: current.combatTab })) } catch { /* Storage is optional. */ }
  }
  emit()
}

export const getDeveloperToolsState = () => current
export const openDeveloperTools = (activeTab: DeveloperToolsTab = current.activeTab) => update({ open: true, activeTab: normalizeDeveloperToolsTab(activeTab) }, true)
export const closeDeveloperTools = () => update({ open: false })
export const toggleDeveloperTools = () => update({ open: !current.open })
export const setDeveloperToolsTab = (activeTab: DeveloperToolsTab) => update({ activeTab: normalizeDeveloperToolsTab(activeTab) }, true)
export const setDeveloperCombatTab = (combatTab: DeveloperCombatTab) => update({ combatTab }, true)
export const setDeveloperToolsMode = (mode: DeveloperToolsMode, persist = true) => update({ mode }, persist)
export const setDeveloperToolsGeometry = (next: Partial<DeveloperToolsGeometry>, persist = true) => update(clampDeveloperToolsGeometry({ mode: current.mode, dockedX: current.dockedX, dockedY: current.dockedY, dockedWidth: current.dockedWidth, dockedHeight: current.dockedHeight, ...next }), persist)
export const setDeveloperToolsDockedPosition = (x: number, y: number, persist = true) => setDeveloperToolsGeometry({ dockedX: x, dockedY: y }, persist)
export const setDeveloperToolsDockedSize = (width: number, height: number, persist = true) => setDeveloperToolsGeometry({ dockedWidth: width, dockedHeight: height }, persist)
export const dockDeveloperTools = () => setDeveloperToolsMode('docked')
export const workspaceDeveloperTools = () => setDeveloperToolsMode('workspace')
export const resetDeveloperToolsWindow = () => update({ ...getDefaultDeveloperGeometry(), mode: current.mode }, true)
export const clampDeveloperToolsToViewport = () => update(clampDeveloperToolsGeometry(current), true)
export const useDeveloperToolsStore = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => current, () => current)
