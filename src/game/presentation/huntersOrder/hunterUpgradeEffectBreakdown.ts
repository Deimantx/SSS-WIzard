import { HUNTER_UPGRADES } from '../../content/hunters-order/hunterUpgrades'
import { getHunterCompletionHarvestPreview, getHunterContractTargetReduction, getHunterBlockSlotCount, getHunterRerollMarkCost, getHunterSkipMarkCost, getHunterUpgradePurchaseStatus, getEligibleHunterContractMembers } from '../../systems/hunters-order/huntersOrderRuntime'
import type { GameState, HunterContractState, HunterContractTarget, HunterUpgradeId } from '../../types'
import type { DungeonStatisticsSession } from '../../telemetry/dungeon/dungeonStatisticsTypes'

export interface HunterUpgradeEffectBreakdown {
  summary: string
  perRank: string | null
  current: string[]
  next: string[]
  maximum: string[]
  rankRows: Array<{ rank: number; label: string; active: boolean }>
  notes: string[]
  tileEffect: string
}

type UpgradeDefinition = typeof HUNTER_UPGRADES[number]
const percent = (value: number) => `${Math.round(value * 100)}%`
const totalAtRank = (upgrade: UpgradeDefinition, rank: number) => upgrade.effect.rankAmounts
  ? upgrade.effect.rankAmounts.slice(0, rank).reduce((sum, value) => sum + value, 0)
  : (upgrade.effect.amount ?? 0) * rank

const stateAtRank = (state: Pick<GameState, 'progress'>, upgradeId: string, rank: number): Pick<GameState, 'progress'> => ({
  progress: {
    ...state.progress,
    huntersOrder: { ...state.progress.huntersOrder, purchasedUpgrades: { ...state.progress.huntersOrder.purchasedUpgrades, [upgradeId]: rank } },
  },
})

const directives = (id: string) => id === 'dispatch-directives'
  ? ['Preferred Contract Type selector', '2× preferred archetype generation weight', 'Guarantee one preferred-type offer when eligible']
  : id === 'priority-dispatch'
    ? ['Preferred Hunting Ground selector', '2× preferred Ground generation weight', 'Guarantee one preferred-Ground offer when eligible']
    : ['Prefer an unrepresented Ground when possible', 'On a 3-choice Board, prefer at least 2 Grounds', 'Distribute offers as evenly as eligible content allows']

const reductionProfiles = (upgrade: UpgradeDefinition): Array<{ type: HunterContractTarget['type']; tier: HunterContractState['tier']; label: string }> => {
  if (upgrade.id === 'trail-kit') return [
    { type: 'monster', tier: 'routine', label: 'Monster Contracts' },
    { type: 'family', tier: 'routine', label: 'Family Contracts' },
    { type: 'alignment', tier: 'routine', label: 'Alignment Contracts' },
    { type: 'region', tier: 'routine', label: 'Ground Patrol Contracts' },
  ]
  if (upgrade.id === 'exact-quarry-briefing') return [{ type: 'monster', tier: 'routine', label: 'Monster Contracts' }]
  if (upgrade.id === 'family-cull-orders') return [{ type: 'family', tier: 'routine', label: 'Family Contracts' }]
  if (upgrade.id === 'alignment-pursuit-orders') return [{ type: 'alignment', tier: 'routine', label: 'Alignment Contracts' }]
  if (upgrade.id === 'ground-patrol-orders') return [{ type: 'region', tier: 'routine', label: 'Ground Patrol Contracts' }]
  return [{ type: 'monster', tier: 'prestigious', label: 'Prestigious Contracts' }]
}

const effectAtRank = (state: Pick<GameState, 'progress'>, upgrade: UpgradeDefinition, rank: number) => {
  if (rank <= 0) return 'Not active'
  const effect = upgrade.effect
  const total = totalAtRank(upgrade, rank)
  if (effect.type.includes('target-reduction')) {
    return reductionProfiles(upgrade).map(({ type, tier, label }) => `${label} −${percent(getHunterContractTargetReduction(stateAtRank(state, upgrade.id, rank), type, tier))} target`).join(' · ')
  }
  if (effect.type === 'reroll-cost-reduction') return `${getHunterRerollMarkCost(stateAtRank(state, upgrade.id, rank))} Hunter Mark refresh cost`
  if (effect.type === 'skip-cost-reduction') return `${getHunterSkipMarkCost(stateAtRank(state, upgrade.id, rank))} Hunter Mark skip cost`
  if (effect.type === 'block-slots') return `${getHunterBlockSlotCount(stateAtRank(state, upgrade.id, rank))} Target Block slots total`
  if (effect.type === 'pin-slots') return `Pin up to ${total} Board offer${total === 1 ? '' : 's'}`
  if (['dispatch-directives', 'priority-dispatch', 'ground-survey'].includes(effect.type)) return directives(upgrade.id).slice(0, rank).join(' · ')
  if (effect.type === 'contract-recall') return `Retain up to ${rank} valid unchosen offer${rank === 1 ? '' : 's'} after completion`
  if (effect.type.includes('reputation-bonus')) return `${percent(total)} ${effect.type === 'reputation-bonus' ? 'all Contract' : effect.type.replace('-reputation-bonus', '')} Reputation bonus`
  if (effect.type === 'bonus-marks') return `+${total} Hunter Marks per completed Contract`
  if (effect.type === 'broad-bonus-marks') return `+${total} Marks on Family, Alignment, and Ground Patrol Contracts`
  if (effect.type === 'resonance-yield') return `+${percent(total)} Resonance from quarry that advances the active Contract`
  if (effect.type === 'essence-yield') return `+${percent(total)} Life Essence from qualifying Hunter quarry`
  if (effect.type === 'item-drop-multiplier') return `+${percent(total)} relative normal item drop chance`
  if (effect.type === 'sigil-drop-multiplier') return `+${percent(total)} relative Sigil drop chance`
  if (effect.type === 'completion-resonance') return 'Formula-based Resonance bonus on Contract completion'
  if (effect.type === 'completion-essence') return 'Formula-based Life Essence on Contract completion'
  if (effect.type === 'hunt-forecast') return 'Measured kills/hour and Contract completion estimate'
  if (effect.type === 'board-forecast') return 'Reputation per kill, Marks, eligible quarry, and measured ETA'
  if (effect.type === 'quarry-memory') return 'Remember the last explicitly selected eligible quarry per Ground'
  if (effect.type === 'master-dossier') return 'Reveal limited identity and Contract metadata for eligible quarry'
  return `${total} ${effect.type}`
}

const perRankDescription = (upgrade: UpgradeDefinition): string | null => {
  const effect = upgrade.effect
  if (effect.rankAmounts) return `${effect.rankAmounts.map((value) => effect.type.includes('percent') || effect.type.includes('bonus') || effect.type.includes('multiplier') || effect.type.includes('yield') ? percent(value) : `+${value}`).join(' / ')} by rank`
  if (effect.type === 'reroll-cost-reduction') return '−1 Hunter Mark refresh cost per rank'
  if (effect.type === 'skip-cost-reduction') return '−1 Hunter Mark skip cost per rank; runtime floor is 1 Mark'
  if (effect.type === 'block-slots') return '+1 Target Block slot per rank'
  if (effect.type === 'pin-slots') return '+1 pinned offer slot per rank'
  if (effect.type === 'contract-recall') return 'Retain one additional valid unchosen offer per rank'
  if (effect.type.includes('target-reduction')) return `−${percent(effect.amount ?? 0)} ${upgrade.id === 'trail-kit' ? 'supported Contract targets' : reductionProfiles(upgrade)[0]?.label ?? 'Contract targets'} per rank`
  if (effect.type.includes('reputation-bonus')) return `${percent(effect.amount ?? 0)} Reputation per rank`
  if (effect.type === 'bonus-marks') return `+${effect.amount ?? 0} Mark per completed Contract and rank`
  if (effect.type === 'broad-bonus-marks') return `+${effect.amount ?? 0} Mark per eligible broad Contract and rank`
  if (effect.type === 'resonance-yield') return `${percent(effect.amount ?? 0)} Resonance per rank`
  if (effect.type === 'essence-yield') return `${percent(effect.amount ?? 0)} Life Essence per rank`
  if (effect.type === 'item-drop-multiplier') return `${percent(effect.amount ?? 0)} relative item drop chance per rank`
  if (effect.type === 'sigil-drop-multiplier') return `${percent(effect.amount ?? 0)} relative Sigil chance per rank`
  return null
}

const contractPreviewNotes = (state: Pick<GameState, 'progress'>, upgradeId: string, contract?: HunterContractState): string[] => {
  const notes: string[] = []
  if (upgradeId === 'resonant-completion') {
    notes.push('Formula: round(dominant Resonance per kill × max(1, Contract target / 100) × quality scale × rank × 0.10).')
    if (contract) {
      const monsterId = getEligibleHunterContractMembers(state, contract, contract.huntingGroundId ?? 'hunters-ground')[0]
      const preview = monsterId ? getHunterCompletionHarvestPreview(state, contract, monsterId).resonance : null
      if (preview) notes.push(`Current Contract preview · +${preview.amount} ${preview.type[0].toUpperCase()}${preview.type.slice(1)} Resonance on completion, using ${monsterId} as the closing quarry.`)
    }
  }
  if (upgradeId === 'essence-completion') {
    notes.push('Formula: max(1, floor(Contract target / 25) × quality scale × rank).')
    if (contract) {
      const monsterId = getEligibleHunterContractMembers(state, contract, contract.huntingGroundId ?? 'hunters-ground')[0]
      const preview = monsterId ? getHunterCompletionHarvestPreview(state, contract, monsterId).lifeEssence : 0
      if (preview > 0) notes.push(`Current Contract preview · +${preview} Life Essence on completion.`)
    }
  }
  if (['trail-kit', 'exact-quarry-briefing', 'family-cull-orders', 'alignment-pursuit-orders', 'ground-patrol-orders', 'prestigious-preparation'].includes(upgradeId)) notes.push('Stacks with other Contract target reductions. Combined cap: 25%.')
  if (upgradeId === 'fragment-rights') notes.push('Relative chance multiplier, not percentage points. Example: 20% base × 1.15 = 23% final chance.')
  if (upgradeId === 'sigil-claim') notes.push('Relative chance multiplier, not percentage points.')
  if (['resonant-claim', 'essence-claim', 'fragment-rights', 'sigil-claim'].includes(upgradeId)) notes.push('Only applies to quarry that can advance the active Contract.')
  if (upgradeId === 'contract-recall') notes.push('Retains valid, unchosen offers only; at most two unchosen offers remain after acceptance.')
  if (upgradeId === 'priority-dispatch' || upgradeId === 'ground-survey') notes.push('Requires at least two enabled authored Hunting Grounds.')
  return notes
}

export function getHunterUpgradeEffectBreakdown(state: Pick<GameState, 'progress'>, upgradeId: HunterUpgradeId | string, contract?: HunterContractState): HunterUpgradeEffectBreakdown | null {
  const upgrade = HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return null
  const ownedRank = getHunterUpgradePurchaseStatus(state, upgrade.id).ownedRank
  const rankRows = Array.from({ length: upgrade.maxRank }, (_, index) => {
    const rank = index + 1
    return { rank, label: effectAtRank(state, upgrade, rank), active: ownedRank >= rank }
  })
  const stepped = ['dispatch-directives', 'priority-dispatch', 'ground-survey'].includes(upgrade.effect.type)
  const current = ownedRank === 0 ? ['Not active'] : stepped ? [rankRows[ownedRank - 1]?.label ?? 'Not active'] : [effectAtRank(state, upgrade, ownedRank)]
  const next = ownedRank >= upgrade.maxRank ? ['Maximum rank reached'] : [`Rank ${ownedRank + 1} · ${effectAtRank(state, upgrade, ownedRank + 1)}`]
  const maximum = [effectAtRank(state, upgrade, upgrade.maxRank)]
  const effect = upgrade.effect
  const tileEffect = (() => {
    if (effect.type.includes('target-reduction')) return `-${percent(effect.amount ?? 0)} quota / rank`
    if (effect.type === 'bonus-marks') return `+${effect.amount ?? 0} Mark / rank`
    if (effect.type === 'broad-bonus-marks') return `+${effect.amount ?? 0} Mark / broad Contract`
    if (['dispatch-directives', 'priority-dispatch', 'ground-survey'].includes(effect.type)) return 'Board targeting controls'
    if (effect.type === 'reroll-cost-reduction') return '-1 Mark refresh cost / rank'
    if (effect.type === 'skip-cost-reduction') return '-1 Mark skip cost / rank'
    if (effect.type === 'block-slots') return '+1 Target Block / rank'
    if (effect.type === 'pin-slots') return '+1 pinned offer / rank'
    if (effect.type === 'contract-recall') return 'Retain +1 offer / rank'
    if (effect.type === 'item-drop-multiplier') return `+${percent(effect.amount ?? 0)} relative item chance / rank`
    if (effect.type === 'sigil-drop-multiplier') return `+${percent(effect.amount ?? 0)} relative Sigil chance / rank`
    if (effect.type === 'resonance-yield') return `+${percent(effect.amount ?? 0)} Resonance / rank`
    if (effect.type === 'essence-yield') return `+${percent(effect.amount ?? 0)} Life Essence / rank`
    if (effect.type === 'completion-resonance') return 'Formula-based Resonance / completion / rank'
    if (effect.type === 'completion-essence') return 'Formula-based Life Essence / completion / rank'
    return upgrade.maxRank === 1 ? effectAtRank(state, upgrade, 1) : `${percent(effect.amount ?? 0)} effect / rank`
  })()
  return { summary: upgrade.description, perRank: perRankDescription(upgrade) ?? (upgrade.maxRank === 1 ? rankRows[0]?.label ?? null : 'Unlocks cumulative rank effects'), current, next, maximum, rankRows, notes: contractPreviewNotes(state, upgrade.id, contract), tileEffect }
}

export function getHunterForecastPresentation(state: Pick<GameState, 'progress'>, session: DungeonStatisticsSession | null | undefined, contract: HunterContractState | null) {
  if (!contract || !session || session.locationId !== (contract.huntingGroundId ?? 'hunters-ground')) return null
  const eligible = getEligibleHunterContractMembers(state, contract, contract.huntingGroundId ?? 'hunters-ground')
  const samples = session.hunterEncounterSamplesByMonster ?? {}
  const sample = eligible.reduce((total, monsterId) => {
    const entry = samples[monsterId]
    return entry ? { kills: total.kills + entry.kills, combatMs: total.combatMs + entry.combatMs } : total
  }, { kills: 0, combatMs: 0 })
  if (sample.kills < 3 || sample.combatMs <= 0) return { ...sample, averageKillMs: null, killsPerHour: null, etaMs: null }
  const killsPerHour = sample.kills / (sample.combatMs / 3_600_000)
  return { ...sample, averageKillMs: sample.combatMs / sample.kills, killsPerHour, etaMs: Math.max(0, contract.target - contract.progress) / killsPerHour * 3_600_000 }
}

export const getHunterUpgradePresentation = (state: Pick<GameState, 'progress'>, upgradeId: HunterUpgradeId | string, contract?: HunterContractState) => {
  const status = getHunterUpgradePurchaseStatus(state, upgradeId)
  const upgrade = status.upgrade ?? HUNTER_UPGRADES.find((entry) => entry.id === upgradeId)
  if (!upgrade) return null
  const breakdown = getHunterUpgradeEffectBreakdown(state, upgrade.id, contract)!
  return { ...status, upgrade, maxed: status.ownedRank >= upgrade.maxRank, breakdown, currentEffect: breakdown.current.join(' · '), nextEffect: breakdown.next.join(' · '), maximumEffect: breakdown.maximum.join(' · ') }
}
