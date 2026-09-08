import { Button, GameTooltip } from '../ui'
import { TooltipContent } from '../ui/tooltip/Tooltip'
import { ItemIcon, ItemTooltip, formatStat, friendlyStatLabel } from '../ui/item'
import { ARTIFACTS } from '../../game/content/artifacts/artifacts'
import { DUNGEONS, DUNGEON_ORDER, getDungeonUnlockRequirement, isDungeonUnlocked } from '../../game/content/dungeons/dungeons'
import { ITEMS } from '../../game/content/items/items'
import { getConsumableQuantity } from '../../game/core/inventory/inventoryConsumption'
import { getArtifactArtificingState } from '../../game/systems/artificing/artificingSelectors'
import { getArtifactUpgrade } from '../../game/systems/artifacts/artifactProgression'
import type { ArtifactId, ArtificingRecipeId, EquipmentStats, GameState, ItemId } from '../../game/types'
import type { ArtifactArtificingState } from '../../game/systems/artificing/artificingSelectors'
import type { GameStore } from '../../store/gameStore'

interface ArtifactLevelUpModuleProps {
  state: GameStore
  artifactId: ArtifactId
}

interface StatPreview {
  key: string
  current: number
  next: number
}

export function ArtifactLevelUpModule({ state, artifactId }: ArtifactLevelUpModuleProps) {
  const definition = ARTIFACTS[artifactId]
  const artifactState = getArtifactArtificingState(state, artifactId as ArtificingRecipeId)
  if (!definition || !artifactState) return null

  const isUpgrade = artifactState.mode === 'upgrade'
  const isCapped = artifactState.mode === 'level-cap'
  const isMax = artifactState.mode === 'max-level'
  const currentLevel = artifactState.owned ? artifactState.level : 0
  const nextLevel = isMax ? null : currentLevel + 1
  const nextUpgrade = nextLevel !== null && nextLevel <= definition.maxLevel ? getArtifactUpgrade(artifactId, currentLevel) : null
  const ingredients = isUpgrade ? artifactState.ingredients : nextUpgrade?.ingredients ?? []
  const costs = ingredients.map((ingredient) => toCost(state, ingredient.itemId, ingredient.quantity))
  const hasMissingMaterials = costs.some((cost) => cost.missing > 0)
  const statPreview = nextLevel === null ? [] : getStatPreview(definition.coreStatsByLevel[currentLevel] ?? {}, definition.coreStatsByLevel[nextLevel] ?? {})
  const blockReason = getBlockReason(state, artifactState.mode, artifactState.reason, costs, artifactState.levelCap, definition.maxLevel)
  const buttonLabel = isUpgrade ? artifactState.canStart ? 'LEVEL UP' : hasMissingMaterials ? 'MISSING MATERIALS' : 'LEVEL UP' : isCapped ? 'LEVEL CAP REACHED' : isMax ? 'MAX LEVEL' : 'FORGE ARTIFACT FIRST'
  const buttonDisabled = !isUpgrade || !artifactState.canStart
  const stateLabel = isUpgrade ? artifactState.canStart ? 'READY FOR LEVEL UP' : hasMissingMaterials ? 'MATERIALS REQUIRED' : 'LEVEL UP BLOCKED' : isCapped ? 'PROGRESSION CAP REACHED' : isMax ? 'ARTIFACT COMPLETE' : 'ARTIFACT NOT OWNED'
  const tooltip = <LevelUpTooltip currentLevel={currentLevel} nextLevel={nextLevel} levelCap={artifactState.levelCap} maxLevel={definition.maxLevel} costs={costs} statPreview={statPreview} pathPointGain={isUpgrade ? 1 : 0} blockedReason={buttonDisabled ? blockReason : undefined} />

  return <section className={`artifact-level-up-module artifact-level-up-${isUpgrade ? artifactState.canStart ? 'ready' : 'missing' : isCapped ? 'capped' : isMax ? 'max' : 'unowned'}`} aria-label="Artifact level progression">
    <div className="artifact-level-up-heading">
      <div><span className="eyebrow">ARTIFACT PROGRESSION</span><strong>{isMax ? 'MAXIMUM LEVEL' : isCapped ? 'NEXT LEVEL LOCKED' : isUpgrade ? 'NEXT LEVEL' : 'LEVEL UP'}</strong></div>
      <span className="artifact-level-up-range">{currentLevel > 0 ? `LV ${currentLevel}` : 'NOT FORGED'}{nextLevel !== null && ` → ${nextLevel}`} <small>/ {definition.maxLevel}</small></span>
    </div>
    <div className="artifact-level-up-content">
      <div className="artifact-level-up-details">
        <div className="artifact-level-up-cap"><span>CURRENT CAP</span><strong>{artifactState.levelCap} <small>/ {definition.maxLevel}</small></strong></div>
        {costs.length > 0 && <div className="artifact-level-up-costs" aria-label="Next level materials">{costs.map((cost) => <LevelUpCost key={cost.itemId} cost={cost} />)}</div>}
        <div className="artifact-level-up-preview" aria-label="Next level preview">
          {statPreview.length > 0 ? statPreview.map((stat) => <span className="artifact-level-up-stat" key={stat.key}><small>{friendlyStatLabel(stat.key)}</small><strong>{formatStat(stat.key, stat.current)} <i>→</i> {formatStat(stat.key, stat.next)}</strong></span>) : <span className="artifact-level-up-no-preview">No further level preview.</span>}
          {isUpgrade && <span className="artifact-level-up-stat artifact-level-up-points"><small>PATH POINT</small><strong>+1</strong></span>}
        </div>
      </div>
      <div className="artifact-level-up-action">
        <GameTooltip content={tooltip} accent={buttonDisabled ? 'warning' : 'success'} wide>
          <Button variant={isUpgrade && artifactState.canStart ? 'success' : 'secondary'} disabled={buttonDisabled} onClick={() => state.upgradeArtifact(artifactId)}>{buttonLabel}</Button>
        </GameTooltip>
        <GameTooltip content={<TooltipContent title={stateLabel} description={buttonDisabled ? blockReason : 'All required materials are ready for the next Artifact level.'} />} accent={buttonDisabled ? 'warning' : 'success'}>
          <span className={`artifact-level-up-state${buttonDisabled ? ' blocked' : ' ready'}`}>{stateLabel}</span>
        </GameTooltip>
        {buttonDisabled && <p className="artifact-level-up-blocked-reason">{blockReason}</p>}
      </div>
    </div>
  </section>
}

interface LevelUpCostData {
  itemId: ItemId
  owned: number
  required: number
  missing: number
}

function toCost(state: GameState, itemId: ItemId, required: number): LevelUpCostData {
  const owned = getConsumableQuantity(state, itemId)
  return { itemId, owned, required, missing: Math.max(0, required - owned) }
}

function LevelUpCost({ cost }: { cost: LevelUpCostData }) {
  const item = ITEMS[cost.itemId]
  return <ItemTooltip itemId={cost.itemId} owned={cost.owned}><span className={`artifact-level-up-cost${cost.missing > 0 ? ' missing' : ' sufficient'}`}><ItemIcon itemId={cost.itemId} size="tiny" /><strong>{cost.owned.toLocaleString()} / {cost.required.toLocaleString()}</strong><small>{item?.name ?? cost.itemId}</small></span></ItemTooltip>
}

function getStatPreview(current: EquipmentStats, next: EquipmentStats): StatPreview[] {
  const currentEntries = flattenStats(current)
  const nextEntries = new Map(flattenStats(next).map(([key, value]) => [key, value]))
  return currentEntries.concat(flattenStats(next).filter(([key]) => !currentEntries.some(([currentKey]) => currentKey === key))).flatMap(([key]) => {
    const currentValue = currentEntries.find(([currentKey]) => currentKey === key)?.[1] ?? 0
    const nextValue = nextEntries.get(key) ?? 0
    return currentValue === nextValue ? [] : [{ key, current: currentValue, next: nextValue }]
  }).filter((entry, index, entries) => entries.findIndex((candidate) => candidate.key === entry.key) === index)
}

function flattenStats(stats: EquipmentStats): Array<[string, number]> {
  return Object.entries(stats).flatMap(([key, value]) => key === 'resistances' && value && typeof value === 'object'
    ? Object.entries(value).map(([damageType, resistance]) => [`resistance-${damageType}`, Number(resistance)] as [string, number])
    : [[key, Number(value)] as [string, number]])
}

function getBlockReason(state: GameState, mode: ArtifactArtificingState['mode'], selectorReason: string | undefined, costs: LevelUpCostData[], levelCap: number, maxLevel: number) {
  if (mode === 'max-level') return 'This Artifact has reached its absolute maximum level.'
  if (mode === 'level-cap') {
    const nextDungeon = DUNGEON_ORDER.slice(1).map((id) => DUNGEONS[id]).find((dungeon) => !isDungeonUnlocked(dungeon, state.progress))
    const requirement = nextDungeon ? getDungeonUnlockRequirement(nextDungeon) : null
    return requirement ? `Current cap: ${levelCap}. ${requirement} to unlock the next Artifact level band.` : `Current cap: ${levelCap}. Continue progression to unlock the next Artifact level band.`
  }
  if (mode === 'forge') return 'Forge this Artifact before leveling it.'
  const missing = costs.filter((cost) => cost.missing > 0).map((cost) => `${cost.missing.toLocaleString()} ${ITEMS[cost.itemId]?.name ?? cost.itemId}`)
  if (missing.length > 0) return `Missing ${missing.join(' and ')}.`
  if (state.activities.artificing.activeJob) return 'Another Artificing job is already in progress.'
  return selectorReason ?? (maxLevel > levelCap ? `Current cap: ${levelCap}.` : 'This Artifact cannot level up right now.')
}

function LevelUpTooltip({ currentLevel, nextLevel, levelCap, maxLevel, costs, statPreview, pathPointGain, blockedReason }: { currentLevel: number; nextLevel: number | null; levelCap: number; maxLevel: number; costs: LevelUpCostData[]; statPreview: StatPreview[]; pathPointGain: number; blockedReason?: string }) {
  return <TooltipContent title={nextLevel === null ? 'Artifact level complete' : `Artifact level ${currentLevel} → ${nextLevel}`} description={`Current cap ${levelCap} · Absolute max ${maxLevel}`}>
    {costs.length > 0 && <div className="artifact-level-up-tooltip-section"><small>NEXT LEVEL COST</small>{costs.map((cost) => <span className="artifact-level-up-tooltip-row" key={cost.itemId}><span>{ITEMS[cost.itemId]?.name ?? cost.itemId}</span><b>{cost.owned.toLocaleString()} / {cost.required.toLocaleString()}{cost.missing > 0 ? ` · missing ${cost.missing.toLocaleString()}` : ''}</b></span>)}</div>}
    {statPreview.length > 0 && <div className="artifact-level-up-tooltip-section"><small>STAT PREVIEW</small>{statPreview.map((stat) => <span className="artifact-level-up-tooltip-row" key={stat.key}><span>{friendlyStatLabel(stat.key)}</span><b>{formatStat(stat.key, stat.current)} → {formatStat(stat.key, stat.next)}</b></span>)}</div>}
    {pathPointGain > 0 && <div className="artifact-level-up-tooltip-section"><small>PATH IMPACT</small><span className="artifact-level-up-tooltip-row"><span>Path Point</span><b>+1</b></span></div>}
    {blockedReason && <p className="artifact-level-up-tooltip-blocked">{blockedReason}</p>}
  </TooltipContent>
}
