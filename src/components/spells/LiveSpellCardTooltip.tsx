import { SpellCardTooltip } from './SpellCardTooltip'
import { getSpellRank } from '../../game/systems/spells'
import type { SpellId } from '../../game/types'
import { useGameStore } from '../../store/gameStore'
import { buildSpellDetailPresentation } from '../../screens/schools/spellDetailPresentation'

/**
 * Rich spell cards are intentionally resolved only when the tooltip mounts.
 * This keeps list/loadout renders on the lightweight read model while still
 * showing current live values inside the shared tooltip system.
 */
export function LiveSpellCardTooltip({ spellId }: { spellId: SpellId }) {
  const state = useGameStore.getState()
  const rank = getSpellRank(state, spellId)
  if (rank === null) return null
  return <SpellCardTooltip presentation={buildSpellDetailPresentation(state, spellId, rank)} />
}
