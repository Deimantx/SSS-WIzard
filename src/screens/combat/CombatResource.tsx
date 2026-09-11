import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'

export type CombatResourceTone = 'health' | 'mana' | 'barrier'
export type CombatResourceFeedback = 'damage' | 'heal' | 'mana-spend' | 'mana-gain' | 'barrier-gain' | 'barrier-absorb' | 'barrier-break'

interface CombatResourceProps {
  icon: ReactNode
  label: string
  value: string
  percent: number
  tone: CombatResourceTone
  currentValue?: number
  maxValue?: number
  previousValue?: number
  feedback?: CombatResourceFeedback
}

const feedbackDurationMs = 360

export function CombatResource({ icon, label, value, percent, tone, currentValue, maxValue, previousValue, feedback }: CombatResourceProps) {
  const measuredValue = currentValue ?? percent
  const previousMeasuredValue = previousValue ?? measuredValue
  const previousRef = useRef(previousMeasuredValue)
  const [activeFeedback, setActiveFeedback] = useState<CombatResourceFeedback | null>(null)
  const [trailPercent, setTrailPercent] = useState<number | null>(null)
  const [gainRegion, setGainRegion] = useState<{ start: number; end: number } | null>(null)
  const normalizedPercent = Math.max(0, Math.min(100, percent))
  const normalizedMax = Math.max(1, maxValue ?? 100)
  useEffect(() => {
    const previous = previousValue ?? previousRef.current
    const nextFeedback = feedback ?? inferFeedback(tone, previous, measuredValue)
    if (previous !== measuredValue && nextFeedback) {
      setActiveFeedback(nextFeedback)
      const previousPercent = Math.max(0, Math.min(100, previous / normalizedMax * 100))
      const nextPercent = Math.max(0, Math.min(100, measuredValue / normalizedMax * 100))
      const gain = nextFeedback === 'heal' || nextFeedback === 'mana-gain' || nextFeedback === 'barrier-gain'
      setTrailPercent(gain ? null : previousPercent)
      setGainRegion(gain ? { start: Math.min(previousPercent, nextPercent), end: Math.max(previousPercent, nextPercent) } : null)
      const timer = window.setTimeout(() => { setActiveFeedback(null); setTrailPercent(null); setGainRegion(null) }, feedbackDurationMs)
      previousRef.current = measuredValue
      return () => window.clearTimeout(timer)
    }
    previousRef.current = measuredValue
  }, [feedback, measuredValue, normalizedMax, previousValue, tone])
  const description = tone === 'health' ? 'Current Health. Reaching zero defeats the Wizard.' : tone === 'mana' ? 'Mana is spent to cast Spells.' : 'Barrier absorbs incoming damage before Health.'
  return <GameTooltip block accent={tone === 'health' ? 'danger' : tone === 'mana' ? 'mana' : 'success'} content={<TooltipContent title={label} description={description} />}><div className={`combat-resource combat-resource-${tone}${normalizedPercent <= 0 ? ' is-empty' : ''}${activeFeedback ? ` is-feedback-${activeFeedback}` : ''}`} aria-label={`${label} ${value}`}><div className="combat-resource-label"><span>{icon}{label}</span><strong>{value}</strong></div><div className="combat-resource-track"><i className="combat-resource-fill" style={{ width: `${normalizedPercent}%` }} />{trailPercent !== null && <b className="combat-resource-trail" style={{ width: `${trailPercent}%` }} aria-hidden="true" />}{gainRegion && <b className="combat-resource-gain" style={{ left: `${gainRegion.start}%`, width: `${gainRegion.end - gainRegion.start}%` }} aria-hidden="true" />}</div></div></GameTooltip>
}

function inferFeedback(tone: CombatResourceTone, previous: number, next: number): CombatResourceFeedback | null {
  if (next === previous) return null
  if (tone === 'health') return next < previous ? 'damage' : 'heal'
  if (tone === 'mana') return next < previous ? 'mana-spend' : 'mana-gain'
  if (next > previous) return 'barrier-gain'
  return next <= 0 ? 'barrier-break' : 'barrier-absorb'
}
