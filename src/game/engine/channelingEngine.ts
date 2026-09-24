import { BALANCE } from '../core/balance/balance'
import { CHANNELING_DISCOVERIES } from '../content/channeling/channelingDiscoveries'
import { MANA_PILLARS } from '../content/channeling/manaPillars'
import { getEquipmentStats } from '../core/equipment/equipmentStats'
import type { ChannelingDiscoveryId, GameState, ManaPillarId } from '../types'
import { clamp } from '../utils'
import { getCombatModifiers } from '../systems/combat/modifiers'
import { stabilizeResourceValue } from '../presentation/resources/resourcePresentation'
import { getArcaneCoreDynamicManaRegen, getArcaneCoreDynamicManaRegenMultiplier } from '../systems/arcaneCore/arcaneCoreRuntime'
import { getArcaneCoreSpecialEffects } from '../systems/arcaneCore/arcaneCoreProgression'
import { gainBarrier } from '../systems/combat/barrierRuntime'

export interface ManaRegenBreakdown {
  baseNatural: number
  leylineConduitBonus: number
  stableLeylineBonus: number
  equipmentPassiveBonus: number
  developerBonus: number
  passiveBeforeResonance: number
  manaResonanceMultiplier: number
  passiveAfterResonance: number
  echoBase: number
  echoAttunementMultiplier: number
  echoDiscoveryMultiplier: number
  echoTotal: number
  total: number
}

export interface ManaCapacityBreakdown {
  base: number
  arcaneReservoirBonus: number
  deepReservoirBonus: number
  equipmentBonus: number
  futureFlatBonus: number
  developerCapacityBonus: number
  preAmplification: number
  astralExpansionMultiplier: number
  total: number
}

const pillarLevel = (state: Pick<GameState, 'progress'>, id: ManaPillarId) => Math.max(0, Math.min(10, state.progress.channeling.pillars[id]?.level ?? 0))

export const getManaPillarLevel = (state: Pick<GameState, 'progress'>, id: ManaPillarId) => pillarLevel(state, id)

export type ChannelingCapacityState = Pick<GameState, 'player' | 'progress' | 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'debug' | 'arcaneCore'>>
export type ChannelingRegenState = Pick<GameState, 'activities' | 'progress' | 'equipment' | 'artifactProgress'> & Partial<Pick<GameState, 'debug' | 'player' | 'combat' | 'arcaneCore'>>

export const getManaCapacityBreakdown = (state: ChannelingCapacityState): ManaCapacityBreakdown => {
  const stats = getEquipmentStats(state)
  const arcaneReservoirBonus = pillarLevel(state, 'arcane-reservoir') * 25
  const deepReservoirBonus = state.progress.channeling.discoveries['deep-reservoir'] ? BALANCE.channeling.deepReservoirCapacityBonus : 0
  const equipmentBonus = stats.maxMana ?? 0
  const futureFlatBonus = 0
  const developerCapacityBonus = state.debug?.bonusMaxManaFlat ?? 0
  const rawCapacity = state.player.baseMaxMana + arcaneReservoirBonus + deepReservoirBonus + equipmentBonus + futureFlatBonus + developerCapacityBonus
  const preAmplification = rawCapacity * (1 + (stats.maxManaPct ?? 0))
  const astralExpansionMultiplier = 1 + pillarLevel(state, 'astral-expansion') * 0.01
  return {
    base: state.player.baseMaxMana,
    arcaneReservoirBonus,
    deepReservoirBonus,
    equipmentBonus,
    futureFlatBonus,
    preAmplification,
    astralExpansionMultiplier,
    developerCapacityBonus,
    total: Math.floor(preAmplification * astralExpansionMultiplier),
  }
}

export const getManaRegenBreakdown = (state: ChannelingRegenState): ManaRegenBreakdown => {
  const stats = getEquipmentStats(state)
  const echoes = state.debug?.ignoreEchoLimit ? Math.max(0, state.activities.channeling.echoesAssigned) : clamp(state.activities.channeling.echoesAssigned, 0, BALANCE.channeling.maxEchoes)
  const baseNatural = BALANCE.channeling.baseNaturalRegenPerSecond
  const leylineConduitBonus = pillarLevel(state, 'leyline-conduit')
  const stableLeylineBonus = state.progress.channeling.discoveries['stable-leyline'] ? BALANCE.channeling.stableLeylineRegenBonus : 0
  const equipmentPassiveBonus = stats.manaRegen ?? 0
  const developerBonus = state.debug?.bonusManaRegenFlat ?? 0
  const arcaneCoreDynamicBonus = state.player ? getArcaneCoreDynamicManaRegen(state as never) : 0
  const passiveBeforeResonance = baseNatural + leylineConduitBonus + stableLeylineBonus + equipmentPassiveBonus + developerBonus + arcaneCoreDynamicBonus
  const manaResonanceMultiplier = 1 + pillarLevel(state, 'mana-resonance') * 0.05
  const passiveAfterResonance = passiveBeforeResonance * manaResonanceMultiplier
  const echoBase = echoes * BALANCE.channeling.echoManaPerSecond
  const echoAttunementMultiplier = 1 + pillarLevel(state, 'echo-attunement') * 0.05
  const echoDiscoveryMultiplier = state.progress.channeling.discoveries['echo-resonance'] ? BALANCE.channeling.discoveryEchoMultiplier : 1
  const echoTotal = echoBase * echoAttunementMultiplier * echoDiscoveryMultiplier
  const disruptionMultiplier = state.player && state.combat ? Math.max(0, 1 + getCombatModifiers(state as never, 'player', 'mana-regen-percent')) : 1
  const arcaneCoreManaRegenMultiplier = state.player ? getArcaneCoreDynamicManaRegenMultiplier(state as never) : 1
  const arcaneCoreRegenDisabled = Boolean(state.combat?.arcaneCoreRuntime.manaRegenDisabledUntilMs && state.combat.arcaneCoreRuntime.manaRegenDisabledUntilMs > state.combat.arcaneCoreRuntime.elapsedMs)
  return { baseNatural, leylineConduitBonus, stableLeylineBonus, equipmentPassiveBonus, developerBonus, passiveBeforeResonance, manaResonanceMultiplier, passiveAfterResonance, echoBase, echoAttunementMultiplier, echoDiscoveryMultiplier, echoTotal, total: stabilizeResourceValue((passiveAfterResonance + echoTotal) * disruptionMultiplier * arcaneCoreManaRegenMultiplier * (arcaneCoreRegenDisabled ? 0 : 1)) }
}

export const manaRegenPerSecond = (state: ChannelingRegenState) => getManaRegenBreakdown(state).total

export const getManaPillarDefinition = (id: ManaPillarId) => MANA_PILLARS[id]

export const checkChannelingDiscoveries = (state: GameState): ChannelingDiscoveryId[] => {
  const channeling = state.progress.channeling
  const newlyCompleted: ChannelingDiscoveryId[] = []
  const conditions: Record<ChannelingDiscoveryId, boolean> = {
    'stable-leyline': channeling.totalManaGenerated >= BALANCE.channeling.stableLeylineThreshold,
    'echo-resonance': channeling.fiveEchoSustainMs >= BALANCE.channeling.echoResonanceDurationMs,
    'deep-reservoir': state.player.maxMana >= BALANCE.channeling.deepReservoirThreshold,
  }
  CHANNELING_DISCOVERIES.forEach(({ id }) => {
    if (!channeling.discoveries[id] && conditions[id]) {
      channeling.discoveries[id] = true
      newlyCompleted.push(id)
    }
  })
  return newlyCompleted
}

export const advanceChanneling = (state: GameState, deltaMs: number, manaRateOverride?: number) => {
  const delta = Math.max(0, deltaMs)
  const before = state.player.mana
  const generated = (manaRateOverride ?? manaRegenPerSecond(state)) * delta / 1000
  const maxMana = state.player.maxMana
  const overflow = !state.debug.allowManaOverCap ? Math.max(0, before + generated - maxMana) : 0
  state.player.mana = stabilizeResourceValue(state.debug.allowManaOverCap
    ? Math.max(0, before + generated)
    : clamp(before + generated, 0, maxMana))
  if (overflow > 0 && state.combat.active) {
    const effect = getArcaneCoreSpecialEffects(state.arcaneCore).find((candidate) => candidate.type === 'mana-overflow-to-barrier')
    if (effect?.type === 'mana-overflow-to-barrier') {
      const barrierCap = state.player.maxHealth * effect.maxHealthPercentPerSecondCap * delta / 1000
      const barrierGain = Math.min(barrierCap, overflow * effect.conversion)
      if (barrierGain > 0) gainBarrier(state, barrierGain, { actor: 'player', kind: 'arcane-core', sourceId: 'focus-mana-overflow', tags: ['special', 'barrier'] }, 'player', ['special', 'barrier'], { mode: 'add', durationMs: null })
    }
  }
  const gained = state.player.mana - before
  state.progress.channeling.totalManaGenerated += gained
  if (!state.progress.channeling.discoveries['echo-resonance']) {
    state.progress.channeling.fiveEchoSustainMs = state.activities.channeling.echoesAssigned === BALANCE.channeling.maxEchoes
      ? state.progress.channeling.fiveEchoSustainMs + delta
      : 0
  }
  const discoveries = checkChannelingDiscoveries(state)
  return { gained, discoveries }
}
