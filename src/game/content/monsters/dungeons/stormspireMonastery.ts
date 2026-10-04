import type { MonsterId } from '../../../types'
import { authorExpansionNormalAt, hit, normalAction, status } from '../expansion/authoring'

const zone = 'stormspire-monastery'
export const STORMSPIRE_MONASTERY_NORMALS = [
  authorExpansionNormalAt(zone, 11, 0, { id: 'zephyr-disciple', name: 'Zephyr Disciple', subtitle: 'A wind-trained ascetic practicing swift forms among the high towers.', affinity: 'air', resonance: 8, specials: [normalAction('first-special', 'Wind Palm', { damage: [hit('air', 1.3)] }), normalAction('second-special', 'Quick Step', { status: status('haste', 'self') })], pattern: ['first', 'basic', 'second', 'basic'] }),
  authorExpansionNormalAt(zone, 11, 1, { id: 'skychain-sentinel', name: 'Skychain Sentinel', subtitle: 'A tower guard bound to the monastery’s storm-swaying chains.', affinity: 'air', resonance: 8, specials: [normalAction('first-special', 'Chain Lash', { damage: [hit('air', 1.4)] }), normalAction('second-special', 'Skychain Ward', { barrier: .08 })], pattern: ['second', 'basic', 'first', 'basic'] }),
  authorExpansionNormalAt(zone, 11, 2, { id: 'stonebell-keeper', name: 'Stonebell Keeper', subtitle: 'A stone-bodied keeper listening for the monastery’s lowest bell.', affinity: 'earth', resonance: 8, specials: [normalAction('first-special', 'Bell Crush', { damage: [hit('earth', 1.5)] }), normalAction('second-special', 'Stone Resonance', { status: status('fortified', 'self') })], pattern: ['second', 'basic', 'first', 'basic'] }),
  authorExpansionNormalAt(zone, 11, 3, { id: 'rainveil-monk', name: 'Rainveil Monk', subtitle: 'A silent monk whose robes flow like rain through the open cloister.', affinity: 'water', resonance: 8, specials: [normalAction('first-special', 'Rain Palm', { damage: [hit('water', 1.2)], status: status('chilled') }), normalAction('second-special', 'Veil Step', { status: status('spectral-fade', 'self') })], pattern: ['first', 'basic', 'second', 'basic'] }),
] satisfies readonly ReturnType<typeof authorExpansionNormalAt>[]
export const STORMSPIRE_MONASTERY_ROSTER = STORMSPIRE_MONASTERY_NORMALS.map(({ id }) => id as MonsterId)
