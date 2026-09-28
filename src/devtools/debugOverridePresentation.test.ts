import { describe, expect, it } from 'vitest'
import { createDefaultDebugOverrides } from '../store/actions/debugActions'
import { DEBUG_OVERRIDE_KEYS, getActiveDebugOverrides, hasActiveDebugOverrides } from './debugOverridePresentation'

describe('developer override presentation', () => {
  it('reports the canonical clean state as clean', () => {
    const debug = createDefaultDebugOverrides()
    expect(hasActiveDebugOverrides(debug)).toBe(false)
    expect(getActiveDebugOverrides(debug)).toEqual([])
  })

  it('presents every override field individually, including Arcane Core', () => {
    const debug = createDefaultDebugOverrides()
    debug.arcaneCoreFreeCosts = true
    debug.arcaneCoreIgnorePrerequisites = true
    debug.combatTimeScale = 1
    const active = getActiveDebugOverrides(debug)
    expect(active.map((override) => override.key)).toEqual(['arcaneCoreFreeCosts', 'arcaneCoreIgnorePrerequisites'])
    expect(DEBUG_OVERRIDE_KEYS).toHaveLength(21)
  })
})
