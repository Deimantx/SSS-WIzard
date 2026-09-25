import { useState } from 'react'
import { Button, Card, GameTooltip, Status } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { MONSTER_IDS, MONSTERS } from '../../game/content/monsters'
import { WORLD_TIER_IDS, WORLD_TIERS, type WorldTierId } from '../../game/content/world-tier/worldTiers'
import { formatResonanceBundle } from '../../game/presentation/resonance/resonancePresentation'
import { resolveWorldTierEnemyProfile } from '../../game/systems/world-tier/worldTierRuntime'
import { resolveEnemyResonanceReward } from '../../game/systems/resonance/resonanceRuntime'
import type { MonsterId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { Summary } from './DeveloperTabPrimitives'

const formatMultiplier = (value: number) => `×${value.toFixed(2)}`
const unlockableTierIds = WORLD_TIER_IDS.filter((tier): tier is Exclude<WorldTierId, 1> => tier > 1)

export function DeveloperWorldTier() {
  const state = useGameStore()
  const [selectedEnemy, setSelectedEnemy] = useState<MonsterId>('forest-wisp')
  const selectedMonster = MONSTERS[selectedEnemy]
  const activeTier = state.combat.enemyWorldTier
  const profiles = WORLD_TIER_IDS.map((tier) => ({ tier, profile: resolveWorldTierEnemyProfile(selectedEnemy, tier), resonance: resolveEnemyResonanceReward(selectedEnemy, tier) }))
  const highestUnlocked = state.worldTier.highestUnlocked

  return <div className="developer-tab-stack developer-world-tier-tab">
    <Card title="WORLD TIER · Overview" action={<Status tone={highestUnlocked > 1 ? 'success' : 'neutral'}>{highestUnlocked > 1 ? `WT${highestUnlocked} UNLOCKED` : 'WT1 ONLY'}</Status>}>
      <div className="developer-summary-grid"><Summary label="Current tier" value={`WT${state.worldTier.current}`} /><Summary label="Highest unlocked" value={`WT${highestUnlocked}`} /><Summary label="Active encounter" value={activeTier ? `WT${activeTier} snapshot` : 'None'} /><Summary label="Combat state" value={state.combat.active ? 'Active' : 'Idle'} /></div>
      <p className="muted">World Tier is global and persisted. Normal changes are blocked during combat; an active encounter keeps the tier captured at spawn.</p>
      <div className="developer-button-grid">
        <div className="developer-world-tier-actions">
          <span className="developer-control-label">CURRENT TIER</span>
          <div className="button-row">{WORLD_TIER_IDS.map((tier) => <GameTooltip key={tier} content={<TooltipContent title={`Set current WT${tier}`} description="Developer-only selection. This does not change the authored progression rules." />}><Button variant={state.worldTier.current === tier ? 'primary' : 'secondary'} ariaPressed={state.worldTier.current === tier} onClick={() => state.debugSetWorldTier(tier)}>WT{tier}</Button></GameTooltip>)}</div>
        </div>
        <div className="developer-world-tier-actions">
          <span className="developer-control-label">UNLOCK</span>
          <div className="button-row">{unlockableTierIds.map((tier) => <GameTooltip key={tier} content={<TooltipContent title={`Unlock WT${tier}`} description="Developer-only progression fixture. Unlocking does not auto-select the tier." />}><Button variant="success" onClick={() => state.debugUnlockWorldTier(tier)}>UNLOCK WT{tier}</Button></GameTooltip>)}</div>
        </div>
        <div className="button-row"><GameTooltip content={<TooltipContent title="Unlock all World Tiers" description="Developer-only fixture: marks WT1 through WT5 as available." />}><Button variant="success" onClick={() => state.debugUnlockWorldTier(WORLD_TIER_IDS[WORLD_TIER_IDS.length - 1])}>UNLOCK ALL</Button></GameTooltip><GameTooltip content={<TooltipContent title="Reset World Tier unlocks" description="Returns the developer World Tier state to WT1." />}><Button variant="danger" onClick={state.debugResetWorldTier}>RESET UNLOCKS TO WT1</Button></GameTooltip></div>
      </div>
      {state.combat.active && <p className="developer-warning">Active encounter: WT{activeTier ?? state.worldTier.current}. Current profile selection may differ until the encounter ends.</p>}
    </Card>

    <Card title="WORLD TIER · Authored definitions">
      <div className="developer-world-tier-definitions">{WORLD_TIER_IDS.map((tier) => { const definition = WORLD_TIERS[tier]; const unlocked = tier <= highestUnlocked; return <div className="developer-world-tier-definition" key={tier}><div className="developer-world-tier-definition-head"><strong>WT{tier} · {definition.name}</strong><Status tone={unlocked ? 'success' : 'locked'}>{unlocked ? 'AVAILABLE' : 'LOCKED'}</Status></div><div className="developer-detail-grid"><span>ENEMY HEALTH<strong>{formatMultiplier(definition.enemyHealthMultiplier)}</strong></span><span>ENEMY DAMAGE<strong>{formatMultiplier(definition.enemyDamageMultiplier)}</strong></span><span>ENEMY DEFENSE<strong>{formatMultiplier(definition.enemyDefenseMultiplier)}</strong></span><span>RESONANCE<strong>{formatMultiplier(definition.resonanceRewardMultiplier)}</strong></span><span>ITEM LOOT<strong>{formatMultiplier(definition.itemLootQuantityMultiplier)}</strong></span><span>BOSS THREAT REQUIREMENT<strong>{formatMultiplier(definition.bossThreatRequirementMultiplier)}</strong></span></div>{tier === 2 ? <small className="muted">Unlocks on the first defeat of Archmage Edrin Shade. Unlocking does not auto-select WT2.</small> : tier > 2 ? <small className="muted">Unlocks through future progression.</small> : null}</div> })}</div>
    </Card>

    <Card title="WORLD TIER · Canonical enemy preview">
      <label className="developer-select-field">SELECT ENEMY<select aria-label="World Tier preview enemy" value={selectedEnemy} onChange={(event) => setSelectedEnemy(event.target.value as MonsterId)}>{MONSTER_IDS.map((id) => <option key={id} value={id}>{MONSTERS[id].name}</option>)}</select></label>
      <div className="developer-inspector-title"><div><strong>{selectedMonster.name}</strong><small className="muted">{selectedMonster.subtitle}</small></div><Status tone={activeTier ? 'active' : 'neutral'}>{activeTier ? `ACTIVE WT${activeTier}` : 'NO ACTIVE ENCOUNTER'}</Status></div>
      <div className="developer-world-tier-preview-grid">{profiles.map(({ tier, profile, resonance }) => <GameTooltip key={tier} block content={<TooltipContent title={`WT${tier} preview`} description="Pure authored preview. This does not mutate the profile or active encounter." />}><div className={`developer-world-tier-preview${activeTier === tier ? ' is-active' : ''}`}><div className="developer-world-tier-definition-head"><strong>WT{tier}</strong>{activeTier === tier && <Status tone="active">SNAPSHOT</Status>}</div><div className="developer-detail-grid"><span>HP<strong>{profile.maxHealth.toLocaleString()} <small>from {profile.baseMaxHealth.toLocaleString()}</small></strong></span><span>BASIC DAMAGE<strong>{profile.basicAttackDamage.toFixed(1)} <small>from {profile.baseBasicAttackDamage.toFixed(1)}</small></strong></span><span>DEFENSE<strong>{profile.defense.toFixed(1)} <small>from {profile.baseDefense.toFixed(1)}</small></strong></span><span>RESONANCE<strong>{formatResonanceBundle(resonance.finalYield)}</strong></span><span>REWARD RATE<strong>{formatMultiplier(resonance.rewardMultiplier)}</strong></span><span>ITEM LOOT<strong>{formatMultiplier(WORLD_TIERS[tier].itemLootQuantityMultiplier)}</strong></span></div></div></GameTooltip>)}</div>
      <p className="developer-debug-note">Preview uses the same profile resolver as encounter spawn and combat stat reads. Resistances, speed, action patterns, loot chance, Arcane Points, and threat are unchanged.</p>
    </Card>
  </div>
}
