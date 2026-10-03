import { Status } from '../../components/ui'
import { GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { MonsterDefinition } from '../../game/content/monsters'
import { formatDropChance, formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
import { resolveCombatCurrencyRewardRange } from '../../game/systems/loot/combatCurrencyRewards'
import { resolveAuthoredLootDropChance, resolveAuthoredLootDropQuantity, resolveCombatLootContext } from '../../game/systems/loot/universalLootRuntime'
import { getLootUnlockTier, isLootUnlockedAtTier, UNIVERSAL_LOOT_BOSS_MULTIPLIERS } from '../../game/content/loot/universalLootTiers'
import type { GameState, WorldTierId } from '../../game/types'

export function BestiaryLootTable({ monster, progress, worldTier }: { monster: MonsterDefinition; progress: GameState['progress']; worldTier: WorldTierId }) {
  const context = resolveCombatLootContext(monster.id, worldTier)
  const lifeEssence = resolveCombatCurrencyRewardRange(monster.id, 'life-essence', worldTier)
  const artifactEssence = resolveCombatCurrencyRewardRange(monster.id, 'artifact-essence', worldTier)
  const crystalSystemUnlocked = (progress.bossKillsByBoss['meridian-splitter'] ?? 0) >= 1
  const crystalLootTierUnlocked = isLootUnlockedAtTier('crystal-cache-t1', context.lootTier)
  const crystalCacheEligible = crystalSystemUnlocked && crystalLootTierUnlocked
  const crystalCacheUnlockTier = getLootUnlockTier('crystal-cache-t1')
  const crystalCacheChance = crystalCacheEligible ? Math.min(1, context.lootTier.crystalCacheDropChance * (context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1)) : 0
  const crystalCacheQuantity = context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1
  const renderStatus = (itemId: keyof typeof ITEMS) => {
    const collected = progress.discoveredItems.includes(itemId)
    return <Status tone={collected ? 'success' : 'locked'}>{collected ? 'COLLECTED' : 'NOT COLLECTED'}</Status>
  }
  const currencyRow = (itemId: 'life-essence' | 'artifact-essence', range: typeof lifeEssence) => {
    const item = ITEMS[itemId]
    return <div className="bestiary-loot-row" key={itemId}>
      <GameTooltip content={<TooltipContent title={item.name} description={`${item.description} Guaranteed on defeat. Encounter Power ${range.effectivePower.toLocaleString()} resolves to Loot Tier ${range.lootTier}, with a ${range.tierQuantityMultiplier.toFixed(2)}× quantity multiplier${range.bossQuantityMultiplier > 1 ? ` and ${range.bossQuantityMultiplier}× boss quantity` : ''}.`} />}><ItemIcon itemId={itemId} size="tiny" /></GameTooltip>
      <div><strong>{item.name}</strong><small>{formatDropQuantity(range.finalMin, range.finalMax)} · GUARANTEED</small></div>
      {renderStatus(itemId)}
    </div>
  }

  return <section className="bestiary-section">
    <span className="bestiary-section-label">POWER {context.effectivePower.toLocaleString()} · LOOT TIER {context.lootTier.tier} · WT{worldTier}</span>
    <span className="bestiary-section-label">GUARANTEED REWARDS</span>
    <div className="bestiary-loot-list">{currencyRow('life-essence', lifeEssence)}{currencyRow('artifact-essence', artifactEssence)}</div>
    <span className="bestiary-section-label">MONSTER DROPS</span>
    <div className="bestiary-loot-list">
      {monster.loot.map((drop) => {
        const item = ITEMS[drop.itemId]
        const min = resolveAuthoredLootDropQuantity(drop, drop.quantity.min, context)
        const max = resolveAuthoredLootDropQuantity(drop, drop.quantity.max, context)
        const chance = resolveAuthoredLootDropChance(drop, context)
        return <div className="bestiary-loot-row" key={drop.itemId}>
          <GameTooltip content={<TooltipContent title={item.name} description={`${item.description} Projected from this Monster's authored drop using Loot Tier ${context.lootTier.tier} and ${context.isBoss ? 'boss' : 'normal'} scaling.`} />}><ItemIcon itemId={drop.itemId} size="tiny" /></GameTooltip>
          <div><strong>{item.name}</strong><small>{formatDropQuantity(min, max)} · {formatDropChance(chance)}</small></div>
          {renderStatus(drop.itemId)}
        </div>
      })}
    </div>
    {crystalLootTierUnlocked && <><span className="bestiary-section-label">SPECIAL DROP</span><div className="bestiary-loot-list"><div className="bestiary-loot-row" key="tier-1-crystal-cache"><GameTooltip content={<TooltipContent title={ITEMS['tier-1-crystal-cache'].name} description={crystalCacheEligible ? `Unlocked at Loot Tier ${crystalCacheUnlockTier}. Current tier chance ${formatDropChance(crystalCacheChance)}; ${crystalCacheQuantity} cache${crystalCacheQuantity === 1 ? '' : 's'} on success.` : 'Locked. Defeat Meridian Splitter to unlock the Crystal System.'} />}><ItemIcon itemId="tier-1-crystal-cache" size="tiny" /></GameTooltip><div><strong>{ITEMS['tier-1-crystal-cache'].name}</strong><small>{crystalCacheEligible ? `${formatDropChance(crystalCacheChance)} · ${crystalCacheQuantity} on success` : 'LOCKED — Defeat Meridian Splitter'}</small></div>{crystalCacheEligible ? renderStatus('tier-1-crystal-cache') : <Status tone="locked">LOCKED</Status>}</div></div></>}
  </section>
}
