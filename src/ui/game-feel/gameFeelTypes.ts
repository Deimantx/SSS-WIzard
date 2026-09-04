export type GameFeelEventType = 'craft-complete' | 'unlock'

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
