import type { EquipmentPosition, ItemId } from '../game/types'

export interface DeveloperEquipmentLoadout {
  id: string
  label: string
  slots: Partial<Record<EquipmentPosition, ItemId>>
}

/** Explicit tester fixtures using the current three-slot Artifact loadout. */
export const DEVELOPER_LOADOUTS: readonly DeveloperEquipmentLoadout[] = [
  { id: 'woods-fire', label: 'Woods Fire', slots: { weapon: 'ember-staff', armor: 'wispweave-robe', head: 'wispveil-hood' } },
  { id: 'woods-water', label: 'Woods Water', slots: { weapon: 'tideglass-wand', armor: 'wispweave-robe', head: 'wispveil-hood' } },
  { id: 'woods-earth', label: 'Woods Earth', slots: { weapon: 'stoneheart-scepter', armor: 'wispweave-robe', head: 'wispveil-hood' } },
  { id: 'woods-air', label: 'Woods Air', slots: { weapon: 'windthread-wand', armor: 'wispweave-robe', head: 'wispveil-hood' } },
  { id: 'act1-frontier', label: 'Act 1 Frontier', slots: { weapon: 'galeshard-staff', armor: 'convergence-robe', head: 'waystone-circlet' } },
]
