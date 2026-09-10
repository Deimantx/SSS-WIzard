import { useEffect, useState } from 'react'
import { Card } from '../../components/ui'
import { useCombatRenderIsolation } from '../../devtools/combatRenderIsolationStore'
import { useGameStore } from '../../store/gameStore'
import { CombatDetailsPanel } from './CombatDetailsPanel'
import { DungeonStatisticsPanel } from './DungeonStatisticsPanel'

type CombatAnalyticsView = 'details' | 'dungeon'

export function CombatAnalyticsPanel() {
  const combatActive = useGameStore((state) => state.combat.active)
  const renderIsolation = useCombatRenderIsolation()
  const [view, setView] = useState<CombatAnalyticsView>('details')

  useEffect(() => {
    if (combatActive) setView('details')
  }, [combatActive])

  return <Card className="combat-analytics-panel">
    <header className="combat-analytics-head">
      <div className="combat-analytics-title"><span className="combat-subsection-label">COMBAT ANALYTICS</span><small>Live performance, session, and farming readouts.</small></div>
      <div className="combat-analytics-tabs" role="tablist" aria-label="Combat analytics views">
        <button type="button" role="tab" aria-selected={view === 'details'} className={view === 'details' ? 'is-active' : ''} onClick={() => setView('details')}>COMBAT DETAILS</button>
        <button type="button" role="tab" aria-selected={view === 'dungeon'} className={view === 'dungeon' ? 'is-active' : ''} onClick={() => setView('dungeon')}>DUNGEON STATISTICS</button>
      </div>
    </header>
    <div className="combat-analytics-grid">
      {!renderIsolation.renderCombatAnalytics ? <div className="combat-analytics-isolation-placeholder"><strong>COMBAT ANALYTICS ISOLATED</strong><span>Gameplay and combat simulation continue normally.</span></div> : view === 'details' ? renderIsolation.renderCombatDetails ? <CombatDetailsPanel key="details" /> : <div className="combat-analytics-isolation-placeholder"><strong>COMBAT DETAILS ISOLATED</strong><span>Telemetry collection remains active for validation.</span></div> : <DungeonStatisticsPanel key="dungeon" />}
    </div>
  </Card>
}
