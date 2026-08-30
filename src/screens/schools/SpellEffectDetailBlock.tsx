import { SCHOOLS } from '../../game/content/schools/schools'
import type { SpellEffectTooltipModel, SpellEffectTooltipRow, SpellEffectTooltipSemantic } from './spellEffectTooltipModel'
import { getInspectorInlineEffectRows, getSpellbookTooltipRows } from './spellDetailPresentation'

export type SpellEffectDetailDensity = 'inline' | 'tooltip' | 'card'

export function SpellEffectDetailBlock({ model, density, showSource = false }: { model: SpellEffectTooltipModel; density: SpellEffectDetailDensity; showSource?: boolean }) {
  const rows = density === 'inline' ? getInspectorInlineEffectRows(model) : showSource ? model.rows : getSpellbookTooltipRows(model)
  const style = model.categoryKey === 'damage' ? { '--effect-accent': SCHOOLS[model.school].color } as React.CSSProperties : undefined
  return <section className={`spell-effect-detail-block is-${density} effect-${model.categoryKey}`} data-school={model.school} style={style}>
    <div className="spell-effect-detail-heading"><span className="spell-effect-detail-category">{model.category}</span><strong>{model.title}</strong><p>{model.description}</p></div>
    <div className="spell-effect-detail-grid">{rows.map((row, index) => <EffectDetailRow row={row} key={`${row.label}-${index}`} />)}</div>
  </section>
}

function EffectDetailRow({ row }: { row: SpellEffectTooltipRow }) {
  return <div className="spell-effect-detail-row"><span>{row.label}</span><b className={row.semantic ? semanticClass(row.semantic) : undefined}>{row.value}</b></div>
}

function semanticClass(semantic: SpellEffectTooltipSemantic) {
  if (semantic === 'mana') return 'ui-mana'
  if (semantic === 'time') return 'ui-time'
  if (semantic === 'focus') return 'ui-focus'
  if (semantic === 'school') return 'effect-school-value'
  if (semantic === 'positive') return 'effect-positive'
  if (semantic === 'negative') return 'effect-negative'
  return ''
}
