import { SIGIL_SETS } from '../../game/content/sigils/sigilSets'
import { SIGIL_STAT_DEFINITIONS } from '../../game/content/sigils/sigilStats'
import { SIGIL_TRAITS } from '../../game/content/sigils/sigilTraits'
import { getEquippedSigilSetCounts, resolveSigilStatsForInstance } from '../../game/systems/sigils/sigilRuntime'
import { formatSigilStatValue } from '../../game/presentation/sigils/sigilEquipmentReadModel'
import type { GameState, SigilInstance } from '../../game/types'

export function SigilComparison({ current, candidate, state }: { current: SigilInstance; candidate: SigilInstance; state: Pick<GameState, 'sigils'> }) {
  const currentStats = resolveSigilStatsForInstance(current)
  const candidateStats = resolveSigilStatsForInstance(candidate)
  const statIds = [...new Set([...Object.keys(currentStats), ...Object.keys(candidateStats)])] as Array<keyof typeof SIGIL_STAT_DEFINITIONS>
  const rows = statIds.map((id) => ({ id, before: currentStats[id] ?? 0, after: candidateStats[id] ?? 0 })).filter((row) => row.before !== row.after)
  const beforeSets = getEquippedSigilSetCounts(state)
  const afterSets = { ...beforeSets }
  afterSets[current.setId] = Math.max(0, (afterSets[current.setId] ?? 0) - 1)
  afterSets[candidate.setId] = (afterSets[candidate.setId] ?? 0) + 1
  const setIds = [...new Set([current.setId, candidate.setId])]
  const traits = [...candidate.traitIds.filter((id) => !current.traitIds.includes(id)).map((id) => ({ id, added: true })), ...current.traitIds.filter((id) => !candidate.traitIds.includes(id)).map((id) => ({ id, added: false }))]
  return <section className="sigil-comparison-card">
    <div className="eyebrow">CURRENT vs CANDIDATE</div>
    <div className="sigil-comparison-identity"><span>{SIGIL_SETS[current.setId].name} · +{current.rank}</span><span>{SIGIL_SETS[candidate.setId].name} · +{candidate.rank}</span></div>
    <div className="sigil-comparison-rows">{rows.length ? rows.map(({ id, before, after }) => <div className="sigil-comparison-row" key={id}><span>{SIGIL_STAT_DEFINITIONS[id].label}</span><small>{formatSigilStatValue(id, before)}</small><small>{formatSigilStatValue(id, after)}</small><b className={after > before ? 'positive' : 'negative'}>{formatSigilStatValue(id, after - before, true)}</b></div>) : <small>Matching stat values.</small>}</div>
    <div className="sigil-comparison-sets">{setIds.map((id) => {
      const before = beforeSets[id] ?? 0
      const after = afterSets[id] ?? 0
      const required = SIGIL_SETS[id].piecesRequired
      const wasActive = before >= required
      const active = after >= required
      return <span key={id} className={wasActive !== active ? 'changed' : ''}>{SIGIL_SETS[id].name}: {before} → {after}{wasActive !== active ? active ? ' · ACTIVE' : ' · LOST' : ''}</span>
    })}{traits.map(({ id, added }) => <span key={id} className="trait-change">{added ? '+' : '−'} {SIGIL_TRAITS[id].name}</span>)}</div>
  </section>
}
