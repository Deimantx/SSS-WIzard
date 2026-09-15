import type { AuthoredItemRegistry } from '../shared/itemAuthoring'

/** ACT 0 materials that remain in the item archive after direct Equipment loot removal. */
export const ACT0_MATERIALS: AuthoredItemRegistry = {
  'black-portal-shard': {
    id: 'black-portal-shard',
    name: 'Black Portal Shard',
    description: 'A shard of impossible black crystal recovered from Archmage Edrin. Cold light shifts beneath its fractured surface, and the Wizard Tower itself seems to answer its presence.',
    icon: '◆',
    color: '#7760a8',
    kind: 'material',
    category: 'material',
    inventoryCategory: 'special',
    materialTier: 1,
    source: "Archmage Edrin's Shade — first defeat",
    sourceNavigation: 'combat',
    sellValue: null,
    canDestroy: false,
    actionRestrictionReason: 'The shard is bound to the Dark Portal and cannot be discarded.',
  },
}
