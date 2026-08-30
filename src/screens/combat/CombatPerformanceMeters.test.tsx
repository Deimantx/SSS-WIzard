import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '../../components/ui/tooltip/Tooltip'
import { combatTelemetryObserver, useCombatTelemetryStore } from '../../game/telemetry/combat/combatTelemetryStore'
import { getCombatMetricSnapshot } from '../../game/telemetry/combat/combatTelemetrySelectors'
import type { CombatEvent } from '../../game/systems/combat/combatTypes'
import { CombatMetricTooltip } from './CombatMetricTooltip'
import { CombatPerformanceMeters } from './CombatPerformanceMeters'

const event: CombatEvent = { source: { kind: 'player' }, sourceKind: 'spell', sourceId: 'fire-bolt', spellId: 'fire-bolt', target: 'enemy', targetMonsterId: 'grove-sentinel', dungeonId: 'whispering-woods', category: 'damage', damageType: 'fire', amount: 592, healthDamage: 480, barrierAbsorbed: 112 }

describe('CombatPerformanceMeters', () => {
  beforeEach(() => useCombatTelemetryStore.getState().clear())

  it('renders compact run meters with live rates and totals', () => {
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.beginEncounter('grove-sentinel')
    combatTelemetryObserver.advance(40_000, { combat: { active: true, enemyId: 'grove-sentinel' } } as never)
    combatTelemetryObserver.consume(event)
    render(<TooltipProvider><CombatPerformanceMeters actor="player" scope="run" /></TooltipProvider>)

    expect(screen.getByText('COMBAT PERFORMANCE')).toBeTruthy()
    expect(screen.getByText('RUN')).toBeTruthy()
    expect(screen.getByLabelText('DAMAGE 592 total, 14.8 per second')).toBeTruthy()
    expect(screen.getByLabelText('HEALING 0 total, 0.0 per second')).toBeTruthy()
    expect(screen.getByLabelText('TAKEN 0 total, 0.0 per second')).toBeTruthy()
  })

  it('shows sorted source, rate, share, and barrier detail in the shared tooltip', () => {
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.consume(event)
    const scope = useCombatTelemetryStore.getState().run!
    const snapshot = getCombatMetricSnapshot(scope, 'player', 'damage')
    render(<CombatMetricTooltip metric="damage" actor="player" scope={scope} snapshot={snapshot} />)

    expect(screen.getByText('DAMAGE DONE')).toBeTruthy()
    expect(screen.getByText('Fire Bolt')).toBeTruthy()
    expect(screen.getByText(/100\.0%/)).toBeTruthy()
    expect(screen.getByText('HP DAMAGE')).toBeTruthy()
    expect(screen.getByText('BARRIER DAMAGE')).toBeTruthy()
  })

  it('uses the current encounter scope for enemy meters', () => {
    combatTelemetryObserver.beginRun('whispering-woods')
    combatTelemetryObserver.beginEncounter('grove-sentinel')
    combatTelemetryObserver.advance(10_000, { combat: { active: true, enemyId: 'grove-sentinel' } } as never)
    combatTelemetryObserver.consume({ ...event, source: { kind: 'enemy', monsterId: 'grove-sentinel' }, sourceKind: 'basic-attack', sourceId: 'grove-sentinel-basic-attack', target: 'player', targetMonsterId: undefined, amount: 92, healthDamage: 92, barrierAbsorbed: 0 })
    render(<TooltipProvider><CombatPerformanceMeters actor="enemy" scope="encounter" /></TooltipProvider>)

    expect(screen.getByText('ENCOUNTER')).toBeTruthy()
    expect(screen.getByLabelText('DAMAGE 92 total, 9.2 per second')).toBeTruthy()
  })
})
