import { useSyncExternalStore } from 'react'
import { clampDeveloperToolsGeometry, getDefaultDeveloperGeometry, loadDeveloperToolsGeometry, saveDeveloperToolsGeometry, type DeveloperToolsGeometry } from './developerToolsWindowGeometry'

export type DeveloperToolsTab = 'character' | 'progression' | 'inventory' | 'equipment' | 'schools' | 'spells' | 'research' | 'channeling' | 'focus' | 'transmutation' | 'combat' | 'monsters' | 'statuses' | 'save' | 'diagnostics'
export type DeveloperCombatTab = 'live' | 'encounter' | 'boss' | 'actions' | 'status' | 'telemetry'
export interface DeveloperToolsSessionState extends DeveloperToolsGeometry { open: boolean; activeTab: DeveloperToolsTab; combatTab: DeveloperCombatTab }

const geometry = loadDeveloperToolsGeometry()
let current: DeveloperToolsSessionState = { open: false, activeTab: 'character', combatTab: 'live', ...geometry }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const update = (changes: Partial<DeveloperToolsSessionState>, persistGeometry = false) => { current = { ...current, ...changes }; if (persistGeometry) saveDeveloperToolsGeometry(current); emit() }

export const getDeveloperToolsState = () => current
export const openDeveloperTools = (activeTab: DeveloperToolsTab = current.activeTab) => update({ open: true, activeTab })
export const closeDeveloperTools = () => update({ open: false })
export const toggleDeveloperTools = () => update({ open: !current.open })
export const setDeveloperToolsTab = (activeTab: DeveloperToolsTab) => update({ activeTab })
export const setDeveloperCombatTab = (combatTab: DeveloperCombatTab) => update({ combatTab })
export const setDeveloperToolsGeometry = (next: Partial<DeveloperToolsGeometry>, persist = true) => update(clampDeveloperToolsGeometry({ x: current.x, y: current.y, width: current.width, height: current.height, minimized: current.minimized, ...next }), persist)
export const setDeveloperToolsPosition = (x: number, y: number) => setDeveloperToolsGeometry({ x, y }, true)
export const setDeveloperToolsSize = (width: number, height: number) => setDeveloperToolsGeometry({ width, height }, true)
export const minimizeDeveloperTools = () => update({ minimized: true }, true)
export const restoreDeveloperTools = () => update({ minimized: false }, true)
export const resetDeveloperToolsWindow = () => update(getDefaultDeveloperGeometry(), true)
export const clampDeveloperToolsToViewport = () => update(clampDeveloperToolsGeometry(current), true)
export const useDeveloperToolsStore = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => current, () => current)
