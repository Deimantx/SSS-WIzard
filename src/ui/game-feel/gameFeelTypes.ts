import type { UiSoundName } from './audio/uiAudioEngine'

export type GameFeelEventType = 'craft-complete' | 'unlock' | 'item-gain' | 'equip' | 'unequip' | 'protect' | 'unprotect' | 'sell' | 'destroy' | 'autocast-on' | 'autocast-off' | 'focus' | 'echo' | 'error' | 'success'

export interface GameFeelEvent {
  id: string
  type: GameFeelEventType
  x: number
  y: number
  color?: string
  intensity?: number
  /** Optional semantic audio override. `false` explicitly keeps this visual event silent. */
  sound?: UiSoundName | false
  createdAt: number
}

export type GameFeelEventInput = Omit<GameFeelEvent, 'id' | 'createdAt'>
