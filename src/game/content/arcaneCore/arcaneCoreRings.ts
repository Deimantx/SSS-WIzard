import { ARCANE_CORE_RING_INDICES } from './arcaneCoreBalance'
import type { ArcaneCoreBranchId, ArcaneCoreRingIndex } from '../../types'

export { ARCANE_CORE_RING_INDICES }
export const ARCANE_CORE_RING_GATES: Record<ArcaneCoreRingIndex, number> = { 1: 0, 2: 20, 3: 25, 4: 30, 5: 32, 6: 34, 7: 36, 8: 38 }
export const ARCANE_CORE_MAJOR_GATES: Record<ArcaneCoreRingIndex, number> = { 1: 30, 2: 35, 3: 35, 4: 40, 5: 40, 6: 40, 7: 40, 8: 40 }

export const ARCANE_CORE_RING_NAMES: Record<ArcaneCoreBranchId, Record<ArcaneCoreRingIndex, string>> = {
  power: { 1: 'Foundation', 2: 'Precision', 3: 'Arcane Assault', 4: 'Ascendancy', 5: 'Ruin', 6: 'Cataclysm', 7: 'Sovereignty', 8: 'Apotheosis' },
  vitality: { 1: 'Foundation', 2: 'Fortification', 3: 'Aegis', 4: 'Immortality', 5: 'Bastion', 6: 'Renewal', 7: 'Undying', 8: 'Eternal Aegis' },
  focus: { 1: 'Reservoir', 2: 'Flow', 3: 'Resonance', 4: 'Transcendence', 5: 'Convergence', 6: 'Overchannel', 7: 'Astral Mind', 8: 'Singularity' },
  control: { 1: 'Timing', 2: 'Suppression', 3: 'Dominion', 4: 'Absolute Control', 5: 'Interference', 6: 'Temporal Mastery', 7: 'Lockdown', 8: 'Absolute Stasis' },
}

export const ARCANE_CORE_NODE_ANGLE_STEP = 40
export const ARCANE_CORE_RING_OFFSETS = {
  1: 0,
  2: 20,
  3: 0,
  4: 20,
  5: 0,
  6: 20,
  7: 0,
  8: 20,
} satisfies Record<ArcaneCoreRingIndex, number>
export const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360

export const getArcaneCoreRingName = (branchId: ArcaneCoreBranchId, ring: ArcaneCoreRingIndex) => ARCANE_CORE_RING_NAMES[branchId][ring]
