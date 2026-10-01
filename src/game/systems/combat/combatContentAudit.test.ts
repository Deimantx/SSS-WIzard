import { describe, expect, it } from 'vitest'
import { COMBAT_V2_AUDIT_MONSTER_IDS, buildCombatV2Act1GlobalAudit, buildCombatV2ContentAudit, buildCombatV2MonsterWorldTierComparison } from './combatContentAudit'
import { ELEMENTAL_TUTORIAL_ZONE_ROSTERS } from '../../content/monsters/elementalTutorial'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerBreakdown } from './enemyPower'
import { getMonsterDamageProfile } from '../../content/monsters/monsterTypes'
import { TRAIT_DEFINITIONS } from '../../content/traits/traits'
import type { TraitId } from './combatTypes'
import { resolveWorldTierEnemyProfile } from '../world-tier/worldTierRuntime'
import { ELITE_ZONE_AFFIXES } from '../../content/elite-affixes'
import { COMBAT_LOCATIONS } from '../../content/world-navigation/worldNavigation'
import { DUNGEONS, isDungeonUnlocked } from '../../content/dungeons/dungeons'
import { STATUS_DEFINITIONS } from '../../content/statuses/statuses'
const elementalScarSources = import.meta.glob('../../content/monsters/act1/{fracturedApproach,floodedReliquary,ashenWatch,rootscarHollow,crossroadsOfRuin}.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const tutorialSource = import.meta.glob('../../content/monsters/elementalTutorial.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const shatteredSources = import.meta.glob('../../content/monsters/act1/{graveglassHollow,stormvaultGallery,starfallenObservatory,brokenMeridian}.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const convertedAct1Sources = import.meta.glob('../../content/monsters/act1/*.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const blackSigilSources = import.meta.glob('../../content/monsters/act1/{hallOfUnboundNames,vaultOfTheBlackSigil,blackGate}.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

describe('Combat V2 authored content audit', () => {
  it('keeps tutorial tiers in their intended WT1 Power bands and above passive regeneration pressure', () => {
    const bands = [[95, 115], [125, 155], [170, 210], [230, 280]] as const
    for (const roster of Object.values(ELEMENTAL_TUTORIAL_ZONE_ROSTERS)) {
      roster.normalEnemyIds.forEach((id, index) => {
        const monster = MONSTERS[id]
        const row = resolveEnemyPowerBreakdown(id, 1)
        expect(row.power).toBeGreaterThanOrEqual(bands[index][0])
        expect(row.power).toBeLessThanOrEqual(bands[index][1])
        expect(monster.basicAttackDamage).toBeGreaterThan(0)
        if (index >= 1) expect(row.basicDps).toBeGreaterThan(1)
      })
      const boss = resolveEnemyPowerBreakdown(roster.bossId, 1)
      expect(boss.power).toBeGreaterThanOrEqual(400)
      expect(boss.power).toBeLessThanOrEqual(500)
      expect(boss.basicDps).toBeGreaterThan(1)
    }
  })

  it('reports source-scaled tutorial Burning and no Physical damage in reconstructed Act 0', () => {
    const audit = buildCombatV2ContentAudit()
    expect(audit).toHaveLength(COMBAT_V2_AUDIT_MONSTER_IDS.length)
    expect(audit.filter((row) => row.physicalComponentCount > 0).map((row) => row.id)).toEqual([])
    const ashling = audit.find((row) => row.id === 'emberfall-ashling')!
    const adept = audit.find((row) => row.id === 'emberfall-ashen-adept')!
    const pyre = audit.find((row) => row.id === 'pyre-guardian')!
    expect(ashling.dotTotalCoefficient).toBeCloseTo(0.85)
    expect(adept.dotTotalCoefficient).toBeCloseTo(1.15)
    expect(pyre.dotTotalCoefficient).toBeCloseTo(1.4)
    expect(MONSTERS['stonewake-stonebound-warden'].actions.quake.effects.some((effect) => effect.type === 'apply-status' && effect.statusId === 'tremored')).toBe(true)
  })

  it('pins every rebuilt first-frontier WT1 roster to its authored Power target', () => {
    const profiles: readonly [keyof typeof MONSTERS, number][] = [
      ['forest-wisp', 300], ['thornling', 340], ['dewbound-sprite', 380], ['cinder-moth', 420], ['stone-root', 460], ['grove-sentinel', 520], ['tempest-stag', 600], ['forest-heart', 850],
      ['cavefang-wolf', 650], ['razorclaw-lynx', 700], ['corrupted-dire-wolf', 760], ['bonehide-boar', 820], ['moonblind-jackal', 880], ['den-stalker', 950], ['corrupted-greatbear', 1300],
      ['ashen-tracker', 850], ['gloamfang-stalker', 900], ['runehorn-brute', 980], ['veilwing-harrier', 1050], ['cinderback-mauler', 1150], ['gloomroot-hexer', 1250], ['nightglass-alpha', 1500],
      ['restless-skeleton', 1100], ['grave-wraith', 1250], ['fallen-acolyte', 1400], ['archmage-edrin-shade', 2200],
    ]
    profiles.forEach(([id, targetPower]) => expect(resolveEnemyPowerBreakdown(id, 1).power, id).toBe(targetPower))
  })

  it('derives Damage Profile from basic and authored damage components', () => {
    expect(getMonsterDamageProfile(MONSTERS['corrupted-greatbear'])).toEqual(['earth', 'arcane'])
    expect(getMonsterDamageProfile(MONSTERS['archmage-edrin-shade'])).toEqual(['fire', 'water', 'arcane'])
    expect(getMonsterDamageProfile(MONSTERS['rift-wolf'])).toEqual(['air'])
    expect(getMonsterDamageProfile(MONSTERS['drowned-keeper'])).toEqual(['water', 'arcane'])
    expect(getMonsterDamageProfile(MONSTERS['flamebound-revenant'])).toEqual(['fire'])
    expect(getMonsterDamageProfile(MONSTERS['rootscar-ancient'])).toEqual(['earth'])
    expect(getMonsterDamageProfile(MONSTERS['crossroads-keeper'])).toEqual(['fire', 'water', 'air', 'earth', 'arcane'])
    expect(getMonsterDamageProfile(MONSTERS['fallen-astromancer'])).toEqual(['fire', 'air', 'arcane'])
  })

  it('pins explicit Elemental Scar identities and deterministic WT1 target Power', () => {
    const profiles: readonly [keyof typeof MONSTERS, number, string][] = [
      ['rift-wolf', 2350, 'air'], ['arcane-scavenger', 2500, 'arcane'], ['withered-watcher', 2700, 'arcane'], ['warded-husk', 2900, 'earth'], ['corrupted-elemental-gatekeeper', 3700, 'arcane'],
      ['drowned-acolyte', 3000, 'water'], ['reliquary-slime', 3200, 'water'], ['mist-wraith', 3350, 'water'], ['rune-leech', 3500, 'arcane'], ['tidefang-serpent', 3700, 'water'], ['brinebound-sentinel', 3950, 'water'], ['abyssal-archivist', 4200, 'arcane'], ['drowned-keeper', 5000, 'water'],
      ['cinder-hound', 3050, 'fire'], ['ash-cultist', 3250, 'fire'], ['fire-elemental', 3450, 'fire'], ['lava-eel', 3650, 'fire'], ['emberwing-harrier', 3850, 'fire'], ['charred-warden', 4100, 'fire'], ['pyre-colossus', 4350, 'fire'], ['flamebound-revenant', 5100, 'fire'],
      ['thorn-maw', 3100, 'earth'], ['rootbound-stalker', 3300, 'earth'], ['briar-sprite', 3500, 'earth'], ['moss-carapace', 3700, 'earth'], ['sporeback-brute', 3950, 'earth'], ['vinebound-reaver', 4200, 'earth'], ['scarwood-behemoth', 4450, 'earth'], ['rootscar-ancient', 5200, 'earth'],
      ['arcane-binder', 4300, 'arcane'], ['rift-archer', 4500, 'air'], ['remnant-marauder', 4700, 'earth'], ['broken-construct', 4900, 'earth'], ['crossroads-keeper', 6000, 'arcane'],
    ]
    for (const [id, targetPower, affinity] of profiles) {
      expect(MONSTERS[id].primaryAffinity, id).toBe(affinity)
      expect(MONSTERS[id].basicAttackElement, id).toBe(affinity)
      expect(resolveEnemyPowerBreakdown(id, 1).power, id).toBe(targetPower)
    }
    const scarRows = buildCombatV2ContentAudit().filter((row) => ['Fractured Approach', 'Flooded Reliquary', 'Ashen Watch', 'Rootscar Hollow', 'Crossroads of Ruin'].includes(row.location))
    expect(scarRows.every((row) => row.physicalComponentCount === 0), scarRows.filter((row) => row.physicalComponentCount > 0).map((row) => row.id).join(', ')).toBe(true)
    expect(scarRows.flatMap((row) => row.warnings.filter((warning) => warning.startsWith('Generic or missing action description')))).toEqual([])
    for (const [file, source] of Object.entries(elementalScarSources)) {
      expect(source, file).not.toMatch(/(?:damageType|type):\s*['"]physical['"]|statusId:\s*['"]poisoned['"]|status:\s*\{\s*id:\s*['"]regeneration['"]|status:\s*\{\s*id:\s*['"]burning['"]/)
    }
  })

  it('audits one-time boss sustain and respects the selected World Tier profile', () => {
    const wt1 = buildCombatV2ContentAudit(1)
    const wt2 = buildCombatV2ContentAudit(2)
    const row = (rows: typeof wt1, id: keyof typeof MONSTERS) => rows.find((entry) => entry.id === id)!
    expect(row(wt1, 'forest-heart').onceOnlyHealPercent).toBeCloseTo(0.15)
    expect(row(wt1, 'archmage-edrin-shade').onceOnlyBarrierPercent).toBe(0)
    expect(row(wt1, 'flamebound-revenant').onceOnlyHealPercent).toBeCloseTo(0.14)
    expect(row(wt1, 'rootscar-ancient').onceOnlyHealPercent).toBeCloseTo(0.15)
    expect(row(wt1, 'forest-heart').defaultFlatPeriodicCount).toBe(0)
    expect(row(wt2, 'drowned-keeper').hp).toBeGreaterThan(row(wt1, 'drowned-keeper').hp)
    expect(row(wt2, 'drowned-keeper').power).toBeGreaterThan(row(wt1, 'drowned-keeper').power)
  })

  it('keeps tutorial stats directly authored instead of generated through profile helpers', () => {
    const source = Object.values(tutorialSource)[0]
    expect(source).toBeTruthy()
    expect(source).not.toMatch(/tutorialProfiles|makeMonster/)
    for (const roster of Object.values(ELEMENTAL_TUTORIAL_ZONE_ROSTERS)) {
      for (const id of [...roster.normalEnemyIds, roster.bossId]) {
        expect(MONSTERS[id].maxHealth).toBeGreaterThan(0)
        expect(MONSTERS[id].basicAttackDamage).toBeGreaterThan(0)
      }
    }
  })

  it('emits an action description warning for a deliberately generic description', () => {
    const monster = MONSTERS['graveglass-shade']
    const original = monster.actions
    try {
      monster.actions = { ...original, 'audit-generic': { id: 'audit-generic', name: 'Audit Generic', actionTimeMs: 1000, description: `${monster.name} uses Audit Generic.`, effects: [], tags: ['special'] } }
      expect(buildCombatV2ContentAudit().find((row) => row.id === monster.id)?.warnings).toContain('Generic or missing action description: Audit Generic')
    } finally {
      monster.actions = original
    }
  })

  it('tracks default flat periodic healing and retains once-only Trait ownership', () => {
    const monster = MONSTERS['forest-heart']
    const originalActions = monster.actions
    const originalTraitIds = monster.traitIds
    const testTraitId = 'audit-periodic-heal-once' as TraitId
    const originalTrait = TRAIT_DEFINITIONS[testTraitId]
    try {
      monster.actions = { ...originalActions, 'audit-regeneration': { id: 'audit-regeneration', name: 'Audit Regeneration', actionTimeMs: 1000, description: 'Applies the authored default Regeneration healing payload.', effects: [{ type: 'apply-status', target: 'self', statusId: 'regeneration' }], tags: ['special', 'heal', 'buff'] } }
      monster.traitIds = [...originalTraitIds, testTraitId]
      TRAIT_DEFINITIONS[testTraitId] = { id: testTraitId, name: 'Audit Renewal', description: 'One encounter-only healing application.', rules: [{ id: 'audit-renewal', event: 'on-hp-threshold', condition: { type: 'self-hp-below-percent', percent: 50 }, oncePerEncounter: true, effects: [{ type: 'apply-status', target: 'self', statusId: 'regeneration' }] }] }
      const row = buildCombatV2ContentAudit().find((entry) => entry.id === monster.id)!
      expect(row.defaultFlatPeriodicHealCount).toBe(2)
      expect(row.defaultFlatPeriodicDamageCount).toBe(0)
      expect(row.periodicHealPercent).toBeCloseTo((2 * 30) / monster.maxHealth)
      expect(row.repeatableSustainPercent).toBeGreaterThan(row.repeatableBarrierPercent)
      expect(row.onceOnlySustainPercent).toBeCloseTo(0.15 + 30 / monster.maxHealth)
      expect(row.warnings).toContain('2 default flat periodic healing payload(s)')
    } finally {
      monster.actions = originalActions
      monster.traitIds = originalTraitIds
      if (originalTrait) TRAIT_DEFINITIONS[testTraitId] = originalTrait
      else delete TRAIT_DEFINITIONS[testTraitId]
    }
  })

  it('preserves one-time Elite Affix ownership for periodic healing', () => {
    const location = COMBAT_LOCATIONS['graveglass-hollow']
    const affix = ELITE_ZONE_AFFIXES.regenerative
    const originalAffixId = location.zoneAffixId
    const originalRules = affix.rules
    try {
      location.zoneAffixId = 'regenerative'
      affix.rules = [{ id: 'audit-affix-regeneration', event: 'on-combat-start', oncePerEncounter: true, effects: [{ type: 'apply-status', target: 'self', statusId: 'regeneration' }] }]
      const monster = MONSTERS['graveglass-shade']
      const row = buildCombatV2ContentAudit().find((entry) => entry.id === monster.id)!
      expect(row.onceOnlyHealPercent).toBeCloseTo((6 * 5) / monster.maxHealth)
      expect(row.defaultFlatPeriodicHealCount).toBe(1)
    } finally {
      location.zoneAffixId = originalAffixId
      affix.rules = originalRules
    }
  })

  it('uses explicit periodic payloads instead of also scanning the Status default in Damage Profile', () => {
    const base = MONSTERS['tidefang-serpent']
    const profileMonster = {
      ...base,
      primaryAffinity: 'water' as const,
      basicAttackElement: 'water' as const,
      traitIds: [],
      actions: {
        only: { id: 'only', name: 'Only', actionTimeMs: 1000, description: 'Applies the authored Earth payload.', effects: [{ type: 'apply-status' as const, target: 'opponent' as const, statusId: 'burning' as const, durationMs: 5000, periodicEffects: [{ type: 'deal-damage' as const, target: 'self' as const, components: [{ damageType: 'earth' as const, magnitude: { type: 'flat' as const, value: 1 } }], tags: ['dot' as const, 'earth' as const] }] }], tags: ['special' as const] },
      },
    }
    expect(getMonsterDamageProfile(profileMonster)).toEqual(['water', 'earth'])
  })

  it('pins every Shattered Meridian WT1 target Power, identity, and elemental-only damage', () => {
    const profiles: readonly [keyof typeof MONSTERS, number, string][] = [
      ['graveglass-shade', 5700, 'water'], ['bone-shardling', 5950, 'earth'], ['silent-mourner', 6200, 'water'], ['crypt-guardian', 6450, 'earth'], ['epitaph-weaver', 6800, 'arcane'], ['tombglass-reaver', 7200, 'earth'], ['ossuary-oracle', 7600, 'arcane'], ['graveglass-behemoth', 9100, 'earth'],
      ['volt-wisp', 5600, 'air'], ['gale-scribe', 5900, 'air'], ['charged-seeker', 6200, 'air'], ['thundercoil-serpent', 6500, 'air'], ['static-armor', 6800, 'air'], ['stormbound-curator', 7150, 'air'], ['tempest-engine', 7550, 'air'], ['storm-archivist', 9000, 'air'],
      ['starbound-eye', 5800, 'arcane'], ['astral-husk', 6100, 'arcane'], ['orbiting-fragment', 6400, 'arcane'], ['lenskeeper-remnant', 6750, 'arcane'], ['comet-wraith', 7100, 'fire'], ['voidglass-custodian', 7500, 'arcane'], ['zenith-horror', 7900, 'fire'], ['fallen-astromancer', 9300, 'arcane'],
      ['meridian-warden', 8000, 'earth'], ['fractured-channeler', 8350, 'water'], ['arc-surge-horror', 8700, 'arcane'], ['linebreaker-shade', 9050, 'air'], ['meridian-splitter', 11800, 'arcane'],
    ]
    for (const [id, targetPower, affinity] of profiles) {
      expect(MONSTERS[id].primaryAffinity, id).toBe(affinity)
      expect(MONSTERS[id].basicAttackElement, id).toBe(affinity)
      expect(resolveEnemyPowerBreakdown(id, 1).power, id).toBe(targetPower)
    }
    const damageProfiles: ReadonlyArray<readonly [keyof typeof MONSTERS, readonly string[]]> = [
      ['graveglass-shade', ['water', 'arcane']], ['bone-shardling', ['earth']], ['silent-mourner', ['water', 'arcane']], ['crypt-guardian', ['earth']], ['epitaph-weaver', ['arcane']], ['tombglass-reaver', ['earth']], ['ossuary-oracle', ['arcane']], ['graveglass-behemoth', ['earth', 'arcane']],
      ['volt-wisp', ['air']], ['gale-scribe', ['air']], ['charged-seeker', ['air']], ['thundercoil-serpent', ['air']], ['static-armor', ['air']], ['stormbound-curator', ['air']], ['tempest-engine', ['air']], ['storm-archivist', ['air']],
      ['starbound-eye', ['arcane']], ['astral-husk', ['arcane']], ['orbiting-fragment', ['arcane']], ['lenskeeper-remnant', ['arcane']], ['comet-wraith', ['fire']], ['voidglass-custodian', ['arcane']], ['zenith-horror', ['fire', 'air', 'arcane']], ['fallen-astromancer', ['fire', 'air', 'arcane']],
      ['meridian-warden', ['earth', 'arcane']], ['fractured-channeler', ['fire', 'water']], ['arc-surge-horror', ['arcane']], ['linebreaker-shade', ['air', 'arcane']], ['meridian-splitter', ['fire', 'water', 'air', 'earth', 'arcane']],
    ]
    for (const [id, expected] of damageProfiles) expect(getMonsterDamageProfile(MONSTERS[id]), id).toEqual(expected)
    const shatteredRows = buildCombatV2ContentAudit().filter((row) => row.region === 'shattered-meridian')
    expect(shatteredRows).toHaveLength(profiles.length)
    expect(shatteredRows.every((row) => row.physicalComponentCount === 0 && row.defaultFlatPeriodicDamageCount === 0 && row.defaultFlatPeriodicHealCount === 0)).toBe(true)
    for (const [file, source] of Object.entries(shatteredSources)) {
      expect(source, file).not.toMatch(/(?:damageType|type):\s*['"]physical['"]|statusId:\s*['"]poisoned['"]|status:\s*\{\s*id:\s*['"]regeneration['"]|status:\s*\{\s*id:\s*['"]burning['"]|applyCombatV2Profile/)
      expect(source, file).not.toMatch(/Ãƒ|Ã¢â‚¬â„¢|Ã¢â‚¬Å“|Ã¢â‚¬/)
    }
  })

  it('pins Black Sigil target Power, affinity, damage profile, and normal/boss dungeon behavior', () => {
    const profiles: readonly [keyof typeof MONSTERS, number, string, readonly string[]][] = [
      ['name-eater', 9800, 'arcane', ['arcane']], ['bound-echo', 10300, 'air', ['air', 'arcane']], ['hollow-liturgist', 10800, 'water', ['water', 'arcane']], ['whisper-archivist', 11300, 'air', ['air', 'arcane']], ['nameless-cantor', 11900, 'water', ['water', 'arcane']], ['oathless-confessor', 12600, 'water', ['water', 'arcane']], ['unwritten-hierophant', 13300, 'arcane', ['arcane']], ['unspoken-prelate', 15500, 'arcane', ['arcane', 'air', 'water']],
      ['black-seal-parasite', 10000, 'fire', ['fire', 'arcane']], ['inkbound-specter', 10500, 'arcane', ['arcane']], ['sigil-guardian', 11100, 'earth', ['earth']], ['vault-devourer', 11700, 'earth', ['earth', 'arcane']], ['sealbound-custodian', 12300, 'earth', ['earth', 'arcane']], ['blackscript-colossus', 13000, 'earth', ['earth', 'arcane']], ['voidseal-arbiter', 13800, 'fire', ['fire', 'arcane']], ['sigil-warden', 16000, 'earth', ['earth', 'fire', 'arcane']],
      ['gatebound-remnant', 14000, 'earth', ['earth']], ['black-rift-stalker', 14500, 'air', ['air', 'arcane']], ['portalbound-acolyte', 15000, 'arcane', ['arcane']], ['sealbreaker-construct', 15500, 'earth', ['earth', 'arcane']], ['black-gatekeeper', 20000, 'arcane', ['arcane', 'fire', 'water', 'earth', 'air']],
    ]
    const audit = buildCombatV2ContentAudit(1)
    const blackSigilRows = audit.filter((row) => row.region === 'black-sigil-reach')
    expect(blackSigilRows).toHaveLength(profiles.length)
    for (const [id, targetPower, affinity, damageProfile] of profiles) {
      const monster = MONSTERS[id]
      const row = blackSigilRows.find((entry) => entry.id === id)!
      expect(monster.primaryAffinity, id).toBe(affinity)
      expect(monster.basicAttackElement, id).toBe(affinity)
      expect(row.power, id).toBe(targetPower)
      expect(row.location, id).not.toBe('Unknown')
      expect(row.hp, id).toBeGreaterThan(0)
      expect(row.basicDamage, id).toBeGreaterThan(0)
      expect(row.basicIntervalMs, id).toBeGreaterThan(0)
      expect(getMonsterDamageProfile(monster).sort(), id).toEqual([...damageProfile].sort())
      expect(row.physicalComponentCount, id).toBe(0)
      expect(row.defaultFlatPeriodicDamageCount, id).toBe(0)
      expect(row.defaultFlatPeriodicHealCount, id).toBe(0)
      if (monster.bestiaryCategory === 'boss') expect(monster.traitIds.some((traitId) => /distinct Act 1 combat trait shaping this creature/i.test(TRAIT_DEFINITIONS[traitId]?.description ?? ''))).toBe(false)
    }

    const hall = DUNGEONS['hall-of-unbound-names']
    const vault = DUNGEONS['vault-of-the-black-sigil']
    const gate = DUNGEONS['black-gate']
    expect([hall.threatRequired, vault.threatRequired]).toEqual([40000, 40000])
    expect(hall.unlock).toEqual({ type: 'boss-kill', bossId: 'meridian-splitter' })
    expect(vault.unlock).toEqual({ type: 'boss-kill', bossId: 'meridian-splitter' })
    expect(isDungeonUnlocked(gate, { bossKillsByBoss: { 'unspoken-prelate': 1, 'sigil-warden': 0 } } as never)).toBe(false)
    expect(isDungeonUnlocked(gate, { bossKillsByBoss: { 'unspoken-prelate': 1, 'sigil-warden': 1 } } as never)).toBe(true)
    expect(gate).toMatchObject({ threatRequired: 0, encounterSequence: ['gatebound-remnant', 'black-rift-stalker', 'portalbound-acolyte', 'sealbreaker-construct'] })
    expect(COMBAT_LOCATIONS['hall-of-unbound-names']).toMatchObject({ type: 'elite-zone', encounterMode: 'targeted', zoneAffixId: 'vicious' })
    expect(COMBAT_LOCATIONS['vault-of-the-black-sigil']).toMatchObject({ type: 'elite-zone', encounterMode: 'targeted', zoneAffixId: 'armored' })
    expect(blackSigilRows.every((row) => row.genericActionDescriptionCount === 0 && row.genericEquippedTraitCount === 0), JSON.stringify(blackSigilRows.filter((row) => row.genericActionDescriptionCount || row.genericEquippedTraitCount))).toBe(true)
    for (const [file, source] of Object.entries(blackSigilSources)) {
      expect(source, file).not.toMatch(/(?:damageType|type):\s*['"]physical['"]|resistances:\s*\{[^}]*physical/)
      expect(source, file).not.toMatch(/statusId:\s*['"](?:burning|poisoned|regeneration)['"]|status:\s*\{\s*id:\s*['"](?:burning|poisoned|regeneration)['"]|\bheal:\s*[\d.]+/)
    }
    expect(buildCombatV2Act1GlobalAudit()).toMatchObject({ implicitAffinityCount: 0, physicalComponentCount: 0, genericEquippedTraitCount: 0 })
  })

  it('keeps Gatekeeper threshold mechanics on a single deterministic phase change', () => {
    const gatekeeper = MONSTERS['black-gatekeeper']
    expect(gatekeeper.traitIds).toContain('black-gatekeeper-unbound-phase')
    const gatekeeperTrait = TRAIT_DEFINITIONS['black-gatekeeper-unbound-phase']
    if (!gatekeeperTrait) throw new Error('Missing Gatekeeper phase Trait.')
    const phaseRule = gatekeeperTrait.rules?.[0]
    if (!phaseRule) throw new Error('Missing Gatekeeper phase rule.')
    expect(phaseRule).toMatchObject({ oncePerEncounter: true, effects: [{ type: 'apply-status', statusId: 'gate-unbound' }, { type: 'set-action-pattern', patternId: 'unbound' }] })
    const actionIds = (steps: typeof gatekeeper.actionPatterns[string]['steps']) => steps.flatMap((step) => step.type === 'action' ? [step.actionId] : [])
    expect(actionIds(gatekeeper.actionPatterns['sealed']!.steps)).toEqual(['gatefire', 'abyssal-tide', 'broken-earth', 'black-gale', 'gate-seal'])
    expect(actionIds(gatekeeper.actionPatterns['unbound']!.steps)).toEqual(['portal-corruption', 'unspoken-lock', 'rift-convergence', 'rupture-axis', 'gate-seal', 'black-rupture'])
    expect(gatekeeper.actions['black-rupture']!.effects).toEqual(expect.arrayContaining([expect.objectContaining({ type: 'deal-damage', components: expect.arrayContaining([expect.objectContaining({ damageType: 'arcane', magnitude: expect.objectContaining({ value: 2.5 }) })]) })]))
    expect(phaseRule.effects.some((effect) => effect.type === 'heal' || effect.type === 'gain-barrier')).toBe(false)
    expect(STATUS_DEFINITIONS['gate-unbound']).toMatchObject({ defaultDurationMs: null, cleanseable: false, dispellable: false, modifiers: [expect.objectContaining({ key: 'damage-dealt-percent', value: 0.15 })] })
  })

  it('produces canonical WT1 through WT5 Power and stat comparisons', () => {
    const rows = buildCombatV2MonsterWorldTierComparison('meridian-splitter')
    expect(rows.map((row) => row.worldTier)).toEqual([1, 2, 3, 4, 5])
    rows.forEach((row) => {
      const profile = resolveWorldTierEnemyProfile('meridian-splitter', row.worldTier)
      expect(row).toMatchObject({ power: resolveEnemyPowerBreakdown('meridian-splitter', row.worldTier).power, hp: profile.maxHealth, basicDamage: profile.basicAttackDamage, defense: profile.defense })
    })
  })

  it('finds common source mojibake markers in converted Act 1 combat definitions', () => {
    expect(Object.keys(convertedAct1Sources).length).toBeGreaterThan(0)
    for (const [file, source] of Object.entries(convertedAct1Sources)) expect(source, file).not.toMatch(/Ãƒ|Ã¢â‚¬â„¢|Ã¢â‚¬Å“|Ã¢â‚¬/)
  })
})
