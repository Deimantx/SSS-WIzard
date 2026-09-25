import { Droplets, Flame, Mountain, Wind } from 'lucide-react'
import type { CSSProperties } from 'react'
import { GameTooltip } from '../../components/ui'
import { TooltipContent } from '../../components/ui/tooltip/Tooltip'
import { SCHOOLS } from '../../game/content/schools/schools'
import type { MonsterDefinition } from '../../game/content/monsters'
import type { ResonanceType } from '../../game/content/resonance/resonance'
import { getBestiaryResonancePresentation } from '../../game/presentation/bestiary/bestiaryPresentation'
import { formatResonanceAmount } from '../../game/presentation/resonance/resonancePresentation'
import type { WorldTierId } from '../../game/types'

const ICONS: Record<ResonanceType, typeof Flame> = { fire: Flame, water: Droplets, earth: Mountain, air: Wind }

export function BestiaryResonanceYield({ monster, worldTier }: { monster: MonsterDefinition; worldTier: WorldTierId }) {
  const presentation = getBestiaryResonancePresentation(monster, worldTier)
  const multiplierDescription = `World Tier Multiplier: ×${presentation.worldTierRewardMultiplier} · Global Reward Rate: ×${presentation.globalRewardMultiplier}`
  return <section className="bestiary-section bestiary-resonance-section" aria-labelledby="bestiary-resonance-heading"><div className="bestiary-resonance-heading"><span id="bestiary-resonance-heading" className="bestiary-section-label">RESONANCE YIELD</span><span className="bestiary-resonance-tier">WT{presentation.worldTier}</span></div>{presentation.entries.length === 0 ? <p className="bestiary-muted">No Resonance reward.</p> : <div className="bestiary-resonance-list">{presentation.entries.map((entry) => { const Icon = ICONS[entry.type]; const color = SCHOOLS[entry.type].color; return <GameTooltip key={entry.type} block accent="elemental" content={<TooltipContent title={entry.label} description={`Granted automatically when this enemy is defeated. Current World Tier: WT${presentation.worldTier} · Base Yield: ${formatResonanceAmount(entry.baseAmount)} · ${multiplierDescription} · Current Reward: +${formatResonanceAmount(entry.finalAmount)}.`} />}><div className="bestiary-resonance-row" tabIndex={0} style={{ '--resonance-color': color } as CSSProperties} aria-label={`${entry.label} +${formatResonanceAmount(entry.finalAmount)} per defeat`}><span className="bestiary-resonance-icon"><Icon size={14} aria-hidden="true" /></span><span className="bestiary-resonance-copy"><strong>{entry.label}</strong><small>+{formatResonanceAmount(entry.finalAmount)} per defeat · Base {formatResonanceAmount(entry.baseAmount)}</small></span><strong className="bestiary-resonance-value">+{formatResonanceAmount(entry.finalAmount)}</strong></div></GameTooltip> })}</div>}</section>
}
