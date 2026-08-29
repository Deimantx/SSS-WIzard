import type { LucideIcon } from 'lucide-react'
import { BookOpen, FlaskConical, Gem, Home, Library, Package, PawPrint, Settings, Shield, Swords, Target, WandSparkles, Zap } from 'lucide-react'
import type { ScreenId } from '../game/types'
import type { NavigationGroupId } from '../ui/preferences/uiPreferencesTypes'

export interface NavigationItem { id: ScreenId; label: string; icon: LucideIcon; hint: string }
export interface NavigationGroup { id: NavigationGroupId | 'overview'; label: string; breadcrumb: string; items: NavigationItem[] }

export const navigationGroups: NavigationGroup[] = [
  { id: 'overview', label: 'Overview', breadcrumb: 'Overview', items: [{ id: 'home', label: 'Overview', icon: Home, hint: 'Your wizard at a glance' }] },
  { id: 'combat', label: 'Combat', breadcrumb: 'Combat', items: [{ id: 'combat', label: 'Combat', icon: Swords, hint: 'Dungeon Atlas' }] },
  { id: 'hero', label: 'Hero', breadcrumb: 'Hero', items: [{ id: 'schools', label: 'Magic Schools', icon: BookOpen, hint: 'XP, levels, and spells' }, { id: 'inventory', label: 'Inventory', icon: Package, hint: 'Materials and loot' }, { id: 'equipment', label: 'Equipment', icon: Shield, hint: 'Build your focus' }, { id: 'collection', label: 'Collection', icon: Gem, hint: 'Items discovered across the tower' }, { id: 'bestiary', label: 'Bestiary', icon: PawPrint, hint: 'Creatures, bosses, traits and loot' }] },
  { id: 'tower', label: 'Wizard Tower', breadcrumb: 'Wizard Tower', items: [{ id: 'tower-channeling', label: 'Channeling', icon: Zap, hint: 'Draw Mana into the tower' }, { id: 'tower-focus', label: 'Focus', icon: Target, hint: 'Review Focus reservations' }, { id: 'tower-transmutation', label: 'Transmutation', icon: WandSparkles, hint: 'Create materials and equipment' }, { id: 'tower-research', label: 'Research', icon: FlaskConical, hint: 'Deepen a Magic School' }] },
  { id: 'world', label: 'World', breadcrumb: 'World', items: [{ id: 'guild', label: 'Guild', icon: Library, hint: 'Requests and rank' }] },
  { id: 'system', label: 'System', breadcrumb: 'System', items: [{ id: 'settings', label: 'Settings / Info', icon: Settings, hint: 'Save and interface settings' }] },
]

const screenMap = new Map(navigationGroups.flatMap((group) => group.items.map((item) => [item.id, { group, item }] as const)))

export const getNavigationContext = (screen: ScreenId) => screenMap.get(screen) ?? screenMap.get('home')!
