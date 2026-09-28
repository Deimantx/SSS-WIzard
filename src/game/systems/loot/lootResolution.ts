import { ITEMS } from '../../content/items/items'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { GameState, ItemId, MonsterId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'
import { getActiveEncounterWorldTier, resolveWorldTierLootQuantity } from '../world-tier/worldTierRuntime'
import { rollPowerScaledCurrencyReward } from './powerScaledCurrencyRewards'
import { getGuildProgressionBonuses } from '../guild/guildSelectors'
import { resolveEnemyPowerRating } from '../combat/enemyPower'
import { SIGIL_DROP_CHANCE } from '../../content/sigils/sigilDropConfig'
import { generateSigil } from '../sigils/sigilGeneration'
import { salvageSigil } from '../sigils/sigilSalvage'
import { SIGIL_STORAGE_SOFT_CAP } from '../../content/sigils/sigilDropConfig'
import { pushNotification } from '../../engine'

export interface SigilLootResolution { instanceId: string; setId: string; slot: number; tier: number; quality: string; autoSalvaged: boolean; dustGranted: number }

/** Resolves the authored material table into inventory changes and a readable log fragment. */
export function resolveMonsterLoot(state: GameState, enemyId: MonsterId, onDrop?: (itemId: ItemId, quantity: number) => void, rng: () => number = Math.random, onSigilDrop?: (drop: SigilLootResolution) => void): string {
  const drops: string[] = []
  const encounterWorldTier = getActiveEncounterWorldTier(state)
  MONSTERS[enemyId].loot.forEach((drop) => {
    if (rng() > drop.chance) return
    const baseQuantity = Math.floor(drop.min + rng() * (drop.max - drop.min + 1))
    const quantity = resolveWorldTierLootQuantity(baseQuantity, encounterWorldTier)
    grantItem(state, drop.itemId, quantity)
    onDrop?.(drop.itemId, quantity)
    drops.push(`${quantity} ${ITEMS[drop.itemId].name}`)
  })
  const guildBonuses = getGuildProgressionBonuses(state)
  const isBoss = isBossMonster(MONSTERS[enemyId])
  const lifeEssenceQuantity = Math.max(1, Math.round(rollPowerScaledCurrencyReward(enemyId, 'life-essence', encounterWorldTier, rng) * guildBonuses.lifeEssenceMultiplier * (isBoss ? guildBonuses.bossEssenceMultiplier : 1)))
  grantItem(state, 'life-essence', lifeEssenceQuantity)
  onDrop?.('life-essence', lifeEssenceQuantity)
  drops.push(`${lifeEssenceQuantity} ${ITEMS['life-essence'].name}`)
  const artifactEssenceQuantity = Math.max(1, Math.round(rollPowerScaledCurrencyReward(enemyId, 'artifact-essence', encounterWorldTier, rng) * guildBonuses.artifactEssenceMultiplier * (isBoss ? guildBonuses.bossEssenceMultiplier : 1)))
  grantItem(state, 'artifact-essence', artifactEssenceQuantity)
  onDrop?.('artifact-essence', artifactEssenceQuantity)
  drops.push(`${artifactEssenceQuantity} ${ITEMS['artifact-essence'].name}`)
  const encounterPower = resolveEnemyPowerRating(enemyId, encounterWorldTier)
  state.sigils.highestSourcePowerDefeated = Math.max(state.sigils.highestSourcePowerDefeated, encounterPower)
  if (isBoss && encounterWorldTier >= 2) state.sigils.hasDefeatedWorldTier2Boss = true
  // The first drop uses the authored chance on kills 1–4 and is guaranteed on
  // the fifth eligible kill. The counter is only for the pre-first-drop path;
  // normal post-onboarding drops never inherit this pity state.
  const firstDropPending = state.sigils.lifetimeDrops === 0
  const pityGuarantee = firstDropPending && state.sigils.firstDropPityKills >= 4
  const naturalDrop = rng() < (isBoss ? SIGIL_DROP_CHANCE.boss : SIGIL_DROP_CHANCE.normal)
  if (pityGuarantee || naturalDrop) {
    const sigil = generateSigil({ state, dungeonId: state.combat.dungeonId ?? 'whispering-woods', enemyId, enemyPower: encounterPower, isBoss, rng })
    drops.push(`T${sigil.tier} ${sigil.quality[0].toUpperCase()}${sigil.quality.slice(1)} ${sigil.setId} Sigil ${['I', 'II', 'III', 'IV', 'V', 'VI'][sigil.slot - 1]}`)
    const autoSalvage = state.sigils.autoSalvage[sigil.quality]
    const atSoftCap = Object.keys(state.sigils.storage).length > SIGIL_STORAGE_SOFT_CAP && (sigil.quality === 'common' || sigil.quality === 'refined')
    const dustBefore = state.sigils.dust
    const autoSalvaged = autoSalvage || atSoftCap
    if (autoSalvage || atSoftCap) {
      salvageSigil(state, sigil.instanceId)
      if (atSoftCap && !autoSalvage) pushNotification(state, 'Sigil Storage is full; the incoming low-quality Sigil was salvaged.', 'warning', { key: 'sigil-storage-cap', cooldownMs: 60_000 })
    }
    onSigilDrop?.({ instanceId: sigil.instanceId, setId: sigil.setId, slot: sigil.slot, tier: sigil.tier, quality: sigil.quality, autoSalvaged, dustGranted: Math.max(0, state.sigils.dust - dustBefore) })
  } else if (firstDropPending) {
    state.sigils.firstDropPityKills = Math.min(4, state.sigils.firstDropPityKills + 1)
  }
  return drops.join(', ')
}
