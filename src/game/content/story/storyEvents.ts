import type { ItemId, MonsterId, ScreenId, StoryEventId } from '../../types'

export interface StoryEventReward {
  type: 'unique-item'
  itemId: ItemId
  quantity: 1
}

export interface StoryEventDefinition {
  id: StoryEventId
  trigger: {
    type: 'boss-kill'
    bossId: MonsterId
    requiredKills: number
  }
  rewards: StoryEventReward[]
  unlocks?: { screens?: ScreenId[] }
  continueTo?: ScreenId
  presentation: {
    kicker: string
    title: string
    body: string[]
  }
}

export const STORY_EVENT_ORDER: StoryEventId[] = ['edrin-dark-portal-discovery']

export const STORY_EVENTS: Record<StoryEventId, StoryEventDefinition> = {
  'edrin-dark-portal-discovery': {
    id: 'edrin-dark-portal-discovery',
    trigger: { type: 'boss-kill', bossId: 'archmage-edrin-shade', requiredKills: 1 },
    rewards: [{ type: 'unique-item', itemId: 'black-portal-shard', quantity: 1 }],
    unlocks: { screens: ['tower-dark-portal'] },
    continueTo: 'tower-dark-portal',
    presentation: {
      kicker: 'STORY EVENT',
      title: 'A FRACTURE IN THE TOWER',
      body: [
        "Edrin's shade collapses into silence. For a moment, the Catacombs are still.",
        'Among the remnants of the Archmage lies a shard unlike anything you have seen before — black as a starless void, yet cold light moves beneath its fractured surface.',
        'The moment your hand closes around it, the Wizard Tower answers.',
        'Somewhere within its ancient walls, stone grinds against stone. A passage that was never there before opens into a forgotten chamber.',
        'And from beyond it, you feel something waiting.',
      ],
    },
  },
}

