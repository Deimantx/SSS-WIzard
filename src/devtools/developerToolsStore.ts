import { useSyncExternalStore } from 'react'

export type DeveloperToolsTab = 'overview' | 'player' | 'schools' | 'inventory' | 'combat' | 'activities' | 'progression' | 'save'
export interface DeveloperToolsSessionState { open: boolean; activeTab: DeveloperToolsTab; search: string }

let current: DeveloperToolsSessionState = { open: false, activeTab: 'overview', search: '' }
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const update = (changes: Partial<DeveloperToolsSessionState>) => { current = { ...current, ...changes }; emit() }

export const getDeveloperToolsState = () => current
export const openDeveloperTools = (activeTab: DeveloperToolsTab = current.activeTab) => update({ open: true, activeTab })
export const closeDeveloperTools = () => update({ open: false })
export const toggleDeveloperTools = () => update({ open: !current.open })
export const setDeveloperToolsTab = (activeTab: DeveloperToolsTab) => update({ activeTab })
export const setDeveloperToolsSearch = (search: string) => update({ search })
export const useDeveloperToolsStore = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => current, () => current)
