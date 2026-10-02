import { GameTooltip } from '../../../components/ui'
import { getSigilRegionSetPool } from '../../../game/content/sigils/sigilDropPools'
import { SIGIL_SETS } from '../../../game/content/sigils/sigilSets'
import { COMBAT_LOCATIONS } from '../../../game/content/combat-locations/worldNavigation'
import { resolveCombatLootContext } from '../../../game/systems/loot/universalLootRuntime'
import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS } from '../../../game/content/loot/universalLootTiers'
import type { CombatLocationId } from '../../../game/types'

export function CombatLocationSigilDrops({ locationId }: { locationId: CombatLocationId }) {
  const setIds = getSigilRegionSetPool(locationId)
  const location = COMBAT_LOCATIONS[locationId]
  const sampleId = location.monsterPool[0] ?? location.boss
  const exampleTier = resolveCombatLootContext(sampleId, 1).lootTier.tier
  return <section className="combat-location-section combat-location-sigil-drops"><div className="combat-location-section-head"><span className="combat-location-section-label">SIGIL SOURCE POOL</span><small>{setIds.length} SETS · POWER DRIVEN</small></div><div className="combat-location-sigil-set-list">{setIds.map((setId) => <GameTooltip key={setId} block content={SIGIL_SETS[setId].description}><span><strong>{SIGIL_SETS[setId].name}</strong><small>{SIGIL_SETS[setId].piecesRequired}-piece set</small></span></GameTooltip>)}</div><small className="muted">Example normal target resolves to Loot Tier {exampleTier}. The fifth eligible kill guarantees one Sigil; a natural boss drop grants {UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity} independently rolled Sigils.</small></section>
}
