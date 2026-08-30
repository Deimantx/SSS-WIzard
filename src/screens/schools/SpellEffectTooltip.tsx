import { SpellEffectDetailBlock } from './SpellEffectDetailBlock'
import type { SpellEffectTooltipModel } from './spellEffectTooltipModel'

export function SpellEffectTooltip({ model }: { model: SpellEffectTooltipModel }) {
  return <div className="game-tooltip-content game-tooltip-rich spell-effect-hover-tooltip"><SpellEffectDetailBlock model={model} density="tooltip" showSource /></div>
}
