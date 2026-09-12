import { afterEach, describe, expect, it } from 'vitest'
import { migrateUiPreset } from './uiEditorMigrations'
import { normalizeUiPreset, validateUiPreset } from './uiEditorStorage'
import { registerUiElement } from './uiEditorRegistry'

describe('advanced UI editor preset validation', () => {
  const cleanups: Array<() => void> = []
  afterEach(() => { while (cleanups.length) cleanups.pop()?.() })

  it('rejects unsupported raw CSS properties', () => {
    const report = validateUiPreset({ schemaVersion: 1, gameUiVersion: 1, meta: { id: 'unsafe', name: 'Unsafe' }, elements: { 'combat.enemy': { color: { custom: '#fff' }, position: 'absolute' } } })
    expect(report.valid).toBe(false)
    expect(report.issues.some((issue) => issue.path.endsWith('.position'))).toBe(true)
  })

  it('normalizes valid values and strips unsupported values before runtime use', () => {
    const normalized = normalizeUiPreset({ schemaVersion: 1, gameUiVersion: 1, meta: { id: 'clean', name: 'Clean' }, elements: { 'combat.enemy': { width: { value: 96, unit: 'px' }, opacity: 0.8, unsafe: 'raw css' } } })
    expect(normalized.elements?.['combat.enemy']).toEqual({ width: { value: 96, unit: 'px' }, opacity: 0.8 })
    expect(normalized.meta.description).toBe('')
  })

  it('migrates the supported legacy version marker into the current schema', () => {
    const migrated = migrateUiPreset({ version: 1, gameUiVersion: 1, meta: { id: 'legacy', name: 'Legacy' } }) as { schemaVersion: number }
    expect(migrated.schemaVersion).toBe(1)
    expect(validateUiPreset(migrated).valid).toBe(true)
  })

  it('warns about stale IDs without making the preset invalid', () => {
    const element = document.createElement('div')
    document.body.append(element)
    cleanups.push(() => element.remove())
    cleanups.push(registerUiElement({ id: 'live.element', type: 'card', screen: 'test', label: 'Live', capabilities: ['layout'] }, element))
    const report = validateUiPreset({ schemaVersion: 1, gameUiVersion: 1, meta: { id: 'stale', name: 'Stale' }, elements: { 'missing.element': { opacity: 0.8 } } })
    expect(report.valid).toBe(true)
    expect(report.issues.some((issue) => issue.severity === 'WARNING' && issue.message.includes('missing.element'))).toBe(true)
  })
})
