import { SCHOOLS } from '../../../game/content/schools/schools'
import type { SchoolProgressInfo } from '../../../game/systems/schools'
import { formatNumber } from '../../../game/utils'
import { GameTooltip, Progress } from '../../ui'
import { TooltipContent } from '../../ui/tooltip/Tooltip'

export function SchoolProgressSummary({ info, compact = false }: { info: SchoolProgressInfo; compact?: boolean }) {
  const school = SCHOOLS[info.schoolId]
  const levelText = `Lv ${info.level} / ${info.cap}`
  const progressText = info.atCap ? 'CAP' : `${Math.round(info.progress * 100)}%`
  const tooltip = <TooltipContent title={`${school.name} mastery`} description={info.atCap ? `${school.name} is at the current Magic School cap.` : `${formatNumber(info.xpIntoLevel)} of ${formatNumber(info.xpRequiredForLevel ?? 0)} XP toward Level ${info.level + 1}.`} />
  return <GameTooltip block content={tooltip} accent="elemental"><div className={`school-progress-summary ${compact ? 'compact' : ''}`} style={{ '--school-color': school.color } as React.CSSProperties}><div className="school-progress-summary-head"><span className="school-progress-glyph">{school.glyph}</span><strong>{school.name}</strong><small>{levelText}</small></div><Progress value={info.progress * 100} tone={info.schoolId} /><div className="school-progress-summary-foot"><span>{info.atCap ? 'AT CAP' : `${formatNumber(info.xpIntoLevel)} / ${formatNumber(info.xpRequiredForLevel ?? 0)} XP`}</span><strong>{progressText}</strong></div></div></GameTooltip>
}
