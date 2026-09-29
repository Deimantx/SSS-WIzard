import { DUNGEONS } from '../../content/dungeons/dungeons'
import { MONSTERS } from '../../content/monsters'
import { doesMonsterMatchHunterContract, getHunterContractTargetLabel } from '../../systems/huntersOrder/huntersOrderRuntime'
import type { DungeonId, GameState, HunterContractState, MonsterId } from '../../types'

export type HunterContractMonsterRelation = 'exact-target' | 'eligible' | 'not-eligible' | 'no-contract'

export function getMonsterHunterContractRelation(state: Pick<GameState, 'progress'>, monsterId: MonsterId, dungeonId: DungeonId): HunterContractMonsterRelation {
  const metadata = MONSTERS[monsterId]?.hunter
  if (!metadata?.exclusive || metadata.huntingGroundId !== dungeonId) return 'not-eligible'
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return 'no-contract'
  if (!doesMonsterMatchHunterContract(contract, monsterId, dungeonId)) return 'not-eligible'
  return contract.targetSpec.type === 'monster' ? 'exact-target' : 'eligible'
}

export function resolvePreferredHunterContractMonster(state: Pick<GameState, 'progress' | 'combat' | 'ui'>): MonsterId | null {
  const contract = state.progress.huntersOrder.activeContract
  if (!contract) return null
  const roster = DUNGEONS['hunters-ground'].monsterPool
  const matches = roster.filter((monsterId) => doesMonsterMatchHunterContract(contract, monsterId, 'hunters-ground')) as MonsterId[]
  if (!matches.length) return null
  const currentTarget = state.combat.targetEnemyId
  const wasAtGloamridge = state.combat.dungeonId === 'hunters-ground' || state.ui.lastEnteredCombatDungeonId === 'hunters-ground'
  return wasAtGloamridge && currentTarget && matches.includes(currentTarget) ? currentTarget : matches[0]
}

export function getHunterContractCombatPresentation(state: Pick<GameState, 'progress' | 'combat' | 'ui'>) {
  const contract = state.progress.huntersOrder.activeContract
  const matchingMonsterIds: MonsterId[] = contract
    ? DUNGEONS['hunters-ground'].monsterPool.filter((id) => doesMonsterMatchHunterContract(contract, id, 'hunters-ground'))
    : []
  return {
    active: Boolean(contract),
    contract,
    label: contract ? getHunterContractTargetLabel(contract) : 'None',
    archetypeLabel: contract ? contract.targetSpec.type === 'monster' ? 'HUNT' : contract.targetSpec.type === 'family' ? 'CULL' : contract.targetSpec.type === 'alignment' ? 'PURSUE' : 'PATROL' : null,
    progress: contract?.progress ?? 0,
    target: contract?.target ?? 0,
    remaining: contract ? Math.max(0, contract.target - contract.progress) : 0,
    rewardReputation: contract?.reputationReward ?? 0,
    rewardMarks: contract?.marksReward ?? 0,
    matchingMonsterIds,
    preferredMonsterId: contract ? resolvePreferredHunterContractMonster(state) : null,
    relationFor: (monsterId: MonsterId, dungeonId: DungeonId) => getMonsterHunterContractRelation(state, monsterId, dungeonId),
  }
}

export function getHunterContractEligibleCount(contract: HunterContractState | null) {
  return contract ? DUNGEONS['hunters-ground'].monsterPool.filter((id) => doesMonsterMatchHunterContract(contract, id, 'hunters-ground')).length : 0
}
