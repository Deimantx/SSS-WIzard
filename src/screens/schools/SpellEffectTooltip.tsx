import { SCHOOLS } from '../../game/content/schools/schools'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import type { SpellEffectTooltipModel } from './spellEffectTooltipModel'

export function SpellEffectTooltip({ model }: { model: SpellEffectTooltipModel }) {
  const style = model.categoryKey === 'damage' ? { '--effect-accent': SCHOOLS[model.school].color } as React.CSSProperties : undefined
  return <TooltipContent title={<span className={`spell-tooltip-category effect-${model.categoryKey}`} style={style}>{model.category}</span>}>
    <div className={`spell-effect-tooltip effect-${model.categoryKey}`} data-school={model.school} style={style}>
      <strong className="spell-effect-tooltip-name">{model.title}</strong>
      <p className="spell-effect-tooltip-description">{model.description}</p>
      <div className="spell-effect-tooltip-rows">{model.rows.map((row, index) => <div className="tooltip-row" key={`${row.label}-${index}`}><span>{row.label}</span><b className={row.semantic ? `semantic-${row.semantic}` : undefined}>{row.value}</b></div>)}</div>
    </div>
  </TooltipContent>
}
