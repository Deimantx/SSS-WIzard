import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { BLOCK_DAMAGE_REDUCTION } from '../../core/balance/combatStats'
import { buildEnemyCombatStatRows, buildMonsterDossierCombatStatRows, formatBasicAttackTime, getMonsterDossierCombatStats } from './enemyCombatStatPresentation'

describe('enemy combat stat presentation', () => {
  it('keeps dossier order and exposes a real Basic Attack rate', () => {
    const rows = buildMonsterDossierCombatStatRows(MONSTERS['forest-wisp'])
    expect(rows.slice(0, 7).map((row) => row.label)).toEqual(['Max Health', 'Basic Attack Damage', 'Basic Attack Speed', 'Crit Chance', 'Crit Damage', 'Defense', 'Damage Reduction'])
    expect(rows[2]).toMatchObject({ value: '0.36/s', description: 'Current Basic Attack Time: 2.80s.' })
  })

  it('assigns every authored stat to the shared taxonomy', () => {
    const rows = buildEnemyCombatStatRows({
      ...getMonsterDossierCombatStats(MONSTERS['grove-sentinel']),
      blockChance: 0.2,
      healingDoneBonus: 0.1,
      barrierPowerBonus: 0.1,
      damageOverTimeBonus: 0.1,
      statusDurationBonus: 0.1,
    })
    expect(Object.fromEntries(rows.map((row) => [row.id, row.group]))).toMatchObject({
      'max-health': 'core',
      'basic-attack-damage': 'offense',
      'basic-attack-speed': 'offense',
      'crit-chance': 'offense',
      'crit-damage': 'offense',
      defense: 'defense',
      'damage-reduction': 'defense',
      'block-chance': 'defense',
      'healing-done': 'utility',
      'barrier-power': 'utility',
      'damage-over-time': 'utility',
      'status-duration': 'utility',
    })
  })

  it('uses the shared Basic Attack time unit and Block mitigation constant', () => {
    expect(formatBasicAttackTime(2500)).toBe('2.50s')
    expect(formatBasicAttackTime(2500)).not.toContain('2500.00s')
    const rows = buildEnemyCombatStatRows({ ...getMonsterDossierCombatStats(MONSTERS['grove-sentinel']), blockChance: 0.2 })
    expect(rows.find((row) => row.id === 'block-chance')?.description).toContain(`${Math.round(BLOCK_DAMAGE_REDUCTION * 100)}%`)
  })

  it('preserves authored weaknesses and resistances without live state or trait effects', () => {
    const stats = getMonsterDossierCombatStats(MONSTERS['grave-wraith'])
    expect(stats.defense).toBe(10)
    expect(stats.resistances).toMatchObject({ physical: 0.5, fire: -0.25 })
    expect(buildMonsterDossierCombatStatRows(MONSTERS['grave-wraith']).filter((row) => row.group === 'resistance').map((row) => [row.label, row.value])).toEqual([
      ['Physical Resistance', '50%'],
      ['Fire Resistance', '-25%'],
      ['Water Resistance', '-25%'],
      ['Earth Resistance', '-25%'],
      ['Air Resistance', '-25%'],
    ])
  })
})
