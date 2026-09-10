import { Crown, Package, X } from 'lucide-react'
import { Button, ModalPortal, Status } from '../../../components/ui'
import { ItemIcon, ItemTooltip } from '../../../components/ui/item'
import { ITEMS } from '../../../game/content/items/items'
import { MONSTERS } from '../../../game/content/monsters'
import { formatDropChance, formatDropQuantity } from '../../../game/systems/bestiary/bestiarySelectors'
import { useGameStore } from '../../../store/gameStore'
import type { ItemId } from '../../../game/types'
import type { CombatActNodeViewModel } from './combatActNavigationTypes'

export function CombatAreaLootModal({ node, onClose }: { node: CombatActNodeViewModel; onClose: () => void }) {
  const progress = useGameStore((state) => state.progress)
  const inventory = useGameStore((state) => state.inventory)
  const real = node.dungeonId !== null
  return <ModalPortal open onClose={onClose} backdropClassName="combat-area-loot-backdrop" surfaceClassName="combat-area-loot-modal" ariaLabelledBy="combat-area-loot-title"><header className="combat-area-loot-head"><div><span className="combat-subsection-label">AREA LOOT</span><h2 id="combat-area-loot-title">{node.name.toUpperCase()}</h2><p>{real ? 'Canonical encounter rewards revealed through Bestiary discovery.' : 'A presentation-only progression prototype.'}</p></div><Button icon variant="ghost" ariaLabel="Close loot" onClick={onClose}><X size={16} aria-hidden="true" /></Button></header>{real ? <div className="combat-area-loot-body"><div className="combat-area-loot-eyebrow"><Package size={14} aria-hidden="true" /> NORMAL ENCOUNTERS</div><div className="combat-area-loot-sources">{node.encounters.map((encounter) => <LootSource key={encounter.id} encounter={encounter} progress={progress} inventory={inventory} />)}</div><div className="combat-area-loot-eyebrow is-boss"><Crown size={14} aria-hidden="true" /> BOSS</div>{node.boss && <LootSource encounter={node.boss} progress={progress} inventory={inventory} />}</div> : <div className="combat-area-loot-empty"><span className="combat-area-loot-empty-glyph">✦</span><strong>PROTOTYPE AREA</strong><p>Loot table has not been authored yet.</p></div>}</ModalPortal>
}

function LootSource({ encounter, progress, inventory }: { encounter: CombatActNodeViewModel['encounters'][number] | NonNullable<CombatActNodeViewModel['boss']>; progress: ReturnType<typeof useGameStore.getState>['progress']; inventory: ReturnType<typeof useGameStore.getState>['inventory'] }) {
  const monster = encounter.monsterId ? MONSTERS[encounter.monsterId] : null
  if (!monster || !encounter.known) return <section className={`combat-area-loot-source is-unknown${encounter.role === 'boss' ? ' is-boss' : ''}`}><div className="combat-area-loot-source-head"><span className="combat-area-loot-source-glyph">?</span><div><strong>{encounter.role === 'boss' ? 'UNKNOWN BOSS' : 'UNKNOWN CREATURE'}</strong><small>Loot information undiscovered</small></div><Status tone="locked">HIDDEN</Status></div></section>
  return <section className={`combat-area-loot-source${encounter.role === 'boss' ? ' is-boss' : ''}`}><div className="combat-area-loot-source-head"><span className="combat-area-loot-source-glyph">{encounter.role === 'boss' ? '♛' : '◇'}</span><div><strong>{monster.name}</strong><small>{encounter.role === 'boss' ? 'BOSS LOOT' : 'NORMAL ENCOUNTER'}</small></div><Status tone="success">DISCOVERED</Status></div><div className="combat-area-loot-drop-grid">{monster.loot.map((drop) => <LootDropTile key={drop.itemId} drop={drop} sourceName={monster.name} inventory={inventory} />)}</div></section>
}

function LootDropTile({ drop, sourceName, inventory }: { drop: { itemId: ItemId; min: number; max: number; chance: number }; sourceName: string; inventory: ReturnType<typeof useGameStore.getState>['inventory'] }) {
  const item = ITEMS[drop.itemId]
  const chance = formatDropChance(drop.chance)
  const quantity = formatDropQuantity(drop.min, drop.max)
  return <ItemTooltip itemId={drop.itemId} owned={inventory[drop.itemId] ?? 0} extraContent={<div className="tooltip-section"><small>DROP</small><span className="tooltip-row"><span>Chance</span><b>{chance}</b></span><span className="tooltip-row"><span>Quantity</span><b>{quantity}</b></span><span className="tooltip-row"><span>Source</span><b>{sourceName}</b></span></div>}><div className="combat-area-loot-tile" role="img" aria-label={`${item.name}: ${chance}, quantity ${quantity}`}><span className="combat-area-loot-icon"><ItemIcon itemId={drop.itemId} size="tile" /></span><span className="combat-area-loot-values"><b>{chance}</b><small>{quantity}</small></span></div></ItemTooltip>
}
