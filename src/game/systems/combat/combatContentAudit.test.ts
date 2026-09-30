import { describe, expect, it } from 'vitest'
import { COMBAT_V2_AUDIT_MONSTER_IDS, buildCombatV2ContentAudit } from './combatContentAudit'
import { ELEMENTAL_TUTORIAL_ZONE_ROSTERS } from '../../content/monsters/elementalTutorial'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerBreakdown } from './enemyPower'
import { getMonsterDamageProfile } from '../../content/monsters/monsterTypes'
const elementalScarSources = import.meta.glob('../../content/monsters/act1/{fracturedApproach,floodedReliquary,ashenWatch,rootscarHollow,crossroadsOfRuin}.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>
const tutorialSource = import.meta.glob('../../content/monsters/elementalTutorial.ts', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>

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
})
