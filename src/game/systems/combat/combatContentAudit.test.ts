import { describe, expect, it } from 'vitest'
import { COMBAT_V2_AUDIT_MONSTER_IDS, buildCombatV2ContentAudit } from './combatContentAudit'
import { ELEMENTAL_TUTORIAL_ZONE_ROSTERS } from '../../content/monsters/elementalTutorial'
import { MONSTERS } from '../../content/monsters'
import { resolveEnemyPowerBreakdown } from './enemyPower'
import { getMonsterDamageProfile } from '../../content/monsters/monsterTypes'

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
  })
})
