import { describe, expect, it } from 'vitest'
import { MONSTERS } from './index'
import { EXPANSION_BOSSES_BY_LOCATION, EXPANSION_LOCATION_ROSTERS, EXPANSION_MONSTERS } from './expansionMonsters'
import { COMBAT_LOCATIONS, COMBAT_LOCATION_ORDER } from '../combat-locations/worldNavigation'
import { TRAIT_DEFINITIONS } from '../traits/traits'

const actionSignature = (monsterId: string, actionId: string) => {
  const authored = MONSTERS[monsterId as keyof typeof MONSTERS].actions[actionId]
  const effects = authored.effects.flatMap((effect) => {
    if (effect.type === 'deal-damage') return [...effect.components.map(({ damageType, magnitude }) => `damage:${damageType}:${magnitude.type === 'source-basic-damage-percent' ? magnitude.value : 'other'}`), ...(effect.hitCount && effect.hitCount > 1 ? [`hits:${effect.hitCount}`] : [])]
    if (effect.type === 'apply-status') return [`status:${effect.statusId}:${effect.target}`]
    if (effect.type === 'gain-barrier') return [`barrier:${effect.magnitude.type === 'source-max-health-percent' ? effect.magnitude.value : 'other'}`]
    if (effect.type === 'heal') return [`heal:${effect.magnitude.type === 'source-max-health-percent' ? effect.magnitude.value : 'other'}`]
    if (effect.type === 'drain-resource') return [`drain:${effect.resource}:${effect.magnitude.type === 'flat' ? effect.magnitude.value : 'other'}`]
    if (effect.type === 'modify-action-timer') return [`delay:${effect.amountMs}:${effect.action}`]
    if (effect.type === 'detonate-status') return [`detonate:${effect.statusId}:${effect.multiplier}`]
    return [`${effect.type}`]
  })
  return `${authored.name}|${effects.join(',')}`
}

const phaseNames = (monsterId: string, phase: 'phase-one' | 'phase-two') => MONSTERS[monsterId as keyof typeof MONSTERS].actionPatterns[phase].steps.map((step) => step.type === 'basic' ? 'Basic' : MONSTERS[monsterId as keyof typeof MONSTERS].actions[step.actionId].name)

describe('Phase 01 combat expansion content', () => {
  it('adds 79 normal enemies across 13 directly owned locations and 11 bosses', () => {
    const normalIds = Object.values(EXPANSION_LOCATION_ROSTERS).flat()
    expect(normalIds).toHaveLength(79)
    expect(new Set(normalIds).size).toBe(79)
    expect(Object.keys(EXPANSION_BOSSES_BY_LOCATION)).toHaveLength(11)
    expect(Object.keys(EXPANSION_MONSTERS)).toHaveLength(90)
    expect(COMBAT_LOCATION_ORDER).toHaveLength(33)
    expect(Object.values(EXPANSION_LOCATION_ROSTERS)).toHaveLength(13)
    for (const [locationId, roster] of Object.entries(EXPANSION_LOCATION_ROSTERS)) {
      const location = COMBAT_LOCATIONS[locationId as keyof typeof COMBAT_LOCATIONS]!
      expect(location.monsterPool).toEqual(roster)
      expect(roster.length).toBeGreaterThan(0)
      expect(roster.every((id) => ['first-special', 'second-special'].every((skillId) => Boolean(MONSTERS[id].actions[skillId])) && MONSTERS[id].defaultActionPatternId in MONSTERS[id].actionPatterns)).toBe(true)
    }
  })

  it('gives each new boss two deterministic phases and a one-time half-health transition', () => {
    for (const [locationId, bossId] of Object.entries(EXPANSION_BOSSES_BY_LOCATION)) {
      const boss = MONSTERS[bossId!]
      expect(COMBAT_LOCATIONS[locationId as keyof typeof COMBAT_LOCATIONS].boss).toBe(bossId)
      expect(Object.keys(boss.actions).filter((actionId) => actionId.startsWith('skill-'))).toHaveLength(6)
      expect(boss.actionPatterns['phase-one']?.steps.length).toBeGreaterThan(0)
      expect(boss.actionPatterns['phase-two']?.steps.length).toBeGreaterThan(0)
      expect(boss.ui?.bestiary?.phaseLabels).toMatchObject({ 'phase-one': expect.any(String), 'phase-two': expect.any(String) })
      const phaseTrait = boss.traitIds.find((traitId) => traitId.endsWith('-phase'))
      expect(phaseTrait).toBeTruthy()
      expect(boss.traitIds).toContain(phaseTrait)
      const phaseDefinition = TRAIT_DEFINITIONS[phaseTrait!]!
      const rule = phaseDefinition.rules?.[0]!
      expect(rule).toMatchObject({ event: 'on-hp-threshold', oncePerEncounter: true, condition: { type: 'self-hp-below-percent', percent: 50 } })
      expect(rule.effects).toContainEqual({ type: 'set-action-pattern', target: 'self', patternId: 'phase-two' })
      for (const pattern of Object.values(boss.actionPatterns)) {
        for (const step of pattern.steps) if (step.type === 'action') expect(boss.actions[step.actionId]).toBeDefined()
      }
    }
  })

  it('authors Steam Tyrant mixed-element skills, action delay, and exact phase sequences', () => {
    const tyrant = MONSTERS['steam-tyrant']
    const crown = tyrant.actions['skill-1'].effects.find((effect) => effect.type === 'deal-damage')
    const hammer = tyrant.actions['skill-3'].effects.find((effect) => effect.type === 'deal-damage')
    const flashBoil = tyrant.actions['skill-5'].effects.find((effect) => effect.type === 'modify-action-timer')
    const rupture = tyrant.actions['skill-6'].effects.find((effect) => effect.type === 'deal-damage')
    expect(crown?.type === 'deal-damage' && crown.components.map(({ damageType }) => damageType)).toEqual(['fire', 'water'])
    expect(hammer?.type === 'deal-damage' && hammer.components.map(({ damageType }) => damageType)).toEqual(['water'])
    expect(flashBoil).toMatchObject({ type: 'modify-action-timer', target: 'opponent', amountMs: 500, action: 'current' })
    expect(rupture?.type === 'deal-damage' && rupture.components.map(({ damageType }) => damageType)).toEqual(['fire', 'water'])
    expect(tyrant.actionPatterns['phase-one'].steps.map((step) => step.type === 'basic' ? 'basic' : step.actionId)).toEqual(['skill-1', 'basic', 'skill-2', 'skill-4', 'basic', 'skill-3'])
    expect(tyrant.actionPatterns['phase-two'].steps.map((step) => step.type === 'basic' ? 'basic' : step.actionId)).toEqual(['skill-6', 'skill-5', 'basic', 'skill-1', 'skill-2', 'skill-3'])
  })

  it('pins authored mechanics and sequence for representative normal enemies', () => {
    const signatures: Record<string, string[]> = {
      'brinefang-eel': ['Shock Current|damage:water:0.9,damage:air:0.5', 'Coil Snap|damage:water:1.6'],
      'mistwing-skimmer': ['Mist Dive|damage:air:1.5', 'Crosswind|damage:air:0.9,delay:400:current'],
      'fenwater-hexer': ['Bog Hex|damage:water:0.85,status:cursed:opponent', 'Flood Pulse|damage:water:1.5'],
      'runic-parasite': ['Mana Gnaw|damage:arcane:0.9,drain:mana:6', 'Glyph Leech|damage:arcane:1.1,heal:0.04'],
      'stormsmoke-imp': ['Smoke Gust|damage:air:1.2,status:vulnerable:opponent', 'Static Cinder|damage:air:0.8,damage:fire:0.55'],
      'prism-stalker': ['Prism Fang|damage:arcane:0.6,damage:fire:0.4,damage:water:0.4', 'Refraction|status:spectral-fade:self'],
      'glassfin-horror': ['Glassfin Rend|damage:water:1.25,status:bleeding:opponent', 'Undertow Dash|damage:water:1.1,delay:350:current'],
      'pressure-eel': ['Pressure Bite|damage:water:1.3', 'Discharge|damage:water:0.8,damage:air:0.55,status:shock:opponent'],
      'ashen-duelist': ['Twin Brands|damage:fire:0.75,hits:2', 'Riposte Veil|status:spectral-fade:self'],
      'null-scribe': ['Null Script|damage:arcane:1.2,status:arcane-disruption:opponent', 'Cancel Rune|damage:arcane:0.8,status:silenced:opponent'],
    }
    for (const [monsterId, expected] of Object.entries(signatures)) {
      expect(['first-special', 'second-special'].map((actionId) => actionSignature(monsterId, actionId)), monsterId).toEqual(expected)
    }
  })

  it('pins the intended normal action sequence for all 79 new enemies', () => {
    const alternatePatterns: Record<string, string[]> = {
      'mirefin-lurker': ['basic', 'first-special', 'basic', 'second-special'],
      'tidebloom-warden': ['basic', 'first-special', 'basic', 'second-special'],
      'saltglass-crab': ['basic', 'second-special', 'first-special', 'basic'],
      'mistwing-skimmer': ['basic', 'first-special', 'second-special', 'basic'],
      'emberhide-ram': ['basic', 'second-special', 'first-special', 'basic'],
      'pyrebark-treant': ['basic', 'second-special', 'first-special', 'basic'],
      'galehorn-ibex': ['second-special', 'basic', 'first-special', 'basic'],
      'furnace-guard': ['second-special', 'basic', 'first-special', 'basic'],
      'ashen-duelist': ['first-special', 'basic', 'second-special', 'first-special', 'basic'],
      'smokeveil-assassin': ['first-special', 'basic', 'second-special', 'first-special'],
      'depthbound-knight': ['second-special', 'basic', 'first-special', 'basic'],
      'redsteam-reaver': ['second-special', 'basic', 'first-special', 'basic'],
      'brineforged-brute': ['second-special', 'basic', 'first-special', 'basic'],
      'riverhide-boar': ['second-special', 'basic', 'first-special', 'basic'],
      'slateback-yak': ['second-special', 'basic', 'first-special', 'basic'],
      'glasshorn-beast': ['second-special', 'basic', 'first-special', 'basic'],
      'emberback-rhino': ['second-special', 'basic', 'first-special', 'basic'],
      'dustshell-tortoise': ['second-special', 'basic', 'first-special', 'basic'],
      'basalt-guardian': ['second-special', 'basic', 'first-special', 'basic'],
      'tidal-reliquary-guard': ['second-special', 'basic', 'first-special', 'basic'],
      'coralbound-sentinel': ['second-special', 'basic', 'first-special', 'basic'],
      'skychain-sentinel': ['second-special', 'basic', 'first-special', 'basic'],
      'stonebell-keeper': ['second-special', 'basic', 'first-special', 'basic'],
      'obsidian-custodian': ['second-special', 'basic', 'first-special', 'basic'],
      'runeplate-golem': ['second-special', 'basic', 'first-special', 'basic'],
    }
    const ids = Object.values(EXPANSION_LOCATION_ROSTERS).flat()
    for (const monsterId of ids) {
      const actual = MONSTERS[monsterId].actionPatterns.default.steps.map((step) => step.type === 'basic' ? 'basic' : step.actionId)
      expect(actual, monsterId).toEqual(alternatePatterns[monsterId] ?? ['first-special', 'basic', 'second-special', 'basic'])
      expect(MONSTERS[monsterId].subtitle, monsterId).not.toMatch(/uses .* before|alternating strikes/i)
    }
  })

  it('pins each expansion boss six-skill kit and exact phase sequences', () => {
    const expectedActions: Record<string, string[]> = {
      'moonwake-leviathan': ['Tidal Crush|damage:water:1.55', 'Brine Coil|damage:water:1.1,status:chilled:opponent', 'Drowning Arc|damage:water:1,damage:air:0.6', 'Abyssal Hide|barrier:0.1', 'Undertow Pull|damage:water:0.8,delay:700:current', 'Moonwake Surge|damage:water:2.3'],
      'furnace-maw': ['Magma Bite|damage:fire:1.45,status:burning:opponent', 'Furnace Breath|damage:fire:1.8', 'Ashquake|damage:fire:0.9,damage:earth:0.7', 'Cinder Carapace|barrier:0.1', 'Devour Cinders|damage:fire:1,detonate:burning:1', 'Eruption|damage:fire:2.4'],
      'tempest-sovereign': ['Talon Tempest|damage:air:1.6', 'Thunder Crown|damage:air:1.2,status:shock:opponent', 'Crosswind Rend|damage:air:1.1,status:fragile:opponent', 'Eye of the Storm|barrier:0.08', 'Rainburst|damage:water:0.8,damage:air:0.8', 'Skyfall|damage:air:2.4'],
      'unmade-magister': ['Arcane Lance|damage:arcane:1.45', 'Prism Divide|damage:fire:0.75,damage:water:0.75', 'Ley Rupture|damage:earth:0.75,damage:air:0.75', 'Counterseal|barrier:0.09', 'Mana Collapse|damage:arcane:0.9,drain:mana:10', 'Unmake|damage:arcane:2.5'],
      'pyrehold-castellan': ["Castellan's Brand|damage:fire:1.3,status:kindled:opponent", 'Furnace Decree|damage:fire:1.65', 'Bastion Flame|barrier:0.1', 'Molten Counter|damage:fire:1,delay:400:current', 'Execution Pyre|damage:fire:2.2', 'Ashen Command|status:haste:self'],
      'drowned-regent': ["Regent's Tide|damage:water:1.5", 'Pressure Crown|barrier:0.1', 'Deep Decree|damage:water:0.9,status:cursed:opponent', 'Nullwater Sentence|damage:arcane:1,status:silenced:opponent', 'Undertow Collapse|damage:water:1.25,delay:600:current', 'Drown the Hall|damage:water:2.35'],
      'steam-tyrant': ['Boiling Crown|damage:fire:1,damage:water:1', 'Scalding Edict|damage:fire:1.35,status:burning:opponent', 'Steam Hammer|damage:water:1.4', 'Vapor Armor|barrier:0.1', 'Flash Boil|damage:fire:1.2,delay:500:current', 'Pressure Rupture|damage:fire:1.2,damage:water:1.2'],
      'sepulcher-flamekeeper': ['Funeral Pyre|damage:fire:1.4,status:burning:opponent', 'Ashen Procession|damage:fire:1.2', "Keeper's Ward|barrier:0.1", 'Cinder Rite|heal:0.05', 'Last Ember|damage:fire:1.8', 'Cremation Bell|damage:fire:2.4'],
      'deep-bell-saint': ['Bell Toll|damage:water:1.3,status:staggered:opponent', 'Drowned Hymn|damage:water:1.1,status:cursed:opponent', 'Resonant Tide|damage:water:1,damage:air:0.6', 'Deep Sanctuary|barrier:0.1', 'Sunken Benediction|heal:0.06', 'Final Toll|damage:water:2.45'],
      'abbot-ninth-gale': ['First Gale|damage:air:1.2', 'Third Gale|damage:air:0.75,hits:2', 'Fifth Gale|damage:air:1,damage:water:0.55', 'Seventh Gale|barrier:0.08', 'Skychain Silence|damage:arcane:0.8,status:silenced:opponent', 'Ninth Gale|damage:air:2.5'],
      'closed-index': ['Redaction|damage:arcane:1.2,status:silenced:opponent', 'Null Entry|damage:arcane:1.45', 'Stone Seal|damage:earth:1.2', 'Ember Clause|damage:fire:1.2', 'Archive Lock|barrier:0.1', 'Final Index|damage:arcane:2.5'],
    }
    for (const [monsterId, expected] of Object.entries(expectedActions)) {
      expect(Array.from({ length: 6 }, (_, index) => actionSignature(monsterId, `skill-${index + 1}`)), monsterId).toEqual(expected)
      const monster = MONSTERS[monsterId as keyof typeof MONSTERS]
      expect(monster.subtitle).not.toMatch(/changes its attack sequence/i)
      if (monsterId !== 'pyrehold-castellan') expect(monster.actions['skill-6'].actionTimeMs).toBeGreaterThanOrEqual(2800)
    }
  })

  it('pins the exact authored boss phase orders', () => {
    const expected: Record<string, { 'phase-one': string[]; 'phase-two': string[] }> = {
      'moonwake-leviathan': { 'phase-one': ['Tidal Crush', 'Basic', 'Brine Coil', 'Basic', 'Abyssal Hide', 'Drowning Arc', 'Basic'], 'phase-two': ['Moonwake Surge', 'Basic', 'Undertow Pull', 'Tidal Crush', 'Basic', 'Brine Coil', 'Drowning Arc'] },
      'furnace-maw': { 'phase-one': ['Magma Bite', 'Basic', 'Furnace Breath', 'Basic', 'Cinder Carapace', 'Ashquake'], 'phase-two': ['Eruption', 'Basic', 'Magma Bite', 'Devour Cinders', 'Furnace Breath', 'Basic', 'Ashquake'] },
      'tempest-sovereign': { 'phase-one': ['Talon Tempest', 'Basic', 'Thunder Crown', 'Basic', 'Eye of the Storm', 'Rainburst'], 'phase-two': ['Skyfall', 'Crosswind Rend', 'Basic', 'Thunder Crown', 'Talon Tempest', 'Rainburst', 'Basic'] },
      'unmade-magister': { 'phase-one': ['Arcane Lance', 'Basic', 'Prism Divide', 'Counterseal', 'Basic', 'Ley Rupture'], 'phase-two': ['Unmake', 'Mana Collapse', 'Basic', 'Prism Divide', 'Ley Rupture', 'Arcane Lance', 'Basic'] },
      'pyrehold-castellan': { 'phase-one': ["Castellan's Brand", 'Basic', 'Furnace Decree', 'Bastion Flame', 'Basic', 'Molten Counter'], 'phase-two': ['Execution Pyre', 'Basic', "Castellan's Brand", 'Ashen Command', 'Furnace Decree', 'Molten Counter', 'Basic'] },
      'drowned-regent': { 'phase-one': ["Regent's Tide", 'Basic', 'Deep Decree', 'Pressure Crown', 'Basic', 'Nullwater Sentence'], 'phase-two': ['Drown the Hall', 'Undertow Collapse', 'Basic', "Regent's Tide", 'Nullwater Sentence', 'Basic'] },
      'steam-tyrant': { 'phase-one': ['Boiling Crown', 'Basic', 'Scalding Edict', 'Vapor Armor', 'Basic', 'Steam Hammer'], 'phase-two': ['Pressure Rupture', 'Flash Boil', 'Basic', 'Boiling Crown', 'Scalding Edict', 'Steam Hammer'] },
      'sepulcher-flamekeeper': { 'phase-one': ['Funeral Pyre', 'Basic', 'Ashen Procession', "Keeper's Ward", 'Basic', 'Cinder Rite'], 'phase-two': ['Cremation Bell', 'Basic', 'Funeral Pyre', 'Last Ember', 'Ashen Procession', 'Basic'] },
      'deep-bell-saint': { 'phase-one': ['Bell Toll', 'Basic', 'Drowned Hymn', 'Deep Sanctuary', 'Basic', 'Resonant Tide'], 'phase-two': ['Final Toll', 'Basic', 'Resonant Tide', 'Bell Toll', 'Sunken Benediction', 'Drowned Hymn'] },
      'abbot-ninth-gale': { 'phase-one': ['First Gale', 'Basic', 'Third Gale', 'Basic', 'Fifth Gale', 'Seventh Gale'], 'phase-two': ['Ninth Gale', 'Skychain Silence', 'Basic', 'Third Gale', 'Fifth Gale', 'First Gale', 'Basic'] },
      'closed-index': { 'phase-one': ['Redaction', 'Basic', 'Stone Seal', 'Archive Lock', 'Basic', 'Null Entry'], 'phase-two': ['Final Index', 'Ember Clause', 'Redaction', 'Basic', 'Null Entry', 'Stone Seal'] },
    }
    for (const [monsterId, patterns] of Object.entries(expected)) {
      expect(phaseNames(monsterId, 'phase-one'), `${monsterId} phase one`).toEqual(patterns['phase-one'])
      expect(phaseNames(monsterId, 'phase-two'), `${monsterId} phase two`).toEqual(patterns['phase-two'])
    }
    for (const id of ['furnace-maw', 'tempest-sovereign', 'pyrehold-castellan', 'steam-tyrant', 'abbot-ninth-gale'] as const) {
      const phaseTraitId = MONSTERS[id].traitIds[0]!
      expect(TRAIT_DEFINITIONS[phaseTraitId].rules?.[0]?.effects.some((effect) => effect.type === 'apply-status' && effect.target === 'self' && effect.statusId === 'haste')).toBe(true)
    }
    const hasteBossIds = Object.values(EXPANSION_BOSSES_BY_LOCATION).filter((id) => {
      const trait = TRAIT_DEFINITIONS[MONSTERS[id!].traitIds[0]!]
      return trait.rules?.[0]?.effects.some((effect) => effect.type === 'apply-status' && effect.target === 'self' && effect.statusId === 'haste')
    })
    expect(hasteBossIds).toEqual(['furnace-maw', 'tempest-sovereign', 'pyrehold-castellan', 'steam-tyrant', 'abbot-ninth-gale'])
  })

  it('authors the four designed multi-hit skills as independent hits', () => {
    const cases = [
      ['ashen-duelist', 'first-special', 2, 'fire', 0.75],
      ['stormfeather-harrier', 'first-special', 3, 'air', 0.55],
      ['mistclaw-lynx', 'second-special', 2, 'air', 0.675],
      ['abbot-ninth-gale', 'skill-2', 2, 'air', 0.75],
    ] as const
    for (const [monsterId, actionId, hitCount, element, coefficient] of cases) {
      const damage = MONSTERS[monsterId].actions[actionId].effects.find((effect) => effect.type === 'deal-damage')
      expect(damage).toMatchObject({ type: 'deal-damage', hitCount, components: [{ damageType: element, magnitude: { type: 'source-basic-damage-percent', value: coefficient } }] })
    }
  })
})
