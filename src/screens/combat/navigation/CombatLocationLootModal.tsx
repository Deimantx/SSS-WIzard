import { Crown, Package, X } from 'lucide-react'
import { Button, ModalPortal, Status } from '../../../components/ui'
import { LootRewardTile } from '../../../components/combat/LootRewardTile'
import { MONSTERS } from '../../../game/content/monsters'
import { buildLocationLootPresentation, formatLocationLootChance, formatLocationLootQuantity, getLocationLootAvailabilityLabel } from '../../../game/presentation/combat/locationLootPresentation'
import type { LocationLootEntry } from '../../../game/presentation/combat/locationLootPresentation'
import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { useGameStore } from '../../../store/gameStore'
import type { ItemId } from '../../../game/types'

export function CombatLocationLootModal({ location, onClose }: { location: CombatLocationViewModel; onClose: () => void }) {
  const progress = useGameStore((state) => state.progress)
  const inventory = useGameStore((state) => state.inventory)
  const loot = location.dungeonId ? buildLocationLootPresentation(location.dungeonId, progress) : null

  return <ModalPortal open onClose={onClose} backdropClassName="combat-location-loot-backdrop" surfaceClassName="combat-location-loot-modal" ariaLabelledBy="combat-location-loot-title">
    <header className="combat-location-loot-head"><div><span className="combat-subsection-label">LOCATION LOOT</span><h2 id="combat-location-loot-title">{location.name.toUpperCase()}</h2><p>{loot ? 'Rewards available from this gameplay location.' : 'Loot has not been authored for this location.'}</p></div><Button icon variant="ghost" ariaLabel="Close loot" onClick={onClose}><X size={16} aria-hidden="true" /></Button></header>
    {loot ? <div className="combat-location-loot-body"><div className="combat-location-loot-groups">
      <section className="combat-location-loot-group"><div className="combat-location-loot-group-head"><div className="combat-location-loot-eyebrow"><Package size={14} aria-hidden="true" /> MONSTER LOOT</div><Status tone={loot.discoveredNormalEncounterCount > 0 ? 'active' : 'locked'}>{loot.discoveredNormalEncounterCount} / {loot.normalEncounterCount} DISCOVERED</Status></div><p className="combat-location-loot-group-description">Shared loot pool from normal encounters.</p>{loot.monsters.length > 0 ? <div className="combat-location-loot-drop-grid">{loot.monsters.map((entry) => <LocationLootRewardTile key={entry.itemId} entry={entry} sourceName={`${location.name} normal encounters`} inventory={inventory} />)}</div> : <HiddenLoot label="Normal encounter loot remains hidden until a monster is discovered." />}</section>
      <section className="combat-location-loot-group is-boss"><div className="combat-location-loot-group-head"><div className="combat-location-loot-eyebrow"><Crown size={14} aria-hidden="true" /> BOSS LOOT</div><Status tone={loot.discoveredBoss ? 'success' : 'locked'}>{loot.discoveredBoss ? 'DISCOVERED' : 'HIDDEN'}</Status></div>{loot.discoveredBoss ? <><div className="combat-location-loot-boss-name">{MONSTERS[loot.bossId].name}</div><div className="combat-location-loot-drop-grid">{loot.boss.map((entry) => <LocationLootRewardTile key={entry.itemId} entry={entry} sourceName={`${MONSTERS[loot.bossId].name} boss`} inventory={inventory} />)}</div></> : <HiddenLoot label="Boss loot remains hidden until the boss is discovered." />}</section>
    </div></div> : <div className="combat-location-loot-empty"><span aria-hidden="true">✦</span><strong>CONTENT NOT AUTHORED</strong><p>This location has no gameplay loot table yet.</p></div>}
  </ModalPortal>
}

function LocationLootRewardTile({ entry, sourceName, inventory }: { entry: LocationLootEntry; sourceName: string; inventory: Partial<Record<ItemId, number>> }) {
  const availability = getLocationLootAvailabilityLabel(entry)
  const stateLabel = entry.signature ? 'SIGNATURE' : availability?.toUpperCase()
  const tooltipNote = entry.sourceCount < entry.encounterCount ? 'This reward is available from some normal encounters in this location.' : entry.variesByEncounter ? 'Exact quantity or drop chance depends on which normal monster is encountered.' : undefined
  return <LootRewardTile drop={{ itemId: entry.itemId, min: entry.min, max: entry.max, chance: entry.chanceMin }} inventory={inventory} sourceName={sourceName} stateLabel={stateLabel} stateTone={entry.signature ? 'warning' : 'neutral'} chanceLabel={formatLocationLootChance(entry)} quantityLabel={formatLocationLootQuantity(entry)} tooltipNote={tooltipNote} />
}

function HiddenLoot({ label }: { label: string }) {
  return <div className="combat-location-loot-hidden"><span aria-hidden="true">?</span><small>HIDDEN</small><p>{label}</p></div>
}
