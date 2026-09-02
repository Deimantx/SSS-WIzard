import { describe, expect, it } from 'vitest'
import { MONSTERS } from '../../content/monsters'
import { buildMonsterDossierCombatStatRows, getMonsterDossierCombatStats } from './enemyCombatStatPresentation'

describe('enemy combat stat presentation', () => {
  it('keeps dossier order and exposes a real Basic Attack rate', () => {
    const rows = buildMonsterDossierCombatStatRows(MONSTERS['forest-wisp'])
    expect(rows.slice(0, 7).map((row) => row.label)).toEqual(['Max Health', 'Basic Attack Damage', 'Basic Attack Speed', 'Defense', 'Damage Reduction', 'Crit Chance', 'Crit Damage'])
    expect(rows[2]).toMatchObject({ value: '0.36/s', description: 'Current Basic Attack Time: 2.80s.' })
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
