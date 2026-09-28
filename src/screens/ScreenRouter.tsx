import { ScreenErrorBoundary } from '../components/errors/ScreenErrorBoundary'
import { useGameStore } from '../store/gameStore'
import type { ScreenId } from '../game/types'
import { CombatScreenV2 } from './combat/CombatScreen'
import { EquipmentScreenV2 } from './equipment/EquipmentScreen'
import { GuildScreen } from './guild/GuildScreen'
import { HuntersOrderScreen } from './huntersOrder/HuntersOrderScreen'
import { HomeScreenV2 } from './home/HomeScreen'
import { InventoryScreenV2 } from './inventory/InventoryScreen'
import { MagicSchoolsScreenV2 } from './schools/MagicSchoolsScreen'
import { SettingsScreenV2 } from './settings/SettingsScreen'
import { TowerChannelingScreen, TowerAcolyteScreen, TowerResearchScreen, TowerTransmutationScreen, TowerArtificingScreen, TowerSummoningScreen } from './tower/TowerScreens'
import { ScreenTransitionFrame } from '../ui/game-feel/ScreenTransitionFrame'
import { isScreenNavigationAllowed } from '../app/navigation'
import { DarkPortalScreen } from './tower/dark-portal/DarkPortalScreen'
import { ArcaneCoreScreen } from './arcane-core/ArcaneCoreScreen'
import { CrystalsScreen } from './crystals/CrystalsScreen'
import { StartingSchoolScreen } from './onboarding/StartingSchoolScreen'

function CurrentScreen({ screen }: { screen: ScreenId }) {
  if (screen === 'home') return <HomeScreenV2 />
  if (screen === 'tower-channeling') return <TowerChannelingScreen />
  if (screen === 'tower-acolytes') return <TowerAcolyteScreen />
  if (screen === 'tower-research') return <TowerResearchScreen />
  if (screen === 'tower-transmutation') return <TowerTransmutationScreen />
  if (screen === 'tower-artificing') return <TowerArtificingScreen />
  if (screen === 'tower-summoning') return <TowerSummoningScreen />
  if (screen === 'tower-dark-portal') return <DarkPortalScreen />
  if (screen === 'schools') return <MagicSchoolsScreenV2 />
  if (screen === 'combat') return <CombatScreenV2 />
  if (screen === 'inventory') return <InventoryScreenV2 />
  if (screen === 'equipment') return <EquipmentScreenV2 />
  if (screen === 'arcane-core') return <ArcaneCoreScreen />
  if (screen === 'crystals') return <CrystalsScreen />
  if (screen === 'guild' || screen === 'arcane-guild') return <GuildScreen />
  if (screen === 'hunters-order') return <HuntersOrderScreen />
  if (screen === 'collection') return <GuildScreen />
  if (screen === 'bestiary') return <HuntersOrderScreen />
  return <SettingsScreenV2 />
}

export function ScreenRouter() {
  const requestedScreen = useGameStore((state) => state.ui.screen)
  const storyProgress = useGameStore((state) => state.storyProgress)
  const progress = useGameStore((state) => state.progress)
  if (progress.startingSchoolId === null) return <StartingSchoolScreen />
  const screen = isScreenNavigationAllowed({ storyProgress, progress }, requestedScreen) ? requestedScreen : 'home'
  return <ScreenErrorBoundary key={screen} screen={screen}><ScreenTransitionFrame key={screen} screen={screen}><CurrentScreen screen={screen} /></ScreenTransitionFrame></ScreenErrorBoundary>
}
