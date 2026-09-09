import { useState, type CSSProperties, type ReactNode } from 'react'
import { Card } from '../../../components/ui'
import { GameTooltip, TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { ItemIcon } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import type { PortalShardId } from '../../../game/content/darkPortal/portalShards'
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
  const [selectedShardId, setSelectedShardId] = useState<PortalShardId | null>(() => shards.find((shard) => shard.owned)?.id ?? shards[0]?.id ?? null)
  const selectedShard = shards.find((shard) => shard.id === selectedShardId) ?? shards.find((shard) => shard.owned) ?? shards[0]

  return <TowerFrame eyebrow="DARK PORTAL" title="THE SHATTERED GATE" description="Major bosses leave behind unique portal shards. Recover them to restore the Dark Portal and reveal what lies beyond." className="dark-portal-screen">
    <div className="dark-portal-field">
      <div className="dark-portal-shard-rail dark-portal-shard-rail-top">{topShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} selected={shard.id === selectedShard?.id} onSelect={() => setSelectedShardId(shard.id)} />)}</div>
      <div className="dark-portal-shard-column dark-portal-shard-column-left">{leftShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} selected={shard.id === selectedShard?.id} onSelect={() => setSelectedShardId(shard.id)} />)}</div>
      <PortalCore ownedCount={ownedCount} totalSlots={totalSlots} progress={percent} />
      <div className="dark-portal-shard-column dark-portal-shard-column-right">{rightShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} selected={shard.id === selectedShard?.id} onSelect={() => setSelectedShardId(shard.id)} />)}</div>
      <div className="dark-portal-shard-rail dark-portal-shard-rail-bottom">{bottomShards.map((shard) => <PortalShardSlot key={shard.id} shard={shard} selected={shard.id === selectedShard?.id} onSelect={() => setSelectedShardId(shard.id)} />)}</div>
    </div>
    <Card className="dark-portal-details">
      <aside className="dark-portal-details-sidebar">
        <section className="dark-portal-restoration-summary">
          <span className="dark-portal-section-kicker">RESTORATION STATE</span>
          <strong>{ownedCount} / {totalSlots}</strong>
          <small>SHARDS RECOVERED</small>
        </section>
        <section className="dark-portal-progression-summary">
          <span className="dark-portal-section-kicker">SHARD PROGRESSION</span>
          <h2>Each recovered shard restores another fragment of the gate.</h2>
          <p>Major bosses can reveal unique portal shards. Recovered shards can open new rooms, systems, dungeons, and future paths through the Wizard Tower.</p>
        </section>
      </aside>
      <section className="dark-portal-shard-inspector" aria-live="polite">
        <SelectedPortalShardInfo shard={selectedShard} ownedCount={ownedCount} totalSlots={totalSlots} />
      </section>
    </Card>
  </TowerFrame>
}

function SelectedPortalShardInfo({ shard, ownedCount, totalSlots }: { shard: PortalShardViewModel | undefined; ownedCount: number; totalSlots: number }) {
  if (!shard) return <div className="dark-portal-shard-inspector-empty"><span className="dark-portal-section-kicker">SELECTED SHARD INFORMATION</span><p>Select a portal shard to inspect its status.</p></div>
  const item = shard.itemId ? ITEMS[shard.itemId] : undefined
  const title = shard.owned && item ? item.name : shard.displayName
  const status = shard.owned ? shard.statusLabel ?? 'Recovered' : shard.statusLabel ?? 'Not Recovered'
  const effect = shard.owned ? shard.unlockText ?? 'No recorded portal effect.' : 'Unknown.'
  const restoration = shard.owned ? `${ownedCount} / ${totalSlots} fragments recovered` : 'This fragment has not yet been recovered.'
  const progression = shard.owned ? 'This shard is permanently bound to the Dark Portal.' : 'This fragment of the Dark Portal has not yet been recovered.'
  return <div className={`dark-portal-selected-shard${shard.owned ? ' is-owned' : ' is-missing'}`} style={{ '--portal-shard-color': item?.color ?? '#7760a8' } as CSSProperties}>
    <div className="dark-portal-selected-shard-header">
      <div className="dark-portal-selected-shard-icon">{item ? <ItemIcon itemId={item.id} size="large" /> : <span>{shard.shortLabel.replace('Shard ', '')}</span>}</div>
      <div className="dark-portal-selected-shard-heading"><span>{shard.shortLabel} · {status.toUpperCase()}</span><h2>{title}</h2></div>
    </div>
    <div className="dark-portal-shard-inspector-grid">
      <PortalShardDetailBlock label="SOURCE"><p>{shard.sourceText}</p></PortalShardDetailBlock>
      <PortalShardDetailBlock label="PORTAL EFFECT"><p>{effect}</p></PortalShardDetailBlock>
      <PortalShardDetailBlock label="PORTAL RESTORATION" className="is-wide"><strong>{restoration}</strong><p>{progression}</p></PortalShardDetailBlock>
    </div>
  </div>
}

function PortalShardDetailBlock({ label, className = '', children }: { label: string; className?: string; children: ReactNode }) {
  return <div className={`dark-portal-shard-detail-block ${className}`}><span>{label}</span>{children}</div>
}

function PortalCore({ ownedCount, totalSlots, progress }: { ownedCount: number; totalSlots: number; progress: number }) {
  return <section className="dark-portal-core-panel" aria-label="Dark Portal restoration progress">
    <div className="dark-portal-core-kicker"><span>PORTAL CORE</span><strong>{ownedCount > 0 ? 'AWAKENED' : 'DORMANT'}</strong></div>
    <div className={`dark-portal-visual${ownedCount > 0 ? ' is-awakened' : ''}`} style={{ '--portal-charge': Math.max(0, Math.min(1, ownedCount / Math.max(1, totalSlots))) } as CSSProperties} aria-hidden="true">
      <span className="dark-portal-energy-field" />
      <span className="dark-portal-frame dark-portal-frame-outer" />
      <span className="dark-portal-frame dark-portal-frame-mid" />
      <span className="dark-portal-frame dark-portal-frame-inner" />
      <span className="dark-portal-rune-track">
        <i>✦</i><i>·</i><i>◆</i><i>·</i><i>✧</i><i>·</i><i>◆</i><i>·</i>
      </span>
      <span className="dark-portal-rift"><span className="dark-portal-rift-depth" /><span className="dark-portal-rift-vortex" /><span className="dark-portal-rift-core" /></span>
      <span className="dark-portal-arc dark-portal-arc-a" />
      <span className="dark-portal-arc dark-portal-arc-b" />
      <span className="dark-portal-arc dark-portal-arc-c" />
      <span className="dark-portal-particle dark-portal-particle-a" />
      <span className="dark-portal-particle dark-portal-particle-b" />
      <span className="dark-portal-particle dark-portal-particle-c" />
      <span className="dark-portal-particle dark-portal-particle-d" />
      <span className="dark-portal-core-glyph">◈</span>
    </div>
    <div className="dark-portal-restoration"><span>PORTAL RESTORATION</span><strong>{ownedCount} / {totalSlots} SHARDS RECOVERED</strong><div className="dark-portal-progress" role="progressbar" aria-valuemin={0} aria-valuemax={totalSlots} aria-valuenow={ownedCount} aria-label={`${ownedCount} of ${totalSlots} portal shards recovered`}><i style={{ width: `${progress}%` }} /></div><small>The chamber responds to every recovered shard.</small></div>
  </section>
}

function PortalShardSlot({ shard, selected, onSelect }: { shard: PortalShardViewModel; selected: boolean; onSelect: () => void }) {
  const item = shard.itemId ? ITEMS[shard.itemId] : undefined
  const title = shard.owned && item ? item.name : shard.displayName
  const tooltip = <TooltipContent title={title} description={shard.owned ? `${shard.statusLabel ?? 'Recovered'} · ${shard.sourceText}.` : `${shard.statusLabel ?? 'Not Recovered'} · Source: ${shard.sourceText}.`}>
    <div className="tooltip-section"><small>{shard.owned ? 'PORTAL MEANING' : 'PORTAL STATUS'}</small><p>{shard.owned ? shard.unlockText : shard.unlockText ?? 'A missing fragment of the Dark Portal.'}</p></div>
  </TooltipContent>
  return <GameTooltip block wide accent={shard.owned ? 'success' : 'neutral'} content={tooltip}>
    <div className={`dark-portal-shard-slot${shard.owned ? ' is-owned' : ' is-missing'}${selected ? ' is-selected' : ''}`} role="button" tabIndex={0} aria-pressed={selected} aria-label={`${title}, ${shard.owned ? 'Recovered' : 'Not Recovered'}`} onClick={onSelect} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect() } }}>
      <div className="dark-portal-shard-icon">{shard.owned && shard.itemId ? <ItemIcon itemId={shard.itemId} size="tiny" /> : <span>{shard.shortLabel.replace('Shard ', '')}</span>}</div>
      <div className="dark-portal-shard-copy"><span>{shard.shortLabel}</span><strong>{shard.owned && item ? item.name : shard.displayName}</strong><small>{shard.owned ? shard.statusLabel : 'DORMANT SOCKET'}</small></div>
      {shard.owned && <i className="dark-portal-shard-signal" aria-hidden="true" />}
    </div>
  </GameTooltip>
}
