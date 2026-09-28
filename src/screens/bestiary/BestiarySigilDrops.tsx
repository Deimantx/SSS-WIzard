import { ArrowUpRight, MapPin } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { SIGIL_DROP_CHANCE } from '../../game/content/sigils/sigilDropConfig'
import { getSigilRegionSetPool } from '../../game/content/sigils/sigilDropPools'
import { SIGIL_SETS } from '../../game/content/sigils/sigilSets'
import { getSigilTierDefinition, resolveSigilTierFromEnemyPower } from '../../game/content/sigils/sigilTiers'
import { getMonsterLocationEntries } from '../../game/systems/bestiary/bestiarySelectors'
import { resolveEnemyPowerRating } from '../../game/systems/combat/enemyPower'
import { isBossMonster, type MonsterDefinition } from '../../game/content/monsters'
import type { MonsterId } from '../../game/types'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'

export function BestiarySigilDrops({ monster, worldTier }: { monster: MonsterDefinition; worldTier: import('../../game/types').WorldTierId }) {
  const locations = getMonsterLocationEntries(monster.id)
  const setIds = [...new Set(locations.flatMap((location) => getSigilRegionSetPool(location.id)))]
  const power = resolveEnemyPowerRating(monster.id, worldTier)
  const tier = resolveSigilTierFromEnemyPower(power)
  const tierDefinition = getSigilTierDefinition(tier)
  const boss = isBossMonster(monster)
  const openSet = (setId: keyof typeof SIGIL_SETS) => {
    setUiPreferences({ screenState: { collection: { primaryTab: 'sigils' } } })
    setNavigationIntent({ sigilSetId: setId })
    useGameStore.getState().setScreen('arcane-guild')
  }
  return <Card title="SIGIL DROPS" className="bestiary-sigil-drops"><div className="bestiary-sigil-drop-summary"><span><strong>{boss ? `${(SIGIL_DROP_CHANCE.boss * 100).toFixed(0)}%` : `${(SIGIL_DROP_CHANCE.normal * 100).toFixed(0)}%`}</strong><small>{boss ? 'BOSS DROP CHANCE' : 'NORMAL DROP CHANCE'}</small></span><span><strong>{tierDefinition.label}</strong><small>POWER {power.toLocaleString()}</small></span><span><strong>5TH KILL</strong><small>FIRST-SIGIL PITY</small></span></div><div className="bestiary-sigil-source"><div className="bestiary-sigil-source-heading"><span className="eyebrow">SOURCE SET POOL</span><small>{setIds.length} authored sets · {tierDefinition.label} currently eligible</small></div><div className="bestiary-sigil-set-list">{setIds.map((setId) => <GameTooltip key={setId} block content={`${SIGIL_SETS[setId].description} · ${SIGIL_SETS[setId].piecesRequired}-piece set.`}><button type="button" className="bestiary-sigil-set" onClick={() => openSet(setId)}><span><strong>{SIGIL_SETS[setId].name}</strong><small>{SIGIL_SETS[setId].piecesRequired}-piece set · {SIGIL_SETS[setId].description}</small></span><ArrowUpRight size={14} aria-hidden="true" /></button></GameTooltip>)}</div></div><div className="bestiary-sigil-locations"><span><MapPin size={13} aria-hidden="true" /> LOCATION POOL</span><small>{locations.map((location) => location.name).join(' · ') || 'No authored location'}</small></div><p className="muted">Open a set to inspect its collection record and source locations. Tier follows the authored enemy power threshold; quality remains roll-weighted.</p></Card>
}

export const getBestiarySigilSourceSetIds = (monsterId: MonsterId) => [...new Set(getMonsterLocationEntries(monsterId).flatMap((location) => getSigilRegionSetPool(location.id)))]
