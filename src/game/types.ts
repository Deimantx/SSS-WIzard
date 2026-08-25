export type SchoolId = 'fire' | 'water' | 'earth' | 'air'
export type ElementId = SchoolId
export type ScreenId = 'home' | 'combat' | 'schools' | 'inventory' | 'equipment' | 'collection' | 'tower-channeling' | 'tower-focus' | 'tower-condensation' | 'tower-research' | 'tower-transmutation' | 'guild' | 'settings'
export type ActivityStatus = 'running' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'completed' | 'locked' | 'recovering'

export type ItemId =
  | 'fire-fragment'
  | 'water-fragment'
  | 'earth-fragment'
  | 'air-fragment'
  | 'wisp-essence'
  | 'grove-bark'
  | 'heartseed'
  | 'life-essence'
  | 'apprentice-wand'
  | 'ember-staff'
  | 'tide-focus'
  | 'stoneweave-robe'
  | 'windthread-charm'

export type SpellId = 'fire-bolt' | 'water-ward' | 'earth-spike' | 'air-lance' | 'ignite' | 'flow-mend' | 'stoneguard' | 'quickening'
export type MonsterId = 'forest-wisp' | 'thornling' | 'stone-root' | 'grove-sentinel' | 'forest-heart'
export type DungeonId = 'whispering-woods'
export type EquipmentSlot = 'weapon' | 'robe' | 'focus' | 'charm'
export type ItemCategory = 'elemental' | 'monster-loot' | 'equipment' | 'boss-loot'
export type SpellType = 'damage' | 'heal' | 'barrier' | 'dot' | 'buff'
export type StatusId = 'barrier' | 'thorn-wound' | 'burning' | 'attack-delay' | 'quickening'
export type ManaPillarId = 'leyline-conduit' | 'arcane-reservoir' | 'mana-resonance' | 'astral-expansion' | 'echo-attunement'
export type ChannelingDiscoveryId = 'stable-leyline' | 'echo-resonance' | 'deep-reservoir'

export type AutoCastCondition = { type: 'always' } | { type: 'health-below'; percent: number } | { type: 'barrier-below'; value: number }
export type SpellEffect =
  | { type: 'damage'; amount: number }
  | { type: 'heal'; amount: number }
  | { type: 'barrier'; amount: number }
  | { type: 'dot'; statusId: StatusId; durationMs: number; damagePerTick: number; tickMs: number }
  | { type: 'buff'; statusId: StatusId; durationMs: number; value: number }

export interface EquipmentStats {
  basicDamage?: number
  maxHealth?: number
  maxMana?: number
  manaRegen?: number
  maxFocus?: number
  barrierReceived?: number
  fireSpellDamagePct?: number
  waterBarrierPct?: number
  earthSpellDamagePct?: number
  airSpellDamagePct?: number
}

export interface ItemDefinition {
  id: ItemId
  name: string
  description: string
  icon: string
  color: string
  kind: 'material' | 'equipment'
  category: ItemCategory
  source: string
  equipmentSlot?: EquipmentSlot
  stats?: EquipmentStats
  researchSchool?: SchoolId
  researchXp?: number
  lockedByDefault?: boolean
}

export interface SpellDefinition {
  id: SpellId
  name: string
  school: SchoolId
  description: string
  unlockLevel: number
  manaCost: number
  cooldownMs: number
  autoCastFocus: number
  type: SpellType
  effect: SpellEffect
  damage?: number
  barrier?: number
  autoCondition?: AutoCastCondition
}

export interface MonsterActionStep {
  id: string
  name: string
  kind: 'basic' | 'special'
  specialAttackId?: string
}

export interface SpecialAttackDefinition {
  id: string
  name: string
  telegraphMs: number
  description: string
  effect: 'damage' | 'damage-thorn' | 'damage-delay' | 'barrier' | 'heal'
  amount: number
  delayMs?: number
}

export interface SchoolState { xp: number; level: number }
export interface PlayerState { health: number; maxHealth: number; mana: number; maxMana: number; maxFocus: number; baseMaxHealth: number; baseMaxMana: number; baseMaxFocus: number; godMode: boolean }
export interface CondenseActivity { running: boolean; element: ElementId; progressMs: number }
export interface ChannelingActivity { echoesAssigned: number }
export type ResearchStatus = 'idle' | 'running' | 'paused' | 'waiting-mana' | 'waiting-focus' | 'level-cap' | 'missing-item' | 'completed'
export interface ResearchActivity { running: boolean; itemId: ItemId | null; targetSchoolId: SchoolId | null; requestedQuantity: number; remainingQuantity: number; progressMs: number; durationPerItemMs: number; xpPerItem: number; manaPerItem: number; focusCost: number; status: ResearchStatus }
export interface TransmutationActivity { running: boolean; recipeId: string | null; progressMs: number }
export interface ActivitiesState {
  channeling: ChannelingActivity
  condense: CondenseActivity
  research: ResearchActivity
  transmutation: TransmutationActivity
  autoCast: Record<SpellId, boolean>
}
export interface StatusEffect { id: StatusId; remainingMs: number; value: number; tickIntervalMs?: number; nextTickMs?: number }
export interface CombatState {
  active: boolean
  dungeonId: DungeonId | null
  enemyId: MonsterId | null
  enemyHp: number
  enemyMaxHp: number
  enemyBarrier: number
  enemyActionIndex: number
  enemyActionTimerMs: number
  enemyIntervalMs: number
  enemyTelegraphMs: number
  enemyTelegraphActionId: string | null
  enemySpecialUsed: Record<string, boolean>
  pendingBossId: 'grove-sentinel' | null
  playerAttackTimerMs: number
  enemyAttackTimerMs: number
  encounterTimerMs: number
  spellCooldowns: Record<SpellId, number>
  playerStatuses: StatusEffect[]
  enemyStatuses: StatusEffect[]
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
  guildReputation: number
  requestClaims: Record<string, boolean>
  permanentFocusBonuses: Record<string, number>
  lifetimeKillsByMonster: Partial<Record<MonsterId, number>>
  bossKillsByBoss: Partial<Record<'grove-sentinel' | 'forest-heart', number>>
  autoHuntBossByDungeon: Record<DungeonId, boolean>
  channeling: ChannelingProgress
}

export interface ChannelingProgress {
  pillars: Record<ManaPillarId, ManaPillarState>
  totalManaGenerated: number
  fiveEchoSustainMs: number
  discoveries: Record<ChannelingDiscoveryId, boolean>
}

export interface ManaPillarState {
  rank: number
  level: number
}
/** Gameplay UI state. Layout editing and developer tools are transient UI chrome outside the save. */
export interface UiState { screen: ScreenId }
export interface GameState {
  saveVersion: number
  player: PlayerState
  schools: Record<SchoolId, SchoolState>
  inventory: Partial<Record<ItemId, number>>
  protectedItems: Partial<Record<ItemId, boolean>>
  equipment: { weapon: ItemId | null; robe: ItemId | null; focus: ItemId | null; charm: ItemId | null }
  activities: ActivitiesState
  combat: CombatState
  progress: ProgressState
  ui: UiState
  offlineBankMs: number
  lastSavedAt: number
  notifications: NotificationItem[]
  debug: DebugOverrides
}
export interface DebugOverrides {
  bonusManaRegenFlat: number
  bonusMaxManaFlat: number
  bonusMaxFocusFlat: number
  allowManaOverCap: boolean
  allowFocusOverCap: boolean
  ignoreEchoLimit: boolean
}
export interface NotificationItem { id: string; text: string; tone: 'info' | 'success' | 'warning' }
export interface FocusReservation {
  id: string
  sourceType: 'autocast' | 'research' | 'condense' | 'transmutation' | 'channeling'
  sourceId: string
  amount: number
  label: string
}
