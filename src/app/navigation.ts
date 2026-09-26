import type { LucideIcon } from 'lucide-react'
import { Anvil, BookOpen, CircleDotDashed, FlaskConical, Gem, Home, Library, Package, PawPrint, Settings, Shield, Sparkles, Swords, Users, WandSparkles, Zap } from 'lucide-react'
import type { GameState, ScreenId, StoryEventId } from '../game/types'
import type { NavigationGroupId } from '../ui/preferences/uiPreferencesTypes'
import { isStoryEventTriggered } from '../game/systems/story/storyProgression'
import { isSummoningUnlocked } from '../game/systems/summoning/summoningSelectors'
import { isCrystalSystemUnlocked } from '../game/systems/crystals/crystalRuntime'

export interface NavigationItem { id: ScreenId; label: string; icon: LucideIcon; hint: string; visibility?: { type: 'story-event-triggered'; eventId: StoryEventId } | { type: 'summoning-unlocked' } | { type: 'crystal-unlocked' } | { type: 'tutorial-stage'; stages: GameState['progress']['tutorialStage'][] } }
export interface NavigationGroup { id: NavigationGroupId | 'overview'; label: string; breadcrumb: string; items: NavigationItem[] }

export const navigationGroups: NavigationGroup[] = [
  { id: 'overview', label: 'Overview', breadcrumb: 'Overview', items: [{ id: 'home', label: 'Overview', icon: Home, hint: 'Your wizard at a glance' }] },
  { id: 'combat', label: 'Combat', breadcrumb: 'Combat', items: [{ id: 'combat', label: 'Combat', icon: Swords, hint: 'World navigation and combat' }] },
  { id: 'hero', label: 'Hero', breadcrumb: 'Hero', items: [{ id: 'schools', label: 'Magic Schools', icon: BookOpen, hint: 'XP, levels, and spells' }, { id: 'inventory', label: 'Inventory', icon: Package, hint: 'Materials and loot' }, { id: 'equipment', label: 'Equipment', icon: Shield, hint: 'Build your combat loadout' }, { id: 'arcane-core', label: 'Arcane Core', icon: Sparkles, hint: 'Shape permanent Core power' }, { id: 'crystals', label: 'Crystals', icon: Gem, hint: 'Equip and refine Crystal power', visibility: { type: 'crystal-unlocked' } }] },
  { id: 'tower', label: 'Wizard Tower', breadcrumb: 'Wizard Tower', items: [{ id: 'tower-channeling', label: 'Channeling', icon: Zap, hint: 'Produce Arcane Flux', visibility: { type: 'tutorial-stage', stages: ['first-kill', 'tower-work', 'channeling', 'transmutation', 'research', 'complete'] } }, { id: 'tower-acolytes', label: 'Acolytes', icon: Users, hint: 'Staff parallel Tower work', visibility: { type: 'tutorial-stage', stages: ['first-kill', 'tower-work', 'channeling', 'transmutation', 'research', 'complete'] } }, { id: 'tower-transmutation', label: 'Transmutation', icon: WandSparkles, hint: 'Shape Resonance into materials', visibility: { type: 'tutorial-stage', stages: ['first-kill', 'tower-work', 'channeling', 'transmutation', 'research', 'complete'] } }, { id: 'tower-artificing', label: 'Artificing', icon: Anvil, hint: 'Forge magical equipment', visibility: { type: 'tutorial-stage', stages: ['research', 'complete'] } }, { id: 'tower-research', label: 'Research', icon: FlaskConical, hint: 'Deepen a Magic School', visibility: { type: 'tutorial-stage', stages: ['research', 'complete'] } }, { id: 'tower-summoning', label: 'Summoning', icon: Sparkles, hint: 'Bind an Elemental Guardian', visibility: { type: 'summoning-unlocked' } }, { id: 'tower-dark-portal', label: 'Dark Portal', icon: CircleDotDashed, hint: 'Enter the chamber awakened by the Black Portal Shard', visibility: { type: 'story-event-triggered', eventId: 'edrin-dark-portal-discovery' } }] },
  { id: 'world', label: 'World', breadcrumb: 'World', items: [{ id: 'guild', label: 'Guild', icon: Library, hint: 'Requests and rank' }, { id: 'collection', label: 'Collection', icon: Gem, hint: 'Items discovered across the tower' }, { id: 'bestiary', label: 'Bestiary', icon: PawPrint, hint: 'Creatures, bosses, traits and loot' }] },
  { id: 'system', label: 'System', breadcrumb: 'System', items: [{ id: 'settings', label: 'Settings / Info', icon: Settings, hint: 'Save and interface settings' }] },
]

const screenMap = new Map(navigationGroups.flatMap((group) => group.items.map((item) => [item.id, { group, item }] as const)))

export const getNavigationContext = (screen: ScreenId) => screenMap.get(screen) ?? screenMap.get('home')!

export const isNavigationItemVisible = (item: NavigationItem, state: Pick<GameState, 'storyProgress' | 'progress'>) => {
  if (!item.visibility) return true
  if (item.visibility.type === 'story-event-triggered') return isStoryEventTriggered(state, item.visibility.eventId)
  if (item.visibility.type === 'crystal-unlocked') return isCrystalSystemUnlocked(state)
  if (item.visibility.type === 'tutorial-stage') return item.visibility.stages.includes(state.progress.tutorialStage)
  return isSummoningUnlocked(state)
}
