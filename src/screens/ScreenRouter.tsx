import { ScreenErrorBoundary } from '../components/errors/ScreenErrorBoundary'
import { useGameStore } from '../store/gameStore'
import type { ScreenId } from '../game/types'
import { CollectionScreen } from './collection/CollectionScreen'
import { BestiaryScreen } from './bestiary/BestiaryScreen'
import { CombatScreenV2 } from './combat/CombatScreen'
import { EquipmentScreenV2 } from './equipment/EquipmentScreen'
import { GuildScreenV2 } from './guild/GuildScreen'
import { HomeScreenV2 } from './home/HomeScreen'
import { InventoryScreenV2 } from './inventory/InventoryScreen'
import { MagicSchoolsScreenV2 } from './schools/MagicSchoolsScreen'
import { SettingsScreenV2 } from './settings/SettingsScreen'
import { TowerChannelingScreen, TowerFocusScreen, TowerResearchScreen, TowerTransmutationScreen, TowerArtificingScreen } from './tower/TowerScreens'
import { ScreenTransitionFrame } from '../ui/game-feel/ScreenTransitionFrame'
import { isScreenUnlocked } from '../game/systems/story/storyProgression'
import { DarkPortalScreen } from './tower/dark-portal/DarkPortalScreen'

function CurrentScreen({ screen }: { screen: ScreenId }) {
  if (screen === 'home') return <HomeScreenV2 />
  if (screen === 'tower-channeling') return <TowerChannelingScreen />
  if (screen === 'tower-focus') return <TowerFocusScreen />
  if (screen === 'tower-research') return <TowerResearchScreen />
  if (screen === 'tower-transmutation') return <TowerTransmutationScreen />
  if (screen === 'tower-artificing') return <TowerArtificingScreen />
  if (screen === 'tower-dark-portal') return <DarkPortalScreen />
  if (screen === 'schools') return <MagicSchoolsScreenV2 />
  if (screen === 'combat') return <CombatScreenV2 />
  if (screen === 'inventory') return <InventoryScreenV2 />
  if (screen === 'equipment') return <EquipmentScreenV2 />
  if (screen === 'guild') return <GuildScreenV2 />
  if (screen === 'collection') return <CollectionScreen />
  if (screen === 'bestiary') return <BestiaryScreen />
  return <SettingsScreenV2 />
}

export function ScreenRouter() {
  const requestedScreen = useGameStore((state) => state.ui.screen)
  const storyProgress = useGameStore((state) => state.storyProgress)
  const screen = isScreenUnlocked({ storyProgress }, requestedScreen) ? requestedScreen : 'home'
  return <ScreenErrorBoundary key={screen} screen={screen}><ScreenTransitionFrame key={screen} screen={screen}><CurrentScreen screen={screen} /></ScreenTransitionFrame></ScreenErrorBoundary>
}
