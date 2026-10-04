import type { MonsterId } from '../../../types'
import { authorExpansionNormalAt, hit, normalAction, status } from '../expansion/authoring'

const zone = 'nullstone-archive'
export const NULLSTONE_ARCHIVE_NORMALS = [
  authorExpansionNormalAt(zone, 12, 0, { id: 'null-scribe', name: 'Null Scribe', subtitle: 'An archive keeper trained to erase dangerous spells from memory.', affinity: 'arcane', resonance: 8, specials: [normalAction('first-special', 'Null Script', { damage: [hit('arcane', 1.2)], status: status('arcane-disruption') }), normalAction('second-special', 'Cancel Rune', { damage: [hit('arcane', .8)], status: status('silenced') })], pattern: ['first', 'basic', 'second', 'basic'] }),
  authorExpansionNormalAt(zone, 12, 1, { id: 'obsidian-custodian', name: 'Obsidian Custodian', subtitle: 'A black-stone keeper guarding the archive’s sealed lower stacks.', affinity: 'earth', resonance: 8, specials: [normalAction('first-special', 'Obsidian Slam', { damage: [hit('earth', 1.5)] }), normalAction('second-special', 'Archive Guard', { barrier: .08 })], pattern: ['second', 'basic', 'first', 'basic'] }),
  authorExpansionNormalAt(zone, 12, 2, { id: 'runeplate-golem', name: 'Runeplate Golem', subtitle: 'A rune-carved construct built to contain forbidden knowledge.', affinity: 'earth', resonance: 8, specials: [normalAction('first-special', 'Runeplate Crush', { damage: [hit('earth', 1.4)] }), normalAction('second-special', 'Stoneplate', { status: status('fortified', 'self') })], pattern: ['second', 'basic', 'first', 'basic'] }),
  authorExpansionNormalAt(zone, 12, 3, { id: 'emberseal-keeper', name: 'Emberseal Keeper', subtitle: 'A vault guardian rekindling the archive’s ancient binding marks.', affinity: 'fire', resonance: 8, specials: [normalAction('first-special', 'Seal Flame', { damage: [hit('fire', 1.25)], status: status('burning') }), normalAction('second-special', 'Ember Lock', { damage: [hit('fire', .7), hit('arcane', .7)] })], pattern: ['first', 'basic', 'second', 'basic'] }),
] satisfies readonly ReturnType<typeof authorExpansionNormalAt>[]
export const NULLSTONE_ARCHIVE_ROSTER = NULLSTONE_ARCHIVE_NORMALS.map(({ id }) => id as MonsterId)
