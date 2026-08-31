import { Card } from '../../components/ui'
import { CombatDetailsPanel } from './CombatDetailsPanel'
import { DungeonStatisticsPanel } from './DungeonStatisticsPanel'

export function CombatAnalyticsPanel() {
  return <Card className="combat-analytics-panel">
    <header className="combat-analytics-head">
      <span className="combat-subsection-label">COMBAT ANALYTICS</span>
      <small>Live combat performance and dungeon session data.</small>
    </header>
    <div className="combat-analytics-grid">
      <CombatDetailsPanel />
      <DungeonStatisticsPanel />
    </div>
  </Card>
}
