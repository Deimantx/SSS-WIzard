import { SIGIL_SET_IDS } from '../../content/sigils/sigilSets'
import { getEligibleSigilTraits, SIGIL_TRAIT_IDS } from '../../content/sigils/sigilTraits'
import { SIGIL_MAIN_STAT_POOLS, SIGIL_STAT_DEFINITIONS } from '../../content/sigils/sigilStats'
import { SIGIL_TIERS, isSigilTier } from '../../content/sigils/sigilTiers'
import { SIGIL_AUTO_SALVAGE_DEFAULTS } from '../../content/sigils/sigilDropConfig'
import { SIGIL_QUALITIES, isSigilQuality, getSigilQualityDefinition } from '../../content/sigils/sigilQualities'
import type { SigilInstance, SigilQuality, SigilSetId, SigilSlot, SigilState, SigilStatId, SigilTier, SigilTraitId } from '../../types'

const slots: readonly SigilSlot[] = [1, 2, 3, 4, 5, 6]
const isRecord = (value: unknown): value is Record<string, any> => typeof value === 'object' && value !== null && !Array.isArray(value)
const clamp01 = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
const safeInteger = (value: unknown, fallback = 0) => typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
const validSlot = (value: unknown): value is SigilSlot => slots.includes(value as SigilSlot)

export const createEmptySigilState = (): SigilState => ({
  nextInstanceSequence: 1,
  storage: {},
  equipped: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
  dust: 0,
  attunedSetId: null,
  highestSourcePowerDefeated: 0,
  lifetimeDrops: 0,
  firstDropPityKills: 0,
  highestRankEver: 0,
  secondaryRollsLifetime: 0,
  traitsUnlockedLifetime: 0,
  discovery: { discoveredSets: {}, discoveredSlotsBySet: {}, bestQualityBySet: {}, bestTierBySet: {}, discoveredTraits: {}, qualitiesFound: {}, tiersFound: {} },
  autoSalvage: { ...SIGIL_AUTO_SALVAGE_DEFAULTS },
})

export const normalizeSigilInstance = (key: string, value: unknown): SigilInstance | null => {
  if (!isRecord(value) || !/^sigil:\d+$/.test(key)) return null
  const setId = SIGIL_SET_IDS.includes(value.setId as SigilSetId) ? value.setId as SigilSetId : null
  const slot = validSlot(value.slot) ? value.slot : null
  const tier = isSigilTier(value.tier) ? value.tier : SIGIL_TIERS[0].tier
  const quality = isSigilQuality(value.quality) ? value.quality : 'common'
  const mainStatId = typeof value.mainStatId === 'string' && slot !== null && SIGIL_STAT_DEFINITIONS[value.mainStatId as SigilStatId] && SIGIL_MAIN_STAT_POOLS[slot].includes(value.mainStatId as SigilStatId) ? value.mainStatId as SigilStatId : null
  if (!setId || !slot || !mainStatId) return null

  const rank = Math.min(getSigilQualityDefinition(quality).maxRank, Math.max(0, safeInteger(value.rank)))
  const secondaries = Array.isArray(value.secondaries)
    ? value.secondaries.flatMap((secondary) => {
      if (!isRecord(secondary) || typeof secondary.statId !== 'string' || !SIGIL_STAT_DEFINITIONS[secondary.statId as SigilStatId] || secondary.statId === mainStatId) return []
      const rolls = Array.isArray(secondary.rolls) ? secondary.rolls.flatMap((roll) => {
        if (!isRecord(roll)) return []
        const rollRank = Math.max(0, Math.min(rank, safeInteger(roll.rank)))
        if (rollRank !== 0 && rollRank % 3 !== 0) return []
        return [{ quality01: clamp01(roll.quality01), rank: rollRank }]
      }) : []
      return [{ statId: secondary.statId as SigilStatId, rolls }]
    }).filter((secondary, index, list) => list.findIndex((candidate) => candidate.statId === secondary.statId) === index).slice(0, 4)
    : []

  const traitLimit = quality === 'legendary' ? rank >= 20 ? 2 : rank >= 15 ? 1 : 0 : quality === 'perfect' && rank >= 15 ? 1 : 0
  const eligibleTraits = new Set(getEligibleSigilTraits(setId))
  const traitIds = Array.isArray(value.traitIds)
    ? value.traitIds.filter((trait): trait is SigilTraitId => SIGIL_TRAIT_IDS.includes(trait as SigilTraitId) && eligibleTraits.has(trait as SigilTraitId)).filter((trait, index, list) => list.indexOf(trait) === index).slice(0, Math.min(getSigilQualityDefinition(quality).traitCount, traitLimit))
    : []
  const rollHistory = Array.isArray(value.rollHistory) ? value.rollHistory.flatMap((entry) => {
    if (!isRecord(entry)) return []
    const historyRank = Math.max(0, Math.min(rank, safeInteger(entry.rank)))
    const kind = entry.kind === 'trait' || entry.kind === 'improve-secondary' ? entry.kind : 'new-secondary'
    const statId = typeof entry.statId === 'string' && SIGIL_STAT_DEFINITIONS[entry.statId as SigilStatId] ? entry.statId as SigilStatId : undefined
    const traitId = typeof entry.traitId === 'string' && SIGIL_TRAIT_IDS.includes(entry.traitId as SigilTraitId) ? entry.traitId as SigilTraitId : undefined
    return [{ rank: historyRank, kind, ...(statId ? { statId } : {}), ...(traitId ? { traitId } : {}), ...(entry.rollQuality01 !== undefined ? { rollQuality01: clamp01(entry.rollQuality01) } : {}) }]
  }) : []

  return { instanceId: key, tier, quality, setId, slot, rank, mainStatId, secondaries, traitIds, rollHistory, locked: value.locked === true }
}

export const reconcileSigilDiscovery = (discoveryInput: unknown, storage: Record<string, SigilInstance>): SigilState['discovery'] => {
  const fresh = createEmptySigilState().discovery
  const source = isRecord(discoveryInput) ? discoveryInput : {}
  const discovery: SigilState['discovery'] = { ...fresh, discoveredSets: {}, discoveredSlotsBySet: {}, bestQualityBySet: {}, bestTierBySet: {}, discoveredTraits: {}, qualitiesFound: {}, tiersFound: {} }
  SIGIL_SET_IDS.forEach((setId) => {
    if (isRecord(source.discoveredSets) && source.discoveredSets[setId] === true) discovery.discoveredSets[setId] = true
    const savedSlots = isRecord(source.discoveredSlotsBySet) && isRecord(source.discoveredSlotsBySet[setId]) ? source.discoveredSlotsBySet[setId] : {}
    const validSlots = Object.fromEntries(slots.filter((slot) => savedSlots[slot] === true).map((slot) => [slot, true]))
    if (Object.keys(validSlots).length) discovery.discoveredSlotsBySet[setId] = validSlots
    const bestQuality = isRecord(source.bestQualityBySet) && isSigilQuality(source.bestQualityBySet[setId]) ? source.bestQualityBySet[setId] as SigilQuality : undefined
    if (bestQuality) discovery.bestQualityBySet[setId] = bestQuality
    const bestTier = isRecord(source.bestTierBySet) && isSigilTier(source.bestTierBySet[setId]) ? source.bestTierBySet[setId] as SigilTier : undefined
    if (bestTier) discovery.bestTierBySet[setId] = bestTier
  })
  SIGIL_TRAIT_IDS.forEach((traitId) => { if (isRecord(source.discoveredTraits) && source.discoveredTraits[traitId] === true) discovery.discoveredTraits[traitId] = true })
  SIGIL_QUALITIES.forEach(({ id }) => { if (isRecord(source.qualitiesFound) && source.qualitiesFound[id] === true) discovery.qualitiesFound[id] = true })
  SIGIL_TIERS.forEach(({ tier }) => { if (isRecord(source.tiersFound) && source.tiersFound[tier] === true) discovery.tiersFound[tier] = true })

  const qualityRank = (quality: SigilQuality) => getSigilQualityDefinition(quality).maxRank
  Object.values(storage).forEach((sigil) => {
    discovery.discoveredSets[sigil.setId] = true
    discovery.discoveredSlotsBySet[sigil.setId] = { ...(discovery.discoveredSlotsBySet[sigil.setId] ?? {}), [sigil.slot]: true }
    discovery.qualitiesFound[sigil.quality] = true
    discovery.tiersFound[sigil.tier] = true
    sigil.traitIds.forEach((traitId) => { discovery.discoveredTraits[traitId] = true })
    const oldQuality = discovery.bestQualityBySet[sigil.setId]
    if (!oldQuality || qualityRank(sigil.quality) > qualityRank(oldQuality)) discovery.bestQualityBySet[sigil.setId] = sigil.quality
    if (!discovery.bestTierBySet[sigil.setId] || sigil.tier > (discovery.bestTierBySet[sigil.setId] ?? 0)) discovery.bestTierBySet[sigil.setId] = sigil.tier
  })
  return discovery
}

export const registerSigilInstanceDiscovery = (state: Pick<SigilState, 'storage' | 'discovery'>, sigil: SigilInstance) => {
  const discovery = state.discovery
  discovery.discoveredSets[sigil.setId] = true
  discovery.discoveredSlotsBySet[sigil.setId] = { ...(discovery.discoveredSlotsBySet[sigil.setId] ?? {}), [sigil.slot]: true }
  discovery.qualitiesFound[sigil.quality] = true
  discovery.tiersFound[sigil.tier] = true
  sigil.traitIds.forEach((traitId) => { discovery.discoveredTraits[traitId] = true })
  const qualityRank = (quality: SigilQuality) => getSigilQualityDefinition(quality).maxRank
  const oldQuality = discovery.bestQualityBySet[sigil.setId]
  if (!oldQuality || qualityRank(sigil.quality) > qualityRank(oldQuality)) discovery.bestQualityBySet[sigil.setId] = sigil.quality
  if (!discovery.bestTierBySet[sigil.setId] || sigil.tier > (discovery.bestTierBySet[sigil.setId] ?? 0)) discovery.bestTierBySet[sigil.setId] = sigil.tier
}

export const normalizeSigilEquipped = (input: unknown, storage: Record<string, SigilInstance>): SigilState['equipped'] => {
  const equipped = createEmptySigilState().equipped
  if (!isRecord(input)) return equipped
  slots.forEach((slot) => {
    const instanceId = input[slot]
    if (typeof instanceId === 'string' && storage[instanceId]?.slot === slot) equipped[slot] = instanceId
  })
  return equipped
}

export const normalizeSigilState = (input: unknown): SigilState => {
  const defaults = createEmptySigilState()
  const source = isRecord(input) ? input : {}
  const storage: Record<string, SigilInstance> = {}
  if (isRecord(source.storage)) Object.entries(source.storage).forEach(([key, value]) => {
    const sigil = normalizeSigilInstance(key, value)
    if (sigil) storage[key] = sigil
  })
  const maxSequence = Object.keys(storage).reduce((max, id) => Math.max(max, Number(/^sigil:(\d+)$/.exec(id)?.[1] ?? 0)), 0)
  const discovery = reconcileSigilDiscovery(source.discovery, storage)
  return {
    ...defaults,
    nextInstanceSequence: Math.max(1, maxSequence + 1, safeInteger(source.nextInstanceSequence, 1)),
    storage,
    equipped: normalizeSigilEquipped(source.equipped, storage),
    dust: Math.max(0, safeInteger(source.dust)),
    attunedSetId: SIGIL_SET_IDS.includes(source.attunedSetId as SigilSetId) ? source.attunedSetId as SigilSetId : null,
    highestSourcePowerDefeated: Math.max(0, typeof source.highestSourcePowerDefeated === 'number' && Number.isFinite(source.highestSourcePowerDefeated) ? source.highestSourcePowerDefeated : 0),
    lifetimeDrops: Math.max(0, safeInteger(source.lifetimeDrops)),
    firstDropPityKills: Math.max(0, Math.min(4, safeInteger(source.firstDropPityKills))),
    highestRankEver: Math.max(0, safeInteger(source.highestRankEver)),
    secondaryRollsLifetime: Math.max(0, safeInteger(source.secondaryRollsLifetime)),
    traitsUnlockedLifetime: Math.max(0, safeInteger(source.traitsUnlockedLifetime)),
    discovery,
    autoSalvage: Object.fromEntries(SIGIL_QUALITIES.map(({ id }) => [id, isRecord(source.autoSalvage) && source.autoSalvage[id] === true])) as Record<SigilQuality, boolean>,
  }
}
