import { SCHOOLS } from '../../game/content/schools/schools'
import type { SpellDetailPresentation } from '../../game/presentation/spells/spellDetailPresentation'
import { hasAdvancedSpellEffectRows } from '../../game/presentation/spells/spellEffectTooltipModel'
import { useTooltipDetailMode } from '../ui/tooltip/Tooltip'
import { SpellEffectDetailBlock, SpellTooltipDetailHint } from './SpellEffectDetailBlock'
import { formatResourceAmount } from '../../game/presentation/resources/resourcePresentation'

export function SpellCardTooltip({ presentation }: { presentation: SpellDetailPresentation }) {
  const { advanced } = useTooltipDetailMode()
  const school = SCHOOLS[presentation.school]
  const schoolStyle = { '--spell-school-color': school.color } as React.CSSProperties
  const hasAdvancedRows = presentation.effects.some(hasAdvancedSpellEffectRows)

  return <div className="game-tooltip-content game-tooltip-rich spell-card-tooltip" data-detail-mode={advanced ? 'advanced' : 'compact'}>
    <div className="spell-card-tooltip-header"><span className="spell-card-tooltip-meta" style={schoolStyle}>{school.name.toUpperCase()} · {presentation.rankLabel.toUpperCase()}</span><strong className="spell-card-tooltip-name">{presentation.spellName}</strong><p>{presentation.description}</p></div>
    <section className="spell-card-tooltip-section"><span className="spell-card-tooltip-section-label">CORE CASTING</span><div className="spell-card-tooltip-core"><div className="spell-card-tooltip-metric"><small>MANA</small><strong className="ui-mana">{formatResourceAmount(presentation.manaCost)}</strong></div><div className="spell-card-tooltip-metric"><small>CAST TIME</small><strong className="ui-cast-time">{presentation.castTimeLabel}</strong></div><div className="spell-card-tooltip-metric"><small>COOLDOWN</small><strong className="ui-cooldown">{presentation.cooldownLabel}</strong></div><div className="spell-card-tooltip-metric"><small>AUTO-CAST FOCUS</small><strong className="ui-focus">{presentation.autoCastFocus} Focus</strong>{presentation.autoCastActive && <em className="spell-card-tooltip-active">ACTIVE</em>}</div></div></section>
    <section className="spell-card-tooltip-section"><span className="spell-card-tooltip-section-label">EFFECTS</span><div className="spell-card-tooltip-effects">{presentation.effects.map((effect, index) => <SpellEffectDetailBlock key={`${effect.categoryKey}-${effect.title}-${index}`} model={effect} density="card" detailMode={advanced ? 'advanced' : 'compact'} showSource={advanced} />)}</div></section>
    {!advanced && hasAdvancedRows && <SpellTooltipDetailHint />}
  </div>
}
