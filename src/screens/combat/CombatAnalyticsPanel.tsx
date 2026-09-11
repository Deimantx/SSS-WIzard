import { useLayoutEffect, useRef } from 'react'
import { Card } from '../../components/ui'
import { CombatDetailsPanel } from './CombatDetailsPanel'
import { DungeonStatisticsPanel } from './DungeonStatisticsPanel'

export function CombatAnalyticsPanel({ onRequiredHeightChange }: { onRequiredHeightChange?: (height: number) => void }) {
  const panelRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
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
      <span className="combat-subsection-label">COMBAT ANALYTICS</span>
      <small>Live combat performance and dungeon session data.</small>
    </header>
    <div ref={gridRef} className="combat-analytics-grid">
      <CombatDetailsPanel />
      <DungeonStatisticsPanel />
    </div>
  </Card>
}
