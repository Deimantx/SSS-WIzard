import { SpellEffectDetailBlock, SpellTooltipDetailHint } from './SpellEffectDetailBlock'
import type { SpellEffectTooltipModel } from '../../game/presentation/spells/spellEffectTooltipModel'
import { hasAdvancedSpellEffectRows } from '../../game/presentation/spells/spellEffectTooltipModel'
import { useTooltipDetailMode } from '../ui/tooltip/Tooltip'

export function SpellEffectTooltip({ model }: { model: SpellEffectTooltipModel }) {
  const { advanced } = useTooltipDetailMode()
  return <div className="game-tooltip-content game-tooltip-rich spell-effect-hover-tooltip" data-detail-mode={advanced ? 'advanced' : 'compact'}><SpellEffectDetailBlock model={model} density="tooltip" detailMode={advanced ? 'advanced' : 'compact'} showSource={advanced} />{!advanced && hasAdvancedSpellEffectRows(model) && <SpellTooltipDetailHint />}</div>
}
