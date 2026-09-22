import { LockKeyhole } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { Button, Card, GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { WORLD_TIER_IDS, WORLD_TIERS, type WorldTierId } from '../../game/content/world-tier/worldTiers'
import { useGameStore } from '../../store/gameStore'

const formatMultiplier = (value: number) => `x${value.toFixed(2)}`
const tierDescription = (tier: WorldTierId) => {
  const definition = WORLD_TIERS[tier]
  return `Enemy Health ${formatMultiplier(definition.enemyHealthMultiplier)} · Enemy Damage ${formatMultiplier(definition.enemyDamageMultiplier)} · Enemy Defense ${formatMultiplier(definition.enemyDefenseMultiplier)} · Resonance ${formatMultiplier(definition.resonanceRewardMultiplier)} · Material Loot ${formatMultiplier(definition.itemLootQuantityMultiplier)}`
}

const lockedTierDescription = (tier: WorldTierId) => tier === 2
  ? 'Complete Chapter 1 by defeating Archmage Edrin Shade to unlock World Tier 2.'
  : 'Unlocks through future progression.'

export function CombatWorldTierControl({ variant = 'card' }: { variant?: 'card' | 'embedded' }) {
  const current = useGameStore(useShallow((state) => ({ tier: state.worldTier.current, highest: state.worldTier.highestUnlocked, active: state.combat.active })))
  const setWorldTier = useGameStore((state) => state.setWorldTier)
  const content = <>
    <div className="combat-world-tier-head"><div><span className="combat-subsection-label">WORLD TIER</span><small>Global combat difficulty</small></div>{variant !== 'embedded' && <strong>WT{current.tier}</strong>}</div>
    <div className="combat-world-tier-options">{WORLD_TIER_IDS.map((tier) => {
      const unlocked = tier <= current.highest
      const disabled = current.active || !unlocked
      const tooltip = current.active ? <TooltipContent title="World Tier locked during combat" description="Leave the current Location to change World Tier." /> : !unlocked ? <TooltipContent title={`WT${tier} - LOCKED`} description={lockedTierDescription(tier)} /> : <TooltipContent title={`World Tier ${tier}`} description={tierDescription(tier)} />
      return <GameTooltip key={tier} content={tooltip}><Button variant={current.tier === tier ? 'primary' : 'secondary'} disabled={disabled} ariaPressed={current.tier === tier} onClick={() => setWorldTier(tier)}>{!unlocked && <LockKeyhole size={13} aria-hidden="true" />} WT{tier}</Button></GameTooltip>
    })}</div>
    <small className="combat-world-tier-status">{current.active ? 'LOCKED DURING COMBAT' : current.highest > 1 ? `WT1–WT${current.highest} AVAILABLE` : 'WT2 unlocks after Chapter 1.'}</small>
  </>
  return variant === 'embedded' ? <div className="combat-world-tier-control is-embedded">{content}</div> : <Card className="combat-world-tier-control">{content}</Card>
}

export { tierDescription }
