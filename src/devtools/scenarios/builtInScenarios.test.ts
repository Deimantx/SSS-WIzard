import { describe, expect, it } from 'vitest'
import { BUILT_IN_DEVELOPER_SCENARIOS } from './builtInScenarios'
import { ensureDeveloperSandbox, restoreAndExitDeveloperSandbox } from '../developerSandbox'

const EXPECTED_ELEMENTAL_SCAR_SCENARIOS = [
  'Edrin Cleared / Elemental Scar Open', 'Fractured Approach Start', 'Gatekeeper Encounter',
  'Guardian Selection Ready', 'Flooded Boss Ready', 'Ashen Boss Ready', 'Rootscar Boss Ready',
  '2 / 3 Regional Bosses Cleared', 'Crossroads Unlocked', 'Crossroads Start', 'Crossroads Keeper', 'World Tier III Ready',
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
