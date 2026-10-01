import type { HuntersOrderScreenTab } from '../../ui/preferences/uiPreferencesTypes'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'
import { setNavigationIntent } from './navigationIntent'
import type { MonsterId } from '../../game/types'

/** Selects the requested Order workspace before navigating into Hunter's Order. */
export function openHuntersOrderTab(tab: HuntersOrderScreenTab) {
  setUiPreferences({ screenState: { huntersOrder: { activeTab: tab } } })
  useGameStore.getState().setScreen('hunters-order')
}

export function openHunterBestiaryEntry(monsterId: MonsterId) {
  setNavigationIntent({ combatLocationId: null, combatMonsterId: monsterId })
  openHuntersOrderTab('bestiary')
}
