import { BALANCE } from '../../core/balance/balance'
import { DUNGEONS, chooseMonster } from '../../content/dungeons/dungeons'
import { getCombatEncounterMode, getCombatLocationByDungeonId, isCombatTargetForLocation } from '../../content/world-navigation'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import { recalculateDerivedStats, appendLog, pushNotification } from '../../engine'
import type { ActiveCombatSpellLoadout, DungeonId, GameState, ItemId, MonsterId } from '../../types'
import { executeCombatEffects, damageEnemy, damagePlayer, gainBarrier } from './effectResolver'
import { gainBarrier as gainBarrierRuntime } from './barrierRuntime'
import { applyStatus, clearStatuses } from './statusRuntime'
import { clearEnemyRuleCooldowns, resetAllCombatRuleRuntime, resetEncounterRuleFlags, runCombatTriggers } from './triggerRuntime'
import { createCombatResolutionContext, type CombatEvent, type CombatEventSink, type StatusId } from './combatTypes'
import { initializeEnemyActionRuntime, resetEnemyActionRuntime, startNextEnemyAction } from './actionRuntime'
import { resolveMonsterLoot } from '../loot'
import { getArcaneCoreReward } from '../../content/arcaneCore/arcaneCoreRewards'
import { grantArcanePoints } from '../arcaneCore/arcaneCoreProgression'
import { discoverMonster } from '../collection/discovery'
import type { SimulationReportCollector } from '../offline-bank/offlineBankReport'
import { nextCombatRandom } from './combatRng'
import { reconcileStoryProgression } from '../story/storyProgression'
import { SUMMONING_UNLOCK_BOSS_ID } from '../../content/guardians/guardians'
import { beginGuardianEncounter, clearGuardianRuntime, suppressGuardianIfOutOfMana } from '../summoning/summoningRuntime'
import { activateSelectedSpellPresetForBattle, getSelectedSpellPreset } from '../spells'
import { resetArcaneCoreEncounterRuntime } from '../arcaneCore/arcaneCoreRuntime'
import { grantEnemyResonanceReward } from '../resonance/resonanceRuntime'
import { formatResonanceBundle } from '../../presentation/resonance/resonancePresentation'
import { getWorldTierDefinition, resolveWorldTierEnemyProfile, unlockWorldTierFromBossKill } from '../world-tier/worldTierRuntime'
import { resolveBossThreatRequirement, resolveThreatGainForKill } from './combatThreat'

export { applyStatus, clearStatuses, damageEnemy, damagePlayer, executeCombatEffects, gainBarrier }

export const applyBarrier = (state: GameState, amount: number) => gainBarrierRuntime(state, amount, { actor: 'player', kind: 'spell', sourceId: 'legacy-barrier', tags: ['barrier'] }, 'player', ['barrier'], { mode: 'replace', durationMs: 9000 })

/** DEV-only status fixture routed through the same application/trigger path as combat. */
export const debugApplyStatus = (state: GameState, actor: 'player' | 'enemy', statusId: StatusId, durationMs?: number | null, stacks?: number) => {
  const sourceActor = actor === 'player' ? 'enemy' : 'player'
  executeCombatEffects(state, [{ type: 'apply-status', target: 'opponent', statusId, durationMs, stacks, tags: ['status'] }], { actor: sourceActor, kind: 'system', sourceId: 'developer-tools', tags: ['status'] })
}

type CombatLoadoutFailure = Extract<ReturnType<typeof activateSelectedSpellPresetForBattle>, { ok: false }>

export type BattleLoadoutResolution =
  | { ok: true; activatedSelected: true; loadout: ActiveCombatSpellLoadout }
  | { ok: true; activatedSelected: false; fallback: true; loadout: ActiveCombatSpellLoadout; failure: CombatLoadoutFailure }
  | { ok: false; failure: CombatLoadoutFailure }

/** Attempts the selected next-battle preset, falling back only to a frozen valid encounter snapshot. */
export const resolveSpellLoadoutForNextBattle = (state: GameState): BattleLoadoutResolution => {
  const activation = activateSelectedSpellPresetForBattle(state)
  if (activation.ok) return { ok: true, activatedSelected: true, loadout: activation.loadout }
  const frozenLoadout = state.combat.activeSpellLoadout
  if (frozenLoadout && frozenLoadout.slots.length > 0) return { ok: true, activatedSelected: false, fallback: true, loadout: frozenLoadout, failure: activation }
  return { ok: false, failure: activation }
}

const getLoadoutFailureMessage = (failure: CombatLoadoutFailure, selectedPreset: ReturnType<typeof getSelectedSpellPreset>, continuingWith?: string) => {
  if (!continuingWith) {
    return failure.reason === 'missing-preset'
      ? 'Select a Spell Preset before entering combat.'
      : failure.reason === 'empty'
        ? `${selectedPreset?.name ?? 'Selected Preset'} has no Spells. Add at least one Spell in Manage Presets.`
        : failure.reason === 'unavailable'
          ? `${selectedPreset?.name ?? 'Selected Preset'} has no currently unlocked Spells.`
          : `${selectedPreset?.name ?? 'Selected Preset'} could not activate — requires ${failure.requiredExtraFocus ?? 0} more Focus.`
  }
  return failure.reason === 'missing-preset'
    ? `Selected Preset is unavailable. Continuing with ${continuingWith}.`
    : failure.reason === 'empty'
      ? `${selectedPreset?.name ?? 'Selected Preset'} has no Spells. Continuing with ${continuingWith}.`
      : failure.reason === 'unavailable'
        ? `${selectedPreset?.name ?? 'Selected Preset'} has no currently unlocked Spells. Continuing with ${continuingWith}.`
        : `${selectedPreset?.name ?? 'Selected Preset'} could not activate — requires ${failure.requiredExtraFocus ?? 0} more Focus. Continuing with ${continuingWith}.`
}

export const spawnEnemy = (state: GameState, enemyId: MonsterId, uiEvents?: CombatEventSink) => {
  const monster = MONSTERS[enemyId]
  const resolution = resolveSpellLoadoutForNextBattle(state)
  if (!resolution.ok) {
    const selectedPreset = getSelectedSpellPreset(state)
    pushNotification(state, getLoadoutFailureMessage(resolution.failure, selectedPreset), 'warning', { key: `combat-loadout-activation:${state.spellPresets.selectedPresetId ?? 'missing'}:${resolution.failure.reason}`, cooldownMs: 1000 })
    return false
  }
  if (resolution.activatedSelected === false) {
    const selectedPreset = getSelectedSpellPreset(state)
    pushNotification(state, getLoadoutFailureMessage(resolution.failure, selectedPreset, resolution.loadout.presetName), 'warning', { key: `combat-loadout-fallback:${state.spellPresets.selectedPresetId ?? 'missing'}:${resolution.failure.reason}`, cooldownMs: 15_000 })
  }
  const previousSerial = Number.isSafeInteger(state.combat.enemyInstanceSerial) ? state.combat.enemyInstanceSerial : 0
  state.combat.enemyInstanceSerial = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, previousSerial) + 1)
  state.combat.enemyInstanceKey = `enemy:${state.combat.enemyInstanceSerial}`
  state.combat.enemyId = enemyId
  state.combat.enemyWorldTier = getWorldTierDefinition(state.worldTier.current).id
  const enemyProfile = resolveWorldTierEnemyProfile(enemyId, state.combat.enemyWorldTier)
  resetArcaneCoreEncounterRuntime(state)
  state.combat.enemyHp = enemyProfile.maxHealth
  state.combat.enemyMaxHp = enemyProfile.maxHealth
  state.combat.enemyBarrier = 0
  state.combat.enemyBarrierRemainingMs = null
  initializeEnemyActionRuntime(state)
  resetEncounterRuleFlags(state)
  clearEnemyRuleCooldowns(state)
  state.combat.inBossFight = isBossMonster(monster)
  state.combat.pendingPlayerSpellCast = null
  state.combat.enemyStatuses = []
  state.combat.autoCastManaStarvedSpells = []
  discoverMonster(state, enemyId)
  uiEvents?.push({ source: { kind: 'system' }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, target: 'enemy', targetMonsterId: enemyId, category: 'system', sourceId: 'encounter-start', worldTier: state.combat.enemyWorldTier })
  const combatStartResolution = createCombatResolutionContext()
  runCombatTriggers(state, 'enemy', 'on-combat-start', { source: { actor: 'enemy', kind: 'system', sourceId: 'combat-start' } }, executeCombatEffects, 0, [], uiEvents, combatStartResolution)
  runCombatTriggers(state, 'player', 'on-combat-start', { source: { actor: 'player', kind: 'system', sourceId: 'combat-start' }, eventTarget: 'enemy' }, executeCombatEffects, 0, [], uiEvents, combatStartResolution)
  beginGuardianEncounter(state)
  if (state.combat.enemyHp > 0 && state.player.health > 0) startNextEnemyAction(state, executeCombatEffects, 0, uiEvents)
  appendLog(state, `${monster.name} enters the encounter.`)
  return true
}

export interface AbandonCurrentEncounterOptions {
  clearPendingBoss?: boolean
  resetEncounterTimer?: boolean
}

/**
 * Removes the current encounter without resolving it as a defeat or a kill.
 *
 * This is deliberately narrower than resetting a combat run: player-bound
 * state, location state, Threat, Auto Hunt, and the active spell loadout stay
 * intact while all enemy-bound runtime is discarded.
 */
export const abandonCurrentEncounter = (state: GameState, options: AbandonCurrentEncounterOptions = {}) => {
  const { clearPendingBoss = true, resetEncounterTimer = true } = options
  clearGuardianRuntime(state)
  state.combat.enemyId = null
  state.combat.enemyWorldTier = null
  state.combat.enemyInstanceKey = null
  state.combat.enemyHp = 0
  state.combat.enemyMaxHp = 0
  state.combat.enemyBarrier = 0
  state.combat.enemyBarrierRemainingMs = null
  state.combat.pendingPlayerSpellCast = null
  state.combat.enemyStatuses = []
  state.combat.autoCastManaStarvedSpells = []
  state.combat.inBossFight = false
  if (clearPendingBoss) state.combat.pendingBossId = null
  if (resetEncounterTimer) state.combat.encounterTimerMs = 0
  clearEnemyRuleCooldowns(state)
  resetEnemyActionRuntime(state)
}

export const spawnNextEnemy = (state: GameState, uiEvents?: CombatEventSink) => {
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  const location = getCombatLocationByDungeonId(dungeon.id)
  if (getCombatEncounterMode(location) === 'sequence' && dungeon.encounterSequence?.length) {
    const sequenceIndex = Number.isInteger(state.combat.dungeonSequenceIndex) && state.combat.dungeonSequenceIndex! >= 0 && state.combat.dungeonSequenceIndex! <= dungeon.encounterSequence.length
      ? state.combat.dungeonSequenceIndex!
      : 0
    state.combat.dungeonSequenceIndex = sequenceIndex
    const nextEnemyId = sequenceIndex < dungeon.encounterSequence.length ? dungeon.encounterSequence[sequenceIndex] : dungeon.boss
    const spawned = spawnEnemy(state, nextEnemyId, uiEvents)
    if (!spawned && state.combat.active) state.combat.encounterTimerMs = dungeon.encounterDelayMs
    return spawned
  }
  if (state.combat.pendingBossId) {
    const boss = state.combat.pendingBossId
    state.combat.pendingBossId = null
    if (MONSTERS[boss]) {
      const spawned = spawnEnemy(state, boss, uiEvents)
      if (!spawned) state.combat.pendingBossId = boss
      else pushNotification(state, `${MONSTERS[boss].name} arrives via Auto Hunt`, 'warning')
      if (!spawned && state.combat.active) state.combat.encounterTimerMs = dungeon.encounterDelayMs
      return spawned
    }
  }
  const targetedEnemyId = isCombatTargetForLocation(location, dungeon.id, state.combat.targetEnemyId) ? state.combat.targetEnemyId : null
  if (getCombatEncounterMode(location) === 'targeted' && !targetedEnemyId) {
    pushNotification(state, 'Select a Hunt Target before starting this Location.', 'warning', { key: `combat-target-required:${dungeon.id}`, cooldownMs: 1000 })
    return false
  }
  const nextEnemyId = targetedEnemyId ?? chooseMonster(dungeon.monsterPool, () => nextCombatRandom(state))
  const spawned = spawnEnemy(state, nextEnemyId, uiEvents)
  if (!spawned && state.combat.active) state.combat.encounterTimerMs = dungeon.encounterDelayMs
  return spawned
}

export interface CombatLootDrop { itemId: ItemId; quantity: number; isNewDiscovery: boolean }
export type CombatLootObserver = (state: GameState, enemyId: MonsterId, drops: readonly CombatLootDrop[]) => void

export const finishEnemy = (state: GameState, report?: SimulationReportCollector, onItemAcquired?: (itemId: ItemId, quantity: number) => void, uiEvents?: CombatEventSink, onLootResolved?: CombatLootObserver) => {
  const enemyId = state.combat.enemyId
  if (!enemyId) return
  const monster = MONSTERS[enemyId]
  const undiscoveredItems = new Set(state.progress.discoveredItems)
  const resolvedDrops: CombatLootDrop[] = []
  const drops = resolveMonsterLoot(state, enemyId, (itemId, quantity) => { onItemAcquired?.(itemId, quantity); report?.recordLoot(itemId, quantity); resolvedDrops.push({ itemId, quantity, isNewDiscovery: !undiscoveredItems.has(itemId) }); uiEvents?.push({ source: { kind: 'system' }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, target: 'enemy', targetMonsterId: enemyId, category: 'loot', sourceId: 'loot-drop', itemId, amount: quantity }) })
  if (resolvedDrops.length) onLootResolved?.(state, enemyId, resolvedDrops)
  const encounterWorldTier = state.combat.enemyWorldTier ?? getWorldTierDefinition(state.worldTier.current).id
  const resonanceReward = grantEnemyResonanceReward(state.resonance, enemyId, encounterWorldTier)
  const resonanceGained = resonanceReward.grantedYield
  report?.recordResonance(resonanceGained)
  const resonanceText = formatResonanceBundle(resonanceGained)
  const rewardText = resonanceText === '0 Resonance' ? '' : ` · ${resonanceText}`
  if (resonanceText !== '0 Resonance') {
    uiEvents?.push({ source: { kind: 'system' }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, target: 'enemy', targetMonsterId: enemyId, category: 'resonance', sourceId: 'resonance-reward', worldTier: encounterWorldTier, resonanceReward })
  }
  report?.recordKill(enemyId)
  clearGuardianRuntime(state)
  state.combat.enemyId = null
  state.combat.enemyWorldTier = null
  state.combat.enemyInstanceKey = null
  state.combat.pendingPlayerSpellCast = null
  state.combat.enemyHp = 0
  state.combat.enemyBarrier = 0
  state.combat.enemyBarrierRemainingMs = null
  resetEnemyActionRuntime(state)
  state.combat.enemyStatuses = []
  state.combat.autoCastManaStarvedSpells = []
  clearEnemyRuleCooldowns(state)
  const dungeon = DUNGEONS[state.combat.dungeonId ?? 'whispering-woods']
  const location = getCombatLocationByDungeonId(dungeon.id)
  const sequenceDungeon = getCombatEncounterMode(location) === 'sequence' && Boolean(dungeon.encounterSequence?.length)
  const arcaneReward = getArcaneCoreReward(state.combat.dungeonId)
  const bossDefeated = isBossMonster(monster)
  const arcanePoints = arcaneReward ? (bossDefeated ? arcaneReward.bossKillPoints : arcaneReward.normalKillPoints) : 0
  if (arcanePoints > 0) {
    const pointsResult = grantArcanePoints(state.arcaneCore, arcanePoints)
    state.arcaneCore = pointsResult.state
    report?.recordArcanePoints(pointsResult.granted, pointsResult.pointsBefore, pointsResult.pointsAfter)
    if (!report && bossDefeated) pushNotification(state, `+${pointsResult.granted} Arcane Points`, 'success', { key: 'arcane-core-points-boss-reward', cooldownMs: 1000 })
  }
  state.combat.encounterTimerMs = dungeon.encounterDelayMs
  if (bossDefeated) {
    state.combat.threatCleared = 0
    state.combat.inBossFight = false
    const bossId = enemyId
    state.progress.bossKillsByBoss[bossId] = (state.progress.bossKillsByBoss[bossId] ?? 0) + 1
    const unlockedWorldTier = unlockWorldTierFromBossKill(state, bossId)
    if (bossId === SUMMONING_UNLOCK_BOSS_ID && state.progress.bossKillsByBoss[bossId] === 1) pushNotification(state, 'Wizard Tower: Summoning unlocked.', 'success')
    if (bossId === 'corrupted-elemental-gatekeeper' && state.progress.bossKillsByBoss[bossId] === 1) pushNotification(state, 'FRACTURED APPROACH COMPLETE / Branch routes unlocked.', 'success')
    if (state.combat.pendingBossId === enemyId) state.combat.pendingBossId = null
    state.progress.autoHuntBossUnlocked = true
    if (bossId === 'forest-heart' && !state.progress.firstBossKill) {
      state.progress.firstBossKill = true
      state.progress.guildUnlocked = true
      state.progress.guildRank = 'initiate'
      state.progress.emberStaffUnlocked = true
      state.progress.forestHeartUnlocked = true
      pushNotification(state, 'Forest Heart defeated - Guild unlocked', 'success')
    }
    if (bossId === 'forest-heart' && !state.progress.permanentFocusBonuses['forest-heart']) {
      state.progress.permanentFocusBonuses['forest-heart'] = BALANCE.focus.forestHeartBonus
      recalculateDerivedStats(state)
      pushNotification(state, 'WHISPERING WOODS COMPLETE / Howling Den unlocked.', 'success')
    }
    if (bossId === 'corrupted-greatbear' && state.progress.bossKillsByBoss[bossId] === 1) pushNotification(state, 'HOWLING DEN COMPLETE / Abandoned Catacombs unlocked.', 'success')
    if (bossId === 'archmage-edrin-shade' && state.progress.bossKillsByBoss[bossId] === 1) {
      pushNotification(state, 'FIRST CHAPTER COMPLETE', 'success')
      if (state.progress.magicLevelCap < BALANCE.schoolProgression.tutorialCompleteCap) {
        state.progress.magicLevelCap = Math.max(state.progress.magicLevelCap, BALANCE.schoolProgression.tutorialCompleteCap)
        pushNotification(state, `Magic School cap increased to ${state.progress.magicLevelCap}`, 'success')
      }
    }
    reconcileStoryProgression(state)
    report?.recordNotable(`${monster.name} defeated`)
    if (sequenceDungeon) {
      state.combat.active = false
      state.combat.enemyMaxHp = 0
      state.combat.dungeonSequenceIndex = null
      state.combat.targetEnemyId = null
      state.combat.pendingBossId = null
      state.combat.inBossFight = false
      state.combat.encounterTimerMs = 0
      appendLog(state, `${monster.name} defeated${drops ? ` - ${drops}` : ''}${rewardText}. ${dungeon.name} cleared.`)
      pushNotification(state, `${dungeon.name.toUpperCase()} CLEARED`, 'success', { key: `dungeon-cleared:${dungeon.id}`, cooldownMs: 1000 })
    } else appendLog(state, `${monster.name} defeated${drops ? ` - ${drops}` : ''}${rewardText}. Threat resets.`)
    if (unlockedWorldTier) pushNotification(state, `WORLD TIER ${unlockedWorldTier} UNLOCKED`, 'success')
  } else if (sequenceDungeon) {
    const sequenceLength = dungeon.encounterSequence?.length ?? 0
    state.combat.dungeonSequenceIndex = Math.min(sequenceLength, Math.max(0, (state.combat.dungeonSequenceIndex ?? 0) + 1))
    state.progress.lifetimeKills += 1
    state.progress.lifetimeKillsByMonster[enemyId] = (state.progress.lifetimeKillsByMonster[enemyId] ?? 0) + 1
    appendLog(state, `${monster.name} defeated${drops ? ` - ${drops}` : ''}${rewardText}`)
  } else {
    state.progress.lifetimeKills += 1
    state.progress.lifetimeKillsByMonster[enemyId] = (state.progress.lifetimeKillsByMonster[enemyId] ?? 0) + 1
    const requirement = resolveBossThreatRequirement(dungeon.id, state.worldTier.current)
    const beforeThreat = Math.max(0, state.combat.threatCleared)
    const threatGain = resolveThreatGainForKill(state, enemyId, encounterWorldTier)
    const afterThreat = Math.min(requirement, beforeThreat + threatGain)
    state.combat.threatCleared = afterThreat
    if (enemyId === 'grove-sentinel') state.progress.requestProgress['sentinel-breaker'] = Math.max(state.progress.requestProgress['sentinel-breaker'] ?? 0, state.progress.lifetimeKillsByMonster[enemyId])
    if (state.combat.dungeonId === 'whispering-woods') state.progress.requestProgress['clear-the-woods'] = (state.progress.requestProgress['clear-the-woods'] ?? 0) + 1
    appendLog(state, `${monster.name} defeated${drops ? ` - ${drops}` : ''}${rewardText}`)
    if (beforeThreat < requirement && afterThreat >= requirement) pushNotification(state, `${MONSTERS[dungeon.boss].name} is ready`, 'success')
    if (state.progress.autoHuntBossByDungeon[dungeon.id] && afterThreat >= requirement && !state.combat.pendingBossId) {
      state.combat.pendingBossId = dungeon.boss
      pushNotification(state, `Auto Hunt Boss queued ${MONSTERS[dungeon.boss].name}`, 'info')
    }
  }
}

export interface ResolveCombatDeathsOptions { forceEnemyDeath?: boolean; onLootResolved?: CombatLootObserver; onPlayerDefeated?: (event: CombatEvent, state: GameState) => void; onCombatCompleted?: (state: GameState, dungeonId: DungeonId) => void }

export const resolveCombatDeaths = (state: GameState, report?: SimulationReportCollector, onItemAcquired?: (itemId: ItemId, quantity: number) => void, uiEvents?: CombatEventSink, options: ResolveCombatDeathsOptions = {}) => {
  if (state.player.health <= 0 && !state.debug.playerImmortal) {
    const deathEvent: CombatEvent = { source: { kind: 'system' }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, target: 'player', targetMonsterId: state.combat.enemyId ?? undefined, category: 'death', sourceId: 'player-defeated' }
    options.onPlayerDefeated?.(deathEvent, state)
    uiEvents?.push(deathEvent)
    report?.recordPlayerDeath()
    clearGuardianRuntime(state)
    state.combat.active = false
    state.combat.enemyId = null
    state.combat.enemyWorldTier = null
    state.combat.enemyInstanceKey = null
    state.combat.pendingPlayerSpellCast = null
    state.combat.queuedPlayerSpellId = null
    state.combat.activeSpellLoadout = null
    state.combat.enemyHp = 0
    state.combat.enemyBarrier = 0
    state.combat.enemyBarrierRemainingMs = null
    resetEnemyActionRuntime(state)
    state.combat.playerBarrier = 0
    state.combat.playerBarrierRemainingMs = null
    state.combat.playerStatuses = []
    state.combat.enemyStatuses = []
    state.combat.autoCastManaStarvedSpells = []
    Object.keys(state.combat.spellCooldowns).forEach((spellId) => { delete state.combat.spellCooldowns[spellId as keyof typeof state.combat.spellCooldowns] })
    state.combat.pendingBossId = null
    resetAllCombatRuleRuntime(state)
    state.combat.threatCleared = 0
    if (getCombatEncounterMode(getCombatLocationByDungeonId(state.combat.dungeonId)) === 'sequence') {
      state.combat.dungeonSequenceIndex = null
      state.combat.targetEnemyId = null
    }
    state.combat.inBossFight = false
    pushNotification(state, 'Defeated - recovering in the Tower', 'warning')
    const sequenceDungeon = getCombatEncounterMode(getCombatLocationByDungeonId(state.combat.dungeonId)) === 'sequence'
    appendLog(state, sequenceDungeon ? 'The wizard falls. Dungeon run reset.' : 'The wizard falls. Threat resets to 0.')
    return true
  }
  if (state.debug.playerImmortal && state.player.health <= 0) state.player.health = 1
  suppressGuardianIfOutOfMana(state)
  if (state.debug.enemyImmortal && !options.forceEnemyDeath && state.combat.enemyId && state.combat.enemyHp <= 0) {
    state.combat.enemyHp = 1
    return false
  }
  if (state.combat.enemyId && state.combat.enemyHp <= 0) {
    const enemyId = state.combat.enemyId
    const dungeonId = state.combat.dungeonId
    uiEvents?.push({ source: { kind: 'system' }, sourceKind: 'system', dungeonId: state.combat.dungeonId ?? undefined, target: 'enemy', targetMonsterId: enemyId, category: 'death', sourceId: 'enemy-defeated' })
    finishEnemy(state, report, onItemAcquired, uiEvents, options.onLootResolved)
    if (!state.combat.active && dungeonId) options.onCombatCompleted?.(state, dungeonId)
    return true
  }
  return false
}
