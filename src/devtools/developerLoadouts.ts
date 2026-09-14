import type { EquipmentPosition, ItemId } from '../game/types'

export interface DeveloperEquipmentLoadout {
  id: string
  label: string
  slots: Partial<Record<EquipmentPosition, ItemId>>
}

/** Explicit tester fixtures. Ring 1 and Ring 2 remain separate authored slots. */
export const DEVELOPER_LOADOUTS: readonly DeveloperEquipmentLoadout[] = [
  { id: 'woods-fire', label: 'Woods Fire', slots: { weapon: 'ember-staff', head: 'wispveil-hood', necklace: 'windthread-charm', earring1: 'wispglass-earring', ring1: 'wispbound-ring' } },
  { id: 'howling-basic', label: 'Howling Basic', slots: { weapon: 'ember-staff', head: 'wispveil-hood', earring1: 'fangwire-earring', ring1: 'howling-signet' } },
  { id: 'howling-tank', label: 'Howling Tank', slots: { weapon: 'stoneheart-scepter', armor: 'wispweave-robe', cape: 'predator-hide-mantle', necklace: 'greatbear-heartstone', earring1: 'fangwire-earring' } },
  { id: 'catacombs-status', label: 'Catacombs Status Caster', slots: { weapon: 'windthread-wand', head: 'wispveil-hood', necklace: 'soulglass-amulet', earring1: 'mourning-glass-earring', ring1: 'gravebinder-ring' } },
  { id: 'catacombs-battle-mage', label: 'Catacombs Battle Mage', slots: { weapon: 'windthread-wand', armor: 'wispweave-robe', earring1: 'mourning-glass-earring', ring1: 'edrins-signet' } },
]
