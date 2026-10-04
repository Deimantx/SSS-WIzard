import { describe, expect, it } from 'vitest'
import { BUILT_IN_DEVELOPER_SCENARIOS } from './builtInScenarios'
import { ensureDeveloperSandbox, restoreAndExitDeveloperSandbox } from '../developerSandbox'

const EXPECTED_ELEMENTAL_SCAR_SCENARIOS = [
  'Fractured Approach Start', 'Gatekeeper Encounter',
  'Guardian Selection Ready', 'Flooded Boss Ready', 'Ashen Boss Ready', 'Rootscar Boss Ready',
  '2 / 3 Location Bosses Cleared', 'Crossroads Unlocked', 'Crossroads Start', 'Crossroads Keeper',
]
const EXPECTED_SHATTERED_MERIDIAN_SCENARIOS = [
  'Crossroads Cleared / Three Paths Open', 'Graveglass Boss Ready', 'Stormvault Boss Ready', 'Starfallen Boss Ready',
  '1 / 3 Shattered Bosses Cleared', '2 / 3 Shattered Bosses Cleared', '3 / 3 Shattered Bosses Cleared',
  'Broken Meridian Unlocked', 'Broken Meridian Start', 'Meridian Splitter', 'Meridian Splitter Cleared', 'Crystals Unlocked', 'Black Gate Paths Open',
]
const EXPECTED_BLACK_SIGIL_SCENARIOS = [
  'Meridian Splitter Cleared / Black Sigil Open', 'Hall Start', 'Hall Boss Ready', 'Unspoken Prelate',
  'Vault Start', 'Vault Boss Ready', 'Sigil Warden', '1 / 2 Black Sigil Bosses Cleared', '2 / 2 Black Sigil Bosses Cleared',
  'Black Gate Unlocked', 'Black Gate Start', 'Black Gatekeeper Phase 1', 'Black Gatekeeper Phase 2', 'Black Gatekeeper Cleared',
]

describe('Elemental Scar DevTools scenarios', () => {
  it('publishes the Phase 04 progression and combat fixtures', () => {
    const scenarios = BUILT_IN_DEVELOPER_SCENARIOS(() => {})
    const labels = new Set(scenarios.map((scenario) => scenario.label))
    EXPECTED_ELEMENTAL_SCAR_SCENARIOS.forEach((label) => expect(labels.has(label), label).toBe(true))
  })

  it('runs each fixture and proves the expected Elemental Scar state', () => {
    const scenarios = BUILT_IN_DEVELOPER_SCENARIOS(() => {})
    ensureDeveloperSandbox('Elemental Scar scenario test')
    try {
      for (const label of EXPECTED_ELEMENTAL_SCAR_SCENARIOS) {
        const scenario = scenarios.find((entry) => entry.label === label)!
        expect(scenario.run(), label).toBe(true)
      }
    } finally {
      restoreAndExitDeveloperSandbox()
    }
  })
})

describe('Shattered Meridian DevTools scenarios', () => {
  it('publishes the Phase 05 progression and combat fixtures', () => {
    const scenarios = BUILT_IN_DEVELOPER_SCENARIOS(() => {})
    const labels = new Set(scenarios.map((scenario) => scenario.label))
    EXPECTED_SHATTERED_MERIDIAN_SCENARIOS.forEach((label) => expect(labels.has(label), label).toBe(true))
  })

  it('runs each fixture and proves the expected Shattered Meridian state', () => {
    const scenarios = BUILT_IN_DEVELOPER_SCENARIOS(() => {})
    ensureDeveloperSandbox('Shattered Meridian scenario test')
    try {
      for (const label of EXPECTED_SHATTERED_MERIDIAN_SCENARIOS) {
        const scenario = scenarios.find((entry) => entry.label === label)!
        expect(scenario.run(), label).toBe(true)
      }
    } finally {
      restoreAndExitDeveloperSandbox()
    }
  })
})

describe('Black Sigil Reach DevTools scenarios', () => {
  it('publishes the Phase 06 progression and combat fixtures', () => {
    const scenarios = BUILT_IN_DEVELOPER_SCENARIOS(() => {})
    const labels = new Set(scenarios.map((scenario) => scenario.label))
    EXPECTED_BLACK_SIGIL_SCENARIOS.forEach((label) => expect(labels.has(label), label).toBe(true))
  })

  it('runs each fixture and proves the expected Black Sigil state', () => {
    const scenarios = BUILT_IN_DEVELOPER_SCENARIOS(() => {})
    ensureDeveloperSandbox('Black Sigil scenario test')
    try {
      for (const label of EXPECTED_BLACK_SIGIL_SCENARIOS) {
        const scenario = scenarios.find((entry) => entry.label === label)!
        expect(scenario.run(), label).toBe(true)
      }
    } finally {
      restoreAndExitDeveloperSandbox()
    }
  })
})
