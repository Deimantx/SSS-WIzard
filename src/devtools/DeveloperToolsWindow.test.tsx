import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { DeveloperToolsWindow } from './DeveloperToolsWindow'
import { closeDeveloperTools, getDeveloperToolsState, openDeveloperTools, resetDeveloperToolsWindow, restoreDeveloperTools, setDeveloperToolsGeometry } from './developerToolsStore'

describe('Developer Tools window presentation', () => {
  beforeEach(() => {
    window.localStorage.clear()
    closeDeveloperTools()
    resetDeveloperToolsWindow()
  })

  it('turns into a compact title bar without body, tabs, or resize handles', () => {
    openDeveloperTools('combat')
    const view = render(<DeveloperToolsWindow />)

    expect(screen.getByRole('navigation', { name: 'Developer tool sections' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Minimize Developer Tools' }))

    const windowElement = view.container.querySelector('.developer-tools-window') as HTMLElement
    expect(windowElement.className).toContain('minimized')
    expect(view.container.querySelector('.developer-tools-body')).toBeNull()
    expect(view.container.querySelector('.developer-tools-tabs')).toBeNull()
    expect(view.container.querySelector('.developer-tools-resize-handle')).toBeNull()
    expect(windowElement.style.height).toBe('')
    expect(windowElement.style.width).toBe('360px')
    expect(screen.getByText('CLEAR')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restore Developer Tools' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close Developer Tools' })).toBeTruthy()
  })

  it('restores the previous expanded geometry and normal content', () => {
    setDeveloperToolsGeometry({ x: 120, y: 90, width: 700, height: 450 }, false)
    openDeveloperTools('diagnostics')
    const view = render(<DeveloperToolsWindow />)

    fireEvent.click(screen.getByRole('button', { name: 'Minimize Developer Tools' }))
    expect(getDeveloperToolsState()).toMatchObject({ width: 700, height: 450, minimized: true })
    fireEvent.click(screen.getByRole('button', { name: 'Restore Developer Tools' }))

    const windowElement = view.container.querySelector('.developer-tools-window') as HTMLElement
    expect(windowElement.className).not.toContain('minimized')
    expect(windowElement.style.width).toBe('700px')
    expect(windowElement.style.height).toBe('450px')
    expect(view.container.querySelector('.developer-tools-body')).toBeTruthy()
    expect(view.container.querySelectorAll('.developer-tools-resize-handle')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Clear all debug overrides' })).toBeTruthy()

    restoreDeveloperTools()
  })

  it('keeps clear, restore/minimize, and close actions available in the compact header', () => {
    openDeveloperTools()
    render(<DeveloperToolsWindow />)
    fireEvent.click(screen.getByRole('button', { name: 'Minimize Developer Tools' }))

    expect(screen.getByRole('button', { name: 'Clear all debug overrides' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Restore Developer Tools' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close Developer Tools' }))
    expect(screen.queryByRole('dialog', { name: 'Developer Tools' })).toBeNull()
  })
})
