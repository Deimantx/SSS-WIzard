import { useSyncExternalStore } from "react";
import type {
  ArtificingRecipeId,
  CombatLocationId,
  EquipmentPosition,
  ItemId,
  MonsterId,
  SigilSlot,
  SchoolId,
  SpellId,
  TransmutationRecipeId,
} from "../../game/types";

export interface NavigationIntent {
  inventoryItemId: ItemId | null;
  equipmentItemId: ItemId | null;
  equipmentPosition: EquipmentPosition | null;
  openSigilVault: boolean;
  equipmentSigilInstanceId: string | null;
  equipmentSigilSlot: SigilSlot | null;
  artificingSigilInstanceId: string | null;
  artificingSigilTab: 'refinement' | 'forge' | 'attunement' | null;
  artificingRecipeId: ArtificingRecipeId | null;
  transmutationRecipeId: TransmutationRecipeId | null;
  researchItemId: ItemId | null;
  researchSchoolId: SchoolId | null;
  schoolSpellId: SpellId | null;
  schoolId: SchoolId | null;
  combatLocationId: CombatLocationId | null;
  combatMonsterId: MonsterId | null;
  sigilSetId: import('../../game/types').SigilSetId | null;
  openCrystalInventory: boolean;
}

const emptyIntent: NavigationIntent = {
  inventoryItemId: null,
  equipmentItemId: null,
  equipmentPosition: null,
  openSigilVault: false,
  equipmentSigilInstanceId: null,
  equipmentSigilSlot: null,
  artificingSigilInstanceId: null,
  artificingSigilTab: null,
  artificingRecipeId: null,
  transmutationRecipeId: null,
  researchItemId: null,
  researchSchoolId: null,
  schoolSpellId: null,
  schoolId: null,
  combatLocationId: null,
  combatMonsterId: null,
  sigilSetId: null,
  openCrystalInventory: false,
};

let current = emptyIntent;
const listeners = new Set<() => void>();

export const setNavigationIntent = (changes: Partial<NavigationIntent>) => {
  current = { ...current, ...changes };
  listeners.forEach((listener) => listener());
  return current;
};

export const getNavigationIntent = () => current;
export const useNavigationIntent = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => current,
  );
