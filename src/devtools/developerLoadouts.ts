import type { EquipmentPosition, ItemId } from '../game/types'

export interface DeveloperEquipmentLoadout {
  id: string
  label: string
  slots: Partial<Record<EquipmentPosition, ItemId>>
}

/** Explicit tester fixtures. Ring 1 and Ring 2 remain separate authored slots. */
export const DEVELOPER_LOADOUTS: readonly DeveloperEquipmentLoadout[] = [
  { id: 'woods-fire', label: 'Woods Fire', slots: { weapon: 'ember-staff', helmet: 'wispveil-hood', amulet: 'windthread-charm', earring: 'wispglass-earring', ring1: 'wispbound-ring' } },
  { id: 'woods-water-barrier', label: 'Woods Barrier', slots: { weapon: 'prismatic-focus', armor: 'wispweave-robe', amulet: 'heartseed-necklace', earring: 'wispglass-earring' } },
  { id: 'howling-basic', label: 'Howling Basic', slots: { weapon: 'ember-staff', helmet: 'wispveil-hood', earring: 'fangwire-earring', ring1: 'howling-signet' } },
  { id: 'howling-tank', label: 'Howling Tank', slots: { weapon: 'stoneheart-scepter', armor: 'wispweave-robe', cape: 'predator-hide-mantle', amulet: 'greatbear-heartstone', earring: 'fangwire-earring' } },
  { id: 'catacombs-status', label: 'Catacombs Status Caster', slots: { weapon: 'windthread-wand', helmet: 'wispveil-hood', amulet: 'soulglass-amulet', earring: 'mourning-glass-earring', ring1: 'gravebinder-ring' } },
  { id: 'catacombs-battle-mage', label: 'Catacombs Battle Mage', slots: { weapon: 'windthread-wand', armor: 'wispweave-robe', earring: 'mourning-glass-earring', ring1: 'edrins-signet' } },
]
