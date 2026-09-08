import { ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getActivityTelemetry } from '../../game/systems/activity/activityTelemetry'
import { formatCompactDuration } from '../../game/utils'
import { useGameStore } from '../../store/gameStore'
import type { ActivityTelemetry } from '../../game/types'
import { GameTooltip, TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { ItemIcon, ItemUsesDialog } from '../../components/ui/item'
import { ITEMS } from '../../game/content/items/items'
import { getItemDropSources, getItemSources } from '../../game/content/contentRelations'
import { getItemUses } from '../../game/content/items/inventoryMetadata'
import { isTransmutationRecipeId } from '../../game/content/recipes/recipes'
import { useGameContextMenu } from '../../ui/context-menu/GameContextMenuProvider'
import { buildItemContextSections } from '../../ui/context-menu/itemContextActions'
import { setUiPreferences, useUiPreferences } from '../../ui/preferences/uiPreferencesStore'
import { setNavigationIntent } from '../../ui/navigation/navigationIntent'
import type { ItemId } from '../../game/types'
import { TRANSMUTATION_RECIPES } from '../../game/content/recipes/recipes'
import { getTransmutationJob } from '../../game/systems/transmutation/transmutationSelectors'

const collapsedStorageKey = 'sss-wizard.activity-monitor-collapsed'

const summaryFor = (activity: ActivityTelemetry) => activity.collapsedSummary ?? (activity.remainingMs === undefined ? activity.status.toUpperCase() : formatCompactDuration(activity.remainingMs))

export function ActivityMonitor() {
  const state = useGameStore()
  const activities = getActivityTelemetry(state)
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem(collapsedStorageKey) === 'true' } catch { return false }
  })
  const setScreen = useGameStore((current) => current.setScreen)
  const trackedItemId = useUiPreferences().trackedItemId

  useEffect(() => {
    try { window.localStorage.setItem(collapsedStorageKey, String(collapsed)) } catch { /* storage is optional */ }
  }, [collapsed])

  const pinnedTransmutation = <PinnedTransmutationTracker />
  const tracked = <TrackedItemMonitor itemId={trackedItemId} />
  if (!activities.length) return <>{tracked}{pinnedTransmutation}</>
  if (collapsed) {
    return <>{tracked}{pinnedTransmutation}<aside className={`activity-monitor activity-monitor-collapsed${trackedItemId ? ' has-tracked-item' : ''}`} aria-label="Activity Monitor">
      <div className="activity-monitor-collapsed-head"><strong>{activities.length} ACTIVE</strong><GameTooltip content="Expand Activity Monitor"><button onClick={() => setCollapsed(false)} aria-label="Expand Activity Monitor"><ChevronUp size={14} /></button></GameTooltip></div>
      <div className="activity-monitor-mini-list">
        {activities.slice(0, 2).map((activity) => <GameTooltip block content={<TooltipContent title={activity.label} description={`Open ${activity.label} to manage this activity.`} />} accent={activity.accent === 'red' ? 'danger' : activity.accent === 'orange' ? 'warning' : activity.accent === 'gold' ? 'mana' : 'neutral'} key={activity.id}><button className={`activity-mini-summary accent-${activity.accent}`} onClick={() => setScreen(activity.screen)}><strong>{activity.label}</strong><span>{summaryFor(activity)}</span></button></GameTooltip>)}
      </div>
      {activities.length > 2 && <small className="activity-monitor-more">+{activities.length - 2} more active</small>}
    </aside></>
  }

  return <>{tracked}{pinnedTransmutation}<aside className={`activity-monitor${trackedItemId ? ' has-tracked-item' : ''}`} aria-label="Activity Monitor">
    <div className="activity-monitor-header"><span>ACTIVITY MONITOR · {activities.length} ACTIVE</span><GameTooltip content="Collapse Activity Monitor"><button onClick={() => setCollapsed(true)} aria-label="Collapse Activity Monitor"><ChevronDown size={14} /></button></GameTooltip></div>
    <div className="activity-monitor-track">{activities.map((activity) => <GameTooltip block content={<TooltipContent title={activity.label} description={`Open ${activity.label} to manage this activity.`} />} accent={activity.accent === 'red' ? 'danger' : activity.accent === 'orange' ? 'warning' : activity.accent === 'gold' ? 'mana' : 'neutral'} key={activity.id}><ActivityCard activity={activity} onClick={() => setScreen(activity.screen)} /></GameTooltip>)}</div>
  </aside></>
}

function PinnedTransmutationTracker() {
  const state = useGameStore()
  const pinnedId = useUiPreferences().screenState.transmutation.pinnedRecipeId
  if (!pinnedId) return null
  const recipe = TRANSMUTATION_RECIPES[pinnedId]
  const echoes = getTransmutationJob(state, pinnedId)?.echoesAssigned ?? 0
  return <aside className="transmutation-pinned-tracker" aria-label="Pinned Transmutation recipe"><button type="button" onClick={() => { setNavigationIntent({ transmutationRecipeId: pinnedId }); state.setScreen('tower-transmutation') }}><strong>PINNED · {recipe.name}</strong><span>{echoes > 0 ? `${echoes} ECHO${echoes === 1 ? '' : 'ES'} ASSIGNED` : 'READY TO START'}</span></button></aside>
}

function TrackedItemMonitor({ itemId }: { itemId: ItemId | null }) {
  const state = useGameStore()
  const { openContextMenu } = useGameContextMenu()
  const [usesOpen, setUsesOpen] = useState(false)
  if (!itemId || !ITEMS[itemId]) return null
  const item = ITEMS[itemId]
  const owned = state.inventory[itemId] ?? 0
  const drop = getItemDropSources(itemId)[0]
  const output = getItemSources(itemId).find((relation) => relation.kind === 'recipe' && relation.detail.endsWith('output'))
  const uses = getItemUses(itemId)
  const openInventory = () => { setNavigationIntent({ inventoryItemId: itemId }); state.setScreen('inventory') }
  const sections = buildItemContextSections({ itemId, owned, tracked: true, source: 'reference', onOpenInventory: openInventory, onWhereToGet: drop ? () => { setNavigationIntent({ combatDungeonId: drop.dungeonId, combatMonsterId: drop.monsterId }); state.setScreen('combat') } : undefined, onOpenUses: uses.length > 0 ? () => setUsesOpen(true) : undefined, onOpenArtificing: output?.detail === 'Artificing output' ? () => { setUiPreferences({ screenState: { artificing: { selectedRecipeId: output.id as never } } }); state.setScreen('tower-artificing') } : undefined, onOpenTransmutation: output?.detail === 'Transmutation output' ? () => { setUiPreferences({ screenState: { transmutation: { selectedRecipeId: output.id as never } } }); state.setScreen('tower-transmutation') } : undefined, onTrack: () => setUiPreferences({ trackedItemId: null }) })
  return <><aside className="tracked-item-monitor" aria-label="Tracked Item"><button type="button" className="tracked-item-monitor-main" onClick={openInventory} onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); openContextMenu({ x: event.clientX, y: event.clientY, anchor: event.currentTarget, header: { title: item.name, meta: `TRACKED · OWNED ${owned}` }, sections }) }}><span className="tracked-item-monitor-label">TRACKED ITEM</span><span className="tracked-item-monitor-value"><ItemIcon itemId={itemId} size="tiny" /><strong>{item.name}</strong><b>×{owned.toLocaleString()}</b></span></button><button type="button" className="tracked-item-monitor-remove" onClick={() => setUiPreferences({ trackedItemId: null })} aria-label={`Untrack ${item.name}`}>×</button></aside><ItemUsesDialog itemId={itemId} uses={uses} open={usesOpen} onClose={() => setUsesOpen(false)} onSelectRecipe={(recipeId) => { setUsesOpen(false); if (isTransmutationRecipeId(recipeId)) { setNavigationIntent({ transmutationRecipeId: recipeId }); state.setScreen('tower-transmutation') } else { setNavigationIntent({ artificingRecipeId: recipeId as never }); state.setScreen('tower-artificing') } }} /></>
}

function ActivityCard({ activity, onClick }: { activity: ActivityTelemetry; onClick: () => void }) {
  const statusLabel = activity.status === 'waiting-mana' ? 'WAITING FOR MANA' : activity.status === 'mana-limited' ? 'MANA LIMITED' : activity.status === 'waiting-materials' ? 'WAITING FOR MATERIALS' : activity.id === 'combat' && activity.status === 'paused' ? 'NEXT ENCOUNTER' : activity.status.toUpperCase()
  const progressLabel = activity.id === 'combat' ? 'Enemy HP' : activity.remainingMs === undefined ? '' : formatCompactDuration(activity.remainingMs)
  return <button className={`activity-card accent-${activity.accent} ${activity.status === 'waiting-mana' || activity.status === 'mana-limited' || activity.status === 'waiting-materials' ? 'activity-waiting' : ''}`} onClick={onClick} aria-label={`Open ${activity.label} activity`}>
    <div className="activity-card-head"><div><strong>{activity.label}</strong><span>{activity.subtitle}</span></div><small>{statusLabel}</small></div>
    {activity.bars?.length ? <div className="activity-bars">{activity.bars.map((bar) => <div className={`activity-bar-row ${bar.tone ?? 'neutral'}`} key={bar.label}><div className="activity-bar-label"><span>{bar.label}</span><b>{bar.value}</b></div><div className="activity-progress"><i style={{ width: `${Math.max(0, Math.min(100, bar.percent))}%` }} /></div></div>)}</div> : activity.progressPercent !== undefined && <div className="activity-progress-row"><div className="activity-progress"><i style={{ width: `${Math.max(0, Math.min(100, activity.progressPercent))}%` }} /></div><span>{progressLabel}</span></div>}
    <div className="activity-card-metrics">{activity.metrics.map((item, index) => <span className={item.tone ?? 'neutral'} key={`${item.label}-${index}`}><small>{item.label}</small><b>{item.value}</b></span>)}</div>
  </button>
}
