import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DeveloperToolsWindow } from './DeveloperToolsWindow'
import { closeDeveloperTools, getDeveloperToolsState, normalizeDeveloperToolsTab, openDeveloperTools, resetDeveloperToolsWindow, setDeveloperToolsGeometry } from './developerToolsStore'

describe('Developer Tools window presentation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    closeDeveloperTools()
    resetDeveloperToolsWindow()
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

  it('makes clear, mode, and close actions available in the header', () => {
    openDeveloperTools()
    render(<DeveloperToolsWindow />)
    expect(screen.getByRole('button', { name: 'Clear all debug overrides' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Dock Developer Tools' }))
    fireEvent.click(screen.getByRole('button', { name: 'Open full Developer Workspace' }))
    expect(getDeveloperToolsState().mode).toBe('workspace')
    fireEvent.click(screen.getByRole('button', { name: 'Close Developer Tools' }))
    expect(screen.queryByRole('dialog', { name: 'Developer Tools' })).toBeNull()
  })

  it('keeps the tester-first navigation flat and normalizes legacy tab ids', () => {
    expect(normalizeDeveloperToolsTab('equipment')).toBe('inventory')
    expect(normalizeDeveloperToolsTab('schools')).toBe('spells')
    openDeveloperTools()
    render(<DeveloperToolsWindow />)
    expect(screen.getByRole('button', { name: 'Quick Setup' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Inventory & Equipment' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Spells & Schools' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Advanced Diagnostics' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /^Equipment$/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /^Magic Schools$/ })).toBeNull()
  })
})
