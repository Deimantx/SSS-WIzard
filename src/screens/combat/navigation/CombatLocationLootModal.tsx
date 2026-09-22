import { Crown, Package, X } from 'lucide-react'
import { Button, GameTooltip, ModalPortal, Status } from '../../../components/ui'
import { TooltipContent } from '../../../components/ui/tooltip/Tooltip'
import { LootRewardTile } from '../../../components/combat/LootRewardTile'
import { MONSTERS } from '../../../game/content/monsters'
import { buildCombatTargetRewardPresentation, buildLocationLootPresentation, formatLocationLootChance, formatLocationLootQuantity, getLocationLootAvailabilityLabel, type CombatTargetRewardPresentation, type LocationLootEntry } from '../../../game/presentation/combat'
import { getNonZeroResonanceEntries } from '../../../game/presentation/resonance/resonancePresentation'
import type { CombatLocationViewModel } from '../../../game/presentation/combat/combatWorldNavigationTypes'
import { useGameStore } from '../../../store/gameStore'
import type { ItemId, MonsterId } from '../../../game/types'

export function CombatLocationLootModal({ location, targetMonsterId, onClose }: { location: CombatLocationViewModel; targetMonsterId?: MonsterId | null; onClose: () => void }) {
  const progress = useGameStore((state) => state.progress)
  const inventory = useGameStore((state) => state.inventory)
  const worldTier = useGameStore((state) => state.worldTier.current)
  const targeted = Boolean(location.targeting)
  const target = targeted && targetMonsterId ? location.targeting?.targets.find((entry) => entry.monsterId === targetMonsterId) ?? null : null
  const reward = target ? buildCombatTargetRewardPresentation(target.monsterId, worldTier, target.minorAffixId) : null
  const loot = !targeted && location.dungeonId ? buildLocationLootPresentation(location.dungeonId, progress) : null
  const title = reward ? `${reward.monsterName.toUpperCase()} — LOOT` : location.name.toUpperCase()

  return <ModalPortal open onClose={onClose} backdropClassName="combat-location-loot-backdrop" surfaceClassName="combat-location-loot-modal" ariaLabelledBy="combat-location-loot-title">
    <header className="combat-location-loot-head"><div><span className="combat-subsection-label">{reward ? 'TARGET LOOT' : 'LOCATION LOOT'}</span><h2 id="combat-location-loot-title">{title}</h2><p>{reward ? `${location.name} · ${location.typeLabel} · ${target?.difficulty.toUpperCase()} · POWER ${reward.powerRating}` : loot ? 'Rewards available from this gameplay location.' : targeted ? 'Select a target to inspect its rewards.' : 'Loot has not been authored for this location.'}</p></div><Button icon variant="ghost" ariaLabel="Close loot" onClick={onClose}><X size={16} aria-hidden="true" /></Button></header>
    {reward ? <TargetLootBody location={location} reward={reward} inventory={inventory} /> : loot ? <LocationLootBody location={location} loot={loot} inventory={inventory} /> : <div className="combat-location-loot-empty"><span aria-hidden="true">✦</span><strong>{targeted ? 'SELECT A TARGET' : 'CONTENT NOT AUTHORED'}</strong><p>{targeted ? 'Choose a target in the Location inspector before opening Loot.' : 'This location has no gameplay loot table yet.'}</p></div>}
  </ModalPortal>
}

function TargetLootBody({ location, reward, inventory }: { location: CombatLocationViewModel; reward: CombatTargetRewardPresentation; inventory: Partial<Record<ItemId, number>> }) {
  const resonanceEntries = getNonZeroResonanceEntries(reward.resonance)
  return <div className="combat-location-loot-body"><div className="combat-location-loot-groups">
    <section className="combat-location-loot-group"><div className="combat-location-loot-group-head"><div className="combat-location-loot-eyebrow"><Package size={14} aria-hidden="true" /> ITEM DROPS</div><Status tone="active">WT{reward.worldTier} PREVIEW</Status></div><p className="combat-location-loot-group-description">Authored rewards from {reward.monsterName} in {location.name}.</p><div className="combat-location-loot-drop-grid">{reward.itemDrops.map((drop) => <LootRewardTile key={drop.itemId} drop={drop} inventory={inventory} sourceName={reward.monsterName} />)}</div></section>
    <section className="combat-location-loot-group is-resonance"><div className="combat-location-loot-eyebrow">RESONANCE</div>{resonanceEntries.length > 0 ? <div className="combat-target-resonance-list">{resonanceEntries.map((entry) => <div className="combat-target-resonance-row" key={entry.type}><span>{entry.label} Resonance</span><strong>+{entry.amount.toLocaleString('en-US')}</strong></div>)}</div> : <p className="combat-location-loot-group-description">No Resonance reward is authored for this target.</p>}</section>
    {reward.minorAffix && <section className="combat-location-loot-group is-affix"><div className="combat-location-loot-eyebrow">MINOR AFFIX</div><GameTooltip content={<TooltipContent title={reward.minorAffix.name} description={reward.minorAffix.description} />}><div className="combat-location-loot-affix" tabIndex={0}><strong>{reward.minorAffix.name}</strong><span>{reward.minorAffix.description}</span></div></GameTooltip></section>}
  </div></div>
}

function LocationLootBody({ location, loot, inventory }: { location: CombatLocationViewModel; loot: ReturnType<typeof buildLocationLootPresentation>; inventory: Partial<Record<ItemId, number>> }) {
  return <div className="combat-location-loot-body"><div className="combat-location-loot-groups">
    <section className="combat-location-loot-group"><div className="combat-location-loot-group-head"><div className="combat-location-loot-eyebrow"><Package size={14} aria-hidden="true" /> MONSTER LOOT</div><Status tone={loot.discoveredNormalEncounterCount > 0 ? 'active' : 'locked'}>{loot.discoveredNormalEncounterCount} / {loot.normalEncounterCount} DISCOVERED</Status></div><p className="combat-location-loot-group-description">Shared loot pool from normal encounters.</p>{loot.monsters.length > 0 ? <div className="combat-location-loot-drop-grid">{loot.monsters.map((entry) => <LocationLootRewardTile key={entry.itemId} entry={entry} sourceName={`${location.name} normal encounters`} inventory={inventory} />)}</div> : <HiddenLoot label="Normal encounter loot remains hidden until a monster is discovered." />}</section>
    <section className="combat-location-loot-group is-boss"><div className="combat-location-loot-group-head"><div className="combat-location-loot-eyebrow"><Crown size={14} aria-hidden="true" /> BOSS LOOT</div><Status tone={loot.discoveredBoss ? 'success' : 'locked'}>{loot.discoveredBoss ? 'DISCOVERED' : 'HIDDEN'}</Status></div>{loot.discoveredBoss ? <><div className="combat-location-loot-boss-name">{MONSTERS[loot.bossId].name}</div><div className="combat-location-loot-drop-grid">{loot.boss.map((entry) => <LocationLootRewardTile key={entry.itemId} entry={entry} sourceName={`${MONSTERS[loot.bossId].name} boss`} inventory={inventory} />)}</div></> : <HiddenLoot label="Boss loot remains hidden until the boss is discovered." />}</section>
  </div></div>
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
