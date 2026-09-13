import { Crown, Package, X } from 'lucide-react'
import { Button, ModalPortal, Status } from '../../../components/ui'
import { LootRewardTile } from '../../../components/combat/LootRewardTile'
import { MONSTERS } from '../../../game/content/monsters'
import { buildCampaignLootPresentation, formatCampaignLootChance, formatCampaignLootQuantity, getCampaignLootAvailabilityLabel } from '../../../game/presentation/combat/campaignLootPresentation'
import type { CampaignLootEntry } from '../../../game/presentation/combat/campaignLootPresentation'
import { useGameStore } from '../../../store/gameStore'
import type { ItemId } from '../../../game/types'
import type { CombatActNodeViewModel } from './combatActNavigationTypes'

export function CombatAreaLootModal({ node, onClose }: { node: CombatActNodeViewModel; onClose: () => void }) {
  const progress = useGameStore((state) => state.progress)
  const inventory = useGameStore((state) => state.inventory)
  const loot = node.dungeonId ? buildCampaignLootPresentation(node.dungeonId, progress) : null

  return <ModalPortal open onClose={onClose} backdropClassName="combat-area-loot-backdrop" surfaceClassName="combat-area-loot-modal" ariaLabelledBy="combat-area-loot-title">
    <header className="combat-area-loot-head"><div><span className="combat-subsection-label">AREA LOOT</span><h2 id="combat-area-loot-title">{node.name.toUpperCase()}</h2><p>{loot ? 'Shared rewards available from this campaign area.' : 'A presentation-only progression prototype.'}</p></div><Button icon variant="ghost" ariaLabel="Close loot" onClick={onClose}><X size={16} aria-hidden="true" /></Button></header>
    {loot ? <div className="combat-area-loot-body"><div className="combat-area-loot-groups">
      <section className="combat-area-loot-group">
        <div className="combat-area-loot-group-head"><div className="combat-area-loot-eyebrow"><Package size={14} aria-hidden="true" /> MONSTERS LOOT</div><Status tone={loot.discoveredNormalEncounterCount > 0 ? 'active' : 'locked'}>{loot.discoveredNormalEncounterCount} / {loot.normalEncounterCount} ENCOUNTERS DISCOVERED</Status></div>
        <p className="combat-area-loot-group-description">Shared loot pool from normal encounters.</p>
        {loot.monsters.length > 0 ? <div className="combat-area-loot-drop-grid">{loot.monsters.map((entry) => <CampaignLootRewardTile key={entry.itemId} entry={entry} sourceName={`${node.name} normal encounters`} inventory={inventory} />)}</div> : <HiddenLoot label="Normal encounter loot remains hidden until a monster is discovered." />}
      </section>
      <section className="combat-area-loot-group is-boss">
        <div className="combat-area-loot-group-head"><div className="combat-area-loot-eyebrow"><Crown size={14} aria-hidden="true" /> BOSS LOOT</div><Status tone={loot.discoveredBoss ? 'success' : 'locked'}>{loot.discoveredBoss ? 'DISCOVERED' : 'HIDDEN'}</Status></div>
        {loot.discoveredBoss ? <><div className="combat-area-loot-boss-name">{MONSTERS[loot.bossId].name}</div><div className="combat-area-loot-drop-grid">{loot.boss.map((entry) => <CampaignLootRewardTile key={entry.itemId} entry={entry} sourceName={`${MONSTERS[loot.bossId].name} boss`} inventory={inventory} />)}</div></> : <HiddenLoot label="Boss loot remains hidden until the boss is discovered." />}
      </section>
    </div></div> : <div className="combat-area-loot-empty"><span className="combat-area-loot-empty-glyph">✦</span><strong>PROTOTYPE AREA</strong><p>Loot table has not been authored yet.</p></div>}
  </ModalPortal>
}

function CampaignLootRewardTile({ entry, sourceName, inventory }: { entry: CampaignLootEntry; sourceName: string; inventory: Partial<Record<ItemId, number>> }) {
  const availability = getCampaignLootAvailabilityLabel(entry)
  const stateLabel = entry.signature ? 'SIGNATURE' : availability?.toUpperCase()
  const tooltipNote = entry.sourceCount < entry.encounterCount
    ? 'This reward is available from some normal encounters in this area.'
    : entry.variesByEncounter
      ? 'Exact quantity or drop chance depends on which normal monster is encountered.'
      : undefined
  return <LootRewardTile drop={{ itemId: entry.itemId, min: entry.min, max: entry.max, chance: entry.chanceMin }} inventory={inventory} sourceName={sourceName} stateLabel={stateLabel} stateTone={entry.signature ? 'warning' : 'neutral'} chanceLabel={formatCampaignLootChance(entry)} quantityLabel={formatCampaignLootQuantity(entry)} tooltipNote={tooltipNote} />
}

function HiddenLoot({ label }: { label: string }) {
  return <div className="combat-area-loot-hidden"><span aria-hidden="true">?</span><small>HIDDEN</small><p>{label}</p></div>
}
