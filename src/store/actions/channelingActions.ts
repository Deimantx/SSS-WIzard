import { CHANNELING_DISCOVERIES } from '../../game/content/channeling/channelingDiscoveries'
import { MANA_PILLARS, getManaPillarLevelCost } from '../../game/content/channeling/manaPillars'
import { BALANCE } from '../../game/core/balance/balance'
import { ITEMS } from '../../game/content/items/items'
import { checkChannelingDiscoveries } from '../../game/engine/channelingEngine'
import { canReserveFocus as canReserveFocusNormal, pushNotification, recalculateDerivedStats } from '../../game/engine'
import type { ChannelingDiscoveryId, GameState, ManaPillarId } from '../../game/types'
import { clamp } from '../../game/utils'

const isProtected = (state: GameState, itemId: keyof GameState['inventory']) => Boolean(state.protectedItems[itemId]) || Object.values(state.equipment).includes(itemId)
const canReserveFocus = (state: GameState, amount: number) => state.debug.allowFocusOverCap || canReserveFocusNormal(state, amount)
const announceDiscoveries = (state: GameState, ids: ChannelingDiscoveryId[]) => ids.forEach((id) => { const discovery = CHANNELING_DISCOVERIES.find((entry) => entry.id === id); if (discovery) pushNotification(state, `Arcane Discovery: ${discovery.name}`, 'success') })

export const setChannelingEchoesAction = (state: GameState, amount: number, force = false) => {
  const upper = force && state.debug.ignoreEchoLimit ? 1_000_000_000 : BALANCE.channeling.maxEchoes
  state.activities.channeling.echoesAssigned = clamp(Math.round(amount), 0, upper)
}

export const upgradeManaPillarAction = (state: GameState, pillarId: ManaPillarId) => {
  const pillar = MANA_PILLARS[pillarId]
  const currentLevel = state.progress.channeling.pillars[pillarId].level
  const nextLevel = currentLevel + 1
  if (currentLevel >= pillar.maxLevel) { pushNotification(state, `${pillar.name} is already mastered`, 'warning'); return }
  const cost = getManaPillarLevelCost(nextLevel)
  if (!cost) return
  const requiredItems = [...pillar.fragmentRequirements, 'life-essence' as const]
  const blocked = requiredItems.find((itemId) => isProtected(state, itemId))
  if (blocked) { pushNotification(state, `Upgrade blocked. ${ITEMS[blocked].name} is protected.`, 'warning'); return }
  const missing = requiredItems.find((itemId) => (state.inventory[itemId] ?? 0) < (itemId === 'life-essence' ? cost.lifeEssence : cost.fragment))
  if (missing) { pushNotification(state, `Not enough ${ITEMS[missing].name}. Need ${missing === 'life-essence' ? cost.lifeEssence : cost.fragment}.`, 'warning'); return }
  pillar.fragmentRequirements.forEach((itemId) => { state.inventory[itemId] = (state.inventory[itemId] ?? 0) - cost.fragment })
  state.inventory['life-essence'] = (state.inventory['life-essence'] ?? 0) - cost.lifeEssence
  state.progress.channeling.pillars[pillarId].level = nextLevel
  recalculateDerivedStats(state)
  const discoveries = checkChannelingDiscoveries(state)
  pushNotification(state, nextLevel === pillar.maxLevel ? `${pillar.name} mastered Rank I` : `${pillar.name} reached Level ${nextLevel}`, 'success')
  announceDiscoveries(state, discoveries)
  if (discoveries.includes('deep-reservoir')) recalculateDerivedStats(state)
}

export const setManaPillarLevelAction = (state: GameState, pillarId: ManaPillarId, level: number) => {
  state.progress.channeling.pillars[pillarId].rank = 1
  state.progress.channeling.pillars[pillarId].level = clamp(Math.round(level), 0, MANA_PILLARS[pillarId].maxLevel)
  recalculateDerivedStats(state)
  const discoveries = checkChannelingDiscoveries(state)
  announceDiscoveries(state, discoveries)
  if (discoveries.includes('deep-reservoir')) recalculateDerivedStats(state)
}

export const setChannelingManaGeneratedAction = (state: GameState, amount: number) => {
  state.progress.channeling.totalManaGenerated = Math.max(0, amount)
  const discoveries = checkChannelingDiscoveries(state)
  announceDiscoveries(state, discoveries)
  if (discoveries.includes('deep-reservoir')) recalculateDerivedStats(state)
}

export const setChannelingSustainAction = (state: GameState, amount: number) => {
  state.progress.channeling.fiveEchoSustainMs = Math.max(0, amount)
  announceDiscoveries(state, checkChannelingDiscoveries(state))
}

export const setChannelingDiscoveryAction = (state: GameState, id: ChannelingDiscoveryId, completed: boolean) => {
  state.progress.channeling.discoveries[id] = completed
  recalculateDerivedStats(state)
}

export const canStartChannelingAction = canReserveFocus
