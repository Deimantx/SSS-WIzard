import type { MonsterId } from '../../../types'
import { authorExpansionNormalAt, hit, normalAction, status } from '../expansion/authoring'

const zone = 'cinder-sepulcher'
const huntingGround = { family: 'Sepulcher Rovers', alignment: 'Embermarked', contractTier: 'special' as const, minimumRank: 'veteran' as const, exclusive: true, contractRequired: true, huntingGroundId: zone }
export const CINDER_SEPULCHER_NORMALS = [
  authorExpansionNormalAt(zone, 9, 0, { id: 'emberbound-dead', name: 'Emberbound Dead', subtitle: 'A burial guardian animated by the sepulcher’s undying funeral fire.', affinity: 'fire', resonance: 8, hunter: huntingGround, specials: [normalAction('first-special', 'Gravebrand', { damage: [hit('fire', 1.25)], status: status('burning') }), normalAction('second-special', 'Ashen Return', { barrier: .06 })], pattern: ['first', 'basic', 'second', 'basic'] }),
  authorExpansionNormalAt(zone, 9, 1, { id: 'furnace-acolyte', name: 'Furnace Acolyte', subtitle: 'A keeper of the crypt rites tending its eternal flame.', affinity: 'fire', resonance: 8, hunter: huntingGround, specials: [normalAction('first-special', 'Funeral Flame', { damage: [hit('fire', 1.3)] }), normalAction('second-special', 'Cinder Rite', { heal: .06 })], pattern: ['first', 'basic', 'second', 'basic'] }),
  authorExpansionNormalAt(zone, 9, 2, { id: 'basalt-guardian', name: 'Basalt Guardian', subtitle: 'A stone sentinel carved to defend the oldest burial chambers.', affinity: 'earth', resonance: 8, hunter: huntingGround, specials: [normalAction('first-special', 'Tomb Crush', { damage: [hit('earth', 1.55)] }), normalAction('second-special', 'Basalt Ward', { barrier: .1 })], pattern: ['second', 'basic', 'first', 'basic'] }),
  authorExpansionNormalAt(zone, 9, 3, { id: 'ashen-archivist', name: 'Ashen Archivist', subtitle: 'A funerary record keeper preserving names in smoke-darkened runes.', affinity: 'arcane', resonance: 8, hunter: huntingGround, specials: [normalAction('first-special', 'Ash Script', { damage: [hit('arcane', 1.15)], status: status('cursed') }), normalAction('second-special', 'Ember Record', { damage: [hit('fire', 1), hit('arcane', .45)] })], pattern: ['first', 'basic', 'second', 'basic'] }),
] satisfies readonly ReturnType<typeof authorExpansionNormalAt>[]
export const CINDER_SEPULCHER_ROSTER = CINDER_SEPULCHER_NORMALS.map(({ id }) => id as MonsterId)
