import { Droplets, Flame, Mountain, Sparkles, Wind } from 'lucide-react'
import type { CSSProperties } from 'react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { MonsterDefinition } from '../../game/content/monsters'
import type { ResonanceType } from '../../game/content/resonance/resonance'
import { getBestiaryResonancePresentation } from '../../game/presentation/bestiary/bestiaryPresentation'
import { formatResonanceAmount } from '../../game/presentation/resonance/resonancePresentation'

const ICONS: Record<ResonanceType, typeof Flame> = { fire: Flame, water: Droplets, earth: Mountain, air: Wind, arcane: Sparkles }

export function BestiaryResonanceYield({ monster }: { monster: MonsterDefinition }) {
  const presentation = getBestiaryResonancePresentation(monster)
  const multiplierDescription = `Encounter Power ${presentation.effectivePower.toLocaleString()} resolves to Loot Tier ${presentation.lootTier}; tier quantity Ã—${presentation.lootQuantityMultiplier}${presentation.bossQuantityMultiplier > 1 ? ` Â· boss quantity Ã—${presentation.bossQuantityMultiplier}` : ''}.`
  return <section className="bestiary-section bestiary-resonance-section" aria-labelledby="bestiary-resonance-heading"><div className="bestiary-resonance-heading"><span id="bestiary-resonance-heading" className="bestiary-section-label">RESONANCE YIELD</span></div>{presentation.entries.length === 0 ? <p className="bestiary-muted">No Resonance reward.</p> : <div className="bestiary-resonance-list">{presentation.entries.map((entry) => { const Icon = ICONS[entry.type]; const color = entry.type === 'arcane' ? 'var(--semantic-damage-arcane)' : SCHOOLS[entry.type].color; return <GameTooltip key={entry.type} block accent="elemental" content={<TooltipContent title={entry.label} description={`Granted automatically when this enemy is defeated. Base Yield: ${formatResonanceAmount(entry.baseAmount)} Â· ${multiplierDescription} Â· Current Reward: +${formatResonanceAmount(entry.finalAmount)}.`} />}><div className="bestiary-resonance-row" tabIndex={0} style={{ '--resonance-color': color } as CSSProperties} aria-label={`${entry.label} +${formatResonanceAmount(entry.finalAmount)} per defeat`}><span className="bestiary-resonance-icon"><Icon size={14} aria-hidden="true" /></span><span className="bestiary-resonance-copy"><strong>{entry.label}</strong><small>+{formatResonanceAmount(entry.finalAmount)} per defeat Â· Base {formatResonanceAmount(entry.baseAmount)}</small></span><strong className="bestiary-resonance-value">+{formatResonanceAmount(entry.finalAmount)}</strong></div></GameTooltip> })}</div>}</section>
}
