import { SCHOOLS } from '../../game/content/schools/schools'
import type { SpellEffectTooltipModel, SpellEffectTooltipRow, SpellEffectTooltipSemantic } from '../../game/presentation/spells/spellEffectTooltipModel'
import { getInspectorInlineEffectRows, getSpellbookTooltipRows, getFullSpellTooltipRows } from '../../game/presentation/spells/spellDetailPresentation'

export type SpellEffectDetailDensity = 'inline' | 'tooltip' | 'card'
export type SpellEffectDetailMode = 'compact' | 'advanced' | 'inline'

export function SpellEffectDetailBlock({ model, density, showSource = false, detailMode }: { model: SpellEffectTooltipModel; density: SpellEffectDetailDensity; showSource?: boolean; detailMode?: SpellEffectDetailMode }) {
  const mode = detailMode ?? (density === 'inline' ? 'inline' : 'compact')
  const rows = mode === 'inline' ? getInspectorInlineEffectRows(model) : mode === 'advanced' ? getFullSpellTooltipRows(model) : getSpellbookTooltipRows(model)
  const visibleRows = showSource || mode === 'inline' ? rows : rows.filter((row) => row.label !== 'Source')
  const style = model.categoryKey === 'damage' ? { '--effect-accent': SCHOOLS[model.school].color } as React.CSSProperties : undefined
  return <section className={`spell-effect-detail-block is-${density} effect-${model.categoryKey}`} data-school={model.school} data-detail-mode={mode} style={style}><div className="spell-effect-detail-heading"><span className="spell-effect-detail-category">{model.category}</span><strong>{model.title}</strong><p>{model.description}</p></div><div className="spell-effect-detail-grid">{visibleRows.map((row, index) => <EffectDetailRow row={row} key={`${row.label}-${index}`} />)}</div></section>
}

export function SpellTooltipDetailHint() {
  return <div className="spell-tooltip-detail-hint"><kbd>Alt</kbd><span>Hold Alt for more details</span></div>
}

function EffectDetailRow({ row }: { row: SpellEffectTooltipRow }) { return <div className="spell-effect-detail-row"><span>{row.label}</span><b className={row.semantic ? semanticClass(row.semantic) : undefined}>{row.value}</b></div> }
function semanticClass(semantic: SpellEffectTooltipSemantic) { if (semantic === 'mana') return 'ui-mana'; if (semantic === 'time') return 'ui-time'; if (semantic === 'focus') return 'ui-focus'; if (semantic === 'school') return 'effect-school-value'; if (semantic === 'positive') return 'effect-positive'; if (semantic === 'negative') return 'effect-negative'; return '' }
