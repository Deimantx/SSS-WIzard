import { Status } from '../../components/ui'
import { GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import type { MonsterDefinition } from '../../game/content/monsters'
import { formatDropChance, formatDropQuantity } from '../../game/systems/bestiary/bestiarySelectors'
import { resolvePowerScaledCurrencyRewardRange } from '../../game/systems/loot/powerScaledCurrencyRewards'
import type { GameState, WorldTierId } from '../../game/types'

export function BestiaryLootTable({ monster, progress, worldTier }: { monster: MonsterDefinition; progress: GameState['progress']; worldTier: WorldTierId }) {
  const lifeEssence = resolvePowerScaledCurrencyRewardRange(monster.id, 'life-essence', worldTier)
  const artifactEssence = resolvePowerScaledCurrencyRewardRange(monster.id, 'artifact-essence', worldTier)
  const lifeEssenceItem = ITEMS['life-essence']
  const artifactEssenceItem = ITEMS['artifact-essence']
  const renderStatus = (itemId: keyof typeof ITEMS) => {
    const collected = progress.discoveredItems.includes(itemId)
    return <Status tone={collected ? 'success' : 'locked'}>{collected ? 'COLLECTED' : 'NOT COLLECTED'}</Status>
  }

  return <section className="bestiary-section">
    <span className="bestiary-section-label">GUARANTEED REWARDS · WT{worldTier}</span>
    <div className="bestiary-loot-list">
      <div className="bestiary-loot-row" key="life-essence">
        <GameTooltip content={<TooltipContent title={lifeEssenceItem.name} description={`${lifeEssenceItem.description} Guaranteed on every defeat. WT1 Enemy Power ${lifeEssence.wt1Power}; base range ${formatDropQuantity(lifeEssence.baseMin, lifeEssence.baseMax)}${lifeEssence.bossMultiplier > 1 ? ` · Boss target ×${lifeEssence.bossMultiplier}` : ''}. Current WT${lifeEssence.worldTier} range: ${formatDropQuantity(lifeEssence.finalMin, lifeEssence.finalMax)}.`} />}><ItemIcon itemId="life-essence" size="tiny" /></GameTooltip>
        <div><strong>{lifeEssenceItem.name}</strong><small>{formatDropQuantity(lifeEssence.finalMin, lifeEssence.finalMax)} · GUARANTEED</small></div>
        {renderStatus('life-essence')}
      </div>
      <div className="bestiary-loot-row" key="artifact-essence">
        <GameTooltip content={<TooltipContent title={artifactEssenceItem.name} description={`${artifactEssenceItem.description} Guaranteed on every defeat. WT1 Enemy Power ${artifactEssence.wt1Power}; base range ${formatDropQuantity(artifactEssence.baseMin, artifactEssence.baseMax)}${artifactEssence.bossMultiplier > 1 ? ` · Boss target ×${artifactEssence.bossMultiplier}` : ''}. Current WT${artifactEssence.worldTier} range: ${formatDropQuantity(artifactEssence.finalMin, artifactEssence.finalMax)}.`} />}><ItemIcon itemId="artifact-essence" size="tiny" /></GameTooltip>
        <div><strong>{artifactEssenceItem.name}</strong><small>{formatDropQuantity(artifactEssence.finalMin, artifactEssence.finalMax)} · GUARANTEED</small></div>
        {renderStatus('artifact-essence')}
      </div>
    </div>
    <span className="bestiary-section-label">LOOT TABLE</span>
    <div className="bestiary-loot-list">
      {monster.loot.map((drop) => {
        const item = ITEMS[drop.itemId]
        return <div className="bestiary-loot-row" key={drop.itemId}>
          <GameTooltip content={<TooltipContent title={item.name} description={item.description} />}><ItemIcon itemId={drop.itemId} size="tiny" /></GameTooltip>
          <div><strong>{item.name}</strong><small>{formatDropQuantity(drop.min, drop.max)} · {formatDropChance(drop.chance)}</small></div>
          {renderStatus(drop.itemId)}
        </div>
      })}
    </div>
  </section>
}
