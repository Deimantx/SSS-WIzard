import { recalculateDerivedStats } from '../../game/engine'
import type { GameState } from '../../game/types'
import packageMetadata from '../../../package.json'
import { createInitialState } from '../../store/initialState'
import { useGameStore } from '../../store/gameStore'
import { ensureDeveloperSandbox } from '../developerSandbox'
import { HUNTER_RANKS } from '../../game/content/hunters-order/hunterRanks'
import { GUILD_RANK_BY_ID } from '../../game/content/guild/guildRanks'
import { DUNGEONS } from '../../game/content/combat-locations/dungeons/dungeons'
import { MONSTERS } from '../../game/content/monsters'
import { validateDeveloperScenario } from './customScenarioSchema'
import type { DeveloperScenarioDraft, DeveloperScenarioRecord, DeveloperScenarioSummary } from './customScenarioTypes'

const newId = () => globalThis.crypto?.randomUUID?.() ?? `scenario-${Date.now()}-${Math.random().toString(36).slice(2)}`
const summarize = (state: GameState): DeveloperScenarioSummary => ({
  hunterRankLabel: HUNTER_RANKS.find((rank) => rank.id === state.progress.huntersOrder.rankId)?.name ?? 'Unranked Hunter',
  hunterReputation: state.progress.huntersOrder.reputation,
  guildRankLabel: GUILD_RANK_BY_ID[state.progress.guildRank]?.name ?? 'Unregistered',
  guildReputation: state.progress.guildReputation,
  activeDungeonLabel: state.combat.locationId ? DUNGEONS[state.combat.locationId]?.name ?? null : null,
  activeEnemyLabel: state.combat.enemyId ? MONSTERS[state.combat.enemyId]?.name ?? null : null,
  inventoryItemCount: Object.values(state.inventory).reduce((total, amount) => total + (amount ?? 0), 0),
  spellPresetCount: state.spellPresets.presets.length,
  offlineBankMs: state.offlineBankMs,
  combatActive: state.combat.active,
})

export const captureDeveloperScenario = (draft: DeveloperScenarioDraft, options: { includeCombat?: boolean; includeOfflineBank?: boolean } = {}): DeveloperScenarioRecord => {
  const live = useGameStore.getState()
  const keys = Object.keys(createInitialState()) as (keyof GameState)[]
  const state = structuredClone(Object.fromEntries(keys.map((key) => [key, live[key]]))) as unknown as GameState
  if (options.includeCombat === false) state.combat = createInitialState().combat
  if (options.includeOfflineBank === false) state.offlineBankMs = 0
  state.notifications = []
  return {
    id: newId(), name: draft.name.trim(), description: draft.description.trim(), tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))],
    createdAt: Date.now(), updatedAt: Date.now(), sourceAppVersion: packageMetadata.version, scenarioSchemaVersion: 1,
    snapshot: { gameState: state, viewContext: { screen: live.ui.screen }, summary: summarize(state) },
  }
}

export const duplicateDeveloperScenario = (record: DeveloperScenarioRecord, name = `${record.name} Copy`): DeveloperScenarioRecord => ({ ...structuredClone(record), id: newId(), name, createdAt: Date.now(), updatedAt: Date.now() })

export const runCustomDeveloperScenario = (record: DeveloperScenarioRecord) => {
  const validation = validateDeveloperScenario(record)
  if (!validation.ok) throw new Error(validation.reason)
  ensureDeveloperSandbox(`Custom Scenario · ${record.name}`)
  const next = structuredClone(record.snapshot.gameState)
  next.lastSavedAt = Date.now()
  next.notifications = [{ id: newId(), text: `Loaded scenario: ${record.name}`, tone: 'info', createdAt: Date.now() }]
  next.ui.screen = record.snapshot.viewContext.screen
  recalculateDerivedStats(next)
  useGameStore.setState(next)
}

export const exportDeveloperScenario = (record: DeveloperScenarioRecord) => {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const filename = (typeof record?.name === 'string' ? record.name : 'scenario').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'scenario'
  anchor.href = url; anchor.download = `${filename}.sss-scenario.json`; anchor.click()
  URL.revokeObjectURL(url)
}
