import { ARTIFICING_RECIPES } from "../game/content/recipes/artificingRecipes";
import { ARTIFACTS } from "../game/content/artifacts/artifacts";
import { grantItem } from "../game/systems/inventory/itemAcquisition";
import { getConsumableQuantity } from "../game/core/inventory/inventoryConsumption";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { BALANCE } from "../game/core/balance/balance";
import {
  DUNGEONS,
  DUNGEON_ORDER,
  getDungeonUnlockRequirement,
  isDungeonUnlocked,
} from "../game/content/dungeons/dungeons";
import {
  COMBAT_LOCATIONS,
  getCombatEncounterMode,
  getCombatLocationByDungeonId,
  isCombatTargetForLocation,
  type CombatLocationId,
} from "../game/content/world-navigation";
import { MONSTERS } from "../game/content/monsters";
import { ITEMS } from "../game/content/items/items";
import { LEGACY_SPELL_ID_MAP, SPELLS } from "../game/content/spells/spells";
import {
  castSpellAction,
  debugCastSpellAction,
  requestManualSpellAction,
} from "./actions/combatActions";
import type { ManualSpellRequestResult } from "../game/engine/spellEngine";
import {
  appendLog,
  manaRegenPerSecond,
  pushNotification,
  recalculateDerivedStats,
  selectFreeFocus,
  selectUsedFocus,
} from "../game/engine";
import {
  abandonCurrentEncounter,
  debugApplyStatus,
  spawnEnemy,
  spawnNextEnemy,
  type CombatLootObserver,
} from "../game/systems/combat/combatRuntime";
import {
  canManuallyEngageDungeonBoss,
  isAutoHuntEnabledForDungeon,
  isAutoHuntUnlocked,
  isBossCurrentlyActive,
} from "../game/systems/combat/combatBossSelectors";
import { resolveBossThreatRequirement } from "../game/systems/combat/combatThreat";
import { removeStatus as removeCombatStatus } from "../game/systems/combat/statusRuntime";
import {
  damagePlayer,
  executeCombatEffects,
} from "../game/systems/combat/effectResolver";
import {
  forceResolveEnemyAction as forceResolveEnemyActionRuntime,
  resolveCurrentEnemyAction as resolveCurrentEnemyActionRuntime,
  setEnemyActionPattern as setEnemyActionPatternRuntime,
  startEnemyAction as startEnemyActionRuntime,
  startNextEnemyAction as startNextEnemyActionRuntime,
} from "../game/systems/combat/actionRuntime";
import {
  resetAllCombatRuleRuntime,
  resetCombatRuleRuntime,
  runCombatTriggers,
} from "../game/systems/combat/triggerRuntime";
import { createCombatResolutionContext } from "../game/systems/combat/combatTypes";
import {
  loadProfileGame,
  resetProfileGame,
} from "../persistence/profileSaveManager";
import { type SaveReason } from "../persistence/saveConstants";
import { getActiveProfileId } from "../profiles/profileSessionStore";
import { updateProfileMetadata } from "../profiles/profileStorage";
import { createInitialState } from "./initialState";
import type {
  ArcaneCoreBranchId,
  ArtifactId,
  CanonicalSpellId,
  ChannelingDiscoveryId,
  CrystalPresetId,
  CrystalVariantId,
  DungeonId,
  EquipmentPosition,
  GameState,
  GuardianId,
  ItemId,
  ManaPillarId,
  MonsterId,
  ResonanceType,
  TransmutationArrayId,
  TransmutationRecipeId,
  ResearchSlotId,
  SchoolId,
  ScreenId,
  SpellAutomationConfig,
  SpellId,
  SpellPreset,
  SpellPresetId,
  StatusId,
  StoryEventId,
  WorldTierId,
} from "../game/types";
import { clamp } from "../game/utils";
import {
  createDefaultDebugOverrides,
  resetCombatDebugState,
  resetDebugState,
  sanitizeCombatTimeScale,
  sanitizeDebugNumber,
} from "./actions/debugActions";
import {
  addItemAction,
  destroyItemAction,
  removeItemAction,
  sellItemAction,
  toggleItemProtectionAction,
} from "./actions/inventoryActions";
import { equipItemAction, unequipItemAction } from "./actions/equipmentActions";
import {
  donateGuildRequestAction,
  claimGuildRewardAction,
  promoteGuildAction,
} from "./actions/guildActions";
import {
  debugLockSpellAction,
  debugUnlockSpellRankOneAction,
  resetSpellCooldownsAction,
  setSchoolLevelDebugAction,
  setSchoolXpDebugAction,
  setLevelCapAction,
  setThreatAction,
  setBossKillsAction,
  unlockAllSpellsAction,
} from "./actions/progressionActions";
import {
  setChannelingEchoesAction,
  upgradeManaPillarAction,
  setManaPillarLevelAction,
  setChannelingManaGeneratedAction,
  setChannelingSustainAction,
  setChannelingDiscoveryAction,
} from "./actions/channelingActions";
import {
  canReserveFocusAction,
  setFocusImprovementLevelAction,
  upgradeFocusCapacityAction,
} from "./actions/focusActions";
import {
  assignMaxResearchEchoesAction,
  assignOneResearchEchoEachAction,
  assignResearchEchoAction,
  clearPreparedResearchAction,
  clearResearchEchoesAction,
  pauseResearchAction,
  prepareResearchAction,
  removePreparedResearchAction,
  removeResearchEchoAction,
  setResearchEchoesAction,
} from "./actions/researchActions";
import {
  assignMaxTransmutationEchoesAction,
  assignTransmutationEchoAction,
  clearTransmutationAssignmentsAction,
  clearTransmutationRecipeEchoesAction,
  forceSetTransmutationArrayLevelAction,
  grantTransmutationMissingIngredientsAction,
  removeTransmutationEchoAction,
  setTransmutationEchoCapacityOverrideAction,
  setTransmutationEchoesAction,
  upgradeTransmutationArrayAction,
} from "./actions/transmutationActions";
import { forceCompleteTransmutationCycle } from "../game/systems/transmutation/transmutationEngine";
import { saveGameAction } from "./actions/persistenceActions";
import { advanceGameState } from "../game/systems/simulation/advanceGameState";
import { forceCompleteResearchCycle } from "../game/systems/research/researchEngine";
import {
  cancelArtificingCraft,
  craftArtificingRecipe as craftArtificing,
  upgradeArtifactInstant,
} from "../game/systems/artificing/artificingEngine";
import {
  allocateArtifactNode,
  getArtifactLevelCap,
  respecArtifact,
} from "../game/systems/artifacts/artifactProgression";
import {
  advanceWithOfflineBank as runOfflineBankAdvance,
  isOfflineBankSimulationActive,
  type OfflineBankResult,
  type OfflineBankSimulationObservers,
} from "../game/systems/offline-bank/offlineBankSimulation";
import {
  addOfflineBankMs,
  clampOfflineBankMs,
} from "../game/systems/offline-bank/offlineBankDuration";
import type { OfflineBankReport } from "../game/systems/offline-bank/offlineBankReport";
import {
  DEFAULT_COMBAT_LOADOUT_NAME,
  getDefaultSpellAutomationConfig,
  getNextSpellPresetId,
  getSelectedSpellPreset,
  getSpellAutoCastFocusCost,
  getSpellPresetFocusProjection,
  isSpellUnlocked,
  MAX_COMBAT_SPELLS,
  syncAutoCastRuntimeForLoadout,
} from "../game/systems/spells";
import {
  applySpellPresetAction,
  addSpellToSelectedPresetAction,
  addSpellToSelectedPresetAtAction,
  clearAutoCastAction,
  createSpellPresetAction,
  deleteSpellPresetAction,
  duplicateSpellPresetAction,
  moveAutoCastPriorityAction,
  moveSelectedPresetSlotAction,
  swapSelectedPresetSlotsAction,
  removeSpellFromSelectedPresetAction,
  renameSpellPresetAction,
  saveSpellPresetAction,
  selectSpellPresetAction,
  selectSpellPresetForEditingAction,
  setPresetSlotAutoCastAction,
  setPresetSlotAutomationAction,
  syncSelectedSpellPresetRuntime,
  type ApplySpellPresetResult,
  type SelectedPresetSlotMutationResult,
} from "./actions/spellPresetActions";
import {
  clearCombatLogUi,
  combatLogUiSink as combatLogSink,
} from "../game/ui/combatLogStore";
import {
  combatAlertsObserver,
  combatAlertsSink,
  clearCombatAlerts,
} from "../game/ui/combatAlertsStore";
import {
  beginCombatRecapRun,
  clearCombatRecap,
  combatRecapSink,
} from "../game/ui/combatRecapStore";
import {
  clearCombatDefeat,
  combatDefeatSink,
  publishOfflineCombatDefeat,
} from "../game/ui/combatDefeatStore";
import { createCombatEventSink } from "../game/systems/combat/combatEventSink";
import {
  combatTelemetryObserver,
  combatTelemetrySink,
  useCombatTelemetryStore,
} from "../game/telemetry/combat/combatTelemetryStore";
import {
  clearDungeonStatistics,
  dungeonStatisticsObserver,
  dungeonStatisticsSink,
  useDungeonStatisticsStore,
} from "../game/telemetry/dungeon/dungeonStatisticsStore";
import {
  advanceCombatOnlyForDebug,
  clearToBossForDebug,
  despawnEnemyForDebug,
  fastResolveNormalEnemiesForDebug,
  forceKillEnemyForDebug,
  jumpToBossForDebug,
  restartBossForDebug,
} from "../game/systems/combat/debugCombatRuntime";
import { enqueueCombatLootReveal } from "../ui/rewards/lootRevealStore";
import { resetProfileAttention } from "../ui/attention/attentionStore";
import { emitGameFeelEvent } from "../ui/game-feel/gameFeelStore";
import type { GameFeelEventType } from "../ui/game-feel/gameFeelTypes";
import { unpinArtificingRecipe } from "../ui/preferences/uiPreferencesStore";
import {
  completeStoryEvent as completeStoryEventAction,
  isScreenUnlocked,
} from "../game/systems/story/storyProgression";
import { GUARDIANS } from "../game/content/guardians/guardians";
import { suppressGuardianIfOutOfMana } from "../game/systems/summoning/summoningRuntime";
import { isSummoningUnlocked } from "../game/systems/summoning/summoningSelectors";
import {
  applyArcaneCorePreset,
  grantArcanePoints,
  maxArcaneCoreBranch,
  maxArcaneCoreNode,
  maxArcaneCoreRing,
  purchaseAllArcaneCoreNodes,
  purchaseArcaneCoreNode,
  refundArcaneCoreNode,
  resetArcaneCore,
  resetArcaneCoreBranch as resetArcaneCoreBranchProgression,
  resetArcaneCoreNode,
  resetArcaneCoreRing,
  setArcaneCoreNodeRank,
  setArcaneCoreTotalPointsEarned,
} from "../game/systems/arcaneCore";
import { ARCANE_CORE_TOTAL_TREE_COST } from "../game/content/arcaneCore/arcaneCoreBalance";
import { resetArcaneCoreCombatRuntime } from "../game/systems/arcaneCore/arcaneCoreRuntime";
import {
  getArcaneCorePresetSnapshot,
  useArcaneCorePresetStore,
} from "./arcaneCorePresetStore";
import { stabilizeResourceValue } from "../game/presentation/resources/resourcePresentation";
import { DEBUG_RESONANCE_TEST_BUNDLE } from "../game/content/resonance/resonance";
import {
  CRYSTAL_CACHE_ITEM_ID,
  CRYSTAL_FAMILY_ORDER,
} from "../game/content/crystals/crystals";
import {
  clearAllResonance,
  clearResonance,
  grantResonance,
  setResonance,
} from "../game/systems/resonance/resonanceRuntime";
import {
  createInitialWorldTierState,
  setCurrentWorldTier,
  unlockWorldTier,
} from "../game/systems/world-tier/worldTierRuntime";
import {
  createInitialCrystalState,
  CRYSTAL_RNG_DEFAULT_SEED,
  isCrystalSystemUnlocked,
} from "../game/systems/crystals/crystalRuntime";
import {
  bulkCrushCrystals,
  crushCrystals,
  equipCrystal,
  loadCrystalPreset,
  openCrystalCaches,
  removeAvailableCrystals,
  renameCrystalPreset,
  saveCrystalPreset,
  unequipCrystal,
  upgradeCrystal,
  type CrystalCacheOpenResult,
} from "../game/systems/crystals/crystalRuntime";

const combatEventSink = createCombatEventSink(
  combatLogSink,
  combatRecapSink,
  combatDefeatSink,
  combatAlertsSink,
  dungeonStatisticsSink,
  combatTelemetrySink,
);
const offlineBankCombatAnalyticsSink = createCombatEventSink(
  dungeonStatisticsSink,
  combatTelemetrySink,
);
const cloneAnalyticsState = <T>(value: T) =>
  JSON.parse(JSON.stringify(value)) as T;
const offlineBankAnalyticsObservers: OfflineBankSimulationObservers = {
  uiEvents: offlineBankCombatAnalyticsSink,
  telemetry: combatTelemetryObserver,
  statistics: dungeonStatisticsObserver,
  getEncounterTelemetry: () =>
    cloneAnalyticsState(useCombatTelemetryStore.getState().encounter),
  snapshot: () => ({
    combat: cloneAnalyticsState(useCombatTelemetryStore.getState()),
    dungeon: cloneAnalyticsState(useDungeonStatisticsStore.getState()),
  }),
  restore: (snapshot) => {
    const state = snapshot as {
      combat: ReturnType<typeof useCombatTelemetryStore.getState>;
      dungeon: ReturnType<typeof useDungeonStatisticsStore.getState>;
    };
    useCombatTelemetryStore.setState(state.combat);
    useDungeonStatisticsStore.setState(state.dungeon);
  },
  onCombatCompleted: () => {
    combatAlertsObserver.clear();
    combatTelemetryObserver.endRun("complete");
    dungeonStatisticsObserver.endSession("complete");
    clearCombatDefeat();
  },
};
const combatLogUiSink = combatEventSink;
const combatLootObserver: CombatLootObserver = (state, enemyId, drops) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? "whispering-woods"];
  const monster = MONSTERS[enemyId];
  enqueueCombatLootReveal({
    sourceLabel: dungeon?.name ?? "Combat",
    sourceDetail: monster?.name ?? enemyId,
    items: drops.map(({ itemId, quantity, isNewDiscovery }) => ({
      itemId,
      quantity,
      isNewDiscovery,
    })),
  });
};
const emitActionFeel = (
  type: GameFeelEventType,
  selector: string,
  color = "var(--ui-accent)",
  intensity = 0.95,
) => {
  const element =
    typeof document === "undefined"
      ? null
      : document.querySelector<HTMLElement>(selector);
  const rect = element?.getBoundingClientRect();
  emitGameFeelEvent({
    type,
    x:
      rect && rect.width > 0
        ? rect.left + rect.width / 2
        : typeof window === "undefined"
          ? 0
          : window.innerWidth * 0.62,
    y: rect && rect.height > 0 ? rect.top + rect.height / 2 : 128,
    color,
    intensity,
  });
};

const endActiveDungeonRun = (reason: "leave" | "complete" = "leave") => {
  combatAlertsObserver.clear();
  combatTelemetryObserver.endRun(reason);
  dungeonStatisticsObserver.endSession(reason);
  clearCombatDefeat();
};

const initializeDungeonRun = (
  state: GameState,
  dungeonId: DungeonId,
  resetCombatState: boolean,
  targetEnemyId: MonsterId | null = null,
) => {
  const dungeon = DUNGEONS[dungeonId];
  if (resetCombatState) state.combat = createInitialState().combat;
  clearCombatLogUi();
  clearCombatDefeat();
  beginCombatRecapRun();
  combatAlertsObserver.beginRun(dungeonId);
  combatTelemetryObserver.beginRun(dungeonId);
  dungeonStatisticsObserver.beginSession(dungeonId);
  resetAllCombatRuleRuntime(state);
  resetArcaneCoreCombatRuntime(state);
  state.combat.active = true;
  state.combat.dungeonId = dungeonId;
  state.combat.targetEnemyId = targetEnemyId;
  state.combat.encounterTimerMs = 0;
  state.combat.dungeonSequenceIndex =
    getCombatEncounterMode(getCombatLocationByDungeonId(dungeonId)) ===
    "sequence"
      ? 0
      : null;
  state.player.health = Math.max(1, state.player.health);
  if (!spawnNextEnemy(state, combatEventSink)) {
    state.combat.active = false;
    state.combat.dungeonId = null;
    state.combat.encounterTimerMs = 0;
    state.combat.dungeonSequenceIndex = null;
    return;
  }
  pushNotification(state, `${dungeon.name} entered`, "info");
};

export interface RecentAcquisition {
  itemId: ItemId;
  amount: number;
  timestamp: number;
  isNew: boolean;
}
export interface GameActions {
  tick: (deltaMs: number) => void;
  setScreen: (screen: ScreenId) => void;
  selectGuardian: (guardianId: GuardianId) => void;
  completeStoryEvent: (eventId: StoryEventId) => void;
  addArcaneEcho: () => void;
  removeArcaneEcho: () => void;
  setChannelingEchoes: (amount: number) => void;
  forceSetEchoes: (amount: number) => void;
  upgradeManaPillar: (pillarId: ManaPillarId) => void;
  setManaPillarLevel: (pillarId: ManaPillarId, level: number) => void;
  forceSetManaPillarLevel: (pillarId: ManaPillarId, level: number) => void;
  upgradeTransmutationArray: (arrayId: TransmutationArrayId) => boolean;
  forceSetTransmutationArrayLevel: (
    arrayId: TransmutationArrayId,
    level: number,
  ) => void;
  upgradeFocusCapacity: () => void;
  setFocusImprovementLevel: (level: number) => void;
  setChannelingManaGenerated: (amount: number) => void;
  setChannelingFiveEchoSustain: (amount: number) => void;
  setChannelingDiscovery: (
    id: ChannelingDiscoveryId,
    completed: boolean,
  ) => void;
  setDebugManaRegenBonus: (amount: number) => void;
  setDebugMaxManaBonus: (amount: number) => void;
  setDebugMaxFocusBonus: (amount: number) => void;
  setDebugAllowManaOverCap: (enabled: boolean) => void;
  setDebugAllowFocusOverCap: (enabled: boolean) => void;
  setDebugIgnoreEchoLimit: (enabled: boolean) => void;
  setDebugShowLockedTransmutationRecipes: (enabled: boolean) => void;
  setDebugShowLockedArtificingRecipes: (enabled: boolean) => void;
  setDebugPlayerImmortal: (enabled: boolean) => void;
  setDebugEnemyImmortal: (enabled: boolean) => void;
  setDebugInfiniteMana: (enabled: boolean) => void;
  setDebugIgnoreSpellCooldowns: (enabled: boolean) => void;
  setDebugDisableAutoCast: (enabled: boolean) => void;
  setDebugFreezePlayerActions: (enabled: boolean) => void;
  setDebugFreezeEnemyActions: (enabled: boolean) => void;
  setDebugCombatPaused: (enabled: boolean) => void;
  setDebugCombatTimeScale: (scale: number) => void;
  setDebugArtifactIgnoreDungeonGate: (enabled: boolean) => void;
  setDebugArtifactIgnoreLevelCap: (enabled: boolean) => void;
  setDebugArtifactIgnoreNodePrerequisites: (enabled: boolean) => void;
  setDebugArtifactAllowBeyondLimit: (enabled: boolean) => void;
  setDebugArtifactFreeUpgrade: (enabled: boolean) => void;
  clearCombatDebugOverrides: () => void;
  resetDebugOverrides: () => void;
  prepareResearch: (
    itemId: ItemId,
    targetSchoolId: SchoolId,
    quantity: number,
  ) => void;
  removePreparedResearch: (slotId: ResearchSlotId) => void;
  assignResearchEcho: (slotId: ResearchSlotId) => void;
  assignMaxResearchEchoes: (slotId: ResearchSlotId) => void;
  pauseResearch: (slotId: ResearchSlotId) => void;
  assignOneResearchEchoEach: () => void;
  removeResearchEcho: (slotId: ResearchSlotId) => void;
  setResearchEchoes: (slotId: ResearchSlotId, amount: number) => void;
  clearResearchEchoes: () => void;
  clearPreparedResearch: () => void;
  forceResearchCycle: (slotId: ResearchSlotId) => void;
  assignTransmutationEcho: (recipeId: TransmutationRecipeId) => void;
  removeTransmutationEcho: (recipeId: TransmutationRecipeId) => void;
  assignMaxTransmutationEchoes: (recipeId: TransmutationRecipeId) => void;
  clearTransmutationRecipeEchoes: (recipeId: TransmutationRecipeId) => void;
  setTransmutationEchoes: (
    recipeId: TransmutationRecipeId,
    amount: number,
  ) => void;
  clearTransmutationAssignments: () => void;
  completeTransmutationCycle: (recipeId: TransmutationRecipeId) => void;
  grantTransmutationIngredients: (
    recipeId: TransmutationRecipeId,
    cycles?: number,
  ) => void;
  grantArtificingIngredients: (
    recipeId: import("../game/types").ArtificingRecipeId,
  ) => void;
  craftArtificingRecipe: (
    recipeId: import("../game/types").ArtificingRecipeId,
  ) => boolean;
  upgradeArtifact: (artifactId: import("../game/types").ArtifactId) => boolean;
  allocateArtifactNode: (
    artifactId: import("../game/types").ArtifactId,
    nodeId: string,
  ) => boolean;
  respecArtifact: (artifactId: import("../game/types").ArtifactId) => boolean;
  grantArcanePoints: (amount: number) => void;
  setArcanePoints: (amount: number) => void;
  debugGrantResonance: (type: ResonanceType, amount: number) => void;
  debugSetResonance: (type: ResonanceType, amount: number) => void;
  debugClearResonance: (type: ResonanceType) => void;
  debugClearAllResonance: () => void;
  debugGrantResonanceTestBundle: () => void;
  setWorldTier: (tier: WorldTierId) => boolean;
  debugSetWorldTier: (tier: WorldTierId) => void;
  debugUnlockWorldTier: (tier: WorldTierId) => void;
  debugResetWorldTier: () => void;
  purchaseArcaneCoreNode: (nodeId: string) => boolean;
  refundArcaneCoreNode: (nodeId: string) => boolean;
  setArcaneCoreNodeRank: (nodeId: string, rank: number) => void;
  maxArcaneCoreNode: (nodeId: string) => void;
  maxArcaneCoreBranch: (branchId: ArcaneCoreBranchId) => void;
  resetArcaneCoreNode: (nodeId: string) => void;
  maxArcaneCoreRing: (
    branchId: ArcaneCoreBranchId,
    ring: import("../game/types").ArcaneCoreRingIndex,
  ) => void;
  resetArcaneCoreRing: (
    branchId: ArcaneCoreBranchId,
    ring: import("../game/types").ArcaneCoreRingIndex,
  ) => void;
  resetArcaneCoreBranch: (branchId: ArcaneCoreBranchId) => void;
  resetArcaneCore: () => void;
  purchaseAllArcaneCoreBranch: (branchId: ArcaneCoreBranchId) => void;
  purchaseAllArcaneCore: () => void;
  maxArcanePointsAndPurchaseAll: () => void;
  loadArcaneCorePreset: (presetId: string) => boolean;
  setDebugArcaneCoreFreeCosts: (enabled: boolean) => void;
  setDebugArcaneCoreIgnorePrerequisites: (enabled: boolean) => void;
  debugSetArtifactLevel: (artifactId: ArtifactId, level: number) => void;
  debugDecreaseArtifactLevel: (artifactId: ArtifactId) => void;
  debugIncreaseArtifactLevel: (artifactId: ArtifactId) => void;
  debugGrantArtifactPoints: (artifactId: ArtifactId, amount: number) => void;
  debugRefillArtifactPoints: (artifactId: ArtifactId) => void;
  debugForceArtifactNode: (artifactId: ArtifactId, nodeId: string) => boolean;
  debugAllocateArtifactNode: (
    artifactId: ArtifactId,
    nodeId: string,
  ) => boolean;
  debugLockArtifactNode: (artifactId: ArtifactId, nodeId: string) => boolean;
  debugUnlockArtifactNodes: (
    artifactId: ArtifactId,
    mode?: "non-capstone" | "all" | "capstones",
  ) => void;
  debugResetArtifactPath: (artifactId: ArtifactId) => void;
  debugMaxArtifactLevels: (absolute: boolean) => void;
  debugUnlockAllArtifactPaths: () => void;
  debugResetAllArtifactPaths: () => void;
  debugGrantArtifactMaterials: () => void;
  cancelArtificingCraft: () => void;
  setDebugTransmutationEchoCapacity: (amount: number | null) => void;
  castSpell: (spellId: SpellId) => void;
  debugCastSpell: (spellId: SpellId) => void;
  requestManualSpell: (spellId: SpellId) => ManualSpellRequestResult;
  toggleAutoCast: (spellId: SpellId) => boolean;
  moveAutoCastPriority: (spellId: SpellId, direction: -1 | 1) => boolean;
  clearAutoCast: () => boolean;
  createSpellPreset: (name: string) => SpellPresetId;
  renameSpellPreset: (id: SpellPresetId, name: string) => boolean;
  duplicateSpellPreset: (id: SpellPresetId) => SpellPresetId | null;
  deleteSpellPreset: (id: SpellPresetId) => boolean;
  saveSpellPreset: (preset: SpellPreset) => boolean;
  selectSpellPreset: (id: SpellPresetId) => ApplySpellPresetResult;
  selectSpellPresetForEditing: (id: SpellPresetId) => boolean;
  addSpellToSelectedPreset: (spellId: SpellId) => SelectedPresetSlotMutationResult;
  addSpellToSelectedPresetAt: (spellId: SpellId, index: number) => SelectedPresetSlotMutationResult;
  removeSpellFromSelectedPreset: (spellId: SpellId) => SelectedPresetSlotMutationResult;
  moveSelectedPresetSlot: (fromIndex: number, toIndex: number) => SelectedPresetSlotMutationResult;
  swapSelectedPresetSlots: (sourceIndex: number, targetIndex: number) => SelectedPresetSlotMutationResult;
  setPresetSlotAutoCast: (
    id: SpellPresetId,
    spellId: CanonicalSpellId,
    autoCast: boolean,
  ) => boolean;
  setPresetSlotAutomation: (
    id: SpellPresetId,
    spellId: CanonicalSpellId,
    automation: SpellAutomationConfig,
  ) => boolean;
  applySpellPreset: (id: SpellPresetId) => ApplySpellPresetResult;
  enterDungeon: (dungeonId?: DungeonId) => void;
  enterTargetedCombat: (
    dungeonId: DungeonId,
    targetEnemyId: MonsterId,
  ) => boolean;
  huntCombatTarget: (
    locationId: CombatLocationId,
    targetEnemyId: MonsterId,
  ) => boolean;
  setCombatTarget: (enemyId: MonsterId) => boolean;
  leaveDungeon: () => void;
  engageBoss: (bossId: MonsterId) => void;
  toggleAutoHunt: (dungeonId?: DungeonId) => void;
  killCurrentEnemy: () => void;
  despawnDebugEnemy: () => void;
  fastResolveDebugEnemies: (
    amount: number,
    dungeonId?: DungeonId,
    stopAtBossReady?: boolean,
  ) => void;
  clearDebugThreatToBoss: (dungeonId?: DungeonId) => void;
  jumpDebugToBoss: (dungeonId?: DungeonId) => void;
  restartDebugBoss: () => void;
  advanceCombatDebug: (durationMs: number) => void;
  spawnDebugEnemy: (enemyId: MonsterId, dungeonId?: DungeonId) => void;
  setEnemyHealthPercent: (percent: number) => void;
  damagePlayerForDebug: (amount: number) => void;
  applyPlayerStatus: (statusId: StatusId) => void;
  applyEnemyStatus: (statusId: StatusId) => void;
  removePlayerStatus: (statusId: StatusId) => void;
  removeEnemyStatus: (statusId: StatusId) => void;
  setPlayerBarrier: (amount: number) => void;
  setEnemyBarrier: (amount: number) => void;
  clearPlayerBarrier: () => void;
  clearEnemyBarrier: () => void;
  forceEnemyAction: (actionId: string) => void;
  startEnemyAction: (actionId: string) => void;
  resolveCurrentEnemyAction: () => void;
  advanceEnemyAction: () => void;
  setEnemyActionPattern: (patternId: string) => void;
  resetEnemyActionPattern: () => void;
  resetEnemyActionCursor: () => void;
  resetCombatRuleRuntime: () => void;
  clearCombatStatuses: () => void;
  clearPlayerStatuses: () => void;
  clearEnemyStatuses: () => void;
  saveGame: (reason?: SaveReason) => SaveResult;
  reloadFromStorage: () => void;
  resetSave: () => void;
  hydrateState: (state: GameState) => void;
  dismissNotification: (id: string) => void;
  setPlayer: (changes: Partial<GameState["player"]>) => void;
  addMana: (amount: number) => void;
  setSchoolXpDebug: (school: SchoolId, xp: number) => void;
  setSchoolLevelDebug: (school: SchoolId, level: number) => void;
  setLevelCap: (cap: number) => void;
  setThreat: (amount: number) => void;
  addItem: (itemId: ItemId, quantity: number) => void;
  removeItem: (itemId: ItemId, quantity: number) => void;
  toggleItemProtection: (itemId: ItemId) => void;
  sellItem: (itemId: ItemId, quantity: number) => void;
  destroyItem: (itemId: ItemId, quantity: number) => void;
  openCrystalCaches: (quantity: number) => CrystalCacheOpenResult;
  equipCrystal: (variantId: CrystalVariantId, slot?: number) => boolean;
  unequipCrystal: (slot: number) => boolean;
  saveCrystalPreset: (presetId: CrystalPresetId) => boolean;
  renameCrystalPreset: (presetId: CrystalPresetId, name: string) => boolean;
  loadCrystalPreset: (presetId: CrystalPresetId) => boolean;
  upgradeCrystal: (
    variantId: CrystalVariantId,
    equippedSlot?: number,
  ) => boolean;
  crushCrystal: (variantId: CrystalVariantId, quantity: number) => boolean;
  bulkCrushCrystals: (
    requests: Partial<Record<CrystalVariantId, number>>,
  ) => boolean;
  debugUnlockCrystals: () => void;
  debugAddCrystalDust: (amount: number) => void;
  debugSetCrystalDust: (amount: number) => void;
  debugClearCrystalDust: () => void;
  debugGrantCrystal: (variantId: CrystalVariantId, quantity: number) => void;
  debugRemoveCrystal: (variantId: CrystalVariantId, quantity: number) => void;
  debugGrantAllT1Crystals: (quantity: number) => void;
  debugSetCrystalUnlockedSlots: (amount: number) => void;
  debugResetCrystalRng: () => void;
  debugClearCrystalCaches: () => void;
  debugResetCrystals: () => void;
  clearRecentNew: (itemId: ItemId) => void;
  equipItem: (itemId: ItemId, targetPosition?: EquipmentPosition) => void;
  unequipItem: (position: EquipmentPosition) => void;
  unlockAllSpells: () => void;
  debugUnlockSpellRankOne: (spellId: SpellId) => void;
  debugLockSpell: (spellId: SpellId) => void;
  resetSpellCooldowns: () => void;
  donateGuildRequest: (requestId: string, amount: number | "max") => void;
  claimGuildReward: (requestId: string) => void;
  promoteGuild: () => void;
  setGuildReputation: (amount: number) => void;
  setBossKills: (bossId: MonsterId, amount: number) => void;
  creditOfflineAbsence: (elapsedMs: number, notify?: boolean) => void;
  debugAddOfflineBank: (durationMs: number) => void;
  debugSetOfflineBank: (durationMs: number) => void;
  debugClearOfflineBank: () => void;
  advanceWithOfflineBank: (durationMs: number) => Promise<OfflineBankResult>;
  lastOfflineBankReport: OfflineBankReport | null;
}

export type GameStore = GameState &
  GameActions & { recentAcquisitions: RecentAcquisition[] };

export interface SaveResult {
  ok: boolean;
  error: string | null;
}

export const recordRecentAcquisition = (
  state: GameState & { recentAcquisitions?: RecentAcquisition[] },
  itemId: ItemId,
  amount: number,
) => {
  if (amount <= 0 || !Number.isFinite(amount)) return;
  const previous = state.recentAcquisitions ?? [];
  const priorEntry = previous.find((entry) => entry.itemId === itemId);
  const wasOwned = (state.inventory[itemId] ?? 0) - amount > 0;
  state.recentAcquisitions = [
    {
      itemId,
      amount,
      timestamp: Date.now(),
      isNew: priorEntry?.isNew ?? !wasOwned,
    },
    ...previous.filter((entry) => entry.itemId !== itemId),
  ].slice(0, 8);
};

const ensureDebugArtifact = (state: GameState, artifactId: ArtifactId) => {
  if (!ARTIFACTS[artifactId]) return null;
  if ((state.inventory[artifactId] ?? 0) < 1) grantItem(state, artifactId, 1);
  return (state.artifactProgress[artifactId] ??= {
    level: 1,
    allocatedNodeIds: [],
    attunedNodeIds: [],
  });
};

const forceArtifactNodeInState = (
  state: GameState,
  artifactId: ArtifactId,
  nodeId: string,
) => {
  const progress = ensureDebugArtifact(state, artifactId);
  const node = ARTIFACTS[artifactId]?.nodes.find(
    (candidate) => candidate.id === nodeId,
  );
  if (!progress || !node) return false;
  if (!progress.allocatedNodeIds.includes(nodeId))
    progress.allocatedNodeIds.push(nodeId);
  if (node.catalyst && !progress.attunedNodeIds.includes(nodeId))
    progress.attunedNodeIds.push(nodeId);
  return true;
};

const setDebugArtifactLevelInState = (
  state: GameState,
  artifactId: ArtifactId,
  level: number,
) => {
  const progress = ensureDebugArtifact(state, artifactId);
  const definition = ARTIFACTS[artifactId];
  if (!progress || !definition) return;
  progress.level = clamp(
    Math.floor(sanitizeDebugNumber(level)),
    1,
    definition.maxLevel,
  );
};

const unlockDebugArtifactNodesInState = (
  state: GameState,
  artifactId: ArtifactId,
  mode: "non-capstone" | "all" | "capstones" = "all",
) => {
  const nodes =
    ARTIFACTS[artifactId]?.nodes.filter(
      (node) =>
        mode === "all" ||
        (mode === "capstones"
          ? node.type === "capstone"
          : node.type !== "capstone"),
    ) ?? [];
  nodes.forEach((node) => forceArtifactNodeInState(state, artifactId, node.id));
};

const grantDebugArtifactMaterialsInState = (state: GameState) => {
  Object.values(ARTIFACTS).forEach((definition) => {
    if (!definition) return;
    const ingredients = [
      ...definition.forge.ingredients,
      ...definition.upgrades.flatMap((upgrade) => upgrade.ingredients),
      ...definition.nodes.flatMap((node) =>
        node.catalyst ? [node.catalyst] : [],
      ),
    ];
    ingredients.forEach(({ itemId, quantity }) =>
      grantItem(state, itemId, quantity),
    );
  });
};

const spellUnlocked = isSpellUnlocked;
const canReserveFocus = canReserveFocusAction;

const toggleAutoCastState = (state: GameState, requestedSpellId: SpellId) => {
  const spellId = (LEGACY_SPELL_ID_MAP[requestedSpellId] ??
    requestedSpellId) as CanonicalSpellId;
  if (!spellUnlocked(state, spellId)) return false;
  let preset = getSelectedSpellPreset(state);
  if (!preset) {
    const id = getNextSpellPresetId(state.spellPresets.presets);
    preset = { id, name: DEFAULT_COMBAT_LOADOUT_NAME, slots: [] };
    state.spellPresets.presets.push(preset);
    state.spellPresets.selectedPresetId = id;
  }
  const slot = preset.slots.find((entry) => entry.spellId === spellId);
  if (slot) {
    if (
      !slot.autoCast &&
      !state.debug.allowFocusOverCap &&
      !canReserveFocus(state, getSpellAutoCastFocusCost(state, spellId) ?? 0)
    )
      return false;
    slot.autoCast = !slot.autoCast;
    if (slot.autoCast && !slot.automation) slot.automation = getDefaultSpellAutomationConfig(slot.spellId, true, false);
  } else {
    if (
      preset.slots.length >= MAX_COMBAT_SPELLS ||
      (!state.debug.allowFocusOverCap &&
        !canReserveFocus(state, getSpellAutoCastFocusCost(state, spellId) ?? 0))
    )
      return false;
    preset.slots.push({ spellId, autoCast: true, automation: getDefaultSpellAutomationConfig(spellId, true, false) });
  }
  if (!state.combat.active) syncSelectedSpellPresetRuntime(state);
  return true;
};

const arcaneCoreFailureMessages = {
  "unknown-node": "That Arcane Core node does not exist.",
  "already-max-rank": "That Arcane Core node is already at maximum rank.",
  "ring-locked": "Invest more standard ranks in the previous Ring first.",
  "major-locked":
    "Invest more standard ranks in this Ring to unlock its Major.",
  "not-enough-core-points": "Not enough Arcane Points.",
  "not-purchased": "That Arcane Core node is not purchased.",
  "invalid-preset": "That Arcane Core preset is invalid.",
} as const;

const commitArcaneCoreResult = (
  state: GameState,
  result:
    | ReturnType<typeof purchaseArcaneCoreNode>
    | ReturnType<typeof refundArcaneCoreNode>
    | ReturnType<typeof resetArcaneCoreBranchProgression>
    | ReturnType<typeof resetArcaneCore>,
) => {
  if (result.ok) {
    state.arcaneCore = result.state;
    return true;
  }
  pushNotification(state, arcaneCoreFailureMessages[result.reason], "warning", {
    key: "arcane-core-action-failed",
    cooldownMs: 1000,
  });
  return false;
};

export const useGameStore = create<GameStore>()(
  immer((set, get) => ({
    ...createInitialState(),
    recentAcquisitions: [],
    lastOfflineBankReport: null,
    tick: (deltaMs) =>
      set((state) => {
        if (isOfflineBankSimulationActive()) return state;
        return advanceGameState(state, deltaMs, {
          mode: "live",
          onItemAcquired: (itemId, amount) =>
            recordRecentAcquisition(state, itemId, amount),
          onCombatLoot: combatLootObserver,
          uiEvents: combatEventSink,
          telemetry: combatTelemetryObserver,
          alerts: combatAlertsObserver,
          statistics: dungeonStatisticsObserver,
          onCombatCompleted: () => endActiveDungeonRun("complete"),
          onArtificingComplete: (completion) => {
            emitActionFeel("craft-complete", ".artificing-craft-button");
            unpinArtificingRecipe(completion.recipeId);
          },
        });
      }),
    setScreen: (screen) =>
      set((state) => {
        state.ui.screen =
          screen === "crystals"
            ? isCrystalSystemUnlocked(state)
              ? screen
              : "home"
            : screen === "tower-summoning"
              ? isSummoningUnlocked(state)
                ? screen
                : "home"
              : isScreenUnlocked(state, screen)
                ? screen
                : "home";
        return state;
      }),
    completeStoryEvent: (eventId) =>
      set((state) => {
        const destination = completeStoryEventAction(state, eventId);
        if (destination)
          state.ui.screen = isScreenUnlocked(state, destination)
            ? destination
            : "home";
        return state;
      }),
    selectGuardian: (guardianId: GuardianId) =>
      set((state) => {
        if (!isSummoningUnlocked(state) || !GUARDIANS[guardianId]) return state;
        state.guardians.selectedGuardianId = guardianId;
        return state;
      }),
    addArcaneEcho: () => {
      const before = get().activities.channeling.echoesAssigned;
      set((state) => {
        const current = state.activities.channeling.echoesAssigned;
        if (current >= BALANCE.channeling.maxEchoes) return state;
        if (!canReserveFocus(state, BALANCE.channeling.echoFocusCost)) {
          pushNotification(
            state,
            `Not enough free Focus. Arcane Echo requires ${BALANCE.channeling.echoFocusCost} Focus. Free Focus: ${selectFreeFocus(state)}`,
            "warning",
            { key: "action-echo", cooldownMs: 1 },
          );
          return state;
        }
        state.activities.channeling.echoesAssigned = current + 1;
        return state;
      });
      const changed = get().activities.channeling.echoesAssigned !== before;
      emitActionFeel(
        changed ? "echo" : "error",
        ".echo-counter",
        "var(--ui-secondary)",
      );
      return changed;
    },
    removeArcaneEcho: () => {
      const before = get().activities.channeling.echoesAssigned;
      set((state) => {
        state.activities.channeling.echoesAssigned = Math.max(
          0,
          state.activities.channeling.echoesAssigned - 1,
        );
        return state;
      });
      const changed = get().activities.channeling.echoesAssigned !== before;
      if (changed)
        emitActionFeel("echo", ".echo-counter", "var(--ui-secondary)");
      return changed;
    },
    setChannelingEchoes: (amount) =>
      set((state) => {
        setChannelingEchoesAction(state, amount);
        return state;
      }),
    forceSetEchoes: (amount) =>
      set((state) => {
        setChannelingEchoesAction(state, sanitizeDebugNumber(amount), true);
        return state;
      }),
    upgradeManaPillar: (pillarId) =>
      set((state) => {
        upgradeManaPillarAction(state, pillarId);
        return state;
      }),
    setManaPillarLevel: (pillarId, level) =>
      set((state) => {
        setManaPillarLevelAction(state, pillarId, level);
        return state;
      }),
    forceSetManaPillarLevel: (pillarId, level) =>
      get().setManaPillarLevel(pillarId, level),
    upgradeTransmutationArray: (arrayId) => {
      let ok = false;
      set((state) => {
        ok = upgradeTransmutationArrayAction(state, arrayId);
        return state;
      });
      return ok;
    },
    forceSetTransmutationArrayLevel: (arrayId, level) =>
      set((state) => {
        forceSetTransmutationArrayLevelAction(
          state,
          arrayId,
          sanitizeDebugNumber(level),
        );
        return state;
      }),
    upgradeFocusCapacity: () =>
      set((state) => {
        upgradeFocusCapacityAction(state);
        return state;
      }),
    setFocusImprovementLevel: (level) =>
      set((state) => {
        setFocusImprovementLevelAction(state, level);
        return state;
      }),
    setChannelingManaGenerated: (amount) =>
      set((state) => {
        setChannelingManaGeneratedAction(state, amount);
        return state;
      }),
    setChannelingFiveEchoSustain: (amount) =>
      set((state) => {
        setChannelingSustainAction(state, amount);
        return state;
      }),
    setChannelingDiscovery: (id, completed) =>
      set((state) => {
        setChannelingDiscoveryAction(state, id, completed);
        return state;
      }),
    setDebugManaRegenBonus: (amount) =>
      set((state) => {
        state.debug.bonusManaRegenFlat = sanitizeDebugNumber(amount);
        return state;
      }),
    setDebugMaxManaBonus: (amount) =>
      set((state) => {
        state.debug.bonusMaxManaFlat = sanitizeDebugNumber(amount);
        recalculateDerivedStats(state);
        return state;
      }),
    setDebugMaxFocusBonus: (amount) =>
      set((state) => {
        state.debug.bonusMaxFocusFlat = sanitizeDebugNumber(amount);
        recalculateDerivedStats(state);
        return state;
      }),
    setDebugAllowManaOverCap: (enabled) =>
      set((state) => {
        state.debug.allowManaOverCap = enabled;
        recalculateDerivedStats(state);
        return state;
      }),
    setDebugAllowFocusOverCap: (enabled) =>
      set((state) => {
        state.debug.allowFocusOverCap = enabled;
        return state;
      }),
    setDebugIgnoreEchoLimit: (enabled) =>
      set((state) => {
        state.debug.ignoreEchoLimit = enabled;
        return state;
      }),
    setDebugShowLockedArtificingRecipes: (enabled) =>
      set((state) => {
        state.debug.showLockedArtificingRecipes = enabled;
        return state;
      }),
    setDebugShowLockedTransmutationRecipes: (enabled) =>
      set((state) => {
        state.debug.showLockedTransmutationRecipes = enabled;
        return state;
      }),
    setDebugPlayerImmortal: (enabled) =>
      set((state) => {
        state.debug.playerImmortal = enabled;
        return state;
      }),
    setDebugEnemyImmortal: (enabled) =>
      set((state) => {
        state.debug.enemyImmortal = enabled;
        return state;
      }),
    setDebugInfiniteMana: (enabled) =>
      set((state) => {
        state.debug.infiniteMana = enabled;
        return state;
      }),
    setDebugIgnoreSpellCooldowns: (enabled) =>
      set((state) => {
        state.debug.ignoreSpellCooldowns = enabled;
        return state;
      }),
    setDebugDisableAutoCast: (enabled) =>
      set((state) => {
        state.debug.disableAutoCast = enabled;
        return state;
      }),
    setDebugFreezePlayerActions: (enabled) =>
      set((state) => {
        state.debug.freezePlayerActions = enabled;
        return state;
      }),
    setDebugFreezeEnemyActions: (enabled) =>
      set((state) => {
        state.debug.freezeEnemyActions = enabled;
        return state;
      }),
    setDebugCombatPaused: (enabled) =>
      set((state) => {
        state.debug.combatPaused = enabled;
        return state;
      }),
    setDebugCombatTimeScale: (scale) =>
      set((state) => {
        state.debug.combatTimeScale = sanitizeCombatTimeScale(scale);
        return state;
      }),
    setDebugArtifactIgnoreDungeonGate: (enabled) =>
      set((state) => {
        state.debug.artifactIgnoreDungeonGate = enabled;
        return state;
      }),
    setDebugArtifactIgnoreLevelCap: (enabled) =>
      set((state) => {
        state.debug.artifactIgnoreLevelCap = enabled;
        return state;
      }),
    setDebugArtifactIgnoreNodePrerequisites: (enabled) =>
      set((state) => {
        state.debug.artifactIgnoreNodePrerequisites = enabled;
        return state;
      }),
    setDebugArtifactAllowBeyondLimit: (enabled) =>
      set((state) => {
        state.debug.artifactAllowBeyondLimit = enabled;
        return state;
      }),
    setDebugArtifactFreeUpgrade: (enabled) =>
      set((state) => {
        state.debug.artifactFreeUpgrade = enabled;
        return state;
      }),
    setDebugArcaneCoreFreeCosts: (enabled) =>
      set((state) => {
        state.debug.arcaneCoreFreeCosts = enabled;
        return state;
      }),
    setDebugArcaneCoreIgnorePrerequisites: (enabled) =>
      set((state) => {
        state.debug.arcaneCoreIgnorePrerequisites = enabled;
        return state;
      }),
    clearCombatDebugOverrides: () =>
      set((state) => {
        resetCombatDebugState(state);
        return state;
      }),
    resetDebugOverrides: () =>
      set((state) => {
        resetDebugState(state);
        state.activities.channeling.echoesAssigned = clamp(
          state.activities.channeling.echoesAssigned,
          0,
          BALANCE.channeling.maxEchoes,
        );
        recalculateDerivedStats(state);
        return state;
      }),
    prepareResearch: (itemId, targetSchoolId, quantity) =>
      set((state) => {
        prepareResearchAction(state, itemId, targetSchoolId, quantity);
        return state;
      }),
    removePreparedResearch: (slotId) =>
      set((state) => {
        removePreparedResearchAction(state, slotId);
        return state;
      }),
    assignResearchEcho: (slotId) =>
      set((state) => {
        assignResearchEchoAction(state, slotId);
        return state;
      }),
    assignMaxResearchEchoes: (slotId) =>
      set((state) => {
        assignMaxResearchEchoesAction(state, slotId);
        return state;
      }),
    pauseResearch: (slotId) =>
      set((state) => {
        pauseResearchAction(state, slotId);
        return state;
      }),
    assignOneResearchEchoEach: () =>
      set((state) => {
        assignOneResearchEchoEachAction(state);
        return state;
      }),
    removeResearchEcho: (slotId) =>
      set((state) => {
        removeResearchEchoAction(state, slotId);
        return state;
      }),
    setResearchEchoes: (slotId, amount) =>
      set((state) => {
        setResearchEchoesAction(state, slotId, amount);
        return state;
      }),
    clearResearchEchoes: () =>
      set((state) => {
        clearResearchEchoesAction(state);
        return state;
      }),
    clearPreparedResearch: () =>
      set((state) => {
        clearPreparedResearchAction(state);
        return state;
      }),
    forceResearchCycle: (slotId) =>
      set((state) => {
        forceCompleteResearchCycle(state, slotId, { mode: "live" });
        return state;
      }),
    assignTransmutationEcho: (recipeId) => {
      let result = false;
      set((state) => {
        result = assignTransmutationEchoAction(state, recipeId);
        return state;
      });
      return result;
    },
    removeTransmutationEcho: (recipeId) => {
      const before =
        get().activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0;
      set((state) => {
        removeTransmutationEchoAction(state, recipeId);
        return state;
      });
      return (
        (get().activities.transmutation.jobs[recipeId]?.echoesAssigned ?? 0) <
        before
      );
    },
    assignMaxTransmutationEchoes: (recipeId) =>
      set((state) => {
        assignMaxTransmutationEchoesAction(state, recipeId);
        return state;
      }),
    clearTransmutationRecipeEchoes: (recipeId) =>
      set((state) => {
        clearTransmutationRecipeEchoesAction(state, recipeId);
        return state;
      }),
    setTransmutationEchoes: (recipeId, amount) =>
      set((state) => {
        setTransmutationEchoesAction(state, recipeId, amount);
        return state;
      }),
    clearTransmutationAssignments: () =>
      set((state) => {
        clearTransmutationAssignmentsAction(state);
        return state;
      }),
    completeTransmutationCycle: (recipeId) =>
      set((state) => {
        forceCompleteTransmutationCycle(state, recipeId, { mode: "live" });
        return state;
      }),
    grantTransmutationIngredients: (recipeId, cycles = 1) =>
      set((state) => {
        grantTransmutationMissingIngredientsAction(state, recipeId, cycles);
        return state;
      }),
    cancelArtificingCraft: () =>
      set((state) => {
        cancelArtificingCraft(state);
      }),
    grantArtificingIngredients: (recipeId) =>
      set((state) => {
        const recipe = ARTIFICING_RECIPES[recipeId];
        if (recipe)
          recipe.ingredients.forEach((i) => {
            const missing = Math.max(
              0,
              i.quantity - getConsumableQuantity(state, i.itemId),
            );
            if (missing) grantItem(state, i.itemId, missing);
          });
      }),
    craftArtificingRecipe: (recipeId) => {
      let ok = false;
      set((state) => {
        const result = craftArtificing(state, recipeId);
        ok = result.ok;
        if (!result.ok)
          pushNotification(state, result.reason, "warning", {
            key: "artificing-craft-failed",
            cooldownMs: 1200,
          });
        return state;
      });
      return ok;
    },
    upgradeArtifact: (artifactId) => {
      let ok = false;
      set((state) => {
        const result = upgradeArtifactInstant(state, artifactId, {
          free: state.debug.artifactFreeUpgrade,
        });
        ok = result.ok;
        if (result.ok) recalculateDerivedStats(state);
        else
          pushNotification(state, result.reason, "warning", {
            key: "artifact-upgrade-failed",
            cooldownMs: 1200,
          });
        return state;
      });
      if (ok)
        emitActionFeel(
          "success",
          `[data-artifact-id="${artifactId}"]`,
          "var(--ui-success)",
          1.05,
        );
      return ok;
    },
    allocateArtifactNode: (artifactId, nodeId) => {
      let ok = false;
      set((state) => {
        ok = allocateArtifactNode(state, artifactId, nodeId);
        if (!ok)
          pushNotification(
            state,
            "Artifact Node requirements are not satisfied.",
            "warning",
          );
        recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    respecArtifact: (artifactId) => {
      let ok = false;
      set((state) => {
        ok = respecArtifact(state, artifactId);
        recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    grantArcanePoints: (amount) =>
      set((state) => {
        state.arcaneCore = grantArcanePoints(
          state.arcaneCore,
          sanitizeDebugNumber(amount),
        ).state;
        return state;
      }),
    setArcanePoints: (amount) =>
      set((state) => {
        state.arcaneCore = setArcaneCoreTotalPointsEarned(
          state.arcaneCore,
          sanitizeDebugNumber(amount),
        );
        recalculateDerivedStats(state);
        return state;
      }),
    debugGrantResonance: (type, amount) =>
      set((state) => {
        grantResonance(state.resonance, type, amount);
        return state;
      }),
    debugSetResonance: (type, amount) =>
      set((state) => {
        setResonance(state.resonance, type, amount);
        return state;
      }),
    debugClearResonance: (type) =>
      set((state) => {
        clearResonance(state.resonance, type);
        return state;
      }),
    debugClearAllResonance: () =>
      set((state) => {
        clearAllResonance(state.resonance);
        return state;
      }),
    debugGrantResonanceTestBundle: () =>
      set((state) => {
        Object.entries(DEBUG_RESONANCE_TEST_BUNDLE).forEach(
          ([type, amount]) => {
            grantResonance(state.resonance, type as ResonanceType, amount);
          },
        );
        return state;
      }),
    setWorldTier: (tier) => {
      let changed = false;
      set((state) => {
        if (state.combat.active) {
          pushNotification(
            state,
            "Leave the current Location to change World Tier.",
            "warning",
            { key: "world-tier-active-combat", cooldownMs: 1000 },
          );
          return state;
        }
        changed = setCurrentWorldTier(state, tier);
        if (!changed)
          pushNotification(state, `World Tier ${tier} is locked.`, "warning", {
            key: `world-tier-locked-${tier}`,
            cooldownMs: 1000,
          });
        return state;
      });
      return changed;
    },
    debugSetWorldTier: (tier) =>
      set((state) => {
        state.worldTier.highestUnlocked = tier;
        state.worldTier.current = tier;
        return state;
      }),
    debugUnlockWorldTier: (tier) =>
      set((state) => {
        unlockWorldTier(state, tier);
        return state;
      }),
    debugResetWorldTier: () =>
      set((state) => {
        state.worldTier = createInitialWorldTierState();
        return state;
      }),
    purchaseArcaneCoreNode: (nodeId) => {
      let ok = false;
      set((state) => {
        ok = commitArcaneCoreResult(
          state,
          purchaseArcaneCoreNode(state.arcaneCore, nodeId, {
            freeCosts: state.debug.arcaneCoreFreeCosts,
            ignorePrerequisites: state.debug.arcaneCoreIgnorePrerequisites,
          }),
        );
        if (ok) recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    refundArcaneCoreNode: (nodeId) => {
      let ok = false;
      set((state) => {
        ok = commitArcaneCoreResult(
          state,
          refundArcaneCoreNode(state.arcaneCore, nodeId),
        );
        if (ok) recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    setArcaneCoreNodeRank: (nodeId, rank) =>
      set((state) => {
        const result = setArcaneCoreNodeRank(state.arcaneCore, nodeId, rank);
        if (result.ok) {
          state.arcaneCore = result.state;
          recalculateDerivedStats(state);
        }
        return state;
      }),
    maxArcaneCoreNode: (nodeId) =>
      set((state) => {
        const result = maxArcaneCoreNode(state.arcaneCore, nodeId);
        if (result.ok) {
          state.arcaneCore = result.state;
          recalculateDerivedStats(state);
        }
        return state;
      }),
    maxArcaneCoreBranch: (branchId) =>
      set((state) => {
        state.arcaneCore = maxArcaneCoreBranch(state.arcaneCore, branchId);
        recalculateDerivedStats(state);
        return state;
      }),
    resetArcaneCoreNode: (nodeId) =>
      set((state) => {
        const result = resetArcaneCoreNode(state.arcaneCore, nodeId);
        if (result.ok) {
          state.arcaneCore = result.state;
          recalculateDerivedStats(state);
        }
        return state;
      }),
    maxArcaneCoreRing: (branchId, ring) =>
      set((state) => {
        state.arcaneCore = maxArcaneCoreRing(state.arcaneCore, branchId, ring);
        recalculateDerivedStats(state);
        return state;
      }),
    resetArcaneCoreRing: (branchId, ring) =>
      set((state) => {
        const result = resetArcaneCoreRing(state.arcaneCore, branchId, ring);
        if (result.ok) {
          state.arcaneCore = result.state;
          recalculateDerivedStats(state);
        }
        return state;
      }),
    resetArcaneCoreBranch: (branchId) =>
      set((state) => {
        commitArcaneCoreResult(
          state,
          resetArcaneCoreBranchProgression(state.arcaneCore, branchId),
        );
        recalculateDerivedStats(state);
        return state;
      }),
    resetArcaneCore: () =>
      set((state) => {
        commitArcaneCoreResult(state, resetArcaneCore(state.arcaneCore));
        recalculateDerivedStats(state);
        return state;
      }),
    purchaseAllArcaneCoreBranch: (branchId) =>
      set((state) => {
        state.arcaneCore = purchaseAllArcaneCoreNodes(
          state.arcaneCore,
          branchId,
          {
            freeCosts: state.debug.arcaneCoreFreeCosts,
            ignorePrerequisites: state.debug.arcaneCoreIgnorePrerequisites,
          },
        );
        recalculateDerivedStats(state);
        return state;
      }),
    purchaseAllArcaneCore: () =>
      set((state) => {
        state.arcaneCore = purchaseAllArcaneCoreNodes(
          state.arcaneCore,
          undefined,
          {
            freeCosts: state.debug.arcaneCoreFreeCosts,
            ignorePrerequisites: state.debug.arcaneCoreIgnorePrerequisites,
          },
        );
        recalculateDerivedStats(state);
        return state;
      }),
    maxArcanePointsAndPurchaseAll: () =>
      set((state) => {
        state.arcaneCore = setArcaneCoreTotalPointsEarned(
          state.arcaneCore,
          ARCANE_CORE_TOTAL_TREE_COST,
        );
        state.arcaneCore = purchaseAllArcaneCoreNodes(
          state.arcaneCore,
          undefined,
          { freeCosts: false, ignorePrerequisites: true },
        );
        recalculateDerivedStats(state);
        return state;
      }),
    loadArcaneCorePreset: (presetId) => {
      const presetState = getArcaneCorePresetSnapshot(presetId);
      let ok = false;
      set((state) => {
        const result = presetState
          ? applyArcaneCorePreset(state.arcaneCore, presetState)
          : { ok: false as const, reason: "invalid-preset" as const };
        if (result.ok) {
          state.arcaneCore = result.state;
          ok = true;
          recalculateDerivedStats(state);
        } else {
          pushNotification(
            state,
            result.reason === "not-enough-core-points"
              ? "Not enough Arcane Points for this preset."
              : "That Arcane Core preset is invalid.",
            "warning",
            { key: "arcane-core-preset-failed", cooldownMs: 1000 },
          );
        }
        return state;
      });
      return ok;
    },
    debugSetArtifactLevel: (artifactId, level) =>
      set((state) => {
        setDebugArtifactLevelInState(state, artifactId, level);
        recalculateDerivedStats(state);
        return state;
      }),
    debugDecreaseArtifactLevel: (artifactId) =>
      set((state) => {
        const progress = ensureDebugArtifact(state, artifactId);
        if (progress)
          setDebugArtifactLevelInState(state, artifactId, progress.level - 1);
        recalculateDerivedStats(state);
        return state;
      }),
    debugIncreaseArtifactLevel: (artifactId) =>
      set((state) => {
        const progress = ensureDebugArtifact(state, artifactId);
        if (progress)
          setDebugArtifactLevelInState(state, artifactId, progress.level + 1);
        recalculateDerivedStats(state);
        return state;
      }),
    debugGrantArtifactPoints: (artifactId, amount) =>
      set((state) => {
        if (!ensureDebugArtifact(state, artifactId)) return state;
        state.debug.artifactBonusPointsByArtifact[artifactId] = Math.max(
          0,
          Math.floor(
            sanitizeDebugNumber(
              state.debug.artifactBonusPointsByArtifact[artifactId] ?? 0,
            ) + sanitizeDebugNumber(amount),
          ),
        );
        return state;
      }),
    debugRefillArtifactPoints: (artifactId) =>
      set((state) => {
        if (!ensureDebugArtifact(state, artifactId)) return state;
        state.debug.artifactBonusPointsByArtifact[artifactId] = 999;
        return state;
      }),
    debugForceArtifactNode: (artifactId, nodeId) => {
      let ok = false;
      set((state) => {
        ok = forceArtifactNodeInState(state, artifactId, nodeId);
        recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    debugAllocateArtifactNode: (artifactId, nodeId) => {
      let ok = false;
      set((state) => {
        ok = allocateArtifactNode(state, artifactId, nodeId);
        recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    debugLockArtifactNode: (artifactId, nodeId) => {
      let ok = false;
      set((state) => {
        const progress = state.artifactProgress[artifactId];
        const definition = ARTIFACTS[artifactId];
        if (
          !progress ||
          !definition ||
          definition.nodes.some(
            (node) =>
              progress.allocatedNodeIds.includes(node.id) &&
              (node.prerequisites ?? []).includes(nodeId),
          )
        )
          return state;
        const index = progress.allocatedNodeIds.indexOf(nodeId);
        if (index < 0) return state;
        progress.allocatedNodeIds.splice(index, 1);
        progress.attunedNodeIds = progress.attunedNodeIds.filter(
          (id) => id !== nodeId,
        );
        ok = true;
        recalculateDerivedStats(state);
        return state;
      });
      return ok;
    },
    debugUnlockArtifactNodes: (artifactId, mode = "all") =>
      set((state) => {
        unlockDebugArtifactNodesInState(state, artifactId, mode);
        recalculateDerivedStats(state);
        return state;
      }),
    debugResetArtifactPath: (artifactId) =>
      set((state) => {
        respecArtifact(state, artifactId);
        delete state.debug.artifactBonusPointsByArtifact[artifactId];
        recalculateDerivedStats(state);
        return state;
      }),
    debugMaxArtifactLevels: (absolute) =>
      set((state) => {
        Object.entries(ARTIFACTS).forEach(([artifactId, definition]) => {
          if (
            !definition ||
            (state.inventory[artifactId as ArtifactId] ?? 0) < 1
          )
            return;
          setDebugArtifactLevelInState(
            state,
            artifactId as ArtifactId,
            absolute
              ? definition.maxLevel
              : getArtifactLevelCap(state, artifactId as ArtifactId),
          );
        });
        recalculateDerivedStats(state);
        return state;
      }),
    debugUnlockAllArtifactPaths: () =>
      set((state) => {
        Object.entries(ARTIFACTS).forEach(([artifactId, definition]) => {
          if (!definition) return;
          const id = artifactId as ArtifactId;
          ensureDebugArtifact(state, id);
          setDebugArtifactLevelInState(state, id, definition.maxLevel);
          unlockDebugArtifactNodesInState(state, id, "all");
        });
        recalculateDerivedStats(state);
        return state;
      }),
    debugResetAllArtifactPaths: () =>
      set((state) => {
        Object.keys(ARTIFACTS).forEach((artifactId) => {
          respecArtifact(state, artifactId as ArtifactId);
          delete state.debug.artifactBonusPointsByArtifact[
            artifactId as ArtifactId
          ];
        });
        recalculateDerivedStats(state);
        return state;
      }),
    debugGrantArtifactMaterials: () =>
      set((state) => {
        grantDebugArtifactMaterialsInState(state);
        return state;
      }),
    setDebugTransmutationEchoCapacity: (amount) =>
      set((state) => {
        setTransmutationEchoCapacityOverrideAction(state, amount);
        return state;
      }),
    castSpell: (spellId) =>
      set((state) => {
        castSpellAction(state, spellId, combatEventSink);
        suppressGuardianIfOutOfMana(state);
        return state;
      }),
    debugCastSpell: (spellId) =>
      set((state) => {
        debugCastSpellAction(state, spellId, combatEventSink);
        suppressGuardianIfOutOfMana(state);
        return state;
      }),
    requestManualSpell: (spellId) => {
      let result!: ManualSpellRequestResult;
      set((state) => {
        result = requestManualSpellAction(state, spellId, combatEventSink);
        suppressGuardianIfOutOfMana(state);
        return state;
      });
      return result;
    },
    clearAutoCast: () => {
      let cleared = false;
      set((state) => {
        cleared = clearAutoCastAction(state);
        return state;
      });
      if (cleared)
        emitActionFeel(
          "autocast-off",
          ".combat-spell-deck-foot",
          "var(--ui-secondary)",
        );
      return cleared;
    },
    toggleAutoCast: (spellId) => {
      let changed = false;
      set((state) => {
        changed = toggleAutoCastState(state, spellId);
        return state;
      });
      if (changed)
        emitActionFeel(
          "autocast-on",
          `[data-spell-id="${spellId}"]`,
          "var(--ui-secondary)",
        );
      else
        emitActionFeel(
          "error",
          `[data-spell-id="${spellId}"]`,
          "var(--ui-warning)",
          0.75,
        );
      return changed;
    },
    moveAutoCastPriority: (spellId, direction) => {
      let moved = false;
      set((state) => {
        moved = moveAutoCastPriorityAction(state, spellId, direction);
        return state;
      });
      return moved;
    },
    createSpellPreset: (name) => {
      let result!: SpellPresetId;
      set((state) => {
        result = createSpellPresetAction(state, name);
        return state;
      });
      return result;
    },
    renameSpellPreset: (id, name) => {
      let result = false;
      set((state) => {
        result = renameSpellPresetAction(state, id, name);
        return state;
      });
      return result;
    },
    duplicateSpellPreset: (id) => {
      let result: SpellPresetId | null = null;
      set((state) => {
        result = duplicateSpellPresetAction(state, id);
        return state;
      });
      return result;
    },
    deleteSpellPreset: (id) => {
      let result = false;
      set((state) => {
        result = deleteSpellPresetAction(state, id);
        return state;
      });
      return result;
    },
    saveSpellPreset: (preset) => {
      let result = false;
      set((state) => {
        result = saveSpellPresetAction(state, preset);
        return state;
      });
      return result;
    },
    selectSpellPreset: (id) => {
      let result: ApplySpellPresetResult = {
        ok: false,
        reason: "missing-preset",
        unavailableSpellIds: [],
      };
      set((state) => {
        result = selectSpellPresetAction(state, id);
        return state;
      });
      return result;
    },
    selectSpellPresetForEditing: (id) => {
      let result = false;
      set((state) => {
        result = selectSpellPresetForEditingAction(state, id);
        return state;
      });
      return result;
    },
    addSpellToSelectedPreset: (spellId) => {
      let result: SelectedPresetSlotMutationResult = { ok: false, reason: "missing-preset" };
      set((state) => {
        result = addSpellToSelectedPresetAction(state, spellId);
        return state;
      });
      return result;
    },
    addSpellToSelectedPresetAt: (spellId, index) => {
      let result: SelectedPresetSlotMutationResult = { ok: false, reason: 'missing-preset' };
      set((state) => { result = addSpellToSelectedPresetAtAction(state, spellId, index); return state });
      return result;
    },
    removeSpellFromSelectedPreset: (spellId) => {
      let result: SelectedPresetSlotMutationResult = { ok: false, reason: "missing-preset" };
      set((state) => {
        result = removeSpellFromSelectedPresetAction(state, spellId);
        return state;
      });
      return result;
    },
    moveSelectedPresetSlot: (fromIndex, toIndex) => {
      let result: SelectedPresetSlotMutationResult = { ok: false, reason: "missing-preset" };
      set((state) => {
        result = moveSelectedPresetSlotAction(state, fromIndex, toIndex);
        return state;
      });
      return result;
    },
    swapSelectedPresetSlots: (sourceIndex, targetIndex) => {
      let result: SelectedPresetSlotMutationResult = { ok: false, reason: "missing-preset" };
      set((state) => {
        result = swapSelectedPresetSlotsAction(state, sourceIndex, targetIndex);
        return state;
      });
      return result;
    },
    setPresetSlotAutoCast: (id, spellId, autoCast) => {
      let result = false;
      set((state) => {
        result = setPresetSlotAutoCastAction(state, id, spellId, autoCast);
        if (
          result &&
          !state.combat.active &&
          state.spellPresets.selectedPresetId === id
        )
          syncSelectedSpellPresetRuntime(state);
        return state;
      });
      return result;
    },
    setPresetSlotAutomation: (id, spellId, automation) => {
      let result = false;
      set((state) => {
        result = setPresetSlotAutomationAction(state, id, spellId, automation);
        return state;
      });
      return result;
    },
    applySpellPreset: (id) => {
      let result: ApplySpellPresetResult = {
        ok: false,
        reason: "missing-preset",
        unavailableSpellIds: [],
      };
      set((state) => {
        result = applySpellPresetAction(state, id);
        return state;
      });
      return result;
    },
    enterDungeon: (dungeonId = "whispering-woods") => {
      const dungeon = DUNGEONS[dungeonId];
      const currentState = get();
      if (!dungeon) return;
      if (!isDungeonUnlocked(dungeon, currentState.progress)) {
        set((state) => {
          pushNotification(
            state,
            `${getDungeonUnlockRequirement(dungeon) ?? "Requirement"} to unlock ${dungeon.name}.`,
            "warning",
          );
          return state;
        });
        return;
      }
      if (
        currentState.combat.active &&
        currentState.combat.dungeonId === dungeonId
      )
        return;
      const switching = currentState.combat.active;
      if (switching) endActiveDungeonRun();
      set((state) => {
        initializeDungeonRun(state, dungeonId, switching);
        state.ui.lastEnteredCombatDungeonId = dungeonId;
        return state;
      });
    },
    enterTargetedCombat: (dungeonId, targetEnemyId) => {
      const locationId = Object.values(COMBAT_LOCATIONS).find(
        (location) => location.dungeonId === dungeonId,
      )?.id;
      return locationId
        ? get().huntCombatTarget(locationId, targetEnemyId)
        : false;
    },
    huntCombatTarget: (locationId, targetEnemyId) => {
      const location = COMBAT_LOCATIONS[locationId];
      const dungeonId = location?.dungeonId;
      const dungeon = dungeonId ? DUNGEONS[dungeonId] : null;
      const currentState = get();
      if (
        !location ||
        !dungeonId ||
        !dungeon ||
        !isCombatTargetForLocation(location, dungeonId, targetEnemyId)
      ) {
        set((state) => {
          pushNotification(
            state,
            `${MONSTERS[targetEnemyId]?.name ?? targetEnemyId} is not a valid target for this Location.`,
            "warning",
          );
          return state;
        });
        return false;
      }
      if (!isDungeonUnlocked(dungeon, currentState.progress)) {
        set((state) => {
          pushNotification(
            state,
            `${getDungeonUnlockRequirement(dungeon) ?? "Requirement"} to unlock ${dungeon.name}.`,
            "warning",
          );
          return state;
        });
        return false;
      }
      const sameLocation = Boolean(
        currentState.combat.active &&
        currentState.combat.dungeonId === dungeonId,
      );
      if (!sameLocation) {
        if (currentState.combat.active) endActiveDungeonRun();
        set((state) => {
          initializeDungeonRun(
            state,
            dungeonId,
            currentState.combat.active,
            targetEnemyId,
          );
          if (state.combat.active)
            appendLog(
              state,
              `Hunting target: ${MONSTERS[targetEnemyId].name}.`,
            );
          state.ui.lastEnteredCombatDungeonId = dungeonId;
          return state;
        });
        const nextState = get();
        return (
          nextState.combat.active &&
          nextState.combat.dungeonId === dungeonId &&
          nextState.combat.targetEnemyId === targetEnemyId
        );
      }

      let hunted = false;
      set((state) => {
        const sameActiveTarget =
          state.combat.enemyId === targetEnemyId &&
          !state.combat.inBossFight &&
          state.combat.targetEnemyId === targetEnemyId;
        if (sameActiveTarget) {
          state.combat.pendingBossId = null;
          hunted = true;
          return state;
        }
        abandonCurrentEncounter(state);
        state.combat.targetEnemyId = targetEnemyId;
        state.combat.encounterTimerMs = 0;
        hunted = spawnEnemy(state, targetEnemyId, combatLogUiSink);
        if (hunted)
          appendLog(state, `Hunting target: ${MONSTERS[targetEnemyId].name}.`);
        return state;
      });
      return hunted;
    },
    setCombatTarget: (enemyId) => {
      let changed = false;
      set((state) => {
        const dungeonId = state.combat.dungeonId;
        const dungeon = dungeonId ? DUNGEONS[dungeonId] : null;
        const location = dungeonId
          ? getCombatLocationByDungeonId(dungeonId)
          : null;
        if (
          !state.combat.active ||
          !dungeon ||
          !isCombatTargetForLocation(location, dungeonId, enemyId)
        ) {
          pushNotification(
            state,
            `${MONSTERS[enemyId]?.name ?? enemyId} is not a valid active combat target.`,
            "warning",
          );
          return state;
        }
        if (state.combat.targetEnemyId === enemyId) {
          changed = true;
          return state;
        }
        const hadTarget = Boolean(state.combat.targetEnemyId);
        state.combat.targetEnemyId = enemyId;
        appendLog(
          state,
          `${hadTarget ? "Target changed" : "Hunting target"}: ${MONSTERS[enemyId].name}.`,
        );
        changed = true;
        return state;
      });
      return changed;
    },
    leaveDungeon: () => {
      endActiveDungeonRun();
      return set((state) => {
        const sequence =
          getCombatEncounterMode(
            getCombatLocationByDungeonId(state.combat.dungeonId),
          ) === "sequence";
        state.combat = {
          ...createInitialState().combat,
          dungeonId: state.combat.dungeonId,
          log: [
            sequence
              ? "Left the dungeon run."
              : "Left the Location. Threat resets.",
          ],
        };
        return state;
      });
    },
    engageBoss: (bossId) =>
      set((state) => {
        const dungeon = state.combat.dungeonId
          ? DUNGEONS[state.combat.dungeonId]
          : null;
        const boss = MONSTERS[bossId];
        if (!state.combat.active || !dungeon) {
          pushNotification(state, "Enter a Location first", "warning");
          return state;
        }
        if (
          getCombatEncounterMode(getCombatLocationByDungeonId(dungeon.id)) ===
          "sequence"
        )
          return state;
        if (!isDungeonUnlocked(dungeon, state.progress)) {
          pushNotification(state, `${dungeon.name} is locked.`, "warning");
          return state;
        }
        if (!boss || dungeon.boss !== bossId) {
          pushNotification(
            state,
            `${boss?.name ?? bossId} is not the boss of ${dungeon.name}.`,
            "warning",
          );
          return state;
        }
        const threatRequired = resolveBossThreatRequirement(
          dungeon.id,
          state.worldTier.current,
        );
        if (state.combat.threatCleared < threatRequired) {
          pushNotification(
            state,
            `${boss.name} requires ${threatRequired} Threat`,
            "warning",
          );
          return state;
        }
        if (
          isBossCurrentlyActive(state) ||
          state.combat.pendingBossId ||
          isAutoHuntEnabledForDungeon(state, dungeon.id)
        )
          return state;
        if (
          !canManuallyEngageDungeonBoss(
            {
              combat: state.combat,
              progress: state.progress,
              worldTier: state.worldTier.current,
            },
            dungeon,
          )
        )
          return state;
        state.combat.pendingBossId = null;
        state.combat.encounterTimerMs = 0;
        if (spawnEnemy(state, bossId, combatLogUiSink))
          pushNotification(state, `${boss.name} engaged`, "warning");
        return state;
      }),
    toggleAutoHunt: (dungeonId = "whispering-woods") =>
      set((state) => {
        const dungeon = DUNGEONS[dungeonId];
        const location = getCombatLocationByDungeonId(dungeonId);
        if (
          !dungeon ||
          getCombatEncounterMode(location) !== "targeted" ||
          !isDungeonUnlocked(dungeon, state.progress)
        )
          return state;
        if (!isAutoHuntUnlocked(state.progress)) {
          pushNotification(
            state,
            "Auto Hunt unlocks after the first Boss clear",
            "warning",
          );
          return state;
        }

        state.progress.autoHuntBossUnlocked = true;
        const enabled = !state.progress.autoHuntBossByDungeon[dungeonId];
        state.progress.autoHuntBossByDungeon[dungeonId] = enabled;

        const activeLocation =
          state.combat.active && state.combat.dungeonId === dungeonId;
        const bossActive = isBossCurrentlyActive(state);
        const threatRequired = resolveBossThreatRequirement(
          dungeonId,
          state.worldTier.current,
        );
        if (
          !enabled &&
          activeLocation &&
          state.combat.pendingBossId === dungeon.boss &&
          !bossActive
        ) {
          state.combat.pendingBossId = null;
          appendLog(
            state,
            `Auto Hunt disabled. ${MONSTERS[dungeon.boss].name} will not be queued.`,
          );
        }
        if (
          enabled &&
          activeLocation &&
          state.combat.threatCleared >= threatRequired &&
          !bossActive &&
          !state.combat.pendingBossId
        ) {
          state.combat.pendingBossId = dungeon.boss;
          pushNotification(
            state,
            `Auto Hunt Boss queued ${MONSTERS[dungeon.boss].name}`,
            "info",
          );
        }
        return state;
      }),
    killCurrentEnemy: () =>
      set((state) => {
        forceKillEnemyForDebug(state, { uiEvents: combatLogUiSink });
        return state;
      }),
    despawnDebugEnemy: () =>
      set((state) => {
        despawnEnemyForDebug(state);
        return state;
      }),
    fastResolveDebugEnemies: (amount, dungeonId, stopAtBossReady = true) =>
      set((state) => {
        fastResolveNormalEnemiesForDebug(
          state,
          amount,
          dungeonId ?? state.combat.dungeonId ?? "whispering-woods",
          stopAtBossReady,
          {
            uiEvents: combatLogUiSink,
            onItemAcquired: (itemId, quantity) =>
              recordRecentAcquisition(state, itemId, quantity),
            onCombatLoot: combatLootObserver,
          },
        );
        return state;
      }),
    clearDebugThreatToBoss: (dungeonId) =>
      set((state) => {
        clearToBossForDebug(
          state,
          dungeonId ?? state.combat.dungeonId ?? "whispering-woods",
          {
            uiEvents: combatLogUiSink,
            onItemAcquired: (itemId, quantity) =>
              recordRecentAcquisition(state, itemId, quantity),
            onCombatLoot: combatLootObserver,
          },
        );
        return state;
      }),
    jumpDebugToBoss: (dungeonId) =>
      set((state) => {
        jumpToBossForDebug(
          state,
          dungeonId ?? state.combat.dungeonId ?? "whispering-woods",
          { uiEvents: combatLogUiSink },
        );
        return state;
      }),
    restartDebugBoss: () =>
      set((state) => {
        restartBossForDebug(state, { uiEvents: combatLogUiSink });
        return state;
      }),
    advanceCombatDebug: (durationMs) =>
      set((state) => {
        advanceCombatOnlyForDebug(state, durationMs, {
          mode: "live",
          uiEvents: combatEventSink,
          telemetry: combatTelemetryObserver,
          alerts: combatAlertsObserver,
          statistics: dungeonStatisticsObserver,
          onItemAcquired: (itemId, amount) =>
            recordRecentAcquisition(state, itemId, amount),
          onCombatLoot: combatLootObserver,
        });
        return state;
      }),
    spawnDebugEnemy: (enemyId, dungeonId) =>
      set((state) => {
        const contextDungeonId =
          dungeonId ?? state.combat.dungeonId ?? "whispering-woods";
        state.combat.active = true;
        state.combat.dungeonId = contextDungeonId;
        spawnEnemy(state, enemyId, combatLogUiSink);
        pushNotification(
          state,
          `${MONSTERS[enemyId].name} spawned by Developer Tools in ${DUNGEONS[contextDungeonId].name}`,
          "warning",
        );
        return state;
      }),
    setEnemyHealthPercent: (percent) =>
      set((state) => {
        if (state.combat.enemyId) {
          const previousHp = state.combat.enemyHp;
          const nextHp = Math.max(
            0,
            Math.min(
              state.combat.enemyMaxHp,
              (state.combat.enemyMaxHp * clamp(percent, 0, 100)) / 100,
            ),
          );
          state.combat.enemyHp = nextHp;
          if (nextHp !== previousHp) {
            const context = {
              source: {
                actor: "player" as const,
                kind: "system" as const,
                sourceId: "developer-health-control",
              },
              eventTarget: "enemy" as const,
              changedActor: "enemy" as const,
              sourceTags: [],
              previousHp,
              currentHp: nextHp,
              previousHpPercent:
                (previousHp / Math.max(1, state.combat.enemyMaxHp)) * 100,
              currentHpPercent:
                (nextHp / Math.max(1, state.combat.enemyMaxHp)) * 100,
            };
            const resolution = createCombatResolutionContext();
            runCombatTriggers(
              state,
              "enemy",
              "on-hp-threshold",
              context,
              executeCombatEffects,
              0,
              [],
              combatLogUiSink,
              resolution,
            );
            runCombatTriggers(
              state,
              "player",
              "on-hp-threshold",
              context,
              executeCombatEffects,
              0,
              [],
              combatLogUiSink,
              resolution,
            );
          }
        }
        return state;
      }),
    damagePlayerForDebug: (amount) =>
      set((state) => {
        damagePlayer(state, Math.max(0, sanitizeDebugNumber(amount)), {
          actor: "enemy",
          kind: "system",
          sourceId: "developer-damage",
          tags: ["direct"],
        });
        return state;
      }),
    applyPlayerStatus: (statusId) =>
      set((state) => {
        debugApplyStatus(state, "player", statusId);
        return state;
      }),
    applyEnemyStatus: (statusId) =>
      set((state) => {
        debugApplyStatus(state, "enemy", statusId);
        return state;
      }),
    removePlayerStatus: (statusId) =>
      set((state) => {
        removeCombatStatus(state, "player", statusId);
        return state;
      }),
    removeEnemyStatus: (statusId) =>
      set((state) => {
        removeCombatStatus(state, "enemy", statusId);
        return state;
      }),
    setPlayerBarrier: (amount) =>
      set((state) => {
        state.combat.playerBarrier = Math.max(
          0,
          Math.floor(sanitizeDebugNumber(amount)),
        );
        if (state.combat.playerBarrier === 0)
          state.combat.playerBarrierRemainingMs = null;
        return state;
      }),
    setEnemyBarrier: (amount) =>
      set((state) => {
        state.combat.enemyBarrier = Math.max(
          0,
          Math.floor(sanitizeDebugNumber(amount)),
        );
        if (state.combat.enemyBarrier === 0)
          state.combat.enemyBarrierRemainingMs = null;
        return state;
      }),
    clearPlayerBarrier: () =>
      set((state) => {
        state.combat.playerBarrier = 0;
        state.combat.playerBarrierRemainingMs = null;
        return state;
      }),
    clearEnemyBarrier: () =>
      set((state) => {
        state.combat.enemyBarrier = 0;
        state.combat.enemyBarrierRemainingMs = null;
        return state;
      }),
    forceEnemyAction: (actionId) =>
      set((state) => {
        if (state.combat.enemyId)
          forceResolveEnemyActionRuntime(
            state,
            actionId,
            executeCombatEffects,
            0,
            combatLogUiSink,
          );
        return state;
      }),
    startEnemyAction: (actionId) =>
      set((state) => {
        if (state.combat.enemyId)
          startEnemyActionRuntime(
            state,
            actionId,
            executeCombatEffects,
            undefined,
            0,
            combatLogUiSink,
          );
        return state;
      }),
    resolveCurrentEnemyAction: () =>
      set((state) => {
        resolveCurrentEnemyActionRuntime(
          state,
          executeCombatEffects,
          0,
          combatLogUiSink,
        );
        return state;
      }),
    advanceEnemyAction: () =>
      set((state) => {
        startNextEnemyActionRuntime(
          state,
          executeCombatEffects,
          0,
          combatLogUiSink,
        );
        return state;
      }),
    setEnemyActionPattern: (patternId) =>
      set((state) => {
        setEnemyActionPatternRuntime(state, patternId, combatLogUiSink);
        return state;
      }),
    resetEnemyActionPattern: () =>
      set((state) => {
        if (state.combat.enemyId)
          setEnemyActionPatternRuntime(
            state,
            MONSTERS[state.combat.enemyId].defaultActionPatternId,
            combatLogUiSink,
          );
        return state;
      }),
    resetEnemyActionCursor: () =>
      set((state) => {
        state.combat.enemyNextActionIndex = 0;
        return state;
      }),
    resetCombatRuleRuntime: () =>
      set((state) => {
        resetCombatRuleRuntime(state);
        return state;
      }),
    clearCombatStatuses: () =>
      set((state) => {
        state.combat.playerStatuses = [];
        state.combat.enemyStatuses = [];
        return state;
      }),
    clearPlayerStatuses: () =>
      set((state) => {
        state.combat.playerStatuses = [];
        return state;
      }),
    clearEnemyStatuses: () =>
      set((state) => {
        state.combat.enemyStatuses = [];
        return state;
      }),
    saveGame: (reason = "manual") => {
      const activeProfileId = getActiveProfileId();
      const savedAt = Date.now();
      let result: SaveResult = { ok: false, error: "Profile save failed." };
      set((state) => {
        result = saveGameAction(state, activeProfileId, reason, savedAt);
        return state;
      });
      return result;
    },
    reloadFromStorage: () => {
      const activeProfileId = getActiveProfileId();
      if (!activeProfileId) return;
      const loaded = loadProfileGame(activeProfileId);
      if (!loaded.state) return;
      useArcaneCorePresetStore.getState().reset();
      clearCombatLogUi();
      clearCombatAlerts();
      clearCombatRecap();
      clearCombatDefeat();
      clearDungeonStatistics();
      combatTelemetryObserver.clear();
      set((state) => {
        Object.assign(state, loaded.state as GameState);
        state.debug = createDefaultDebugOverrides();
        state.recentAcquisitions = [];
        state.lastOfflineBankReport = null;
        if (!isScreenUnlocked(state, state.ui.screen)) state.ui.screen = "home";
        recalculateDerivedStats(state);
        return state;
      });
    },
    resetSave: () => {
      const fresh = createInitialState();
      useArcaneCorePresetStore.getState().reset();
      const activeProfileId = getActiveProfileId();
      resetProfileAttention(activeProfileId);
      if (activeProfileId) {
        const saved = resetProfileGame(activeProfileId, fresh);
        if (!saved.ok) {
          set((state) => {
            pushNotification(
              state,
              saved.error ?? "The profile reset could not be saved.",
              "warning",
            );
            return state;
          });
          return;
        }
      }
      clearCombatLogUi();
      clearCombatAlerts();
      clearCombatRecap();
      clearCombatDefeat();
      clearDungeonStatistics();
      combatTelemetryObserver.clear();
      set((state) => {
        Object.assign(state, fresh);
        state.recentAcquisitions = [];
        state.lastOfflineBankReport = null;
        return state;
      });
      if (activeProfileId)
        updateProfileMetadata(activeProfileId, {
          lastSavedAt: fresh.lastSavedAt,
        });
    },
    hydrateState: (nextState) => {
      useArcaneCorePresetStore.getState().reset();
      clearCombatLogUi();
      clearCombatAlerts();
      clearCombatRecap();
      clearCombatDefeat();
      clearDungeonStatistics();
      combatTelemetryObserver.clear();
      return set((state) => {
        Object.assign(state, nextState);
        state.debug = createDefaultDebugOverrides();
        state.recentAcquisitions = [];
        state.lastOfflineBankReport = null;
        if (
          state.ui.screen === "crystals"
            ? !isCrystalSystemUnlocked(state)
            : !isScreenUnlocked(state, state.ui.screen)
        )
          state.ui.screen = "home";
        recalculateDerivedStats(state);
        return state;
      });
    },
    dismissNotification: (id) =>
      set((state) => {
        state.notifications = state.notifications.filter(
          (note) => note.id !== id,
        );
        return state;
      }),
    setPlayer: (changes) =>
      set((state) => {
        state.player = { ...state.player, ...changes };
        recalculateDerivedStats(state);
        return state;
      }),
    addMana: (amount) =>
      set((state) => {
        state.player.mana = stabilizeResourceValue(
          Math.max(0, state.player.mana + sanitizeDebugNumber(amount)),
        );
        recalculateDerivedStats(state);
        return state;
      }),
    setSchoolXpDebug: (school, xp) =>
      set((state) => {
        setSchoolXpDebugAction(state, school, xp);
        return state;
      }),
    setSchoolLevelDebug: (school, level) =>
      set((state) => {
        setSchoolLevelDebugAction(state, school, level);
        return state;
      }),
    setLevelCap: (cap) =>
      set((state) => {
        setLevelCapAction(state, cap);
        return state;
      }),
    setThreat: (amount) =>
      set((state) => {
        setThreatAction(state, amount);
        return state;
      }),
    addItem: (itemId, quantity) =>
      set((state) => {
        addItemAction(state, itemId, quantity);
        return state;
      }),
    removeItem: (itemId, quantity) =>
      set((state) => {
        removeItemAction(state, itemId, quantity);
        return state;
      }),
    toggleItemProtection: (itemId) => {
      const before = Boolean(get().protectedItems[itemId]);
      set((state) => {
        toggleItemProtectionAction(state, itemId);
        return state;
      });
      const after = Boolean(get().protectedItems[itemId]);
      if (after !== before)
        emitActionFeel(
          after ? "protect" : "unprotect",
          `[data-item-id="${itemId}"], .inventory-actions-content`,
          "var(--ui-secondary)",
        );
      else
        emitActionFeel(
          "error",
          `[data-item-id="${itemId}"], .inventory-actions-content`,
          "var(--ui-warning)",
          0.75,
        );
      return after !== before;
    },
    sellItem: (itemId, quantity) => {
      let sold = 0;
      set((state) => {
        sold = sellItemAction(state, itemId, quantity);
        return state;
      });
      emitActionFeel(
        sold > 0 ? "sell" : "error",
        `[data-item-id="${itemId}"], .inventory-actions-content`,
        sold > 0 ? "var(--ui-gold)" : "var(--ui-warning)",
        sold > 0 ? 0.95 : 0.75,
      );
      return sold;
    },
    destroyItem: (itemId, quantity) => {
      let destroyed = 0;
      set((state) => {
        destroyed = destroyItemAction(state, itemId, quantity);
        return state;
      });
      emitActionFeel(
        destroyed > 0 ? "destroy" : "error",
        `[data-item-id="${itemId}"], .inventory-actions-content`,
        destroyed > 0 ? "var(--ui-danger)" : "var(--ui-warning)",
        destroyed > 0 ? 0.95 : 0.75,
      );
      return destroyed;
    },
    openCrystalCaches: (quantity) => {
      let result: CrystalCacheOpenResult = {
        ok: false,
        opened: 0,
        dust: 0,
        crystals: {},
        reason: "No Crystal Caches are available.",
      };
      set((state) => {
        result = openCrystalCaches(state, quantity);
        return state;
      });
      return result;
    },
    equipCrystal: (variantId, slot) => {
      let result: ReturnType<typeof equipCrystal> = { ok: false };
      set((state) => {
        result = equipCrystal(state, variantId, slot);
        if (!result.ok && result.reason)
          pushNotification(state, result.reason, "warning", {
            key: "crystal-equip",
            cooldownMs: 700,
          });
        if (result.ok) recalculateDerivedStats(state);
        return state;
      });
      return result.ok;
    },
    unequipCrystal: (slot) => {
      let result: ReturnType<typeof unequipCrystal> = { ok: false };
      set((state) => {
        result = unequipCrystal(state, slot);
        if (!result.ok && result.reason)
          pushNotification(state, result.reason, "warning", {
            key: "crystal-unequip",
            cooldownMs: 700,
          });
        if (result.ok) recalculateDerivedStats(state);
        return state;
      });
      return result.ok;
    },
    saveCrystalPreset: (presetId) => {
      let ok = false;
      set((state) => {
        ok = saveCrystalPreset(state, presetId);
        return state;
      });
      return ok;
    },
    renameCrystalPreset: (presetId, name) => {
      let ok = false;
      set((state) => {
        ok = renameCrystalPreset(state, presetId, name);
        return state;
      });
      return ok;
    },
    loadCrystalPreset: (presetId) => {
      let result: ReturnType<typeof loadCrystalPreset> = {
        ok: false,
        reason: "Crystal preset not found.",
      };
      set((state) => {
        result = loadCrystalPreset(state, presetId);
        if (!result.ok && result.reason)
          pushNotification(state, result.reason, "warning", {
            key: "crystal-preset-load",
            cooldownMs: 900,
          });
        if (result.ok) recalculateDerivedStats(state);
        return state;
      });
      return result.ok;
    },
    upgradeCrystal: (variantId, equippedSlot) => {
      let result: ReturnType<typeof upgradeCrystal> = {
        ok: false,
        reason: "Crystal upgrade failed.",
      };
      set((state) => {
        result = upgradeCrystal(state, variantId, equippedSlot);
        if (!result.ok && result.reason)
          pushNotification(state, result.reason, "warning", {
            key: "crystal-upgrade",
            cooldownMs: 900,
          });
        if (result.ok) recalculateDerivedStats(state);
        return state;
      });
      return result.ok;
    },
    crushCrystal: (variantId, quantity) => {
      let result: ReturnType<typeof crushCrystals> = {
        ok: false,
        quantity: 0,
        dust: 0,
        reason: "No unequipped copies are available to Crush.",
      };
      set((state) => {
        result = crushCrystals(state, variantId, quantity);
        if (!result.ok && result.reason)
          pushNotification(state, result.reason, "warning", {
            key: "crystal-crush",
            cooldownMs: 900,
          });
        return state;
      });
      return result.ok;
    },
    bulkCrushCrystals: (requests) => {
      let result: ReturnType<typeof bulkCrushCrystals> = {
        ok: false,
        quantity: 0,
        dust: 0,
        reason: "No unequipped copies are available to Crush.",
      };
      set((state) => {
        result = bulkCrushCrystals(state, requests);
        if (!result.ok && result.reason)
          pushNotification(state, result.reason, "warning", {
            key: "crystal-crush",
            cooldownMs: 900,
          });
        return state;
      });
      return result.ok;
    },
    debugUnlockCrystals: () =>
      set((state) => {
        state.progress.bossKillsByBoss["meridian-splitter"] = Math.max(
          1,
          state.progress.bossKillsByBoss["meridian-splitter"] ?? 0,
        );
        return state;
      }),
    debugAddCrystalDust: (amount) =>
      set((state) => {
        state.crystals.dust += Math.max(
          0,
          Math.floor(Number.isFinite(amount) ? amount : 0),
        );
        return state;
      }),
    debugSetCrystalDust: (amount) =>
      set((state) => {
        state.crystals.dust = Math.max(
          0,
          Math.floor(Number.isFinite(amount) ? amount : 0),
        );
        return state;
      }),
    debugClearCrystalDust: () =>
      set((state) => {
        state.crystals.dust = 0;
        return state;
      }),
    debugGrantCrystal: (variantId, quantity) =>
      set((state) => {
        const amount = Math.max(
          0,
          Math.floor(Number.isFinite(quantity) ? quantity : 0),
        );
        state.crystals.owned[variantId] =
          (state.crystals.owned[variantId] ?? 0) + amount;
        return state;
      }),
    debugRemoveCrystal: (variantId, quantity) =>
      set((state) => {
        removeAvailableCrystals(state, variantId, quantity);
        return state;
      }),
    debugGrantAllT1Crystals: (quantity) =>
      set((state) => {
        const amount = Math.max(
          0,
          Math.floor(Number.isFinite(quantity) ? quantity : 0),
        );
        CRYSTAL_FAMILY_ORDER.forEach((familyId) => {
          const variantId = `${familyId}-t1` as CrystalVariantId;
          state.crystals.owned[variantId] =
            (state.crystals.owned[variantId] ?? 0) + amount;
        });
        return state;
      }),
    debugSetCrystalUnlockedSlots: (amount) =>
      set((state) => {
        const next = Math.max(
          5,
          Math.min(15, Math.floor(Number.isFinite(amount) ? amount : 5)),
        );
        state.crystals.unlockedSlots = next;
        for (
          let index = next;
          index < state.crystals.equippedSlots.length;
          index += 1
        )
          state.crystals.equippedSlots[index] = null;
        recalculateDerivedStats(state);
        return state;
      }),
    debugResetCrystalRng: () =>
      set((state) => {
        state.crystals.rngState = CRYSTAL_RNG_DEFAULT_SEED;
        return state;
      }),
    debugClearCrystalCaches: () =>
      set((state) => {
        state.inventory[CRYSTAL_CACHE_ITEM_ID] = 0;
        return state;
      }),
    debugResetCrystals: () =>
      set((state) => {
        state.crystals = createInitialCrystalState();
        recalculateDerivedStats(state);
        return state;
      }),
    clearRecentNew: (itemId) =>
      set((state) => {
        const entry = state.recentAcquisitions.find(
          (item) => item.itemId === itemId,
        );
        if (entry) entry.isNew = false;
        return state;
      }),
    equipItem: (itemId, targetPosition) => {
      let succeeded = false;
      let changedPosition: EquipmentPosition | null = null;
      set((state) => {
        const result = equipItemAction(state, itemId, targetPosition);
        succeeded = result.ok;
        if (result.ok) changedPosition = result.position;
        return state;
      });
      if (succeeded && changedPosition)
        emitActionFeel(
          "equip",
          `.equipment-slot-card[data-position="${changedPosition}"]`,
          ITEMS[itemId].color,
          1.05,
        );
      else
        emitActionFeel(
          "error",
          targetPosition
            ? `.equipment-slot-card[data-position="${targetPosition}"]`
            : `.equipment-armory-card.selected, .equipment-inspector-actions`,
          "var(--ui-warning)",
          0.8,
        );
    },
    unequipItem: (position) => {
      let changed = false;
      set((state) => {
        changed = unequipItemAction(state, position).ok;
        return state;
      });
      if (changed)
        emitActionFeel(
          "unequip",
          `.equipment-slot-card[data-position="${position}"]`,
          "var(--ui-text-muted)",
          0.8,
        );
      else
        emitActionFeel(
          "error",
          `.equipment-slot-card[data-position="${position}"]`,
          "var(--ui-warning)",
          0.75,
        );
    },
    unlockAllSpells: () =>
      set((state) => {
        unlockAllSpellsAction(state);
        return state;
      }),
    debugUnlockSpellRankOne: (spellId) =>
      set((state) => {
        debugUnlockSpellRankOneAction(state, spellId);
        return state;
      }),
    debugLockSpell: (spellId) =>
      set((state) => {
        debugLockSpellAction(state, spellId);
        return state;
      }),
    resetSpellCooldowns: () =>
      set((state) => {
        resetSpellCooldownsAction(state);
        return state;
      }),
    donateGuildRequest: (requestId, amount) =>
      set((state) => {
        donateGuildRequestAction(state, requestId, amount);
        return state;
      }),
    claimGuildReward: (requestId) =>
      set((state) => {
        claimGuildRewardAction(state, requestId);
        return state;
      }),
    promoteGuild: () =>
      set((state) => {
        promoteGuildAction(state);
        return state;
      }),
    setGuildReputation: (amount) =>
      set((state) => {
        state.progress.guildReputation = Math.max(0, amount);
        return state;
      }),
    setBossKills: (bossId, amount) =>
      set((state) => {
        setBossKillsAction(state, bossId, amount);
        return state;
      }),
    creditOfflineAbsence: (elapsedMs, notify = true) =>
      set((state) => {
        const safeElapsed = clampOfflineBankMs(elapsedMs);
        if (safeElapsed <= 1000) return state;
        const before = clampOfflineBankMs(state.offlineBankMs);
        state.offlineBankMs = addOfflineBankMs(before, safeElapsed);
        if (notify && state.offlineBankMs > before)
          pushNotification(
            state,
            `${Math.round(safeElapsed / 1000)}s added to Offline Bank`,
            "info",
          );
        return state;
      }),
    debugAddOfflineBank: (durationMs) =>
      set((state) => {
        state.offlineBankMs = addOfflineBankMs(state.offlineBankMs, durationMs);
        return state;
      }),
    debugSetOfflineBank: (durationMs) =>
      set((state) => {
        state.offlineBankMs = clampOfflineBankMs(durationMs);
        return state;
      }),
    debugClearOfflineBank: () =>
      set((state) => {
        state.offlineBankMs = 0;
        return state;
      }),
    advanceWithOfflineBank: async (durationMs) => {
      const result = await runOfflineBankAdvance(
        durationMs,
        get,
        (recipe) =>
          set((state) => {
            recipe(state);
            return state;
          }),
        () => {
          get().saveGame("autosave");
        },
        (state, itemId, amount) =>
          recordRecentAcquisition(state as GameStore, itemId, amount),
        offlineBankAnalyticsObservers,
      );
      if (result.ok) {
        result.completedArtificingRecipeIds?.forEach((recipeId) =>
          unpinArtificingRecipe(recipeId),
        );
        if (result.combatDefeat)
          publishOfflineCombatDefeat(result.combatDefeat);
        set((state) => {
          state.lastOfflineBankReport = result.report ?? null;
          return state;
        });
      }
      return result;
    },
  })),
);

export const useGameStoreSelectors = { selectUsedFocus, selectFreeFocus };
export { selectUsedFocus, selectFreeFocus };
export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state);
export const makeInitialState = createInitialState;
