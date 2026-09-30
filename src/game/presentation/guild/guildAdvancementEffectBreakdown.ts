import { GUILD_SKILL_NODES, type GuildAdvancementEffectValue } from '../../content/guild/guildSkills'
import type { GameState, GuildSkillNodeId } from '../../types'

export interface GuildAdvancementEffectBreakdown {
  tileEffect: string
  perRank: string | null
  currentEffect: string
  nextEffect: string
  maximumEffect: string
  rankRows: Array<{ rank: number; label: string; active: boolean }>
  notes: string[]
}

const percent = (value: number) => `${(Math.abs(value) * 100).toFixed(Number.isInteger(Math.abs(value) * 100) ? 0 : 2).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1')}%`
const formatEffect = (effect: GuildAdvancementEffectValue) => {
  if (effect.stat === 'early-quality-access') return 'Special and Prestigious Commission access one Standing tier earlier'
  if (effect.stat.endsWith('reduction')) return `-${percent(effect.amount)} ${effect.label}`
  if (effect.stat === 'commission-choice' || effect.stat === 'bonus-acolyte') return `+${effect.amount} ${effect.label}`
  return `+${percent(effect.amount)} ${effect.label}`
}

const effectAtRank = (nodeId: GuildSkillNodeId, rank: number) => {
  const node = GUILD_SKILL_NODES[nodeId]
  const effects = node.effectValues ?? []
  if (rank <= 0) return []
  if (effects.some((effect) => effect.stat === 'early-quality-access')) return [formatEffect(effects[0])]
  return effects.map((effect) => formatEffect({ ...effect, amount: effect.amount * rank }))
}

export const getGuildAdvancementEffectBreakdown = (state: Pick<GameState, 'progress'>, nodeId: GuildSkillNodeId): GuildAdvancementEffectBreakdown | null => {
  const node = GUILD_SKILL_NODES[nodeId]
  if (!node || node.legacy) return null
  const rank = Math.max(0, Math.min(node.maxRank, Math.floor(state.progress.guildSkillNodeRanks[nodeId] ?? 0)))
  const current = effectAtRank(nodeId, rank)
  const next = effectAtRank(nodeId, Math.min(node.maxRank, rank + 1))
  const maximum = effectAtRank(nodeId, node.maxRank)
  const perRankEffects = (node.effectValues ?? []).map((effect) => formatEffect(effect))
  const perRank = node.maxRank > 1 && perRankEffects.length ? perRankEffects.map((effect) => `${effect} / rank`).join('\n') : null
  const tileEffect = perRank ?? maximum.join('\n')
  const rankRows = Array.from({ length: node.maxRank }, (_, index) => ({ rank: index + 1, label: effectAtRank(nodeId, index + 1).join('\n'), active: index < rank }))
  return {
    tileEffect,
    perRank,
    currentEffect: current.length ? current.join('\n') : 'Not active',
    nextEffect: rank >= node.maxRank ? 'Maximum rank reached' : next.join('\n'),
    maximumEffect: maximum.length ? maximum.join('\n') : 'No effect authored',
    rankRows,
    notes: [...(node.ruleNotes ?? [])],
  }
}
