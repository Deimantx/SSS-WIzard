export type ProfileSlotId = 'slot-1' | 'slot-2' | 'slot-3'
export type GameModeId = 'default'
export type DifficultyId = 'normal'

export interface ProfileMetadata {
  slotId: ProfileSlotId
  slotNumber: 1 | 2 | 3
  name: string
  gameMode: GameModeId
  difficulty: DifficultyId
  createdAt: number
  lastPlayedAt: number | null
  lastSavedAt: number | null
  unsupportedReason?: string
}

export interface ProfileRegistry {
  version: 1
  slots: Record<ProfileSlotId, ProfileMetadata | null>
}

export const GAME_MODES: Record<GameModeId, { id: GameModeId; name: string; description: string }> = {
  default: { id: 'default', name: 'Default', description: 'Standard SSS Wizard progression.' },
}

export const DIFFICULTIES: Record<DifficultyId, { id: DifficultyId; name: string; description: string }> = {
  normal: { id: 'normal', name: 'Normal', description: 'Standard combat and progression tuning.' },
}
