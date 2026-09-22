import { act1Dungeon } from './dungeonFactory'

export const BROKEN_MERIDIAN_DUNGEON = act1Dungeon(
  'broken-meridian',
  'The Broken Meridian',
  ['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade'],
  'meridian-splitter',
  55,
  { type: 'all-boss-kills', bossIds: ['graveglass-behemoth', 'storm-archivist', 'fallen-astromancer'] },
  "The frontier's leyline has split into four hostile currents.",
  { encounterSequence: ['meridian-warden', 'fractured-channeler', 'arc-surge-horror', 'linebreaker-shade'] },
)
