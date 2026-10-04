import { ArrowUpRight, MapPin } from 'lucide-react'
import { Button, Card, GameTooltip } from '../../components/ui'
import { getSigilRegionSetPool } from '../../game/content/sigils/sigilDropPools'
import { SIGIL_SETS } from '../../game/content/sigils/sigilSets'
import { getSigilTierDefinition, resolveSigilTierFromEnemyPower } from '../../game/content/sigils/sigilTiers'
import { getMonsterLocationEntries } from '../../game/systems/bestiary/bestiarySelectors'
import { resolveEnemyPowerRating } from '../../game/systems/combat/enemyPower'
import { isBossMonster, type MonsterDefinition } from '../../game/content/monsters'
import type { MonsterId } from '../../game/types'
import { resolveCombatLootContext } from '../../game/systems/loot/universalLootRuntime'
import { UNIVERSAL_LOOT_BOSS_MULTIPLIERS } from '../../game/content/loot/universalLootTiers'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import { setUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { useGameStore } from '../../store/gameStore'

export function BestiarySigilDrops({ monster }: { monster: MonsterDefinition }) {
  const locations = getMonsterLocationEntries(monster.id)
  const setIds = [...new Set(locations.flatMap((location) => getSigilRegionSetPool(location.id)))]
  const power = resolveEnemyPowerRating(monster.id)
  const sigilTier = resolveSigilTierFromEnemyPower(power)
  const tierDefinition = getSigilTierDefinition(sigilTier)
  const boss = isBossMonster(monster)
  const loot = resolveCombatLootContext(monster.id)
  const chance = Math.min(1, loot.lootTier.sigilDropChance * (boss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1))
  const openSet = (setId: keyof typeof SIGIL_SETS) => {
    setUiPreferences({ screenState: { collection: { primaryTab: 'sigils' } } })
    setNavigationIntent({ sigilSetId: setId })
    useGameStore.getState().setScreen('arcane-guild')
  }
  return <Card title="SIGIL DROPS" className="bestiary-sigil-drops">
    <div className="bestiary-sigil-drop-summary">
      <span><strong>{(chance * 100).toFixed(1)}%</strong><small>{boss ? `BOSS DROP CHANCE · UP TO ${UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity}` : 'DROP CHANCE · 1 INSTANCE'}</small></span>
      <span><strong>{tierDefinition.label}</strong><small>ITEM POWER {power.toLocaleString()}</small></span>
      <span><strong>LOOT TIER {loot.lootTier.tier}</strong><small>FIRST DROP GUARANTEED ON ELIGIBLE KILL 5</small></span>
    </div>
    <div className="bestiary-sigil-source"><div className="bestiary-sigil-source-heading"><span className="eyebrow">SOURCE SET POOL</span><small>{setIds.length} authored sets · {tierDefinition.label} currently eligible</small></div>
      <div className="bestiary-sigil-set-list">{setIds.map((setId) => <GameTooltip key={setId} block content={`${SIGIL_SETS[setId].description} · ${SIGIL_SETS[setId].piecesRequired}-piece set.`}><button type="button" className="bestiary-sigil-set" onClick={() => openSet(setId)}><span><strong>{SIGIL_SETS[setId].name}</strong><small>{SIGIL_SETS[setId].piecesRequired}-piece set · {SIGIL_SETS[setId].description}</small></span><ArrowUpRight size={14} aria-hidden="true" /></button></GameTooltip>)}</div>
    </div>
    <div className="bestiary-sigil-locations"><span><MapPin size={13} aria-hidden="true" /> LOCATION POOL</span><small>{locations.map((location) => location.name).join(' · ') || 'No authored location'}</small></div>
    <p className="muted">Sigil item tier follows encounter Power; Loot Tier drives drop chance and quality weights. A natural boss drop grants {UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity} independently rolled Sigils.</p>
  </Card>
}

export const getBestiarySigilSourceSetIds = (monsterId: MonsterId) => [...new Set(getMonsterLocationEntries(monsterId).flatMap((location) => getSigilRegionSetPool(location.id)))]
