import { Card } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { PortalShardViewModel } from '../../../game/systems/dark-portal/portalShardSelectors'
import { getOwnedPortalShardCount, getPortalShardSlotCount, getPortalShardViewModels } from '../../../game/systems/dark-portal/portalShardSelectors'
import { useGameStore } from '../../../store/gameStore'
import { TowerFrame } from '../TowerFrame'

export function DarkPortalScreen() {
  const inventory = useGameStore((state) => state.inventory)
  const shards = getPortalShardViewModels({ inventory })
  const ownedCount = getOwnedPortalShardCount({ inventory })
  const totalSlots = getPortalShardSlotCount()
  const percent = ownedCount / Math.max(1, totalSlots) * 100
  const topShards = shards.slice(0, 3)
  const leftShards = shards.slice(3, 7)
  const rightShards = shards.slice(7, 11)
  const bottomShards = shards.slice(11)

  return <TowerFrame eyebrow="DARK PORTAL" title="THE SHATTERED GATE" description="Major bosses leave behind unique portal shards. Recover them to restore the Dark Portal and reveal what lies beyond." className="dark-portal-screen">
    <div className="dark-portal-field">
      <div className="dark-portal-shard-rail dark-portal-shard-rail-top">{topShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} />)}</div>
      <div className="dark-portal-shard-column dark-portal-shard-column-left">{leftShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} />)}</div>
      <PortalCore ownedCount={ownedCount} totalSlots={totalSlots} progress={percent} />
      <div className="dark-portal-shard-column dark-portal-shard-column-right">{rightShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} />)}</div>
      <div className="dark-portal-shard-rail dark-portal-shard-rail-bottom">{bottomShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} />)}</div>
    </div>
    <Card className="dark-portal-lore">
      <div><span className="dark-portal-section-kicker">SHARD PROGRESSION</span><h2>The gate remembers what the tower has endured.</h2></div>
      <p>Each recovered portal shard restores another fragment of the Dark Portal. Major bosses can reveal new rooms, systems, and future paths.</p>
      <div className="dark-portal-lore-status"><span>RESTORATION STATE</span><strong>{ownedCount} / {totalSlots} recovered</strong><small>Further progression is not yet available.</small></div>
    </Card>
  </TowerFrame>
}

function PortalCore({ ownedCount, totalSlots, progress }: { ownedCount: number; totalSlots: number; progress: number }) {
  return <section className="dark-portal-core-panel" aria-label="Dark Portal restoration progress">
    <div className="dark-portal-core-kicker"><span>PORTAL CORE</span><strong>{ownedCount > 0 ? 'AWAKENED' : 'DORMANT'}</strong></div>
    <div className={`dark-portal-visual${ownedCount > 0 ? ' is-awakened' : ''}`} aria-hidden="true">
      <span className="dark-portal-halo dark-portal-halo-outer" />
      <span className="dark-portal-halo dark-portal-halo-mid" />
      <span className="dark-portal-halo dark-portal-halo-inner" />
      <span className="dark-portal-rune dark-portal-rune-top">✦</span>
      <span className="dark-portal-rune dark-portal-rune-right">·</span>
      <span className="dark-portal-rune dark-portal-rune-bottom">✧</span>
      <span className="dark-portal-rune dark-portal-rune-left">·</span>
      <span className="dark-portal-core-glyph">◈</span>
    </div>
    <div className="dark-portal-restoration"><span>PORTAL RESTORATION</span><strong>{ownedCount} / {totalSlots} SHARDS RECOVERED</strong><div className="dark-portal-progress" role="progressbar" aria-valuemin={0} aria-valuemax={totalSlots} aria-valuenow={ownedCount} aria-label={`${ownedCount} of ${totalSlots} portal shards recovered`}><i style={{ width: `${progress}%` }} /></div><small>The chamber responds to every recovered shard.</small></div>
  </section>
}

function PortalShardSlot({ shard }: { shard: PortalShardViewModel }) {
  const item = shard.itemId ? ITEMS[shard.itemId] : undefined
  const title = shard.owned && item ? item.name : shard.displayName
  const tooltip = <TooltipContent title={title} description={shard.owned ? `${shard.statusLabel ?? 'Recovered'} · ${shard.sourceText}.` : `${shard.statusLabel ?? 'Not Recovered'} · Source: ${shard.sourceText}.`}>
    <div className="tooltip-section"><small>{shard.owned ? 'PORTAL MEANING' : 'PORTAL STATUS'}</small><p>{shard.owned ? shard.unlockText : shard.unlockText ?? 'A missing fragment of the Dark Portal.'}</p></div>
  </TooltipContent>
  return <GameTooltip block wide accent={shard.owned ? 'success' : 'neutral'} content={tooltip}>
    <div className={`dark-portal-shard-slot${shard.owned ? ' is-owned' : ' is-missing'}`} tabIndex={0} aria-label={`${title}, ${shard.owned ? 'Recovered' : 'Not Recovered'}`}>
      <div className="dark-portal-shard-icon">{shard.owned && shard.itemId ? <ItemIcon itemId={shard.itemId} size="tiny" /> : <span>{shard.shortLabel.replace('Shard ', '')}</span>}</div>
      <div className="dark-portal-shard-copy"><span>{shard.shortLabel}</span><strong>{shard.owned && item ? item.name : shard.displayName}</strong><small>{shard.owned ? shard.statusLabel : 'DORMANT SOCKET'}</small></div>
      {shard.owned && <i className="dark-portal-shard-signal" aria-hidden="true" />}
    </div>
  </GameTooltip>
}
