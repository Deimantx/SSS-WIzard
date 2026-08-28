import { completionPercent } from '../../game/systems/archive/archiveSelectors'

export function ArchiveProgressTile({ label, discovered, total }: { label: string; discovered: number; total: number }) {
  const percent = completionPercent(discovered, total)
  const empty = total <= 0
  return <div className={`archive-progress-tile${empty ? ' empty' : ''}`}><div className="archive-progress-tile-head"><span>{label}</span><strong>{discovered} / {total}</strong></div><div className="archive-progress-track" role="progressbar" aria-label={`${label} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={empty ? 0 : percent}><i style={{ width: `${percent}%` }} /></div><small>{empty ? '—' : `${percent}%`}</small></div>
}
