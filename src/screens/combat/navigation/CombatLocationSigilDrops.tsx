import { GameTooltip } from '../../../components/ui'
import { getSigilRegionSetPool } from '../../../game/content/sigils/sigilDropPools'
import { SIGIL_SETS } from '../../../game/content/sigils/sigilSets'
import { SIGIL_DROP_CHANCE } from '../../../game/content/sigils/sigilDropConfig'
import type { CombatLocationId } from '../../../game/types'

export function CombatLocationSigilDrops({ locationId }: { locationId: CombatLocationId }) {
  const setIds = getSigilRegionSetPool(locationId)
  return <section className="combat-location-section combat-location-sigil-drops"><div className="combat-location-section-head"><span className="combat-location-section-label">SIGIL SOURCE POOL</span><small>{setIds.length} SETS · {SIGIL_DROP_CHANCE.normal * 100}% NORMAL · {SIGIL_DROP_CHANCE.boss * 100}% BOSS</small></div><div className="combat-location-sigil-set-list">{setIds.map((setId) => <GameTooltip key={setId} block content={SIGIL_SETS[setId].description}><span><strong>{SIGIL_SETS[setId].name}</strong><small>{SIGIL_SETS[setId].piecesRequired}-piece set</small></span></GameTooltip>)}</div><small className="muted">Tier follows the defeated enemy power. The first Sigil uses normal odds until the fifth eligible kill, when pity guarantees a drop.</small></section>
}
