import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DeveloperToolsWindow } from './DeveloperToolsWindow'
import { closeDeveloperTools, getDeveloperToolsState, normalizeDeveloperToolsTab, openDeveloperTools, resetDeveloperToolsWindow, setArtifactDevPanelVisible, setDeveloperCombatTab, setDeveloperToolsGeometry, setScenarioGroupExpanded, setCustomScenarioLibraryExpanded } from './developerToolsStore'

describe('Developer Tools window presentation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    closeDeveloperTools()
    setArtifactDevPanelVisible(false)
    resetDeveloperToolsWindow()
    setDeveloperToolsGeometry({ mode: 'workspace' }, false)
    setScenarioGroupExpanded({})
    setCustomScenarioLibraryExpanded(true)
  })

  it('opens as a centered workspace with body content and no resize handles', () => {
    openDeveloperTools('combat')
    const view = render(<DeveloperToolsWindow />)

    expect(view.container.querySelector('.developer-tools-layer.workspace-mode')).toBeTruthy()
    expect(view.container.querySelector('.developer-tools-window.workspace')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Dock Developer Tools' })).toBeTruthy()
    expect(view.container.querySelector('.developer-tools-body')).toBeTruthy()
    expect(view.container.querySelector('.developer-tools-resize-handle')).toBeNull()
  })

  it('switches to docked mode while preserving its dock geometry', () => {
    setDeveloperToolsGeometry({ dockedX: 120, dockedY: 90, dockedWidth: 700, dockedHeight: 450 }, false)
    openDeveloperTools('diagnostics')
    const view = render(<DeveloperToolsWindow />)

    fireEvent.click(screen.getByRole('button', { name: 'Dock Developer Tools' }))
    expect(getDeveloperToolsState()).toMatchObject({ mode: 'docked', dockedWidth: 700, dockedHeight: 450 })
    const windowElement = view.container.querySelector('.developer-tools-window') as HTMLElement
    expect(windowElement.className).toContain('docked')
    expect(windowElement.style.width).toBe('700px')
    expect(windowElement.style.height).toBe('450px')
    expect(view.container.querySelectorAll('.developer-tools-resize-handle')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Open full Developer Workspace' })).toBeTruthy()
  })

  it('resets docked geometry without changing docked mode', () => {
    setDeveloperToolsGeometry({ mode: 'docked', dockedX: 120, dockedY: 90, dockedWidth: 700, dockedHeight: 450 }, false)
    resetDeveloperToolsWindow()
    expect(getDeveloperToolsState()).toMatchObject({ mode: 'docked', dockedWidth: 640, dockedHeight: 560 })
  })

  it('makes clear, search, mode, and close actions available in the header', () => {
    openDeveloperTools()
    render(<DeveloperToolsWindow />)
    expect(screen.getByRole('button', { name: 'Clear all debug overrides' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Open Developer command palette' }))
    expect(screen.getByRole('dialog', { name: 'Developer command palette' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close Developer command palette' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dock Developer Tools' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open full Developer Workspace' }))
    expect(getDeveloperToolsState().mode).toBe('workspace')
    fireEvent.click(screen.getByRole('button', { name: 'Close Developer Tools' }))
    expect(screen.queryByRole('dialog', { name: 'Developer Tools' })).toBeNull()
  })

  it('uses the eight-workspace navigation and normalizes legacy tab ids', () => {
    expect(normalizeDeveloperToolsTab('equipment')).toBe('inventory')
    expect(normalizeDeveloperToolsTab('schools')).toBe('spells')
    expect(normalizeDeveloperToolsTab('crystals')).toBe('crystals')
    openDeveloperTools('quick')
    openDeveloperTools()
    render(<DeveloperToolsWindow />)
    expect(screen.getAllByRole('button', { name: 'Dashboard' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Player' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Magic' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tower' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Equipment' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Combat' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Progression' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'System' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Scenarios' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Offline Bank' })).toBeTruthy()
  })

  it('persists the Combat Balance tab in developer-only session state', () => {
    setDeveloperCombatTab('balance')
    expect(getDeveloperToolsState().combatTab).toBe('balance')
    expect(JSON.parse(window.localStorage.getItem('sss-wizard-devtools-session-v3') ?? '{}').combatTab).toBe('balance')
  })

  it('persists scenario accordion choices in Developer-only session preferences', () => {
    setScenarioGroupExpanded({ Combat: false, 'Hunter’s Order': true })
    setCustomScenarioLibraryExpanded(false)
    const stored = JSON.parse(window.localStorage.getItem('sss-wizard-devtools-session-v4') ?? '{}')
    expect(stored.scenarioGroupExpanded).toEqual({ Combat: false, 'Hunter’s Order': true })
    expect(stored.customScenarioLibraryExpanded).toBe(false)
  })

  it('renders the Balance Lab measurement columns and neutral controls', () => {
    setDeveloperCombatTab('balance')
    openDeveloperTools('combat')
    render(<DeveloperToolsWindow />)
    expect(screen.getByText('Combat Balance Lab')).toBeTruthy()
    expect(screen.getByText('Combat V2 reference profile matrix')).toBeTruthy()
    expect(screen.getByText('Threat kills-to-boss matrix')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'WARNINGS ONLY' })).toBeTruthy()
    expect(screen.getByLabelText('Search audited monsters')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'COPY AUDIT' })).toBeTruthy()
    expect(screen.getByText('TOTAL RES/H')).toBeTruthy()
    expect(screen.getByLabelText('Benchmark location')).toBeTruthy()
    expect(screen.getByText('LIFE ESSENCE/H')).toBeTruthy()
    expect(screen.getByText('EXPECTED CACHES/H')).toBeTruthy()
    expect(screen.getByText('INCOMING DPS')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'RUN BENCHMARK' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'CANCEL' })).toBeTruthy()
    expect(screen.getByLabelText('Benchmark duration')).toBeTruthy()
    expect(screen.getByLabelText('Benchmark target scope')).toBeTruthy()
  })
})
