export type GameFeelEventType = 'craft-complete' | 'unlock' | 'item-gain' | 'equip' | 'focus' | 'error' | 'success'

export interface GameFeelEvent {
  id: string
  type: GameFeelEventType
  x: number
  y: number
  color?: string
  intensity?: number
  createdAt: number
}

export type GameFeelEventInput = Omit<GameFeelEvent, 'id' | 'createdAt'>
