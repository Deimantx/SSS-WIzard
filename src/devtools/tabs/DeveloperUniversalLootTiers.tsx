import { Card, Status } from '../../components/ui'
import { MONSTER_IDS, MONSTERS } from '../../game/content/monsters'
import { getLootUnlockTier, isLootUnlockedAtTier, UNIVERSAL_LOOT_BOSS_MULTIPLIERS, UNIVERSAL_LOOT_TIERS, UNIVERSAL_LOOT_UNLOCK_REGISTRY } from '../../game/content/loot/universalLootTiers'
import { resolveCombatCurrencyRewardRange } from '../../game/systems/loot/combatCurrencyRewards'
import { resolveAuthoredLootDropChance, resolveAuthoredLootDropQuantity, resolveCombatLootContext, resolveLootTierDistribution } from '../../game/systems/loot/universalLootRuntime'
import { resolveEnemyResonanceReward } from '../../game/systems/resonance/resonanceRuntime'
import { getMonsterLocationEntries } from '../../game/systems/bestiary/bestiarySelectors'
import { WORLD_TIER_IDS } from '../../game/content/world-tier/worldTiers'
import { auditLootTierCoverage } from '../universalLootTierAudit'

const pct = (value: number) => `${(value * 100).toFixed(2)}%`
const fmt = (value: number) => Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2)

export function DeveloperUniversalLootTiers() {
  const distribution = WORLD_TIER_IDS.map((worldTier) => ({ worldTier, tiers: resolveLootTierDistribution(worldTier, MONSTER_IDS) }))
  const coverageWarnings = auditLootTierCoverage(distribution)
  const rows = WORLD_TIER_IDS.flatMap((worldTier) => MONSTER_IDS.map((enemyId) => {
    const context = resolveCombatLootContext(enemyId, worldTier)
    const life = resolveCombatCurrencyRewardRange(enemyId, 'life-essence', worldTier)
    const artifact = resolveCombatCurrencyRewardRange(enemyId, 'artifact-essence', worldTier)
    const resonance = resolveEnemyResonanceReward(enemyId, worldTier)
    const locations = getMonsterLocationEntries(enemyId).map((entry) => entry.name).join(', ')
    return { key: `${enemyId}:${worldTier}`, worldTier, enemyId, context, life, artifact, resonance, locations }
  }))
  const hasTierGapWarning = coverageWarnings.some((entry) => entry.warn)

  return <div className="developer-tab-stack">
    <Card title="UNIVERSAL LOOT TIERS · Power curves" action={<Status tone="active">POWER DRIVEN</Status>}>
      <p className="muted">The encounter’s resolved effective Power selects one shared Loot Tier. World Tier changes enemy profiles, which can move the encounter to a different tier. The highest tier extends without a cap.</p>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['TIER', 'MIN POWER', 'NEXT THRESHOLD', 'QUANTITY', 'CHANCE', 'RARITY', 'SIGIL CHANCE', 'CRYSTAL CHANCE', 'UNLOCKS'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{UNIVERSAL_LOOT_TIERS.map((tier, index) => <tr key={tier.tier}><th scope="row">T{tier.tier}</th><td>{fmt(tier.minPower)}</td><td>{UNIVERSAL_LOOT_TIERS[index + 1] ? fmt(UNIVERSAL_LOOT_TIERS[index + 1].minPower) : 'Open ended'}</td><td>{tier.quantityMultiplier.toFixed(2)}×</td><td>{tier.chanceMultiplier.toFixed(2)}×</td><td>{tier.rarityMultiplier.toFixed(2)}×</td><td>{pct(tier.sigilDropChance)}</td><td>{pct(tier.crystalCacheDropChance)}</td><td>{tier.unlocks.map((id) => UNIVERSAL_LOOT_UNLOCK_REGISTRY[id].label).join(', ') || (isLootUnlockedAtTier('crystal-cache-t1', tier) ? `${UNIVERSAL_LOOT_UNLOCK_REGISTRY['crystal-cache-t1'].label} eligible` : '—')}</td></tr>)}</tbody></table></div>
    </Card>
    <Card title="Reachable tier distribution · WT1–WT5" action={<Status tone={hasTierGapWarning ? 'warning' : 'success'}>{hasTierGapWarning ? 'TIER COVERAGE GAP' : 'NO LONG GAP'}</Status>}>
      <p className="muted">Counts authored monsters and bosses at each World Tier’s resolved effective Power. A gap of three or more consecutive reachable tiers without a source is flagged.</p>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr><th>WORLD TIER</th>{UNIVERSAL_LOOT_TIERS.map((tier) => <th key={tier.tier}>T{tier.tier}</th>)}<th>GAP AUDIT</th></tr></thead><tbody>{distribution.map(({ worldTier, tiers }) => { const warning = coverageWarnings.find((entry) => entry.worldTier === worldTier)!; return <tr key={worldTier}><th scope="row">WT{worldTier}</th>{UNIVERSAL_LOOT_TIERS.map((tier) => <td key={tier.tier}>{tiers[tier.tier]?.length ?? '—'}</td>)}<td>{warning.warn ? <Status tone="warning">{warning.longestConsecutiveGap} CONSECUTIVE EMPTY TIERS</Status> : <Status tone="success">OK</Status>}</td></tr> })}</tbody></table></div>
    </Card>
    <Card title="Monster × World Tier reward audit" action={<Status tone="neutral">{rows.length} ENCOUNTERS</Status>}>
      <p className="muted">Read only. Currency ranges show base targets after tier and boss scaling, before Guild/Hunter bonuses. Sigil and material chances exclude Hunter bonuses; Crystal chances exclude Guild bonuses. Material rows preserve authored identity and modifiers.</p>
      <div className="developer-balance-table-wrap"><table className="developer-balance-table"><thead><tr>{['MONSTER / BOSS', 'LOCATION', 'WT', 'POWER', 'LOOT TIER', 'LIFE ESSENCE', 'ARTIFACT ESSENCE', 'RESONANCE ×', 'SIGIL CHANCE / EXPECTED', 'CRYSTAL CHANCE / EXPECTED', 'AUTHORED LOOT'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(({ key, worldTier, enemyId, context, life, artifact, resonance, locations }) => {
        const bossChance = context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance : 1
        const bossQuantity = context.isBoss ? UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity : 1
        const sigilChance = Math.min(1, context.lootTier.sigilDropChance * bossChance)
        const crystalChance = isLootUnlockedAtTier('crystal-cache-t1', context.lootTier) ? Math.min(1, context.lootTier.crystalCacheDropChance * bossChance) : 0
        const materials = MONSTERS[enemyId].loot.map((drop) => `${drop.category}: ${drop.itemId} ${resolveAuthoredLootDropQuantity(drop, drop.quantity.min, context)}–${resolveAuthoredLootDropQuantity(drop, drop.quantity.max, context)} (${pct(resolveAuthoredLootDropChance(drop, context))})`).join('; ') || 'None authored'
        return <tr key={key}><th scope="row">{MONSTERS[enemyId].name}{context.isBoss ? ' · BOSS' : ''}</th><td>{locations || 'Unassigned'}</td><td>WT{worldTier}</td><td>{fmt(context.effectivePower)}</td><td>T{context.lootTier.tier}</td><td>{life.finalMin}–{life.finalMax}</td><td>{artifact.finalMin}–{artifact.finalMax}</td><td>{resonance.rewardMultiplier.toFixed(2)}×</td><td>{pct(sigilChance)} / {(sigilChance * bossQuantity).toFixed(2)}</td><td>{pct(crystalChance)} / {(crystalChance * bossQuantity).toFixed(2)}</td><td>{materials}</td></tr>
      })}</tbody></table></div>
    </Card>
    <Card title="Scaling contract"><div className="developer-detail-grid"><span>STANDARD BOSS QUANTITY<strong>{UNIVERSAL_LOOT_BOSS_MULTIPLIERS.quantity}×</strong></span><span>STANDARD BOSS CHANCE<strong>{UNIVERSAL_LOOT_BOSS_MULTIPLIERS.chance}×</strong></span><span>STANDARD BOSS RARITY<strong>{UNIVERSAL_LOOT_BOSS_MULTIPLIERS.rarity}×</strong></span><span>CRYSTAL CACHE UNLOCK<strong>LOOT TIER {getLootUnlockTier('crystal-cache-t1') ?? 'UNSET'}</strong></span><span>MONSTER LOOT POLICY<strong>MATERIAL / EQUIPMENT / UNIQUE</strong></span></div></Card>
  </div>
}
