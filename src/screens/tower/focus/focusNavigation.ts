import type { FocusReservation, ScreenId } from '../../../game/types'

export const FOCUS_NAVIGATION: Record<FocusReservation['sourceType'], ScreenId> = {
  channeling: 'tower-channeling',
  research: 'tower-research',
  transmutation: 'tower-transmutation',
  autocast: 'combat',
}

export const getFocusReservationDestination = (sourceType: FocusReservation['sourceType']) => FOCUS_NAVIGATION[sourceType]
