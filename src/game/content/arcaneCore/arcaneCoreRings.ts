import type { ArcaneCoreBranchId, ArcaneCoreRingIndex } from '../../types'

export const ARCANE_CORE_RING_GATES: Record<ArcaneCoreRingIndex, number> = { 1: 0, 2: 20, 3: 25, 4: 30 }
export const ARCANE_CORE_MAJOR_GATES: Record<ArcaneCoreRingIndex, number> = { 1: 30, 2: 35, 3: 35, 4: 40 }

export const ARCANE_CORE_RING_NAMES: Record<ArcaneCoreBranchId, Record<ArcaneCoreRingIndex, string>> = {
  power: { 1: 'Foundation', 2: 'Precision', 3: 'Arcane Assault', 4: 'Ascendancy' },
  vitality: { 1: 'Foundation', 2: 'Fortification', 3: 'Aegis', 4: 'Immortality' },
  focus: { 1: 'Reservoir', 2: 'Flow', 3: 'Resonance', 4: 'Transcendence' },
  control: { 1: 'Timing', 2: 'Suppression', 3: 'Dominion', 4: 'Absolute Control' },
}

export const getArcaneCoreRingName = (branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex) => ARCANE_CORE_RING_NAMES[branchId][ring]
