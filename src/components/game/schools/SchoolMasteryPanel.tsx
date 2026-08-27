import { Card, Progress } from '../../ui'
import { getSchoolMasterySummary } from '../../../game/systems/schools'
import { formatNumber } from '../../../game/utils'
import { useGameStore } from '../../../store/gameStore'
import { SchoolProgressSummary } from './SchoolProgressSummary'

export function SchoolMasteryPanel({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const schools = useGameStore((state) => state.schools)
  const progress = useGameStore((state) => state.progress)
  const summary = getSchoolMasterySummary({ schools, progress })
  const cap = summary.schools[0]?.cap ?? 0
  return <Card className={`school-mastery-panel ${className}`} title="MAGIC SCHOOL MASTERY" action={<span className="school-mastery-total">{compact ? 'CAP' : 'CURRENT CAP'} {formatNumber(cap)}</span>}><p className="school-mastery-intro">Every school shares the current ceiling. Research fills the path you choose.</p><div className="school-mastery-grid">{summary.schools.map((info) => <SchoolProgressSummary key={info.schoolId} info={info} />)}</div><div className="school-mastery-footer"><div className="school-mastery-footer-head"><span>TOTAL MASTERY</span><strong>{formatNumber(summary.totalLevels)} / {formatNumber(summary.maximumLevels)}</strong><span>{Math.round(summary.ratio * 100)}% · {summary.cappedSchools} / {summary.schoolCount} at cap</span></div><Progress value={summary.ratio * 100} tone="violet" /></div></Card>
}
