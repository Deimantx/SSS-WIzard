import { ITEMS } from '../../content/items/items'
import { UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS, UNIVERSAL_LOOT_CURRENCY_VARIANCE } from '../../content/loot/universalLootTiers'
import { isBossMonster, MONSTERS } from '../../content/monsters'
import type { GameState, ItemId, MonsterId } from '../../types'
import { grantItem } from '../inventory/itemAcquisition'
import { getGuildProgressionBonuses } from '../guild/guildSelectors'
import { generateSigil } from '../sigils/sigilGeneration'
import { salvageSigil } from '../sigils/sigilSalvage'
import { SIGIL_STORAGE_SOFT_CAP } from '../../content/sigils/sigilDropConfig'
import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS } from '../../content/loot/universalLootTiers'
import { resolveSigilTierFromEnemyPower } from '../../content/sigils/sigilTiers'
import { pushNotification } from '../../engine'
import { resolveAuthoredLootDrop, resolveCombatLootContext, resolveLootQuantity, resolveRareLootInstanceQuantity, resolveSigilDropQualityWeights, type CombatLootContext } from './universalLootRuntime'

export interface SigilLootResolution { instanceId: string; setId: string; slot: number; tier: number; quality: string; autoSalvaged: boolean; dustGranted: number }
export interface HunterLootMultipliers { itemDropMultiplier?: number; essenceMultiplier?: number; sigilDropMultiplier?: number }

const boundedRandom = (rng: () => number) => {
  const raw = rng()
  return Number.isFinite(raw) ? Math.min(1 - Number.EPSILON, Math.max(0, raw)) : 0
}

/** The shared combat reward resolver for authored monster materials, essences, and Sigils. */
export function resolveMonsterLoot(state: GameState, enemyId: MonsterId, onDrop?: (itemId: ItemId, quantity: number) => void, rng: () => number = Math.random, onSigilDrop?: (drop: SigilLootResolution) => void, hunterBonuses: HunterLootMultipliers = {}, lootContext?: CombatLootContext): string {
  const drops: string[] = []
  const context = lootContext ?? resolveCombatLootContext(enemyId, state.combat.locationId)
  const guild = context.guildBonuses ?? getGuildProgressionBonuses(state)
  const hunter = context.hunterBonuses ?? hunterBonuses
  const monster = MONSTERS[enemyId]
  const grant = (itemId: ItemId, quantity: number) => {
    if (quantity < 1) return
    grantItem(state, itemId, quantity)
    onDrop?.(itemId, quantity)
    drops.push(`${quantity} ${ITEMS[itemId].name}`)
  }

  monster.loot.forEach((drop) => {
    const quantity = resolveAuthoredLootDrop(drop, context, rng, Math.max(1, hunter.itemDropMultiplier ?? 1))
    if (quantity !== null) grant(drop.itemId, quantity)
  })

  for (const itemId of ['life-essence', 'artifact-essence'] as const) {
    const variance = UNIVERSAL_LOOT_CURRENCY_VARIANCE.min + boundedRandom(rng) * (UNIVERSAL_LOOT_CURRENCY_VARIANCE.max - UNIVERSAL_LOOT_CURRENCY_VARIANCE.min)
    const guildMultiplier = itemId === 'life-essence' ? guild.lifeEssenceMultiplier : guild.artifactEssenceMultiplier
    const bossEssenceMultiplier = context.isBoss ? guild.bossEssenceMultiplier : 1
    const hunterMultiplier = Math.max(1, hunter.essenceMultiplier ?? 1)
    const externalMultiplier = guildMultiplier * bossEssenceMultiplier * hunterMultiplier
    grant(itemId, resolveLootQuantity(UNIVERSAL_LOOT_CURRENCY_BASE_TARGETS[itemId] * variance, context, externalMultiplier))
  }

  const encounterPower = context.effectivePower
  state.sigils.highestSourcePowerDefeated = Math.max(state.sigils.highestSourcePowerDefeated, encounterPower)
  const firstDropPending = state.sigils.lifetimeDrops === 0
  const pityGuarantee = firstDropPending && state.sigils.firstDropPityKills >= 4
  const sigilChance = Math.min(1, context.lootTier.sigilDropChance * (context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1) * Math.max(1, hunter.sigilDropMultiplier ?? 1))
  const naturalDrop = boundedRandom(rng) < sigilChance
  if (pityGuarantee || naturalDrop) {
    // Onboarding pity deliberately guarantees one item, even on a boss kill.
    const count = pityGuarantee ? 1 : resolveRareLootInstanceQuantity(context)
    for (let index = 0; index < count; index += 1) {
      const sigil = generateSigil({ state, locationId: state.combat.locationId ?? 'whispering-woods', enemyId, enemyPower: encounterPower, isBoss: context.isBoss, qualityWeights: resolveSigilDropQualityWeights(context, resolveSigilTierFromEnemyPower(encounterPower)), rng })
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
    }
  } else if (firstDropPending) {
    state.sigils.firstDropPityKills = Math.min(4, state.sigils.firstDropPityKills + 1)
  }
  return drops.join(', ')
}
