import { useSyncExternalStore } from 'react'
import type { ArtificingRecipeId, DungeonId, EquipmentPosition, ItemId, MonsterId, SchoolId, SpellId, TransmutationRecipeId } from '../../game/types'

export interface NavigationIntent {
  inventoryItemId: ItemId | null
  equipmentItemId: ItemId | null
  equipmentPosition: EquipmentPosition | null
  artificingRecipeId: ArtificingRecipeId | null
  transmutationRecipeId: TransmutationRecipeId | null
  researchItemId: ItemId | null
  researchSchoolId: SchoolId | null
  schoolSpellId: SpellId | null
  schoolId: SchoolId | null
  combatDungeonId: DungeonId | null
  combatMonsterId: MonsterId | null
}

const emptyIntent: NavigationIntent = {
  inventoryItemId: null,
  equipmentItemId: null,
  equipmentPosition: null,
  artificingRecipeId: null,
  transmutationRecipeId: null,
  researchItemId: null,
  researchSchoolId: null,
  schoolSpellId: null,
  schoolId: null,
  combatDungeonId: null,
  combatMonsterId: null,
}

let current = emptyIntent
const listeners = new Set<() => void>()

export const setNavigationIntent = (changes: Partial<NavigationIntent>) => {
  current = { ...current, ...changes }
  listeners.forEach((listener) => listener())
  return current
}

export const getNavigationIntent = () => current
export const useNavigationIntent = () => useSyncExternalStore((listener) => { listeners.add(listener); return () => listeners.delete(listener) }, () => current, () => current)
