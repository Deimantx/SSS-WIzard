export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'tower' | 'schools' | 'combat' | 'inventory' | 'equipment' | 'guild' | 'collection' | 'settings'
export type ActivityStatus = 'running' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'completed' | 'locked' | 'recovering'

export type ItemId =
  | 'fire-fragment'
  | 'water-fragment'
  | 'earth-fragment'
  | 'air-fragment'
  | 'wisp-essence'
  | 'grove-bark'
  | 'heartseed'
  | 'apprentice-wand'
  | 'ember-staff'

export type SpellId = 'fire-bolt' | 'water-ward' | 'earth-spike' | 'air-lance'
export type MonsterId = 'forest-wisp' | 'thornling' | 'stone-root' | 'grove-sentinel' | 'forest-heart'

export interface SchoolState { xp: number; level: number }
export interface PlayerState { health: number; maxHealth: number; mana: number; maxMana: number; maxFocus: number; godMode: boolean }
export interface CondenseActivity { running: boolean; element: ElementId; progressMs: number }
export interface ResearchActivity { running: boolean; itemId: ItemId | null; progressMs: number }
export interface TransmutationActivity { running: boolean; recipeId: string | null; progressMs: number }
export interface ActivitiesState {
  autoChannel: boolean
  condense: CondenseActivity
  research: ResearchActivity
  transmutation: TransmutationActivity
  autoCast: Record<SpellId, boolean>
}
export interface StatusEffect { id: 'barrier' | 'thorn-wound' | 'attack-delay'; remainingMs: number; value: number }
export interface CombatState {
  active: boolean
  dungeonId: string | null
  enemyId: MonsterId | null
  enemyHp: number
  enemyMaxHp: number
  enemyBarrier: number
  playerAttackTimerMs: number
  enemyAttackTimerMs: number
  encounterTimerMs: number
  spellCooldowns: Record<SpellId, number>
  playerStatuses: StatusEffect[]
  threatCleared: number
  inBossFight: boolean
  log: string[]
  lastDamageDealt: number
  lastDamageTaken: number
}
export interface ProgressState {
  magicLevelCap: number
  unlockedSpells: SpellId[]
  discoveredMonsters: MonsterId[]
  lifetimeKills: number
  firstBossKill: boolean
  firstMainBossKill: boolean
  guildUnlocked: boolean
  emberStaffUnlocked: boolean
  forestHeartUnlocked: boolean
  autoHuntBossUnlocked: boolean
  guildRank: 'outsider' | 'initiate' | 'apprentice'
  requestProgress: Record<string, number>
}
export interface UiState { screen: ScreenId; showDebug: boolean; editMode: boolean; reducedMotion: boolean }
export interface GameState {
  saveVersion: number
  player: PlayerState
  schools: Record<SchoolId, SchoolState>
  inventory: Partial<Record<ItemId, number>>
  equipment: { weapon: ItemId; focus: ItemId | null }
  activities: ActivitiesState
  combat: CombatState
  progress: ProgressState
  ui: UiState
  offlineBankMs: number
  lastSavedAt: number
  notifications: NotificationItem[]
  channelCooldownMs: number
}
export interface NotificationItem { id: string; text: string; tone: 'info' | 'success' | 'warning' }
export interface FocusReservation {
  id: string
  sourceType: 'autocast' | 'research' | 'condense' | 'transmutation' | 'channeling'
  sourceId: string
  amount: number
  label: string
}
