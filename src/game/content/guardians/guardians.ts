import type { CombatModifier, DamageType } from '../../systems/combat/combatTypes'
import type { GuardianId, GuardiansState, MonsterId, SchoolId } from '../../types'
import { SCHOOLS } from '../schools/schools'

/** Canonical progression record used by every Summoning visibility/runtime guard. */
// The T2 Gatekeeper is not authored in the current content roster yet. Keep
// its stable progression key here so future T2 combat can record the kill
// without making the absent monster selectable in current content.
export const SUMMONING_UNLOCK_BOSS_ID: MonsterId = 'corrupted-elemental-gatekeeper' as MonsterId

export interface GuardianDefinition {
  id: GuardianId
  name: string
  element: SchoolId
  manaPerSecond: number
  attack: {
    intervalMs: number
    spellPowerCoefficient: number
    damageType: Extract<DamageType, SchoolId>
  }
  passive: {
    label: string
    description: string
    modifiers: CombatModifier[]
  }
  ui: {
    icon: string
    color: string
  }
}

export const GUARDIAN_IDS: readonly GuardianId[] = ['fire-guardian', 'water-guardian', 'earth-guardian', 'air-guardian']

export const GUARDIANS: Record<GuardianId, GuardianDefinition> = {
  'fire-guardian': {
    id: 'fire-guardian',
    name: 'Fire Guardian',
    element: 'fire',
    manaPerSecond: 5,
    attack: { intervalMs: 4000, spellPowerCoefficient: 0.30, damageType: 'fire' },
    passive: { label: '+5% Damage over Time', description: 'Increases the damage dealt by your Damage over Time effects while this Guardian is active.', modifiers: [{ key: 'damage-over-time-percent', value: 0.05 }] },
    ui: { icon: SCHOOLS.fire.glyph, color: SCHOOLS.fire.color },
  },
  'water-guardian': {
    id: 'water-guardian',
    name: 'Water Guardian',
    element: 'water',
    manaPerSecond: 5,
    attack: { intervalMs: 4000, spellPowerCoefficient: 0.26, damageType: 'water' },
    passive: { label: '+5% Barrier Power', description: 'Increases Barrier Power while this Guardian is active.', modifiers: [{ key: 'barrier-power-percent', value: 0.05 }] },
    ui: { icon: SCHOOLS.water.glyph, color: SCHOOLS.water.color },
  },
  'earth-guardian': {
    id: 'earth-guardian',
    name: 'Earth Guardian',
    element: 'earth',
    manaPerSecond: 5,
    attack: { intervalMs: 4500, spellPowerCoefficient: 0.30, damageType: 'earth' },
    passive: { label: '+5 Defense', description: 'Adds 5 Defense while this Guardian is active.', modifiers: [{ key: 'defense-flat', value: 5 }] },
    ui: { icon: SCHOOLS.earth.glyph, color: SCHOOLS.earth.color },
  },
  'air-guardian': {
    id: 'air-guardian',
    name: 'Air Guardian',
    element: 'air',
    manaPerSecond: 5,
    attack: { intervalMs: 3200, spellPowerCoefficient: 0.22, damageType: 'air' },
    passive: { label: '+5% Cooldown Recovery', description: 'Increases Spell Cooldown Recovery while this Guardian is active.', modifiers: [{ key: 'cooldown-recovery-percent', value: 0.05 }] },
    ui: { icon: SCHOOLS.air.glyph, color: SCHOOLS.air.color },
  },
}

export const createInitialGuardiansState = (): GuardiansState => ({
  selectedGuardianId: null,
  progress: Object.fromEntries(GUARDIAN_IDS.map((id) => [id, { level: 1, rank: 1 }])) as GuardiansState['progress'],
})

export const getGuardianDefinition = (guardianId: GuardianId | null | undefined) => guardianId ? GUARDIANS[guardianId] : undefined
