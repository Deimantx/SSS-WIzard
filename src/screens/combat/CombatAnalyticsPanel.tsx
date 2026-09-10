import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Card } from '../../components/ui'
import { useGameStore } from '../../store/gameStore'
import { CombatDetailsPanel } from './CombatDetailsPanel'
import { DungeonStatisticsPanel } from './DungeonStatisticsPanel'

type CombatAnalyticsView = 'details' | 'dungeon'

export function CombatAnalyticsPanel({ onRequiredHeightChange }: { onRequiredHeightChange?: (height: number) => void }) {
  const panelRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const combatActive = useGameStore((state) => state.combat.active)
  const [view, setView] = useState<CombatAnalyticsView>('details')

  useEffect(() => {
    if (combatActive) setView('details')
  }, [combatActive])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const grid = gridRef.current
    if (!panel || !grid || !onRequiredHeightChange) return
    let previousHeight = 0
    const measure = () => {
      const style = getComputedStyle(panel)
      const frame = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth', 'rowGap'] as const
      // The grid has natural rows; list viewports remain independently bounded.
      const height = Math.ceil(grid.getBoundingClientRect().height + (panel.firstElementChild?.getBoundingClientRect().height ?? 0)
        + frame.reduce((sum, property) => sum + (Number.parseFloat(style[property]) || 0), 0))
      if (height !== previousHeight) { previousHeight = height; onRequiredHeightChange(height) }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    if (panel.firstElementChild) observer.observe(panel.firstElementChild)
    return () => observer.disconnect()
  }, [onRequiredHeightChange])
  return <Card ref={panelRef} className="combat-analytics-panel">
    <header className="combat-analytics-head">
      <div className="combat-analytics-title"><span className="combat-subsection-label">COMBAT ANALYTICS</span><small>Live performance, session, and farming readouts.</small></div>
      <div className="combat-analytics-tabs" role="tablist" aria-label="Combat analytics views">
        <button type="button" role="tab" aria-selected={view === 'details'} className={view === 'details' ? 'is-active' : ''} onClick={() => setView('details')}>COMBAT DETAILS</button>
        <button type="button" role="tab" aria-selected={view === 'dungeon'} className={view === 'dungeon' ? 'is-active' : ''} onClick={() => setView('dungeon')}>DUNGEON STATISTICS</button>
      </div>
    </header>
    <div ref={gridRef} className="combat-analytics-grid">
      {view === 'details' ? <CombatDetailsPanel key="details" /> : <DungeonStatisticsPanel key="dungeon" />}
    </div>
  </Card>
}
