import { ARTIFICING_RECIPES } from "../game/content/recipes/artificingRecipes";
import { ARTIFACTS } from "../game/content/artifacts/artifacts";
import { grantItem } from "../game/systems/inventory/itemAcquisition";
import { getConsumableQuantity } from "../game/core/inventory/inventoryConsumption";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { isScreenNavigationAllowed } from "../app/navigation";
import { BALANCE } from "../game/core/balance/balance";
import {
  COMBAT_LOCATIONS,
  getCombatEncounterMode,
  getCombatLocationById,
  getCombatLocationUnlockRequirement,
  hasBossEncounter,
  isCombatTargetForLocation,
  isCombatLocationUnlocked,
  type CombatLocationId,
} from "../game/content/combat-locations";
import { clearElementalWards, debugApplyElementalWard, debugExpireElementalWards, debugSetElementalWardsToRemaining } from "../game/systems/combat/elementalWardRuntime";
import { getTutorialCounterAffinity } from "../game/content/elements/elements";
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
} from "../game/engine";
import {
  abandonCurrentEncounter,
  debugApplyStatus,
  spawnEnemy,
  spawnNextEnemy,
  queueAutoHuntBoss,
  stopHunterContractCombat,
  type CombatLootObserver,
} from "../game/systems/combat/combatRuntime";
import { getHunterAuthorization, getHunterAuthorizationMessage } from "../game/systems/hunters-order/huntersOrderRuntime";
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
import { COMBAT_MODIFIER_KEYS, DAMAGE_TYPES } from "../game/systems/combat/combatEffectValidation";
import { getCritChance, MAX_CRIT_CHANCE } from "../game/systems/combat/combatStats";
import {
  loadProfileGame,
  resetProfileGame,
  validateProfileCandidate,
} from "../persistence/profileSaveManager";
import { type SaveReason } from "../persistence/saveConstants";
import { isDeveloperSandboxSavePaused } from "../persistence/developerSandboxSaveGuard";
import { getActiveProfileId } from "../profiles/profileSessionStore";
import { updateProfileMetadata } from "../profiles/profileStorage";
import { createInitialState } from "./initialState";
import type {
  ArcaneCoreBranchId,
  ArtifactId,
  CanonicalSpellId,
  ChronicleChapterId,
  ChannelingDiscoveryId,
  CrystalPresetId,
  CrystalVariantId,
  EquipmentPosition,
  GameState,
  ChronicleEventId,
  ChronicleObjectiveId,
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
  createDefaultPlayerStatOverrides,
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
import { craftSigilAction, enhanceSigilAction, equipSigilAction, salvageSigilAction, bulkSalvageSigilsAction, setSigilAttunementAction, setSigilAutoSalvageAction, toggleSigilLockAction, unequipSigilAction } from './actions/sigilActions';
import { generateSigil, generateCraftedSigil } from '../game/systems/sigils/sigilGeneration';
import { configureSigilForDebug } from '../game/systems/sigils/sigilRuntime';
import { getSigilTierDefinition } from '../game/content/sigils/sigilTiers';
import { DEBUG_SIGIL_STORAGE_HARD_CAP } from '../game/content/sigils/sigilDropConfig';
import { chooseStartingSchoolAction, chooseStartingSchoolDebugAction, grantStarterArtifactAction, resetTutorialAction, setTutorialStageAction, skipTutorialAction } from "./actions/onboardingActions";
import {
  donateGuildRequestAction,
  claimGuildRewardAction,
  promoteGuildAction,
  purchaseGuildSkillNodeAction,
  resetGuildSkillTreeAction,
  resetGuildRequestsAction,
  setGuildRankAction,
  grantGuildPointAction,
  debugSetGuildSkillNodeRankAction,
  debugSetAllGuildSkillRanksAction,
  debugSetGuildReputationAction,
  registerArcaneRegistryEntryAction,
  acceptGuildCommissionAction, contributeGuildCommissionSupplyAction, deliverGuildCommissionItemsAction, refreshGuildCommissionChoicesAction, contributeGuildProjectAction, startGuildCommissionChainAction, contributeGuildCommissionChainDeliveryAction, debugCompleteGuildProjectAction, debugCompleteGuildProjectPrerequisitesAction, debugCompleteGuildCommissionChainAction, debugGrantGuildProjectRequirementsAction, debugGrantGuildReputationAction, debugSetArcaneGuildUnlockedAction, debugCompleteRegistryEntryAction, debugCompleteRegistrySetAction, debugResetRegistrySetAction, debugCompleteGuildStudyStageAction, debugResetGuildStudyAction, debugSetGuildStudyFirstClearAction, debugCompleteActiveGuildCommissionAction,
} from "./actions/guildActions";
import { debugCompleteChronicleChapter, debugCompleteChronicleObjective, debugCompleteChronicleOptionalObjectives, debugCompleteChroniclePrerequisites, debugCompleteChronicleRequiredObjectives, debugCompleteChronicleTrack, debugResetAllChronicles, debugResetChronicleChapter, debugResetChronicleTrack, debugUnlockChronicleChapter, getChronicleMainObjective, reconcileChronicleProgress } from "../game/systems/chronicles/chronicleRuntime";
import type { GuildSkillNodeId, GuildRankId, GuildCommissionCategory } from "../game/types";
import { acceptHunterContractAction, issueFirstHunterContractAction, requestHunterAssignmentAction, requestHunterContractBoardAction, rerollHunterContractsAction, setHunterTargetBlockedAction, clearHunterTargetBlocksAction, skipHunterContractAction, purchaseHunterUpgradeAction, debugSetHuntersOrderUnlockedAction, debugGrantHunterReputationAction, debugGrantHunterMarksAction, debugCompleteActiveHunterContractAction, debugSetHunterRngSeedAction, debugRegenerateHunterContractBoardAction, debugSetHunterRankAction, debugGrantHunterUpgradeAction, debugClearHunterTargetBlocksAction, debugGrantNightglassContractAction, toggleHunterContractPinAction, setHunterPreferredContractTypeAction, setHunterPreferredHuntingGroundAction, debugSetHunterStandingAction, debugSetHunterUpgradeRankAction, debugSetAllHunterUpgradesAction, rememberHunterQuarryAction } from './actions/huntersOrderActions'
import { debugSetGuildCommissionRngSeedAction, debugRegenerateGuildCommissionBoardAction } from './actions/guildActions'
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
  setChannelingAcolytesAction,
  assignChannelingAcolyteAction,
  removeChannelingAcolyteAction,
  setChannelingAcolytesDebugAction,
  upgradeManaPillarAction,
  setManaPillarLevelAction,
  setChannelingManaGeneratedAction,
  setChannelingFluxGeneratedAction,
  setChannelingAcolyteSustainAction,
  setChannelingDiscoveryAction,
} from "./actions/channelingActions";
import {
  assignMaxResearchAcolytesAction,
  assignOneResearchAcolyteEachAction,
  assignResearchAcolyteAction,
  clearPreparedResearchAction,
  clearResearchAcolytesAction,
  pauseResearchAction,
  prepareResearchAction,
  removePreparedResearchAction,
  removeResearchAcolyteAction,
  setResearchAcolytesAction,
} from "./actions/researchActions";
import {
  assignMaxTransmutationAcolytesAction,
  assignTransmutationAcolyteAction,
  clearTransmutationAssignmentsAction,
  clearTransmutationRecipeAcolytesAction,
  forceSetTransmutationArrayLevelAction,
  grantTransmutationMissingIngredientsAction,
  removeTransmutationAcolyteAction,
  setTransmutationAcolytesAction,
  clearTransmutationAcolytesAction,
  upgradeTransmutationArrayAction,
} from "./actions/transmutationActions";
import { forceCompleteTransmutationCycle } from "../game/systems/transmutation/transmutationEngine";
import { saveGameAction, saveGameCandidateAction } from "./actions/persistenceActions";
import { advanceGameState } from "../game/systems/simulation/advanceGameState";
import { forceCompleteResearchCycle } from "../game/systems/research/researchEngine";
import {
  cancelArtificingCraft,
  craftArtificingRecipe as craftArtificing,
} from "../game/systems/artificing/artificingEngine";
import {
  debugAdjustArtifactMinorRank,
  debugGrantAllArtifacts,
  debugMaxOwnedArtifacts,
  debugMaxArtifact,
  debugMaxArtifactMinorNode,
  debugResetAllArtifactRanks,
  debugResetArtifact,
  debugResetArtifactMinorNode,
  debugSetArtifactMinorRank,
  purchaseArtifactMinorRank,
} from "../game/systems/artifacts/artifactProgression";
import {
  advanceWithOfflineBank as runOfflineBankAdvance,
  isOfflineBankSimulationActive,
  type OfflineBankProgress,
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
  clearCombatSpellRuntime,
  getDefaultSpellAutomationConfig,
  getCombatEntryPreset,
  getNextSpellPresetId,
  getSelectedSpellPreset,
  getSpellPresetProjection,
  validateSelectedCombatLoadout,
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
  applyPresetSlotAutomationAction,
  syncSelectedSpellPresetRuntime,
  type ApplySpellPresetResult,
  type ApplyPresetSlotAutomationResult,
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
  createCombatTelemetryAccumulator,
  useCombatTelemetryStore,
} from "../game/telemetry/combat/combatTelemetryStore";
import {
  clearDungeonStatistics,
  createDungeonStatisticsAccumulator,
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
} from "../game/systems/arcane-core";
import { ARCANE_CORE_TOTAL_TREE_COST } from "../game/content/arcane-core/arcaneCoreBalance";
import { resetArcaneCoreCombatRuntime } from "../game/systems/arcane-core/arcaneCoreRuntime";
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
const cloneAnalyticsState = <T>(value: T) =>
  JSON.parse(JSON.stringify(value)) as T;
const offlineBankAnalyticsObservers: OfflineBankSimulationObservers = {
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
  createDetached: () => {
    const telemetry = createCombatTelemetryAccumulator(
      cloneAnalyticsState(useCombatTelemetryStore.getState()),
    );
    const statistics = createDungeonStatisticsAccumulator(
      cloneAnalyticsState(useDungeonStatisticsStore.getState()),
    );
    const combatEvents = createCombatEventSink(
      { push: (event) => telemetry.consume(event) },
      { push: (event) => statistics.consume(event) },
    );
    return {
      telemetry,
      statistics,
      combatEvents,
      getEncounterTelemetry: () =>
        cloneAnalyticsState(telemetry.getState().encounter),
      onCombatCompleted: () => {
        telemetry.endRun("complete");
        statistics.endSession("complete");
      },
      commit: () => {
        useCombatTelemetryStore.setState(telemetry.getState());
        useDungeonStatisticsStore.setState(statistics.getState());
        combatAlertsObserver.clear();
        clearCombatDefeat();
      },
    };
  },
};
const combatLogUiSink = combatEventSink;
const combatLootObserver: CombatLootObserver = (state, enemyId, drops, sigils = []) => {
  const dungeon = COMBAT_LOCATIONS[state.combat.locationId ?? "whispering-woods"];
  const monster = MONSTERS[enemyId];
  enqueueCombatLootReveal({
    sourceLabel: dungeon?.name ?? "Combat",
    sourceDetail: monster?.name ?? enemyId,
    items: drops.map(({ itemId, quantity, isNewDiscovery }) => ({
      itemId,
      quantity,
      isNewDiscovery,
    })),
    sigils,
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
  locationId: CombatLocationId,
  resetCombatState: boolean,
  targetEnemyId: MonsterId | null = null,
) => {
  const dungeon = COMBAT_LOCATIONS[locationId];
  if (resetCombatState) state.combat = createInitialState().combat;
  clearCombatLogUi();
  clearCombatDefeat();
  beginCombatRecapRun();
  combatAlertsObserver.beginRun(locationId);
  combatTelemetryObserver.beginRun(locationId);
  dungeonStatisticsObserver.beginSession(locationId);
  resetAllCombatRuleRuntime(state);
  clearElementalWards(state);
  resetArcaneCoreCombatRuntime(state);
  state.combat.active = true;
  state.combat.locationId = locationId;
  const enteredLocation = getCombatLocationById(locationId)
  if (enteredLocation?.primaryElement && state.progress.startingSchoolId && enteredLocation.primaryElement === getTutorialCounterAffinity(state.progress.startingSchoolId)) state.progress.chronicle.eventFlags["starting-counter-zone-entered"] = true
  state.combat.targetEnemyId = targetEnemyId;
  state.combat.encounterTimerMs = 0;
  state.combat.sequenceIndex =
    getCombatEncounterMode(getCombatLocationById(locationId)) ===
    "sequence"
      ? 0
      : null;
  state.player.health = Math.max(1, state.player.health);
  if (!spawnNextEnemy(state, combatEventSink)) {
    state.combat.active = false;
    clearCombatSpellRuntime(state);
    state.combat.locationId = null;
    state.combat.encounterTimerMs = 0;
    state.combat.sequenceIndex = null;
    return;
  }
  pushNotification(state, `${dungeon.name} entered`, "info");
  reconcileChronicleProgress(state);
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
  consumeLegacyArchiveRoute: () => void;
  chooseStartingSchool: (schoolId: SchoolId) => boolean;
  debugChooseStartingSchool: (schoolId: SchoolId) => boolean;
  resetTutorialForDebug: () => void;
  setTutorialStageForDebug: (stage: import("../game/types").TutorialStage) => void;
  skipTutorialForDebug: () => void;
  grantStarterArtifactForDebug: (schoolId: SchoolId) => void;
  selectGuardian: (guardianId: GuardianId) => void;
  completeStoryEvent: (eventId: StoryEventId) => void;
  setChannelingAcolytes: (amount: number) => void;
  assignChannelingAcolyte: () => void;
  removeChannelingAcolyte: () => void;
  setChannelingAcolytesDebug: (amount: number) => void;
  forceSetChannelingAcolytes: (amount: number) => void;
  upgradeManaPillar: (pillarId: ManaPillarId) => void;
  setManaPillarLevel: (pillarId: ManaPillarId, level: number) => void;
  forceSetManaPillarLevel: (pillarId: ManaPillarId, level: number) => void;
  upgradeTransmutationArray: (arrayId: TransmutationArrayId) => boolean;
  forceSetTransmutationArrayLevel: (
    arrayId: TransmutationArrayId,
    level: number,
  ) => void;
  setChannelingManaGenerated: (amount: number) => void;
  setChannelingFluxGenerated: (amount: number) => void;
  setChannelingAcolyteSustain: (amount: number) => void;
  setChannelingDiscovery: (
    id: ChannelingDiscoveryId,
    completed: boolean,
  ) => void;
  setDebugManaRegenBonus: (amount: number) => void;
  setDebugMaxManaBonus: (amount: number) => void;
  setDebugPlayerStatValue: (path: string, value: number) => void;
  resetDebugPlayerStats: () => void;
  applyDebugPlayerStatPreset: (preset: 'crit-cap' | 'spell-power' | 'fast-caster' | 'tank' | 'dot-status' | 'healer-barrier' | 'clear') => void;
  setPlayerBarrierForDebug: (amount: number) => void;
  setDebugAllowManaOverCap: (enabled: boolean) => void;
  setDebugAcolyteBonus: (amount: number) => void;
  setDebugAcolyteTotalOverride: (amount: number | null) => void;
  setDebugIgnoreAcolyteLimit: (enabled: boolean) => void;
  setDebugArcaneFluxCapacity: (amount: number | null) => void;
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
  setDebugArtifactFreeRankPurchase: (enabled: boolean) => void;
  setDebugArtifactIgnoreOwnership: (enabled: boolean) => void;
  clearCombatDebugOverrides: () => void;
  resetDebugOverrides: () => void;
  prepareResearch: (
    itemId: ItemId,
    targetSchoolId: SchoolId,
    quantity: number,
  ) => void;
  removePreparedResearch: (slotId: ResearchSlotId) => void;
  assignResearchAcolyte: (slotId: ResearchSlotId) => void;
  removeResearchAcolyte: (slotId: ResearchSlotId) => void;
  assignOneResearchAcolyteEach: () => void;
  clearResearchAcolytes: () => void;
  assignMaxResearchAcolytes: (slotId: ResearchSlotId) => void;
  pauseResearch: (slotId: ResearchSlotId) => void;
  setResearchAcolytes: (slotId: ResearchSlotId, amount: number) => void;
  clearPreparedResearch: () => void;
  forceResearchCycle: (slotId: ResearchSlotId) => void;
  assignTransmutationAcolyte: (recipeId: TransmutationRecipeId) => void;
  removeTransmutationAcolyte: (recipeId: TransmutationRecipeId) => void;
  clearTransmutationAcolytes: () => void;
  assignMaxTransmutationAcolytes: (recipeId: TransmutationRecipeId) => void;
  clearTransmutationRecipeAcolytes: (recipeId: TransmutationRecipeId) => void;
  setTransmutationAcolytes: (
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
  purchaseArtifactRank: (
    artifactId: import("../game/types").ArtifactId,
    nodeId: string,
  ) => boolean;
  debugPurchaseArtifactRank: (
    artifactId: import("../game/types").ArtifactId,
    nodeId: string,
    free: boolean,
  ) => boolean;
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
  debugSetArtifactMinorRank: (artifactId: ArtifactId, nodeId: string, rank: number) => void;
  debugAdjustArtifactMinorRank: (artifactId: ArtifactId, nodeId: string, delta: number) => void;
  debugMaxArtifactMinorNode: (artifactId: ArtifactId, nodeId: string) => void;
  debugResetArtifactMinorNode: (artifactId: ArtifactId, nodeId: string) => void;
  debugMaxArtifact: (artifactId: ArtifactId) => void;
  debugResetArtifact: (artifactId: ArtifactId) => void;
  debugMaxOwnedArtifacts: () => void;
  debugGrantAllArtifacts: () => void;
  debugResetAllArtifactRanks: () => void;
  debugGrantArtifactMaterials: () => void;
  debugCreateSigil: (tier: import('../game/types').SigilTier, quality: import('../game/types').SigilQuality, setId: import('../game/types').SigilSetId, slot: number, mainStatId?: import('../game/types').SigilStatId) => string;
  debugCraftSigil: (mode: import('../game/systems/sigils/sigilCrafting').SigilCraftMode, tier: import('../game/types').SigilTier, setId: import('../game/types').SigilSetId, slot?: import('../game/types').SigilSlot) => string;
  debugConfigureSigil: (instanceId: string, configuration: import('../game/systems/sigils/sigilRuntime').DebugSigilConfiguration) => boolean;
  debugEnhanceSigil: (instanceId: string, options?: { ignoreGlobalCap?: boolean }) => boolean;
  debugAddSigilDust: (amount: number) => void;
  debugSetSigilDust: (amount: number) => void;
  notifySigil: (message: string, tone?: 'info' | 'success' | 'warning') => void;
  cancelArtificingCraft: () => void;
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
  applyPresetSlotAutomation: (
    id: SpellPresetId,
    spellId: CanonicalSpellId,
    automation: SpellAutomationConfig,
    autoCast: boolean,
  ) => ApplyPresetSlotAutomationResult;
  applySpellPreset: (id: SpellPresetId) => ApplySpellPresetResult;
  enterDungeon: (locationId?: CombatLocationId) => void;
  enterTargetedCombat: (
    locationId: CombatLocationId,
    targetEnemyId: MonsterId,
  ) => boolean;
  huntCombatTarget: (
    locationId: CombatLocationId,
    targetEnemyId: MonsterId,
  ) => boolean;
  setCombatTarget: (enemyId: MonsterId) => boolean;
  leaveDungeon: () => void;
  engageBoss: (bossId: MonsterId) => void;
  toggleAutoHunt: (locationId?: CombatLocationId) => void;
  killCurrentEnemy: () => void;
  despawnDebugEnemy: () => void;
  fastResolveDebugEnemies: (
    amount: number,
    locationId?: CombatLocationId,
    stopAtBossReady?: boolean,
  ) => void;
  clearDebugThreatToBoss: (locationId?: CombatLocationId) => void;
  jumpDebugToBoss: (locationId?: CombatLocationId) => void;
  restartDebugBoss: () => void;
  advanceCombatDebug: (durationMs: number) => void;
  spawnDebugEnemy: (enemyId: MonsterId, locationId?: CombatLocationId) => void;
  setEnemyHealthPercent: (percent: number) => void;
  damagePlayerForDebug: (amount: number) => void;
  debugApplyElementalWard: () => void;
  debugApplyElementalWardForElement: (element: 'fire' | 'water' | 'earth' | 'air') => void;
  debugApplyAllElementalWards: () => void;
  debugSetElementalWardRemaining: (remainingMs: number) => void;
  debugExpireElementalWards: () => void;
  debugClearElementalWards: () => void;
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
  equipSigil: (instanceId: string) => { ok: boolean; reason?: string };
  unequipSigil: (slot: import('../game/types').SigilSlot) => { ok: boolean; reason?: string };
  toggleSigilLock: (instanceId: string) => { ok: boolean; reason?: string };
  enhanceSigil: (instanceId: string, options?: import('./actions/sigilActions').SigilEnhancementOptions) => { ok: boolean; reason?: string; rank?: number };
  salvageSigil: (instanceId: string) => { ok: boolean; reason?: string; dust?: number };
  bulkSalvageSigils: (instanceIds: readonly string[]) => ReturnType<typeof bulkSalvageSigilsAction>;
  setSigilAttunement: (setId: import('../game/types').SigilSetId | null) => void;
  setSigilAutoSalvage: (quality: import('../game/types').SigilQuality, enabled: boolean) => void;
  craftSigil: (mode: import('../game/systems/sigils/sigilCrafting').SigilCraftMode, tier: import('../game/types').SigilTier, setId: import('../game/types').SigilSetId, slot?: import('../game/types').SigilSlot) => { ok: boolean; reason?: string; instanceId?: string; cost?: number };
  unlockAllSpells: () => void;
  debugUnlockSpellRankOne: (spellId: SpellId) => void;
  debugLockSpell: (spellId: SpellId) => void;
  resetSpellCooldowns: () => void;
  donateGuildRequest: (requestId: string, amount: number | "max") => void;
  registerArcaneRegistryEntry: (itemId: ItemId) => boolean;
  acceptGuildCommission: (commissionId: string) => boolean;
  deliverGuildCommissionItems: (amount: number | 'max') => boolean;
  contributeGuildCommissionSupply: (objectiveIndex: number, amount: number | 'max') => boolean;
  refreshGuildCommissionChoices: () => boolean;
  contributeGuildProject: (projectId: string, itemId: ItemId, amount: number | 'max') => boolean;
  startGuildCommissionChain: (chainId: string) => boolean;
  contributeGuildCommissionChainDelivery: (amount: number | 'max') => boolean;
  debugCompleteGuildProject: (id: string) => boolean;
  debugGrantGuildProjectRequirements: (id: string) => boolean;
  debugCompleteGuildProjectPrerequisites: (id: string) => boolean;
  debugCompleteGuildCommissionChain: (id: string) => boolean;
  debugSetGuildCommissionRngSeed: (seed: number) => void;
  debugRegenerateGuildCommissionBoard: (options?: { quality?: 'routine' | 'special' | 'prestigious'; templateId?: string; category?: GuildCommissionCategory }) => void;
  debugCompleteActiveGuildCommission: () => boolean;
  debugCompleteGuildStudyStage: () => boolean;
  debugResetGuildStudy: (id: string) => boolean;
  debugSetGuildStudyFirstClear: (id: string, complete: boolean) => boolean;
  debugSetGuildSkillNodeRank: (id: GuildSkillNodeId, rank: number) => boolean;
  debugSetAllGuildSkillRanks: (mode: 'max' | 'reset') => boolean;
  debugSetGuildReputation: (amount: number) => void;
  debugGrantGuildReputation: (amount: number) => void;
  debugSetArcaneGuildUnlocked: (unlocked: boolean) => void;
  debugCompleteRegistryEntry: (itemId: ItemId) => boolean;
  debugCompleteRegistrySet: (id: string) => boolean;
  debugResetRegistrySet: (id: string) => boolean;
  debugSetHuntersOrderUnlocked: (unlocked: boolean) => void;
  debugGrantHunterReputation: (amount: number) => void;
  debugGrantHunterMarks: (amount: number) => void;
  debugSetHunterRngSeed: (seed: number) => void;
  debugRegenerateHunterContractBoard: (options?: { archetype?: 'monster' | 'family' | 'alignment' | 'ground' | 'boss'; tier?: 'routine' | 'special' | 'prestigious'; fixtureChoiceCount?: 1 | 2 | 3; huntingGroundId?: CombatLocationId }) => void;
  debugSetHunterRank: (rank: import('../game/types').HunterRankId) => boolean;
  debugSetHunterStanding: (standingId: string) => boolean;
  debugSetHunterUpgradeRank: (upgradeId: string, rank: number) => boolean;
  debugSetAllHunterUpgrades: (mode: 'max' | 'reset') => boolean;
  debugGrantHunterUpgrade: (upgradeId: string) => boolean;
  debugClearHunterTargetBlocks: () => boolean;
  debugGrantNightglassContract: () => boolean;
  debugCompleteActiveHunterContract: () => boolean;
  acceptHunterContract: (contractId: string) => boolean;
  issueFirstHunterContract: () => boolean;
  requestHunterAssignment: () => boolean;
  requestHunterContractBoard: () => boolean;
  skipHunterContract: () => boolean;
  rerollHunterContracts: () => boolean;
  toggleHunterContractPin: (contractId: string) => boolean;
  setHunterPreferredContractType: (type: import('../game/types').HunterContractTarget['type'] | null) => boolean;
  setHunterPreferredHuntingGround: (groundId: CombatLocationId | null) => boolean;
  rememberHunterQuarry: (monsterId: MonsterId, groundId: CombatLocationId) => boolean;
  setHunterTargetBlocked: (monsterId: MonsterId, blocked: boolean) => boolean;
  clearHunterTargetBlocks: () => boolean;
  purchaseHunterUpgrade: (upgradeId: string) => boolean;
  claimGuildReward: (requestId: string) => void;
  promoteGuild: () => void;
  purchaseGuildSkillNode: (nodeId: GuildSkillNodeId, free?: boolean) => boolean;
  resetGuildSkillTree: () => boolean;
  resetGuildRequests: () => void;
  debugSetGuildRank: (rank: GuildRankId) => void;
  debugGrantGuildPoint: (amount: number) => void;
  debugReconcileChronicles: () => void;
  debugSetChronicleEvent: (eventId: ChronicleEventId, enabled: boolean) => void;
  debugCompleteChronicleObjective: (objectiveId: ChronicleObjectiveId) => void;
  debugCompleteChroniclePrerequisites: (objectiveId: ChronicleObjectiveId) => void;
  debugCompleteChronicleChapter: (chapterId: ChronicleChapterId) => void;
  debugUnlockChronicleChapter: (chapterId: ChronicleChapterId) => void;
  debugCompleteChronicleRequiredObjectives: (chapterId: ChronicleChapterId) => void;
  debugCompleteChronicleOptionalObjectives: (chapterId: ChronicleChapterId) => void;
  debugCompleteChronicleTrack: (chapterId: ChronicleChapterId, track: import("../game/types").ChronicleTrack) => void;
  debugResetChronicleTrack: (chapterId: ChronicleChapterId, track: import("../game/types").ChronicleTrack) => void;
  debugResetChronicleChapter: (chapterId: ChronicleChapterId) => void;
  debugResetAllChronicles: () => void;
  debugSkipCurrentChronicleObjective: () => void;
  setGuildReputation: (amount: number) => void;
  setBossKills: (bossId: MonsterId, amount: number) => void;
  creditOfflineAbsence: (elapsedMs: number, notify?: boolean) => void;
  debugAddOfflineBank: (durationMs: number) => void;
  debugSetOfflineBank: (durationMs: number) => void;
  debugClearOfflineBank: () => void;
  advanceWithOfflineBank: (durationMs: number, onProgress?: (progress: OfflineBankProgress) => void) => Promise<OfflineBankResult>;
  lastOfflineBankReport: OfflineBankReport | null;
}

export type GameStore = GameState &
  GameActions & { recentAcquisitions: RecentAcquisition[] };

export interface SaveResult {
  ok: boolean;
  skipped?: true;
  reason?: 'developer-sandbox';
  error: string | null;
  kind?: import('../persistence/saveDiagnosticsStore').SaveFailureKind;
  detail?: string;
  serializedBytes?: number;
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
  return (state.artifactProgress[artifactId] ??= { minorRanks: {} });
};
const grantDebugArtifactMaterialsInState = (state: GameState) => {
  Object.keys(ITEMS).filter((itemId) => itemId === 'artifact-essence' || itemId === 'prismatic-fragment' || itemId.includes('fragment')).forEach((itemId) => {
    const current = state.inventory[itemId as ItemId] ?? 0;
    if (current < 100000) grantItem(state, itemId as ItemId, 100000 - current);
  });
  Object.keys(state.resonance).forEach((type) => { state.resonance[type as ResonanceType] = Math.max(100000, state.resonance[type as ResonanceType] ?? 0); });
};

const spellUnlocked = isSpellUnlocked;
const getCombatEntryFailureMessage = (state: GameState, failure: ReturnType<typeof validateSelectedCombatLoadout>) => {
  const preset = getCombatEntryPreset(state)
  if (failure.ok) return ''
  return failure.reason === 'missing-preset'
    ? 'Select a Spell Preset before entering combat.'
    : failure.reason === 'empty'
      ? `${preset?.name ?? 'Selected Preset'} has no Spells. Add at least one Spell in Manage Presets.`
      : `${preset?.name ?? 'Selected Preset'} has no currently unlocked Spells.`
}

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
    slot.autoCast = !slot.autoCast;
    if (slot.autoCast && !slot.automation) slot.automation = getDefaultSpellAutomationConfig(slot.spellId, true, false);
  } else {
    if (preset.slots.length >= MAX_COMBAT_SPELLS) return false;
    preset.slots.push({ spellId, autoCast: true, automation: getDefaultSpellAutomationConfig(spellId, true, false) });
  }
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
          onResearchComplete: () => reconcileChronicleProgress(state),
          onTransmutationComplete: () => reconcileChronicleProgress(state),
          onArtificingComplete: (completion) => {
            emitActionFeel("craft-complete", ".artificing-craft-button");
            unpinArtificingRecipe(completion.recipeId);
          },
        });
      }),
    setScreen: (screen) => {
      return set((state) => {
        state.ui.screen = isScreenNavigationAllowed(state, screen) ? screen : "home";
        return state;
      });
    },
    consumeLegacyArchiveRoute: () => {
      set((state) => { state.ui.legacyArchiveRoute = null })
    },
    chooseStartingSchool: (schoolId) => {
      let chosen = false;
      set((state) => {
        chosen = chooseStartingSchoolAction(state, schoolId);
        if (chosen) {
          recalculateDerivedStats(state);
          reconcileChronicleProgress(state);
        }
        return state;
      });
      return chosen;
    },
    debugChooseStartingSchool: (schoolId) => {
      let chosen = false;
      set((state) => {
        chosen = chooseStartingSchoolDebugAction(state, schoolId);
        if (chosen) recalculateDerivedStats(state);
        return state;
      });
      return chosen;
    },
    resetTutorialForDebug: () => set((state) => { resetTutorialAction(state); return state; }),
    setTutorialStageForDebug: (stage) => set((state) => { setTutorialStageAction(state, stage); return state; }),
    skipTutorialForDebug: () => set((state) => { skipTutorialAction(state); recalculateDerivedStats(state); return state; }),
    grantStarterArtifactForDebug: (schoolId) => set((state) => { grantStarterArtifactAction(state, schoolId); return state; }),
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
        reconcileChronicleProgress(state);
        return state;
      }),
    setChannelingAcolytes: (amount) =>
      set((state) => {
        setChannelingAcolytesAction(state, amount);
        reconcileChronicleProgress(state);
        return state;
      }),
    assignChannelingAcolyte: () => set((state) => { assignChannelingAcolyteAction(state); reconcileChronicleProgress(state); return state }),
    removeChannelingAcolyte: () => set((state) => { removeChannelingAcolyteAction(state); reconcileChronicleProgress(state); return state }),
    setChannelingAcolytesDebug: (amount) => set((state) => { setChannelingAcolytesDebugAction(state, sanitizeDebugNumber(amount)); return state }),
    forceSetChannelingAcolytes: (amount) =>
      set((state) => {
        setChannelingAcolytesAction(state, sanitizeDebugNumber(amount), true);
        reconcileChronicleProgress(state);
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
    setChannelingManaGenerated: (amount) =>
      set((state) => {
        setChannelingManaGeneratedAction(state, amount);
        return state;
      }),
    setChannelingFluxGenerated: (amount) =>
      set((state) => {
        setChannelingFluxGeneratedAction(state, amount);
        return state;
      }),
    setChannelingAcolyteSustain: (amount) =>
      set((state) => {
        setChannelingAcolyteSustainAction(state, amount);
        return state;
      }),
    setChannelingDiscovery: (id, completed) =>
      set((state) => {
        setChannelingDiscoveryAction(state, id, completed);
        return state;
      }),
    setDebugManaRegenBonus: (amount) =>
      set((state) => {
        state.debug.playerStats.manaRegenFlat = Number.isFinite(amount) ? Math.max(-1_000_000, Math.min(1_000_000, amount)) : 0;
        return state;
      }),
    setDebugMaxManaBonus: (amount) =>
      set((state) => {
        state.debug.playerStats.maxManaFlat = Number.isFinite(amount) ? Math.max(-1_000_000, Math.min(1_000_000, amount)) : 0;
        recalculateDerivedStats(state);
        return state;
      }),
    setDebugPlayerStatValue: (path, amount) =>
      set((state) => {
        const value = Number.isFinite(amount) ? Math.max(-1_000_000, Math.min(1_000_000, amount)) : 0;
        const [section, key] = path.split('.');
        const coreKeys = ['maxHealthFlat', 'maxHealthPercent', 'healthRegenFlat', 'maxManaFlat', 'maxManaPercent', 'manaRegenFlat', 'manaRegenPercent', 'spellPowerFlat', 'spellPowerPercent', 'manaCostReductionPercent'];
        if (section === 'core' && key && coreKeys.includes(key)) (state.debug.playerStats as unknown as Record<string, number>)[key] = value;
        else if (section === 'modifiers' && key && COMBAT_MODIFIER_KEYS.includes(key as (typeof COMBAT_MODIFIER_KEYS)[number])) state.debug.playerStats.modifiers[key as import('../game/systems/combat/combatTypes').ModifierKey] = value;
        else if (section === 'spellDamageByType' && key && DAMAGE_TYPES.includes(key as (typeof DAMAGE_TYPES)[number])) state.debug.playerStats.spellDamageByType[key as import('../game/systems/combat/combatTypes').DamageType] = value;
        else if (section === 'resistanceByType' && key && DAMAGE_TYPES.includes(key as (typeof DAMAGE_TYPES)[number])) state.debug.playerStats.resistanceByType[key as import('../game/systems/combat/combatTypes').DamageType] = value;
        recalculateDerivedStats(state);
        return state;
      }),
    resetDebugPlayerStats: () => set((state) => { state.debug.playerStats = createDefaultDebugOverrides().playerStats; recalculateDerivedStats(state); return state; }),
    applyDebugPlayerStatPreset: (preset) => set((state) => {
      const stats = createDefaultPlayerStatOverrides();
      if (preset === 'crit-cap') {
        const baseline = { ...state, debug: { ...state.debug, playerStats: stats } };
        stats.modifiers['crit-chance'] = Math.max(0, MAX_CRIT_CHANCE - getCritChance(baseline, 'player'));
      }
      if (preset === 'spell-power') stats.spellPowerFlat = 500;
      if (preset === 'fast-caster') { stats.modifiers['cooldown-recovery-percent'] = 1; stats.modifiers['spell-cast-time-percent'] = -0.5; }
      if (preset === 'tank') {
        stats.maxHealthFlat = 500; stats.modifiers['defense-flat'] = 200;
        for (const type of ['arcane', 'fire', 'water', 'earth', 'air'] as const) stats.resistanceByType[type] = 0.25;
      }
      if (preset === 'dot-status') { stats.modifiers['damage-over-time-percent'] = 1; stats.modifiers['status-duration-dealt-percent'] = 1; }
      if (preset === 'healer-barrier') { stats.modifiers['healing-done-percent'] = 1; stats.modifiers['healing-received-percent'] = 1; stats.modifiers['barrier-power-percent'] = 1; stats.modifiers['barrier-received-percent'] = 1; }
      state.debug.playerStats = stats;
      recalculateDerivedStats(state);
      return state;
    }),
    setPlayerBarrierForDebug: (amount) => set((state) => { state.combat.playerBarrier = Math.max(0, Number.isFinite(amount) ? amount : 0); return state; }),
    setDebugAllowManaOverCap: (enabled) =>
      set((state) => {
        state.debug.allowManaOverCap = enabled;
        recalculateDerivedStats(state);
        return state;
      }),
    setDebugAcolyteBonus: (amount) =>
      set((state) => {
        state.debug.bonusAcolytes = sanitizeDebugNumber(amount);
        return state;
      }),
    setDebugAcolyteTotalOverride: (amount) =>
      set((state) => {
        state.debug.acolyteTotalOverride = amount === null ? null : sanitizeDebugNumber(amount);
        return state;
      }),
    setDebugIgnoreAcolyteLimit: (enabled) =>
      set((state) => {
        state.debug.ignoreAcolyteLimit = enabled;
        return state;
      }),
    setDebugArcaneFluxCapacity: (amount) =>
      set((state) => {
        state.debug.arcaneFluxCapacityOverride = amount === null ? null : sanitizeDebugNumber(amount);
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
    setDebugArtifactFreeRankPurchase: (enabled) =>
      set((state) => {
        state.debug.artifactFreeRankPurchase = enabled;
        return state;
      }),
    setDebugArtifactIgnoreOwnership: (enabled) =>
      set((state) => {
        state.debug.artifactIgnoreOwnership = enabled;
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
        recalculateDerivedStats(state);
        return state;
      }),
    resetDebugOverrides: () =>
      set((state) => {
        resetDebugState(state);
        state.activities.channeling.acolytesAssigned = clamp(
          state.activities.channeling.acolytesAssigned ?? 0,
          0,
          state.debug.ignoreAcolyteLimit ? Number.MAX_SAFE_INTEGER : state.debug.acolyteTotalOverride ?? state.tower.acolytes.base + Object.values(state.tower.acolytes.permanentBonuses).reduce((sum, value) => sum + value, 0) + state.debug.bonusAcolytes,
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
    assignResearchAcolyte: (slotId) => set((state) => { assignResearchAcolyteAction(state, slotId); return state }),
    removeResearchAcolyte: (slotId) => set((state) => { removeResearchAcolyteAction(state, slotId); return state }),
    assignOneResearchAcolyteEach: () => set((state) => { assignOneResearchAcolyteEachAction(state); return state }),
    clearResearchAcolytes: () => set((state) => { clearResearchAcolytesAction(state); return state }),
    assignMaxResearchAcolytes: (slotId) =>
      set((state) => {
        assignMaxResearchAcolytesAction(state, slotId);
        return state;
      }),
    pauseResearch: (slotId) =>
      set((state) => {
        pauseResearchAction(state, slotId);
        return state;
      }),
    setResearchAcolytes: (slotId, amount) =>
      set((state) => {
        setResearchAcolytesAction(state, slotId, amount);
        return state;
      }),
    clearPreparedResearch: () =>
      set((state) => {
        clearPreparedResearchAction(state);
        return state;
      }),
    forceResearchCycle: (slotId) =>
      set((state) => {
        forceCompleteResearchCycle(state, slotId, { mode: "live", onResearchComplete: () => reconcileChronicleProgress(state) });
        return state;
      }),
    assignTransmutationAcolyte: (recipeId) => set((state) => { assignTransmutationAcolyteAction(state, recipeId); return state }),
    removeTransmutationAcolyte: (recipeId) => set((state) => { removeTransmutationAcolyteAction(state, recipeId); return state }),
    clearTransmutationAcolytes: () => set((state) => { clearTransmutationAcolytesAction(state); return state }),
    assignMaxTransmutationAcolytes: (recipeId) =>
      set((state) => {
        assignMaxTransmutationAcolytesAction(state, recipeId);
        return state;
      }),
    clearTransmutationRecipeAcolytes: (recipeId) =>
      set((state) => {
        clearTransmutationRecipeAcolytesAction(state, recipeId);
        return state;
      }),
    setTransmutationAcolytes: (recipeId, amount) =>
      set((state) => {
        setTransmutationAcolytesAction(state, recipeId, amount);
        return state;
      }),
    clearTransmutationAssignments: () =>
      set((state) => {
        clearTransmutationAssignmentsAction(state);
        return state;
      }),
    completeTransmutationCycle: (recipeId) =>
      set((state) => {
        forceCompleteTransmutationCycle(state, recipeId, { mode: "live", onTransmutationComplete: (completedRecipeId) => { if (completedRecipeId.endsWith("-fragment")) reconcileChronicleProgress(state); } });
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
    purchaseArtifactRank: (artifactId, nodeId) => {
      let ok = false;
      set((state) => {
        const result = purchaseArtifactMinorRank(state, artifactId, nodeId);
        ok = result.ok;
        if (result.ok) {
          recalculateDerivedStats(state);
          reconcileChronicleProgress(state);
        }
        else
          pushNotification(state, result.reason, "warning", {
            key: "artifact-rank-purchase-failed",
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
    debugPurchaseArtifactRank: (artifactId, nodeId, free) => {
      let ok = false;
      set((state) => {
        const result = purchaseArtifactMinorRank(state, artifactId, nodeId, { free });
        ok = result.ok;
        if (result.ok) {
          recalculateDerivedStats(state);
          reconcileChronicleProgress(state);
        }
        else pushNotification(state, result.reason, "warning", { key: "artifact-rank-purchase-failed", cooldownMs: 1200 });
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
    debugSetArtifactMinorRank: (artifactId, nodeId, rank) =>
      set((state) => {
        ensureDebugArtifact(state, artifactId);
        debugSetArtifactMinorRank(state, artifactId, nodeId, rank);
        recalculateDerivedStats(state);
        return state;
      }),
    debugAdjustArtifactMinorRank: (artifactId, nodeId, delta) =>
      set((state) => {
        ensureDebugArtifact(state, artifactId);
        debugAdjustArtifactMinorRank(state, artifactId, nodeId, delta);
        recalculateDerivedStats(state);
        return state;
      }),
    debugMaxArtifactMinorNode: (artifactId, nodeId) =>
      set((state) => {
        ensureDebugArtifact(state, artifactId);
        debugMaxArtifactMinorNode(state, artifactId, nodeId);
        recalculateDerivedStats(state);
        return state;
      }),
    debugResetArtifactMinorNode: (artifactId, nodeId) =>
      set((state) => {
        ensureDebugArtifact(state, artifactId);
        debugResetArtifactMinorNode(state, artifactId, nodeId);
        recalculateDerivedStats(state);
        return state;
      }),
    debugMaxArtifact: (artifactId) =>
      set((state) => {
        ensureDebugArtifact(state, artifactId);
        debugMaxArtifact(state, artifactId);
        recalculateDerivedStats(state);
        return state;
      }),
    debugResetArtifact: (artifactId) =>
      set((state) => {
        ensureDebugArtifact(state, artifactId);
        debugResetArtifact(state, artifactId);
        recalculateDerivedStats(state);
        return state;
      }),
    debugMaxOwnedArtifacts: () =>
      set((state) => {
        debugMaxOwnedArtifacts(state);
        recalculateDerivedStats(state);
        return state;
      }),
    debugGrantAllArtifacts: () =>
      set((state) => {
        debugGrantAllArtifacts(state);
        recalculateDerivedStats(state);
        return state;
      }),
    debugResetAllArtifactRanks: () =>
      set((state) => {
        debugResetAllArtifactRanks(state);
        recalculateDerivedStats(state);
        return state;
      }),
    debugGrantArtifactMaterials: () =>
      set((state) => {
        grantDebugArtifactMaterialsInState(state);
        return state;
      }),
    debugCreateSigil: (tier, quality, setId, slot, mainStatId) => {
      let instanceId = '';
      set((state) => {
        if (Object.keys(state.sigils.storage).length >= DEBUG_SIGIL_STORAGE_HARD_CAP) {
          pushNotification(state, 'Debug spawn blocked. Use Drop Simulator for bulk testing.', 'warning', { key: 'sigil-debug-cap', cooldownMs: 1200 });
          return state;
        }
        instanceId = generateSigil({ state, locationId: 'whispering-woods', enemyPower: getSigilTierDefinition(tier).minEnemyPower, source: 'debug', forcedTier: tier, forcedQuality: quality, forcedSetId: setId, forcedSlot: slot as import('../game/types').SigilSlot, forcedMainStatId: mainStatId, rng: Math.random }).instanceId;
        return state;
      });
      return instanceId;
    },
    debugCraftSigil: (mode, tier, setId, slot) => {
      let instanceId = '';
      set((state) => {
        if (Object.keys(state.sigils.storage).length >= DEBUG_SIGIL_STORAGE_HARD_CAP) {
          pushNotification(state, 'Debug spawn blocked. Use Drop Simulator for bulk testing.', 'warning', { key: 'sigil-debug-cap', cooldownMs: 1200 });
          return state;
        }
        instanceId = generateCraftedSigil({ state, locationId: 'whispering-woods', tier, setId, slot, rng: Math.random, source: 'debug' }).instanceId;
        return state;
      });
      return instanceId;
    },
    debugConfigureSigil: (instanceId, configuration) => {
      let ok = false;
      set((state) => { ok = configureSigilForDebug(state, instanceId, configuration); return state; });
      return ok;
    },
    debugEnhanceSigil: (instanceId, options) => {
      let ok = false;
      set((state) => { ok = enhanceSigilAction(state, instanceId, { bypassGlobalCap: options?.ignoreGlobalCap ?? true, free: true, recordProgression: false }).ok; return state; });
      return ok;
    },
    debugAddSigilDust: (amount) => set((state) => { state.sigils.dust += Math.max(0, Math.floor(amount)); return state; }),
    debugSetSigilDust: (amount) => set((state) => { state.sigils.dust = Math.max(0, Math.floor(amount)); return state; }),
    notifySigil: (message, tone = 'info') => set((state) => { pushNotification(state, message, tone, { key: 'sigil-ui', cooldownMs: 800 }); return state; }),
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
        if (changed) reconcileChronicleProgress(state);
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
        if (result.ok) reconcileChronicleProgress(state);
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
        if (result.ok) reconcileChronicleProgress(state);
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
    applyPresetSlotAutomation: (id, spellId, automation, autoCast) => {
      let result: ApplyPresetSlotAutomationResult = { ok: false, reason: 'missing-preset', message: 'This preset no longer exists.' };
      set((state) => {
        result = applyPresetSlotAutomationAction(state, id, spellId, automation, autoCast);
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
        if (result.ok) reconcileChronicleProgress(state);
        return state;
      });
      return result;
    },
    enterDungeon: (locationId = "whispering-woods") => {
      const dungeon = COMBAT_LOCATIONS[locationId];
      const currentState = get();
      if (!dungeon) return;
      const location = getCombatLocationById(locationId)
      if (location && !isCombatLocationUnlocked(location.id, currentState.progress)) {
        const requirement = location.id === 'whispering-woods' ? 'Defeat any elemental tutorial boss' : location.id === 'howling-den' ? 'Defeat the Forest Heart' : location.id === 'hunters-ground' || location.id === 'abandoned-catacombs' ? 'Defeat the Corrupted Greatbear' : 'Complete the location unlock requirement'
        set((state) => { pushNotification(state, `${location.name} is locked. ${requirement}.`, "warning"); return state })
        return
      }
      if (!isCombatLocationUnlocked(dungeon, currentState.progress)) {
        set((state) => {
          pushNotification(
            state,
            `${getCombatLocationUnlockRequirement(dungeon) ?? "Requirement"} to unlock ${dungeon.name}.`,
            "warning",
          );
          return state;
        });
        return;
      }
      if (
        currentState.combat.active &&
        currentState.combat.locationId === locationId
      )
        return;
      const preflight = validateSelectedCombatLoadout(currentState)
      if (!preflight.ok) {
        set((state) => {
          pushNotification(state, getCombatEntryFailureMessage(state, preflight), "warning", { key: `combat-loadout-preflight:${state.spellPresets.selectedPresetId ?? 'missing'}`, cooldownMs: 1000 })
          return state
        })
        return;
      }
      const switching = currentState.combat.active;
      if (switching) endActiveDungeonRun();
      set((state) => {
        initializeDungeonRun(state, locationId, switching);
        state.ui.lastEnteredCombatLocationId = locationId;
        reconcileChronicleProgress(state);
        return state;
      });
    },
    enterTargetedCombat: (locationId, targetEnemyId) => {
      const resolvedLocationId = Object.values(COMBAT_LOCATIONS).find(
        (location) => location.id === locationId,
      )?.id;
      return resolvedLocationId
        ? get().huntCombatTarget(resolvedLocationId, targetEnemyId)
        : false;
    },
    huntCombatTarget: (locationId, targetEnemyId) => {
      const location = COMBAT_LOCATIONS[locationId];
      const resolvedLocationId = location?.id;
      const dungeon = resolvedLocationId ? COMBAT_LOCATIONS[resolvedLocationId] : null;
      const currentState = get();
      if (
        !location ||
        !resolvedLocationId ||
        !dungeon ||
        !isCombatTargetForLocation(location, resolvedLocationId, targetEnemyId)
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
      if (!isCombatLocationUnlocked(dungeon, currentState.progress)) {
        set((state) => {
          pushNotification(
            state,
            `${getCombatLocationUnlockRequirement(dungeon) ?? "Requirement"} to unlock ${dungeon.name}.`,
            "warning",
          );
          return state;
        });
        return false;
      }
      if (!isCombatLocationUnlocked(locationId, currentState.progress)) {
        set((state) => { pushNotification(state, `${location.name} is locked. Defeat an enemy in your starter counter zone to open the other elemental frontiers.`, "warning"); return state })
        return false
      }
      const authorization = getHunterAuthorization(currentState, targetEnemyId, locationId)
      if (!authorization.authorized) {
        set((state) => { pushNotification(state, getHunterAuthorizationMessage(authorization, MONSTERS[targetEnemyId]?.name), 'warning', { key: `hunter-authorization:${authorization.reason}:${targetEnemyId}`, cooldownMs: 1000 }); return state; })
        return false;
      }
      const sameLocation = Boolean(
        currentState.combat.active &&
        currentState.combat.locationId === locationId,
      );
      if (!sameLocation) {
        const preflight = validateSelectedCombatLoadout(currentState)
        if (!preflight.ok) {
          set((state) => {
          pushNotification(state, getCombatEntryFailureMessage(state, preflight), "warning", { key: `combat-loadout-preflight:${state.spellPresets.selectedPresetId ?? 'missing'}`, cooldownMs: 1000 })
            return state
          })
          return false
        }
        if (currentState.combat.active) endActiveDungeonRun();
        set((state) => {
          initializeDungeonRun(
            state,
            locationId,
            currentState.combat.active,
            targetEnemyId,
          );
          if (state.combat.active)
            appendLog(
              state,
              `Hunting target: ${MONSTERS[targetEnemyId].name}.`,
            );
          state.ui.lastEnteredCombatLocationId = locationId;
          return state;
        });
        const nextState = get();
        return (
          nextState.combat.active &&
          nextState.combat.locationId === locationId &&
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
        const locationId = state.combat.locationId;
        const dungeon = locationId ? COMBAT_LOCATIONS[locationId] : null;
        const location = locationId
          ? getCombatLocationById(locationId)
          : null;
        if (
          !state.combat.active ||
          !dungeon ||
          !isCombatTargetForLocation(location, locationId, enemyId)
        ) {
          pushNotification(
            state,
            `${MONSTERS[enemyId]?.name ?? enemyId} is not a valid active combat target.`,
            "warning",
          );
          return state;
        }
        const authorization = getHunterAuthorization(state, enemyId, locationId)
        if (!authorization.authorized) {
          pushNotification(state, getHunterAuthorizationMessage(authorization, MONSTERS[enemyId]?.name), 'warning', { key: `hunter-authorization:${authorization.reason}:${enemyId}`, cooldownMs: 1000 })
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
        clearElementalWards(state)
        clearCombatSpellRuntime(state);
        const sequence =
          getCombatEncounterMode(
            getCombatLocationById(state.combat.locationId),
          ) === "sequence";
        const dungeon = state.combat.locationId ? COMBAT_LOCATIONS[state.combat.locationId] : null;
        state.combat = {
          ...createInitialState().combat,
          locationId: state.combat.locationId,
          log: [
            sequence
              ? "Left the dungeon run."
              : dungeon && hasBossEncounter(dungeon)
                ? "Left the Location. Threat resets."
                : "Left the Location.",
          ],
        };
        return state;
      });
    },
    engageBoss: (bossId) =>
      set((state) => {
        const dungeon = state.combat.locationId
          ? COMBAT_LOCATIONS[state.combat.locationId]
          : null;
        const boss = MONSTERS[bossId];
        if (!state.combat.active || !dungeon) {
          pushNotification(state, "Enter a Location first", "warning");
          return state;
        }
        if (
          getCombatEncounterMode(getCombatLocationById(dungeon.id)) ===
          "sequence"
        )
          return state;
        if (!isCombatLocationUnlocked(dungeon, state.progress)) {
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
    toggleAutoHunt: (locationId = "whispering-woods") =>
      set((state) => {
        const dungeon = COMBAT_LOCATIONS[locationId];
        const location = getCombatLocationById(locationId);
        if (
          !dungeon ||
          !hasBossEncounter(dungeon) ||
          getCombatEncounterMode(location) !== "targeted" ||
          !isCombatLocationUnlocked(dungeon, state.progress)
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
        const enabled = !state.progress.autoHuntBossByLocation[locationId];
        state.progress.autoHuntBossByLocation[locationId] = enabled;

        const activeLocation =
          state.combat.active && state.combat.locationId === locationId;
        const bossActive = isBossCurrentlyActive(state);
        const threatRequired = resolveBossThreatRequirement(
          locationId,
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
        if (enabled && activeLocation && state.combat.threatCleared >= threatRequired && !bossActive) queueAutoHuntBoss(state, locationId);
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
    fastResolveDebugEnemies: (amount, locationId, stopAtBossReady = true) =>
      set((state) => {
        fastResolveNormalEnemiesForDebug(
          state,
          amount,
          locationId ?? state.combat.locationId ?? "whispering-woods",
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
    clearDebugThreatToBoss: (locationId) =>
      set((state) => {
        clearToBossForDebug(
          state,
          locationId ?? state.combat.locationId ?? "whispering-woods",
          {
            uiEvents: combatLogUiSink,
            onItemAcquired: (itemId, quantity) =>
              recordRecentAcquisition(state, itemId, quantity),
            onCombatLoot: combatLootObserver,
          },
        );
        return state;
      }),
    jumpDebugToBoss: (locationId) =>
      set((state) => {
        jumpToBossForDebug(
          state,
          locationId ?? state.combat.locationId ?? "whispering-woods",
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
    spawnDebugEnemy: (enemyId, locationId) =>
      set((state) => {
        const contextCombatLocationId =
          locationId ?? state.combat.locationId ?? "whispering-woods";
        state.combat.active = true;
        state.combat.locationId = contextCombatLocationId;
        spawnEnemy(state, enemyId, combatLogUiSink);
        pushNotification(
          state,
          `${MONSTERS[enemyId].name} spawned by Developer Tools in ${COMBAT_LOCATIONS[contextCombatLocationId].name}`,
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
    debugApplyElementalWard: () => set((state) => { const enemy = state.combat.enemyId ? MONSTERS[state.combat.enemyId] : null; const element = enemy?.basicAttackElement ?? enemy?.primaryAffinity ?? 'fire'; debugApplyElementalWard(state, element); return state; }),
    debugApplyElementalWardForElement: (element) => set((state) => { debugApplyElementalWard(state, element); return state; }),
    debugApplyAllElementalWards: () => set((state) => { (['fire', 'water', 'earth', 'air'] as const).forEach((element) => debugApplyElementalWard(state, element)); return state; }),
    debugSetElementalWardRemaining: (remainingMs) => set((state) => { debugSetElementalWardsToRemaining(state, remainingMs); return state; }),
    debugExpireElementalWards: () => set((state) => { debugExpireElementalWards(state); return state; }),
    debugClearElementalWards: () => set((state) => { clearElementalWards(state); return state; }),
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
      if (isDeveloperSandboxSavePaused()) return;
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
      if (isDeveloperSandboxSavePaused()) return;
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
        if (result.ok) {
          recalculateDerivedStats(state);
          reconcileChronicleProgress(state);
        }
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
    equipSigil: (instanceId) => {
      let result: ReturnType<typeof equipSigilAction> = { ok: false, reason: 'Sigil not found.' };
      set((state) => { result = equipSigilAction(state, instanceId); return state; });
      return result;
    },
    unequipSigil: (slot) => {
      let result: ReturnType<typeof unequipSigilAction> = { ok: false, reason: 'No Sigil is equipped in that slot.' };
      set((state) => { result = unequipSigilAction(state, slot); return state; });
      return result;
    },
    toggleSigilLock: (instanceId) => {
      let result: ReturnType<typeof toggleSigilLockAction> = { ok: false, reason: 'Sigil not found.' };
      set((state) => { result = toggleSigilLockAction(state, instanceId); return state; });
      return result;
    },
    enhanceSigil: (instanceId, options) => {
      let result: ReturnType<typeof enhanceSigilAction> = { ok: false, reason: 'Sigil not found.' };
      set((state) => { result = enhanceSigilAction(state, instanceId, options); return state; });
      return result;
    },
    salvageSigil: (instanceId) => {
      let result: ReturnType<typeof salvageSigilAction> = { ok: false, reason: 'Sigil not found.' };
      set((state) => { result = salvageSigilAction(state, instanceId); return state; });
      return result;
    },
    setSigilAttunement: (setId) => set((state) => { setSigilAttunementAction(state, setId); return state; }),
    bulkSalvageSigils: (instanceIds) => {
      let result: ReturnType<typeof bulkSalvageSigilsAction> = { ok: false, salvagedCount: 0, dustGranted: 0, skippedLocked: 0, skippedEquipped: 0, missing: 0 }
      set((state) => { result = bulkSalvageSigilsAction(state, instanceIds); return state; })
      return result
    },
    setSigilAutoSalvage: (quality, enabled) => set((state) => { setSigilAutoSalvageAction(state, quality, enabled); return state; }),
    craftSigil: (mode, tier, setId, slot) => {
      let result: ReturnType<typeof craftSigilAction> = { ok: false, reason: 'Unable to craft Sigil.' };
      set((state) => { result = craftSigilAction(state, mode, tier, setId, slot); return state; });
      return result;
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
    registerArcaneRegistryEntry: (itemId) => { let ok = false; set((state) => { ok = registerArcaneRegistryEntryAction(state, itemId); reconcileChronicleProgress(state); return state; }); return ok; },
    acceptGuildCommission: (commissionId) => { let ok = false; set((state) => { ok = acceptGuildCommissionAction(state, commissionId); return state; }); return ok; },
    deliverGuildCommissionItems: (amount) => { let ok = false; set((state) => { ok = deliverGuildCommissionItemsAction(state, amount); return state; }); return ok; },
    contributeGuildCommissionSupply: (objectiveIndex, amount) => { let ok = false; set((state) => { ok = contributeGuildCommissionSupplyAction(state, objectiveIndex, amount); return state; }); return ok; },
    refreshGuildCommissionChoices: () => { let ok = false; set((state) => { ok = refreshGuildCommissionChoicesAction(state); return state; }); return ok; },
    contributeGuildProject: (projectId, itemId, amount) => { let ok = false; set((state) => { ok = contributeGuildProjectAction(state, projectId, itemId, amount); return state; }); return ok; },
    startGuildCommissionChain: (chainId) => { let ok = false; set((state) => { ok = startGuildCommissionChainAction(state, chainId); return state; }); return ok; },
    contributeGuildCommissionChainDelivery: (amount) => { let ok = false; set((state) => { ok = contributeGuildCommissionChainDeliveryAction(state, amount); return state; }); return ok; },
    debugCompleteGuildProject: (id) => { let ok = false; set((state) => { ok = debugCompleteGuildProjectAction(state, id); return state; }); return ok; },
    debugGrantGuildProjectRequirements: (id) => { let ok = false; set((state) => { ok = debugGrantGuildProjectRequirementsAction(state, id); return state; }); return ok; },
    debugCompleteGuildProjectPrerequisites: (id) => { let ok = false; set((state) => { ok = debugCompleteGuildProjectPrerequisitesAction(state, id); return state; }); return ok; },
    debugCompleteGuildCommissionChain: (id) => { let ok = false; set((state) => { ok = debugCompleteGuildCommissionChainAction(state, id); return state; }); return ok; },
    debugCompleteGuildStudyStage: () => { let ok = false; set((state) => { ok = debugCompleteGuildStudyStageAction(state); return state; }); return ok; },
    debugResetGuildStudy: (id) => { let ok = false; set((state) => { ok = debugResetGuildStudyAction(state, id); return state; }); return ok; },
    debugSetGuildStudyFirstClear: (id, complete) => { let ok = false; set((state) => { ok = debugSetGuildStudyFirstClearAction(state, id, complete); return state; }); return ok; },
    debugSetGuildCommissionRngSeed: (seed) => set((state) => { debugSetGuildCommissionRngSeedAction(state, seed); return state; }),
    debugRegenerateGuildCommissionBoard: (options = {}) => set((state) => { debugRegenerateGuildCommissionBoardAction(state, options); return state; }),
    debugCompleteActiveGuildCommission: () => { let ok = false; set((state) => { ok = debugCompleteActiveGuildCommissionAction(state); return state; }); return ok; },
    debugGrantGuildReputation: (amount) => set((state) => { debugGrantGuildReputationAction(state, amount); return state; }),
    debugSetArcaneGuildUnlocked: (unlocked) => set((state) => { debugSetArcaneGuildUnlockedAction(state, unlocked); return state; }),
    debugCompleteRegistryEntry: (itemId) => { let ok = false; set((state) => { ok = debugCompleteRegistryEntryAction(state, itemId); reconcileChronicleProgress(state); return state; }); return ok; },
    debugCompleteRegistrySet: (id) => { let ok = false; set((state) => { ok = debugCompleteRegistrySetAction(state, id); reconcileChronicleProgress(state); return state; }); return ok; },
    debugResetRegistrySet: (id) => { let ok = false; set((state) => { ok = debugResetRegistrySetAction(state, id); return state; }); return ok; },
    debugSetHuntersOrderUnlocked: (unlocked) => set((state) => { debugSetHuntersOrderUnlockedAction(state, unlocked); return state; }),
    debugGrantHunterReputation: (amount) => set((state) => { debugGrantHunterReputationAction(state, amount); return state; }),
    debugGrantHunterMarks: (amount) => set((state) => { debugGrantHunterMarksAction(state, amount); return state; }),
    debugSetHunterRngSeed: (seed) => set((state) => { debugSetHunterRngSeedAction(state, seed); return state; }),
    debugRegenerateHunterContractBoard: (options = {}) => set((state) => { debugRegenerateHunterContractBoardAction(state, options); return state; }),
    debugSetHunterRank: (rank) => { let ok = false; set((state) => { ok = debugSetHunterRankAction(state, rank); return state; }); return ok; },
    debugSetHunterStanding: (id) => { let ok = false; set((state) => { ok = debugSetHunterStandingAction(state, id); return state; }); return ok; },
    debugSetHunterUpgradeRank: (id, rank) => { let ok = false; set((state) => { ok = debugSetHunterUpgradeRankAction(state, id, rank); return state; }); return ok; },
    debugSetAllHunterUpgrades: (mode) => { let ok = false; set((state) => { ok = debugSetAllHunterUpgradesAction(state, mode); return state; }); return ok; },
    debugGrantHunterUpgrade: (upgradeId) => { let ok = false; set((state) => { ok = debugGrantHunterUpgradeAction(state, upgradeId); return state; }); return ok; },
    debugClearHunterTargetBlocks: () => { let ok = false; set((state) => { ok = debugClearHunterTargetBlocksAction(state); return state; }); return ok; },
    debugGrantNightglassContract: () => { let ok = false; set((state) => { ok = debugGrantNightglassContractAction(state); return state; }); return ok; },
    debugCompleteActiveHunterContract: () => { let ok = false; set((state) => { ok = debugCompleteActiveHunterContractAction(state); reconcileChronicleProgress(state); return state; }); return ok; },
    acceptHunterContract: (contractId) => { let ok = false; set((state) => { ok = acceptHunterContractAction(state, contractId); return state; }); return ok; },
    issueFirstHunterContract: () => { let ok = false; set((state) => { ok = issueFirstHunterContractAction(state); return state; }); return ok; },
    requestHunterAssignment: () => { let ok = false; set((state) => { ok = requestHunterAssignmentAction(state); return state; }); return ok; },
    requestHunterContractBoard: () => { let ok = false; set((state) => { ok = requestHunterContractBoardAction(state); return state; }); return ok; },
    skipHunterContract: () => { let ok = false; set((state) => { ok = skipHunterContractAction(state); if (ok) stopHunterContractCombat(state); return state; }); return ok; },
    rerollHunterContracts: () => { let ok = false; set((state) => { ok = rerollHunterContractsAction(state); return state; }); return ok; },
    toggleHunterContractPin: (contractId) => { let ok = false; set((state) => { ok = toggleHunterContractPinAction(state, contractId); return state; }); return ok; },
    setHunterPreferredContractType: (type) => { let ok = false; set((state) => { ok = setHunterPreferredContractTypeAction(state, type); return state; }); return ok; },
    setHunterPreferredHuntingGround: (groundId) => { let ok = false; set((state) => { ok = setHunterPreferredHuntingGroundAction(state, groundId); return state; }); return ok; },
    rememberHunterQuarry: (monsterId, groundId) => { let ok = false; set((state) => { ok = rememberHunterQuarryAction(state, monsterId, groundId); return state; }); return ok; },
    purchaseHunterUpgrade: (upgradeId) => { let ok = false; set((state) => { ok = purchaseHunterUpgradeAction(state, upgradeId); return state; }); return ok; },
    setHunterTargetBlocked: (monsterId, blocked) => { let ok = false; set((state) => { ok = setHunterTargetBlockedAction(state, monsterId, blocked); return state; }); return ok; },
    clearHunterTargetBlocks: () => { let ok = false; set((state) => { ok = clearHunterTargetBlocksAction(state); return state; }); return ok; },
    claimGuildReward: (requestId) =>
      set((state) => {
        claimGuildRewardAction(state, requestId);
        return state;
      }),
    promoteGuild: () =>
      set((state) => {
        promoteGuildAction(state);
        reconcileChronicleProgress(state);
        return state;
      }),
    purchaseGuildSkillNode: (nodeId, free = false) => {
      let ok = false;
      set((state) => {
        ok = purchaseGuildSkillNodeAction(state, nodeId, free);
        return state;
      });
      return ok;
    },
    resetGuildSkillTree: () => {
      let ok = false;
      set((state) => {
        const result = resetGuildSkillTreeAction(state);
        ok = result.ok;
        if (!result.ok) pushNotification(state, result.reason, "warning", { key: "guild-skill-reset", cooldownMs: 1000 });
        return state;
      });
      return ok;
    },
    resetGuildRequests: () => set((state) => { resetGuildRequestsAction(state); return state; }),
    debugSetGuildRank: (rank) => set((state) => { setGuildRankAction(state, rank); return state; }),
    debugGrantGuildPoint: (amount) => set((state) => { grantGuildPointAction(state, amount); return state; }),
    debugSetGuildSkillNodeRank: (id, rank) => { let ok = false; set((state) => { ok = debugSetGuildSkillNodeRankAction(state, id, rank); return state; }); return ok; },
    debugSetAllGuildSkillRanks: (mode) => { let ok = false; set((state) => { ok = debugSetAllGuildSkillRanksAction(state, mode); return state; }); return ok; },
    debugSetGuildReputation: (amount) => set((state) => { debugSetGuildReputationAction(state, amount); return state; }),
    debugReconcileChronicles: () => set((state) => { reconcileChronicleProgress(state); return state; }),
    debugSetChronicleEvent: (eventId, enabled) => set((state) => { state.progress.chronicle.eventFlags[eventId] = enabled; reconcileChronicleProgress(state); return state; }),
    debugCompleteChronicleObjective: (objectiveId) => set((state) => { debugCompleteChronicleObjective(state, objectiveId); reconcileChronicleProgress(state); return state; }),
    debugCompleteChroniclePrerequisites: (objectiveId) => set((state) => { debugCompleteChroniclePrerequisites(state, objectiveId); reconcileChronicleProgress(state); return state; }),
    debugCompleteChronicleChapter: (chapterId) => set((state) => { debugCompleteChronicleChapter(state, chapterId); reconcileChronicleProgress(state); return state; }),
    debugUnlockChronicleChapter: (chapterId) => set((state) => { debugUnlockChronicleChapter(state, chapterId); reconcileChronicleProgress(state); return state; }),
    debugCompleteChronicleRequiredObjectives: (chapterId) => set((state) => { debugCompleteChronicleRequiredObjectives(state, chapterId); reconcileChronicleProgress(state); return state; }),
    debugCompleteChronicleOptionalObjectives: (chapterId) => set((state) => { debugCompleteChronicleOptionalObjectives(state, chapterId); reconcileChronicleProgress(state); return state; }),
    debugCompleteChronicleTrack: (chapterId, track) => set((state) => { debugCompleteChronicleTrack(state, chapterId, track); reconcileChronicleProgress(state); return state; }),
    debugResetChronicleTrack: (chapterId, track) => set((state) => { debugResetChronicleTrack(state, chapterId, track); return state; }),
    debugResetChronicleChapter: (chapterId) => set((state) => { debugResetChronicleChapter(state, chapterId); return state; }),
    debugResetAllChronicles: () => set((state) => { debugResetAllChronicles(state); return state; }),
    debugSkipCurrentChronicleObjective: () => set((state) => { const objective = getChronicleMainObjective(state); if (objective) debugCompleteChronicleObjective(state, objective.id); reconcileChronicleProgress(state); return state; }),
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
  advanceWithOfflineBank: async (durationMs, onProgress) => {
      const activeProfileId = getActiveProfileId();
      const sandbox = isDeveloperSandboxSavePaused();
      if (!sandbox) {
        const preflight = validateProfileCandidate(activeProfileId, get());
        if (!preflight.ok) return { ok: false, error: `Offline Bank could not start because the profile cannot currently be saved. Open Save Diagnostics. ${preflight.error ?? ''}`.trim(), saveKind: preflight.kind };
      }
      const result = await runOfflineBankAdvance(
        durationMs,
        get,
        (recipe) =>
          set((state) => {
            recipe(state);
            return state;
          }),
        (candidate) => candidate && !sandbox ? saveGameCandidateAction(candidate, getActiveProfileId(), Date.now()) : undefined,
        (state, itemId, amount) =>
          recordRecentAcquisition(state as GameStore, itemId, amount),
        offlineBankAnalyticsObservers,
        onProgress,
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

export const selectManaRegen = (state: GameStore) => manaRegenPerSecond(state);
export const makeInitialState = createInitialState;
