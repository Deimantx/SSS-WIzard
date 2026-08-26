import { ScreenErrorBoundary } from '../components/errors/ScreenErrorBoundary'
import { useGameStore } from '../store/gameStore'
import { CollectionScreenV2 } from './collection/CollectionScreen'
import { CombatScreenV2 } from './combat/CombatScreen'
import { EquipmentScreenV2 } from './equipment/EquipmentScreen'
import { GuildScreenV2 } from './guild/GuildScreen'
import { HomeScreenV2 } from './home/HomeScreen'
import { InventoryScreenV2 } from './inventory/InventoryScreen'
import { MagicSchoolsScreenV2 } from './schools/MagicSchoolsScreen'
import { SettingsScreenV2 } from './settings/SettingsScreen'
import { TowerChannelingScreen, TowerFocusScreen, TowerResearchScreen, TowerTransmutationScreen } from './tower/TowerScreens'

function CurrentScreen() {
  const screen = useGameStore((state) => state.ui.screen)
  if (screen === 'home') return <HomeScreenV2 />
  if (screen === 'tower-channeling') return <TowerChannelingScreen />
  if (screen === 'tower-focus') return <TowerFocusScreen />
  if (screen === 'tower-research') return <TowerResearchScreen />
  if (screen === 'tower-transmutation') return <TowerTransmutationScreen />
  if (screen === 'schools') return <MagicSchoolsScreenV2 />
  if (screen === 'combat') return <CombatScreenV2 />
  if (screen === 'inventory') return <InventoryScreenV2 />
  if (screen === 'equipment') return <EquipmentScreenV2 />
  if (screen === 'guild') return <GuildScreenV2 />
  if (screen === 'collection') return <CollectionScreenV2 />
  return <SettingsScreenV2 />
}

export function ScreenRouter() {
  const screen = useGameStore((state) => state.ui.screen)
  return <ScreenErrorBoundary key={screen} screen={screen}><CurrentScreen /></ScreenErrorBoundary>
}
