import { describe, expect, it } from 'vitest'
import { ELITE_ZONE_AFFIXES, validateEliteZoneAffixes } from './eliteZoneAffixes'

describe('Elite Zone Affixes', () => {
  it('keeps the six Phase 5B affixes authored and valid', () => {
    expect(Object.keys(ELITE_ZONE_AFFIXES)).toEqual(['vicious', 'frenzied', 'warded', 'armored', 'relentless', 'regenerative'])
    expect(validateEliteZoneAffixes()).toEqual([])
    expect(ELITE_ZONE_AFFIXES.vicious.modifiers).toEqual([{ key: 'damage-dealt-percent', value: 0.15 }])
    expect(ELITE_ZONE_AFFIXES.armored.modifiers).toEqual([{ key: 'defense-percent', value: 0.25 }])
    expect(ELITE_ZONE_AFFIXES.relentless.modifiers).toEqual([{ key: 'status-duration-received-percent', value: -0.4, statusTags: ['control'] }])
  })

  it('keeps threshold and start rules once per encounter', () => {
    expect(ELITE_ZONE_AFFIXES.frenzied.rules?.[0]).toMatchObject({ event: 'on-hp-threshold', oncePerEncounter: true, condition: { type: 'self-hp-below-percent', percent: 50 } })
    expect(ELITE_ZONE_AFFIXES.warded.rules?.[0]).toMatchObject({ event: 'on-combat-start', oncePerEncounter: true, effects: [{ type: 'gain-barrier', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.15 } }] })
    expect(ELITE_ZONE_AFFIXES.regenerative.rules?.[0]).toMatchObject({ event: 'on-hp-threshold', oncePerEncounter: true, effects: [{ type: 'heal', target: 'self', magnitude: { type: 'source-max-health-percent', value: 0.12 } }] })
  })
})
